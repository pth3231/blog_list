import express from 'express'
import morgan from 'morgan'
import Config from './utils/config'
import { connectDatabase } from './utils/database'

const app = express()
const config = new Config()

const PORT = config.getPort()

app.use(morgan('dev'))

app.get('/api/v1', (_, res) => {
    res.send('This is api v1 entry')
})

// Initialize the database connection before starting the server
connectDatabase().then(() => {
    app.listen(PORT, () => {
        console.info(`Express TS is running at port ${PORT}`)
    })
})