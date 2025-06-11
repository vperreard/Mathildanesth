import { useState, useEffect } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';

export interface Specialty {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface Surgeon {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  userId?: number | null;
  specialties: Specialty[];
  sites?: Array<{
    id: string;
    name: string;
  }>;
}

interface UseSurgeonsReturn {
  surgeons: Surgeon[];
  specialties: Specialty[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSurgeons = (includeInactive: boolean = false): UseSurgeonsReturn => {
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurgeons = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les chirurgiens
      const surgeonsResponse = await axios.get<Surgeon[]>('/api/chirurgiens', {
        params: { includeInactive },
      });

      logger.info(`[useSurgeons] ${surgeonsResponse.data.length} chirurgiens récupérés`);
      setSurgeons(surgeonsResponse.data);

      // Récupérer les spécialités
      const specialtiesResponse = await axios.get<Specialty[]>('/api/specialties');
      logger.info(`[useSurgeons] ${specialtiesResponse.data.length} spécialités récupérées`);
      setSpecialties(specialtiesResponse.data);
    } catch (err) {
      logger.error('[useSurgeons] Erreur lors de la récupération des chirurgiens:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeons();
  }, [includeInactive]);

  return {
    surgeons,
    specialties,
    isLoading,
    error,
    refetch: fetchSurgeons,
  };
};
