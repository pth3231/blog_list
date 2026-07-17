import type { IAuthResult, IComment, INewPost, IPost, IPublicUser } from './types'

const API_BASE = '/v1'

// Requests that expect an empty (204) response may resolve to `null`; callers that can
// receive one must use `ApiResult<T>` instead of `Promise<T>`.
type ApiResult<T> = Promise<T | null>

function getToken(): string | null {
    return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (!res.ok) {
        let message = `Request failed with status ${res.status}`
        try {
            const data = await res.json()
            if (data && typeof data.error === 'string') message = data.error
        } catch {
            // Response had no JSON body; keep the default message.
        }
        throw new Error(message)
    }

    if (res.status === 204) return null as unknown as T
    return (await res.json()) as T
}

// Convenience wrapper for DELETE and other endpoints that legitimately return 204 with
// no body; resolves to `null` instead of throwing.
async function requestEmpty<T>(path: string, options: RequestInit = {}): ApiResult<T> {
    const headers = new Headers(options.headers)
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (!res.ok) {
        let message = `Request failed with status ${res.status}`
        try {
            const data = await res.json()
            if (data && typeof data.error === 'string') message = data.error
        } catch {
            // Response had no JSON body; keep the default message.
        }
        throw new Error(message)
    }

    if (res.status === 204) return null
    return (await res.json()) as T
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

export function getMe(): Promise<IPublicUser> {
    return request<IPublicUser>('/auth/me', { method: 'GET' })
}

export function getPosts(owner?: string): Promise<IPost[]> {
    const query = owner ? `?owner=${encodeURIComponent(owner)}` : ''
    return request<IPost[]>(`/posts${query}`, { method: 'GET' })
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

export function deletePost(id: string): ApiResult<void> {
    return requestEmpty<void>(`/posts/${id}`, { method: 'DELETE' })
}

export function toggleLike(id: string, userId: string): ApiResult<{ likes: number, likedBy: string[] }> {
    return request<{ likes: number, likedBy: string[] }>(`/posts/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId })
    })
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
