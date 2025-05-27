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
            fontFamily: {
                sans: ['var(--font-sans)'],
                heading: ['var(--font-heading)'],
            },
            spacing: {
                'touch-target': '44px',
                'touch-target-lg': '48px',
                'touch-spacing': '8px',
            },
            colors: {
                // Design System Médical
                medical: {
                    // Garde (rouge) - Urgence, garde de nuit
                    guard: {
                        50: '#fef2f2',
                        100: '#fee2e2', 
                        200: '#fecaca',
                        300: '#fca5a5',
                        400: '#f87171',
                        500: '#ef4444',
                        600: '#dc2626',
                        700: '#b91c1c',
                        800: '#991b1b',
                        900: '#7f1d1d',
                    },
                    // Astreinte (orange) - Disponibilité
                    oncall: {
                        50: '#fffbeb',
                        100: '#fef3c7',
                        200: '#fde68a', 
                        300: '#fcd34d',
                        400: '#fbbf24',
                        500: '#f59e0b',
                        600: '#d97706',
                        700: '#b45309',
                        800: '#92400e',
                        900: '#78350f',
                    },
                    // Vacation (bleu) - Planifié, bloc opératoire
                    vacation: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        200: '#bfdbfe',
                        300: '#93c5fd',
                        400: '#60a5fa',
                        500: '#3b82f6',
                        600: '#2563eb',
                        700: '#1d4ed8',
                        800: '#1e40af',
                        900: '#1e3a8a',
                    },
                    // Repos (vert) - Congés, récupération
                    rest: {
                        50: '#f0fdf4',
                        100: '#dcfce7',
                        200: '#bbf7d0',
                        300: '#86efac',
                        400: '#4ade80',
                        500: '#22c55e',
                        600: '#16a34a',
                        700: '#15803d',
                        800: '#166534',
                        900: '#14532d',
                    },
                    // États critiques
                    emergency: {
                        50: '#fdf2f8',
                        100: '#fce7f3',
                        200: '#fbcfe8',
                        300: '#f9a8d4',
                        400: '#f472b6',
                        500: '#ec4899',
                        600: '#db2777',
                        700: '#be185d',
                        800: '#9d174d',
                        900: '#831843',
                    },
                },
                // États système médicaux
                status: {
                    confirmed: '#22c55e',  // Vert - Confirmé
                    pending: '#f59e0b',    // Orange - En attente
                    urgent: '#ef4444',     // Rouge - Urgent
                    normal: '#6b7280',     // Gris - Normal
                    cancelled: '#6b7280',  // Gris - Annulé
                },
                // Couleurs existantes maintenues
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
                'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'urgent': '0 0 0 3px rgba(239, 68, 68, 0.1), 0 4px 6px -1px rgba(239, 68, 68, 0.2)',
            },
            fontSize: {
                // Mobile-first typography - 16px minimum pour lisibilité mobile
                'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
                'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - Base mobile
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
            },
            borderRadius: {
                'medical': '8px',     // Coins arrondis médicaux standards
                'medical-lg': '12px', // Pour cards importantes
                'medical-xl': '16px', // Pour modals
            },
            animation: {
                'pulse-medical': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-up': 'slideUp 0.2s ease-out',
                'slide-down': 'slideDown 0.2s ease-out',
                'fade-in': 'fadeIn 0.15s ease-out',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}; 