export interface IPost {
    _id: string
    title: string
    author: string
    url: string
    likes: number
    likedBy?: string[]
    owner?: string | null
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

export interface IAuthResult {
    token: string
    user: IPublicUser
}

export interface INewPost {
    title: string
    author: string
    url: string
}
