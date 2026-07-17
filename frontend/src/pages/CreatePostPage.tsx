import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePostsStore } from '../store/postsStore'
import Alert from '../components/Alert'
import type { ReactElement } from 'react'

function validateUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

export default function CreatePostPage(): ReactElement {
    const user = useAuthStore((state) => state.user)
    const addPost = usePostsStore((state) => state.addPost)
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState(user?.username ?? '')
    const [url, setUrl] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent): Promise<void> => {
        event.preventDefault()
        setError(null)

        if (!title.trim()) return setError('Title is required.')
        if (!author.trim()) return setError('Author is required.')
        if (!validateUrl(url.trim())) return setError('A valid http(s) URL is required.')

        setSubmitting(true)
        try {
            await addPost({ title: title.trim(), author: author.trim(), url: url.trim() })
            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-xl px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                New post
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
                Share an article you found interesting.
            </p>

            {error && (
                <div className="mt-6">
                    <Alert message={error} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="An insightful article about…"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                </div>

                <div>
                    <label htmlFor="author" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Author
                    </label>
                    <input
                        id="author"
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Author name"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                </div>

                <div>
                    <label htmlFor="url" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        URL
                    </label>
                    <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Link
                        to="/"
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Publishing…' : 'Publish post'}
                    </button>
                </div>
            </form>
        </div>
    )
}
