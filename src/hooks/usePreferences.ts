import { useState, useEffect } from 'react';
import { preferencesService, UserPreferences } from '@/services/preferencesService';

export const usePreferences = () => {
    const [preferences, setPreferences] = useState<UserPreferences>(preferencesService.getPreferences());

    useEffect(() => {
        // Charger les préférences au montage du composant
        setPreferences(preferencesService.getPreferences());
    }, []);

    const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
        preferencesService.savePreferences(newPreferences);
        setPreferences(prev => ({ ...prev, ...newPreferences }));
    };

    const getWidgetDefaults = (type: string) => {
        return preferencesService.getWidgetDefaults(type);
    };

    const updateWidgetDefaults = (type: string, defaults: Partial<UserPreferences['widgetDefaults'][string]>) => {
        preferencesService.updateWidgetDefaults(type, defaults);
        setPreferences(prev => ({
            ...prev,
            widgetDefaults: {
                ...prev.widgetDefaults,
                [type]: {
                    ...prev.widgetDefaults[type],
                    ...defaults
                }
            }
        }));
    };

    return {
        preferences,
        updatePreferences,
        getWidgetDefaults,
        updateWidgetDefaults
    };
}; 