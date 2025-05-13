'use client';

import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    title?: string; // Titre optionnel pour la page/section
    className?: string;
}

/**
 * Composant Container de base.
 * ACTION UTILISATEUR REQUISE: Remplacez ou améliorez ce composant 
 * avec votre propre système de layout si vous en avez un plus sophistiqué.
 */
export function Container({ children, title, className }: ContainerProps) {
    return (
        <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
            {title && (
                <h1 className="text-2xl font-bold mb-6">
                    {title}
                </h1>
            )}
            {children}
        </div>
    );
}

// Si l'export par défaut est préféré pour ce type de composant :
// export default Container;
// Assurez-vous que l'import dans RoomUsageReportPage.tsx correspond (import Container from '...' vs import { Container } from '...') 