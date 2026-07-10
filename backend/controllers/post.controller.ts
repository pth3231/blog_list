import Post from '@/models/post.model'
import { IPost } from '@/types/post.type'
import { ServiceResult } from '@/types/service_result.type'
import { Document, Types } from 'mongoose'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'

const logger = new ConsoleLogger()

export async function getAllPosts(): Promise<ServiceResult<Array<IPost>>> {
    try {
        const posts = await Post.find({})
        return success(posts)
    } catch (err) {
        return fail<Array<IPost>>(logger, err)
    }
}

export async function saveNewPost(postData: IPost): Promise<ServiceResult<Document>> {
    try {
        const newPost = new Post(postData)
        await newPost.save()
        return success(newPost)
    } catch (err) {
        const isValidation = err instanceof Error && err.name === 'ValidationError'
        return fail<Document>(
            logger,
            err,
            isValidation ? 400 : 500,
            isValidation ? 'Invalid post data' : 'Failed to create post'
        )
    }
}

export async function getPostById(id: Types.ObjectId | string): Promise<ServiceResult<IPost | null>> {
    try {
        const post = await Post.findById(id)
        if (!post) return notFound<IPost | null>(`Post ${id} not found`)
        return success(post)
    } catch (err) {
        return fail<IPost | null>(logger, err)
    }
}

export async function increasePostLikesById(postId: Types.ObjectId | string, increment: number = 1): Promise<ServiceResult<boolean>> {
    try {
        const result = await Post.updateOne(
            { _id: postId },
            { $inc: { likes: increment } }
        )
        if (result.matchedCount === 0) return notFound<boolean>(`Post ${postId} not found`)
        return success(true)
    } catch (err) {
        return fail<boolean>(logger, err)
    }
}

export async function deletePostById(postId: Types.ObjectId | string): Promise<ServiceResult<boolean>> {
    try {
        const result = await Post.deleteOne({ _id: postId })
        if (result.deletedCount === 0) return notFound<boolean>(`Post ${postId} not found`)
        return success(true)
    } catch (err) {
        return fail<boolean>(logger, err)
    }
}
