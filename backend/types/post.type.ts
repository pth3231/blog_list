export interface IPost {
    title: string
    author: string
    url: string
    likedBy?: string[]
    owner?: string | null
    createdAt?: Date
    updatedAt?: Date
}

// API response shape. `likedByMe` is `null` for anonymous requests (no way to
// know) and a real boolean when authenticated. The full `likedBy` user-id list
// is never exposed — only the count and "did I like it".
export interface IPostView {
    _id: string
    title: string
    author: string
    url: string
    likes: number
    likedByMe: boolean | null
    owner: string | null
    createdAt: string
}

export interface ILikeState {
    likes: number
    likedByMe: boolean
}

// Fields a client may submit when creating a post. The server supplies owner.
export interface INewPost {
    title: string
    author: string
    url: string
}
