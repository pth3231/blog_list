import { create } from 'zustand'
import { createPost as apiCreatePost, deletePost as apiDeletePost, getPost, getPosts, toggleLike as apiToggleLike } from '@/lib/api'
import type { IPost, INewPost } from '@/lib/types'

const PAGE_SIZE = 20

interface IPostsState {
    byId: Record<string, IPost>
    allIds: string[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    hasMore: boolean
    owner: string | null
    nextSkip: number
    fetchPosts: (owner?: string | null) => Promise<void>
    fetchMore: () => Promise<void>
    fetchPost: (id: string) => Promise<void>
    addPost: (post: INewPost) => Promise<IPost>
    removePost: (id: string) => Promise<void>
    toggleLike: (postId: string) => Promise<void>
}

function resetMap(): { byId: Record<string, IPost>, allIds: string[] } {
    return { byId: {}, allIds: [] }
}

function mergePosts(existing: Record<string, IPost>, incoming: IPost[]): { byId: Record<string, IPost>, allIds: string[] } {
    const byId: Record<string, IPost> = { ...existing }
    const allIds: string[] = []
    for (const post of incoming) {
        byId[post._id] = post
        allIds.push(post._id)
    }
    return { byId, allIds }
}

export const usePostsStore = create<IPostsState>((set, get) => ({
    byId: {},
    allIds: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    owner: null,
    nextSkip: 0,

    fetchPosts: async (owner: string | null = null): Promise<void> => {
        set({ ...resetMap(), loading: true, error: null, owner, nextSkip: 0 })
        try {
            const posts = await getPosts(owner, PAGE_SIZE, 0)
            set((state) => ({
                ...mergePosts(state.byId, posts),
                hasMore: posts.length === PAGE_SIZE,
                nextSkip: posts.length
            }))
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load posts' })
        } finally {
            set({ loading: false })
        }
    },

    fetchMore: async (): Promise<void> => {
        const state = get()
        if (state.loadingMore || !state.hasMore) return
        set({ loadingMore: true })
        try {
            const posts = await getPosts(state.owner, PAGE_SIZE, state.nextSkip)
            set((cur) => {
                const byId = { ...cur.byId }
                const allIds = [...cur.allIds]
                for (const post of posts) {
                    if (byId[post._id] === undefined) allIds.push(post._id)
                    byId[post._id] = post
                }
                return {
                    byId,
                    allIds,
                    hasMore: posts.length === PAGE_SIZE,
                    nextSkip: cur.nextSkip + posts.length
                }
            })
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load more posts' })
        } finally {
            set({ loadingMore: false })
        }
    },

    fetchPost: async (id: string): Promise<void> => {
        set({ loading: true, error: null })
        try {
            const post = await getPost(id)
            set((state) => ({
                byId: { ...state.byId, [post._id]: post },
                allIds: state.allIds.includes(post._id) ? state.allIds : [post._id, ...state.allIds]
            }))
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load post' })
        } finally {
            set({ loading: false })
        }
    },

    addPost: async (post: INewPost): Promise<IPost> => {
        const created = await apiCreatePost(post)
        set((state) => ({
            byId: { ...state.byId, [created._id]: created },
            allIds: [created._id, ...state.allIds]
        }))
        return created
    },

    removePost: async (id: string): Promise<void> => {
        await apiDeletePost(id)
        set((state) => {
            const byId = { ...state.byId }
            delete byId[id]
            return { byId, allIds: state.allIds.filter((postId) => postId !== id) }
        })
    },

    toggleLike: async (postId: string): Promise<void> => {
        const current = get().byId[postId]
        if (!current) return
        const prevLiked = current.likedByMe === true

        set((state) => {
            const post = state.byId[postId]
            if (!post) return state
            return {
                byId: {
                    ...state.byId,
                    [postId]: {
                        ...post,
                        likedByMe: !prevLiked,
                        likes: Math.max(0, post.likes + (prevLiked ? -1 : 1))
                    }
                }
            }
        })

        try {
            const result = await apiToggleLike(postId)
            set((state) => {
                const post = state.byId[postId]
                if (!post) return state
                return { byId: { ...state.byId, [postId]: { ...post, likes: result.likes, likedByMe: result.likedByMe } } }
            })
        } catch {
            set((state) => {
                const post = state.byId[postId]
                if (!post) return state
                return {
                    byId: {
                        ...state.byId,
                        [postId]: {
                            ...post,
                            likedByMe: prevLiked,
                            likes: Math.max(0, post.likes + (prevLiked ? 1 : -1))
                        }
                    }
                }
            })
        }
    }
}))
