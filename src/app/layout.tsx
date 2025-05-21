import type { Metadata, Viewport } from 'next';
// Suppression de l'import des polices Next.js
// import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import '@/styles/dialog-fullscreen.css'; // Ajout des styles fullscreen pour les dialogues
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { Providers } from '@/app/providers';
import 'react-toastify/dist/ReactToastify.css';
// Correction du chemin d'importation de NotificationToast
import { NotificationToast } from '@/components/notifications/NotificationToast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LayoutErrorFallback } from '@/components/Calendar/ErrorFallbacks';
// Correction du chemin d'importation de ThemeProvider
import { ThemeProvider } from '@/context/ThemeContext';
// Import des composants clients pour les notifications
import { ClientNotificationCenter, ClientSimulationNotifications } from '@/components/notifications/ClientNotifications';

// Chargement dynamique des composants non critiques avec priorité
const Header = dynamic(() => import('@/components/Header'), {
    ssr: true,
    loading: () => <div className="h-16 bg-primary-100 animate-pulse"></div>
});

const Footer = dynamic(() => import('@/components/Footer'), {
    ssr: true,
    loading: () => <div className="h-10 bg-gray-100 animate-pulse"></div>
});

// Chargement dynamique et optimisé du préchargeur
const Prefetcher = dynamic(() => import('@/components/Prefetcher'), {
    ssr: false,
});

// Suppression des configurations de polices Next.js
// const inter = Inter({
//     subsets: ['latin'],
//     display: 'swap',
//     variable: '--font-inter',
// });

// const montserrat = Montserrat({
//     subsets: ['latin'],
//     display: 'swap',
//     variable: '--font-montserrat',
//     weight: ['400', '500', '600', '700', '800'],
// });

export const metadata: Metadata = {
    title: {
        default: 'Mathildanesth',
        template: '%s | Mathildanesth',
    },
    description: 'Gestion optimisée du personnel médical',
    keywords: [
        'Planning médical',
        'Gestion personnel hospitalier',
        'Planification anesthésistes',
        'Optimisation planning médical',
        'Gestion congés personnel médical',
    ],
    authors: [{ name: 'Équipe Mathildanesth' }],
    creator: 'Mathildanesth',
    viewport: {
        width: 'device-width',
        initialScale: 1,
    },
    robots: {
        index: false,
        follow: true,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-icon.png',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
    ]
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className="font-sans">
            <head>
                {/* DNS Prefetch pour les API externes */}
                <link rel="dns-prefetch" href="https://cdn.example.com" />
                <link rel="preconnect" href="https://cdn.example.com" />

                {/* Preload des assets critiques */}
                <link
                    rel="preload"
                    href="/fonts/custom-font.woff2"
                    as="font"
                    type="font/woff2"
                    crossOrigin="anonymous"
                />

                {/* Préchargement des scripts critiques */}
                <link
                    rel="modulepreload"
                    href="/_next/static/chunks/main.js"
                />
            </head>
            <body className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Providers>
                    <ThemeProvider>
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <main className="flex-grow container mx-auto px-4 py-8">
                                <ErrorBoundary
                                    fallbackComponent={LayoutErrorFallback}
                                >
                                    {children}
                                </ErrorBoundary>
                                <NotificationToast />
                                <ClientNotificationCenter />
                                <ClientSimulationNotifications />
                            </main>
                            <Footer />

                            {/* Préchargeur de routes et données */}
                            <Suspense fallback={null}>
                                <Prefetcher />
                            </Suspense>
                        </div>
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
