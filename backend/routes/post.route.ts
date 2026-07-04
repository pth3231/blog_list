import { getAllPosts, saveNewPost } from '@/controllers/post.controller'
import { IPost } from '@/types/post.type'
// import { ConsoleLogger } from '@/utils/logger'
import { Router } from 'express'

const postRouter: Router = Router()
// const logger = new ConsoleLogger()

postRouter.get('/', async (_, res) => {
    const response = await getAllPosts()
    res.json(response)
})

postRouter.post('/', async (req, res) => {
    const post: IPost = req.body
    const savedPost = await saveNewPost(post)
    if (savedPost) {
        res.status(201).json(savedPost)
    } else {
        res.status(400).json({
            error: 'Failed to create post'
        })
    }
})

export default postRouter
