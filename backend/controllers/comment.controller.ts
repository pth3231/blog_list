import Comment from '@/models/comment.model'
import Post from '@/models/post.model'
import { IComment } from '@/types/comment.type'
import { ServiceResult } from '@/types/service_result.type'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'
import mongoose from 'mongoose'

const logger = new ConsoleLogger()

interface ICommentDoc {
    _id: { toString(): string }
    post: { toString(): string }
    author: string
    content: string
    createdAt?: Date
}

function toView(doc: ICommentDoc): IComment {
    const created = doc.createdAt instanceof Date ? doc.createdAt : new Date(0)
    return {
        _id: doc._id.toString(),
        post: doc.post.toString(),
        author: doc.author,
        content: doc.content,
        createdAt: created.toISOString()
    }
}

export async function addComment(postId: string, author: string, content: string): Promise<ServiceResult<IComment>> {
    try {
        if (!mongoose.isValidObjectId(postId)) return notFound<IComment>('Post not found')
        const postExists = await Post.exists({ _id: postId })
        if (!postExists) return notFound<IComment>('Post not found')

        const comment = await Comment.create({ post: postId, author, content })
        return success(toView(comment as unknown as ICommentDoc))
    } catch (err) {
        return fail<IComment>(logger, err)
    }
}

export async function getCommentsByPost(postId: string): Promise<ServiceResult<IComment[]>> {
    try {
        if (!mongoose.isValidObjectId(postId)) return notFound<IComment[]>('Post not found')
        const comments = await Comment.find({ post: postId }).sort({ createdAt: 1 }).lean()
        return success(comments.map((doc) => toView(doc as unknown as ICommentDoc)))
    } catch (err) {
        return fail<IComment[]>(logger, err)
    }
}
