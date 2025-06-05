import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import { Attribution } from '@/types/attribution';
import { User } from '@/types/user';
import { debounce } from 'lodash';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';

interface UseOptimizedPlanningProps {
    month?: Date;
    week?: Date;
    autoSave?: boolean;
    saveDelay?: number;
    viewType?: 'month' | 'week';
    enablePrefetch?: boolean;
}

interface PlanningUpdate {
    assignmentId: string;
    changes: Partial<Attribution>;
    timestamp: number;
}

export function useOptimizedPlanning({ 
    month, 
    week,
    autoSave = true, 
    saveDelay = 2000,
    viewType = 'week',
    enablePrefetch = true
}: UseOptimizedPlanningProps) {
    const queryClient = useQueryClient();
    const [localUpdates, setLocalUpdates] = useState<Map<string, PlanningUpdate>>(new Map());
    const [isSyncing, setIsSyncing] = useState(false);
    const pendingUpdates = useRef<Set<string>>(new Set());

    // Determine the date range based on view type
    const dateRange = useMemo(() => {
        const baseDate = viewType === 'week' ? week || new Date() : month || new Date();
        if (viewType === 'week') {
            return {
                start: startOfWeek(baseDate, { weekStartsOn: 1 }),
                end: endOfWeek(baseDate, { weekStartsOn: 1 })
            };
        }
        return {
            start: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
            end: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
        };
    }, [month, week, viewType]);

    const queryKey = useMemo(() => 
        ['planning', viewType, format(dateRange.start, 'yyyy-MM-dd')],
        [viewType, dateRange.start]
    );

    // Query pour charger le planning avec optimisations
    const { data: planningData, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate: format(dateRange.start, 'yyyy-MM-dd'),
                endDate: format(dateRange.end, 'yyyy-MM-dd'),
                viewType,
                // Optimized fields selection
                fields: 'id,userId,startDate,endDate,type,status,roomId,sectorId'
            });

            const response = await fetch(`http://localhost:3000/api/planning/optimized?${params}`, {
                headers: {
                    'Cache-Control': 'max-age=300', // 5 min browser cache
                }
            });
            
            if (!response.ok) throw new Error('Erreur lors du chargement du planning');
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
    });

    // Prefetch adjacent periods for smooth navigation
    useEffect(() => {
        if (!enablePrefetch || isLoading) return;

        const prefetchAdjacent = async () => {
            if (viewType === 'week' && week) {
                const prevWeek = subWeeks(week, 1);
                const nextWeek = addWeeks(week, 1);

                // Prefetch previous week
                await queryClient.prefetchQuery({
                    queryKey: ['planning', 'week', format(startOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
                    queryFn: async () => {
                        const params = new URLSearchParams({
                            startDate: format(startOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                            endDate: format(endOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                            viewType: 'week',
                            fields: 'id,userId,startDate,endDate,type,status,roomId,sectorId'
                        });
                        const response = await fetch(`http://localhost:3000/api/planning/optimized?${params}`);
                        return response.json();
                    },
                    staleTime: 5 * 60 * 1000,
                });

                // Prefetch next week
                await queryClient.prefetchQuery({
                    queryKey: ['planning', 'week', format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
                    queryFn: async () => {
                        const params = new URLSearchParams({
                            startDate: format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                            endDate: format(endOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                            viewType: 'week',
                            fields: 'id,userId,startDate,endDate,type,status,roomId,sectorId'
                        });
                        const response = await fetch(`http://localhost:3000/api/planning/optimized?${params}`);
                        return response.json();
                    },
                    staleTime: 5 * 60 * 1000,
                });
            }
        };

        const timer = setTimeout(prefetchAdjacent, 100);
        return () => clearTimeout(timer);
    }, [week, viewType, enablePrefetch, isLoading, queryClient]);

    // Mutation pour sauvegarder les changements
    const saveMutation = useMutation({
        mutationFn: async (updates: PlanningUpdate[]) => {
            const response = await fetch('http://localhost:3000/api/planning/batch-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
            return response.json();
        },
        onSuccess: (data, variables) => {
            // Supprimer les mises à jour sauvegardées
            variables.forEach(update => {
                localUpdates.delete(update.assignmentId);
                pendingUpdates.current.delete(update.assignmentId);
            });
            setLocalUpdates(new Map(localUpdates));
            
            // Invalider le cache pour forcer un rechargement
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => {
            logger.error('Erreur de sauvegarde:', error);
        }
    });

    // Fonction de sauvegarde avec debounce
    const debouncedSave = useMemo(
        () => debounce(() => {
            if (localUpdates.size === 0) return;
            
            const updates = Array.from(localUpdates.values());
            saveMutation.mutate(updates);
        }, saveDelay),
        [localUpdates, saveDelay]
    );

    // Mettre à jour une affectation localement
    const updateAssignment = useCallback((assignmentId: string, changes: Partial<Attribution>) => {
        const update: PlanningUpdate = {
            assignmentId,
            changes,
            timestamp: Date.now()
        };

        setLocalUpdates(prev => {
            const newUpdates = new Map(prev);
            newUpdates.set(assignmentId, update);
            return newUpdates;
        });

        pendingUpdates.current.add(assignmentId);

        // Déclencher la sauvegarde automatique si activée
        if (autoSave) {
            debouncedSave();
        }
    }, [autoSave, debouncedSave]);

    // Appliquer les mises à jour locales aux données
    const attributions = useMemo(() => {
        if (!planningData?.attributions) return [];

        return planningData.attributions.map((attribution: Attribution) => {
            const localUpdate = localUpdates.get(attribution.id);
            if (localUpdate) {
                return { ...attribution, ...localUpdate.changes };
            }
            return attribution;
        });
    }, [planningData, localUpdates]);

    // Forcer la sauvegarde immédiate
    const saveNow = useCallback(async () => {
        debouncedSave.cancel();
        
        if (localUpdates.size === 0) return;

        const updates = Array.from(localUpdates.values());
        await saveMutation.mutateAsync(updates);
    }, [localUpdates, debouncedSave, saveMutation]);

    // Annuler les modifications locales
    const cancelLocalChanges = useCallback(() => {
        debouncedSave.cancel();
        setLocalUpdates(new Map());
        pendingUpdates.current.clear();
    }, [debouncedSave]);

    // Optimistic UI pour drag & drop
    const moveAssignment = useCallback((
        assignmentId: string, 
        newUserId: string, 
        newDate: Date
    ) => {
        // Mise à jour optimiste immédiate
        updateAssignment(assignmentId, {
            userId: newUserId,
            startDate: newDate,
            // Ajuster endDate si nécessaire
        });

        // Marquer comme en cours de synchronisation
        setIsSyncing(true);

        // Sauvegarder immédiatement pour le drag & drop
        const update: PlanningUpdate = {
            assignmentId,
            changes: { userId: newUserId, startDate: newDate },
            timestamp: Date.now()
        };

        saveMutation.mutate([update], {
            onSettled: () => setIsSyncing(false)
        });
    }, [updateAssignment, saveMutation]);

    // Vérifier s'il y a des changements non sauvegardés
    const hasUnsavedChanges = localUpdates.size > 0;

    // Nettoyer au démontage
    const cleanup = useCallback(() => {
        debouncedSave.cancel();
        if (hasUnsavedChanges && autoSave) {
            saveNow();
        }
    }, [debouncedSave, hasUnsavedChanges, autoSave, saveNow]);

    return {
        // Données
        attributions,
        users: planningData?.users || [],
        validation: planningData?.validation,
        
        // État
        isLoading,
        error,
        isSaving: saveMutation.isPending,
        isSyncing,
        hasUnsavedChanges,
        pendingUpdatesCount: pendingUpdates.current.size,
        
        // Actions
        updateAssignment,
        moveAssignment,
        saveNow,
        cancelLocalChanges,
        cleanup,
        
        // Utils
        getAssignmentById: useCallback((id: string) => 
            attributions.find(a => a.id === id), 
            [attributions]
        ),
        getUserAssignments: useCallback((userId: string) => 
            attributions.filter(a => a.userId === userId),
            [attributions]
        ),
    };
}