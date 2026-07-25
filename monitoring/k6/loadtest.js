// k6 load test for the blog-list app.
//
// Simulates many concurrent users browsing the public read surface (list ->
// detail -> comments). Anonymous only — writes (create/like/comment) need auth
// and are intentionally out of scope for this read-traffic generator.
//
// Run (from repo root):
//   docker compose -f monitoring/compose.yaml --profile load run --rm k6
//
// Target is the app over the shared `blog-list` Docker network. Override the
// base URL or scale the load by editing options.stages below, or fully replace
// the command, e.g. a flat 1m run at 200 VUs:
//   docker compose -f monitoring/compose.yaml --profile load run --rm k6 \
//       run -u 200 -d 1m /scripts/loadtest.js   # NOTE: -u/-d only work if you
//                                               # first remove `stages` below.

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Trailing slash trimmed so `${BASE}/v1/posts` never doubles it.
const BASE = (__ENV.APP_BASE_URL || 'http://blog-list-app:3000').replace(/\/$/, '')

// Custom metric: share of read requests that failed their status check.
const readErrors = new Rate('read_errors')

// SMOKE=true -> 10s flat check for quick verification (no ramp, no gates).
// Default -> the full ~2 min ramping load test. Pass via -e SMOKE=true.
const smoke = __ENV.SMOKE === 'true'

export const options = smoke
    ? { vus: 5, duration: '10s' }
    : {
          // "High load" ramping profile (~2 min, peaks at 100 VUs). Raise the
          // targets to push harder (e.g. 200, 500) or add a plateau to hold a
          // sustained rate.
          stages: [
              { duration: '30s', target: 100 }, // warm up to 100 virtual users
              { duration: '30s', target: 3000 }, // ramp to 2000 (stress)
              { duration: '90s', target: 1500 }, // sustain 1000
              { duration: '20s', target: 0 } // ramp down
          ],
          thresholds: {
              // Informational gates — k6 exits non-zero if breached, signalling
              // the app degraded under load. Loosen/tighten to your baseline.
              http_req_failed: ['rate<0.05'], // < 5% failed requests
              http_req_duration: ['p(95)<1000'] // p95 latency < 1s
          }
      }

export default function () {
    // 1. List posts (the hottest public read; paginated server-side).
    const listRes = http.get(`${BASE}/v1/posts`, { tags: { endpoint: 'list_posts' } })
    const listOk = check(listRes, { 'GET /v1/posts -> 200': (r) => r.status === 200 })
    readErrors.add(!listOk)

    // 2. If any posts exist, read one's detail + comments (a real browse path).
    //    GET /v1/posts returns a bare JSON array; the id field may be `id` or
    //    `_id` depending on the view mapping.
    if (listOk) {
        const arr = listRes.json()
        const post = Array.isArray(arr) && arr.length > 0 ? arr[0] : null
        const postId = post ? (post.id ?? post._id) : null

        if (postId) {
            group('post detail', () => {
                const r = http.get(`${BASE}/v1/posts/${postId}`, { tags: { endpoint: 'post_detail' } })
                readErrors.add(!check(r, { 'GET /v1/posts/:id -> 200': (x) => x.status === 200 }))
            })
            group('post comments', () => {
                const r = http.get(`${BASE}/v1/posts/${postId}/comments`, { tags: { endpoint: 'post_comments' } })
                readErrors.add(!check(r, { 'GET /v1/posts/:id/comments -> 200': (x) => x.status === 200 }))
            })
        }
    }

    // Think time — a real user pauses between actions. Keeps the load realistic
    // rather than a tight request loop; set to 0 for a pure-throughput stress.
    sleep(Math.random() * 1.5 + 0.5) // 0.5-2.0s
}
