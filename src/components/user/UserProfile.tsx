'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

interface User {
    prenom: string;
    nom: string;
    role: string;
}

interface UserProfileProps {
    user: User;
    onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuId = "user-profile-menu";
    const { theme, setTheme } = useTheme();

    // Gestion du clic en dehors du menu pour le fermer
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Gestion du clavier pour fermer le menu avec Echap
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape' && isMenuOpen) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    const fadeIn = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    const userInitials = `${user.prenom?.[0]}${user.nom?.[0]}`;

    const roleLabel = user.role === 'ADMIN_TOTAL'
        ? 'Administrateur'
        : user.role === 'ADMIN_PARTIEL'
            ? 'Admin Partiel'
            : 'Utilisateur';

    return (
        <motion.div
            className="relative group"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            ref={dropdownRef}
        >
            <button
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-secondary-50 dark:bg-slate-700 py-1.5 px-3 rounded-full cursor-pointer hover:from-primary-100 hover:to-secondary-100 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-controls={menuId}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500 flex items-center justify-center text-white text-sm font-bold shadow-md" aria-hidden="true">
                    {userInitials}
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">{user.prenom} {user.nom}</span>
            </button>

            {/* Zone tampon invisible */}
            <div className="absolute top-full left-0 right-0 h-2 bg-transparent"></div>

            {/* Menu déroulant */}
            <div
                id={menuId}
                className={`absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-200 z-50 border border-gray-100 dark:border-slate-700 ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 invisible'}`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
            >
                <div className="py-2">
                    {/* En-tête du menu */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500 flex items-center justify-center text-white text-sm font-bold shadow-md" aria-hidden="true">
                                {userInitials}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.prenom} {user.nom}</p>
                                <p className="text-xs bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent dark:text-slate-400">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Liens du menu */}
                    <div className="py-1" role="none">
                        <Link
                            href="/profil"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-primary-50 hover:via-secondary-50 hover:to-tertiary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus:bg-gradient-to-r focus:from-primary-50 focus:via-secondary-50 focus:to-tertiary-50 dark:focus:bg-slate-700 focus:text-primary-600 dark:focus:text-primary-400"
                            role="menuitem"
                            tabIndex={isMenuOpen ? 0 : -1}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Mon profil
                        </Link>

                        <Link
                            href="/parametres"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-primary-50 hover:via-secondary-50 hover:to-tertiary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus:bg-gradient-to-r focus:from-primary-50 focus:via-secondary-50 focus:to-tertiary-50 dark:focus:bg-slate-700 focus:text-primary-600 dark:focus:text-primary-400"
                            role="menuitem"
                            tabIndex={isMenuOpen ? 0 : -1}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Paramètres
                        </Link>

                        <Link
                            href="/notifications"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-primary-50 hover:via-secondary-50 hover:to-tertiary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus:bg-gradient-to-r focus:from-primary-50 focus:via-secondary-50 focus:to-tertiary-50 dark:focus:bg-slate-700 focus:text-primary-600 dark:focus:text-primary-400"
                            role="menuitem"
                            tabIndex={isMenuOpen ? 0 : -1}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-tertiary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notifications
                            <span className="ml-auto bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 text-xs px-2 py-0.5 rounded-full">3</span>
                        </Link>

                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-primary-50 hover:via-secondary-50 hover:to-tertiary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus:bg-gradient-to-r focus:from-primary-50 focus:via-secondary-50 focus:to-tertiary-50 dark:focus:bg-slate-700 focus:text-primary-600 dark:focus:text-primary-400"
                            role="menuitem"
                            tabIndex={isMenuOpen ? 0 : -1}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            {theme === 'light' ? 'Thème sombre' : 'Thème clair'}
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                            role="menuitem"
                            tabIndex={isMenuOpen ? 0 : -1}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
} 