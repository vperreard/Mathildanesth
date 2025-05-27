'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les demandes de congé en attente
interface PendingLeave {
    id: string;
    startDate: string;
    endDate: string;
    type: string;
    typeCode: string;
    userId: number;
    user: {
        firstName: string;
        lastName: string;
        prenom: string;
        nom: string;
    };
}

const AdminRequestsBanner: React.FC = () => {
    const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Effet pour charger les demandes en attente
    useEffect(() => {
        const fetchPendingLeaves = async () => {
            // Vérifier si un token existe dans localStorage ou cookies
            const token = localStorage.getItem('token');
            if (!token) {
                // Pas de token, ne pas faire la requête
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/admin/conges/pending', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setPendingLeaves(response.data);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    // Non autorisé, ne pas afficher d'erreur
                    setPendingLeaves([]);
                } else {
                    console.error('Erreur lors du chargement des demandes en attente:', err);
                    setError(err.response?.data?.error || 'Erreur lors du chargement des demandes');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingLeaves();

        // Mettre à jour toutes les 3 minutes
        const interval = setInterval(fetchPendingLeaves, 180000);
        return () => clearInterval(interval);
    }, []);

    // Fonction pour approuver une demande
    const handleApprove = async (leaveId: string) => {
        setProcessingId(leaveId);
        try {
            await axios.post(`/api/admin/conges/${leaveId}/approve`);
            // Mettre à jour la liste des demandes en attente
            setPendingLeaves(pendingLeaves.filter(leave => leave.id !== leaveId));
            // Si on n'a plus que 0 ou 1 demande, recharger pour avoir 2 demandes
            if (pendingLeaves.length <= 2) {
                const response = await axios.get('/api/admin/conges/pending');
                setPendingLeaves(response.data);
            }
        } catch (err: any) {
            console.error("Erreur lors de l'approbation:", err);
            setError(err.response?.data?.error || "Erreur lors de l'approbation");
        } finally {
            setProcessingId(null);
        }
    };

    // Fonction pour rejeter une demande
    const handleReject = async (leaveId: string) => {
        setProcessingId(leaveId);
        try {
            await axios.post(`/api/admin/conges/${leaveId}/reject`);
            // Mettre à jour la liste des demandes en attente
            setPendingLeaves(pendingLeaves.filter(leave => leave.id !== leaveId));
            // Si on n'a plus que 0 ou 1 demande, recharger pour avoir 2 demandes
            if (pendingLeaves.length <= 2) {
                const response = await axios.get('/api/admin/conges/pending');
                setPendingLeaves(response.data);
            }
        } catch (err: any) {
            console.error("Erreur lors du rejet:", err);
            setError(err.response?.data?.error || "Erreur lors du rejet");
        } finally {
            setProcessingId(null);
        }
    };

    // Fonction pour formatter les dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'PPP', { locale: fr });
    };

    // Si pas de demandes en attente ou chargement, ne rien afficher
    if (isLoading || pendingLeaves.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 py-2 px-4 border-b border-amber-200 dark:border-amber-800/50">
            <div className="max-w-7xl mx-auto">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Demandes de congés en attente</h3>

                {error && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-2 p-1 bg-red-50 dark:bg-red-900/20 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                        {pendingLeaves.map((leave) => (
                            <motion.div
                                key={leave.id}
                                className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border border-amber-200 dark:border-amber-800/50"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium dark:text-slate-100">
                                            {leave.user.prenom || leave.user.firstName} {leave.user.nom || leave.user.lastName}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                                            Type: <span className="font-medium">{leave.type}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400">
                                            Période: <span className="font-medium">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleApprove(leave.id)}
                                            disabled={processingId === leave.id}
                                            className="flex items-center justify-center bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Approuver la demande"
                                        >
                                            <CheckCircleIcon className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(leave.id)}
                                            disabled={processingId === leave.id}
                                            className="flex items-center justify-center bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Rejeter la demande"
                                        >
                                            <XCircleIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                                {processingId === leave.id && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Traitement en cours...
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminRequestsBanner; 