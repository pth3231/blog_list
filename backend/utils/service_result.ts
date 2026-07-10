import ILogger from '@/types/logger.type'
import { ServiceResult } from '@/types/service_result.type'

export function fail<T>(logger: ILogger, err: unknown, status = 500, message = 'Internal server error'): ServiceResult<T> {
    logger.error(err)
    return { ok: false, status, message }
}

export function success<T>(value: T): ServiceResult<T> {
    return { ok: true, value }
}

export function notFound<T>(message = 'Resource not found'): ServiceResult<T> {
    return { ok: false, status: 404, message }
}