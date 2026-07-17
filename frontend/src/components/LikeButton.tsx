import { useState } from 'react'
import { likePost } from '../lib/api'

interface ILikeButtonProps {
    postId: string
    initialLikes: number
}

export default function LikeButton({ postId, initialLikes }: ILikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes)
    const [liked, setLiked] = useState(false)
    const [busy, setBusy] = useState(false)

    const handleClick = async () => {
        if (busy || liked) return
        setBusy(true)
        const previous = likes
        setLikes((current) => current + 1)
        setLiked(true)
        try {
            await likePost(postId, 1)
        } catch {
            setLikes(previous)
            setLiked(false)
        } finally {
            setBusy(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={busy || liked}
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
