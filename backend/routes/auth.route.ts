import { Router } from 'express'
import { registerUser, loginUser, getUserById } from '@/controllers/auth.controller'
import { IAuthedRequest, authenticateToken } from '@/middlewares/auth.middleware'

const authRouter: Router = Router()

authRouter.post('/register', async (req, res) => {
    const { username, password } = req.body as { username?: unknown, password?: unknown }
    if (
        typeof username !== 'string' || !username.trim() ||
        typeof password !== 'string' || password.length < 6
    ) {
        res.status(400).json({ error: 'Username and password (min 6 characters) are required' })
        return
    }

    const result = await registerUser(username.trim(), password)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(201).json(result.value)
})

authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body as { username?: unknown, password?: unknown }
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
        res.status(400).json({ error: 'Username and password are required' })
        return
    }

    const result = await loginUser(username.trim(), password)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

authRouter.get('/me', authenticateToken, async (req: IAuthedRequest, res) => {
    const userId = req.user?.sub
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const result = await getUserById(userId)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

export default authRouter
