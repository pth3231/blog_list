import express, { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import postRouter from '@/routes/post.route'
import healthRouter from '@/routes/health.route'
import authRouter from '@/routes/auth.route'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(healthRouter)
app.use('/v1/auth', authRouter)
app.use('/v1/posts', postRouter)

app.get('/v1', (_, res) => {
    res.send('This is api v1 entry')
})

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
})

export default app