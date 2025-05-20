import type { Metadata, Viewport } from 'next';
// import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import '@/styles/dialog-fullscreen.css'; // Ajout des styles fullscreen pour les dialogues
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Providers } from './providers';
import 'react-toastify/dist/ReactToastify.css';
import NotificationToast from '@/components/notifications/NotificationToast';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';
import { LayoutErrorFallback } from '@/components/Calendar/ErrorFallbacks';
import { ThemeProvider } from '@/context/ThemeContext';

// Police principale pour le texte
// const inter = Inter({
//     subsets: ['latin'],
//     display: 'swap',
//     variable: '--font-inter',
// });

// Police pour les titres et les éléments importants
// const montserrat = Montserrat({
//     subsets: ['latin'],
//     display: 'swap',
//     variable: '--font-montserrat',
//     weight: ['400', '500', '600', '700', '800'],
// });

export const metadata: Metadata = {
    title: 'Mathildanesth - Gestion des anesthésistes',
    description: 'Système de gestion des anesthésistes et du planning hospitalier',
    keywords: ['anesthésie', 'planning', 'hôpital', 'médical', 'gestion'],
    authors: [{ name: 'Équipe Mathildanesth' }],
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
        <html lang="fr">
            {/* <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}> */}
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
                                <div className="fixed bottom-4 right-4 z-50">
                                    <NotificationCenter />
                                </div>
                            </main>
                            <Footer />
                        </div>
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
