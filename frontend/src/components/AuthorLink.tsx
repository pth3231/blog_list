import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPostCount } from '../lib/api'
import type { ReactElement } from 'react'

interface IAuthorLinkProps {
    author: string
    owner: string | null
}

export default function AuthorLink({ author, owner }: IAuthorLinkProps): ReactElement {
    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        if (!owner) return
        let active = true
        getPostCount(owner)
            .then((value) => {
                if (active) setCount(value)
            })
            .catch(() => {
                if (active) setCount(null)
            })
        return () => {
            active = false
        }
    }, [owner])

    const countLabel = count !== null ? ` · ${count} ${count === 1 ? 'post' : 'posts'}` : ''

    if (!owner) {
        return (
            <span className="font-medium text-slate-600 dark:text-slate-300">{author}</span>
        )
    }

    return (
        <span>
            <Link
                to={`/users/${owner}`}
                className="font-medium text-slate-600 transition hover:text-brand-dark hover:underline dark:text-slate-300 dark:hover:text-brand-light"
            >
                {author}
            </Link>
            {countLabel}
        </span>
    )
}
