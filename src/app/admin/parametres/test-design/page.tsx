'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layouts/AdminLayout';
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
    ArrowRight,
    CheckCircle
} from 'lucide-react';

/**
 * Page de test pour valider le nouveau design unifié
 */
export default function TestDesignPage() {
    const testItems = [
        {
            title: "Test Design System",
            description: "Validation du nouveau design unifié avec animations et thème cohérent.",
            icon: <CheckCircle className="w-6 h-6" />,
            color: "bg-green-600"
        },
        {
            title: "Animations Fluides",
            description: "Démonstration des transitions et animations Framer Motion.",
            icon: <Settings className="w-6 h-6" />,
            color: "bg-blue-600"
        },
        {
            title: "Mode Sombre",
            description: "Test de la compatibilité avec le thème sombre.",
            icon: <Calendar className="w-6 h-6" />,
            color: "bg-purple-600"
        }
    ];

    return (
        <AdminLayout>
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
                    <Link
                        href="/admin/parametres"
                        className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        Paramètres
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 dark:text-gray-100 font-medium">Test Design</span>
                </motion.nav>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        🎨 Test du Design System Unifié
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Validation de la nouvelle interface moderne et cohérente
                    </p>
                </motion.div>

                {/* Grid de test */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {testItems.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="group"
                        >
                            <div className="relative h-full bg-white dark:bg-slate-800 rounded-xl shadow-soft border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-600 overflow-hidden">
                                {/* Effet de survol coloré */}
                                <div className={`absolute inset-0 ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                {/* Contenu */}
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${item.color.replace('bg-', 'bg-').replace('-600', '-100')} dark:${item.color.replace('bg-', 'bg-').replace('-600', '-900/20')}`}>
                                            <div className={`${item.color.replace('bg-', 'text-').replace('-600', '-600')} dark:${item.color.replace('bg-', 'text-').replace('-600', '-400')}`}>
                                                {item.icon}
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300 group-hover:translate-x-1" />
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Section de validation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-green-100 dark:border-slate-600"
                >
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                ✅ Design System Validé
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Le nouveau design unifié est prêt ! Tous les éléments suivent maintenant le même design system moderne avec :
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                                <li>🎨 Tailwind CSS pour une cohérence parfaite</li>
                                <li>⚡ Animations Framer Motion fluides</li>
                                <li>🌙 Support complet du mode sombre</li>
                                <li>📱 Design responsive et mobile-first</li>
                                <li>♿ Accessibilité intégrée</li>
                                <li>🎯 UX optimisée pour les équipes médicales</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Retour aux paramètres */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <Link
                        href="/admin/parametres"
                        className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        Retour aux paramètres
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </motion.div>
            </div>
        </AdminLayout>
    );
} 