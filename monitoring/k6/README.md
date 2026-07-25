# k6 load testing

`loadtest.js` generates HTTP load against the blog-list app so the Grafana
latency/CPU/mem panels have real data to plot, and prints k6's own pass/fail
summary at the end.

## Prerequisites

- **The app must be running on the `blog-list` Docker network** — k6 reaches it
  as `blog-list-app:3000`. Start it first:
  ```bash
  docker compose -f compose.dev.yaml up -d     # or compose.prod.yaml
  ```
- Run every command below from the **repo root** (the paths assume it).

## How to run

### Method 1 — docker compose (recommended)

The `k6` service is behind a `load` profile so it never auto-starts with the
rest of the monitoring stack. Run it on demand:

```bash
docker compose -f monitoring/compose.yaml --profile load run --rm k6
```

Default = ~2 min ramping load (0 → 100 VUs). Quick **10s smoke check**
(no ramp, no pass/fail gates):

```bash
docker compose -f monitoring/compose.yaml --profile load run --rm -e SMOKE=true k6
```

### Method 2 — plain `docker run` (no compose)

Identical effect, without docker compose — useful when the app is running but
not via this compose file:

```bash
docker run --rm --network blog-list \
  -v "$PWD/monitoring/k6:/scripts:ro" \
  -e APP_BASE_URL=http://blog-list-app:3000 \
  grafana/k6:2.1.0 run /scripts/loadtest.js
```

Add `-e SMOKE=true` (before `grafana/k6`) for the 10s smoke check.

## What it does

Simulates concurrent users browsing the **public read surface**:
`GET /v1/posts` → `GET /v1/posts/:id` → `GET /v1/posts/:id/comments`, with a
random 0.5–2.0s think time between actions. **Read-only** — writes (create /
like / comment) need auth and are not covered.

- **Empty DB → list-only.** If no posts exist it still runs (hammers
  `GET /v1/posts`) but skips detail/comments. Create at least one post to
  exercise the full browse path.
- **Target** = `APP_BASE_URL`, default `http://blog-list-app:3000`.

## Seed mock data (optional)

When the DB is empty the load test only hits `GET /v1/posts` (it skips detail and
comments). `seed-mock-data.js` fills the `blog_list` DB with mock posts +
comments so the full browse path is exercised. It touches **only** `posts` and
`comments` — the `users` collection is left intact, and existing posts/comments
are replaced each run.

```bash
docker exec -i blog-list-mongo mongosh --quiet blog_list \
    < monitoring/k6/seed-mock-data.js
```

Defaults to 200 posts (1-3 comments each). Override the count:

```bash
docker exec -i -e POST_COUNT=500 blog-list-mongo \
    mongosh --quiet blog_list < monitoring/k6/seed-mock-data.js
```

(The `blog_list>` lines mongosh echoes are just its stdin prompt — harmless.)

## Scaling / customizing

Edit `options.stages` in `loadtest.js` to change the ramp. For a flat run at a
fixed VU count / duration you must first **remove the `stages` block** (k6 won't
allow `--vus`/`--duration` alongside stages), then:

```bash
docker compose -f monitoring/compose.yaml --profile load run --rm k6 \
    run -u 200 -d 2m /scripts/loadtest.js      # 200 VUs for 2 minutes
```

## Reading the output

k6 prints a summary at the end. The lines that matter:

| Metric | Meaning |
|--------|---------|
| `http_req_failed` | error rate (full-mode gate: < 5%) |
| `http_req_duration ... p(95)=` | tail latency (full-mode gate: < 1s) |
| `http_reqs` / `iterations` | throughput |
| `vus` / `vus_max` | concurrent users reached |

A **non-zero exit code** means a threshold was breached — the app degraded under
load.

## Troubleshooting

- **`No such service: k6`** — you used `docker compose ... up` without
  `--profile load`. Use the `run --rm k6` form above (it auto-enables the
  profile for the named service).
- **`dial tcp ...:3000: connect: connection refused`** / all checks fail — the
  app isn't running or isn't on the `blog-list` network. Start it
  (`docker compose -f compose.dev.yaml up -d`) and confirm
  `docker ps | grep blog-list-app`.
- **`network blog-list not found`** (plain `docker run`) — that network is
  created by the app stack; start the app first.
- **Script edits not applied** — `loadtest.js` is bind-mounted, so changes take
  effect on the next run with no rebuild.
- **Never point this at the public (Cloudflare) origin** — run it against your
  dev/staging app over the Docker network, as shown above.
