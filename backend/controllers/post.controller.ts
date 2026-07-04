import Post from '@/models/post.model'
import { ConsoleLogger } from '@/utils/logger'
import { IPost } from '@/types/post.type'
import { Document } from 'mongoose'

const logger = new ConsoleLogger()

export async function getAllPosts(): Promise<Array<IPost>> {
    try {
        const allPostQuery: Array<IPost> = await Post.find({})
        return allPostQuery
    } catch (err) {
        logger.error(err)
        return []
    }
}

export async function saveNewPost(postData: IPost): Promise<Document | undefined> {
    try {
        const newPost = new Post(postData)
        await newPost.save()
        return newPost
    } catch (err) {
        logger.error(err)
        return undefined
    }
}