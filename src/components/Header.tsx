'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { memo } from 'react';
import AdminRequestsBanner from './AdminRequestsBanner';
import MedicalNavigation from './navigation/MedicalNavigation';
import UserProfile from './user/UserProfile';
import { HeaderLoginForm } from './auth/HeaderLoginForm';
import { getNavigationByRole, hasAccess } from '@/utils/navigationConfig';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';
import { useAppearance } from '@/hooks/useAppearance';
import { NotificationBell } from './notifications/NotificationBell';
import { RuleNotificationBell } from './rules/RuleNotificationBell';
import { UniversalSearch } from './UniversalSearch';
import { MedicalBreadcrumbs } from './navigation/MedicalBreadcrumbs';
import { QuickActions } from './navigation/QuickActions';
import { Activity, Stethoscope } from 'lucide-react';

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
    const userRole = user?.role || 'GUEST';

    // Navigation adaptée au rôle médical
    const navLinks = useMemo(() => {
        if (!user) return [];
        return getNavigationByRole(userRole);
    }, [user, userRole]);

    const toggleMobileMenu = useMemo(() => () => setMobileMenuOpen(!mobileMenuOpen), [mobileMenuOpen]);

    // Style médical adaptatif
    const headerStyle = {
        background: theme === 'dark'
            ? 'linear-gradient(to right, rgba(15, 23, 42, 1), rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 1))'
            : 'linear-gradient(to right, rgba(248, 250, 252, 1), rgba(241, 245, 249, 0.92), rgba(248, 250, 252, 1))'
    };

    const headerClass = preferences?.header?.style
        ? `header-${preferences.header.style}`
        : '';

    const stickyClass = preferences?.header?.sticky === false
        ? ''
        : 'sticky';

    return (
        <>
            <header
                className={`${stickyClass} top-0 z-50 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 ${headerClass} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md`}
                role="banner"
                style={preferences?.header?.style === 'gradient' ? headerStyle : undefined}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo médical */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            className="flex-shrink-0"
                        >
                            <Link
                                href="/"
                                className="flex items-center space-x-3 group"
                                aria-label="Accueil Mathildanesth - Gestion planningMedical"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl">
                                    <Stethoscope className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        Mathildanesth
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Planning Médical
                                    </p>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Barre de navigation centrale */}
                        <div className="flex-1 flex items-center justify-center px-4">
                            {!isLoading && user && (
                                <MedicalNavigation
                                    navigation={navLinks}
                                    userRole={userRole}
                                    mobileMenuOpen={mobileMenuOpen}
                                    onMobileMenuToggle={toggleMobileMenu}
                                />
                            )}
                        </div>

                        {/* Actions utilisateur */}
                        <motion.div
                            className="flex items-center space-x-2"
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            role="region"
                            aria-label="Actions utilisateur"
                        >
                            {/* Recherche universelle */}
                            {user && (
                                <UniversalSearch />
                            )}

                            {/* Actions rapides pour les rôles médicaux */}
                            {user && (
                                <QuickActions userRole={userRole} />
                            )}
                            
                            <ThemeSwitcher />
                            
                            {/* Notifications règles pour les admins */}
                            {isAdmin && (
                                <RuleNotificationBell />
                            )}
                            
                            {/* Notifications générales */}
                            {user && (
                                <NotificationBell />
                            )}
                            
                            {!isMounted || isLoading ? (
                                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" aria-label="Chargement du profil" role="status"></div>
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

                {/* Breadcrumbs médicaux contextuels */}
                {user && (
                    <MedicalBreadcrumbs userRole={userRole} />
                )}
            </header>
            <AdminRequestsBanner />
        </>
    );
});

export default Header;