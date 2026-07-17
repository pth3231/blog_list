import { getAllPosts, getPostById, saveNewPost, deletePostById, toggleLike, countPostsByOwner } from '@/controllers/post.controller'
import { IPost } from '@/types/post.type'
import { Router } from 'express'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'
import { parseObjectIdParam, sendResult } from '@/utils/http_response'

const postRouter: Router = Router()

postRouter.get('/', async (req, res) => {
    const owner = typeof req.query['owner'] === 'string' ? req.query['owner'] : null
    sendResult(res, await getAllPosts(owner))
})

postRouter.post('/', authenticateToken, async (req: IAuthedRequest, res) => {
    const post = req.body as IPost | null
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
    sendResult(res, await saveNewPost(post), 201)
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
    res.status(200).json({ count: result.value })
})

postRouter.get('/:id', async (req, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    sendResult(res, await getPostById(id))
})

postRouter.post('/:id/like', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const userId = req.user?.sub
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    sendResult(res, await toggleLike(id, userId))
})

postRouter.delete('/:id', authenticateToken, async (req, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    sendResult(res, await deletePostById(id), 204)
})

export default postRouter
