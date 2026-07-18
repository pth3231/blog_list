import mongoose from 'mongoose'
import { IPost } from '@/types/post.type'

// `likes` is deliberately not stored — it is derived from `likedBy.length` in
// the view serializer, so the counter can never drift from the array under
// concurrent toggles.
const postSchema = new mongoose.Schema<IPost>({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true },
    likedBy: { type: [String], default: [] },
    owner: { type: String, default: null }
}, {
    timestamps: true
})

postSchema.index({ createdAt: -1 })
postSchema.index({ owner: 1 })

export default mongoose.model('Post', postSchema)
