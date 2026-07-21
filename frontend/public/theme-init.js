// Applied before paint (loaded synchronously in <head>) to set the saved theme
// and avoid a flash of the wrong theme. Kept external (not inline) so the CSP
// can stay strict (`script-src 'self'`) with no inline-script hash to maintain —
// edit this file freely, the policy never needs updating.
(function () {
    try {
        const stored = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (stored === 'dark' || (!stored && prefersDark)) {
            document.documentElement.classList.add('dark')
        }
    } catch (e) {}
})()
