'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, Users, ClipboardCheck, PieChart, Settings } from 'lucide-react';
import { LeaveNotificationCenter } from './LeaveNotificationCenter';
import { useSession } from 'next-auth/react';

/**
 * En-tête du module de congés
 * Ce composant affiche la barre de navigation supérieure spécifique aux congés
 * et intègre le centre de notifications.
 */
export const LeaveHeader: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    // Liens de navigation
    const navLinks = [
        { href: '/leaves', label: 'Mes congés', icon: Calendar },
        { href: '/leaves/request', label: 'Nouvelle demande', icon: ClipboardCheck },
        { href: '/leaves/quotas', label: 'Mes quotas', icon: PieChart }
    ];

    // Liens administrateurs
    const adminLinks = [
        { href: '/admin/leaves', label: 'Gestion des congés', icon: Users },
        { href: '/admin/leaves/settings', label: 'Paramètres', icon: Settings }
    ];

    // Liens actifs pour le module courant
    const links = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-blue-600 mr-8">Module de congés</h1>
                        <nav className="flex space-x-4">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                const Icon = link.icon;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive
                                                ? 'text-blue-700 bg-blue-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            } transition-colors duration-200`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Intégration du centre de notifications */}
                        <LeaveNotificationCenter
                            compact={true}
                            onNotificationClick={(notification) => {
                                if (notification.actions?.[0]?.url) {
                                    router.push(notification.actions[0].url);
                                }
                            }}
                        />

                        {/* Affichage du nom de l'utilisateur */}
                        <div className="ml-4 flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                {session?.user?.name?.substring(0, 1) || 'U'}
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-700">
                                {session?.user?.name || 'Utilisateur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}; 