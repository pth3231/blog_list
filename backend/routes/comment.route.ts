import { Router } from 'express'
import { addComment, getCommentsByPost } from '@/controllers/comment.controller'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'
import { parseObjectIdParam, sendResult } from '@/utils/http_response'

const commentRouter: Router = Router()

commentRouter.post('/:id/comments', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    if (!content) {
        res.status(400).json({ error: 'Comment content is required' })
        return
    }
    const author = req.user?.username ?? ''
    sendResult(res, await addComment(id, author, content), 201)
})

commentRouter.get('/:id/comments', async (req, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    sendResult(res, await getCommentsByPost(id))
})

export default commentRouter
