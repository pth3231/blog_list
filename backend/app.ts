import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import fs from 'node:fs'
import postRouter from '@/routes/post.route'
import healthRouter from '@/routes/health.route'
import authRouter from '@/routes/auth.route'
import commentRouter from '@/routes/comment.route'
import { ConsoleLogger } from '@/utils/logger'

const app = express()
const logger = new ConsoleLogger()
const isProduction = process.env['NODE_ENV'] === 'production'

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // Allow the Cloudflare Web Analytics beacon (injected at the edge):
            // the script host and the host it POSTs RUM data to. Drop both if
            // you disable Web Analytics. The theme script is external
            // (/theme-init.js, covered by 'self'), so no inline-script hash.
            'script-src': ["'self'", 'https://static.cloudflareinsights.com'],
            'connect-src': ["'self'", 'https://cloudflareinsights.com']
        }
    }
}))
// Behind a proxy/load-balancer in prod — required for accurate client IPs used
// by express-rate-limit.
app.set('trust proxy', 1)
app.use(morgan(isProduction ? 'combined' : 'dev'))
app.use(express.json({ limit: '100kb' }))
app.use(healthRouter)
app.use('/v1/auth', authRouter)
app.use('/v1/posts', postRouter)
app.use('/v1/posts', commentRouter)

app.get('/v1', (_, res) => {
    res.send('This is api v1 entry')
})

// In production the backend also serves the built SPA, so the whole app runs
// on a single origin (the frontend's API base is the relative `/v1`). In
// development the Vite dev server serves the UI and proxies `/v1` here.
if (isProduction) {
    const frontendDist = process.env['FRONTEND_DIST']
        ? path.resolve(process.env['FRONTEND_DIST'])
        : path.resolve(__dirname, '../../frontend/dist')
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist))
        app.use((req, res, next) => {
            if (req.method !== 'GET') return next()
            if (req.path.startsWith('/v1') || req.path.startsWith('/health')) return next()
            if (path.extname(req.path) !== '') return next()
            res.sendFile(path.join(frontendDist, 'index.html'))
        })
    }
}

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' })
})

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // Express throws a PayloadTooLargeError (413) when the JSON body exceeds the
    // limit configured above — preserve that status instead of masking as 500.
    const status = err instanceof Error && err.name === 'PayloadTooLargeError' ? 413 : 500
    logger.error('Unhandled error on', req.method, req.path, err)
    res.status(status).json({ error: status === 413 ? 'Request body too large' : 'Internal server error' })
})

export default app
