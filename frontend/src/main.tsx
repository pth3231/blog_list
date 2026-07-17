import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { useAuthStore } from './store/authStore.ts'

useAuthStore.getState().init()

const root = document.getElementById('root')
if (root === null) throw new Error('Root element "#root" was not found')

createRoot(root).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>
)
