/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            indigo: {
                50: '#fff7ed', // orange-50
                100: '#ffedd5', // orange-100
                200: '#fed7aa', // orange-200
                300: '#fdba74', // orange-300
                400: '#fb923c', // orange-400
                500: '#f97316', // orange-500
                600: '#ea580c', // orange-600 (Primary solid fallback)
                700: '#c2410c', // orange-700
                800: '#9a3412', // orange-800
                900: '#7c2d12', // orange-900
                950: '#431407', // orange-950
            }
        },
    },
    plugins: [],
}
