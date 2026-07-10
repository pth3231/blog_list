import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'

const healthRouter: Router = Router()

healthRouter.get('/health', (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected'

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus
    })
})

healthRouter.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).send('OK')
})

healthRouter.get('/health/ready', async (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState
    if (dbState === 1) {
        res.json({ status: 'ready', database: 'connected' })
    } else {
        res.status(503).json({ status: 'not ready', database: 'disconnected' })
    }
})

export default healthRouter