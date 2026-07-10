export type ServiceResult<T> =
    | { ok: true; value: T }
    | { ok: false; status: number; message: string }
