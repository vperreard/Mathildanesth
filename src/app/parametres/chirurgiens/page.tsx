'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
// Importer UserRole comme enum
import { UserRole } from '@/types/user';

// Importer le panneau de liste des chirurgiens
import SurgeonsListPanel from '../configuration/SurgeonsListPanel';

// Contenu simplifié de la page qui utilise le panneau
function SurgeonsPageContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Bouton Retour aux Paramètres */}
                <Link href="/parametres" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 group">
                    <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Retour aux Paramètres
                </Link>

                {/* L'en-tête est maintenant DANS le panneau, mais on peut garder un titre général ici */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Users className="h-8 w-8 text-indigo-600" />
                        <span>Gestion des Chirurgiens</span>
                    </h1>
                </div>

                {/* Intégration du panneau de liste */}
                <SurgeonsListPanel />
            </motion.div>
        </div>
    );
}

// Garder la protection de la route
export default function ProtectedSurgeonsPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
            <SurgeonsPageContent />
        </ProtectedRoute>
    );
} 