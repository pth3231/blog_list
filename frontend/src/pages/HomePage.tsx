import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePostsStore } from '../store/postsStore'
import PostCard from '../components/PostCard'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'
import type { ReactElement } from 'react'

export default function HomePage(): ReactElement {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const allIds = usePostsStore((state) => state.allIds)
    const byId = usePostsStore((state) => state.byId)
    const loading = usePostsStore((state) => state.loading)
    const error = usePostsStore((state) => state.error)
    const fetchPosts = usePostsStore((state) => state.fetchPosts)

    useEffect(() => {
        void fetchPosts()
    }, [fetchPosts])

    const handleDeleted = (id: string): void => {
        void usePostsStore.getState().removePost(id)
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Latest posts
                    </h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        A curated list of articles worth reading.
                    </p>
                </div>
                {isAuthenticated && (
                    <Link
                        to="/new"
                        className="self-start rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        + New Post
                    </Link>
                )}
            </div>

            {loading && <Spinner label="Loading posts…" />}
            {error && <Alert message={error} />}
            {!loading && !error && allIds.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">No posts yet.</p>
                    {isAuthenticated ? (
                        <Link to="/new" className="mt-3 inline-block font-medium text-brand-dark hover:underline dark:text-brand-light">
                            Be the first to add one →
                        </Link>
                    ) : (
                        <Link to="/login" className="mt-3 inline-block font-medium text-brand-dark hover:underline dark:text-brand-light">
                            Login to add a post →
                        </Link>
                    )}
                </div>
            )}

            {!loading && !error && allIds.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {allIds.map((id) => {
                        const post = byId[id]
                        return post ? (
                            <PostCard key={id} post={post} onDeleted={handleDeleted} />
                        ) : null
                    })}
                </div>
            )}
        </div>
    )
}
