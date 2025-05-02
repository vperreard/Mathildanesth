/**
 * Types globaux pour la gestion des congés
 */

/**
 * Interface représentant un congé
 */
export interface Leave {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    type: string;
    status: string;
    reason?: string;
    workingDaysCount: number;
    countedDays: number;
    isRecurring: boolean;
    recurrencePattern?: any;
    createdAt: Date;
    updatedAt: Date;
} 