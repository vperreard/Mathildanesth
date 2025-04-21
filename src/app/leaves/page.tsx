'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LeavesList from '@/modules/leaves/components/LeavesList';
import axios from 'axios'; // Pour les appels API
import Modal from '@/components/Modal'; // Importer la modale
import { LeaveForm } from '@/modules/leaves/components/LeaveForm'; // Importer le formulaire
import ConfirmationModal from '@/components/ConfirmationModal'; // Importer la modale de confirmation
import { LeaveWithUser, LeaveStatus, LeaveType } from '@/modules/leaves/types/leave'; // Importer les types nécessaires

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

// Type pour les clés triables/filtrables (doit correspondre à celui dans LeavesList)
// Note: Si LeavesList l'exportait, on pourrait l'importer directement.
// Recopie temporaire ici.
type SortableFilterableKeys = keyof LeaveWithUser | 'user' | 'type' | 'startDate' | 'endDate';

export default function LeavesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [errorBalance, setErrorBalance] = useState<string | null>(null);

    // --- États pour LeavesList ---
    const [leaves, setLeaves] = useState<LeaveWithUser[]>([]);
    const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);
    const [errorLeaves, setErrorLeaves] = useState<string | null>(null);
    const [currentFilter, setCurrentFilter] = useState<Partial<Record<SortableFilterableKeys, string>>>({});
    // Initialisation du tri par défaut (ex: date de début, décroissant)
    const [currentSort, setCurrentSort] = useState<{ field: SortableFilterableKeys; direction: 'asc' | 'desc' }>({ field: 'startDate', direction: 'desc' });
    // -----------------------------

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [leaveToEdit, setLeaveToEdit] = useState<LeaveToModify | null>(null);
    const [leaveToCancel, setLeaveToCancel] = useState<LeaveToModify | null>(null);
    const [refreshCounter, setRefreshCounter] = useState(0); // Pour recharger les données après modif/annulation

    const currentYear = new Date().getFullYear();

    // --- Fonction pour récupérer les congés --- (À adapter selon votre API)
    const fetchLeaves = useCallback(async () => {
        if (!user) return;
        setIsLoadingLeaves(true);
        setErrorLeaves(null);
        try {
            // Adaptez l'URL et les potentiels paramètres de filtre/tri passés à l'API si nécessaire
            const response = await axios.get<LeaveWithUser[]>('/api/leaves?userId=' + user.id);
            setLeaves(response.data);
        } catch (err: any) {
            console.error('Erreur lors de la récupération des congés:', err);
            setErrorLeaves(err.response?.data?.error || 'Impossible de charger les demandes de congés.');
            setLeaves([]); // Vider la liste en cas d'erreur
        } finally {
            setIsLoadingLeaves(false);
        }
    }, [user]);

    // --- Récupération initiale des données et au changement d'utilisateur/refresh ---
    useEffect(() => {
        if (user) {
            fetchLeaves(); // Récupérer les congés

            // Récupération du solde (existante)
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
            setIsLoadingLeaves(false); // Pas besoin de charger les congés si pas d'utilisateur
            setErrorLeaves('Utilisateur non authentifié pour charger les congés.');
            setLeaves([]);
        }
    }, [user, currentYear, authLoading, refreshCounter, fetchLeaves]); // Ajouter fetchLeaves et refreshCounter

    // --- Handlers pour LeavesList ---
    const handleFilterChange = useCallback((filterName: SortableFilterableKeys, value: string) => {
        setCurrentFilter(prev => ({ ...prev, [filterName]: value }));
        // Note: Le filtrage est appliqué localement par LeavesList via useMemo.
        // Si vous vouliez un filtrage côté serveur, il faudrait rappeler fetchLeaves ici avec les filtres.
    }, []);

    const handleSortChange = useCallback((field: SortableFilterableKeys) => {
        setCurrentSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        // Note: Le tri est appliqué localement par LeavesList via useMemo.
        // Si vous vouliez un tri côté serveur, il faudrait rappeler fetchLeaves ici avec le tri.
    }, []);
    // -----------------------------

    const handleNewLeaveClick = () => {
        setLeaveToEdit(null); // S'assurer qu'on est en mode création
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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setLeaveToEdit(null);
    };

    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setLeaveToCancel(null);
    };

    const handleLeaveCreatedOrUpdated = (savedLeave: any) => {
        console.log('Demande sauvegardée:', savedLeave);
        setIsModalOpen(false);
        setLeaveToEdit(null);
        setRefreshCounter(prev => prev + 1); // Déclenche le useEffect pour recharger
    };

    const handleConfirmCancelLeave = async () => {
        if (!leaveToCancel) return;
        try {
            // Utilisation du POST sur /api/leaves/[id]/cancel au lieu de DELETE
            await axios.post(`/api/leaves/${leaveToCancel.id}/cancel`, {});
            console.log('Demande annulée:', leaveToCancel.id);
            setRefreshCounter(prev => prev + 1); // Déclenche le useEffect pour recharger
        } catch (err: any) {
            console.error("Erreur lors de l'annulation de la demande:", err);
            // TODO: Afficher une notification d'erreur
        } finally {
            handleCloseConfirmModal();
        }
    };

    if (authLoading) {
        return <div className="container mx-auto px-4 py-8 text-center">Chargement de l'authentification...</div>;
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
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des Congés</h1>
                <button
                    onClick={handleNewLeaveClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Nouvelle Demande
                </button>
            </div>

            {/* Section Solde des Congés */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Votre Solde ({currentYear})</h2>
                {loadingBalance && <p className="text-gray-500">Chargement du solde...</p>}
                {errorBalance && <p className="text-red-500">Erreur: {errorBalance}</p>}
                {balance && !loadingBalance && !errorBalance && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-4 rounded">
                            <p className="text-sm text-blue-600 font-medium">Total Alloué</p>
                            <p className="text-2xl font-bold text-blue-800">{balance.totalDays}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded">
                            <p className="text-sm text-orange-600 font-medium">Utilisés</p>
                            <p className="text-2xl font-bold text-orange-800">{balance.usedDays}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded">
                            <p className="text-sm text-green-600 font-medium">Restants</p>
                            <p className="text-2xl font-bold text-green-800">{balance.remainingDays}</p>
                        </div>
                    </div>
                )}
                {/* TODO: Ajouter un lien ou bouton vers les règles de calcul des congés? */}
            </div>

            {/* Section Liste des Congés - Maintenant avec toutes les props */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Vos Demandes de Congés</h2>
                <LeavesList
                    leaves={leaves}
                    isLoading={isLoadingLeaves}
                    error={errorLeaves}
                    currentFilter={currentFilter}
                    onFilterChange={handleFilterChange}
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                    onEditLeaveClick={handleEditLeaveClick}
                    onCancelLeaveClick={handleCancelLeaveClick}
                />
            </div>

            {/* Modale pour le formulaire de congé (création/édition) */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={leaveToEdit ? 'Modifier la Demande' : 'Nouvelle Demande de Congé'}
                >
                    {/* TODO: Adapter LeaveForm pour l'édition en passant initialData={leaveToEdit} */}
                    <LeaveForm
                        userId={user.id}
                        onSuccess={handleLeaveCreatedOrUpdated}
                    // initialData={leaveToEdit || undefined} // A décommenter quand LeaveForm sera prêt
                    />
                </Modal>
            )}

            {/* Modale de confirmation pour l'annulation */}
            {isConfirmModalOpen && leaveToCancel && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmCancelLeave}
                    title="Confirmer l'annulation"
                    message={`Êtes-vous sûr de vouloir annuler cette demande de congé (ID: ${leaveToCancel.id}) ? Cette action est irréversible.`}
                    confirmButtonText="Oui, annuler"
                    cancelButtonText="Non"
                />
            )}
        </div>
    );
} 