import { useEffect, useState, type SubmitEventHandler, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCommentsStore } from '@/store/commentsStore'
import type { IComment } from '@/lib/types'
import Spinner from './Spinner'
import Alert from './Alert'

const EMPTY_COMMENTS: IComment[] = []

interface ICommentSectionProps {
    postId: string
}

function formatDate(value: string): string | null {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function CommentSection({ postId }: ICommentSectionProps): ReactElement {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const comments = useCommentsStore((state) => state.byPostId[postId] ?? EMPTY_COMMENTS)
    const loading = useCommentsStore((state) => state.loading[postId] ?? false)
    const error = useCommentsStore((state) => state.error[postId] ?? null)
    const fetchComments = useCommentsStore((state) => state.fetchComments)
    const addComment = useCommentsStore((state) => state.addComment)

    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        void fetchComments(postId)
    }, [postId, fetchComments])

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault()
        setFormError(null)
        const trimmed = content.trim()
        if (!trimmed) return setFormError('Comment cannot be empty.')

        setSubmitting(true)
        try {
            await addComment(postId, trimmed)
            setContent('')
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to add comment')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Comments {comments.length > 0 && <span className="text-slate-400">({comments.length})</span>}
            </h2>

            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        placeholder="Add a comment…"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formError && <Alert message={formError} />}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Posting…' : 'Post comment'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    <Link to="/login" className="font-medium text-brand-dark hover:underline dark:text-brand-light">
                        Login
                    </Link>{' '}
                    to join the discussion.
                </p>
            )}

            <div className="mt-6 space-y-4">
                {loading && <Spinner label="Loading comments…" />}
                {error && <Alert message={error} />}
                {!loading && !error && comments.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet. Be the first to comment.</p>
                )}
                {!loading &&
                    comments.map((comment) => (
                        <div
                            key={comment._id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{comment.author}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comment.createdAt) ?? ''}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                        </div>
                    ))}
            </div>
        </section>
    )
}
