import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from "../../../lib/logger";
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { CalendarSettings } from '../types/event';

// Renommer l'import pour éviter le conflit
import { UserCalendarSettings as UserCalendarSettingsType } from '../types/event';

export interface UserCalendarSettings {
    defaultView: string;
    showWeekends: boolean;
    showHolidays: boolean;
    showRejectedLeaves: boolean;
    colorScheme: string;
    startWeekOn: 'monday' | 'sunday';
    timeFormat: '12h' | '24h';
    notifications: {
        email: boolean;
        browser: boolean;
        sound: boolean;
    };
}

interface UseCalendarSettingsProps {
    userId: string;
    initialSettings?: Partial<UserCalendarSettings>;
}

interface UseCalendarSettingsReturn {
    settings: UserCalendarSettings;
    loading: boolean;
    error: Error | null;
    updateSettings: (settings: Partial<UserCalendarSettings>) => void;
    resetSettings: () => void;
}

// Valeurs par défaut pour les paramètres utilisateur
const DEFAULT_USER_SETTINGS: UserCalendarSettings = {
    defaultView: 'month',
    startWeekOn: 'monday',
    showWeekends: true,
    showHolidays: true,
    showRejectedLeaves: false,
    colorScheme: 'default',
    timeFormat: '24h',
    notifications: {
        email: true,
        browser: true,
        sound: false
    }
};

/**
 * Hook pour gérer les paramètres du calendrier d'un utilisateur
 * Évite les mises à jour trop fréquentes qui peuvent causer des rechargements complets
 */
export const useCalendarSettings = ({
    userId,
    initialSettings = {}
}: UseCalendarSettingsProps): UseCalendarSettingsReturn => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserCalendarSettings>({
        ...DEFAULT_USER_SETTINGS,
        ...initialSettings
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Référence pour stocker le timer de debounce
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Charger les paramètres depuis l'API ou localStorage
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);

                // Essayer de charger depuis localStorage d'abord
                const cachedSettings = localStorage.getItem(`calendar-settings-${userId}`);
                if (cachedSettings) {
                    const parsedSettings = JSON.parse(cachedSettings);
                    setSettings(prevSettings => ({
                        ...DEFAULT_USER_SETTINGS,
                        ...prevSettings,
                        ...parsedSettings
                    }));
                    setLoading(false);
                    return;
                }

                // Si pas en cache, charger depuis l'API
                const response = await axios.get(`http://localhost:3000/api/utilisateurs/${userId}/calendrier-settings`);

                if (response.data) {
                    setSettings(prevSettings => ({
                        ...DEFAULT_USER_SETTINGS,
                        ...prevSettings,
                        ...response.data
                    }));

                    // Mettre en cache dans localStorage
                    localStorage.setItem(`calendar-settings-${userId}`, JSON.stringify(response.data));
                }

            } catch (err) {
                logger.error('Erreur dans useCalendarSettings:', err);
                setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [userId]);

    // Mettre à jour les paramètres avec debounce pour éviter les rechargements fréquents
    const updateSettings = useCallback((newSettings: Partial<UserCalendarSettings>) => {
        // Mettre à jour l'état local immédiatement
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));

        // Annuler le timer précédent s'il existe
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
        }

        // Définir un nouveau timer pour sauvegarder les paramètres
        updateTimerRef.current = setTimeout(async () => {
            try {
                // Récupérer les paramètres les plus récents
                const currentSettings = {
                    ...DEFAULT_USER_SETTINGS,
                    ...settings,
                    ...newSettings
                };

                // Mettre à jour dans localStorage pour éviter les appels API fréquents
                localStorage.setItem(`calendar-settings-${userId}`, JSON.stringify(currentSettings));

                // Envoyer à l'API de manière asynchrone
                await axios.put(`http://localhost:3000/api/utilisateurs/${userId}/calendrier-settings`, currentSettings);

            } catch (err) {
                logger.error('Erreur lors de la mise à jour des paramètres:', err);
                setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            }
        }, 1000); // Délai de 1 seconde pour le debounce

    }, [userId, settings]);

    // Réinitialiser les paramètres
    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_USER_SETTINGS);

        // Effacer du localStorage
        localStorage.removeItem(`calendar-settings-${userId}`);

        // Envoyer à l'API
        axios.delete(`http://localhost:3000/api/utilisateurs/${userId}/calendrier-settings`)
            .catch(err => {
                logger.error('Erreur lors de la réinitialisation des paramètres:', err);
            });
    }, [userId]);

    return {
        settings,
        loading,
        error,
        updateSettings,
        resetSettings
    };
}; 