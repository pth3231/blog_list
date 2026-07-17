export interface IPost {
    _id: string
    title: string
    author: string
    url: string
    likes: number
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
