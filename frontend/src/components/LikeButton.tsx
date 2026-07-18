import { usePostsStore } from '@/store/postsStore'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import type { ReactElement } from 'react'

interface ILikeButtonProps {
    postId: string
}

export default function LikeButton({ postId }: ILikeButtonProps): ReactElement {
    const likes = usePostsStore((state) => state.byId[postId]?.likes ?? 0)
    const likedByMe = usePostsStore((state) => state.byId[postId]?.likedByMe ?? null)
    const toggleLike = usePostsStore((state) => state.toggleLike)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    const liked = likedByMe === true

    const handleClick = (): void => {
        void toggleLike(postId)
    }

    if (!isAuthenticated) {
        return (
            <Link
                to="/login"
                title="Login to like"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand hover:text-brand-dark dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{likes}</span>
            </Link>
        )
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                liked
                    ? 'border-brand bg-brand-soft text-brand-dark dark:border-brand/40 dark:bg-brand/10 dark:text-brand-light'
                    : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand-dark dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likes}</span>
        </button>
    )
}
