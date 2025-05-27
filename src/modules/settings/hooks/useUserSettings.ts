import { useState, useEffect } from 'react';
import { UserCalendarSettings } from '../../calendrier/types/event';

interface UseUserSettingsReturn {
    settings: Partial<UserCalendarSettings>;
    loading: boolean;
    error: Error | null;
    saveSettings: (newSettings: Partial<UserCalendarSettings>) => Promise<void>;
}

/**
 * Hook pour la gestion des préférences utilisateur pour le calendrier
 * @param userId ID de l'utilisateur (optionnel, si non fourni utilise l'utilisateur courant)
 * @returns {settings, loading, error, saveSettings}
 */
export function useUserSettings(userId?: string): UseUserSettingsReturn {
    const [settings, setSettings] = useState<Partial<UserCalendarSettings>>({
        startWeekOn: 'monday',
        showWeekends: true,
        showRejectedLeaves: true,
        showPublicHolidays: true,
        timeFormat: '24h',
        colorScheme: {
            leave: '#4F46E5',
            duty: '#10B981',
            onCall: '#FBBF24',
            attribution: '#EC4899',
            holiday: '#6B7280',
            default: '#2563EB',
            textColor: '#FFFFFF',
            approved: '#10B981',
            pending: '#F59E0B',
            rejected: '#EF4444'
        }
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Charger les préférences de l'utilisateur
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            setError(null);

            try {
                // Simuler un appel API pour récupérer les préférences
                // Dans une vraie implémentation, on ferait un appel API
                // api.get(`/api/user/${userId || 'current'}/parametres`)
                const storedSettings = localStorage.getItem(`user_settings_${userId || 'current'}`);

                if (storedSettings) {
                    try {
                        const parsedSettings = JSON.parse(storedSettings);
                        setSettings(prev => ({ ...prev, ...parsedSettings }));
                    } catch (e) {
                        console.error("Erreur lors du parsing des préférences utilisateur", e);
                    }
                }

                // Simuler un délai d'API
                await new Promise(resolve => setTimeout(resolve, 100));

                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Erreur lors du chargement des préférences'));
                setLoading(false);
            }
        };

        loadSettings();
    }, [userId]);

    // Fonction pour sauvegarder les préférences
    const saveSettings = async (newSettings: Partial<UserCalendarSettings>): Promise<void> => {
        try {
            // Mettre à jour l'état local
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            // Simuler un appel API pour sauvegarder les préférences
            // Dans une vraie implémentation, on ferait un appel API
            // await api.post(`/api/user/${userId || 'current'}/parametres`, updatedSettings)
            localStorage.setItem(`user_settings_${userId || 'current'}`, JSON.stringify(updatedSettings));

            // Simuler un délai d'API
            await new Promise(resolve => setTimeout(resolve, 100));

            return Promise.resolve();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la sauvegarde des préférences'));
            return Promise.reject(err);
        }
    };

    return {
        settings,
        loading,
        error,
        saveSettings
    };
} 