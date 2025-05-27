'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { memo } from 'react';
import AdminRequestsBanner from './AdminRequestsBanner';
import Navigation from './navigation/Navigation';
import UserProfile from './user/UserProfile';
import { HeaderLoginForm } from './auth/HeaderLoginForm';
import { navigationLinks, adminLinks } from '@/utils/navigationConfig';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';
import { useAppearance } from '@/hooks/useAppearance';
import { NotificationBell } from './notifications/NotificationBell';
import { RuleNotificationBell } from './rules/RuleNotificationBell';

const fadeIn = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const Header = memo(function Header() {
    const { user, isLoading, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();
    const { preferences } = useAppearance();

    // Éviter les problèmes d'hydratation
    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    // Définir le style du fond pastel en fonction du thème et des préférences
    const headerStyle = {
        background: theme === 'dark'
            ? 'linear-gradient(to right, rgba(30, 41, 59, 1), rgba(36, 47, 67, 0.95), rgba(30, 41, 59, 1))'
            : 'linear-gradient(to right, rgba(246, 249, 255, 1), rgba(232, 240, 254, 0.92), rgba(245, 225, 255, 0.92), rgba(255, 235, 246, 1))'
    };

    // Déterminer la classe CSS pour le style d'en-tête
    const headerClass = preferences?.header?.style
        ? `header-${preferences.header.style}`
        : '';

    // Déterminer si l'en-tête doit être sticky
    const stickyClass = preferences?.header?.sticky === false
        ? ''
        : 'sticky';

    return (
        <>
            <header
                className={`${stickyClass} top-0 z-50 border-b border-gray-100 dark:border-slate-700 shadow-sm transition-colors duration-300 ${headerClass}`}
                role="banner"
                style={preferences?.header?.style === 'gradient' ? headerStyle : undefined}
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
                                <div className="w-9 h-9 bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 transform group-hover:scale-105" aria-hidden="true">
                                    <span className="text-white font-bold text-lg">M</span>
                                </div>
                                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent transition-all duration-300 dark:text-gray-100 dark:bg-clip-text dark:bg-gradient-to-r dark:from-primary-500 dark:via-primary-400 dark:to-primary-300">
                                    Mathildanesth
                                </h1>
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
                                className="hidden md:flex items-center space-x-2"
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                                role="region"
                                aria-label="Profil utilisateur et options"
                            >
                                <ThemeSwitcher />
                                
                                {/* Notification de règles pour les admins */}
                                {isAdmin && (
                                    <RuleNotificationBell />
                                )}
                                
                                {/* Notifications générales */}
                                {user && (
                                    <NotificationBell />
                                )}
                                
                                {!isMounted || isLoading ? (
                                    <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" aria-label="Chargement du profil" role="status"></div>
                                ) : user ? (
                                    <>
                                        <UserProfile user={user} onLogout={logout} />
                                    </>
                                ) : (
                                    <HeaderLoginForm idPrefix="header-" />
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