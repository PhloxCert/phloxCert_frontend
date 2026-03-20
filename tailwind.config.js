/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./*.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'phlox-red': '#be123c', // Professional Crimson (Rose-700)
                'phlox-navy': '#0f172a', // Slate-900
                'phlox-orange': '#f59e0b', // Amber-500
                'iota-green': '#10B981', // Kept for success states
                'iota-blue': '#3B82F6', // Kept for info states
            }
        },
    },
    plugins: [],
}
