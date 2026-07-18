import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import AuthorPage from './pages/AuthorPage'
import CreatePostPage from './pages/CreatePostPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import type { ReactElement } from 'react'

export default function App(): ReactElement {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/posts/:id" element={<PostDetailPage />} />
                        <Route path="/users/:username" element={<AuthorPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/new"
                            element={
                                <ProtectedRoute>
                                    <CreatePostPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </ErrorBoundary>
            </main>
            <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
                Blog List — built with React, Tailwind CSS & a tiny Express API.
            </footer>
        </div>
    )
}
