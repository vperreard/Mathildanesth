import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
// Commentons les imports qui posent problème, ils seront décommentés si nécessaire
// import { LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { fr } from 'date-fns/locale/fr';

// Importer si présents dans l'application
// import { AuthProvider } from '@/context/AuthContext';
// import { ThemeProvider } from '@/context/ThemeContext'; 
// etc.

/**
 * Utilitaire pour rendre les composants avec tous les providers nécessaires au test
 * Cet utilitaire simplifie les tests en ajoutant automatiquement les contextes requis
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    // Options personnalisées pour configurer les providers
    // Exemple: initialAuthState, etc.
}

export function renderWithProviders(
    ui: ReactElement,
    options?: CustomRenderOptions
) {
    const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
        return (
            // <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            // Ajouter ici d'autres providers si nécessaire
            <>{children}</>
            // </LocalizationProvider>
        );
    };

    return render(ui, { wrapper: AllTheProviders, ...options });
}

// Export d'utilitaires supplémentaires
export * from '@testing-library/react';
export { renderWithProviders as render }; 