import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
// Police principale pour le texte
var inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});
// Police pour les titres et les éléments importants
var montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat',
    weight: ['400', '500', '600', '700', '800'],
});
export var metadata = {
    title: 'Mathildanesth - Gestion des anesthésistes',
    description: 'Système de gestion des anesthésistes et du planning hospitalier',
    keywords: ['anesthésie', 'planning', 'hôpital', 'médical', 'gestion'],
    authors: [{ name: 'Équipe Mathildanesth' }],
    viewport: 'width=device-width, initial-scale=1',
};
export default function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="fr" className={"".concat(inter.variable, " ").concat(montserrat.variable)}>
            <body className={"".concat(inter.className, " flex flex-col min-h-screen bg-gray-50")}>
                <AuthProvider>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow">
                            {children}
                            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" toastClassName="rounded-lg shadow-md"/>
                        </main>
                        <Footer />
                    </div>
                </AuthProvider>

                {/* Script pour vérifier le thème système */}
                <script dangerouslySetInnerHTML={{
            __html: "\n                            try {\n                                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {\n                                    document.documentElement.classList.add('dark');\n                                } else {\n                                    document.documentElement.classList.remove('dark');\n                                }\n                            } catch (_) {}\n                        ",
        }}/>
            </body>
        </html>);
}
