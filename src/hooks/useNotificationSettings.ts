import { useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import {
    NotificationSettings
} from '@/modules/notifications/components/NotificationSettingsForm';
import {
    getUserNotificationSettings,
    saveUserNotificationSettings,
    resetUserNotificationSettings
} from '@/modules/notifications/api/notificationSettingsApi';

interface UseNotificationSettingsProps {
    userId: string;
}

interface UseNotificationSettingsReturn {
    settings: NotificationSettings | null;
    isLoading: boolean;
    error: string | null;
    saveSettings: (settings: NotificationSettings) => Promise<void>;
    resetSettings: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les paramètres de notification d'un utilisateur
 */
export const useNotificationSettings = ({ userId }: UseNotificationSettingsProps): UseNotificationSettingsReturn => {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const userSettings = await getUserNotificationSettings(userId);
            setSettings(userSettings);
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des préférences:', err);
            setError('Une erreur est survenue lors du chargement de vos préférences.');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (updatedSettings: NotificationSettings) => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            await saveUserNotificationSettings(userId, updatedSettings);
            setSettings(updatedSettings);
        } catch (err: unknown) {
            logger.error('Erreur lors de l\'enregistrement des préférences:', err);
            setError('Une erreur est survenue lors de l\'enregistrement de vos préférences.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resetSettings = async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            await resetUserNotificationSettings(userId);
            // Recharger les paramètres par défaut
            await loadSettings();
        } catch (err: unknown) {
            logger.error('Erreur lors de la réinitialisation des préférences:', err);
            setError('Une erreur est survenue lors de la réinitialisation de vos préférences.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Charger les paramètres au montage du composant
    useEffect(() => {
        loadSettings();
    }, [userId]);

    return {
        settings,
        isLoading,
        error,
        saveSettings,
        resetSettings
    };
}; 