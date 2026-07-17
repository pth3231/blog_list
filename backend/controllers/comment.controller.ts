import Comment from '@/models/comment.model'
import { IComment } from '@/types/comment.type'
import { ServiceResult } from '@/types/service_result.type'
import { Types } from 'mongoose'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'

const logger = new ConsoleLogger()

interface ICommentDoc {
    _id: Types.ObjectId
    post: Types.ObjectId
    author: string
    content: string
    createdAt: Date
}

function toView(doc: ICommentDoc): IComment {
    return {
        _id: doc._id.toString(),
        post: doc.post.toString(),
        author: doc.author,
        content: doc.content,
        createdAt: doc.createdAt.toISOString()
    }
}

export async function addComment(postId: string, author: string, content: string): Promise<ServiceResult<IComment>> {
    try {
        if (!Types.ObjectId.isValid(postId)) return notFound<IComment>('Post not found')
        const comment = new Comment({ post: postId, author, content })
        await comment.save()
        return success(toView(comment as unknown as ICommentDoc))
    } catch (err) {
        return fail<IComment>(logger, err)
    }
}

export async function getCommentsByPost(postId: string): Promise<ServiceResult<IComment[]>> {
    try {
        if (!Types.ObjectId.isValid(postId)) return notFound<IComment[]>('Post not found')
        const comments = await Comment.find({ post: postId }).sort({ createdAt: 1 })
        return success(comments.map((doc) => toView(doc as unknown as ICommentDoc)))
    } catch (err) {
        return fail<IComment[]>(logger, err)
    }
}
