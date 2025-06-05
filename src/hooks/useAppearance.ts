'use client';

import { useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import { AppearancePreferences, VisualTheme } from '../types/user';
import { ApiService } from '../services/api';
import { useAuth } from './useAuth';

interface UseAppearanceProps {
    initialPreferences?: AppearancePreferences;
}

// Préférences par défaut
const defaultPreferences: AppearancePreferences = {
    visualTheme: VisualTheme.DEFAULT,
    typography: {
        fontSize: 'medium',
        fontFamily: 'system',
        lineHeight: 'normal',
        fontWeight: 'normal',
    },
    animations: {
        enabled: true,
        speed: 'normal',
    },
    interface: {
        borderRadius: 'medium',
        density: 'normal',
        shadows: 'normal',
        transparencyEffects: true,
    },
    accessibility: {
        highContrast: false,
        reduceMotion: false,
        largeClickTargets: false,
    },
    header: {
        style: 'gradient',
        sticky: true,
    },
};

// Valeurs CSS pour les thèmes prédéfinis
const themeValues = {
    [VisualTheme.DEFAULT]: {
        primary: { light: '#6366f1', dark: '#818cf8' },
        secondary: { light: '#d946ef', dark: '#e879f9' },
        tertiary: { light: '#ec4899', dark: '#f472b6' },
    },
    [VisualTheme.OCEAN]: {
        primary: { light: '#0ea5e9', dark: '#38bdf8' },
        secondary: { light: '#06b6d4', dark: '#22d3ee' },
        tertiary: { light: '#0891b2', dark: '#06b6d4' },
    },
    [VisualTheme.SUNSET]: {
        primary: { light: '#f97316', dark: '#fb923c' },
        secondary: { light: '#ef4444', dark: '#f87171' },
        tertiary: { light: '#dc2626', dark: '#ef4444' },
    },
    [VisualTheme.FOREST]: {
        primary: { light: '#22c55e', dark: '#4ade80' },
        secondary: { light: '#16a34a', dark: '#22c55e' },
        tertiary: { light: '#15803d', dark: '#16a34a' },
    },
    [VisualTheme.LAVENDER]: {
        primary: { light: '#8b5cf6', dark: '#a78bfa' },
        secondary: { light: '#a855f7', dark: '#c084fc' },
        tertiary: { light: '#d946ef', dark: '#e879f9' },
    },
    [VisualTheme.MONOCHROME]: {
        primary: { light: '#525252', dark: '#a3a3a3' },
        secondary: { light: '#737373', dark: '#d4d4d4' },
        tertiary: { light: '#a3a3a3', dark: '#e5e5e5' },
    },
};

export function useAppearance({ initialPreferences }: UseAppearanceProps = {}) {
    const { isAuthenticated, user } = useAuth();
    const [preferences, setPreferences] = useState<AppearancePreferences>(
        initialPreferences || defaultPreferences
    );
    const [loading, setLoading] = useState<boolean>(true);

    // Charger les préférences depuis l'API au montage du composant (temporairement désactivé)
    useEffect(() => {
        // Chargement des préférences utilisateur depuis l'API
        async function loadPreferences() {
            try {
                // Vérifier si l'utilisateur est authentifié
                if (!isAuthenticated || !user) {
                    logger.info('Utilisateur non authentifié, utilisation des préférences par défaut');
                    setLoading(false);
                    return;
                }

                const apiService = new ApiService();
                const userPreferences = await apiService.getUserPreferences();

                if (userPreferences?.appearance) {
                    setPreferences(userPreferences.appearance);
                }
            } catch (error) {
                logger.error('Erreur lors du chargement des préférences:', error);
                // En cas d'erreur, utiliser les préférences par défaut
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [isAuthenticated, user]);

    // Appliquer les préférences à chaque changement
    useEffect(() => {
        if (loading) return;

        // Appliquer les styles CSS personnalisés
        applyAppearanceStyles(preferences);

    }, [preferences, loading]);

    // Fonction pour mettre à jour les préférences
    const updatePreferences = async (newPreferences: Partial<AppearancePreferences>) => {
        try {
            const updatedPreferences = { ...preferences, ...newPreferences };
            setPreferences(updatedPreferences);

            // Sauvegarder dans l'API
            const apiService = new ApiService();
            await apiService.saveUserPreferences({
                appearance: updatedPreferences,
            });

            return true;
        } catch (error) {
            logger.error('Erreur lors de la mise à jour des préférences:', error);
            return false;
        }
    };

    // Appliquer les styles CSS au document
    const applyAppearanceStyles = (prefs: AppearancePreferences) => {
        const root = document.documentElement;
        const isDarkMode = document.documentElement.classList.contains('dark');
        const themeMode = isDarkMode ? 'dark' : 'light';

        // Appliquer le thème visuel prédéfini
        if (prefs.visualTheme && prefs.visualTheme !== VisualTheme.CUSTOM) {
            const themeColors = themeValues[prefs.visualTheme as keyof typeof themeValues];

            // Convertir les valeurs hexadécimales en RGB
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result
                    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
                    : null;
            };

            // Appliquer les couleurs primaires, secondaires et tertiaires en fonction du mode
            if (themeColors) {
                const primaryColor = hexToRgb(themeColors.primary[themeMode]);
                const secondaryColor = hexToRgb(themeColors.secondary[themeMode]);
                const tertiaryColor = hexToRgb(themeColors.tertiary[themeMode]);

                if (primaryColor) root.style.setProperty('--primary-500', primaryColor);
                if (secondaryColor) root.style.setProperty('--secondary-500', secondaryColor);
                if (tertiaryColor) root.style.setProperty('--tertiary-500', tertiaryColor);
            }
        }

        // Appliquer les préférences de typographie
        if (prefs.typography) {
            const { fontSize, fontFamily, lineHeight, fontWeight } = prefs.typography;

            const fontSizeValues = {
                small: '0.875rem',
                medium: '1rem',
                large: '1.125rem',
                'x-large': '1.25rem',
            };

            const lineHeightValues = {
                compact: '1.3',
                normal: '1.5',
                relaxed: '1.8',
            };

            const fontWeightValues = {
                normal: '400',
                medium: '500',
                bold: '700',
            };

            if (fontSize) {
                root.style.setProperty('--font-size-base', fontSizeValues[fontSize as keyof typeof fontSizeValues]);
            }

            if (fontFamily) {
                let fontFamilyValue = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

                switch (fontFamily) {
                    case 'serif':
                        fontFamilyValue = 'Georgia, Cambria, "Times New Roman", Times, serif';
                        break;
                    case 'sans-serif':
                        fontFamilyValue = 'Arial, Helvetica, sans-serif';
                        break;
                    case 'monospace':
                        fontFamilyValue = 'Menlo, Monaco, Consolas, "Liberation Mono", monospace';
                        break;
                }

                root.style.setProperty('--font-family', fontFamilyValue);
            }

            if (lineHeight) {
                root.style.setProperty('--line-height', lineHeightValues[lineHeight as keyof typeof lineHeightValues]);
            }

            if (fontWeight) {
                root.style.setProperty('--font-weight', fontWeightValues[fontWeight as keyof typeof fontWeightValues]);
            }
        }

        // Appliquer les préférences d'interface
        if (prefs.interface) {
            const { borderRadius, density, shadows, transparencyEffects } = prefs.interface;

            const borderRadiusValues = {
                none: '0',
                small: '0.25rem',
                medium: '0.5rem',
                large: '1rem',
                full: '9999px',
            };

            const densityValues = {
                compact: {
                    spacing: '0.75',
                    padding: '0.75rem',
                },
                normal: {
                    spacing: '1',
                    padding: '1rem',
                },
                comfortable: {
                    spacing: '1.25',
                    padding: '1.25rem',
                },
            };

            const shadowValues = {
                none: '0 0 0 transparent',
                subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
                normal: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                prominent: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            };

            if (borderRadius) {
                root.style.setProperty('--radius-md', borderRadiusValues[borderRadius as keyof typeof borderRadiusValues]);
            }

            if (density) {
                const densityValue = densityValues[density as keyof typeof densityValues];
                root.style.setProperty('--spacing-factor', densityValue.spacing);
                root.style.setProperty('--padding-base', densityValue.padding);
            }

            if (shadows) {
                root.style.setProperty('--shadow-md', shadowValues[shadows as keyof typeof shadowValues]);
            }

            // Ajouter ou supprimer une classe pour les effets de transparence
            if (transparencyEffects !== undefined) {
                if (transparencyEffects) {
                    document.body.classList.add('transparency-effects');
                } else {
                    document.body.classList.remove('transparency-effects');
                }
            }
        }

        // Appliquer les préférences d'accessibilité
        if (prefs.accessibility) {
            const { highContrast, reduceMotion, largeClickTargets } = prefs.accessibility;

            if (highContrast) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }

            if (reduceMotion) {
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }

            if (largeClickTargets) {
                document.body.classList.add('large-targets');
            } else {
                document.body.classList.remove('large-targets');
            }
        }

        // Ajouter des classes CSS globales en fonction du thème visuel
        document.body.classList.remove(
            'theme-default',
            'theme-ocean',
            'theme-sunset',
            'theme-forest',
            'theme-lavender',
            'theme-monochrome',
            'theme-custom'
        );

        if (prefs.visualTheme) {
            document.body.classList.add(`theme-${prefs.visualTheme}`);
        }
    };

    return {
        preferences,
        updatePreferences,
        loading,
    };
}

export default useAppearance; 