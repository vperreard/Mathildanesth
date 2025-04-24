import React, { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title = 'Administration' }: AdminLayoutProps) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Vérifier si le lien est actif (correspond à la route actuelle)
    const isActiveLink = (path: string): boolean => {
        return router.pathname === path || router.pathname.startsWith(`${path}/`);
    };

    // Liste des éléments du menu d'administration
    const menuItems = [
        {
            name: 'Tableau de bord',
            href: '/administration',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
            ),
        },
        {
            name: 'Utilisateurs',
            href: '/administration/utilisateurs',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
            ),
        },
        {
            name: 'Profils',
            href: '/administration/profils',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            name: 'Congés',
            href: '/administration/conges',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            name: 'Règles',
            href: '/administration/regles',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            name: 'Paramètres',
            href: '/administration/parametres',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            ),
        },
    ];

    return (
        <div>
            <Head>
                <title>{title} | Mathildanesth</title>
            </Head>

            <div className="flex h-screen overflow-hidden bg-gray-100">
                {/* Sidebar mobile */}
                <div
                    className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        aria-hidden="true"
                        onClick={() => setSidebarOpen(false)}
                    ></div>

                    <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-white">
                        <div className="absolute top-0 right-0 pt-2 -mr-12">
                            <button
                                type="button"
                                className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sr-only">Fermer le menu</span>
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center flex-shrink-0 px-4">
                            <span className="text-xl font-semibold text-blue-600">Mathildanesth</span>
                        </div>
                        <div className="flex-1 h-0 mt-5 overflow-y-auto">
                            <nav className="px-2 space-y-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActiveLink(item.href)
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <div className={`mr-4 ${isActiveLink(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                            {item.icon}
                                        </div>
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Sidebar desktop */}
                <div className="hidden md:flex md:flex-shrink-0">
                    <div className="flex flex-col w-64">
                        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
                            <div className="flex items-center flex-shrink-0 px-4">
                                <span className="text-xl font-semibold text-blue-600">Mathildanesth</span>
                            </div>
                            <div className="flex flex-col flex-grow mt-5">
                                <nav className="flex-1 px-2 space-y-1 bg-white">
                                    {menuItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActiveLink(item.href)
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className={`mr-3 ${isActiveLink(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                                {item.icon}
                                            </div>
                                            {item.name}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-col flex-1 w-0 overflow-hidden">
                    <div className="relative z-10 flex flex-shrink-0 h-16 bg-white shadow">
                        <button
                            type="button"
                            className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Ouvrir le menu</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                        <div className="flex justify-between flex-1 px-4">
                            <div className="flex flex-1">
                                <h1 className="self-center text-xl font-semibold text-gray-800">{title}</h1>
                            </div>
                            <div className="flex items-center ml-4 md:ml-6">
                                {/* Dropdown menu for user profile */}
                                <div className="relative ml-3">
                                    <div>
                                        <button
                                            type="button"
                                            className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            id="user-menu"
                                            aria-expanded="false"
                                        >
                                            <span className="sr-only">Ouvrir le menu utilisateur</span>
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                                <span className="text-sm font-medium leading-none text-blue-600">AD</span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="relative flex-1 overflow-y-auto focus:outline-none">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}; 