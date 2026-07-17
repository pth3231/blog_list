import User from '@/models/user.model'
import { IAuthResult, IPublicUser } from '@/types/auth.type'
import { ServiceResult } from '@/types/service_result.type'
import { Types } from 'mongoose'
import { fail, notFound, success } from '@/utils/service_result'
import { ConsoleLogger } from '@/utils/logger'
import Config from '@/utils/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const logger = new ConsoleLogger()
const config = new Config()
const SALT_ROUNDS = 10

function signToken(id: string, username: string): string {
    return jwt.sign({ sub: id, username }, config.getJwtSecret(), { expiresIn: '7d' })
}

function toPublicUser(id: string, username: string): IPublicUser {
    return { id, username }
}

export async function registerUser(username: string, password: string): Promise<ServiceResult<IAuthResult>> {
    try {
        const existing = await User.findOne({ username })
        if (existing) return fail<IAuthResult>(logger, null, 409, 'Username already taken')

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
        const user = new User({ username, passwordHash })
        await user.save()

        const token = signToken(user._id.toString(), user.username)
        return success({ token, user: toPublicUser(user._id.toString(), user.username) })
    } catch (err) {
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
        if (!Types.ObjectId.isValid(id)) return notFound<IPublicUser>('User not found')

        const user = await User.findById(id).select('-passwordHash')
        if (!user) return notFound<IPublicUser>('User not found')

        return success(toPublicUser(user._id.toString(), user.username))
    } catch (err) {
        return fail<IPublicUser>(logger, err)
    }
}
