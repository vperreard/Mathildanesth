'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RuleViolation } from '@/components/ui/RuleViolationIndicator';

interface RuleViolationsContextType {
    violations: RuleViolation[];
    addViolation: (violation: RuleViolation) => void;
    removeViolation: (id: string) => void;
    clearViolations: () => void;
    updateViolation: (id: string, updatedViolation: Partial<RuleViolation>) => void;
}

const RuleViolationsContext = createContext<RuleViolationsContextType | undefined>(undefined);

export const RuleViolationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [violations, setViolations] = useState<RuleViolation[]>([]);

    // Ajouter une nouvelle violation
    const addViolation = useCallback((violation: RuleViolation) => {
        // Vérifier si une violation avec le même ID existe déjà
        setViolations(prev => {
            if (prev.some(v => v.id === violation.id)) {
                return prev; // Ne pas ajouter de doublons
            }
            return [...prev, violation];
        });
    }, []);

    // Supprimer une violation par ID
    const removeViolation = useCallback((id: string) => {
        setViolations(prev => prev.filter(violation => violation.id !== id));
    }, []);

    // Effacer toutes les violations
    const clearViolations = useCallback(() => {
        setViolations([]);
    }, []);

    // Mettre à jour une violation existante
    const updateViolation = useCallback((id: string, updatedViolation: Partial<RuleViolation>) => {
        setViolations(prev =>
            prev.map(violation =>
                violation.id === id ? { ...violation, ...updatedViolation } : violation
            )
        );
    }, []);

    // Pour adapter l'API système de l'application à notre nouveau format
    const adaptExistingViolationsSystem = useCallback((systemViolations: unknown[]) => {
        if (!systemViolations || !Array.isArray(systemViolations)) return;

        const adaptedViolations: RuleViolation[] = systemViolations.map(violation => {
            // Conversion des sévérités du système existant vers notre nouveau format
            const severityMap: Record<string, 'error' | 'warning' | 'info'> = {
                'CRITICAL': 'error',
                'MAJOR': 'warning',
                'MINOR': 'info'
            };

            return {
                id: violation.id || Math.random().toString(36).slice(2),
                title: violation.type || 'Violation de règle',
                description: violation.message || 'Une règle a été violée',
                severity: severityMap[violation.severity] || 'warning',
                affectedElements: violation.affectedAssignments?.map((id: string) => `Assignation #${id}`),
                suggestion: violation.possibleResolutions?.[0]?.description || 'Aucune suggestion disponible'
            };
        });

        setViolations(adaptedViolations);
    }, []);

    // Exposer l'adaptateur pour les systèmes existants
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__adaptViolations = adaptExistingViolationsSystem;
        }
    }, [adaptExistingViolationsSystem]);

    return (
        <RuleViolationsContext.Provider
            value={{
                violations,
                addViolation,
                removeViolation,
                clearViolations,
                updateViolation
            }}
        >
            {children}
        </RuleViolationsContext.Provider>
    );
};

export const useRuleViolations = () => {
    const context = useContext(RuleViolationsContext);
    if (!context) {
        throw new Error('useRuleViolations doit être utilisé à l\'intérieur d\'un RuleViolationsProvider');
    }
    return context;
}; 