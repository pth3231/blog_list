import { getAllPosts, saveNewPost } from '@/controllers/post.controller'
import { IPost } from '@/types/post.type'
// import { ConsoleLogger } from '@/utils/logger'
import { Router } from 'express'

const postRouter: Router = Router()
// const logger = new ConsoleLogger()

postRouter.get('/', async (_, res) => {
    const response = await getAllPosts()
    return res.json(response)
})

postRouter.post('/', async (req, res) => {
    const post: IPost = req.body
    const isSuccessful = await saveNewPost(post)
    const statusCode = (isSuccessful) ? 201 : 400
    return res.status(statusCode).json({})
})

export default postRouter
