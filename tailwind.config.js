/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                border: 'rgb(var(--border-rgb) / <alpha-value>)',
                background: 'rgb(var(--background-rgb) / <alpha-value>)',
                foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
                card: 'rgb(var(--card-rgb) / <alpha-value>)',
                'card-foreground': 'rgb(var(--card-foreground-rgb) / <alpha-value>)',
                primary: {
                    50: 'rgb(var(--primary-50) / <alpha-value>)',
                    100: 'rgb(var(--primary-100) / <alpha-value>)',
                    200: 'rgb(var(--primary-200) / <alpha-value>)',
                    300: 'rgb(var(--primary-300) / <alpha-value>)',
                    400: 'rgb(var(--primary-400) / <alpha-value>)',
                    500: 'rgb(var(--primary-500) / <alpha-value>)',
                    600: 'rgb(var(--primary-600) / <alpha-value>)',
                    700: 'rgb(var(--primary-700) / <alpha-value>)',
                    800: 'rgb(var(--primary-800) / <alpha-value>)',
                    900: 'rgb(var(--primary-900) / <alpha-value>)',
                },
                secondary: {
                    50: 'rgb(var(--secondary-50) / <alpha-value>)',
                    100: 'rgb(var(--secondary-100) / <alpha-value>)',
                    200: 'rgb(var(--secondary-200) / <alpha-value>)',
                    300: 'rgb(var(--secondary-300) / <alpha-value>)',
                    400: 'rgb(var(--secondary-400) / <alpha-value>)',
                    500: 'rgb(var(--secondary-500) / <alpha-value>)',
                    600: 'rgb(var(--secondary-600) / <alpha-value>)',
                    700: 'rgb(var(--secondary-700) / <alpha-value>)',
                    800: 'rgb(var(--secondary-800) / <alpha-value>)',
                    900: 'rgb(var(--secondary-900) / <alpha-value>)',
                },
                tertiary: {
                    50: 'rgb(var(--tertiary-50) / <alpha-value>)',
                    100: 'rgb(var(--tertiary-100) / <alpha-value>)',
                    200: 'rgb(var(--tertiary-200) / <alpha-value>)',
                    300: 'rgb(var(--tertiary-300) / <alpha-value>)',
                    400: 'rgb(var(--tertiary-400) / <alpha-value>)',
                    500: 'rgb(var(--tertiary-500) / <alpha-value>)',
                    600: 'rgb(var(--tertiary-600) / <alpha-value>)',
                    700: 'rgb(var(--tertiary-700) / <alpha-value>)',
                    800: 'rgb(var(--tertiary-800) / <alpha-value>)',
                    900: 'rgb(var(--tertiary-900) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'rgb(var(--muted-rgb) / <alpha-value>)',
                    foreground: 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
                },
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
            },
        },
    },
    plugins: [],
}; 