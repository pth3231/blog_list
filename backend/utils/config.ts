import { loadEnvFile } from 'node:process'
import IConfig from '@/types/config.type'
import ILogger from '@/types/logger.type'
import { ConsoleLogger } from '@/utils/logger'

// Load .env when present; in CI/containers the environment is injected directly
// and there is no .env file, so a missing file must not crash the process.
try {
    loadEnvFile()
} catch {
    // No .env file — rely on the real environment.
}

export default class Config implements IConfig {
    readonly logger: ILogger

    constructor() {
        this.logger = new ConsoleLogger()
    }

    isProduction(): boolean {
        return process.env['NODE_ENV'] === 'production'
    }

    isTest(): boolean {
        return process.env['NODE_ENV'] === 'test'
    }

    private requireEnv(name: string): string {
        const value = process.env[name]
        if (!value || value.trim() === '') {
            this.logger.error(`Cannot read the ${name} variable`)
            throw new Error(`Cannot read the ${name} variable`, {
                cause: {
                    variable: `process.env['${name}']`,
                    reason: 'The .env file or env config is incorrect'
                }
            })
        }
        return value
    }

    getPort(): number {
        const port = this.requireEnv('PORT')
        const convertedPort = Number(port)
        if (Number.isNaN(convertedPort)) {
            this.logger.error('Invalid PORT number, may containing characters')
            throw new Error('Invalid PORT number, may containing characters', {
                cause: {
                    variable: "process.env['PORT']",
                    value: process.env['PORT'],
                    reason: 'May contain invalid characters, such as non-numeric characters and whitespaces'
                }
            })
        }

        return convertedPort
    }

    getMongoURI(): string {
        const name = this.isTest() ? 'TEST_MONGODB_URI' : 'MONGODB_URI'
        return this.requireEnv(name)
    }

    getJwtSecret(): string {
        const secret = this.requireEnv('JWT_SECRET')
        if (secret.length < 16) {
            this.logger.error('JWT_SECRET must be at least 16 characters')
            throw new Error('JWT_SECRET must be at least 16 characters', {
                cause: {
                    variable: "process.env['JWT_SECRET']",
                    reason: 'Use a long, random secret (>= 16 chars)'
                }
            })
        }
        return secret
    }

    getJwtExpiry(): string {
        return process.env['JWT_EXPIRES_IN'] ?? '7d'
    }

    getCookieName(): string {
        return process.env['COOKIE_NAME'] ?? 'blog_session'
    }

    getBcryptRounds(): number {
        const raw = process.env['BCRYPT_ROUNDS'] ?? '12'
        const rounds = Number(raw)
        if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) return 12
        return rounds
    }
}
