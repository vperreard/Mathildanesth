import { useState, useCallback, useEffect } from 'react';
import { logger } from "../lib/logger";
import { toast } from 'react-toastify';
import { useSession } from '@/lib/auth/migration-shim-client';
import { createAuthHeaders } from '@/lib/auth-helpers';

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

    digestFrequency: 'none' | 'daily' | 'weekly';
    notifyOn: {
        messages: boolean;
        updates: boolean;
        reminders: boolean;
        mentions: boolean;
        // Autres types de notifications...
    };
}

export type NotificationPreferencesUpdate = Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export function useNotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();

    /**
     * Récupère les préférences de notifications
     */
    const fetchPreferences = useCallback(async () => {
        if (!session) {
            setError('Vous devez être connecté pour accéder à vos préférences de notifications');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const headers = createAuthHeaders(session);
            const response = await fetch('http://localhost:3000/api/notifications/preferences', { headers });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Non autorisé : Veuillez vous connecter pour accéder à vos préférences');
                    return null;
                }

                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des préférences');
            }

            const data = await response.json();
            setPreferences(data);
            return data;
        } catch (err: unknown) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur lors de la récupération des préférences de notifications:', errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    /**
     * Met à jour les préférences de notifications
     */
    const updatePreferences = useCallback(async (updatedPreferences: Partial<NotificationPreferences>) => {
        if (!session) {
            setError('Vous devez être connecté pour mettre à jour vos préférences de notifications');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const headers = createAuthHeaders(session);
            const response = await fetch('http://localhost:3000/api/notifications/preferences', {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatedPreferences),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Non autorisé : Veuillez vous connecter pour mettre à jour vos préférences');
                    return false;
                }

                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour des préférences');
            }

            const updatedData = await response.json();
            setPreferences(updatedData);
            toast.success('Préférences de notifications mises à jour');
            return true;
        } catch (err: unknown) {
            const errorMessage = err.message || 'Erreur inconnue';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [session]);

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
            quietHoursDays: null,
            digestFrequency: 'none',
            notifyOn: {
                messages: true,
                updates: true,
                reminders: true,
                mentions: true
            }
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