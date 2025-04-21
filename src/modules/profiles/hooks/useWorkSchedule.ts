import { useState, useEffect, useCallback } from 'react';
import {
    WorkSchedule,
    WeeklyWorkingDays
} from '../types/workSchedule';
import {
    fetchUserWorkSchedules,
    saveWorkSchedule,
    deleteWorkSchedule,
    calculateWeeklyWorkingDays,
    isWorkingDay
} from '../services/workScheduleService';

interface UseWorkScheduleProps {
    userId?: string;
    initialSchedule?: Partial<WorkSchedule>;
}

interface UseWorkScheduleReturn {
    schedules: WorkSchedule[];
    currentSchedule: Partial<WorkSchedule> | null;
    loading: boolean;
    error: Error | null;
    setCurrentSchedule: (schedule: Partial<WorkSchedule> | null) => void;
    updateScheduleField: <K extends keyof WorkSchedule>(
        field: K,
        value: WorkSchedule[K]
    ) => void;
    saveSchedule: () => Promise<WorkSchedule>;
    removeSchedule: (scheduleId: string) => Promise<void>;
    isUserWorkingOnDate: (date: Date) => boolean;
    getWeeklyWorkingDays: () => WeeklyWorkingDays | null;
    refreshSchedules: () => Promise<void>;
}

export const useWorkSchedule = ({
    userId,
    initialSchedule
}: UseWorkScheduleProps = {}): UseWorkScheduleReturn => {
    // État pour stocker tous les plannings de l'utilisateur
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    // État pour le planning en cours d'édition
    const [currentSchedule, setCurrentSchedule] = useState<Partial<WorkSchedule> | null>(
        initialSchedule || null
    );
    // États de chargement et d'erreur
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Charger les plannings de l'utilisateur
    const loadSchedules = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await fetchUserWorkSchedules(userId);
            setSchedules(data);

            // Si aucun planning en cours d'édition et des plannings existent, 
            // définir le planning actif comme courant
            if (!currentSchedule && data.length > 0) {
                const activeSchedule = data.find(s => s.isActive);
                if (activeSchedule) {
                    setCurrentSchedule(activeSchedule);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            console.error('Erreur dans useWorkSchedule:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, currentSchedule]);

    // Charger les plannings au montage du composant si un userId est fourni
    useEffect(() => {
        if (userId) {
            loadSchedules();
        }
    }, [userId, loadSchedules]);

    // Mettre à jour un champ spécifique du planning courant
    const updateScheduleField = useCallback(<K extends keyof WorkSchedule>(
        field: K,
        value: WorkSchedule[K]
    ) => {
        setCurrentSchedule(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    // Enregistrer le planning courant
    const saveSchedule = useCallback(async (): Promise<WorkSchedule> => {
        if (!currentSchedule) {
            throw new Error('Aucun planning à enregistrer');
        }

        setLoading(true);
        setError(null);

        try {
            const savedSchedule = await saveWorkSchedule(currentSchedule);

            // Mettre à jour la liste des plannings
            setSchedules(prev => {
                const existingIndex = prev.findIndex(s => s.id === savedSchedule.id);
                if (existingIndex >= 0) {
                    return [
                        ...prev.slice(0, existingIndex),
                        savedSchedule,
                        ...prev.slice(existingIndex + 1)
                    ];
                } else {
                    return [...prev, savedSchedule];
                }
            });

            // Mettre à jour le planning courant
            setCurrentSchedule(savedSchedule);

            return savedSchedule;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'enregistrement'));
            console.error('Erreur dans saveSchedule:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentSchedule]);

    // Supprimer un planning
    const removeSchedule = useCallback(async (scheduleId: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await deleteWorkSchedule(scheduleId);

            // Mettre à jour la liste des plannings
            setSchedules(prev => prev.filter(s => s.id !== scheduleId));

            // Si le planning supprimé était le planning courant, réinitialiser
            if (currentSchedule && currentSchedule.id === scheduleId) {
                setCurrentSchedule(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
            console.error('Erreur dans removeSchedule:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentSchedule]);

    // Vérifier si l'utilisateur travaille à une date donnée
    const isUserWorkingOnDate = useCallback((date: Date): boolean => {
        // Trouver le planning actif à cette date
        const activeSchedule = schedules.find(schedule =>
            schedule.isActive &&
            date >= schedule.validFrom &&
            (!schedule.validTo || date <= schedule.validTo)
        );

        if (!activeSchedule) return false;

        return isWorkingDay(activeSchedule, date);
    }, [schedules]);

    // Obtenir le nombre de jours travaillés par semaine
    const getWeeklyWorkingDays = useCallback((): WeeklyWorkingDays | null => {
        if (!currentSchedule) return null;

        // Si le currentSchedule ne contient pas tous les champs nécessaires
        if (!('frequency' in currentSchedule)) return null;

        return calculateWeeklyWorkingDays(currentSchedule as WorkSchedule);
    }, [currentSchedule]);

    return {
        schedules,
        currentSchedule,
        loading,
        error,
        setCurrentSchedule,
        updateScheduleField,
        saveSchedule,
        removeSchedule,
        isUserWorkingOnDate,
        getWeeklyWorkingDays,
        refreshSchedules: loadSchedules
    };
}; 