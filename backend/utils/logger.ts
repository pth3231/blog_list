import ILogger from '@/types/logger.type'

export class ConsoleLogger implements ILogger {
    info(...params: unknown[]): void {
        if (process.env['NODE_ENV'] === 'test')
            return
        console.info(...params)
    }

    error(...params: unknown[]): void {
        if (process.env['NODE_ENV'] === 'test')
            return
        console.error(...params)
    }

    warn(...params: unknown[]): void {
        if (process.env['NODE_ENV'] === 'test')
            return
        console.warn(...params)
    }

    log(...params: unknown[]): void {
        if (process.env['NODE_ENV'] === 'test')
            return
        console.log(...params)
    }
}
