import { Theme } from '@/config/themes';

import { logger } from "../lib/logger";
export interface UserPreferences {
    theme: string;
    layout: 'grid' | 'free';
    widgetDefaults: {
        [key: string]: {
            size: { width: number; height: number };
            config: Record<string, any>;
        };
    };
    notifications: {
        enabled: boolean;
        sound: boolean;
        email: boolean;
    };
    display: {
        showWeekends: boolean;
        showHolidays: boolean;
        timeFormat: '12h' | '24h';
        dateFormat: string;
    };
}

const defaultPreferences: UserPreferences = {
    theme: 'default',
    layout: 'grid',
    widgetDefaults: {
        stat: {
            size: { width: 1, height: 1 },
            config: {
                showChange: true,
                showIcon: true
            }
        },
        chart: {
            size: { width: 2, height: 2 },
            config: {
                showLegend: true,
                showTooltip: true
            }
        },
        list: {
            size: { width: 1, height: 2 },
            config: {
                showStatus: true,
                showDate: true
            }
        },
        calendar: {
            size: { width: 2, height: 2 },
            config: {
                view: 'month',
                showWeekends: true
            }
        }
    },
    notifications: {
        enabled: true,
        sound: true,
        email: true
    },
    display: {
        showWeekends: true,
        showHolidays: true,
        timeFormat: '24h',
        dateFormat: 'DD/MM/YYYY'
    }
};

export const preferencesService = {
    getPreferences(): UserPreferences {
        try {
            const savedPreferences = localStorage.getItem('user-preferences');
            return savedPreferences ? JSON.parse(savedPreferences) : defaultPreferences;
        } catch (error) {
            logger.error('Erreur lors de la récupération des préférences:', error);
            return defaultPreferences;
        }
    },

    savePreferences(preferences: Partial<UserPreferences>): void {
        try {
            const currentPreferences = this.getPreferences();
            const updatedPreferences = { ...currentPreferences, ...preferences };
            localStorage.setItem('user-preferences', JSON.stringify(updatedPreferences));
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des préférences:', error);
        }
    },

    getWidgetDefaults(type: string) {
        const preferences = this.getPreferences();
        return preferences.widgetDefaults[type] || defaultPreferences.widgetDefaults[type];
    },

    updateWidgetDefaults(type: string, defaults: Partial<UserPreferences['widgetDefaults'][string]>) {
        const preferences = this.getPreferences();
        const updatedDefaults = {
            ...preferences.widgetDefaults[type],
            ...defaults
        };
        this.savePreferences({
            widgetDefaults: {
                ...preferences.widgetDefaults,
                [type]: updatedDefaults
            }
        });
    }
}; 