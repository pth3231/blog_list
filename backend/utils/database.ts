import mongoose from 'mongoose'
import IDBConfig from '@/types/database.type'
import Config from '@/utils/config'
import { ConsoleLogger } from '@/utils/logger'

const config = new Config()
const logger = new ConsoleLogger()

const dbConfig: IDBConfig = {
    uri: config.getMongoURI(),
    options: {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000
    }
}

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(dbConfig.uri, dbConfig.options)
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

// Gracefully handle app termination to close all sockets in the pool
process.on('SIGINT', async () => {
    await mongoose.connection.close()
    logger.log('Mongoose connection pool closed due to app termination.')
    process.exit(0)
})