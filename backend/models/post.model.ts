import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number
})

export default mongoose.model('Post', postSchema)