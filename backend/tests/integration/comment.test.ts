import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import Post from '@/models/post.model'
import User from '@/models/user.model'
import Comment from '@/models/comment.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from './testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('comment')

let authToken = ''
let postId = ''

beforeAll(async () => {
    await connectDatabase()
    const reg = await request(app).post('/v1/auth/register').send({ username: 'commenter', password: 'password123' })
    authToken = reg.body.token
    const post = await new Post({ title: 'Commentable', author: 'A', url: 'http://url.com/comment', owner: 'commenter' }).save()
    postId = post._id.toString()
})

afterAll(async () => {
    await Post.deleteMany({})
    await Comment.deleteMany({})
    await User.deleteMany({ username: 'commenter' })
    await mongoose.disconnect()
})

describe('comments', () => {
    it('POST /:id/comments creates a comment (auth)', async () => {
        const res = await request(app)
            .post(`/v1/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ content: 'Nice post' })
            .expect(201)

        expect(res.body).toMatchObject({ content: 'Nice post', author: 'commenter', post: postId })
    })

    it('POST /:id/comments requires non-empty content', async () => {
        await request(app)
            .post(`/v1/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ content: '   ' })
            .expect(400)
    })

    it('POST /:id/comments requires authentication', async () => {
        await request(app).post(`/v1/posts/${postId}/comments`).send({ content: 'hi' }).expect(401)
    })

    it('GET /:id/comments returns the comments', async () => {
        const res = await request(app).get(`/v1/posts/${postId}/comments`).expect(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThanOrEqual(1)
        expect(res.body[0]).toHaveProperty('author', 'commenter')
    })

    it('GET /v1/posts/count returns the owner post count', async () => {
        const res = await request(app).get('/v1/posts/count?owner=commenter').expect(200)
        expect(res.body).toHaveProperty('count')
        expect(res.body.count).toBeGreaterThanOrEqual(1)
    })
})
