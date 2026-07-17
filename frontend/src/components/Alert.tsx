export default function Alert({ message, variant = 'error' }: { message: string; variant?: 'error' | 'success' | 'info' }) {
    const styles = {
        error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
        success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300',
        info: 'border-brand-light bg-brand-soft text-brand-dark dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
    }[variant]

    return (
        <div role="alert" className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
            {message}
        </div>
    )
}
