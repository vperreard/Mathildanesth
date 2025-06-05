'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Compatibilité avec les composants qui utilisent encore useSession
const SessionContext = createContext<any>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    
    // Simuler le format de session NextAuth
    const session = isAuthenticated && user ? {
        user: {
            id: user.id,
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    } : null;

    return (
        <SessionContext.Provider value={{ data: session, status: isAuthenticated ? 'authenticated' : 'unauthenticated' }}>
            {children}
        </SessionContext.Provider>
    );
};

// Hook de compatibilité pour remplacer useSession de NextAuth
export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        // Retourner un état par défaut au lieu de throw pour éviter les erreurs
        return {
            data: null,
            status: 'unauthenticated' as const,
            update: async () => null,
        };
    }
    return context;
};