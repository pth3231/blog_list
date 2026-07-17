import { Link } from 'react-router-dom'
import type { IPost } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { deletePost } from '../lib/api'
import LikeButton from './LikeButton'

interface IPostCardProps {
    post: IPost
    onDeleted: (id: string) => void
}

export default function PostCard({ post, onDeleted }: IPostCardProps) {
    const { isAuthenticated } = useAuth()

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
        try {
            await deletePost(post._id)
            onDeleted(post._id)
        } catch (err) {
            window.alert(err instanceof Error ? err.message : 'Failed to delete post')
        }
    }

    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-800 dark:text-slate-100">
                        <Link to={`/posts/${post._id}`} className="hover:text-brand-dark dark:hover:text-brand-light">
                            {post.title}
                        </Link>
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        by <span className="font-medium text-slate-600 dark:text-slate-300">{post.author}</span>
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        aria-label="Delete post"
                        title="Delete post"
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6M14 11v6" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between">
                <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline dark:text-brand-light"
                >
                    Visit link
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <path d="M15 3h6v6M10 14L21 3" />
                    </svg>
                </a>
                <LikeButton postId={post._id} initialLikes={post.likes} />
            </div>
        </article>
    )
}
