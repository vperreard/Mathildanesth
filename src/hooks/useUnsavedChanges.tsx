'use client';

import React, { useState, useContext, createContext, useEffect, useCallback } from 'react';

interface UnsavedChangesContextType {
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (value: boolean) => void;
    confirmNavigationIfUnsaved: () => boolean;
    markAsSaved: () => void;
    resetUnsavedChanges: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Réinitialise l'état des modifications non sauvegardées
    const resetUnsavedChanges = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    // Marque les modifications comme sauvegardées
    const markAsSaved = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    // Confirme la navigation si des modifications non sauvegardées existent
    const confirmNavigationIfUnsaved = useCallback(() => {
        if (hasUnsavedChanges) {
            return window.confirm(
                'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter cette page ?'
            );
        }
        return true;
    }, [hasUnsavedChanges]);

    // Avertissement avant de quitter la page si des modifications non sauvegardées
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    return (
        <UnsavedChangesContext.Provider
            value={{
                hasUnsavedChanges,
                setHasUnsavedChanges,
                confirmNavigationIfUnsaved,
                markAsSaved,
                resetUnsavedChanges,
            }}
        >
            {children}
        </UnsavedChangesContext.Provider>
    );
};

export const useUnsavedChanges = () => {
    const context = useContext(UnsavedChangesContext);
    if (!context) {
        throw new Error('useUnsavedChanges doit être utilisé à l\'intérieur d\'un UnsavedChangesProvider');
    }
    return context;
}; 