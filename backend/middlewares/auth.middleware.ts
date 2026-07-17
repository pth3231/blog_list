import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import Config from '@/utils/config'
import { IAuthTokenPayload } from '@/types/auth.type'

export interface IAuthedRequest extends Request {
    user?: IAuthTokenPayload
}

const config = new Config()

export function authenticateToken(req: IAuthedRequest, res: Response, next: NextFunction): void {
    const header = req.headers['authorization']
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
        res.status(401).json({ error: 'Missing authentication token' })
        return
    }

    try {
        const decoded = jwt.verify(token, config.getJwtSecret())
        if (typeof decoded === 'string' || !decoded.sub || typeof decoded.sub !== 'string') {
            res.status(401).json({ error: 'Invalid token payload' })
            return
        }

        req.user = {
            sub: decoded.sub,
            username: typeof decoded['username'] === 'string' ? decoded['username'] : ''
        }
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
