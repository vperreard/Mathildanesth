'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { memo } from 'react';
import AdminRequestsBanner from './AdminRequestsBanner';
import { StreamlinedNavigation } from './navigation/StreamlinedNavigation';
import UserProfile from './user/UserProfile';
import { HeaderLoginForm } from './auth/HeaderLoginForm';
import { getNavigationByRole, hasAccess } from '@/utils/navigationConfig';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';
import { useAppearance } from '@/hooks/useAppearance';
import { NotificationBell } from './notifications/NotificationBell';
import { UniversalSearch } from './UniversalSearch';
import { MedicalBreadcrumbs } from './navigation/MedicalBreadcrumbs';
import { Activity, Stethoscope, Menu, Command, Settings, User, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const fadeIn = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

  const toggleMobileMenu = useMemo(
    () => () => setMobileMenuOpen(!mobileMenuOpen),
    [mobileMenuOpen]
  );

  // Style médical adaptatif
  const headerStyle = {
    background:
      theme === 'dark'
        ? 'linear-gradient(to right, rgba(15, 23, 42, 1), rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 1))'
        : 'linear-gradient(to right, rgba(248, 250, 252, 1), rgba(241, 245, 249, 0.92), rgba(248, 250, 252, 1))',
  };

  const headerClass = preferences?.header?.style ? `header-${preferences.header.style}` : '';
  const stickyClass = preferences?.header?.sticky === false ? '' : 'sticky';

  return (
    <>
      <header
        className={`${stickyClass} top-0 z-50 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 ${headerClass} bg-white/98 dark:bg-slate-900/98 backdrop-blur-md`}
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
                aria-label="Accueil Mathildanesth - Planning Médical"
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

            {/* Navigation rationalisée - SEULEMENT 4 éléments principaux max */}
            <div className="flex-1 flex items-center justify-center px-2 lg:px-4">
              {!isLoading && user && (
                <StreamlinedNavigation
                  userRole={userRole}
                  isAdmin={isAdmin}
                  mobileMenuOpen={mobileMenuOpen}
                  onMobileMenuToggle={toggleMobileMenu}
                />
              )}
            </div>

            {/* Actions utilisateur rationalisées */}
            <motion.div
              className="flex items-center space-x-2"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              role="region"
              aria-label="Actions utilisateur"
            >
              {/* Command Center pour admin - Menu enrichi avec toutes les configurations */}
              {user && isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Command Center - Configuration système"
                    >
                      <Command className="h-5 w-5" />
                      <span className="hidden xl:inline text-xs">Admin</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Command className="h-4 w-4" />
                      Command Center
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Vue d'ensemble */}
                    <DropdownMenuItem>
                      <Link href="/admin/centre-commande" className="flex items-center gap-2 w-full">
                        <Activity className="h-4 w-4" />
                        <span>Vue d'ensemble</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Configuration du système médical */}
                    <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                      Configuration Médical
                    </DropdownMenuLabel>

                    <DropdownMenuItem>
                      <Link href="/parametres/configuration" className="flex items-center gap-2 w-full">
                        <Settings className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">Panneau Principal</div>
                          <div className="text-xs text-slate-500">Toutes les configurations</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/bloc-operatoire" className="flex items-center gap-2 w-full">
                        <Activity className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">Bloc Opératoire</div>
                          <div className="text-xs text-slate-500">Sites, secteurs, salles</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/utilisateurs" className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">Personnel</div>
                          <div className="text-xs text-slate-500">MARs et IADEs</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/parametres/chirurgiens" className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">Chirurgiens</div>
                          <div className="text-xs text-slate-500">Gestion des chirurgiens</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/parametres/specialites" className="flex items-center gap-2 w-full">
                        <Activity className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">Spécialités</div>
                          <div className="text-xs text-slate-500">Spécialités chirurgicales</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Configuration avancée */}
                    <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                      Configuration Avancée
                    </DropdownMenuLabel>

                    <DropdownMenuItem>
                      <Link href="/parametres/trameModeles" className="flex items-center gap-2 w-full">
                        <Clock className="h-4 w-4" />
                        <span>Trames & Modèles</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/admin/configuration" className="flex items-center gap-2 w-full">
                        <Settings className="h-4 w-4" />
                        <span>Configuration Système</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Recherche compacte */}
              {user && (
                <div className="hidden md:block">
                  <UniversalSearch compact={true} />
                </div>
              )}

              {/* Notifications */}
              {user && <NotificationBell showAdminRules={isAdmin} />}

              {/* Theme switcher */}
              <ThemeSwitcher />

              {/* Profil utilisateur */}
              {!isMounted || isLoading ? (
                <div
                  className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
                  aria-label="Chargement du profil"
                  role="status"
                ></div>
              ) : user ? (
                <UserProfile user={user} onLogout={logout} />
              ) : (
                <HeaderLoginForm idPrefix="header-" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Breadcrumbs médicaux contextuels */}
        {user && <MedicalBreadcrumbs userRole={userRole} />}
      </header>
      <AdminRequestsBanner />
    </>
  );
});

export default Header;
