import express from 'express'
import morgan from 'morgan'
import postRouter from '@/routes/post.route'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use('/v1/posts', postRouter)

app.get('/v1', (_, res) => {
    res.send('This is api v1 entry')
})

export default app