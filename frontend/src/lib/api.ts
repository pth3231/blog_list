import type { IAuthResult, IComment, ILikeState, INewPost, IPost, IPublicUser } from './types'

const API_BASE = '/v1'
const DEFAULT_TIMEOUT_MS = 15000

// One core fetch wrapper. Uses credential cookies (httpOnly, set by the
// server) for auth — there is no token in JS-accessible storage. Throws an
// Error with the server's `error` message on non-2xx; resolves to `null` for
// 204 responses. Requests abort after DEFAULT_TIMEOUT_MS.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
        const headers = new Headers(options.headers)
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
            credentials: 'include',
            signal: controller.signal
        })

        if (!res.ok) {
            throw new Error(await extractError(res))
        }

        if (res.status === 204) return null as unknown as T
        return await res.json() as T
    } finally {
        clearTimeout(timer)
    }
}

async function extractError(res: Response): Promise<string> {
    let message = `Request failed with status ${res.status}`
    try {
        const data = await res.json() as { error?: unknown }
        if (data && typeof data.error === 'string') message = data.error
    } catch {
        // Response had no JSON body; keep the default message.
    }
    return message
}

export function register(username: string, password: string): Promise<IAuthResult> {
    return request<IAuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
}

export function login(username: string, password: string): Promise<IAuthResult> {
    return request<IAuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
}

export function logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' })
}

export function getMe(): Promise<IPublicUser> {
    return request<IPublicUser>('/auth/me', { method: 'GET' })
}

export function getPosts(owner: string | null, limit: number, skip: number): Promise<IPost[]> {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('skip', String(skip))
    if (owner !== null) params.set('owner', owner)
    return request<IPost[]>(`/posts?${params.toString()}`, { method: 'GET' })
}

export function getPost(id: string): Promise<IPost> {
    return request<IPost>(`/posts/${id}`, { method: 'GET' })
}

export function getPostCount(owner: string): Promise<number> {
    return request<{ count: number }>(`/posts/count?owner=${encodeURIComponent(owner)}`, { method: 'GET' })
        .then((data) => data?.count ?? 0)
}

export function createPost(post: INewPost): Promise<IPost> {
    return request<IPost>('/posts', {
        method: 'POST',
        body: JSON.stringify(post)
    })
}

export function deletePost(id: string): Promise<void> {
    return request<void>(`/posts/${id}`, { method: 'DELETE' })
}

export function toggleLike(id: string): Promise<ILikeState> {
    return request<ILikeState>(`/posts/${id}/like`, { method: 'POST' })
}

export function getComments(postId: string): Promise<IComment[]> {
    return request<IComment[]>(`/posts/${postId}/comments`, { method: 'GET' })
}

export function addComment(postId: string, content: string): Promise<IComment> {
    return request<IComment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
    })
}
