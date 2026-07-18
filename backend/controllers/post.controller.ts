import Post from '@/models/post.model'
import Comment from '@/models/comment.model'
import { IPostView, ILikeState, INewPost } from '@/types/post.type'
import { ServiceResult } from '@/types/service_result.type'
import { badRequest, fail, forbidden, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'
import mongoose from 'mongoose'

const logger = new ConsoleLogger()

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Structural shape satisfied by both hydrated docs and lean() objects, so the
// view mapper works regardless of which query style produced the input.
interface IPostLikeDoc {
    _id: { toString(): string }
    title: string
    author: string
    url: string
    likedBy?: string[]
    owner?: string | null
    createdAt?: Date
}

function toPostView(doc: IPostLikeDoc, userId: string | null): IPostView {
    const likedBy = doc.likedBy ?? []
    const created = doc.createdAt instanceof Date ? doc.createdAt : new Date(0)
    return {
        _id: doc._id.toString(),
        title: doc.title,
        author: doc.author,
        url: doc.url,
        likes: likedBy.length,
        likedByMe: userId === null ? null : likedBy.includes(userId),
        owner: doc.owner ?? null,
        createdAt: created.toISOString()
    }
}

export interface IPage {
    limit: number
    skip: number
}

function clampPage(page: IPage): IPage {
    const limit = !Number.isFinite(page.limit) || page.limit <= 0 ? DEFAULT_LIMIT : Math.min(Math.floor(page.limit), MAX_LIMIT)
    const skip = !Number.isFinite(page.skip) || page.skip < 0 ? 0 : Math.floor(page.skip)
    return { limit, skip }
}

export async function getAllPosts(
    owner: string | null,
    userId: string | null,
    page: IPage
): Promise<ServiceResult<IPostView[]>> {
    try {
        const { limit, skip } = clampPage(page)
        const filter = owner === null ? {} : { owner }
        const docs = await Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
        return success(docs.map((doc) => toPostView(doc as IPostLikeDoc, userId)))
    } catch (err) {
        return fail<IPostView[]>(logger, err)
    }
}

export async function getPostById(id: string, userId: string | null): Promise<ServiceResult<IPostView>> {
    try {
        if (!mongoose.isValidObjectId(id)) return notFound<IPostView>('Post not found')
        const doc = await Post.findById(id).lean()
        if (!doc) return notFound<IPostView>('Post not found')
        return success(toPostView(doc as IPostLikeDoc, userId))
    } catch (err) {
        return fail<IPostView>(logger, err)
    }
}

export async function saveNewPost(postData: INewPost, owner: string): Promise<ServiceResult<IPostView>> {
    try {
        const doc = await Post.create({ ...postData, owner, likedBy: [] })
        return success(toPostView(doc as IPostLikeDoc, owner))
    } catch (err) {
        const isValidation = err instanceof Error && err.name === 'ValidationError'
        return fail<IPostView>(
            logger,
            err,
            isValidation ? 400 : 500,
            isValidation ? 'Invalid post data' : 'Failed to create post'
        )
    }
}

export async function toggleLike(postId: string, userId: string): Promise<ServiceResult<ILikeState>> {
    try {
        if (!mongoose.isValidObjectId(postId)) return badRequest<ILikeState>('Invalid post id')
        const existing = await Post.findById(postId).lean()
        if (!existing) return notFound<ILikeState>(`Post ${postId} not found`)

        const alreadyLiked = (existing.likedBy ?? []).includes(userId)
        const update = alreadyLiked
            ? { $pull: { likedBy: userId } }
            : { $addToSet: { likedBy: userId } }

        const updated = await Post.findByIdAndUpdate(postId, update, { returnDocument: 'after' }).lean()
        if (!updated) return notFound<ILikeState>(`Post ${postId} not found`)

        const newLikedBy = updated.likedBy ?? []
        return success({ likes: newLikedBy.length, likedByMe: !alreadyLiked })
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

export async function deletePostById(postId: string, owner: string): Promise<ServiceResult<boolean>> {
    try {
        if (!mongoose.isValidObjectId(postId)) return badRequest<boolean>('Invalid post id')
        const post = await Post.findById(postId).lean()
        if (!post) return notFound<boolean>(`Post ${postId} not found`)
        if ((post.owner ?? null) !== owner) return forbidden<boolean>('You can only delete your own posts')

        await Post.deleteOne({ _id: postId })
        await Comment.deleteMany({ post: postId })
        return success(true)
    } catch (err) {
        return fail<boolean>(logger, err)
    }
}
