export interface IAuthTokenPayload {
    sub: string
    username: string
}

export interface IPublicUser {
    id: string
    username: string
}

export interface IAuthResult {
    token: string
    user: IPublicUser
}
