'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Menu,
    X,
    ChevronDown,
    Calendar,
    Clock,
    FileText,
    MessageCircle,
    User,
    Activity,
    Home,
    MoreHorizontal
} from 'lucide-react';

interface StreamlinedNavigationProps {
    userRole: string;
    isAdmin: boolean;
    mobileMenuOpen: boolean;
    onMobileMenuToggle: () => void;
}

export function StreamlinedNavigation({
    userRole,
    isAdmin,
    mobileMenuOpen,
    onMobileMenuToggle
}: StreamlinedNavigationProps) {
    const pathname = usePathname();

    const isActivePath = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // NAVIGATION PRINCIPALE RATIONALISÉE - SEULEMENT 4 ÉLÉMENTS MAX
    const primaryNavItems = [
        {
            href: '/',
            label: 'Accueil',
            icon: Home,
            description: 'Tableau de bord'
        },
        {
            href: '/planning',
            label: 'Planning',
            icon: Calendar,
            description: 'Mon planning et équipe'
        },
        {
            href: '/conges',
            label: 'Congés',
            icon: Clock,
            description: 'Mes congés et demandes'
        },
        // Le 4ème élément est un menu "Plus" qui contient le reste
        {
            href: '#more',
            label: 'Plus',
            icon: MoreHorizontal,
            description: 'Autres fonctionnalités',
            isDropdown: true
        }
    ];

    // Éléments secondaires dans le menu "Plus"
    const secondaryNavItems = [
        {
            href: '/demandes',
            label: 'Mes Demandes',
            icon: FileText,
            description: 'Toutes vos demandes unifiées'
        },
        {
            href: '/notifications',
            label: 'Notifications',
            icon: MessageCircle,
            description: 'Messages et alertes'
        },
        {
            href: '/profil',
            label: 'Mon Profil',
            icon: User,
            description: 'Paramètres et préférences'
        }
    ];

    const getRoleLabel = (role: string) => {
        const roleLabels: Record<string, string> = {
            'MAR': 'MAR',
            'IADE': 'IADE',
            'ADMIN_TOTAL': 'Admin',
            'ADMIN_PARTIEL': 'Admin',
            'CHIRURGIEN': 'Chirurgien'
        };
        return roleLabels[role] || role;
    };

    return (
        <>
            {/* Navigation Desktop rationalisée */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Navigation principale">
                {/* Menu principal - SEULEMENT 3 liens visibles + 1 menu "Plus" */}
                <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                    {primaryNavItems.slice(0, 3).map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                title={item.description}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden xl:inline">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Menu "Plus" pour les éléments secondaires */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-100"
                                title="Plus d'options"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="hidden xl:inline">Plus</span>
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                            <DropdownMenuLabel>Autres fonctionnalités</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {secondaryNavItems.map((item) => {
                                const ItemIcon = item.icon;
                                const isActive = isActivePath(item.href);

                                return (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-2 py-2 ${isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : ''
                                                }`}
                                        >
                                            <ItemIcon className="h-4 w-4" />
                                            <div className="flex-1">
                                                <div className="font-medium">{item.label}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {item.description}
                                                </div>
                                            </div>
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Indicateur de rôle compact */}
                <div className="flex items-center gap-2 ml-3 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                        {getRoleLabel(userRole)}
                    </span>
                </div>
            </nav>

            {/* Bouton menu mobile */}
            <div className="lg:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMobileMenuToggle}
                    className={`p-2 rounded-lg transition-colors ${mobileMenuOpen
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    aria-label="Menu principal"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Menu mobile complet */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg"
                    >
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            {/* Rôle utilisateur */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                        {getRoleLabel(userRole)}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Navigation médicale
                                    </div>
                                </div>
                            </div>

                            {/* Navigation complète mobile */}
                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-1">
                                    Navigation principale
                                </h3>
                                {[...primaryNavItems.slice(0, 3), ...secondaryNavItems].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActivePath(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onMobileMenuToggle}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <div className="flex-1">
                                                <div>{item.label}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {item.description}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
} 