import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Leave, LeaveStatus, LeaveType } from '../types/leave';

interface LeaveDetailModalProps {
    leaveId: string;
    onClose: () => void;
    onStatusChange?: (leaveId: string, newStatus: LeaveStatus) => Promise<void>;
    onDelete?: (leaveId: string) => Promise<void>;
}

/**
 * Modal affichant les détails d'un congé et permettant des actions
 */
export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
    leaveId,
    onClose,
    onStatusChange,
    onDelete
}) => {
    const [leave, setLeave] = useState<Leave | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [processingAction, setProcessingAction] = useState<boolean>(false);

    // Simuler le chargement des détails du congé
    useEffect(() => {
        const fetchLeaveDetails = async () => {
            setLoading(true);
            try {
                // Simuler un appel API
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Data de test pour le test
                const fakeLeave: Leave = {
                    id: leaveId,
                    userId: 'user1',
                    requestDate: new Date('2023-05-20'),
                    type: LeaveType.ANNUAL,
                    status: LeaveStatus.PENDING,
                    startDate: new Date('2023-06-01'),
                    endDate: new Date('2023-06-15'),
                    countedDays: 10,
                    comment: 'Congés d\'été',
                    isRecurring: false,
                    createdAt: new Date('2023-05-20'),
                    updatedAt: new Date('2023-05-20'),
                    user: {
                        id: 'user1',
                        prenom: 'Jean',
                        nom: 'Dupont',
                        email: 'jean.dupont@example.com',
                        role: 'UTILISATEUR'
                    }
                };

                setLeave(fakeLeave);
                setLoading(false);
            } catch (err: unknown) {
                setError('Erreur lors du chargement des détails du congé.');
                setLoading(false);
            }
        };

        fetchLeaveDetails();
    }, [leaveId]);

    // Gérer le changement de statut
    const handleStatusChange = async (newStatus: LeaveStatus) => {
        if (!onStatusChange || !leave) return;

        setProcessingAction(true);
        try {
            await onStatusChange(leaveId, newStatus);
            setLeave(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err: unknown) {
            setError('Erreur lors de la modification du statut.');
        } finally {
            setProcessingAction(false);
        }
    };

    // Gérer la suppression
    const handleDelete = async () => {
        if (!onDelete) return;

        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce congé ?')) {
            setProcessingAction(true);
            try {
                await onDelete(leaveId);
                onClose(); // Fermer le modal après suppression
            } catch (err: unknown) {
                setError('Erreur lors de la suppression du congé.');
                setProcessingAction(false);
            }
        }
    };

    // Afficher le type de congé en français
    const getLeaveTypeLabel = (type: LeaveType): string => {
        switch (type) {
            case LeaveType.ANNUAL: return 'Congé annuel';
            case LeaveType.RECOVERY: return 'Récupération';
            case LeaveType.SICK: return 'Congé maladie';
            case LeaveType.MATERNITY: return 'Congé maternité';
            case LeaveType.PATERNITY: return 'Congé paternité';
            case LeaveType.PARENTAL: return 'Congé parental';
            case LeaveType.TRAINING: return 'Formation';
            case LeaveType.SPECIAL: return 'Congé spécial';
            case LeaveType.UNPAID: return 'Congé sans solde';
            default: return 'Autre congé';
        }
    };

    // Afficher le statut en français
    const getStatusLabel = (status: LeaveStatus): string => {
        switch (status) {
            case LeaveStatus.PENDING: return 'En attente';
            case LeaveStatus.APPROVED: return 'Approuvé';
            case LeaveStatus.REJECTED: return 'Refusé';
            case LeaveStatus.CANCELLED: return 'Annulé';
            default: return status;
        }
    };

    // Obtenir la couleur du badge de statut
    const getStatusColor = (status: LeaveStatus): string => {
        switch (status) {
            case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
            case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
            case LeaveStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="text-center mt-4">Chargement des détails...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                    <h2 className="text-xl font-bold mb-4 text-red-600">Erreur</h2>
                    <p>{error}</p>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!leave) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-lg w-full">
                    <h2 className="text-xl font-bold mb-4">Congé introuvable</h2>
                    <p>Impossible de trouver les détails du congé demandé.</p>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold mb-6">Détails du congé</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Fermer"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Demandeur</h3>
                        <p className="text-lg">{leave.user?.prenom} {leave.user?.nom}</p>
                        <p className="text-sm text-gray-600">{leave.user?.email}</p>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Statut</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                            {getStatusLabel(leave.status)}
                        </span>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Type de congé</h3>
                        <p className="text-lg">{getLeaveTypeLabel(leave.type)}</p>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Date de demande</h3>
                        <p className="text-lg">{format(new Date(leave.requestDate), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Période</h3>
                        <p className="text-lg">
                            Du {format(new Date(leave.startDate), 'dd MMMM yyyy', { locale: fr })} au {format(new Date(leave.endDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-sm text-gray-600">{leave.countedDays} jour(s) décomptés</p>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-500 mb-2">Récurrent</h3>
                        <p className="text-lg">{leave.isRecurring ? 'Oui' : 'Non'}</p>
                    </div>
                </div>

                {leave.comment && (
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-500 mb-2">Commentaire</h3>
                        <p className="bg-gray-50 p-3 rounded">{leave.comment}</p>
                    </div>
                )}

                <div className="border-t pt-6 flex justify-between">
                    <div>
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={processingAction}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                Supprimer
                            </button>
                        )}
                    </div>

                    <div className="space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Fermer
                        </button>

                        {onStatusChange && leave.status === LeaveStatus.PENDING && (
                            <>
                                <button
                                    onClick={() => handleStatusChange(LeaveStatus.REJECTED)}
                                    disabled={processingAction}
                                    className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                                >
                                    Refuser
                                </button>
                                <button
                                    onClick={() => handleStatusChange(LeaveStatus.APPROVED)}
                                    disabled={processingAction}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    Approuver
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 