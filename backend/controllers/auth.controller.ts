import User from '@/models/user.model'
import { IAuthResult, IPublicUser } from '@/types/auth.type'
import { ServiceResult } from '@/types/service_result.type'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'
import Config from '@/utils/config'
import { signToken } from '@/utils/auth'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const logger = new ConsoleLogger()
const config = new Config()

function toPublicUser(id: string, username: string): IPublicUser {
    return { id, username }
}

function isDuplicateKey(err: unknown): boolean {
    return err instanceof Error && /E11000|duplicate key/i.test(err.message)
}

export async function registerUser(username: string, password: string): Promise<ServiceResult<IAuthResult>> {
    try {
        const passwordHash = await bcrypt.hash(password, config.getBcryptRounds())
        const user = await User.create({ username, passwordHash })
        const token = signToken(user._id.toString(), user.username)
        return success({ token, user: toPublicUser(user._id.toString(), user.username) })
    } catch (err) {
        if (isDuplicateKey(err)) {
            return fail<IAuthResult>(logger, null, 409, 'Username already taken')
        }
        return fail<IAuthResult>(logger, err)
    }
}

export async function loginUser(username: string, password: string): Promise<ServiceResult<IAuthResult>> {
    try {
        const user = await User.findOne({ username })
        if (!user) return fail<IAuthResult>(logger, null, 401, 'Invalid username or password')

        const matches = await bcrypt.compare(password, user.passwordHash)
        if (!matches) return fail<IAuthResult>(logger, null, 401, 'Invalid username or password')

        const token = signToken(user._id.toString(), user.username)
        return success({ token, user: toPublicUser(user._id.toString(), user.username) })
    } catch (err) {
        return fail<IAuthResult>(logger, err)
    }
}

export async function getUserById(id: string): Promise<ServiceResult<IPublicUser>> {
    try {
        if (!mongoose.isValidObjectId(id)) return notFound<IPublicUser>('User not found')

        const user = await User.findById(id).select('-passwordHash')
        if (!user) return notFound<IPublicUser>('User not found')

        return success(toPublicUser(user._id.toString(), user.username))
    } catch (err) {
        return fail<IPublicUser>(logger, err)
    }
}
