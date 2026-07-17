import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import Post from '@/models/post.model'
import User from '@/models/user.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from './testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('like')

let authToken = ''
let postId = ''

beforeAll(async () => {
    await connectDatabase()
    const reg = await request(app).post('/v1/auth/register').send({ username: 'liker', password: 'password123' })
    authToken = reg.body.token
    const post = await new Post({ title: 'Likeable', author: 'A', url: 'http://url.com/like' }).save()
    postId = post._id.toString()
})

afterAll(async () => {
    await Post.deleteMany({})
    await User.deleteMany({ username: 'liker' })
    await mongoose.disconnect()
})

describe('POST /v1/posts/:id/like', () => {
    it('should like a post and return the updated state', async () => {
        const res = await request(app)
            .post(`/v1/posts/${postId}/like`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        expect(res.body).toHaveProperty('likes', 1)
        expect(Array.isArray(res.body.likedBy)).toBe(true)
        expect(res.body.likedBy).toHaveLength(1)
    })

    it('should toggle the like off on a second click', async () => {
        const res = await request(app)
            .post(`/v1/posts/${postId}/like`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        expect(res.body).toHaveProperty('likes', 0)
        expect(res.body.likedBy).toHaveLength(0)
    })

    it('should reject an unauthenticated like', async () => {
        await request(app).post(`/v1/posts/${postId}/like`).expect(401)
    })

    it('should reject an invalid post id', async () => {
        await request(app).post('/v1/posts/not-an-id/like').set('Authorization', `Bearer ${authToken}`).expect(400)
    })
})
