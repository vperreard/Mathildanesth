'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function Header() {
    const { user, logout, isLoading } = useAuth();

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    return (
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">M</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Mathildanesth</h1>
                    </Link>
                    <div className="flex items-center space-x-8">
                        {!isLoading && user && (
                            <nav className="hidden md:flex space-x-8">
                                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Accueil</Link>
                                <Link href="/planning" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Planning</Link>
                                <Link href="/calendar" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Calendrier</Link>
                                <Link href="/leaves" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Congés</Link>
                                <Link href="/statistiques" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Statistiques</Link>
                                {isAdmin && (
                                    <Link href="/parametres" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Paramètres</Link>
                                )}
                            </nav>
                        )}
                        <div className="flex items-center space-x-4">
                            {isLoading ? (
                                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                            ) : user ? (
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-700">Connecté : {user.prenom} {user.nom}</span>
                                    <Link href="/profil" className="text-sm text-gray-500 hover:text-indigo-600">Profil</Link>
                                    <button
                                        onClick={logout}
                                        className="px-3 py-1.5 text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md shadow-sm hover:shadow-lg transition-all duration-300"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
} 