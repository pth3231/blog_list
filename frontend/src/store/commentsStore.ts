import { create } from 'zustand'
import { addComment as apiAddComment, getComments as apiGetComments } from '../lib/api'
import type { IComment } from '../lib/types'

interface ICommentsState {
    byPostId: Record<string, IComment[]>
    loading: Record<string, boolean>
    error: Record<string, string | null>
    fetchComments: (postId: string) => Promise<void>
    addComment: (postId: string, content: string) => Promise<void>
}

export const useCommentsStore = create<ICommentsState>((set) => ({
    byPostId: {},
    loading: {},
    error: {},
    fetchComments: async (postId) => {
        set((state) => ({ loading: { ...state.loading, [postId]: true }, error: { ...state.error, [postId]: null } }))
        try {
            const comments = await apiGetComments(postId)
            set((state) => ({ byPostId: { ...state.byPostId, [postId]: comments } }))
        } catch (err) {
            set((state) => ({ error: { ...state.error, [postId]: err instanceof Error ? err.message : 'Failed to load comments' } }))
        } finally {
            set((state) => ({ loading: { ...state.loading, [postId]: false } }))
        }
    },
    addComment: async (postId, content) => {
        const created = await apiAddComment(postId, content)
        set((state) => ({
            byPostId: { ...state.byPostId, [postId]: [...(state.byPostId[postId] ?? []), created] }
        }))
    }
}))
