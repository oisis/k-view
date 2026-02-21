/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        'theme-default',
        'theme-light',
        'theme-black',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
