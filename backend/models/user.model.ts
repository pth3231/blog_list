import mongoose from 'mongoose'
import IUser from '@/types/user.type'

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true }
})

export default mongoose.model('User', userSchema)
