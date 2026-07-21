// Loaded synchronously in <head> to set the saved theme before paint (no flash).
// External so the CSP stays strict (`script-src 'self'`) with no inline hash.
(function () {
    try {
        const stored = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (stored === 'dark' || (!stored && prefersDark)) {
            document.documentElement.classList.add('dark')
        }
    } catch (e) {}
})()
