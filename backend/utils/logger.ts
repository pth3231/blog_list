import ILogger from '../types/logger.type'

export default class ConsoleLogger implements ILogger {
    info(...params: unknown[]) {
        console.info(...params)
    }

    error(...params: unknown[]) {
        console.error(...params)
    }
}
