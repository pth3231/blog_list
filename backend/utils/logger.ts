import ILogger from '@/types/logger.type'

export class ConsoleLogger implements ILogger {
    info(...params: unknown[]) {
        console.info(...params)
    }

    error(...params: unknown[]) {
        console.error(...params)
    }

    warn(...params: unknown[]) {
        console.warn(...params)
    }

    log(...params: unknown[]) {
        console.log(...params)
    }
}
