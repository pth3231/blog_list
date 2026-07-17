import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'
import { IPost } from '@/types/post.type'
import Post from '@/models/post.model'
import User from '@/models/user.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from './testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('app')

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

let authToken = ''

async function getAuthToken(): Promise<string> {
    if (authToken) return authToken
    const credentials = { username: 'posttester', password: 'password123' }
    let res = await request(app).post('/v1/auth/register').send(credentials)
    if (res.status === 409) {
        res = await request(app).post('/v1/auth/login').send(credentials)
    }
    authToken = res.body.token
    return authToken
}

beforeAll(async () => {
    await connectDatabase()
})

afterAll(async () => {
    await Post.deleteMany({})
    await User.deleteMany({ username: 'posttester' })
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
        const token = await getAuthToken()
        const res = await request(app)
            .post('/v1/posts')
            .set('Authorization', `Bearer ${token}`)
            .send(validPayload)
            .expect(201)

        expect(res.body).toHaveProperty('_id')
        expect(res.body).toMatchObject(validPayload)

        const saved = await Post.findById(res.body._id)
        expect(saved).not.toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
        const res = await request(app).post('/v1/posts').send(validPayload).expect(401)
        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when required fields are missing', async () => {
        const token = await getAuthToken()
        const res = await request(app)
            .post('/v1/posts')
            .set('Authorization', `Bearer ${token}`)
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

describe('DELETE /v1/posts/:id', () => {
    it('should delete the post and return 204', async () => {
        const token = await getAuthToken()
        const created = await Post.create({
            title: 'Delete me',
            author: 'Tester',
            url: 'http://url.com/delete'
        })

        await request(app)
            .delete(`/v1/posts/${created._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
        expect(await Post.findById(created._id)).toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
        const created = await Post.create({
            title: 'Delete me unauth',
            author: 'Tester',
            url: 'http://url.com/delete'
        })
        const res = await request(app).delete(`/v1/posts/${created._id}`).expect(401)
        expect(res.body).toHaveProperty('error')
    })

    it('should return 404 when the post does not exist', async () => {
        const token = await getAuthToken()
        const res = await request(app)
            .delete(`/v1/posts/${nonExistentId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404)
        expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when the id format is invalid', async () => {
        const token = await getAuthToken()
        const res = await request(app)
            .delete('/v1/posts/not-a-valid-id')
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
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
