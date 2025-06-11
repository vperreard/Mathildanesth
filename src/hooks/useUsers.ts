import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  professionalRole: string;
  actif: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users?limit=100&isActive=true');

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUsers(data.data);
        logger.info(`[useUsers] ${data.data.length} utilisateurs récupérés`);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des utilisateurs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('[useUsers] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
};
