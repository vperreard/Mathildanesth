import { useState, useCallback, useEffect, useRef } from 'react';
import { Attribution } from '../types/attribution';
import { RulesConfiguration } from '../types/rules';
import { SyncService } from '../services/syncService';
import { Doctor } from '../types/doctor';
import toast from 'react-hot-toast';

interface UseDragDropSyncOptions {
    rules: RulesConfiguration;
    doctors?: Doctor[];
    onValidationError?: (violations: unknown[]) => void;
    validateBeforeSave?: boolean;
    autoSaveDelay?: number;
    onSyncComplete?: (success: boolean) => void;
}

interface UseDragDropSyncReturn {
    attributions: Attribution[];
    setAssignments: (attributions: Attribution[]) => void;
    handleDragDrop: (assignmentId: string, newDate: Date) => void;
    pendingChanges: Record<string, boolean>;
    hasPendingChanges: boolean;
    saveChanges: () => Promise<boolean>;
    isSaving: boolean;
    lastSaved: Date | null;
    validationErrors: unknown[];
    triggerValidation: () => void;
    isValidating: boolean;
    revertChange: (assignmentId: string) => void;
    revertAllChanges: () => void;
}

/**
 * Hook personnalisé pour gérer la synchronisation des affectations 
 * entre l'interface drag-and-drop et le calendrier principal
 */
export function useDragDropSync({
    rules,
    doctors = [],
    onValidationError,
    validateBeforeSave = true,
    autoSaveDelay = 5000,
    onSyncComplete
}: UseDragDropSyncOptions): UseDragDropSyncReturn {
    const [attributions, setAssignments] = useState<Attribution[]>([]);
    const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
    const [originalAssignments, setOriginalAssignments] = useState<Record<string, Attribution>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

    // Référence au service de synchronisation
    const syncServiceRef = useRef(new SyncService(rules, doctors));

    // Mettre à jour les docteurs dans le service de synchronisation si nécessaire
    useEffect(() => {
        syncServiceRef.current.setDoctors(doctors);
    }, [doctors]);

    // Détermine si des modifications sont en attente
    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    // Lorsque les affectations initiales sont changées, réinitialiser l'état
    useEffect(() => {
        // Stocker les affectations originales pour pouvoir annuler les modifications
        const originals: Record<string, Attribution> = {};
        attributions.forEach(attribution => {
            originals[attribution.id] = { ...attribution };
        });
        setOriginalAssignments(originals);

        // Réinitialiser les modifications en attente
        setPendingChanges({});
        setValidationErrors([]);
    }, [attributions]);

    /**
     * Effectue la validation des affectations
     */
    const triggerValidation = useCallback(() => {
        setIsValidating(true);
        const result = syncServiceRef.current.validateOnly(attributions);

        if (!result.success && result.violations && onValidationError) {
            onValidationError(result.violations);
            setValidationErrors(result.violations);
        } else {
            setValidationErrors([]);
        }

        setIsValidating(false);
        return result.success;
    }, [attributions, onValidationError]);

    /**
     * Gère le déplacement d'une affectation
     */
    const handleDragDrop = useCallback((assignmentId: string, newDate: Date) => {
        // Trouver l'affectation dans la liste
        const assignmentIndex = attributions.findIndex(a => a.id === assignmentId);
        if (assignmentIndex === -1) return;

        // Créer une copie de l'affectation et mettre à jour la date
        const updatedAssignment = {
            ...attributions[assignmentIndex],
            date: newDate
        };

        // Mettre à jour la liste des affectations
        const newAssignments = [...attributions];
        newAssignments[assignmentIndex] = updatedAssignment;

        // Mettre à jour l'état
        setAssignments(newAssignments);

        // Marquer cette affectation comme modifiée
        setPendingChanges(prev => ({
            ...prev,
            [assignmentId]: true
        }));

        // Déclencher la sauvegarde automatique si activée
        if (autoSaveDelay > 0) {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }

            const timeoutId = setTimeout(() => {
                saveChanges();
            }, autoSaveDelay);

            setAutoSaveTimeout(timeoutId);
        }

        // Réinitialiser les erreurs de validation car l'état a changé
        setValidationErrors([]);
    }, [attributions, autoSaveDelay, autoSaveTimeout]);

    /**
     * Annule une modification spécifique
     */
    const revertChange = useCallback((assignmentId: string) => {
        // Vérifier si cette affectation a été modifiée
        if (!pendingChanges[assignmentId]) return;

        // Vérifier si nous avons l'original
        const original = originalAssignments[assignmentId];
        if (!original) return;

        // Restaurer l'affectation originale
        const assignmentIndex = attributions.findIndex(a => a.id === assignmentId);
        if (assignmentIndex === -1) return;

        const newAssignments = [...attributions];
        newAssignments[assignmentIndex] = { ...original };

        setAssignments(newAssignments);

        // Supprimer cette affectation des modifications en attente
        const newPendingChanges = { ...pendingChanges };
        delete newPendingChanges[assignmentId];
        setPendingChanges(newPendingChanges);

        toast.success('Modification annulée');
    }, [attributions, pendingChanges, originalAssignments]);

    /**
     * Annule toutes les modifications en attente
     */
    const revertAllChanges = useCallback(() => {
        // Restaurer toutes les affectations originales
        const restoredAssignments = attributions.map(attribution => {
            if (pendingChanges[attribution.id]) {
                return { ...originalAssignments[attribution.id] };
            }
            return attribution;
        });

        setAssignments(restoredAssignments);
        setPendingChanges({});
        setValidationErrors([]);

        toast.success('Toutes les modifications ont été annulées');
    }, [attributions, pendingChanges, originalAssignments]);

    /**
     * Sauvegarde les modifications en attente
     */
    const saveChanges = useCallback(async () => {
        // Ne rien faire s'il n'y a pas de modifications ou si déjà en cours de sauvegarde
        if (!hasPendingChanges || isSaving) return false;

        // Valider les affectations si nécessaire
        if (validateBeforeSave) {
            const isValid = triggerValidation();
            if (!isValid) {
                toast.error('Impossible de sauvegarder : des violations des règles ont été détectées.');
                return false;
            }
        }

        // Marquer comme en cours de sauvegarde
        setIsSaving(true);

        try {
            // Filtrer pour n'envoyer que les affectations modifiées
            const changedAssignments = attributions.filter(a => pendingChanges[a.id]);

            // Synchroniser avec le service
            const result = await syncServiceRef.current.syncAssignments(changedAssignments);

            if (result.success) {
                // Mise à jour de l'état après sauvegarde réussie
                const newOriginals = { ...originalAssignments };
                changedAssignments.forEach(attribution => {
                    newOriginals[attribution.id] = { ...attribution };
                });

                setOriginalAssignments(newOriginals);
                setPendingChanges({});
                setLastSaved(new Date());
                toast.success('Modifications sauvegardées avec succès');

                if (onSyncComplete) {
                    onSyncComplete(true);
                }

                return true;
            } else {
                // Erreur de synchronisation
                if (result.violations && onValidationError) {
                    onValidationError(result.violations);
                    setValidationErrors(result.violations);
                }

                toast.error(`Erreur lors de la sauvegarde : ${result.message}`);

                if (onSyncComplete) {
                    onSyncComplete(false);
                }

                return false;
            }
        } catch (error: unknown) {
            toast.error('Erreur lors de la sauvegarde : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));

            if (onSyncComplete) {
                onSyncComplete(false);
            }

            return false;
        } finally {
            setIsSaving(false);
        }
    }, [attributions, hasPendingChanges, isSaving, pendingChanges, validateBeforeSave, triggerValidation, originalAssignments, onSyncComplete, onValidationError]);

    // Nettoyer le timeout lors du démontage du composant
    useEffect(() => {
        return () => {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }
        };
    }, [autoSaveTimeout]);

    return {
        attributions,
        setAssignments,
        handleDragDrop,
        pendingChanges,
        hasPendingChanges,
        saveChanges,
        isSaving,
        lastSaved,
        validationErrors,
        triggerValidation,
        isValidating,
        revertChange,
        revertAllChanges
    };
} 