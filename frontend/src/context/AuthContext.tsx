import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMe, login as apiLogin, register as apiRegister } from '../lib/api'
import type { IPublicUser } from '../lib/types'

interface IAuthContext {
    user: IPublicUser | null
    isAuthenticated: boolean
    loading: boolean
    login: (username: string, password: string) => Promise<void>
    register: (username: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<IAuthContext | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<IPublicUser | null>(null)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(() => localStorage.getItem('token') !== null)

    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        if (!storedToken) return
        getMe()
            .then((fetched) => {
                setUser(fetched)
                setToken(storedToken)
            })
            .catch(() => {
                localStorage.removeItem('token')
                setToken(null)
            })
            .finally(() => setLoading(false))
    }, [])

    const login = async (username: string, password: string) => {
        const result = await apiLogin(username, password)
        localStorage.setItem('token', result.token)
        setToken(result.token)
        setUser(result.user)
    }

    const register = async (username: string, password: string) => {
        const result = await apiRegister(username, password)
        localStorage.setItem('token', result.token)
        setToken(result.token)
        setUser(result.user)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated: Boolean(token), loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): IAuthContext {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}
