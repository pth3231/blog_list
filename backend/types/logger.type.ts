export default interface ILogger {
    info(...params: unknown[]): void
    error(...params: unknown[]): void
    warn(...params: unknown[]): void
    log(...params: unknown[]): void
}