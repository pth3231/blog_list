import request from 'supertest'
import app from '@/app'
import { describe, it, expect } from 'vitest'

describe('GET /v1', () => {
    it('should return API v1 entry text', async () => {
        const res = await request(app).get('/v1')
        expect(res.status).toBe(200)
        expect(res.text).toBe('This is api v1 entry')
    })
})