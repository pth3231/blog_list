import { Router } from 'express'
import { addComment, getCommentsByPost } from '@/controllers/comment.controller'
import { authenticateToken, IAuthedRequest } from '@/middlewares/auth.middleware'
import { Types } from 'mongoose'

const commentRouter: Router = Router()

commentRouter.post('/:id/comments', authenticateToken, async (req: IAuthedRequest, res) => {
    const id = req.params['id']
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid post id' })
        return
    }
    if (!content) {
        res.status(400).json({ error: 'Comment content is required' })
        return
    }
    const author = req.user?.username ?? ''
    const result = await addComment(id, author, content)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.status(201).json(result.value)
})

commentRouter.get('/:id/comments', async (req, res) => {
    const id = req.params['id']
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid post id' })
        return
    }
    const result = await getCommentsByPost(id)
    if (!result.ok) {
        res.status(result.status).json({ error: result.message })
        return
    }
    res.json(result.value)
})

export default commentRouter
