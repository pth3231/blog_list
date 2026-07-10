import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'
import { IPost } from '@/types/post.type'
import Post from '@/models/post.model'
import mongoose from 'mongoose'

const initialData: IPost = {
    title: 'Testing title 1',
    author: 'Admin',
    url: 'http://url.com/testing'
}

const validPayload = {
    title: 'Testing title 2',
    author: 'Admin',
    url: 'http://url.com/testing2'
}

const nonExistentId = '0123456789abcdef01234567'

beforeAll(async () => {
    await connectDatabase()
})

afterAll(async () => {
    await Post.deleteMany({})
    await mongoose.disconnect()
})

beforeEach(async () => {
    await Post.deleteMany({})
    await new Post(initialData).save()
})

describe('GET /v1/posts', () => {
    it('should return all posts from the DB', async () => {
        const res = await request(app).get('/v1/posts').expect(200)

        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(1)
        expect(res.body[0]).toMatchObject({
            title: initialData.title,
            author: initialData.author,
            url: initialData.url
        })
    })
})

describe('POST /v1/posts', () => {
    it('should insert post into the DB and return 201', async () => {
        const res = await request(app).post('/v1/posts').send(validPayload).expect(201)

        expect(res.body).toHaveProperty('_id')
        expect(res.body).toMatchObject(validPayload)

        const saved = await Post.findById(res.body._id)
        expect(saved).not.toBeNull()
    })

    it('should return 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/v1/posts')
            .send({ title: 'Only title' })
            .expect(400)

        expect(res.body).toHaveProperty('error')
        expect(await Post.countDocuments()).toBe(1)
    })
})

describe('GET /v1/posts/:id', () => {
    it('should return the post when the id exists', async () => {
        const created = await Post.create({
            title: 'Fetch me',
            author: 'Tester',
            url: 'http://url.com/fetch'
        })

        const res = await request(app).get(`/v1/posts/${created._id}`).expect(200)

        expect(res.body).toMatchObject({
            _id: created._id.toString(),
            title: 'Fetch me',
            author: 'Tester',
            url: 'http://url.com/fetch'
        })
    })

    it('should return 404 when the post does not exist', async () => {
        const res = await request(app).get(`/v1/posts/${nonExistentId}`).expect(404)
        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when the id format is invalid', async () => {
        const res = await request(app).get('/v1/posts/not-a-valid-id').expect(400)
        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /v1/posts/increaseLike', () => {
    it('should increment likes by 1 by default', async () => {
        const created = await Post.create({
            title: 'Likeable post',
            author: 'Tester',
            url: 'http://url.com/like'
        })

        await request(app).post('/v1/posts/increaseLike').send({ id: created._id }).expect(200)

        const updated = await Post.findById(created._id)
        expect(updated?.likes).toBe(1)
    })

    it('should increment likes by the given amount', async () => {
        const created = await Post.create({
            title: 'Likeable post 2',
            author: 'Tester',
            url: 'http://url.com/like2',
            likes: 5
        })

        await request(app)
            .post('/v1/posts/increaseLike')
            .send({ id: created._id, increment: 3 })
            .expect(200)

        const updated = await Post.findById(created._id)
        expect(updated?.likes).toBe(8)
    })

    it('should return 404 when the post does not exist', async () => {
        const res = await request(app)
            .post('/v1/posts/increaseLike')
            .send({ id: nonExistentId, increment: 1 })
            .expect(404)

        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when the id format is invalid', async () => {
        const res = await request(app)
            .post('/v1/posts/increaseLike')
            .send({ id: 'invalid-id', increment: 1 })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when the id is missing', async () => {
        const res = await request(app)
            .post('/v1/posts/increaseLike')
            .send({ increment: 1 })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })
})

describe('DELETE /v1/posts/:id', () => {
    it('should delete the post and return 204', async () => {
        const created = await Post.create({
            title: 'Delete me',
            author: 'Tester',
            url: 'http://url.com/delete'
        })

        await request(app).delete(`/v1/posts/${created._id}`).expect(204)
        expect(await Post.findById(created._id)).toBeNull()
    })

    it('should return 404 when the post does not exist', async () => {
        const res = await request(app).delete(`/v1/posts/${nonExistentId}`).expect(404)
        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when the id format is invalid', async () => {
        const res = await request(app).delete('/v1/posts/not-a-valid-id').expect(400)
        expect(res.body).toHaveProperty('error')
    })
})

describe('GET /v1', () => {
    it('should return API v1 entry text', async () => {
        const res = await request(app).get('/v1').expect(200)
        expect(res.text).toBe('This is api v1 entry')
    })
})

describe('health routes', () => {
    it('GET /health should report status and database state', async () => {
        const res = await request(app).get('/health').expect(200)
        expect(res.body).toHaveProperty('status', 'ok')
        expect(res.body).toHaveProperty('database')
    })

    it('GET /health/live should return OK', async () => {
        await request(app).get('/health/live').expect(200)
    })

    it('GET /health/ready should be ready when DB is connected', async () => {
        const res = await request(app).get('/health/ready').expect(200)
        expect(res.body).toHaveProperty('database', 'connected')
    })
})

describe('unknown routes', () => {
    it('should return a JSON 404', async () => {
        const res = await request(app).get('/v1/posts/does-not-exist/extra').expect(404)
        expect(res.body).toHaveProperty('error')
    })
})
