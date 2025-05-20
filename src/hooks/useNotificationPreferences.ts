import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface NotificationPreferences {
    id: string;
    userId: number;

    // Types de notifications
    assignmentReminders: boolean;
    assignmentSwapRequests: boolean;
    assignmentSwapResponses: boolean;
    assignmentSwapAdminActions: boolean;
    contextualMessages: boolean;
    mentionsInMessages: boolean;
    planningUpdates: boolean;
    leaveRequestStatusChanges: boolean;
    openShifts: boolean;
    teamPlanningPublished: boolean;

    // Canaux de notification
    emailEnabled: boolean;
    inAppEnabled: boolean;
    pushEnabled: boolean;

    // Périodes de non-dérangement
    quietHoursEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    quietHoursDays: string | null;

    createdAt: string;
    updatedAt: string;
}

export type NotificationPreferencesUpdate = Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export function useNotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Récupère les préférences de notifications
     */
    const fetchPreferences = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/preferences');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des préférences');
            }

            const data = await response.json();
            setPreferences(data);
            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur lors de la récupération des préférences de notifications:', errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Met à jour les préférences de notifications
     */
    const updatePreferences = useCallback(async (updates: NotificationPreferencesUpdate) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour des préférences');
            }

            const data = await response.json();
            setPreferences(data);
            toast.success('Préférences de notifications mises à jour');
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
     * Réinitialise toutes les préférences aux valeurs par défaut
     */
    const resetToDefaults = useCallback(async () => {
        const defaultPreferences: NotificationPreferencesUpdate = {
            assignmentReminders: true,
            assignmentSwapRequests: true,
            assignmentSwapResponses: true,
            assignmentSwapAdminActions: true,
            contextualMessages: true,
            mentionsInMessages: true,
            planningUpdates: true,
            leaveRequestStatusChanges: true,
            openShifts: false,
            teamPlanningPublished: true,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            quietHoursDays: null
        };

        return await updatePreferences(defaultPreferences);
    }, [updatePreferences]);

    /**
     * Désactive toutes les notifications
     */
    const disableAllNotifications = useCallback(async () => {
        const disabledPreferences: NotificationPreferencesUpdate = {
            assignmentReminders: false,
            assignmentSwapRequests: false,
            assignmentSwapResponses: false,
            assignmentSwapAdminActions: false,
            contextualMessages: false,
            mentionsInMessages: false,
            planningUpdates: false,
            leaveRequestStatusChanges: false,
            openShifts: false,
            teamPlanningPublished: false
        };

        return await updatePreferences(disabledPreferences);
    }, [updatePreferences]);

    /**
     * Met à jour les paramètres des heures calmes
     */
    const updateQuietHours = useCallback(async (
        enabled: boolean,
        start?: string,
        end?: string,
        days?: string[]
    ) => {
        const updates: NotificationPreferencesUpdate = {
            quietHoursEnabled: enabled
        };

        if (start) updates.quietHoursStart = start;
        if (end) updates.quietHoursEnd = end;
        if (days) updates.quietHoursDays = JSON.stringify(days);

        return await updatePreferences(updates);
    }, [updatePreferences]);

    // Charger les préférences au montage du composant
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        isLoading,
        error,
        fetchPreferences,
        updatePreferences,
        resetToDefaults,
        disableAllNotifications,
        updateQuietHours
    };
} 