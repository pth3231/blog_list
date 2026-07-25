# Monitoring (Phase 1 — exporters only, no app code)

A standard **Prometheus + Grafana** stack that monitors the blog-list app's
**latency (p50/p95/p99/max), availability, container CPU/mem, and host CPU/mem**
with **zero changes to the app source.** The stack observes the already-running
`blog-list-app` container over the shared `blog-list` Docker network.

App-level instrumentation (`prom-client`, real per-request latency histograms +
a `/metrics` endpoint) is **Phase 2** — not included here.

## What's in it

| Service | Image | Measures |
|---------|-------|----------|
| `prometheus` | `prom/prometheus:v3.13.1` | Scrapes + stores all metrics (15d retention) |
| `grafana` | `grafana/grafana:13.1.1` | Dashboard UI at `http://localhost:3001` |
| `blackbox-exporter` | `prom/blackbox-exporter:v0.28.0` | HTTP probes → **availability** + **latency** |
| `cadvisor` | `gcr.io/cadvisor/cadvisor:v0.60.5` | Per-container **CPU/mem** for `blog-list-app` |
| `node-exporter` | `prom/node-exporter:v1.12.1` | Host **CPU/mem** |

It probes `http://blog-list-app:3000/health/ready` (availability + readiness
latency) and `http://blog-list-app:3000/v1/posts` (real read-API latency; that
route is anonymous-accessible via `optionalAuth`).

## Prerequisites

- Docker Engine + Docker Compose v2.
- The `blog-list` Docker network must already exist — **the app stack creates
  it.** Start the app stack first.

## Run (dev)

```bash
# 1. Start the app (creates the `blog-list` network + `blog-list-app` container):
docker compose -f compose.dev.yaml up -d --build

# 2. Start the monitoring stack (attaches to `blog-list` as an external network):
docker compose -f monitoring/compose.yaml up -d

# 3. Open Grafana:  http://localhost:3001   (admin / admin)
```

The "Blog List — Overview" dashboard and the Prometheus datasource
auto-provision on first boot — no UI clicks needed.

## Run (prod)

Same as dev, but step 1 uses `compose.prod.yaml`. `compose.prod.yaml` includes a
`networks: default: name: blog-list` block so the same monitoring file works in
both environments.

> **One-time operational impact:** the first `docker compose -f
> compose.prod.yaml up -d` after the network rename **recreates** the prod
> containers (`app`, `mongo`, `tunnel`) as they reattach from the old
> auto-named network (`blog_list_default`) to `blog-list` — expect a few seconds
> of downtime. After that, monitoring attaches in prod exactly like dev.

## Verify the metrics are flowing

Prometheus is **not** published by default (to keep the exposed surface small).
To verify targets on first bring-up, temporarily publish it, then remove the
override:

```bash
# Temporarily expose Prometheus on localhost (debug only):
docker compose -f monitoring/compose.yaml run --rm -p 127.0.0.1:9090:9090 \
    --service-ports prometheus   # OR add  ports: ['127.0.0.1:9090:9090']  to the prometheus service and `up -d`
```

Then check `http://localhost:9090/targets`:

- `prometheus`, `cadvisor`, `node-exporter`, `blackbox` must all be **UP**.
- The two `blackbox` targets (`…/health/ready`, `…/v1/posts`) must show
  `health=UP` with `lastError=""`. A "connection refused" means `blog-list-app`
  isn't resolving or the app isn't ready.

Expression-browser sanity checks:

| Query | Expected |
|-------|----------|
| `probe_success` | 2 series, value `1` |
| `probe_duration_seconds` | 2 series, sub-second |
| `container_memory_working_set_bytes{name="blog-list-app"}` | 1 series, real byte count |
| `rate(node_cpu_seconds_total{mode="idle"}[5m])` | N series (one per CPU) |

> **Empty Grafana panel?** The cause is almost always a wrong label. Query
> `{__name__=~"container_cpu.*"}` to see the exact labels cAdvisor emits on this
> host and adjust the filter (in Docker mode cAdvisor uses the **`name`** label
> for the container name, not `container`).

## Negative test (does availability actually flip?)

```bash
docker compose -f compose.dev.yaml stop app     # within ~30s: availability -> 0
docker compose -f compose.dev.yaml start app    # within ~30s: availability -> 1
```

When the app is down, `probe_http_status_code` goes empty (no HTTP response)
and `probe_duration_seconds` typically **drops** (refused connections fail
fast) rather than spikes. **Availability, not latency, is the outage signal.**

## Load testing (k6) — drive real traffic at the app

`monitoring/k6/loadtest.js` ramps 0 → 100 VUs over ~2 min against the app's
public read surface, so the Grafana panels get real data. The `k6` service is
behind a `load` profile (never auto-starts); run it on demand **while the app is
up** (from repo root):

```bash
docker compose -f monitoring/compose.yaml --profile load run --rm k6                # ~2 min ramp
docker compose -f monitoring/compose.yaml --profile load run --rm -e SMOKE=true k6  # 10s check
```

Full instructions — plain `docker run`, scaling, reading the output, and
troubleshooting — are in [`k6/README.md`](./k6/README.md).

## Security caveats

- Grafana is bound to **`127.0.0.1:3001`** — it is **not** routed through the
  Cloudflare tunnel. Do not change this without also putting Grafana behind
  real auth.
- `admin` / `admin` default creds are acceptable **only** because the port is
  localhost-bound. Change them before any non-local exposure.
- Prometheus, cAdvisor, node-exporter, and blackbox-exporter are not published;
  they are reachable only on the `blog-list` Docker network.
- Phase 1 has no `/metrics` endpoint, so nothing app-internal is exposed.

## Persistence

Prometheus (`prometheus-data`) and Grafana (`grafana-data`) use named volumes,
so dashboards, history, and Grafana credentials survive `down` / `up`.
