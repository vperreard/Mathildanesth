import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarIcon, HomeIcon, UserGroupIcon, CogIcon } from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Accueil', href: '/', icon: HomeIcon },
    { name: 'Absences', href: '/absences', icon: CalendarIcon },
    { name: 'Équipe', href: '/equipe', icon: UserGroupIcon },
    { name: 'Paramètres', href: '/parametres', icon: CogIcon },
];

export const Navigation: React.FC = () => {
    const router = useRouter();

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <img
                                className="h-8 w-auto"
                                src="/logo.png"
                                alt="Mathildanesth"
                            />
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => {
                                const isActive = router.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-blue-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}; 