import { Response } from 'express'
import { Types } from 'mongoose'
import { ServiceResult } from '@/types/service_result.type'

export function sendError(res: Response, status: number, message: string): void {
    res.status(status).json({ error: message })
}

export function sendResult<T>(res: Response, result: ServiceResult<T>, successStatus = 200): void {
    if (!result.ok) {
        sendError(res, result.status, result.message)
        return
    }
    if (result.value === null || result.value === undefined) {
        res.status(successStatus).end()
        return
    }
    res.status(successStatus).json(result.value)
}

export function parseObjectIdParam(res: Response, id: unknown): string | null {
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        sendError(res, 400, `Invalid id: ${typeof id === 'string' ? id : ''}`)
        return null
    }
    return id
}

function parseNonNegInt(value: unknown): number | null {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null
    return n
}

// Returns validated pagination numbers or `null` to signal the caller should
// 400. Defaults are applied by the controller.
export function parsePagination(res: Response, query: unknown): { limit: number, skip: number } | null {
    if (query === null || typeof query !== 'object') return { limit: NaN, skip: 0 }
    const record = query as Record<string, unknown>
    const rawLimit = record['limit']
    const rawSkip = record['skip']
    const limit = rawLimit === undefined ? NaN : parseNonNegInt(rawLimit)
    const skip = rawSkip === undefined ? 0 : parseNonNegInt(rawSkip)
    if (limit === null || skip === null) {
        sendError(res, 400, 'limit and skip must be non-negative integers')
        return null
    }
    return { limit, skip }
}
