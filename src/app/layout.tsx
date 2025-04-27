import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { NotificationProvider } from '@/components/ui/notification';
import { RuleViolationsProvider } from '@/hooks/useRuleViolations';

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
                <AuthProvider>
                    <NotificationProvider>
                        <UnsavedChangesProvider>
                            <RuleViolationsProvider>
                                <div className="flex flex-col min-h-screen">
                                    <Header />
                                    <main className="flex-grow">
                                        {children}
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
                                    </main>
                                    <Footer />
                                </div>
                            </RuleViolationsProvider>
                        </UnsavedChangesProvider>
                    </NotificationProvider>
                </AuthProvider>

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
