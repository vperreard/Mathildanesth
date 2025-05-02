import { useState, useEffect } from 'react';
import { Theme, themes, defaultTheme } from '@/config/themes';

export const useTheme = () => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

    useEffect(() => {
        // Charger le thème sauvegardé
        const savedThemeId = localStorage.getItem('dashboard-theme');
        if (savedThemeId) {
            const savedTheme = themes.find(theme => theme.id === savedThemeId);
            if (savedTheme) {
                setCurrentTheme(savedTheme);
            }
        }
    }, []);

    const changeTheme = (themeId: string) => {
        const newTheme = themes.find(theme => theme.id === themeId);
        if (newTheme) {
            setCurrentTheme(newTheme);
            localStorage.setItem('dashboard-theme', themeId);
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