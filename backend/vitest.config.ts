import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true, // Allows using 'describe' and 'it' without importing them
        env: {
            // Tests must not depend on a gitignored .env being present.
            JWT_SECRET: 'test_jwt_secret_change_me'
        },
        exclude: ['dist/**', 'node_modules/**']
    },
    resolve: {
        alias: {
            '@/': './'
        }
    }
})
