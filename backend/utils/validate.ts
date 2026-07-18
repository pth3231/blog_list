import { INewPost } from '@/types/post.type'

export function asString(value: unknown): string | null {
    return typeof value === 'string' ? value : null
}

// Returns a trimmed, non-empty string no longer than `maxLen`, or `null` if the
// value is missing/empty/too long/not a string.
export function asNonEmptyString(value: unknown, maxLen = 1000): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (trimmed === '' || trimmed.length > maxLen) return null
    return trimmed
}

export interface ICredentials {
    username: string
    password: string
}

export function parseCredentials(body: unknown): ICredentials | null {
    if (body === null || typeof body !== 'object') return null
    const record = body as Record<string, unknown>
    const username = asNonEmptyString(record['username'], 30)
    if (username === null || username.length < 3) return null
    const password = asString(record['password'])
    if (password === null || password.length < 6) return null
    return { username, password }
}

export function parseNewPost(body: unknown): INewPost | null {
    if (body === null || typeof body !== 'object') return null
    const record = body as Record<string, unknown>
    const title = asNonEmptyString(record['title'], 200)
    const author = asNonEmptyString(record['author'], 120)
    const url = asNonEmptyString(record['url'], 2048)
    if (title === null || author === null || url === null) return null
    return { title, author, url }
}

export function parseCommentContent(body: unknown): string | null {
    if (body === null || typeof body !== 'object') return null
    const record = body as Record<string, unknown>
    return asNonEmptyString(record['content'], 2000)
}
