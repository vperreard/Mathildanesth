'use client';

import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';

function PlanningPageContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="mb-8 text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Planning</h1>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    <p className="text-gray-600 text-center">Contenu de la page Planning à venir...</p>
                    {/* Ici viendra le composant du calendrier ou de la vue planning */}
                </div>
            </motion.div>
        </div>
    );
}

export default function ProtectedPlanningPage() {
    return (
        <ProtectedRoute>
            <PlanningPageContent />
        </ProtectedRoute>
    );
} 