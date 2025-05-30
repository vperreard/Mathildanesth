'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Settings,
    Calendar,
    AlertTriangle,
    Shield,
    Bell,
    Users,
    ChevronRight,
    Home,
    ArrowRight
} from 'lucide-react';

interface SettingCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    color: string;
    index: number;
}

const SettingCard: React.FC<SettingCardProps> = ({
    title,
    description,
    icon,
    link,
    color,
    index
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group"
        >
            <Link href={link} className="block h-full">
                <div className="relative h-full bg-white dark:bg-slate-800 rounded-xl shadow-soft border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-600 overflow-hidden">
                    {/* Effet de survol coloré */}
                    <div className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                    {/* Contenu */}
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${color.replace('bg-', 'bg-').replace('-600', '-100')} dark:${color.replace('bg-', 'bg-').replace('-600', '-900/20')}`}>
                                <div className={`${color.replace('bg-', 'text-').replace('-600', '-600')} dark:${color.replace('bg-', 'text-').replace('-600', '-400')}`}>
                                    {icon}
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300 group-hover:translate-x-1" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                            {title}
                        </h3>

                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function SettingsGrid() {
    const settingsItems = [
        {
            title: "Types de congés",
            description: "Configurer les types de congés disponibles et leurs règles spécifiques.",
            icon: <Calendar className="w-6 h-6" />,
            link: "/admin/parametres/leave-types",
            color: "bg-blue-600"
        },
        {
            title: "Règles de conflit",
            description: "Gérer les règles de détection des conflits de congés et les seuils d'alerte.",
            icon: <AlertTriangle className="w-6 h-6" />,
            link: "/admin/parametres/conflict-rules",
            color: "bg-orange-600"
        },
        {
            title: "Rôles et permissions",
            description: "Définir les rôles utilisateurs et leurs niveaux d'accès.",
            icon: <Shield className="w-6 h-6" />,
            link: "/admin/parametres/roles",
            color: "bg-green-600"
        },
        {
            title: "Notifications",
            description: "Paramétrer les notifications système et les alertes.",
            icon: <Bell className="w-6 h-6" />,
            link: "/admin/parametres/notifications",
            color: "bg-purple-600"
        },
        {
            title: "Équipes et départements",
            description: "Gérer la structure organisationnelle et les équipes.",
            icon: <Users className="w-6 h-6" />,
            link: "/admin/parametres/teams",
            color: "bg-indigo-600"
        },
        {
            title: "Configuration générale",
            description: "Paramètres généraux de l'application.",
            icon: <Settings className="w-6 h-6" />,
            link: "/admin/parametres/general",
            color: "bg-gray-600"
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6"
            >
                <Link
                    href="/admin"
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    <Home className="w-4 h-4 mr-1" />
                    Administration
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Paramètres</span>
            </motion.nav>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Paramètres du système
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Configurez et gérez tous les aspects de votre système médical
                </p>
            </motion.div>

            {/* Grid de cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsItems.map((item, index) => (
                    <SettingCard
                        key={item.title}
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                        link={item.link}
                        color={item.color}
                        index={index}
                    />
                ))}
            </div>

            {/* Section d'aide */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-100 dark:border-slate-600"
            >
                <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Besoin d'aide avec la configuration ?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Consultez notre documentation ou contactez l'équipe de support pour vous accompagner dans la configuration de votre système.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/documentation"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                Documentation
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            <Link
                                href="/support"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                            >
                                Support technique
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
} 