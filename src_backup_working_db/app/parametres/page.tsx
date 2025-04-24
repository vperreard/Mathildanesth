'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Role } from '@/types/user'; // Importer le type Role pour la protection
import { Users, Settings, Stethoscope, ClipboardList } from 'lucide-react'; // Importer l'icône Users, Stethoscope et ClipboardList

function SettingsPageContent() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-8 flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-indigo-600" />
                    <span>Paramètres</span>
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Carte Gestion des Utilisateurs */}
                    <Link href="/utilisateurs" className="block group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-center space-x-4 mb-3">
                                <Users className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Gestion des Accès</h2>
                            </div>
                            <p className="text-gray-600 text-sm flex-grow">Gérer les comptes utilisateurs, leurs rôles, permissions et statuts.</p>
                            <span className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">Accéder →</span>
                        </div>
                    </Link>

                    {/* Carte Gestion des Chirurgiens */}
                    <Link href="/parametres/chirurgiens" className="block group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-teal-200 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-center space-x-4 mb-3">
                                <Stethoscope className="h-8 w-8 text-teal-600 group-hover:text-teal-700 transition-colors" />
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">Gestion des Chirurgiens</h2>
                            </div>
                            <p className="text-gray-600 text-sm flex-grow">Ajouter, modifier ou désactiver les chirurgiens intervenant dans les plannings.</p>
                            <span className="mt-4 text-sm font-medium text-teal-600 group-hover:underline">Gérer →</span>
                        </div>
                    </Link>

                    {/* Nouvelle Carte Gestion des Spécialités */}
                    <Link href="/parametres/specialites" className="block group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-center space-x-4 mb-3">
                                <ClipboardList className="h-8 w-8 text-purple-600 group-hover:text-purple-700 transition-colors" />
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Gestion des Spécialités</h2>
                            </div>
                            <p className="text-gray-600 text-sm flex-grow">Définir les spécialités chirurgicales disponibles et indiquer si elles sont pédiatriques.</p>
                            <span className="mt-4 text-sm font-medium text-purple-600 group-hover:underline">Configurer →</span>
                        </div>
                    </Link>

                    {/* Carte Panneau de configuration */}
                    <Link href="/parametres/configuration" className="block group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col">
                            <div className="flex items-center space-x-4 mb-3">
                                <Settings className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Panneau de Configuration</h2>
                            </div>
                            <p className="text-gray-600 text-sm flex-grow">Gérer toutes les configurations (Types de congés, Règles de planning, etc.).</p>
                            <span className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">Accéder →</span>
                        </div>
                    </Link>

                </div>
            </motion.div>
        </div>
    );
}

// Protéger la page entière pour les admins
export default function ProtectedSettingsPage() {
    const allowedRoles: Role[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <SettingsPageContent />
        </ProtectedRoute>
    );
} 