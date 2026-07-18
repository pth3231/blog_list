import { Component, type ReactNode } from 'react'

interface IErrorBoundaryProps {
    children: ReactNode
}

interface IErrorBoundaryState {
    error: Error | null
}

// Catches render-time errors anywhere below it so a single throwing component
// doesn't blank the whole app to a white screen.
export default class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
    state: IErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: Error): IErrorBoundaryState {
        return { error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }): void {
        console.error('Unhandled UI error:', error, info.componentStack)
    }

    handleReload = (): void => {
        this.setState({ error: null })
        window.location.reload()
    }

    render(): ReactNode {
        if (this.state.error !== null) {
            return (
                <div className="mx-auto max-w-md px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Something went wrong
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        An unexpected error occurred while rendering this page.
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReload}
                        className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        Reload
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
