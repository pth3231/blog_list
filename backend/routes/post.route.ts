import { getAllPosts, getPostById, saveNewPost, deletePostById, toggleLike, countPostsByOwner } from '@/controllers/post.controller'
import { authenticateToken, IAuthedRequest, optionalAuth } from '@/middlewares/auth.middleware'
import { parseObjectIdParam, parsePagination, sendError, sendResult } from '@/utils/http_response'
import { parseNewPost } from '@/utils/validate'
import { Router } from 'express'

const postRouter: Router = Router()

postRouter.get('/', optionalAuth, async (req: IAuthedRequest, res) => {
    const owner = typeof req.query['owner'] === 'string' ? req.query['owner'] : null
    const page = parsePagination(res, req.query)
    if (page === null) return
    const userId = req.user?.sub ?? null
    sendResult(res, await getAllPosts(owner, userId, page))
})

postRouter.post('/', authenticateToken, async (req: IAuthedRequest, res) => {
    const postData = parseNewPost(req.body)
    if (postData === null) {
        sendError(res, 400, 'Missing or invalid fields: title, author, url')
        return
    }
    const owner = req.user?.username
    if (owner === undefined) {
        sendError(res, 401, 'Unauthorized')
        return
    }
    sendResult(res, await saveNewPost(postData, owner), 201)
})

postRouter.get('/count', async (req, res) => {
    const owner = typeof req.query['owner'] === 'string' ? req.query['owner'] : null
    if (!owner) {
        sendError(res, 400, 'Missing owner query parameter')
        return
    }
    const result = await countPostsByOwner(owner)
    if (!result.ok) {
        sendError(res, result.status, result.message)
        return
    }
    res.status(200).json({ count: result.value })
})

postRouter.get('/:id', optionalAuth, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const userId = req.user?.sub ?? null
    sendResult(res, await getPostById(id, userId))
})

postRouter.post('/:id/like', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const userId = req.user?.sub
    if (userId === undefined) {
        sendError(res, 401, 'Unauthorized')
        return
    }
    sendResult(res, await toggleLike(id, userId))
})

postRouter.delete('/:id', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const owner = req.user?.username
    if (owner === undefined) {
        sendError(res, 401, 'Unauthorized')
        return
    }
    sendResult(res, await deletePostById(id, owner), 204)
})

export default postRouter
