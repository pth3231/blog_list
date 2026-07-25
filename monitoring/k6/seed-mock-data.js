// Seed mock posts + comments into the blog_list MongoDB so the read surface
// (GET /v1/posts, /v1/posts/:id, /v1/posts/:id/comments) has data to browse and
// load-test. Read-path data only — it does NOT touch the `users` collection.
//
// Run from the repo root (the app + mongo must be up):
//   docker exec -i blog-list-mongo mongosh --quiet blog_list \
//       < monitoring/k6/seed-mock-data.js
//
// Override the post count (mongosh reads process.env):
//   POST_COUNT=500 docker exec -i -e POST_COUNT=500 blog-list-mongo \
//       mongosh --quiet blog_list < monitoring/k6/seed-mock-data.js

const POST_COUNT = Number.parseInt(process.env.POST_COUNT || '200', 10)

const authors = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'grace']
const topics = ['javascript', 'typescript', 'react', 'node', 'docker', 'css',
    'devops', 'testing', 'postgres', 'graphql', 'rust', 'go', 'kubernetes']
const reactions = ['Great post!', 'I disagree slightly.', 'Thanks for sharing.',
    'Bookmarked.', 'Have you tried the opposite?', 'This saved me hours.',
    'Counterpoint: ...', 'Underrated take.']

const rnd = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rnd(arr.length)]
const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

// Replace only the mock-data collections. `users` is left intact.
const beforePosts = db.posts.countDocuments()
const beforeComments = db.comments.countDocuments()
const _deletedPosts = db.posts.deleteMany({})
const _deletedComments = db.comments.deleteMany({})

// Posts: varied title/author/url, a random like count, and createdAt spread over
// the last 60 days so the recency sort and pagination are exercised.
const posts = []
for (let i = 0; i < POST_COUNT; i++) {
    const author = pick(authors)
    const topic = pick(topics)
    const createdAt = new Date(now - rnd(60) * DAY)
    const likeCount = rnd(60)
    posts.push({
        title: `Mock post #${i + 1}: notes on ${topic}`,
        author,
        url: `https://example.com/blog/${topic}/${i + 1}`,
        likedBy: Array.from({ length: likeCount }, () => `mock-user-${rnd(9999)}`),
        owner: author,
        createdAt,
        updatedAt: createdAt
    })
}
const postRes = db.posts.insertMany(posts)
const postIds = Object.values(postRes.insertedIds)

// Comments: 1-3 per post, each referencing its post's _id.
const comments = []
for (let i = 0; i < postIds.length; i++) {
    const n = 1 + rnd(3)
    for (let j = 0; j < n; j++) {
        const when = new Date(now - rnd(30) * DAY)
        comments.push({
            post: postIds[i],
            author: pick(authors),
            content: `Mock comment ${j + 1} on post ${i + 1}: ${pick(reactions)}`,
            createdAt: when,
            updatedAt: when
        })
    }
}
const _commentRes = db.comments.insertMany(comments)

print('--- mock data seed complete ---')
print(`replaced: ${beforePosts} posts, ${beforeComments} comments`)
print(`inserted: ${posts.length} posts, ${comments.length} comments`)
print(`totals:   posts=${db.posts.countDocuments()}, comments=${db.comments.countDocuments()}, users=${db.users.countDocuments()} (untouched)`)
