import type { Metadata, Viewport } from 'next';
// Suppression de l'import des polices Next.js
// import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import '@/styles/dialog-fullscreen.css'; // Ajout des styles fullscreen pour les dialogues
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
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
// Import du wrapper client pour le préchargeur
import ClientPrefetcherWrapper from '@/components/ClientPrefetcherWrapper';
// Import du tracker de performance client
import ClientPerformanceTracker from '@/components/ClientPerformanceTracker';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

// Chargement dynamique des composants non critiques avec priorité
const Header = dynamic(() => import('@/components/Header'), {
    ssr: true,
    loading: () => <div className="h-16 bg-primary-100 animate-pulse"></div>
});

const Footer = dynamic(() => import('@/components/Footer'), {
    ssr: true,
    loading: () => <div className="h-10 bg-gray-100 animate-pulse"></div>
});

// Suppression du préchargeur chargé dynamiquement (déplacé dans le composant client)

// Suppression des configurations de polices Next.js
const inter = Inter({ subsets: ['latin'] });

// const montserrat = Montserrat({
//     subsets: ['latin'],
//     display: 'swap',
//     variable: '--font-montserrat',
//     weight: ['400', '500', '600', '700', '800'],
// });

export const metadata: Metadata = {
    title: {
        default: 'MATHILDA',
        template: '%s | MATHILDA'
    },
    description: 'Système de gestion des plannings et congés pour établissements de santé',
    keywords: ['planning', 'santé', 'hôpital', 'congés', 'médecin'],
    authors: [{ name: 'MATHILDA Team' }],
    creator: 'MATHILDA',
    publisher: 'MATHILDA',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: '/',
        title: 'MATHILDA',
        description: 'Système de gestion des plannings et congés pour établissements de santé',
        siteName: 'MATHILDA',
    },
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' }
    ]
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={inter.className}>
            <head>
                {/* Preconnect aux domaines externes pour améliorer les performances */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

                {/* Préchargement des ressources critiques */}
                <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />

                {/* DNS prefetch pour les domaines potentiels */}
                <link rel="dns-prefetch" href="//api.mathilda.com" />

                {/* Resource hints pour les performances */}
                <link rel="prefetch" href="/api/auth/me" />
                <link rel="prefetch" href="/auth/login" />
            </head>
            <body className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <AuthProvider>
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

                                {/* Préchargeur de routes et données via un wrapper client */}
                                <ClientPrefetcherWrapper />

                                {/* Tracker de performance */}
                                <ClientPerformanceTracker />

                                <ServiceWorkerRegistration />
                            </div>
                        </ThemeProvider>
                    </Providers>
                </AuthProvider>
            </body>
        </html>
    );
}
