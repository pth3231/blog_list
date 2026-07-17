import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePostsStore } from '../store/postsStore'
import { getPostCount } from '../lib/api'
import PostCard from '../components/PostCard'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'
import type { ReactElement } from 'react'

export default function AuthorPage(): ReactElement {
    const { username } = useParams<{ username: string }>()
    const allIds = usePostsStore((state) => state.allIds)
    const byId = usePostsStore((state) => state.byId)
    const loading = usePostsStore((state) => state.loading)
    const error = usePostsStore((state) => state.error)
    const fetchPosts = usePostsStore((state) => state.fetchPosts)

    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        if (!username) return
        void fetchPosts(username)
        let active = true
        getPostCount(username)
            .then((value) => {
                if (active) setCount(value)
            })
            .catch(() => {
                if (active) setCount(null)
            })
        return () => {
            active = false
        }
    }, [username, fetchPosts])

    const handleDeleted = (id: string): void => {
        void usePostsStore.getState().removePost(id)
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-dark dark:text-slate-400 dark:hover:text-brand-light">
                ← Back to posts
            </Link>

            <div className="mb-8 mt-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{username}</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                    {count !== null ? `${count} ${count === 1 ? 'post' : 'posts'}` : 'Posts'}
                </p>
            </div>

            {loading && <Spinner label="Loading posts…" />}
            {error && <Alert message={error} />}
            {!loading && !error && allIds.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">No posts from this author yet.</p>
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
