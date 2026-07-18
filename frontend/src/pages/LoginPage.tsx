import { useState, type SubmitEventHandler } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Alert from '@/components/Alert'
import type { ReactElement } from 'react'

interface ILocationState {
    from?: string
}

export default function LoginPage(): ReactElement {
    const login = useAuthStore((state) => state.login)
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as ILocationState | null)?.from ?? '/'

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault()
        setError(null)
        if (!username.trim() || !password) return setError('Username and password are required.')

        setSubmitting(true)
        try {
            await login(username.trim(), password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto flex max-w-md flex-col px-4 py-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    Welcome back
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Login to manage your posts.
                </p>

                {error && (
                    <div className="mt-5">
                        <Alert message={error} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Logging in…' : 'Login'}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                    No account?{' '}
                    <Link to="/register" className="font-medium text-brand-dark hover:underline dark:text-brand-light">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
