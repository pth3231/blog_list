import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPost, deletePost } from '../lib/api'
import type { IPost } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import LikeButton from '../components/LikeButton'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { isAuthenticated } = useAuth()
    const [post, setPost] = useState<IPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let active = true
        getPost(id)
            .then((data) => {
                if (active) setPost(data)
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : 'Failed to load post')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [id])

    const handleDelete = async () => {
        if (!post || !window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
        try {
            await deletePost(post._id)
            window.location.assign('/')
        } catch (err) {
            window.alert(err instanceof Error ? err.message : 'Failed to delete post')
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-brand-light">
                ← Back to posts
            </Link>

            {loading && <Spinner label="Loading post…" />}
            {error && <Alert message={error} />}

            {!loading && !error && post && (
                <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        {post.title}
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        by <span className="font-medium text-slate-600 dark:text-slate-300">{post.author}</span>
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            Visit link
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <path d="M15 3h6v6M10 14L21 3" />
                            </svg>
                        </a>
                        <LikeButton postId={post._id} initialLikes={post.likes} />
                        {isAuthenticated && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </article>
            )}
        </div>
    )
}
