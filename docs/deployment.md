# Deployment: register your server as a GitHub deployment target

This guide makes **your own server** run the `Deploy` workflow from
`.github/workflows/deploy.yml`. Once registered, every push to `main` is
automatically pulled and redeployed on the server — no inbound port to open,
GitHub just queues the job and your server picks it up.

> Self-hosted runners execute workflow code on your machine. Only use this on a
> repo you trust (your own). Don't enable it for public repos or untrusted PRs.

---

## Prerequisites

On the server (once):

1. **Docker + the Compose plugin** installed (`docker compose version` works).
2. **git**, **curl**, **tar** (present on any normal Linux install).
3. **The repo cloned to a fixed path**, with secrets in place:
   ```bash
   sudo mkdir -p /opt && sudo chown "$USER" /opt
   git clone https://github.com/<you>/blog_list.git /opt/blog_list
   cd /opt/blog_list
   cp .env.prod.example .env.prod
   nano .env.prod        # set JWT_SECRET to:  openssl rand -hex 32
   ```
   This `/opt/blog_list` path must match `DEPLOY_DIR` in `deploy.yml`.

> The clone stays on the server permanently. `.env.prod` is gitignored, so the
> later `git pull`/`git reset` in the workflow never overwrites it.

---

## Step 1 — Get the registration commands from GitHub

These commands contain a **short-lived token** (expires in ~1 hour), so copy
them fresh from the UI when you do this:

1. Open your repo → **Settings → Actions → Runners → New self-hosted runner**.
2. Pick **Linux**, and the architecture matching your CPU:
   - run `uname -m` on the server → `x86_64` = **x64**, `aarch64` = **arm64**.
3. GitHub shows a block of commands tailored to that choice (download URL +
   `./config.sh --url … --token …`). You'll paste them in Step 2.

---

## Step 2 — Download and configure the runner (on the server)

In a directory you own (e.g. your home dir), paste the commands GitHub gave you.
They look like this (use the real version + token from the UI, not these):

```bash
mkdir actions-runner && cd actions-runner

# download (x64 example — arm64 uses a different URL from the UI)
curl -o actions-runner-linux-x64-<VERSION>.tar.gz -L \
  https://github.com/actions/runner/releases/download/v<VERSION>/actions-runner-linux-x64-<VERSION>.tar.gz

tar xzf ./actions-runner-linux-x64-<VERSION>.tar.gz

# register this machine to your repo
./config.sh --url https://github.com/<you>/blog_list --token <TOKEN>
```

`config.sh` asks a few questions — the defaults are fine:
- **Runner group:** default.
- **Runner name:** anything (e.g. `prod-1`).
- **Labels:** keep the default `self-hosted` — this is what `runs-on: self-hosted`
  in `deploy.yml` matches.
- **Work folder:** default (`_work`).

At this point the runner is registered and can take jobs, but only while this
terminal is open. Make it permanent next.

---

## Step 3 — Install it as a service (survives reboots)

From inside the `actions-runner` folder:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

This creates a systemd service that starts the runner on boot and keeps it
running in the background. Useful commands:

```bash
sudo ./svc.sh status       # is it running?
sudo ./svc.sh stop         # stop it
sudo ./svc.sh uninstall    # remove the service (keeps the config)
journalctl -u actions.<USER>.actions-runner.service -f   # tail runner logs
```

> The service runs as **the user who installed it**. If that's not your main
> user, substitute it below.

---

## Step 4 — Let the runner run Docker

The deploy step runs `docker compose …`, so the runner's user needs Docker
permission. Add it to the `docker` group, then restart the service so the change
takes effect:

```bash
sudo usermod -aG docker "$USER"
sudo ./svc.sh stop && sudo ./svc.sh start
```

Verify the runner can use Docker (as that user):

```bash
docker ps        # should list containers, not "permission denied"
```

---

## Step 5 — Verify on GitHub

Back in **Settings → Actions → Runners**, your runner should show a **green dot
with status "Idle"**. It's now a deployment target.

---

## How a deploy then happens

1. You `git push` to `main`.
2. GitHub triggers the **Deploy** workflow; the job is tagged `runs-on: self-hosted`.
3. Your runner picks it up and runs the steps in `deploy.yml`:
   `git reset --hard origin/main` → `docker compose up -d --build` → health check.
4. Watch it live in the repo's **Actions** tab; check the result on the server
   with `curl http://localhost:3000/health/ready`.

You can also run it on demand: **Actions → Deploy → Run workflow**.

---

## Notes & troubleshooting

- **Token expired?** The `--token` from Step 1 is single-use and short-lived. If
  `config.sh` fails with an auth error, regenerate it from the GitHub UI.
- **Job stuck "queued", never runs:** the runner is offline. Check
  `sudo ./svc.sh status` and `journalctl -u actions.*.service`.
- **"permission denied while trying to connect to the Docker daemon":** Step 4
  wasn't applied to the user the service runs as, or the service wasn't restarted.
- **Runner updates itself** automatically; no manual upgrade needed in normal use.
- **More than one server?** Register a runner on each; `runs-on: self-hosted` will
  pick any free one. (For targeted deploys, give each a unique label and set
  `runs-on: [self-hosted, prod-1]`.)
- **Removing a runner:** on the server `./config.sh remove`, then in the GitHub UI
  delete its entry.
