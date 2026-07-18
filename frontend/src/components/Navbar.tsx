import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ThemeToggle from './ThemeToggle'
import type { ReactElement } from 'react'

export default function Navbar(): ReactElement {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const navigate = useNavigate()

    const handleLogout = async (): Promise<void> => {
        await logout()
        navigate('/')
    }

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 font-bold text-brand-dark dark:text-brand-light">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    </span>
                    <span className="text-lg tracking-tight">Blog List</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4">
                    <Link
                        to="/"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-brand-dark dark:text-slate-300 dark:hover:text-brand-light"
                    >
                        Home
                    </Link>
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/new"
                                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                            >
                                New Post
                            </Link>
                            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
                                Hi, <span className="font-medium text-slate-700 dark:text-slate-200">{user?.username}</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            Login
                        </Link>
                    )}
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    )
}
