import mongoose from 'mongoose'
import IDBConfig from '../types/database.type'
import Config from './config'

const config = new Config()

const dbConfig: IDBConfig = {
    uri: config.getMongoURI(),
    options: {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000
    }
}

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(dbConfig.uri, dbConfig.options)
    } catch (error) {
        console.error('Initial MongoDB connection error:', error)
        process.exit(1)
    }
}

mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to pool: Active connections established.`)
})

mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection pool error: ${err}`)
})

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose connection pool disconnected.')
})

// Gracefully handle app termination to close all sockets in the pool
process.on('SIGINT', async () => {
    await mongoose.connection.close()
    console.log('Mongoose connection pool closed due to app termination.')
    process.exit(0)
})