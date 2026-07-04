import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true // Allows using 'describe' and 'it' without importing them
    },
    resolve: {
        alias: {
            '@/': './'
        }
    }
})
