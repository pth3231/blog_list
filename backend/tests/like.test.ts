import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import Post from '@/models/post.model'
import User from '@/models/user.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from './testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('like')

type Agent = ReturnType<typeof request.agent>
let agent: Agent
let postId = ''

beforeAll(async () => {
    await connectDatabase()
    agent = request.agent(app)
    const reg = await agent.post('/v1/auth/register').send({ username: 'liker', password: 'password123' })
    expect(reg.status).toBe(201)
    const post = await new Post({ title: 'Likeable', author: 'A', url: 'http://url.com/like' }).save()
    postId = post._id.toString()
})

afterAll(async () => {
    await Post.deleteMany({})
    await User.deleteMany({ username: 'liker' })
    await mongoose.disconnect()
})

describe('POST /v1/posts/:id/like', () => {
    it('likes a post and returns the updated state', async () => {
        const res = await agent.post(`/v1/posts/${postId}/like`).expect(200)
        expect(res.body).toMatchObject({ likes: 1, likedByMe: true })
        expect(res.body).not.toHaveProperty('likedBy')
    })

    it('toggles the like off on a second click', async () => {
        const res = await agent.post(`/v1/posts/${postId}/like`).expect(200)
        expect(res.body).toMatchObject({ likes: 0, likedByMe: false })
    })

    it('rejects an unauthenticated like', async () => {
        await request(app).post(`/v1/posts/${postId}/like`).expect(401)
    })

    it('rejects an invalid post id', async () => {
        await agent.post('/v1/posts/not-an-id/like').expect(400)
    })
})
