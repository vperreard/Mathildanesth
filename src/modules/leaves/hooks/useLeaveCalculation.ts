import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  calculateLeaveCountedDays,
  calculateWorkingDays,
  isBusinessDay,
} from '../services/leaveCalculator';
import { publicHolidayService } from '../services/publicHolidayService';
import {
  LeaveCalculationDetails,
  LeaveCalculationOptions,
  PublicHolidayDetail,
} from '../types/leave';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { useUserWorkSchedule } from '../../profiles/hooks/useUserWorkSchedule';
import { format } from 'date-fns';
import { getLogger } from '@/utils/logger';

type CalculationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseLeaveCalculationProps {
  startDate?: Date | null;
  endDate?: Date | null;
  workSchedule?: WorkSchedule;
  options?: LeaveCalculationOptions;
}

interface UseLeaveCalculationReturn {
  details: LeaveCalculationDetails | null;
  isLoading: boolean;
  error: Error | null;
  status: CalculationStatus;
  recalculate: (opts?: LeaveCalculationOptions) => Promise<void>;
  publicHolidays: PublicHolidayDetail[];
  workingDays: number;
  countedDays: number;
  hasValidDates: boolean;
}

/**
 * Hook pour calculer les détails d'une demande de congés
 */
export const useLeaveCalculation = ({
  startDate,
  endDate,
  workSchedule: externalWorkSchedule,
  options = {},
}: UseLeaveCalculationProps): UseLeaveCalculationReturn => {
  // État pour les données du calcul
  const [details, setDetails] = useState<LeaveCalculationDetails | null>(null);
  const [status, setStatus] = useState<CalculationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [publicHolidays, setPublicHolidays] = useState<PublicHolidayDetail[]>([]);

  // Récupérer l'emploi du temps de l'utilisateur si non fourni en externe
  const { workSchedule: userWorkSchedule, isLoading: isLoadingWorkSchedule } =
    useUserWorkSchedule();

  // Utiliser l'emploi du temps fourni ou celui de l'utilisateur
  const workSchedule = externalWorkSchedule || userWorkSchedule;

  // Stabiliser les options pour éviter les re-rendus infinies
  const stableOptions = useMemo(
    () => options,
    [
      options?.isHalfDay,
      options?.halfDayPeriod,
      options?.skipHolidays,
      options?.countHolidaysOnWeekends,
      options?.forceCacheRefresh,
    ]
  );

  // Calculer si les dates sont valides
  const hasValidDates = Boolean(startDate && endDate && workSchedule);

  /**
   * Fonction pour calculer les détails des congés avec timeout
   */
  const calculateDetails = useCallback(
    async (calculationOptions?: LeaveCalculationOptions) => {
      if (!startDate || !endDate || !workSchedule) {
        setStatus('idle');
        return;
      }

      const logger = await getLogger();

      // Fusionner les options par défaut avec celles fournies
      const mergedOptions = {
        ...stableOptions,
        ...calculationOptions,
      };

      logger.info('Starting leave calculation...', {
        startDate,
        endDate,
        scheduleId: workSchedule?.id,
        options: mergedOptions,
      });

      try {
        setStatus('loading');

        // Ajouter un timeout de 10 secondes pour éviter le blocage
        const calculationPromise = calculateLeaveCountedDays(
          startDate,
          endDate,
          workSchedule,
          mergedOptions
        );

        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                'Timeout: Le calcul des jours prend trop de temps. Vérifiez votre connexion.'
              )
            );
          }, 10000); // 10 secondes
        });

        const result = await Promise.race([calculationPromise, timeoutPromise]);

        if (result) {
          setDetails(result);
          setPublicHolidays(result.publicHolidays);
          setStatus('success');
          logger.info('Leave calculation successful', {
            countedDays: result.countedDays,
            halfDays: result.halfDays,
            isHalfDay: mergedOptions.isHalfDay,
            halfDayPeriod: mergedOptions.halfDayPeriod,
          });
        } else {
          logger.warn('calculateLeaveCountedDays returned null or undefined');
          throw new Error('Échec du calcul des jours de congés');
        }
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setStatus('error');
        logger.error(`Erreur dans useLeaveCalculation: ${errorObj.message}`, {
          startDate,
          endDate,
          scheduleId: workSchedule?.id,
          options: calculationOptions,
          stack: errorObj.stack,
        });
      }
    },
    [startDate, endDate, workSchedule, stableOptions]
  );

  // Calculer les détails au chargement ou quand les dépendances changent
  useEffect(() => {
    if (hasValidDates && !isLoadingWorkSchedule) {
      calculateDetails();
    }
  }, [hasValidDates, calculateDetails, isLoadingWorkSchedule]);

  // Charger les jours fériés dans la plage de dates
  useEffect(() => {
    const loadPublicHolidays = async () => {
      if (startDate && endDate) {
        const logger = await getLogger();
        logger.info('Loading public holidays...', { startDate, endDate });
        try {
          const formattedStart =
            typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
          const formattedEnd =
            typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd');

          const holidays = await publicHolidayService.getPublicHolidaysInRange(
            formattedStart,
            formattedEnd
          );

          // Convertir en PublicHolidayDetail
          const holidayDetails: PublicHolidayDetail[] = holidays.map(h => ({
            date: new Date(typeof h.date === 'string' ? h.date : h.date),
            name: h.name,
            isNational: h.isNational,
            description: h.description,
          }));

          setPublicHolidays(holidayDetails);
          logger.info('Public holidays loaded successfully', { count: holidayDetails.length });
        } catch (err: unknown) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          logger.error(`Erreur lors du chargement des jours fériés: ${errorObj.message}`, {
            startDate,
            endDate,
            stack: errorObj.stack,
          });
          setError(errorObj);
        }
      }
    };

    loadPublicHolidays();
  }, [startDate, endDate]);

  return {
    details,
    isLoading: status === 'loading' || isLoadingWorkSchedule,
    error,
    status,
    recalculate: calculateDetails,
    publicHolidays,
    workingDays: details?.workDays || 0,
    countedDays: details?.countedDays || 0,
    hasValidDates,
  };
};
