import { Link } from 'react-router-dom'
import type { ReactElement } from 'react'

export default function NotFoundPage(): ReactElement {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
            <p className="text-6xl font-bold text-brand">404</p>
            <h1 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Page not found
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
                The page you are looking for does not exist.
            </p>
            <Link
                to="/"
                className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
                Back to home
            </Link>
        </div>
    )
}
