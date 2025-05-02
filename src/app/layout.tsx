import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Providers } from './providers';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';
import { LayoutErrorFallback } from '@/components/Calendar/ErrorFallbacks';

// Police principale pour le texte
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

// Police pour les titres et les éléments importants
const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat',
    weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
    title: 'Mathildanesth - Gestion des anesthésistes',
    description: 'Système de gestion des anesthésistes et du planning hospitalier',
    keywords: ['anesthésie', 'planning', 'hôpital', 'médical', 'gestion'],
    authors: [{ name: 'Équipe Mathildanesth' }],
    viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
            <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
                <Providers>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow container mx-auto px-4 py-8">
                            <ErrorBoundary
                                fallbackComponent={LayoutErrorFallback}
                            >
                                {children}
                            </ErrorBoundary>
                            <ToastContainer
                                position="top-right"
                                autoClose={5000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="colored"
                                toastClassName="rounded-lg shadow-md"
                            />
                            <div className="fixed bottom-4 right-4 z-50">
                                <NotificationCenter />
                            </div>
                        </main>
                        <Footer />
                    </div>
                </Providers>

                {/* Script pour vérifier le thème système */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                    document.documentElement.classList.add('dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                }
                            } catch (_) {}
                        `,
                    }}
                />
            </body>
        </html>
    );
}
