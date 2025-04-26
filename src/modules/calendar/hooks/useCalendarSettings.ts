import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export interface UserCalendarSettings {
    defaultView: 'month' | 'week' | 'day' | 'list';
    showWeekends: boolean;
    showHolidays: boolean;
    showRejectedLeaves: boolean;
    colorScheme: 'default' | 'highContrast' | 'colorBlind';
    startWeekOn: 'monday' | 'sunday';
    timeFormat: '12h' | '24h';
    notifications: {
        email: boolean;
        browser: boolean;
        sound: boolean;
    };
}

export const useCalendarSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserCalendarSettings>({
        defaultView: 'month',
        showWeekends: true,
        showHolidays: true,
        showRejectedLeaves: false,
        colorScheme: 'default',
        startWeekOn: 'monday',
        timeFormat: '24h',
        notifications: {
            email: true,
            browser: true,
            sound: false
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Charger les paramètres au montage du composant
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;

            try {
                const response = await axios.get(`/api/users/${user.id}/calendar-settings`);
                if (response.data) {
                    setSettings(response.data);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres:', error);
                setError(error instanceof Error ? error : new Error('Erreur inconnue'));
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [user]);

    // Sauvegarder les paramètres
    const saveSettings = async (newSettings: Partial<UserCalendarSettings>) => {
        if (!user) return;

        try {
            const updatedSettings = { ...settings, ...newSettings };
            await axios.put(`/api/users/${user.id}/calendar-settings`, updatedSettings);
            setSettings(updatedSettings);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            setError(error instanceof Error ? error : new Error('Erreur inconnue'));
            return false;
        }
    };

    // Mettre à jour un paramètre spécifique
    const updateSetting = async <K extends keyof UserCalendarSettings>(
        key: K,
        value: UserCalendarSettings[K]
    ) => {
        return saveSettings({ [key]: value });
    };

    // Mettre à jour les paramètres de notification
    const updateNotification = async (
        key: keyof UserCalendarSettings['notifications'],
        value: boolean
    ) => {
        const newNotifications = {
            ...settings.notifications,
            [key]: value
        };
        return saveSettings({ notifications: newNotifications });
    };

    return {
        settings,
        isLoading,
        error,
        saveSettings,
        updateSetting,
        updateNotification
    };
}; 