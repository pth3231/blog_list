export interface IAuthTokenPayload {
    sub: string
    username: string
}

export interface IPublicUser {
    id: string
    username: string
}

// Internal auth result — the route extracts `token` to set the httpOnly cookie
// and responds with only `user`. The token is never placed in a response body.
export interface IAuthResult {
    token: string
    user: IPublicUser
}
