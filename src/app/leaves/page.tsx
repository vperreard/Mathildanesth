'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { LeaveWithUser, LeaveStatus, LeaveType } from '@/modules/leaves/types/leave';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveForm } from '@/modules/leaves/components/LeaveForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    ChevronDown,
    PlusCircle,
    FileText,
    Calendar as CalendarIcon,
    X as XIcon,
    Edit,
    AlertTriangle
} from 'lucide-react';

interface LeaveBalance {
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

// Ajouter une interface pour les données du congé à éditer/annuler
interface LeaveToModify {
    id: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    reason?: string;
}

// Type pour les clés triables/filtrables
type SortableFilterableKeys = keyof LeaveWithUser | 'user' | 'type' | 'startDate' | 'endDate';

export default function LeavesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [errorBalance, setErrorBalance] = useState<string | null>(null);

    // États pour la gestion des congés
    const [leaves, setLeaves] = useState<LeaveWithUser[]>([]);
    const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);
    const [errorLeaves, setErrorLeaves] = useState<string | null>(null);

    // État pour le tri et le filtrage
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>(['PENDING', 'APPROVED']);
    const [currentSort, setCurrentSort] = useState<{ field: SortableFilterableKeys; direction: 'asc' | 'desc' }>({
        field: 'startDate',
        direction: 'desc'
    });

    // États pour les modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [leaveToEdit, setLeaveToEdit] = useState<LeaveToModify | null>(null);
    const [leaveToCancel, setLeaveToCancel] = useState<LeaveToModify | null>(null);
    const [selectedLeave, setSelectedLeave] = useState<LeaveWithUser | null>(null);

    const [refreshCounter, setRefreshCounter] = useState(0);
    const [mounted, setMounted] = useState(false);

    const currentYear = new Date().getFullYear();

    // Récupérer les congés
    const fetchLeaves = useCallback(async () => {
        if (!user) return;
        setIsLoadingLeaves(true);
        setErrorLeaves(null);
        try {
            const response = await axios.get<LeaveWithUser[]>('/api/leaves?userId=' + user.id);
            setLeaves(response.data);
        } catch (err: any) {
            console.error('Erreur lors de la récupération des congés:', err);
            setErrorLeaves(err.response?.data?.error || 'Impossible de charger les demandes de congés.');
            setLeaves([]);
        } finally {
            setIsLoadingLeaves(false);
        }
    }, [user]);

    // Récupérer les données initiales
    useEffect(() => {
        setMounted(true);

        if (user) {
            fetchLeaves();

            // Récupération du solde
            const fetchBalance = async () => {
                setLoadingBalance(true);
                setErrorBalance(null);
                try {
                    const response = await axios.get('/api/leaves/balance?userId=' + user.id + '&year=' + currentYear);
                    setBalance(response.data);
                } catch (err: any) {
                    console.error('Erreur lors de la récupération du solde de congés:', err);
                    setErrorBalance(err.response?.data?.error || 'Impossible de charger le solde des congés.');
                } finally {
                    setLoadingBalance(false);
                }
            };
            fetchBalance();
        } else if (!authLoading) {
            setLoadingBalance(false);
            setErrorBalance('Utilisateur non authentifié.');
            setIsLoadingLeaves(false);
            setErrorLeaves('Utilisateur non authentifié pour charger les congés.');
            setLeaves([]);
        }
    }, [user, currentYear, authLoading, refreshCounter, fetchLeaves]);

    // Gestionnaires d'événements
    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    const handleSortChange = (field: SortableFilterableKeys) => {
        setCurrentSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleNewLeaveClick = () => {
        setLeaveToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditLeaveClick = (leave: LeaveToModify) => {
        setLeaveToEdit(leave);
        setIsModalOpen(true);
    };

    const handleCancelLeaveClick = (leave: LeaveToModify) => {
        setLeaveToCancel(leave);
        setIsConfirmModalOpen(true);
    };

    const handleViewLeaveDetails = (leave: LeaveWithUser) => {
        setSelectedLeave(leave);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setLeaveToEdit(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLeave(null);
    };

    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setLeaveToCancel(null);
    };

    const handleLeaveCreatedOrUpdated = (savedLeave: any) => {
        console.log('Demande sauvegardée:', savedLeave);
        setIsModalOpen(false);
        setLeaveToEdit(null);
        setRefreshCounter(prev => prev + 1);
    };

    const handleConfirmCancelLeave = async () => {
        if (!leaveToCancel) return;
        try {
            await axios.post(`/api/leaves/${leaveToCancel.id}/cancel`, {});
            console.log('Demande annulée:', leaveToCancel.id);
            setRefreshCounter(prev => prev + 1);
        } catch (err: any) {
            console.error("Erreur lors de l'annulation de la demande:", err);
            // Gérer l'erreur (notification, message, etc.)
        } finally {
            handleCloseConfirmModal();
        }
    };

    // Formatage des dates
    const formatDate = (dateString: string | Date) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
        } catch (error) {
            return dateString.toString();
        }
    };

    // Filtrer les congés
    const filteredLeaves = leaves.filter(leave => {
        // Filtrer par statut
        if (statusFilter.length > 0 && !statusFilter.includes(leave.status)) {
            return false;
        }

        // Filtrer par recherche
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const typeMatch = leave.type.toLowerCase().includes(searchLower);
            const statusMatch = getStatusText(leave.status).toLowerCase().includes(searchLower);
            const dateMatch =
                formatDate(leave.startDate).toLowerCase().includes(searchLower) ||
                formatDate(leave.endDate).toLowerCase().includes(searchLower);
            const reasonMatch = leave.reason ? leave.reason.toLowerCase().includes(searchLower) : false;

            return typeMatch || statusMatch || dateMatch || reasonMatch;
        }

        return true;
    });

    // Trier les congés
    const sortedLeaves = [...filteredLeaves].sort((a, b) => {
        const field = currentSort.field;
        const direction = currentSort.direction === 'asc' ? 1 : -1;

        if (field === 'startDate' || field === 'endDate') {
            return (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * direction;
        }

        if (field === 'type' || field === 'status') {
            return a[field].localeCompare(b[field]) * direction;
        }

        return 0;
    });

    // Formatage et affichage de l'UI
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
            case 'APPROVED': return 'bg-green-50 border-green-300 text-green-700';
            case 'REJECTED': return 'bg-red-50 border-red-300 text-red-700';
            case 'CANCELLED': return 'bg-gray-50 border-gray-300 text-gray-700';
            default: return 'bg-gray-50 border-gray-300 text-gray-700';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'APPROVED': return 'Approuvé';
            case 'REJECTED': return 'Refusé';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-3 h-3 mr-1" />;
            case 'APPROVED': return <CheckCircle className="w-3 h-3 mr-1" />;
            case 'REJECTED': return <XCircle className="w-3 h-3 mr-1" />;
            case 'CANCELLED': return <AlertTriangle className="w-3 h-3 mr-1" />;
            default: return null;
        }
    };

    // Compteurs pour le dashboard
    const counts = {
        total: leaves.length,
        pending: leaves.filter(r => r.status === 'PENDING').length,
        approved: leaves.filter(r => r.status === 'APPROVED').length,
        rejected: leaves.filter(r => r.status === 'REJECTED').length,
        cancelled: leaves.filter(r => r.status === 'CANCELLED').length,
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };

    if (authLoading || !mounted) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">Accès refusé</p>
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-screen-xl mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Mes demandes de congés</h1>
                    <p className="text-gray-600">Gérez vos demandes de congés facilement</p>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <button
                        onClick={handleNewLeaveClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nouvelle demande
                    </button>
                </motion.div>
            </div>

            {/* Section Solde */}
            <motion.div
                className="bg-white shadow rounded-lg p-6 mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Mon solde de congés ({currentYear})</h2>
                {loadingBalance ? (
                    <div className="flex justify-center py-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : errorBalance ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                        <p className="font-medium">Erreur</p>
                        <p>{errorBalance}</p>
                    </div>
                ) : balance ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                            className="bg-blue-50 p-4 rounded-lg shadow-sm"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-blue-600 font-medium mb-1">Total alloué</p>
                            <p className="text-3xl font-bold text-blue-800">{balance.totalDays}</p>
                            <p className="text-xs text-blue-500 mt-1">jours de congés</p>
                        </motion.div>
                        <motion.div
                            className="bg-orange-50 p-4 rounded-lg shadow-sm"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-orange-600 font-medium mb-1">Utilisés</p>
                            <p className="text-3xl font-bold text-orange-800">{balance.usedDays}</p>
                            <p className="text-xs text-orange-500 mt-1">jours pris ou planifiés</p>
                        </motion.div>
                        <motion.div
                            className="bg-green-50 p-4 rounded-lg shadow-sm"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-green-600 font-medium mb-1">Restants</p>
                            <p className="text-3xl font-bold text-green-800">{balance.remainingDays}</p>
                            <p className="text-xs text-green-500 mt-1">jours disponibles</p>
                        </motion.div>
                    </div>
                ) : null}
            </motion.div>

            {/* Filtres et recherche */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Rechercher un congé..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                onClick={() => setSearchTerm('')}
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter(['PENDING', 'APPROVED'])}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter.length === 2 && statusFilter.includes('PENDING') && statusFilter.includes('APPROVED')
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            Actifs
                        </button>
                        <button
                            onClick={() => handleStatusFilterChange('PENDING')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter.includes('PENDING')
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                En attente ({counts.pending})
                            </div>
                        </button>
                        <button
                            onClick={() => handleStatusFilterChange('APPROVED')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter.includes('APPROVED')
                                ? 'bg-green-100 text-green-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approuvés ({counts.approved})
                            </div>
                        </button>
                        <button
                            onClick={() => handleStatusFilterChange('REJECTED')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter.includes('REJECTED')
                                ? 'bg-red-100 text-red-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <XCircle className="w-4 h-4 mr-2" />
                                Refusés ({counts.rejected})
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des congés */}
            {isLoadingLeaves ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : errorLeaves ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded">
                    <p className="font-medium">Erreur</p>
                    <p>{errorLeaves}</p>
                </div>
            ) : sortedLeaves.length === 0 ? (
                <motion.div
                    className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
                    <p className="mt-1 text-gray-500">Vous n'avez pas encore de demandes de congés ou aucune ne correspond à vos critères.</p>
                    <button
                        onClick={handleNewLeaveClick}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Créer une demande
                    </button>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {sortedLeaves.map((leave, index) => (
                        <motion.div
                            key={leave.id}
                            className={`border-l-4 ${getStatusColor(leave.status)} bg-white shadow-sm rounded-lg overflow-hidden`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                        >
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                {getStatusText(leave.status)}
                                            </span>
                                            <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                {leave.type}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap">
                                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                                <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:ml-4">
                                                <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                {leave.countedDays} jour{leave.countedDays > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {leave.reason && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{leave.reason}</p>
                                        )}
                                    </div>

                                    <div className="mt-4 md:mt-0 flex space-x-2">
                                        {leave.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleCancelLeaveClick(leave)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Annuler
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleViewLeaveDetails(leave)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modale pour le formulaire de congé (création/édition) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {leaveToEdit ? 'Modifier la demande' : 'Nouvelle demande de congé'}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <LeaveForm
                                userId={user.id}
                                onSuccess={handleLeaveCreatedOrUpdated}
                            // initialData={leaveToEdit || undefined} // À décommenter quand LeaveForm sera prêt pour l'édition
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modale de détails */}
            {isDetailModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la demande</h3>
                                <button
                                    onClick={handleCloseDetailModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedLeave.status)}`}>
                                    {getStatusIcon(selectedLeave.status)}
                                    {getStatusText(selectedLeave.status)}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type de congé</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jours comptabilisés</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.countedDays} jour{selectedLeave.countedDays > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                                    </div>
                                </div>

                                {selectedLeave.reason && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Motif</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.reason}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date de création</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            {selectedLeave.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        handleCancelLeaveClick(selectedLeave);
                                        handleCloseDetailModal();
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Annuler cette demande
                                </button>
                            )}
                            <button
                                onClick={handleCloseDetailModal}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modale de confirmation pour l'annulation */}
            {isConfirmModalOpen && leaveToCancel && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmCancelLeave}
                    title="Confirmer l'annulation"
                    message={`Êtes-vous sûr de vouloir annuler cette demande de congé ? Cette action est irréversible.`}
                    confirmButtonText="Oui, annuler"
                    cancelButtonText="Non"
                />
            )}
        </motion.div>
    );
} 