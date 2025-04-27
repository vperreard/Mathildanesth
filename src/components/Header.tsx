'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { memo } from 'react';
import AdminRequestsBanner from './AdminRequestsBanner';
import Navigation from './navigation/Navigation';
import UserProfile from './user/UserProfile';
import { LoginForm } from './auth/LoginForm';
import { navigationLinks, adminLinks } from '@/utils/navigationConfig';

const fadeIn = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const Header = memo(function Header() {
    const { user, isLoading, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = Boolean(user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL'));

    // Filtrer les liens de navigation en fonction des droits d'administrateur
    const navLinks = useMemo(() => {
        return navigationLinks.filter(link => {
            // Si c'est un lien admin, vérifier les droits
            if (adminLinks.includes(link.href)) {
                return isAdmin;
            }
            return true;
        });
    }, [isAdmin]);

    const toggleMobileMenu = useMemo(() => () => setMobileMenuOpen(!mobileMenuOpen), [mobileMenuOpen]);

    return (
        <>
            <header
                className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm"
                role="banner"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            className="flex-shrink-0"
                        >
                            <Link
                                href="/"
                                className="flex items-center space-x-2 group"
                                aria-label="Accueil Mathildanesth"
                            >
                                <div className="w-9 h-9 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 transform group-hover:scale-105" aria-hidden="true">
                                    <span className="text-white font-bold text-lg">M</span>
                                </div>
                                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent transition-all duration-300">Mathildanesth</h1>
                            </Link>
                        </motion.div>

                        <div className="flex items-center justify-end flex-1 space-x-4">
                            {/* Navigation */}
                            {!isLoading && user && (
                                <Navigation
                                    links={navLinks}
                                    isAdmin={isAdmin}
                                    mobileMenuOpen={mobileMenuOpen}
                                    onMobileMenuToggle={toggleMobileMenu}
                                />
                            )}

                            {/* User section */}
                            <motion.div
                                className="hidden md:flex items-center"
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                                role="region"
                                aria-label="Profil utilisateur"
                            >
                                {isLoading ? (
                                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" aria-label="Chargement du profil" role="status"></div>
                                ) : user ? (
                                    <UserProfile user={user} onLogout={logout} />
                                ) : (
                                    <LoginForm idPrefix="header-" />
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>
            <AdminRequestsBanner />
        </>
    );
});

export default Header; 