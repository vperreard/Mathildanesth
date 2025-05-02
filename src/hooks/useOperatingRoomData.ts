import { useState, useEffect, useCallback } from 'react';
import { OperatingRoom, BlocSector } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';

export interface OperatingRoomDataState {
    rooms: OperatingRoom[];
    sectors: BlocSector[];
    isLoading: boolean;
    error: Error | null;
}

export interface OperatingRoomDataActions {
    fetchRooms: () => Promise<void>;
    fetchRoomById: (id: string) => Promise<OperatingRoom | null>;
    createRoom: (room: Omit<OperatingRoom, 'id'>) => Promise<OperatingRoom>;
    updateRoom: (id: string, roomData: Partial<OperatingRoom>) => Promise<OperatingRoom | null>;
    deleteRoom: (id: string) => Promise<boolean>;
    fetchSectors: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les données des salles d'opération et des secteurs
 * Fournit des fonctions pour récupérer, créer, mettre à jour et supprimer les données
 */
export function useOperatingRoomData(): [OperatingRoomDataState, OperatingRoomDataActions] {
    // État initial
    const [state, setState] = useState<OperatingRoomDataState>({
        rooms: [],
        sectors: [],
        isLoading: false,
        error: null
    });

    // Récupérer toutes les salles d'opération
    const fetchRooms = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const rooms = await blocPlanningService.getAllOperatingRooms();
            setState(prev => ({
                ...prev,
                rooms,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error : new Error('Erreur inconnue lors de la récupération des salles')
            }));
        }
    }, []);

    // Récupérer une salle par son ID
    const fetchRoomById = useCallback(async (id: string): Promise<OperatingRoom | null> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const room = await blocPlanningService.getOperatingRoomById(id);
            setState(prev => ({ ...prev, isLoading: false }));
            return room;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error : new Error(`Erreur lors de la récupération de la salle ${id}`)
            }));
            return null;
        }
    }, []);

    // Créer une nouvelle salle
    const createRoom = useCallback(async (roomData: Omit<OperatingRoom, 'id'>): Promise<OperatingRoom> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const newRoom = await blocPlanningService.createOperatingRoom(roomData);
            setState(prev => ({
                ...prev,
                rooms: [...prev.rooms, newRoom],
                isLoading: false
            }));
            return newRoom;
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error('Erreur lors de la création de la salle');
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorObj
            }));
            throw errorObj;
        }
    }, []);

    // Mettre à jour une salle
    const updateRoom = useCallback(async (id: string, roomData: Partial<OperatingRoom>): Promise<OperatingRoom | null> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const updatedRoom = await blocPlanningService.updateOperatingRoom(id, roomData);

            if (updatedRoom) {
                setState(prev => ({
                    ...prev,
                    rooms: prev.rooms.map(room => room.id === id ? updatedRoom : room),
                    isLoading: false
                }));
            }

            return updatedRoom;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error : new Error(`Erreur lors de la mise à jour de la salle ${id}`)
            }));
            return null;
        }
    }, []);

    // Supprimer une salle
    const deleteRoom = useCallback(async (id: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const success = await blocPlanningService.deleteOperatingRoom(id);

            if (success) {
                setState(prev => ({
                    ...prev,
                    rooms: prev.rooms.filter(room => room.id !== id),
                    isLoading: false
                }));
            }

            return success;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error : new Error(`Erreur lors de la suppression de la salle ${id}`)
            }));
            return false;
        }
    }, []);

    // Récupérer tous les secteurs
    const fetchSectors = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const sectors = await blocPlanningService.getAllSectors();
            setState(prev => ({
                ...prev,
                sectors,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error : new Error('Erreur lors de la récupération des secteurs')
            }));
        }
    }, []);

    // Charger les données initiales au montage du composant
    useEffect(() => {
        fetchRooms();
        fetchSectors();
    }, [fetchRooms, fetchSectors]);

    // Retourner l'état et les actions
    return [
        state,
        {
            fetchRooms,
            fetchRoomById,
            createRoom,
            updateRoom,
            deleteRoom,
            fetchSectors
        }
    ];
} 