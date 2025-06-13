import { useCallback, useMemo } from 'react';
import { TrameAffectation } from '@/types/trame-affectations';
import { useTrameAffectations as useTrameAffectationsQuery } from './useTrameAffectationQueries';

// Hook for working with trame affectations data
export function useTrameAffectations(trameId: string) {
  const { data: affectations = [], isLoading, error } = useTrameAffectationsQuery(trameId);

  // Group affectations by day
  const affectationsByDay = useMemo(() => {
    const grouped: Record<string, TrameAffectation[]> = {};

    affectations.forEach(affectation => {
      const day = affectation.dayOfWeek;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(affectation);
    });

    return grouped;
  }, [affectations]);

  // Group affectations by room
  const affectationsByRoom = useMemo(() => {
    const grouped: Record<string, TrameAffectation[]> = {};

    affectations.forEach(affectation => {
      const roomId = affectation.operatingRoomId;
      if (!grouped[roomId]) {
        grouped[roomId] = [];
      }
      grouped[roomId].push(affectation);
    });

    return grouped;
  }, [affectations]);

  // Get affectation for specific day and room
  const getAffectation = useCallback(
    (dayOfWeek: string, operatingRoomId: string, weekType?: 'even' | 'odd') => {
      return affectations.find(
        a =>
          a.dayOfWeek === dayOfWeek &&
          a.operatingRoomId === operatingRoomId &&
          (!weekType || a.weekType === weekType)
      );
    },
    [affectations]
  );

  // Get all affectations for a specific surgeon
  const getAffectationsBySurgeon = useCallback(
    (surgeonId: string) => {
      return affectations.filter(a => a.surgeonId === surgeonId);
    },
    [affectations]
  );

  // Check if a surgeon is available for a specific time slot
  const isSurgeonAvailable = useCallback(
    (surgeonId: string, dayOfWeek: string, weekType?: 'even' | 'odd') => {
      const surgeonAffectations = getAffectationsBySurgeon(surgeonId);
      return !surgeonAffectations.some(
        a => a.dayOfWeek === dayOfWeek && (!weekType || a.weekType === weekType)
      );
    },
    [getAffectationsBySurgeon]
  );

  // Get statistics
  const statistics = useMemo(() => {
    const stats = {
      total: affectations.length,
      byDay: {} as Record<string, number>,
      byRoom: {} as Record<string, number>,
      bySurgeon: {} as Record<string, number>,
      byWeekType: {
        even: 0,
        odd: 0,
        all: 0,
      },
    };

    affectations.forEach(affectation => {
      // By day
      stats.byDay[affectation.dayOfWeek] = (stats.byDay[affectation.dayOfWeek] || 0) + 1;

      // By room
      stats.byRoom[affectation.operatingRoomId] =
        (stats.byRoom[affectation.operatingRoomId] || 0) + 1;

      // By surgeon
      if (affectation.surgeonId) {
        stats.bySurgeon[affectation.surgeonId] = (stats.bySurgeon[affectation.surgeonId] || 0) + 1;
      }

      // By week type
      if (affectation.weekType === 'even') {
        stats.byWeekType.even++;
      } else if (affectation.weekType === 'odd') {
        stats.byWeekType.odd++;
      } else {
        stats.byWeekType.all++;
      }
    });

    return stats;
  }, [affectations]);

  return {
    affectations,
    isLoading,
    error,
    affectationsByDay,
    affectationsByRoom,
    getAffectation,
    getAffectationsBySurgeon,
    isSurgeonAvailable,
    statistics,
  };
}
