'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 border-t border-gray-100 pt-12 pb-8 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Mathildanesth</h2>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Solution complète de gestion des anesthésistes et du planning hospitalier.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Navigation rapide</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link href="/planning/hebdomadaire" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    Planning
                                </Link>
                            </li>
                            <li>
                                <Link href="/calendar" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    Calendrier
                                </Link>
                            </li>
                            <li>
                                <Link href="/statistiques" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    Statistiques
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <span className="text-gray-600">Version: 0.1.0</span>
                            </li>
                            <li>
                                <span className="text-gray-600">Environnement: {process.env.NODE_ENV}</span>
                            </li>
                            <li>
                                <Link href="/diagnostic" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    Diagnostic
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 mt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                        © {currentYear} Mathildanesth. Tous droits réservés.
                    </p>
                    <div className="flex space-x-4">
                        <motion.a
                            href="#"
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                        >
                            <span className="sr-only">Politique de confidentialité</span>
                            Confidentialité
                        </motion.a>
                        <motion.a
                            href="#"
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                        >
                            <span className="sr-only">Conditions d'utilisation</span>
                            Conditions
                        </motion.a>
                    </div>
                </div>
            </div>
        </footer>
    );
} 