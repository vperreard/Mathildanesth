'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, Home, Info } from 'lucide-react';

interface ConflictRulesContentProps {
    children: React.ReactNode;
}

export default function ConflictRulesContent({ children }: ConflictRulesContentProps) {
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
                <Link
                    href="/admin/parametres"
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    Paramètres
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Règles de conflit</span>
            </motion.nav>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                        <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Gestion des règles de détection des conflits de congés
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Configurez les règles pour détecter et prévenir les conflits dans le planning
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Information box */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8"
            >
                <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            À propos de cette configuration
                        </h3>
                        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <p>
                                Cette interface vous permet de configurer les règles utilisées par le système pour détecter les
                                conflits potentiels lorsque les employés demandent des congés. Vous pouvez définir les seuils,
                                les pourcentages et les périodes spéciales.
                            </p>
                            <p>
                                <strong>Important :</strong> Les modifications apportées ici affecteront immédiatement la façon dont le système évalue
                                les nouvelles demandes de congés et détecte les conflits potentiels.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Composant de gestion des règles */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {children}
            </motion.div>
        </div>
    );
} 