import { Router } from 'express'
import { addComment, getCommentsByPost } from '@/controllers/comment.controller'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'
import { parseObjectIdParam, sendError, sendResult } from '@/utils/http_response'
import { parseCommentContent } from '@/utils/validate'

const commentRouter: Router = Router()

commentRouter.post('/:id/comments', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    const content = parseCommentContent(req.body)
    if (content === null) {
        sendError(res, 400, 'Comment content is required')
        return
    }
    const author = req.user?.username
    if (author === undefined) {
        sendError(res, 401, 'Unauthorized')
        return
    }
    sendResult(res, await addComment(id, author, content), 201)
})

commentRouter.get('/:id/comments', async (req, res) => {
    const id = parseObjectIdParam(res, req.params['id'])
    if (!id) return
    sendResult(res, await getCommentsByPost(id))
})

export default commentRouter
