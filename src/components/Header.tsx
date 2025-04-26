'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import AdminRequestsBanner from './AdminRequestsBanner';
import Navigation from './navigation/Navigation';
import UserProfile from './user/UserProfile';
import { LoginForm } from './auth/LoginForm';

export default function Header() {
    const { user, isLoading, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = Boolean(user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL'));

    const navLinks = [
        { href: '/', label: 'Accueil' },
        { href: '/planning/hebdomadaire', label: 'Planning' },
        { href: '/calendar', label: 'Calendrier' },
        { href: '/leaves', label: 'Congés' },
        { href: '/statistiques', label: 'Statistiques' },
        { href: '/parametres', label: 'Paramètres' },
        ...(isAdmin ? [
            { href: '/parametres/configuration', label: 'Configuration' }
        ] : []),
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <>
            <header className="bg-white/90 backdrop-blur-lg shadow-soft sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                        >
                            <Link href="/" className="flex items-center space-x-2 group">
                                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                                    <span className="text-white font-bold text-xl">M</span>
                                </div>
                                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent transition-all duration-300 transform group-hover:translate-x-1">Mathildanesth</h1>
                            </Link>
                        </motion.div>

                        {/* Navigation */}
                        {!isLoading && user && (
                            <Navigation
                                links={navLinks}
                                isAdmin={isAdmin}
                                mobileMenuOpen={mobileMenuOpen}
                                onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                            />
                        )}

                        {/* User section */}
                        <motion.div
                            className="hidden md:flex items-center"
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                        >
                            {isLoading ? (
                                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                            ) : user ? (
                                <UserProfile user={user} onLogout={logout} />
                            ) : (
                                <LoginForm />
                            )}
                        </motion.div>
                    </div>
                </div>
            </header>
            <AdminRequestsBanner />
        </>
    );
} 