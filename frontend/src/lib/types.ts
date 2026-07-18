export interface IPost {
    _id: string
    title: string
    author: string
    url: string
    likes: number
    likedByMe: boolean | null
    owner: string | null
    createdAt: string
}

export interface IComment {
    _id: string
    post: string
    author: string
    content: string
    createdAt: string
}

export interface IPublicUser {
    id: string
    username: string
}

// The token lives in an httpOnly cookie set by the server, so the client only
// ever sees the user object — never the token itself.
export interface IAuthResult {
    user: IPublicUser
}

export interface ILikeState {
    likes: number
    likedByMe: boolean
}

export interface INewPost {
    title: string
    author: string
    url: string
}
