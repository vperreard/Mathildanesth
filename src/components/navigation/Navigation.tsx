'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { memo, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { navigationGroups, isAdminGroup } from '@/utils/navigationConfig';

interface NavLink {
    href: string;
    label: string;
}

interface NavGroup {
    name: string;
    links: NavLink[];
}

interface NavigationProps {
    links: NavLink[];
    isAdmin: boolean;
    mobileMenuOpen: boolean;
    onMobileMenuToggle: () => void;
}

const fadeIn = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const stagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

const Navigation = memo(function Navigation({ links, isAdmin, mobileMenuOpen, onMobileMenuToggle }: NavigationProps) {
    const pathname = usePathname();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const toggleDropdown = (groupName: string) => {
        // Si le menu cliqué est déjà ouvert, le fermer
        // Sinon, fermer tous les menus et ouvrir celui-ci
        setActiveDropdown(activeDropdown === groupName ? null : groupName);
    };

    // Vérifier si un menu déroulant est ouvert
    const isDropdownOpen = (groupName: string) => activeDropdown === groupName;

    // Filtre les groupes de navigation en fonction des droits d'admin
    const filteredGroups = useMemo(() => {
        return navigationGroups.filter(group => {
            // Si c'est un groupe d'admin, vérifier les droits
            if (isAdminGroup(group.name)) {
                return isAdmin;
            }
            return true;
        });
    }, [isAdmin]);

    // Rendu des liens de navigation desktop avec menus déroulants
    const renderDesktopNavigation = useMemo(() => {
        return (
            <>
                <motion.div key="accueil" variants={fadeIn}>
                    <Link
                        href="/"
                        className={`px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium text-sm ${pathname === '/' ? 'text-primary-600 bg-primary-50' : ''
                            }`}
                        aria-current={pathname === '/' ? 'page' : undefined}
                    >
                        Accueil
                    </Link>
                </motion.div>

                {filteredGroups.map((group) => (
                    <motion.div key={group.name} variants={fadeIn} className="relative group">
                        <button
                            className={`px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium text-sm flex items-center ${group.links.some(link => link.href === pathname) ? 'text-primary-600' : ''
                                }`}
                            onClick={() => toggleDropdown(group.name)}
                            aria-expanded={isDropdownOpen(group.name)}
                            aria-haspopup="true"
                        >
                            {group.name}
                            {isDropdownOpen(group.name) ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                        </button>

                        {/* Menu déroulant desktop */}
                        <div
                            className={`absolute left-0 mt-2 w-56 origin-top-left bg-white border border-gray-100 rounded-md shadow-lg transition-all duration-200 z-50 ${isDropdownOpen(group.name) ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                                }`}
                        >
                            <div className="py-1">
                                {group.links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`block px-4 py-2 text-sm ${pathname === link.href
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                            }`}
                                        aria-current={pathname === link.href ? 'page' : undefined}
                                        onClick={() => toggleDropdown(group.name)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </>
        );
    }, [filteredGroups, pathname, activeDropdown]);

    // Rendu des liens de navigation mobile avec sections dépliables
    const renderMobileNavigation = useMemo(() => {
        return (
            <>
                <Link
                    href="/"
                    className={`block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors ${pathname === '/' ? 'text-primary-600 bg-primary-50' : ''
                        }`}
                    onClick={onMobileMenuToggle}
                    aria-current={pathname === '/' ? 'page' : undefined}
                >
                    Accueil
                </Link>

                {filteredGroups.map((group) => (
                    <div key={group.name} className="py-1">
                        <button
                            className="w-full flex justify-between items-center px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                            onClick={() => toggleDropdown(group.name)}
                            aria-expanded={isDropdownOpen(group.name)}
                        >
                            {group.name}
                            {isDropdownOpen(group.name) ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {isDropdownOpen(group.name) && (
                            <div className="pl-4 ml-2 border-l border-gray-200">
                                {group.links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`block px-4 py-2 text-sm ${pathname === link.href
                                            ? 'text-primary-600 bg-primary-50'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                            }`}
                                        onClick={onMobileMenuToggle}
                                        aria-current={pathname === link.href ? 'page' : undefined}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </>
        );
    }, [filteredGroups, pathname, activeDropdown, onMobileMenuToggle]);

    const mobileMenuId = "mobile-navigation-menu";

    return (
        <>
            {/* Desktop Navigation */}
            <motion.nav
                className="hidden md:flex space-x-1 items-center"
                initial="hidden"
                animate="visible"
                variants={stagger}
                aria-label="Navigation principale"
                role="navigation"
            >
                {renderDesktopNavigation}
            </motion.nav>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
                <button
                    onClick={onMobileMenuToggle}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
                    aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    aria-expanded={mobileMenuOpen}
                    aria-controls={mobileMenuId}
                >
                    {mobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <motion.nav
                    id={mobileMenuId}
                    className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-b border-gray-100 max-h-[80vh] overflow-y-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    aria-label="Navigation mobile"
                    role="navigation"
                >
                    <div className="px-4 py-2 space-y-1">
                        {renderMobileNavigation}
                    </div>
                </motion.nav>
            )}
        </>
    );
});

export default Navigation; 