import { create } from 'zustand'
import { createPost as apiCreatePost, deletePost as apiDeletePost, getPost, getPosts, toggleLike as apiToggleLike } from '../lib/api'
import type { IPost, INewPost } from '../lib/types'

interface IPostsState {
    byId: Record<string, IPost>
    allIds: string[]
    loading: boolean
    error: string | null
    fetchPosts: (owner?: string) => Promise<void>
    fetchPost: (id: string) => Promise<void>
    addPost: (post: INewPost) => Promise<IPost>
    removePost: (id: string) => Promise<void>
    toggleLike: (postId: string, userId: string) => Promise<void>
}

function toMap(posts: IPost[]): { byId: Record<string, IPost>, allIds: string[] } {
    const byId: Record<string, IPost> = {}
    const allIds: string[] = []
    for (const post of posts) {
        byId[post._id] = post
        allIds.push(post._id)
    }
    return { byId, allIds }
}

export const usePostsStore = create<IPostsState>((set, get) => ({
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    fetchPosts: async (owner) => {
        set({ loading: true, error: null })
        try {
            const posts = await getPosts(owner)
            set({ ...toMap(posts) })
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load posts' })
        } finally {
            set({ loading: false })
        }
    },
    fetchPost: async (id) => {
        set({ loading: true, error: null })
        try {
            const post = await getPost(id)
            set((state) => ({
                byId: { ...state.byId, [post._id]: post },
                allIds: state.allIds.includes(post._id) ? state.allIds : [...state.allIds, post._id]
            }))
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load post' })
        } finally {
            set({ loading: false })
        }
    },
    addPost: async (post) => {
        const created = await apiCreatePost(post)
        set((state) => ({
            byId: { ...state.byId, [created._id]: created },
            allIds: [created._id, ...state.allIds]
        }))
        return created
    },
    removePost: async (id) => {
        await apiDeletePost(id)
        set((state) => {
            const byId = { ...state.byId }
            delete byId[id]
            return { byId, allIds: state.allIds.filter((postId) => postId !== id) }
        })
    },
    toggleLike: async (postId, userId) => {
        const current = get().byId[postId]
        if (!current) return
        const alreadyLiked = current.likedBy?.includes(userId) ?? false

        set((state) => {
            const post = state.byId[postId]
            if (!post) return state
            const likedBy = alreadyLiked
                ? (post.likedBy ?? []).filter((id) => id !== userId)
                : [...(post.likedBy ?? []), userId]
            return {
                byId: {
                    ...state.byId,
                    [postId]: {
                        ...post,
                        likes: Math.max(0, (post.likes ?? 0) + (alreadyLiked ? -1 : 1)),
                        likedBy
                    }
                }
            }
        })

        try {
            const result = await apiToggleLike(postId, userId)
            set((state) => {
                const post = state.byId[postId]
                if (!post) return state
                return { byId: { ...state.byId, [postId]: { ...post, likes: result.likes, likedBy: result.likedBy } } }
            })
        } catch {
            set((state) => {
                const post = state.byId[postId]
                if (!post) return state
                const likedBy = alreadyLiked
                    ? [...(post.likedBy ?? []), userId]
                    : (post.likedBy ?? []).filter((id) => id !== userId)
                return {
                    byId: {
                        ...state.byId,
                        [postId]: {
                            ...post,
                            likes: Math.max(0, (post.likes ?? 0) + (alreadyLiked ? 1 : -1)),
                            likedBy
                        }
                    }
                }
            })
        }
    }
}))
