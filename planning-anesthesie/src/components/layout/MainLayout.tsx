import React, { ReactNode } from 'react';
import Link from 'next/link';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold">
                        Planning Anesthésie
                    </Link>
                    <nav className="hidden md:flex space-x-6">
                        <Link href="/planning" className="hover:text-blue-200 transition">
                            Planning
                        </Link>
                        <Link href="/gardes" className="hover:text-blue-200 transition">
                            Gardes
                        </Link>
                        <Link href="/conges" className="hover:text-blue-200 transition">
                            Congés
                        </Link>
                        <Link href="/utilisateurs" className="hover:text-blue-200 transition">
                            Utilisateurs
                        </Link>
                        <Link href="/statistiques" className="hover:text-blue-200 transition">
                            Statistiques
                        </Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button
                            className="p-2 rounded-full hover:bg-blue-700 transition"
                            aria-label="Notifications"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">
                            U
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 border-t">
                <div className="container mx-auto px-4 py-6 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Application de Planning Anesthésie - Tous droits réservés</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout; 