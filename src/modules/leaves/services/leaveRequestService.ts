/**
 * Service de gestion des demandes de congés
 */
import apiClient from '../../../utils/apiClient';
import {
    LeaveRequest,
    LeaveResponse,
    LeaveStatus,
    LeaveFilters,
    PaginatedLeaveResults,
    LeaveDocument,
    LeaveStats
} from '../types/leave';

/**
 * Service pour la gestion des demandes de congés
 */
const leaveRequestService = {
    /**
     * Récupère les demandes de congés avec filtrage et pagination
     * @param filters Filtres pour la recherche
     * @returns Résultats paginés
     */
    getLeaveRequests: async (
        filters: LeaveFilters = {}
    ): Promise<PaginatedLeaveResults> => {
        const response = await apiClient.get('/api/leave-requests', {
            params: filters
        });
        return response.data;
    },

    /**
     * Récupère les demandes de congés d'un utilisateur spécifique
     * @param userId ID de l'utilisateur
     * @param filters Filtres additionnels
     * @returns Résultats paginés
     */
    getUserLeaveRequests: async (
        userId: string,
        filters: Omit<LeaveFilters, 'userId'> = {}
    ): Promise<PaginatedLeaveResults> => {
        const response = await apiClient.get(`/api/leave-requests/user/${userId}`, {
            params: filters
        });
        return response.data;
    },

    /**
     * Récupère les détails d'une demande de congé
     * @param id ID de la demande
     * @returns Détails de la demande
     */
    getLeaveRequest: async (id: string): Promise<LeaveRequest> => {
        const response = await apiClient.get(`/api/leave-requests/${id}`);
        return response.data;
    },

    /**
     * Crée une nouvelle demande de congé
     * @param leaveRequest Données de la demande
     * @returns Demande créée
     */
    createLeaveRequest: async (
        leaveRequest: Omit<LeaveRequest, 'id' | 'status' | 'requestDate' | 'createdAt' | 'updatedAt'>
    ): Promise<LeaveRequest> => {
        const response = await apiClient.post('/api/leave-requests', leaveRequest);
        return response.data;
    },

    /**
     * Met à jour une demande de congé existante
     * @param id ID de la demande
     * @param leaveRequest Données mises à jour
     * @returns Demande mise à jour
     */
    updateLeaveRequest: async (
        id: string,
        leaveRequest: Partial<LeaveRequest>
    ): Promise<LeaveRequest> => {
        const response = await apiClient.put(`/api/leave-requests/${id}`, leaveRequest);
        return response.data;
    },

    /**
     * Soumet une demande de congé pour approbation
     * @param id ID de la demande
     * @returns Demande mise à jour
     */
    submitLeaveRequest: async (id: string): Promise<LeaveRequest> => {
        const response = await apiClient.post(`/api/leave-requests/${id}/submit`);
        return response.data;
    },

    /**
     * Annule une demande de congé
     * @param id ID de la demande
     * @param reason Raison de l'annulation
     * @returns Demande mise à jour
     */
    cancelLeaveRequest: async (
        id: string,
        reason?: string
    ): Promise<LeaveRequest> => {
        const response = await apiClient.post(`/api/leave-requests/${id}/cancel`, { reason });
        return response.data;
    },

    /**
     * Répond à une demande de congé (approbation ou rejet)
     * @param id ID de la demande
     * @param response Réponse à la demande
     * @returns Demande mise à jour
     */
    respondToLeaveRequest: async (
        id: string,
        response: LeaveResponse
    ): Promise<LeaveRequest> => {
        const url = `/api/leave-requests/${id}/${response.status === LeaveStatus.APPROUVE ? 'approve' : 'reject'
            }`;
        const apiResponse = await apiClient.post(url, { comment: response.comment });
        return apiResponse.data;
    },

    /**
     * Télécharge un document justificatif pour une demande
     * @param leaveId ID de la demande
     * @param file Fichier à télécharger
     * @param documentType Type de document
     * @returns Document téléchargé
     */
    uploadDocument: async (
        leaveId: string,
        file: File,
        documentType: string
    ): Promise<LeaveDocument> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        const response = await apiClient.post(
            `/api/leave-requests/${leaveId}/documents`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return response.data;
    },

    /**
     * Supprime un document justificatif
     * @param leaveId ID de la demande
     * @param documentId ID du document
     * @returns Statut de l'opération
     */
    deleteDocument: async (
        leaveId: string,
        documentId: string
    ): Promise<{ success: boolean }> => {
        const response = await apiClient.delete(
            `/api/leave-requests/${leaveId}/documents/${documentId}`
        );
        return response.data;
    },

    /**
     * Récupère les statistiques de congés
     * @param period Période ('month', 'quarter', 'year')
     * @param date Date de référence
     * @param departmentId ID du département (optionnel)
     * @returns Statistiques de congés
     */
    getLeaveStats: async (
        period: 'month' | 'quarter' | 'year',
        date: Date | string,
        departmentId?: string
    ): Promise<LeaveStats> => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

        const response = await apiClient.get('/api/leave-requests/stats', {
            params: {
                period,
                date: dateStr,
                departmentId
            }
        });

        return response.data;
    },

    /**
     * Récupère les congés pour un calendrier
     * @param startDate Date de début
     * @param endDate Date de fin
     * @param departmentId ID du département (optionnel)
     * @returns Liste des congés
     */
    getCalendarLeaves: async (
        startDate: Date | string,
        endDate: Date | string,
        departmentId?: string
    ): Promise<LeaveRequest[]> => {
        const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
        const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];

        const response = await apiClient.get('/api/leave-requests/calendrier', {
            params: {
                startDate: start,
                endDate: end,
                departmentId
            }
        });

        return response.data;
    },

    /**
     * Exporte les demandes de congés filtrées au format Excel/CSV
     * @param filters Filtres pour les données à exporter
     * @param format Format d'export ('xlsx' ou 'csv')
     * @returns URL de téléchargement
     */
    exportLeaveRequests: async (
        filters: LeaveFilters = {},
        format: 'xlsx' | 'csv' = 'xlsx'
    ): Promise<{ url: string }> => {
        const response = await apiClient.get('/api/leave-requests/export', {
            params: { ...filters, format },
            responseType: 'blob'
        });

        // Création d'une URL pour le téléchargement du fichier
        const blob = new Blob([response.data], {
            type: format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv'
        });

        const url = window.URL.createObjectURL(blob);
        return { url };
    }
};

export default leaveRequestService; 