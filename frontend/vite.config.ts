import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/v1': {
                // Local dev -> http://localhost:3000 (backend on the host).
                // Under docker compose -> http://app:3000 (set VITE_DEV_PROXY_TARGET).
                target: process.env['VITE_DEV_PROXY_TARGET'] ?? 'http://localhost:3000',
                changeOrigin: true
            }
        },
        watch: {
            // inotify propagates over bind mounts on native Linux; enable polling
            // only under Docker Desktop (macOS/Windows) where it does not.
            usePolling: process.env['VITE_DEV_WATCH_POLLING'] === 'true'
        }
    }
})
