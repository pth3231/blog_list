import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMe, login as apiLogin, register as apiRegister } from '../lib/api'
import type { IPublicUser } from '../lib/types'

interface IAuthState {
    user: IPublicUser | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    init: () => Promise<void>
    login: (username: string, password: string) => Promise<void>
    register: (username: string, password: string) => Promise<void>
    logout: () => void
}

export const useAuthStore = create<IAuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            init: async (): Promise<void> => {
                const token = get().token
                if (!token) {
                    set({ loading: false })
                    return
                }
                set({ loading: true })
                try {
                    const user = await getMe()
                    set({ user, isAuthenticated: true })
                } catch {
                    localStorage.removeItem('token')
                    set({ user: null, token: null, isAuthenticated: false })
                } finally {
                    set({ loading: false })
                }
            },
            login: async (username: string, password: string): Promise<void> => {
                const result = await apiLogin(username, password)
                localStorage.setItem('token', result.token)
                set({ token: result.token, user: result.user, isAuthenticated: true })
            },
            register: async (username: string, password: string): Promise<void> => {
                const result = await apiRegister(username, password)
                localStorage.setItem('token', result.token)
                set({ token: result.token, user: result.user, isAuthenticated: true })
            },
            logout: (): void => {
                localStorage.removeItem('token')
                set({ token: null, user: null, isAuthenticated: false })
            }
        }),
        {
            name: 'blog-auth',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
        }
    )
)
