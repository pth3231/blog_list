import { Request, Response, NextFunction } from 'express'
import { IAuthTokenPayload } from '@/types/auth.type'
import { readAuthToken, verifyToken } from '@/utils/auth'

export interface IAuthedRequest extends Request {
    user?: IAuthTokenPayload
}

export function authenticateToken(req: IAuthedRequest, res: Response, next: NextFunction): void {
    const token = readAuthToken(req)
    if (!token) {
        res.status(401).json({ error: 'Missing authentication token' })
        return
    }

    try {
        req.user = verifyToken(token)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

// Resolves the authenticated user id when a valid cookie is present, or `null`
// for anonymous requests. Never rejects — use on routes that are public but
// want to personalize the response (e.g. `likedByMe`).
export function optionalAuth(req: IAuthedRequest, _res: Response, next: NextFunction): void {
    const token = readAuthToken(req)
    if (token !== null) {
        try {
            req.user = verifyToken(token)
        } catch {
            // Ignore malformed tokens on optional auth — treat as anonymous.
        }
    }
    next()
}
