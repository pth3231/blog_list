import app from '@/app'
import Config from '@/utils/config'
import { connectDatabase } from '@/utils/database'
import { ConsoleLogger } from '@/utils/logger'

const config = new Config()
const logger = new ConsoleLogger()
const PORT = config.getPort()

connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`Express TS is running at port ${PORT}`)
        })
    })
    .catch((err) => {
        logger.error('Failed to start server:', err)
    })
