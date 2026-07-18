import mongoose from 'mongoose'
import IUser from '@/types/user.type'

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    passwordHash: { type: String, required: true }
}, {
    timestamps: true
})

export default mongoose.model('User', userSchema)
