import express, { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import path from 'node:path'
import fs from 'node:fs'
import postRouter from '@/routes/post.route'
import healthRouter from '@/routes/health.route'
import authRouter from '@/routes/auth.route'
import commentRouter from '@/routes/comment.route'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(healthRouter)
app.use('/v1/auth', authRouter)
app.use('/v1/posts', postRouter)
app.use('/v1/posts', commentRouter)

app.get('/v1', (_, res) => {
    res.send('This is api v1 entry')
})

// In production the backend also serves the built SPA, so the whole app runs on a
// single origin (the frontend's API base is the relative `/v1`). In development the
// Vite dev server serves the UI and proxies `/v1` to this API instead.
if (process.env['NODE_ENV'] === 'production') {
    const frontendDist = path.resolve(__dirname, '../../frontend/dist')
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

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
})

export default app