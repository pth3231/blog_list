# Public HTTPS with Cloudflare Tunnel

Serve the app over HTTPS **without opening any inbound port** on your server. A
Cloudflare Tunnel makes an *outbound* connection from your server to Cloudflare;
visitors hit Cloudflare's edge (HTTPS, automatic certificate) and are tunneled to
your app. Your server's IP stays hidden and nothing in your firewall has to
change.

This guide assumes the app already runs via `compose.prod.yaml`, where the `app`
service listens on internal port `3000` and a `tunnel` service (Cloudflare
`cloudflared`) is defined.

## How it fits

```
Browser ──HTTPS──► Cloudflare edge ──tunnel (outbound)──► cloudflared ──HTTP──► app:3000
```

- **Edge certificate** — Cloudflare issues this automatically (free). It is the
  only certificate visitors ever see, and you do not create or manage it.
- **Origin certificate / Let's Encrypt** — **not needed.** The tunnel connection
  is already encrypted, and your app stays on plain HTTP internally.
- **Client certificate / mTLS** — **not needed** for a public site.

## Prerequisites

1. **A domain on Cloudflare.** Add the site in Cloudflare, then change the
   domain's **nameservers** at your registrar to the two Cloudflare assigns
   (e.g. `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`). Cloudflare must be
   the **authoritative DNS** — otherwise the records the tunnel creates have no
   effect. Wait until the zone shows **Active**.
2. **The app running:** `docker compose -f compose.prod.yaml up -d --build`.

## Step 1 — Create the tunnel and copy its token

1. Dashboard → **Zero Trust** (first visit: choose a team name and the Free plan).
2. **Networks → Tunnels → Create a tunnel** → type **Cloudflared** → name it.
3. Copy the **token** from the install command (the long string after
   `--token`).

## Step 2 — Put the token in `.env.prod`

```
TUNNEL_TOKEN=<paste-the-token-from-step-1>
```

The `tunnel` service in `compose.prod.yaml` reads this and connects to Cloudflare
on startup:

```yaml
  tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    env_file:
      - .env.prod
    depends_on:
      - app
```

Start it and confirm the connection:

```bash
docker compose -f compose.prod.yaml up -d
docker compose -f compose.prod.yaml logs -f tunnel
# look for "Registered tunnel connection" (×4)
```

## Step 3 — Route your domain to the tunnel

In **Zero Trust → Networks → Tunnels → your tunnel → Public Hostname → Add a
public hostname**:

| Subdomain | Domain | Service | URL |
|---|---|---|---|
| *(blank)* | `yourdomain.com` | HTTP | `app:3000` |
| `www` | `yourdomain.com` | HTTP | `app:3000` |

Cloudflare auto-creates proxied CNAME records pointing at
`<tunnel-id>.cfargotunnel.com`. The root domain uses CNAME flattening, so it can
coexist with email MX records on the same name.

> **Delete conflicting A records first.** If you previously had `A` records for
> `@` or `www` pointing at a server IP, remove them in **DNS → Records**. A name
> cannot hold both an `A` and a `CNAME`, and a leftover `A` record leaks your
> server's IP and makes visitors see the wrong page.

## Step 4 — Wait for the edge certificate, then verify

The Universal SSL edge certificate issues automatically once the zone is Active —
usually within minutes, rarely up to 24h. Until it is ready, HTTPS handshakes
fail with `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`. Track it under
**SSL/TLS → Edge Certificates** (wait for **Active**); optionally enable
**Always Use HTTPS** there.

Once Active, verify:

```bash
dig +short yourdomain.com          # a Cloudflare IP (104.x / 172.6x), not your server's
curl -I https://yourdomain.com      # expect HTTP/2 200,  server: cloudflare
```

Then open `https://yourdomain.com`, log in, and reload. The auth cookie is set
with the `Secure` flag, which a browser only stores over HTTPS — so login works
once the site is on HTTPS.

## Notes & troubleshooting

- **No ports to open.** The tunnel is outbound-only; keep your firewall closed.
- **Email on the same domain** (MX records to a mail provider) keeps working —
  the flattened root CNAME and the MX records coexist.
- **`ERR_SSL_VERSION_OR_CIPHER_MISMATCH` on HTTPS** — the edge certificate is
  still issuing (Step 4). It is *not* a problem with your app, and you need no
  origin/client certificate.
- **Visitors still see an old/default page** — DNS hasn't propagated or an old
  `A` record is still in place. Check `dig NS yourdomain.com` returns Cloudflare
  nameservers, and that no `A` record competes with the tunnel CNAME.
- **Cloudflare Web Analytics** injects a beacon at the edge; the app's CSP in
  `backend/app.ts` already allows it. Disable Web Analytics in the dashboard and
  remove those two CSP entries if you don't use it.
- **Don't expose the app port directly.** With the tunnel, the `app` service
  needs no published host port for public traffic; bind it to localhost only if
  you want direct access for debugging.
