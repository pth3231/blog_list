import { getAllPosts, getPostById, increasePostLikesById, saveNewPost, deletePostById } from '@/controllers/post.controller'
import { IPost } from '@/types/post.type'
import { ServiceResult } from '@/types/service_result.type'
import { Types } from 'mongoose'
import { Response, Router } from 'express'

const postRouter: Router = Router()

function invalidId(res: Response, id: string) {
    res.status(400).json({ error: `Invalid post id: ${id}` })
}

postRouter.get('/', async (_req, res) => {
    const result: ServiceResult<Array<IPost>> = await getAllPosts()
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

postRouter.post('/', async (req, res) => {
    const post = req.body as IPost
    if (
        !post ||
        typeof post.title !== 'string' || !post.title.trim() ||
        typeof post.author !== 'string' || !post.author.trim() ||
        typeof post.url !== 'string' || !post.url.trim()
    ) {
        res.status(400).json({ error: 'Missing required fields: title, author, url' })
        return
    }
    const result = await saveNewPost(post)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(201).json(result.value)
})

postRouter.get('/:id', async (req, res) => {
    const { id } = req.params
    if (!Types.ObjectId.isValid(id)) {
        invalidId(res, id)
        return
    }
    const result = await getPostById(id)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

postRouter.post('/increaseLike', async (req, res) => {
    const { id, increment } = req.body
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid or missing post id' })
        return
    }
    const parsedIncrement = increment === undefined ? 1 : Number(increment)
    if (!Number.isFinite(parsedIncrement)) {
        res.status(400).json({ error: 'Increment must be a number' })
        return
    }
    const result = await increasePostLikesById(id, parsedIncrement)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(200).end()
})

postRouter.delete('/:id', async (req, res) => {
    const { id } = req.params
    if (!Types.ObjectId.isValid(id)) {
        invalidId(res, id)
        return
    }
    const result = await deletePostById(id)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(204).end()
})

export default postRouter
