import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { loginUser, registerUser, getUserById } from '@/controllers/auth.controller'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'
import { clearAuthCookie, setAuthCookie } from '@/utils/auth'
import { parseCredentials } from '@/utils/validate'
import { sendError } from '@/utils/http_response'

const authRouter: Router = Router()

// Hard limit the credential endpoints to blunt brute-force / signup abuse.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts, please try again later.' }
})

authRouter.post('/register', authLimiter, async (req, res) => {
    const credentials = parseCredentials(req.body)
    if (credentials === null) {
        sendError(res, 400, 'Username (min 3 chars) and password (min 6 chars) are required')
        return
    }
    const result = await registerUser(credentials.username, credentials.password)
    if (!result.ok) {
        sendError(res, result.status, result.message)
        return
    }
    setAuthCookie(res, result.value.token)
    res.status(201).json({ user: result.value.user })
})

authRouter.post('/login', authLimiter, async (req, res) => {
    const credentials = parseCredentials(req.body)
    if (credentials === null) {
        sendError(res, 400, 'Username and password are required')
        return
    }
    const result = await loginUser(credentials.username, credentials.password)
    if (!result.ok) {
        sendError(res, result.status, result.message)
        return
    }
    setAuthCookie(res, result.value.token)
    res.status(200).json({ user: result.value.user })
})

authRouter.post('/logout', (_req, res) => {
    clearAuthCookie(res)
    res.status(204).end()
})

authRouter.get('/me', authenticateToken, async (req: IAuthedRequest, res) => {
    const userId = req.user?.sub
    if (userId === undefined) {
        sendError(res, 401, 'Unauthorized')
        return
    }
    const result = await getUserById(userId)
    if (!result.ok) {
        sendError(res, result.status, result.message)
        return
    }
    res.json(result.value)
})

export default authRouter
