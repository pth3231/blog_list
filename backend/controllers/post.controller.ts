import Post from '@/models/post.model'
import { IPost } from '@/types/post.type'
import { ServiceResult } from '@/types/service_result.type'
import { Types } from 'mongoose'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'

const logger = new ConsoleLogger()

export async function getAllPosts(owner: string | null): Promise<ServiceResult<Array<IPost>>> {
    try {
        const filter = owner ? { owner } : {}
        const posts = await Post.find(filter)
        return success(posts)
    } catch (err) {
        return fail<Array<IPost>>(logger, err)
    }
}

export async function saveNewPost(postData: IPost): Promise<ServiceResult<IPost>> {
    try {
        const newPost = new Post(postData)
        await newPost.save()
        return success(newPost)
    } catch (err) {
        const isValidation = err instanceof Error && err.name === 'ValidationError'
        return fail<IPost>(
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

export interface ILikeState {
    likes: number
    likedBy: string[]
}

export async function toggleLike(postId: Types.ObjectId | string, userId: string): Promise<ServiceResult<ILikeState>> {
    try {
        const post = await Post.findById(postId)
        if (!post) return notFound<ILikeState>(`Post ${postId} not found`)

        const likedBy: string[] = post.likedBy ?? []
        const alreadyLiked = likedBy.includes(userId)
        if (alreadyLiked) {
            post.likedBy = likedBy.filter((id) => id !== userId)
            post.likes = Math.max(0, (post.likes ?? 0) - 1)
        } else {
            post.likedBy = [...likedBy, userId]
            post.likes = (post.likes ?? 0) + 1
        }
        await post.save()

        return success({ likes: post.likes ?? 0, likedBy: post.likedBy })
    } catch (err) {
        return fail<ILikeState>(logger, err)
    }
}

export async function countPostsByOwner(owner: string): Promise<ServiceResult<number>> {
    try {
        const count = await Post.countDocuments({ owner })
        return success(count)
    } catch (err) {
        return fail<number>(logger, err)
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
