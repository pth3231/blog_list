import ILogger from '@/types/logger.type'

export default interface IConfig {
    readonly logger: ILogger
    getPort(): number
    getMongoURI(): string
    getJwtSecret(): string
    getJwtExpiry(): string
    getCookieName(): string
    getBcryptRounds(): number
    isProduction(): boolean
    isTest(): boolean
}
