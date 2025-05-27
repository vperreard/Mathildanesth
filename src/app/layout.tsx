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
// Import du layout responsive médical
import { ProductionLayout } from '@/components/layout/ProductionLayout';

// Suppression des imports dynamiques non utilisés dans le nouveau layout responsive

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
        default: 'Mathildanesth - Planning Médical',
        template: '%s | Mathildanesth'
    },
    description: 'Système de gestion des plannings et congés pour établissements de santé',
    keywords: ['planning', 'santé', 'hôpital', 'congés', 'médecin', 'anesthésie', 'bloc opératoire'],
    authors: [{ name: 'Mathildanesth Team' }],
    creator: 'Mathildanesth',
    publisher: 'Mathildanesth',
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
        title: 'Mathildanesth - Planning Médical',
        description: 'Système de gestion des plannings et congés pour établissements de santé',
        siteName: 'Mathildanesth',
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
        { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
        { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
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
                <link rel="prefetch" href="/auth/connexion" />
            </head>
            <body className="transition-colors duration-300">
                <AuthProvider>
                    <Providers>
                        <ThemeProvider>
                            <ProductionLayout>
                                <ErrorBoundary
                                    fallbackComponent={LayoutErrorFallback}
                                >
                                    {children}
                                </ErrorBoundary>
                                
                                {/* Notifications et composants globaux */}
                                <NotificationToast />
                                <ClientNotificationCenter />
                                <ClientSimulationNotifications />
                                
                                {/* Préchargeur de routes et données via un wrapper client */}
                                <ClientPrefetcherWrapper />

                                {/* Tracker de performance */}
                                <ClientPerformanceTracker />

                                <ServiceWorkerRegistration />
                            </ProductionLayout>
                        </ThemeProvider>
                    </Providers>
                </AuthProvider>
            </body>
        </html>
    );
}
