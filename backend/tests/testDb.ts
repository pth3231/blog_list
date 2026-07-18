export function uniqueDbUri(suffix: string): string {
    const base = process.env['TEST_MONGODB_URI'] ?? 'mongodb://localhost:27017/blog_list_test'
    const url = new URL(base)
    const db = url.pathname.replace(/^\//, '') || 'blog_list_test'
    url.pathname = `/${db}_${suffix}`
    return url.toString()
}
