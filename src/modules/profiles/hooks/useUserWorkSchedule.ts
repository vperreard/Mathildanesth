import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { WorkSchedule, WorkFrequency, WeekType } from '../types/workSchedule';
import { logger } from '@/utils/logger';

interface UseUserWorkScheduleProps {
    userId?: number;
}

interface UseUserWorkScheduleReturn {
    workSchedule: WorkSchedule | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer l'emploi du temps de l'utilisateur connecté
 * ou d'un utilisateur spécifique si userId est fourni
 */
export const useUserWorkSchedule = ({ userId }: UseUserWorkScheduleProps = {}): UseUserWorkScheduleReturn => {
    const { data: session } = useSession();
    const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchWorkSchedule = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Déterminer l'ID de l'utilisateur à utiliser
            const targetUserId = userId || session?.user?.id;

            if (!targetUserId) {
                throw new Error('Aucun identifiant utilisateur disponible');
            }

            // Récupérer l'emploi du temps depuis l'API
            const response = await fetch(`/api/users/${targetUserId}/work-schedule`);

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer l'emploi du temps`);
            }

            const data = await response.json();
            setWorkSchedule(data);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            logger.error(`Erreur dans useUserWorkSchedule: ${errorObj.message}`, {
                userId: userId || session?.user?.id
            });

            // Créer un emploi du temps par défaut pour éviter les blocages en cas d'erreur
            setWorkSchedule({
                id: 'default',
                frequency: WorkFrequency.FULL_TIME,
                weekType: WeekType.BOTH,
                workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi par défaut
                workingTimePercentage: 100
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkSchedule();
    }, [userId, session?.user?.id]);

    return { workSchedule, isLoading, error, refetch: fetchWorkSchedule };
}; 