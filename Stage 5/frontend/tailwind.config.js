/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ramiRed: '#DC1B20',
                ramiDark: '#404040',
                ramiWhite: '#FFFFFF',
                ramiGray: '#F3F4F6',
            },
            keyframes: {
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(40px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                }
            },
            animation: {
                slideIn: 'slideIn 0.3s ease-out',
            }
        },
    },
    plugins: [],
}