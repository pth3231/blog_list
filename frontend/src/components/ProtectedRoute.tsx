import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from './Spinner'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const loading = useAuthStore((state) => state.loading)
    const location = useLocation()

    if (loading) return <Spinner label="Checking session…" />

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return <>{children}</>
}
