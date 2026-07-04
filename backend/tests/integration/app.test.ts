import request from 'supertest'
import app from '@/app'
import { connectDatabase } from '@/utils/database'
import { beforeAll, beforeEach, test, describe, it, expect } from 'vitest'
import { IPost } from '@/types/post.type'
import Post from '@/models/post.model'

const initialData: IPost = {
    title: 'Testing title 1',
    author: 'Admin',
    url: 'http://url.com/testing'
}

beforeAll(async () => {
    await connectDatabase()
})

beforeEach(async () => {
    await Post.deleteMany({})
    const newPost = new Post(initialData)
    await newPost.save()
})

describe('Testing MongoDB Docker image', () => {
    test('Connection to testing MongoDB', async () => {
        await expect(connectDatabase()).resolves.toBeUndefined()
    })

    test('DB data initial creation', async () => {
        const data: Array<IPost> = await Post.find({})
        expect(data.length).toBe(1)
        expect(data[0]?.title).toBe(initialData.title)
        expect(data[0]?.author).toBe(initialData.author)
        expect(data[0]?.url).toBe(initialData.url)
    })
})

describe('GET /v1', () => {
    it('should return API v1 entry text', async () => {
        const res = await request(app).get('/v1')
        expect(res.status).toBe(200)
        expect(res.text).toBe('This is api v1 entry')
    })
})

describe('POST /v1/posts', () => {
    it('should insert post into the DB', async () => {
        const res = await request(app)
            .post('/v1/posts')
            .send({
                title: 'Testing title 2',
                author: 'Admin',
                url: 'http://url.com/testing2'
            })

        expect(res.status).toBe(201)

        // Verify it was saved to DB
        const saved = await Post.findById(res.body._id)
        expect(saved).toBeDefined()

        expect(res.body).toHaveProperty('_id')
        expect(res.body.title).toBe('Testing title 2')
        expect(res.body.author).toBe('Admin')
        expect(res.body.url).toBe('http://url.com/testing2')
    })
})

describe('GET /v1/posts', () => {
    it('should return all posts from the DB', async () => {
        const res = await request(app)
            .get('/v1/posts')
            .expect(200)

        expect(res.body).toBeInstanceOf(Array)
        expect(res.body.length).toBe(1)
        expect(res.body[0]).toHaveProperty('_id')
        expect(res.body[0]?.title).toBe(initialData.title)
        expect(res.body[0]?.author).toBe(initialData.author)
        expect(res.body[0]?.url).toBe(initialData.url)
    })
})