export default interface ILogger {
    info(...params: unknown[]): void
    error(...params: unknown[]): void
}