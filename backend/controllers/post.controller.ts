import Post from '@/models/post.model'
import { ConsoleLogger } from '@/utils/logger'
import { IPost } from '@/types/post.type'

const logger = new ConsoleLogger()

export async function getAllPosts() {
    try {
        const allPostQuery = await Post.find({})
        return allPostQuery
    } catch (err) {
        logger.error(err)
        return []
    }
}

export async function saveNewPost(postData: IPost): Promise<boolean> {
    try {
        const newPost = new Post(postData)
        await newPost.save()
        return true
    } catch (err) {
        logger.error(err)
        return false
    }
}