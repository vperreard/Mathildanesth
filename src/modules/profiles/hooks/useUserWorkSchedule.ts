import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { WorkSchedule, WorkFrequency, WeekType } from '../types/workSchedule';
import { getLogger } from '@/utils/logger';

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
        const logger = await getLogger();
        try {
            setIsLoading(true);
            setError(null);

            const targetUserId = userId || session?.user?.id;

            if (!targetUserId) {
                logger.warn('useUserWorkSchedule: Aucun identifiant utilisateur disponible');
                throw new Error('Aucun identifiant utilisateur disponible');
            }

            logger.info(`Fetching work planning médical for user ID: ${targetUserId}`);

            const response = await fetch(`http://localhost:3000/api/utilisateurs/${targetUserId}/work-planning médical`);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`Erreur ${response.status} lors de la récupération de l'emploi du temps pour ${targetUserId}: ${errorText}`);
                throw new Error(`Erreur ${response.status}: Impossible de récupérer l'emploi du temps`);
            }

            const data = await response.json();
            setWorkSchedule(data);
            logger.info(`Successfully fetched work planning médical for user ID: ${targetUserId}`);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            logger.error(`Erreur dans useUserWorkSchedule catch block: ${errorObj.message}`, {
                userId: userId || session?.user?.id,
                stack: errorObj.stack
            });

            // Fallback planning médical creation
            const fallbackUserId = typeof session?.user?.id === 'string' ? parseInt(session.user.id, 10) : session?.user?.id;
            setWorkSchedule({
                id: 'default-error-fallback',
                userId: userId ?? (Number.isNaN(fallbackUserId) ? -1 : fallbackUserId ?? -1), // Ensure number, default to -1
                frequency: WorkFrequency.FULL_TIME,
                weekType: WeekType.BOTH,
                workingDays: [1, 2, 3, 4, 5],
                workingTimePercentage: 100,
                annualLeaveAllowance: 0,
                isActive: true,
                validFrom: new Date(0)
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