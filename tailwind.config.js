/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'rgb(238, 242, 255)',
                    100: 'rgb(224, 231, 255)',
                    200: 'rgb(199, 210, 254)',
                    300: 'rgb(165, 180, 252)',
                    400: 'rgb(129, 140, 248)',
                    500: 'rgb(99, 102, 241)',
                    600: 'rgb(79, 70, 229)',
                    700: 'rgb(67, 56, 202)',
                    800: 'rgb(55, 48, 163)',
                    900: 'rgb(49, 46, 129)',
                },
                secondary: {
                    500: 'rgb(217, 70, 239)',
                    600: 'rgb(192, 38, 211)',
                },
                tertiary: {
                    500: 'rgb(236, 72, 153)',
                    600: 'rgb(219, 39, 119)',
                },
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
            },
        },
    },
    plugins: [],
}; 