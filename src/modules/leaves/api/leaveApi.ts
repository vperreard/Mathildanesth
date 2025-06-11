/**
 * API pour la gestion des congés
 */
import apiClient from '../../../utils/apiClient';
import {
  LeaveRequest,
  LeaveStatus,
  LeaveFilters,
  PaginatedLeaveResults,
  LeaveResponse,
  LeaveDocument,
} from '../types/leave';

/**
 * Service API pour la gestion des congés
 */
const leaveApi = {
  /**
   * Récupère les demandes de congés d'un employé
   * @param employeeId Identifiant de l'employé
   * @param filters Filtres optionnels
   * @returns Liste paginée des demandes
   */
  getEmployeeLeaves: async (
    employeeId: string,
    filters?: Partial<LeaveFilters>
  ): Promise<PaginatedLeaveResults> => {
    const response = await apiClient.get('/api/leaves/employee/' + employeeId, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Récupère toutes les demandes de congés (admin/managers)
   * @param filters Filtres optionnels
   * @returns Liste paginée des demandes
   */
  getAllLeaves: async (filters?: Partial<LeaveFilters>): Promise<PaginatedLeaveResults> => {
    const response = await apiClient.get('/api/leaves', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Récupère une demande spécifique par son ID
   * @param leaveId Identifiant de la demande
   * @returns Détails de la demande
   */
  getLeaveById: async (leaveId: string): Promise<LeaveRequest> => {
    const response = await apiClient.get(`/api/leaves/${leaveId}`);
    return response.data;
  },

  /**
   * Crée une nouvelle demande de congés
   * @param leaveData Données de la demande
   * @returns Demande créée
   */
  createLeave: async (
    leaveData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<LeaveRequest> => {
    const response = await apiClient.post('/api/leaves', leaveData);
    return response.data;
  },

  /**
   * Met à jour une demande existante
   * @param leaveId Identifiant de la demande
   * @param leaveData Données à mettre à jour
   * @returns Demande mise à jour
   */
  updateLeave: async (leaveId: string, leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const response = await apiClient.put(`/api/leaves/${leaveId}`, leaveData);
    return response.data;
  },

  /**
   * Supprime une demande de congés
   * @param leaveId Identifiant de la demande
   * @returns Statut de suppression
   */
  deleteLeave: async (leaveId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/api/leaves/${leaveId}`);
    return response.data;
  },

  /**
   * Annule une demande de congés
   * @param leaveId Identifiant de la demande
   * @returns Demande mise à jour
   */
  cancelLeave: async (leaveId: string): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/api/leaves/${leaveId}/cancel`);
    return response.data;
  },

  /**
   * Répond à une demande de congés (approbation ou rejet)
   * @param leaveId Identifiant de la demande
   * @param response Réponse à la demande
   * @returns Demande mise à jour
   */
  respondToLeave: async (leaveId: string, response: LeaveResponse): Promise<LeaveRequest> => {
    const responseData = await apiClient.post(`/api/leaves/${leaveId}/respond`, response);
    return responseData.data;
  },

  /**
   * Télécharge un document justificatif
   * @param documentId Identifiant du document
   * @returns URL de téléchargement
   */
  downloadDocument: async (documentId: string): Promise<{ url: string }> => {
    const response = await apiClient.get(`/api/leaves/documents/${documentId}/download`);
    return response.data;
  },

  /**
   * Téléverse un document justificatif
   * @param leaveId Identifiant de la demande
   * @param file Fichier à téléverser
   * @param documentType Type de document
   * @returns Document créé
   */
  uploadDocument: async (
    leaveId: string,
    file: File,
    documentType: LeaveDocument['documentType']
  ): Promise<LeaveDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await apiClient.post(`/api/leaves/${leaveId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Supprime un document justificatif
   * @param leaveId Identifiant de la demande
   * @param documentId Identifiant du document
   * @returns Statut de suppression
   */
  deleteDocument: async (leaveId: string, documentId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/api/leaves/${leaveId}/documents/${documentId}`);
    return response.data;
  },

  /**
   * Vérifie les conflits potentiels pour une période de congés
   * @param employeeId Identifiant de l'employé
   * @param startDate Date de début
   * @param endDate Date de fin
   * @param leaveId Identifiant de la demande existante (pour exclusion)
   * @returns Résultat de vérification des conflits
   */
  checkConflicts: async (
    employeeId: string,
    startDate: string,
    endDate: string,
    leaveId?: string
  ): Promise<{ hasConflicts: boolean; conflicts: LeaveRequest[] }> => {
    const response = await apiClient.get('/api/leaves/conflicts', {
      params: {
        employeeId,
        startDate,
        endDate,
        leaveId,
      },
    });
    return response.data;
  },
};

export default leaveApi;
