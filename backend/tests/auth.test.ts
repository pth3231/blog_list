import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import User from '@/models/user.model'
import mongoose from 'mongoose'
import { uniqueDbUri } from './testDb'

process.env['TEST_MONGODB_URI'] = uniqueDbUri('auth')

const testUser = {
    username: 'testuser',
    password: 'password123'
}

type Agent = ReturnType<typeof request.agent>
let agent: Agent

beforeAll(async () => {
    await connectDatabase()
    agent = request.agent(app)
    await request(app).post('/v1/auth/register').send(testUser).expect(201)
})

afterAll(async () => {
    await User.deleteMany({ username: testUser.username })
    await mongoose.disconnect()
})

describe('POST /v1/auth/register', () => {
    it('sets an httpOnly auth cookie and responds with the user only', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send({ username: 'cookieuser', password: 'password123' })
            .expect(201)

        expect(res.headers['set-cookie']).toBeDefined()
        const cookie = String(res.headers['set-cookie'] ?? '')
        expect(cookie).toContain('HttpOnly')
        expect(res.body).toMatchObject({ user: { username: 'cookieuser' } })
        expect(res.body).not.toHaveProperty('token')
        expect(res.body.user).not.toHaveProperty('passwordHash')
        await User.deleteOne({ username: 'cookieuser' })
    })

    it('rejects a short password', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send({ username: 'shorty', password: '123' })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })

    it('rejects a duplicate username', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send(testUser)
            .expect(409)

        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /v1/auth/login', () => {
    it('logs in with correct credentials and sets a cookie', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send(testUser)
            .expect(200)

        expect(res.headers['set-cookie']).toBeDefined()
        expect(res.body).toMatchObject({ user: { username: testUser.username } })
        expect(res.body).not.toHaveProperty('token')
    })

    it('rejects wrong password', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send({ username: testUser.username, password: 'wrongpassword' })
            .expect(401)

        expect(res.body).toHaveProperty('error')
    })

    it('rejects missing fields', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send({ username: testUser.username })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })
})

describe('GET /v1/auth/me', () => {
    it('returns the current user when the cookie is present', async () => {
        await agent.post('/v1/auth/login').send(testUser).expect(200)

        const res = await agent.get('/v1/auth/me').expect(200)
        expect(res.body).toMatchObject({ username: testUser.username })
    })

    it('rejects a request with no cookie', async () => {
        const res = await request(app).get('/v1/auth/me').expect(401)
        expect(res.body).toHaveProperty('error')
    })

    it('rejects a request with a tampered cookie', async () => {
        const res = await request(app)
            .get('/v1/auth/me')
            .set('Cookie', 'blog_session=not-a-real-token')
            .expect(401)

        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /v1/auth/logout', () => {
    it('clears the auth cookie', async () => {
        const res = await agent.post('/v1/auth/logout').expect(204)
        expect(res.headers['set-cookie']).toBeDefined()
        await agent.get('/v1/auth/me').expect(401)
    })
})
