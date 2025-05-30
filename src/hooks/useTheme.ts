import { useState, useEffect } from 'react';
import { Theme, themes, defaultTheme } from '@/config/themes';

export const useTheme = () => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

    useEffect(() => {
        try {
            // Charger le thème sauvegardé
            const savedThemeId = localStorage.getItem('dashboard-theme');
            if (savedThemeId) {
                const savedTheme = themes.find(theme => theme.id === savedThemeId);
                if (savedTheme) {
                    setCurrentTheme(savedTheme);
                }
            }
        } catch (error) {
            // Ignorer les erreurs localStorage et utiliser le thème par défaut
            console.warn('Erreur lors du chargement du thème:', error);
        }
    }, []);

    const changeTheme = (themeId: string) => {
        const newTheme = themes.find(theme => theme.id === themeId);
        if (newTheme) {
            setCurrentTheme(newTheme);
            try {
                localStorage.setItem('dashboard-theme', themeId);
            } catch (error) {
                // Ignorer les erreurs localStorage
                console.warn('Erreur lors de la sauvegarde du thème:', error);
            }
        }
    };

    const getThemeVariable = (path: string) => {
        const parts = path.split('.');
        let value: any = currentTheme;

        for (const part of parts) {
            value = value[part];
            if (value === undefined) return '';
        }

        return value;
    };

    return {
        currentTheme,
        themes,
        changeTheme,
        getThemeVariable
    };
}; 