import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { startOfWeek, addDays, format } from 'date-fns';
import { DayOfWeek, Period } from '@prisma/client';
import {
    TrameEditorState,
    TrameEditorAction,
    TrameEditorConfig,
    EditorAffectation,
    UseTrameEditorOptions,
    WeeklyGridData,
    TrameEditorFilters,
    ConflictDetail
} from '../types';
import { getClientAuthToken } from '@/lib/auth-client-utils';

// État initial
const createInitialState = (config: Partial<TrameEditorConfig> = {}): TrameEditorState => ({
    config: {
        weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
        viewMode: 'week',
        showConflicts: true,
        enableDragDrop: true,
        autoSave: true,
        ...config
    },
    gridData: {
        weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
        weekEnd: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6),
        days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
        periods: [Period.MATIN, Period.APRES_MIDI],
        rooms: [],
        grid: []
    },
    gardes/vacations: [],
    selectedAffectations: [],
    dragState: {
        isDragging: false
    },
    filters: {
        roomIds: [],
        activityTypeIds: [],
        personnelIds: [],
        typeSemaine: [],
        showInactive: true,
        showConflicts: true
    },
    conflicts: [],
    loading: false,
    saving: false,
    unsavedChanges: false
});

// Reducer pour gérer les actions
const trameEditorReducer = (state: TrameEditorState, action: TrameEditorAction): TrameEditorState => {
    switch (action.type) {
        case 'ADD_AFFECTATION':
            return {
                ...state,
                gardes/vacations: [...state.gardes/vacations, action.payload],
                unsavedChanges: true
            };

        case 'UPDATE_AFFECTATION':
            return {
                ...state,
                gardes/vacations: state.gardes/vacations.map(aff =>
                    aff.id === action.payload.id
                        ? { ...aff, ...action.payload.updates }
                        : aff
                ),
                unsavedChanges: true
            };

        case 'DELETE_AFFECTATION':
            return {
                ...state,
                gardes/vacations: state.gardes/vacations.filter(aff => aff.id !== action.payload.id),
                selectedAffectations: state.selectedAffectations.filter(id => id !== action.payload.id),
                unsavedChanges: true
            };

        case 'MOVE_AFFECTATION':
            return {
                ...state,
                gardes/vacations: state.gardes/vacations.map(aff =>
                    aff.id === action.payload.id
                        ? {
                            ...aff,
                            jourSemaine: action.payload.target.jourSemaine,
                            periode: action.payload.target.periode,
                            operatingRoomId: action.payload.target.roomId
                        }
                        : aff
                ),
                unsavedChanges: true
            };

        case 'DUPLICATE_AFFECTATION':
            const original = state.gardes/vacations.find(aff => aff.id === action.payload.id);
            if (!original) return state;

            const duplicate: EditorAffectation = {
                ...original,
                id: undefined, // Nouvel ID sera généré côté serveur
                jourSemaine: action.payload.target.jourSemaine,
                periode: action.payload.target.periode,
                operatingRoomId: action.payload.target.roomId
            };

            return {
                ...state,
                gardes/vacations: [...state.gardes/vacations, duplicate],
                unsavedChanges: true
            };

        case 'CLEAR_CONFLICTS':
            return {
                ...state,
                conflicts: state.conflicts.filter(conflict =>
                    !action.payload.affectationIds.some(id => conflict.affectedIds.includes(id))
                )
            };

        case 'VALIDATE_AFFECTATIONS':
            // Logique de validation sera implémentée
            return state;

        default:
            return state;
    }
};

// Hook principal
export const useTrameEditor = (options: UseTrameEditorOptions = {}) => {
    const {
        trameModeleId,
        weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }),
        autoSave = true,
        enableValidation = true
    } = options;

    const queryClient = useQueryClient();
    const [state, dispatch] = useReducer(trameEditorReducer, createInitialState({
        weekStart,
        autoSave,
        enableDragDrop: true
    }));

    // Queries pour charger les données
    const { data: trameModele, isLoading: loadingTrame } = useQuery({
        queryKey: ['tableau de service-modele', trameModeleId],
        queryFn: async () => {
            if (!trameModeleId) return null;
            const token = getClientAuthToken();
            const response = await fetch(`http://localhost:3000/api/tableau de service-modeles/${trameModeleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur lors du chargement de la tableau de service');
            return response.json();
        },
        enabled: !!trameModeleId
    });

    const { data: operatingRooms, isLoading: loadingRooms } = useQuery({
        queryKey: ['operating-rooms'],
        queryFn: async () => {
            const token = getClientAuthToken();
            const response = await fetch('http://localhost:3000/api/operating-rooms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur lors du chargement des salles');
            return response.json();
        }
    });

    const { data: activityTypes, isLoading: loadingActivityTypes } = useQuery({
        queryKey: ['activity-types'],
        queryFn: async () => {
            const token = getClientAuthToken();
            const response = await fetch('http://localhost:3000/api/activity-types', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur lors du chargement des types d\'activité');
            return response.json();
        }
    });

    // Mutations pour sauvegarder
    const saveAffectationMutation = useMutation({
        mutationFn: async (garde/vacation: EditorAffectation) => {
            const token = getClientAuthToken();
            const url = garde/vacation.id
                ? `/api/garde/vacation-modeles/${garde/vacation.id}`
                : `/api/tableau de service-modeles/${garde/vacation.trameModeleId}/gardes/vacations`;

            const response = await fetch(url, {
                method: garde/vacation.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(garde/vacation)
            });

            if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
            return response.json();
        },
        onSuccess: () => {
            toast.success('Garde/Vacation sauvegardée');
            queryClient.invalidateQueries({ queryKey: ['tableau de service-modele'] });
        },
        onError: (error) => {
            toast.error(`Erreur de sauvegarde: ${error.message}`);
        }
    });

    const deleteAffectationMutation = useMutation({
        mutationFn: async (affectationId: number) => {
            const token = getClientAuthToken();
            const response = await fetch(`http://localhost:3000/api/garde/vacation-modeles/${affectationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');
        },
        onSuccess: () => {
            toast.success('Garde/Vacation supprimée');
            queryClient.invalidateQueries({ queryKey: ['tableau de service-modele'] });
        },
        onError: (error) => {
            toast.error(`Erreur de suppression: ${error.message}`);
        }
    });

    // Calculer les données de grille
    const gridData = useMemo((): WeeklyGridData => {
        const weekEnd = addDays(state.config.weekStart, 6);
        const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
        const periods = [Period.MATIN, Period.APRES_MIDI];
        const rooms = operatingRooms || [];

        // Créer la grille
        const grid = days.map(day =>
            periods.map(period => ({
                jourSemaine: day,
                periode: period,
                gardes/vacations: state.gardes/vacations.filter(aff =>
                    aff.jourSemaine === day && aff.periode === period
                ),
                isDropTarget: false,
                isHighlighted: false,
                conflictLevel: 'none' as const
            }))
        );

        return {
            weekStart: state.config.weekStart,
            weekEnd,
            days,
            periods,
            rooms,
            grid
        };
    }, [state.config.weekStart, state.gardes/vacations, operatingRooms]);

    // Actions
    const actions = {
        addAffectation: useCallback((garde/vacation: EditorAffectation) => {
            dispatch({ type: 'ADD_AFFECTATION', payload: garde/vacation });
            if (autoSave) {
                saveAffectationMutation.mutate(garde/vacation);
            }
        }, [autoSave, saveAffectationMutation]),

        setAffectations: useCallback((gardes/vacations: EditorAffectation[]) => {
            // Remplacer toutes les gardes/vacations (utilisé par undo/redo)
            state.gardes/vacations = gardes/vacations;
            state.unsavedChanges = true;
        }, [state]),

        updateAffectation: useCallback((id: number, updates: Partial<EditorAffectation>) => {
            dispatch({ type: 'UPDATE_AFFECTATION', payload: { id, updates } });
            if (autoSave) {
                const garde/vacation = state.gardes/vacations.find(aff => aff.id === id);
                if (garde/vacation) {
                    saveAffectationMutation.mutate({ ...garde/vacation, ...updates });
                }
            }
        }, [autoSave, state.gardes/vacations, saveAffectationMutation]),

        deleteAffectation: useCallback((id: number) => {
            dispatch({ type: 'DELETE_AFFECTATION', payload: { id } });
            if (autoSave) {
                deleteAffectationMutation.mutate(id);
            }
        }, [autoSave, deleteAffectationMutation]),

        moveAffectation: useCallback((id: number, target: any) => {
            dispatch({ type: 'MOVE_AFFECTATION', payload: { id, target } });
        }, []),

        duplicateAffectation: useCallback((id: number, target: any) => {
            dispatch({ type: 'DUPLICATE_AFFECTATION', payload: { id, target } });
        }, []),

        saveChanges: useCallback(async () => {
            if (!state.unsavedChanges) return;

            try {
                for (const garde/vacation of state.gardes/vacations) {
                    if (!garde/vacation.id) {
                        await saveAffectationMutation.mutateAsync(garde/vacation);
                    }
                }
                toast.success('Modifications sauvegardées');
            } catch (error) {
                toast.error('Erreur lors de la sauvegarde');
            }
        }, [state.gardes/vacations, state.unsavedChanges, saveAffectationMutation])
    };

    // Charger les gardes/vacations quand la tableau de service est chargée
    useEffect(() => {
        if (trameModele?.gardes/vacations) {
            // Remplacer les gardes/vacations par celles de la tableau de service
            const gardes/vacations = trameModele.gardes/vacations.map((aff: any) => ({
                ...aff,
                isSelected: false,
                isDragging: false,
                hasConflict: false,
                conflictDetails: []
            }));

            // Mettre à jour le state sans passer par le reducer pour éviter de marquer comme unsavedChanges
            state.gardes/vacations = gardes/vacations;
        }
    }, [trameModele]);

    const isLoading = loadingTrame || loadingRooms || loadingActivityTypes;
    const isSaving = saveAffectationMutation.isPending || deleteAffectationMutation.isPending;

    return {
        // État
        state: {
            ...state,
            loading: isLoading,
            saving: isSaving,
            gridData
        },

        // Données
        trameModele,
        operatingRooms,
        activityTypes,

        // Actions
        actions,

        // Status
        isLoading,
        isSaving,
        hasUnsavedChanges: state.unsavedChanges
    };
};

export default useTrameEditor; 