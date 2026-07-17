import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import User from '@/models/user.model'
import mongoose from 'mongoose'

const testUser = {
    username: 'testuser',
    password: 'password123'
}

beforeAll(async () => {
    await connectDatabase()
})

afterAll(async () => {
    await User.deleteMany({ username: 'testuser' })
    await mongoose.disconnect()
})

describe('POST /v1/auth/register', () => {
    it('should register a user and return a token', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send(testUser)
            .expect(201)

        expect(res.body).toHaveProperty('token')
        expect(res.body.user).toMatchObject({ username: testUser.username })
        expect(res.body.user).not.toHaveProperty('passwordHash')
    })

    it('should reject a short password', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send({ username: 'shorty', password: '123' })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })

    it('should reject a duplicate username', async () => {
        const res = await request(app)
            .post('/v1/auth/register')
            .send(testUser)
            .expect(409)

        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /v1/auth/login', () => {
    it('should login with correct credentials and return a token', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send(testUser)
            .expect(200)

        expect(res.body).toHaveProperty('token')
        expect(res.body.user).toMatchObject({ username: testUser.username })
    })

    it('should reject wrong password', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send({ username: testUser.username, password: 'wrongpassword' })
            .expect(401)

        expect(res.body).toHaveProperty('error')
    })

    it('should reject missing fields', async () => {
        const res = await request(app)
            .post('/v1/auth/login')
            .send({ username: testUser.username })
            .expect(400)

        expect(res.body).toHaveProperty('error')
    })
})

describe('GET /v1/auth/me', () => {
    it('should return the current user with a valid token', async () => {
        const login = await request(app).post('/v1/auth/login').send(testUser)
        const token = login.body.token

        const res = await request(app)
            .get('/v1/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        expect(res.body).toMatchObject({ username: testUser.username })
    })

    it('should reject a missing token', async () => {
        const res = await request(app).get('/v1/auth/me').expect(401)
        expect(res.body).toHaveProperty('error')
    })

    it('should reject an invalid token', async () => {
        const res = await request(app)
            .get('/v1/auth/me')
            .set('Authorization', 'Bearer not-a-real-token')
            .expect(401)

        expect(res.body).toHaveProperty('error')
    })
})
