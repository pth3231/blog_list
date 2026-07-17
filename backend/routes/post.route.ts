import { getAllPosts, getPostById, increasePostLikesById, saveNewPost, deletePostById, toggleLike, countPostsByOwner } from '@/controllers/post.controller'
import { IPost } from '@/types/post.type'
import { ServiceResult } from '@/types/service_result.type'
import { Types } from 'mongoose'
import { Response, Router } from 'express'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'

const postRouter: Router = Router()

function invalidId(res: Response, id: string) {
    res.status(400).json({ error: `Invalid post id: ${id}` })
}

postRouter.get('/', async (req, res) => {
    const owner = typeof req.query['owner'] === 'string' ? req.query['owner'] : undefined
    const result: ServiceResult<Array<IPost>> = await getAllPosts(owner)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

postRouter.post('/', authenticateToken, async (req: IAuthedRequest, res) => {
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
    post.owner = req.user?.username ?? null
    const result = await saveNewPost(post)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(201).json(result.value)
})

postRouter.get('/count', async (req, res) => {
    const owner = typeof req.query['owner'] === 'string' ? req.query['owner'] : null
    if (!owner) {
        res.status(400).json({ error: 'Missing owner query parameter' })
        return
    }
    const result = await countPostsByOwner(owner)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json({ count: result.value })
})

postRouter.get('/:id', async (req, res) => {
    const id = req.params['id']
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        invalidId(res, typeof id === 'string' ? id : '')
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

postRouter.post('/:id/like', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = req.params['id']
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        invalidId(res, typeof id === 'string' ? id : '')
        return
    }
    const userId = req.user?.sub
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    const result = await toggleLike(id, userId)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

postRouter.delete('/:id', authenticateToken, async (req, res) => {
    const id = req.params['id']
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        invalidId(res, typeof id === 'string' ? id : '')
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
