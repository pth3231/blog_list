export interface IPost {
    title: string,
    author: string,
    url: string,
    likes?: number
    likedBy?: string[]
    owner?: string | null
}