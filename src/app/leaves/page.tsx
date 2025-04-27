'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    PlusCircle,
    Search,
    Filter,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ChevronDown,
    Calendar
} from 'lucide-react';

// Importation du store et des composants
import { useLeaveStore } from '@/modules/leaves/store/leaveStore';
import { LeaveForm } from '@/modules/leaves/components/LeaveForm';
import { LeaveCard } from '@/modules/leaves/components/LeaveCard';
import ConfirmationModal from '@/components/ConfirmationModal';
import { LeaveWithUser, LeaveStatus, LeaveType } from '@/modules/leaves/types/leave';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
};

export default function LeavesPage() {
    // Auth context
    const { user, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // State pour les modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [leaveToEdit, setLeaveToEdit] = useState<LeaveWithUser | null>(null);
    const [leaveToCancel, setLeaveToCancel] = useState<LeaveWithUser | null>(null);

    // Utilisation du store des congés
    const {
        leaves,
        leaveBalance,
        isLoading,
        error,
        isSubmitting,
        filters,
        searchTerm,
        currentSort,
        fetchLeaves,
        fetchLeaveBalance,
        createLeave,
        updateLeave,
        cancelLeave,
        setSelectedLeave,
        selectedLeave,
        setSearchTerm,
        setFilter,
        resetFilters,
        setSort
    } = useLeaveStore();

    // Chargement initial des données
    useEffect(() => {
        if (user && !authLoading) {
            fetchLeaves(user.id);
            fetchLeaveBalance(user.id, new Date().getFullYear());
        }
    }, [user, authLoading, fetchLeaves, fetchLeaveBalance]);

    // Vérifier si on doit ouvrir automatiquement le formulaire de demande
    useEffect(() => {
        const newRequest = searchParams?.get('newRequest');
        if (newRequest === 'true' && !isModalOpen) {
            handleNewLeaveClick();
            // Supprimer le paramètre newRequest de l'URL pour éviter la réouverture
            router.replace('/leaves', { scroll: false });
        }

        // Vérifier si on doit afficher un congé spécifique
        const leaveId = searchParams?.get('id');
        if (leaveId) {
            const targetLeave = leaves.find(leave => leave.id === leaveId);
            if (targetLeave) {
                setSelectedLeave(targetLeave);
                setIsDetailModalOpen(true);
            }
        }
    }, [searchParams, isModalOpen, router, leaves, setSelectedLeave]);

    // Filtrage et tri des congés
    const filteredLeaves = React.useMemo(() => {
        if (!leaves.length) return [];

        return leaves
            .filter(leave => {
                // Filtrer par statut si un filtre est activé
                if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                    if (!filters.status.includes(leave.status)) {
                        return false;
                    }
                }

                // Recherche textuelle
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const userFullName = leave.user ? `${leave.user.prenom} ${leave.user.nom}`.toLowerCase() : '';
                    const leaveType = leave.type.toLowerCase();

                    return userFullName.includes(searchLower) ||
                        leaveType.includes(searchLower);
                }

                return true;
            })
            .sort((a, b) => {
                const field = currentSort.field;
                const direction = currentSort.direction;

                // Gestion des champs de date
                if (field === 'startDate' || field === 'endDate' || field === 'createdAt') {
                    const dateA = new Date(a[field as keyof LeaveWithUser] as Date);
                    const dateB = new Date(b[field as keyof LeaveWithUser] as Date);

                    return direction === 'asc'
                        ? dateA.getTime() - dateB.getTime()
                        : dateB.getTime() - dateA.getTime();
                }

                // Traitement pour le tri sur l'utilisateur
                if (field === 'user') {
                    const nameA = a.user ? `${a.user.nom} ${a.user.prenom}` : '';
                    const nameB = b.user ? `${b.user.nom} ${b.user.prenom}` : '';

                    return direction === 'asc'
                        ? nameA.localeCompare(nameB)
                        : nameB.localeCompare(nameA);
                }

                // Cas général pour les champs textuels
                const valueA = String(a[field as keyof LeaveWithUser] || '');
                const valueB = String(b[field as keyof LeaveWithUser] || '');

                return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            });
    }, [leaves, filters.status, searchTerm, currentSort]);

    // Gestionnaires d'événements
    const handleNewLeaveClick = () => {
        setLeaveToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditLeaveClick = (leave: LeaveWithUser) => {
        setLeaveToEdit(leave);
        setIsModalOpen(true);
    };

    const handleCancelLeaveClick = (leave: LeaveWithUser) => {
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

    const handleStatusFilterChange = (status: LeaveStatus) => {
        const currentStatusFilters = filters.status as LeaveStatus[] || [];

        if (currentStatusFilters.includes(status)) {
            setFilter('status', currentStatusFilters.filter(s => s !== status));
        } else {
            setFilter('status', [...currentStatusFilters, status]);
        }
    };

    const handleSortChange = (field: string) => {
        setSort(field);
    };

    const handleLeaveCreatedOrUpdated = async (leaveData: any) => {
        if (leaveToEdit) {
            await updateLeave(leaveToEdit.id, leaveData);
        } else {
            await createLeave({
                ...leaveData,
                userId: user?.id,
            });
        }

        setIsModalOpen(false);
        setLeaveToEdit(null);
    };

    const handleConfirmCancelLeave = async () => {
        if (leaveToCancel) {
            await cancelLeave(leaveToCancel.id);
            setIsConfirmModalOpen(false);
            setLeaveToCancel(null);
        }
    };

    // Synthèse des compteurs pour le dashboard
    const counts = {
        total: leaves.length,
        pending: leaves.filter(r => r.status === LeaveStatus.PENDING).length,
        approved: leaves.filter(r => r.status === LeaveStatus.APPROVED).length,
        rejected: leaves.filter(r => r.status === LeaveStatus.REJECTED).length,
        cancelled: leaves.filter(r => r.status === LeaveStatus.CANCELLED).length,
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Veuillez vous connecter pour accéder à la gestion des congés.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des congés</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Consultez et gérez vos demandes de congés
                    </p>
                </div>
                <button
                    onClick={handleNewLeaveClick}
                    className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Nouvelle demande
                </button>
            </div>

            {/* Dashboard des congés */}
            <div className="mt-2 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <motion.div
                        className="bg-white overflow-hidden shadow rounded-lg"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-md">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">Total</div>
                                    <div className="text-lg font-semibold text-gray-900">{counts.total}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white overflow-hidden shadow rounded-lg"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.1 }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-md">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">En attente</div>
                                    <div className="text-lg font-semibold text-gray-900">{counts.pending}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white overflow-hidden shadow rounded-lg"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 p-3 rounded-md">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">Approuvés</div>
                                    <div className="text-lg font-semibold text-gray-900">{counts.approved}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white overflow-hidden shadow rounded-lg"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-red-100 p-3 rounded-md">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">Refusés</div>
                                    <div className="text-lg font-semibold text-gray-900">{counts.rejected}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white overflow-hidden shadow rounded-lg"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4 }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-gray-100 p-3 rounded-md">
                                    <AlertTriangle className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">Annulés</div>
                                    <div className="text-lg font-semibold text-gray-900">{counts.cancelled}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Solde de congés */}
            {leaveBalance && (
                <motion.div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg px-6 py-5 mb-6 text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-lg font-medium mb-2">Solde de congés {new Date().getFullYear()}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-blue-100">Droits initiaux</div>
                            <div className="text-2xl font-bold">{leaveBalance.initialAllowance} jours</div>
                        </div>
                        <div>
                            <div className="text-sm text-blue-100">Jours pris / en attente</div>
                            <div className="text-2xl font-bold">{leaveBalance.used} / {leaveBalance.pending} jours</div>
                        </div>
                        <div>
                            <div className="text-sm text-blue-100">Solde restant</div>
                            <div className="text-2xl font-bold">{leaveBalance.remaining} jours</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Barre de recherche et filtres */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Rechercher..."
                        />
                    </div>

                    <div className="flex flex-wrap justify-start md:justify-end gap-2">
                        <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">Filtrer :</span>
                            <div className="flex space-x-1">
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilterChange(LeaveStatus.PENDING)}
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${(filters.status as LeaveStatus[])?.includes(LeaveStatus.PENDING)
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    En attente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilterChange(LeaveStatus.APPROVED)}
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${(filters.status as LeaveStatus[])?.includes(LeaveStatus.APPROVED)
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    Approuvé
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilterChange(LeaveStatus.REJECTED)}
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${(filters.status as LeaveStatus[])?.includes(LeaveStatus.REJECTED)
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    Refusé
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilterChange(LeaveStatus.CANCELLED)}
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${(filters.status as LeaveStatus[])?.includes(LeaveStatus.CANCELLED)
                                        ? 'bg-gray-300 text-gray-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    Annulé
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">Trier par :</span>
                            <div className="relative inline-block text-left">
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    id="sort-menu"
                                    aria-expanded="true"
                                    aria-haspopup="true"
                                    onClick={() => handleSortChange('startDate')}
                                >
                                    {currentSort.field === 'startDate' ? 'Date' : 'Trier par date'}
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des congés */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : filteredLeaves.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                        <Calendar className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande de congé</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                            ? "Aucun résultat ne correspond à votre recherche."
                            : "Commencez par créer une nouvelle demande de congé."}
                    </p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleNewLeaveClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Nouvelle demande
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredLeaves.map((leave, index) => (
                        <LeaveCard
                            key={leave.id}
                            leave={leave}
                            index={index}
                            onEdit={handleEditLeaveClick}
                            onCancel={handleCancelLeaveClick}
                            onView={handleViewLeaveDetails}
                        />
                    ))}
                </div>
            )}

            {/* Modales */}
            {isModalOpen && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {leaveToEdit ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Fermer</span>
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <LeaveForm
                                    userId={user.id}
                                    onSuccess={handleLeaveCreatedOrUpdated}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDetailModalOpen && selectedLeave && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la demande</h3>
                                <button
                                    type="button"
                                    onClick={handleCloseDetailModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Fermer</span>
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <LeaveCard
                                    leave={selectedLeave}
                                    isExpanded={true}
                                    showActions={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmModalOpen && leaveToCancel && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmCancelLeave}
                    title="Confirmer l'annulation"
                    message="Êtes-vous sûr de vouloir annuler cette demande de congé ? Cette action ne peut pas être annulée."
                />
            )}
        </div>
    );
} 