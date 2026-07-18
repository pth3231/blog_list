import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Config from '@/utils/config'
import { IAuthTokenPayload } from '@/types/auth.type'

const config = new Config()

export function signToken(id: string, username: string): string {
    return jwt.sign({ sub: id, username }, config.getJwtSecret(), {
        expiresIn: config.getJwtExpiry() as Exclude<jwt.SignOptions['expiresIn'], undefined>
    })
}

// Verifies and narrows the token. Throws `jwt.JsonWebTokenError` /
// `jwt.TokenExpiredError` on failure — callers catch and translate to 401.
export function verifyToken(token: string): IAuthTokenPayload {
    const decoded = jwt.verify(token, config.getJwtSecret())
    if (typeof decoded === 'string') throw new Error('Invalid token payload')
    const sub = decoded['sub']
    const username = decoded['username']
    if (typeof sub !== 'string' || typeof username !== 'string') {
        throw new Error('Invalid token payload')
    }
    return { sub, username }
}

function parseCookies(header: unknown): Record<string, string> {
    if (typeof header !== 'string') return {}
    const out: Record<string, string> = {}
    for (const part of header.split(';')) {
        const eq = part.indexOf('=')
        if (eq === -1) continue
        const key = part.slice(0, eq).trim()
        const value = part.slice(eq + 1).trim()
        if (key !== '') out[key] = decodeURIComponent(value)
    }
    return out
}

export function readAuthToken(req: Request): string | null {
    const cookies = parseCookies(req.headers['cookie'])
    const value = cookies[config.getCookieName()]
    return typeof value === 'string' && value !== '' ? value : null
}

export function setAuthCookie(res: Response, token: string): void {
    res.cookie(config.getCookieName(), token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProduction(),
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

export function clearAuthCookie(res: Response): void {
    res.clearCookie(config.getCookieName(), {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProduction(),
        path: '/'
    })
}
