// Container readiness probe — invoked by `docker HEALTHCHECK`.
// Exits 0 only when /health/ready returns 200, i.e. the API is up AND the
// MongoDB connection pool is connected. Exits 1 otherwise (any non-200 or a
// fetch failure), so Docker can mark the container unhealthy and restart it.
const port = process.env.PORT || '3000'

try {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`)
    process.exit(res.status === 200 ? 0 : 1)
} catch {
    process.exit(1)
}
