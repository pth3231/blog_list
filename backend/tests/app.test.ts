import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'
import Post from '@/models/post.model'
import User from '@/models/user.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from '@/tests/testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('app')

const validPayload = {
    title: 'Testing title 2',
    author: 'Admin',
    url: 'http://url.com/testing2'
}

const nonExistentId = '0123456789abcdef01234567'

type Agent = ReturnType<typeof request.agent>
let owner: Agent
let other: Agent

async function registerAgent(username: string): Promise<Agent> {
    const a = request.agent(app)
    const res = await a.post('/v1/auth/register').send({ username, password: 'password123' })
    if (res.status === 409) {
        await a.post('/v1/auth/login').send({ username, password: 'password123' }).expect(200)
    } else {
        expect(res.status).toBe(201)
    }
    return a
}

beforeAll(async () => {
    await connectDatabase()
    owner = await registerAgent('owner')
    other = await registerAgent('other')
})

afterAll(async () => {
    await Post.deleteMany({})
    await User.deleteMany({ username: { $in: ['owner', 'other'] } })
    await mongoose.disconnect()
})

beforeEach(async () => {
    await Post.deleteMany({})
})

describe('GET /v1/posts', () => {
    it('returns post views without exposing likedBy', async () => {
        await owner.post('/v1/posts').send(validPayload).expect(201)

        const res = await request(app).get('/v1/posts').expect(200)

        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body).toHaveLength(1)
        expect(res.body[0]).toMatchObject({ title: validPayload.title, likes: 0, likedByMe: null })
        expect(res.body[0]).not.toHaveProperty('likedBy')
        expect(res.body[0]).toHaveProperty('createdAt')
    })

    it('paginates with limit and skip', async () => {
        for (let i = 0; i < 3; i++) {
            await owner.post('/v1/posts').send({ title: `P${i}`, author: 'A', url: `http://u.com/${i}` })
        }
        const page = await request(app).get('/v1/posts?limit=2').expect(200)
        expect(page.body).toHaveLength(2)

        const next = await request(app).get('/v1/posts?limit=2&skip=2').expect(200)
        expect(next.body).toHaveLength(1)
    })

    it('rejects an invalid limit', async () => {
        await request(app).get('/v1/posts?limit=abc').expect(400)
    })
})

describe('POST /v1/posts', () => {
    it('creates a post owned by the authenticated user', async () => {
        const res = await owner.post('/v1/posts').send(validPayload).expect(201)

        expect(res.body).toHaveProperty('_id')
        expect(res.body).toMatchObject({ title: validPayload.title, owner: 'owner' })

        const saved = await Post.findById(res.body._id)
        expect(saved).not.toBeNull()
        expect(saved?.owner).toBe('owner')
    })

    it('returns 401 when not authenticated', async () => {
        const res = await request(app).post('/v1/posts').send(validPayload).expect(401)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 400 when required fields are missing', async () => {
        const res = await owner.post('/v1/posts').send({ title: 'Only title' }).expect(400)
        expect(res.body).toHaveProperty('error')
        expect(await Post.countDocuments()).toBe(0)
    })
})

describe('GET /v1/posts/:id', () => {
    it('returns the post when the id exists', async () => {
        const created = await Post.create({ title: 'Fetch me', author: 'Tester', url: 'http://url.com/fetch' })
        const res = await request(app).get(`/v1/posts/${created._id}`).expect(200)
        expect(res.body).toMatchObject({ _id: created._id.toString(), title: 'Fetch me' })
    })

    it('returns 404 when the post does not exist', async () => {
        const res = await request(app).get(`/v1/posts/${nonExistentId}`).expect(404)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 400 when the id format is invalid', async () => {
        const res = await request(app).get('/v1/posts/not-a-valid-id').expect(400)
        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /v1/posts/:id/like', () => {
    it('toggles the like and reports likedByMe', async () => {
        const created = await owner.post('/v1/posts').send({ title: 'Likeable', author: 'A', url: 'http://u.com/l' }).expect(201)
        const id = created.body._id

        const on = await owner.post(`/v1/posts/${id}/like`).expect(200)
        expect(on.body).toMatchObject({ likes: 1, likedByMe: true })
        expect(on.body).not.toHaveProperty('likedBy')

        const view = await owner.get(`/v1/posts/${id}`).expect(200)
        expect(view.body).toMatchObject({ likes: 1, likedByMe: true })

        const anon = await request(app).get(`/v1/posts/${id}`).expect(200)
        expect(anon.body).toMatchObject({ likes: 1, likedByMe: null })

        const off = await owner.post(`/v1/posts/${id}/like`).expect(200)
        expect(off.body).toMatchObject({ likes: 0, likedByMe: false })
    })

    it('rejects an unauthenticated like', async () => {
        const created = await owner.post('/v1/posts').send({ title: 'X', author: 'A', url: 'http://u.com/x' }).expect(201)
        await request(app).post(`/v1/posts/${created.body._id}/like`).expect(401)
    })
})

describe('DELETE /v1/posts/:id', () => {
    it('lets the owner delete their own post (204)', async () => {
        const created = await owner.post('/v1/posts').send({ title: 'Mine', author: 'A', url: 'http://u.com/mine' }).expect(201)
        await owner.delete(`/v1/posts/${created.body._id}`).expect(204)
        expect(await Post.findById(created.body._id)).toBeNull()
    })

    it('forbids a non-owner from deleting (403)', async () => {
        const created = await owner.post('/v1/posts').send({ title: 'Not yours', author: 'A', url: 'http://u.com/no' }).expect(201)
        const res = await other.delete(`/v1/posts/${created.body._id}`).expect(403)
        expect(res.body).toHaveProperty('error')
        expect(await Post.findById(created.body._id)).not.toBeNull()
    })

    it('returns 401 when not authenticated', async () => {
        const created = await owner.post('/v1/posts').send({ title: 'Del', author: 'A', url: 'http://u.com/d' }).expect(201)
        await request(app).delete(`/v1/posts/${created.body._id}`).expect(401)
    })

    it('returns 404 when the post does not exist', async () => {
        await owner.delete(`/v1/posts/${nonExistentId}`).expect(404)
    })

    it('returns 400 when the id format is invalid', async () => {
        await owner.delete('/v1/posts/not-a-valid-id').expect(400)
    })
})

describe('GET /v1', () => {
    it('returns the API v1 entry text', async () => {
        const res = await request(app).get('/v1').expect(200)
        expect(res.text).toBe('This is api v1 entry')
    })
})

describe('health routes', () => {
    it('reports status and database state', async () => {
        const res = await request(app).get('/health').expect(200)
        expect(res.body).toHaveProperty('status', 'ok')
        expect(res.body).toHaveProperty('database')
    })

    it('liveness probe returns OK', async () => {
        await request(app).get('/health/live').expect(200)
    })

    it('readiness probe is ready when DB is connected', async () => {
        const res = await request(app).get('/health/ready').expect(200)
        expect(res.body).toHaveProperty('database', 'connected')
    })
})

describe('unknown routes', () => {
    it('returns a JSON 404', async () => {
        const res = await request(app).get('/v1/posts/does-not-exist/extra').expect(404)
        expect(res.body).toHaveProperty('error')
    })
})
