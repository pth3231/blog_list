import mongoose from 'mongoose'
import IDBConfig from '@/types/database.type'
import Config from '@/utils/config'
import { ConsoleLogger } from '@/utils/logger'

const config = new Config()
const logger = new ConsoleLogger()

const connectionOptions: IDBConfig['options'] = {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000
}

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(config.getMongoURI(), connectionOptions)
    } catch (error) {
        logger.error('Initial MongoDB connection error:', error)
        process.exit(1)
    }
}

mongoose.connection.on('connected', () => {
    logger.info(`Mongoose connected to pool: Active connections established.`)
})

mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection pool error: ${err}`)
})

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose connection pool disconnected.')
})

// Gracefully close the connection pool on termination signals. SIGINT covers
// Ctrl-C / `npm stop`; SIGTERM is what container orchestrators (Docker, Swarm,
// Kubernetes) send on `docker stop`, rolling updates, and evictions — handling
// it avoids dropped in-flight requests during deploys.
async function shutdown(signal: string): Promise<void> {
    logger.log(`${signal} received, closing mongoose connection pool.`)
    await mongoose.connection.close()
    logger.log('Mongoose connection pool closed.')
    process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))