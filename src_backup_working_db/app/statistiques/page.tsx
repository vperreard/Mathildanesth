'use client';

import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';

function StatistiquesPageContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="mb-8 text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Statistiques</h1>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    <p className="text-gray-600 text-center">Contenu de la page Statistiques à venir...</p>
                    {/* Ici viendront les graphiques et les indicateurs clés */}
                </div>
            </motion.div>
        </div>
    );
}

export default function ProtectedStatistiquesPage() {
    return (
        <ProtectedRoute>
            <StatistiquesPageContent />
        </ProtectedRoute>
    );
} 