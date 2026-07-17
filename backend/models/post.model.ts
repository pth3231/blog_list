import mongoose from 'mongoose'
import { IPost } from '@/types/post.type'

const postSchema = new mongoose.Schema<IPost>({
    title: { type: String, required: true },
    author: { type: String, required: true },
    url: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    owner: { type: String }
})

export default mongoose.model('Post', postSchema)