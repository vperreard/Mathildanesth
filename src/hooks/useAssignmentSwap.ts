import { useCallback, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'react-toastify';
import { NotificationType } from '@prisma/client';

export type AssignmentSwapStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface Assignment {
    id: string;
    userId: number;
    date: string;
    user?: {
        id: number;
        firstName?: string;
        lastName?: string;
        email: string;
        profileImageUrl?: string;
    };
    // Autres propriétés potentielles
    [key: string]: any;
}

export interface AssignmentSwapRequest {
    id: string;
    initiatorUserId: number;
    proposedAssignmentId: string;
    targetUserId?: number | null;
    requestedAssignmentId?: string | null;
    status: AssignmentSwapStatus;
    message?: string | null;
    responseMessage?: string | null;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string | null;

    // Relations
    initiator?: {
        id: number;
        firstName?: string;
        lastName?: string;
        email: string;
        profileImageUrl?: string;
    };
    targetUser?: {
        id: number;
        firstName?: string;
        lastName?: string;
        email: string;
        profileImageUrl?: string;
    };
    proposedAssignment?: Assignment;
    requestedAssignment?: Assignment;
}

interface SwapListResponse {
    items: AssignmentSwapRequest[];
    total: number;
    offset: number;
    limit: number;
}

interface UseAssignmentSwapReturn {
    isLoading: boolean;
    error: string | null;
    swapRequests: AssignmentSwapRequest[];
    totalSwapRequests: number;
    currentSwapRequest: AssignmentSwapRequest | null;

    fetchSwapRequests: (params?: {
        status?: AssignmentSwapStatus;
        role?: 'initiator' | 'target' | 'all';
        limit?: number;
        offset?: number;
    }) => Promise<SwapListResponse | null>;

    fetchSwapRequestById: (id: string) => Promise<AssignmentSwapRequest | null>;

    createSwapRequest: (data: {
        proposedAssignmentId: string;
        targetUserId: number;
        requestedAssignmentId?: string;
        message?: string;
        expiresAt?: string;
    }) => Promise<AssignmentSwapRequest | null>;

    updateSwapRequest: (id: string, data: {
        status: AssignmentSwapStatus;
        responseMessage?: string;
    }) => Promise<AssignmentSwapRequest | null>;

    deleteSwapRequest: (id: string) => Promise<boolean>;

    adminAction: (id: string, data: {
        action: 'approve' | 'reject';
        reason?: string;
    }) => Promise<AssignmentSwapRequest | null>;
}

/**
 * Hook pour gérer les échanges d'affectations
 */
export function useAssignmentSwap(): UseAssignmentSwapReturn {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [swapRequests, setSwapRequests] = useState<AssignmentSwapRequest[]>([]);
    const [totalSwapRequests, setTotalSwapRequests] = useState<number>(0);
    const [currentSwapRequest, setCurrentSwapRequest] = useState<AssignmentSwapRequest | null>(null);

    const { markNotificationAsRead } = useNotifications();

    /**
     * Construit les paramètres de requête à partir d'un objet
     */
    const buildQueryParams = (params: Record<string, any>) => {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        return queryParams.toString();
    };

    /**
     * Récupère la liste des demandes d'échange
     */
    const fetchSwapRequests = useCallback(async (params: {
        status?: AssignmentSwapStatus;
        role?: 'initiator' | 'target' | 'all';
        limit?: number;
        offset?: number;
    } = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const queryString = buildQueryParams(params);
            const url = `/api/affectations/echange${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des demandes d\'échange');
            }

            const data: SwapListResponse = await response.json();
            setSwapRequests(data.items);
            setTotalSwapRequests(data.total);

            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Récupère une demande d'échange spécifique
     */
    const fetchSwapRequestById = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/affectations/echange/${id}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération de la demande d\'échange');
            }

            const data: AssignmentSwapRequest = await response.json();
            setCurrentSwapRequest(data);

            // Marquer la notification associée comme lue, si elle existe
            const notificationsToMark = [
                NotificationType.ASSIGNMENT_SWAP_REQUEST_RECEIVED,
                NotificationType.ASSIGNMENT_SWAP_REQUEST_ACCEPTED,
                NotificationType.ASSIGNMENT_SWAP_REQUEST_REJECTED,
                NotificationType.ASSIGNMENT_SWAP_REQUEST_CANCELLED,
                NotificationType.ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN
            ];

            await markNotificationAsRead({
                relatedRequestId: id,
                types: notificationsToMark
            });

            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [markNotificationAsRead]);

    /**
     * Crée une nouvelle demande d'échange
     */
    const createSwapRequest = useCallback(async (data: {
        proposedAssignmentId: string;
        targetUserId: number;
        requestedAssignmentId?: string;
        message?: string;
        expiresAt?: string;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/affectations/echange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la demande d\'échange');
            }

            const newSwapRequest: AssignmentSwapRequest = await response.json();

            // Mettre à jour l'état local
            setSwapRequests(prev => [newSwapRequest, ...prev]);
            setTotalSwapRequests(prev => prev + 1);

            toast.success('Demande d\'échange créée avec succès');

            return newSwapRequest;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Met à jour une demande d'échange (accepter, refuser, annuler)
     */
    const updateSwapRequest = useCallback(async (id: string, data: {
        status: AssignmentSwapStatus;
        responseMessage?: string;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/affectations/echange/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour de la demande d\'échange');
            }

            const updatedSwapRequest: AssignmentSwapRequest = await response.json();

            // Mettre à jour l'état local
            setSwapRequests(prev => prev.map(req =>
                req.id === id ? updatedSwapRequest : req
            ));

            if (currentSwapRequest?.id === id) {
                setCurrentSwapRequest(updatedSwapRequest);
            }

            // Afficher un message basé sur l'action effectuée
            let successMessage = 'Demande d\'échange mise à jour';

            switch (data.status) {
                case 'ACCEPTED':
                    successMessage = 'Demande d\'échange acceptée avec succès';
                    break;
                case 'REJECTED':
                    successMessage = 'Demande d\'échange refusée';
                    break;
                case 'CANCELLED':
                    successMessage = 'Demande d\'échange annulée';
                    break;
            }

            toast.success(successMessage);

            return updatedSwapRequest;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [currentSwapRequest]);

    /**
     * Supprime une demande d'échange
     */
    const deleteSwapRequest = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/affectations/echange/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression de la demande d\'échange');
            }

            // Mettre à jour l'état local
            setSwapRequests(prev => prev.filter(req => req.id !== id));
            setTotalSwapRequests(prev => prev - 1);

            if (currentSwapRequest?.id === id) {
                setCurrentSwapRequest(null);
            }

            toast.success('Demande d\'échange supprimée avec succès');

            return true;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentSwapRequest]);

    /**
     * Action administrative (approuver/rejeter)
     */
    const adminAction = useCallback(async (id: string, data: {
        action: 'approve' | 'reject';
        reason?: string;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/affectations/echange/${id}/admin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'action administrative');
            }

            const updatedSwapRequest: AssignmentSwapRequest = await response.json();

            // Mettre à jour l'état local
            setSwapRequests(prev => prev.map(req =>
                req.id === id ? updatedSwapRequest : req
            ));

            if (currentSwapRequest?.id === id) {
                setCurrentSwapRequest(updatedSwapRequest);
            }

            // Message basé sur l'action
            const successMessage = data.action === 'approve'
                ? 'Échange approuvé avec succès'
                : 'Échange rejeté avec succès';

            toast.success(successMessage);

            return updatedSwapRequest;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [currentSwapRequest]);

    return {
        isLoading,
        error,
        swapRequests,
        totalSwapRequests,
        currentSwapRequest,
        fetchSwapRequests,
        fetchSwapRequestById,
        createSwapRequest,
        updateSwapRequest,
        deleteSwapRequest,
        adminAction
    };
} 