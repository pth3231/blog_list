import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '@/lib/api'
import type { IPublicUser } from '@/lib/types'

interface IAuthState {
    user: IPublicUser | null
    isAuthenticated: boolean
    loading: boolean
    init: () => Promise<void>
    login: (username: string, password: string) => Promise<void>
    register: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

// Auth is carried by an httpOnly cookie (see lib/api.ts `credentials: include`),
// so nothing sensitive is persisted here — only a cached user object to avoid a
// flash of unauthed UI while `init()` reconfirms the session on load.
export const useAuthStore = create<IAuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            loading: true,
            init: async (): Promise<void> => {
                set({ loading: true })
                try {
                    const user = await getMe()
                    set({ user, isAuthenticated: true })
                } catch {
                    set({ user: null, isAuthenticated: false })
                } finally {
                    set({ loading: false })
                }
            },
            login: async (username: string, password: string): Promise<void> => {
                const result = await apiLogin(username, password)
                set({ user: result.user, isAuthenticated: true })
            },
            register: async (username: string, password: string): Promise<void> => {
                const result = await apiRegister(username, password)
                set({ user: result.user, isAuthenticated: true })
            },
            logout: async (): Promise<void> => {
                try {
                    await apiLogout()
                } catch {
                    // Even if the server call fails, clear local state.
                }
                set({ user: null, isAuthenticated: false })
            }
        }),
        {
            name: 'blog-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
        }
    )
)
