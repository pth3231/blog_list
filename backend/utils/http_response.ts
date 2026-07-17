import { Response } from 'express'
import { Types } from 'mongoose'
import { ServiceResult } from '@/types/service_result.type'

export function sendResult<T>(res: Response, result: ServiceResult<T>, successStatus = 200): void {
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
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
        res.status(400).json({ error: `Invalid id: ${typeof id === 'string' ? id : ''}` })
        return null
    }
    return id
}
