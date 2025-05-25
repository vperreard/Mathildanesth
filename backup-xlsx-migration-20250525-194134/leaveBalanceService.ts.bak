/**
 * Service de gestion des soldes de congés
 */
import apiClient from '../../../utils/apiClient';
import { LeaveBalance, LeaveBalanceAdjustment, LeaveType } from '../types/leave';

/**
 * Service pour la gestion des soldes de congés
 */
const leaveBalanceService = {
    /**
     * Récupère le solde de congés d'un utilisateur pour tous les types de congés
     * @param userId ID de l'utilisateur
     * @param year Année concernée (optionnel, année courante par défaut)
     * @returns Soldes de congés
     */
    getUserBalances: async (
        userId: string,
        year?: number
    ): Promise<LeaveBalance[]> => {
        const currentYear = year || new Date().getFullYear();
        const response = await apiClient.get(`/api/leave-balances/${userId}`, {
            params: { year: currentYear }
        });
        return response.data;
    },

    /**
     * Récupère le solde de congés d'un utilisateur pour un type spécifique
     * @param userId ID de l'utilisateur
     * @param type Type de congé
     * @param year Année concernée (optionnel, année courante par défaut)
     * @returns Solde de congés
     */
    getUserBalanceByType: async (
        userId: string,
        type: LeaveType,
        year?: number
    ): Promise<LeaveBalance> => {
        const currentYear = year || new Date().getFullYear();
        const response = await apiClient.get(`/api/leave-balances/${userId}/${type}`, {
            params: { year: currentYear }
        });
        return response.data;
    },

    /**
     * Ajuste le solde de congés d'un utilisateur
     * @param userId ID de l'utilisateur
     * @param type Type de congé
     * @param amount Montant de l'ajustement (positif pour ajout, négatif pour retrait)
     * @param reason Raison de l'ajustement
     * @param year Année concernée (optionnel, année courante par défaut)
     * @returns Solde mis à jour
     */
    adjustBalance: async (
        userId: string,
        type: LeaveType,
        amount: number,
        reason: string,
        year?: number
    ): Promise<LeaveBalance> => {
        const currentYear = year || new Date().getFullYear();
        const response = await apiClient.post(`/api/leave-balances/${userId}/adjust`, {
            type,
            amount,
            reason,
            year: currentYear
        });
        return response.data;
    },

    /**
     * Calcule le nombre de jours ouvrés entre deux dates
     * @param startDate Date de début
     * @param endDate Date de fin
     * @param halfDayStart Premier jour compté comme demi-journée
     * @param halfDayEnd Dernier jour compté comme demi-journée
     * @returns Nombre de jours
     */
    calculateWorkingDays: async (
        startDate: Date | string,
        endDate: Date | string,
        halfDayStart?: boolean,
        halfDayEnd?: boolean
    ): Promise<number> => {
        // Conversion en chaînes de caractères ISO si nécessaire
        const start = typeof startDate === 'string' ? startDate : startDate.toISOString();
        const end = typeof endDate === 'string' ? endDate : endDate.toISOString();

        const response = await apiClient.get('/api/leave-balances/calculate-days', {
            params: {
                startDate: start,
                endDate: end,
                halfDayStart,
                halfDayEnd
            }
        });

        return response.data.days;
    },

    /**
     * Récupère l'historique des ajustements de solde pour un utilisateur
     * @param userId ID de l'utilisateur
     * @param year Année concernée (optionnel)
     * @returns Liste des ajustements
     */
    getAdjustmentsHistory: async (
        userId: string,
        year?: number
    ): Promise<LeaveBalanceAdjustment[]> => {
        const response = await apiClient.get(`/api/leave-balances/${userId}/adjustments`, {
            params: { year }
        });
        return response.data;
    },

    /**
     * Réinitialise les soldes pour une nouvelle année
     * @param year Année à initialiser
     * @returns Statut de l'opération
     */
    initializeYearBalances: async (year: number): Promise<{ success: boolean; count: number }> => {
        const response = await apiClient.post('/api/leave-balances/initialize-year', {
            year
        });
        return response.data;
    },

    /**
     * Reporte les soldes non utilisés d'une année à l'autre
     * @param fromYear Année source
     * @param toYear Année destination
     * @param maxDaysToCarryOver Nombre maximal de jours à reporter (optionnel)
     * @returns Statut de l'opération
     */
    carryOverBalances: async (
        fromYear: number,
        toYear: number,
        maxDaysToCarryOver?: number
    ): Promise<{ success: boolean; count: number }> => {
        const response = await apiClient.post('/api/leave-balances/carry-over', {
            fromYear,
            toYear,
            maxDaysToCarryOver
        });
        return response.data;
    },

    /**
     * Exporte les soldes de congés au format Excel/CSV
     * @param year Année concernée
     * @param format Format d'export ('xlsx' ou 'csv')
     * @returns URL de téléchargement
     */
    exportBalances: async (
        year: number,
        format: 'xlsx' | 'csv' = 'xlsx'
    ): Promise<{ url: string }> => {
        const response = await apiClient.get('/api/leave-balances/export', {
            params: { year, format },
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

export default leaveBalanceService; 