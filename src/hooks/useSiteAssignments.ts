'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from "../lib/logger";
import { apiClient } from '@/utils/apiClient';

interface Site {
    id: string;
    name: string;
    description?: string;
    colorCode?: string;
    isActive: boolean;
}

interface SiteAssignmentsResult {
    sites: Site[];
    loading: boolean;
    error: string | null;
    updateSites: (siteIds: string[]) => Promise<boolean>;
    addSites: (siteIds: string[]) => Promise<boolean>;
    removeSites: (siteIds: string[]) => Promise<boolean>;
    refresh: () => void;
}

export function useUserSiteAssignments(userId: number | string): SiteAssignmentsResult {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserSites = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/api/utilisateurs/${userId}/sites`);
            setSites(response.data.sites || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur fetchUserSites:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!userId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.put(`/api/utilisateurs/${userId}/sites`, { siteIds });
            setSites(response.data.user.sites || []);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur updateSites:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const addSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!userId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post(`/api/utilisateurs/${userId}/sites`, { siteIds });
            setSites(response.data.user.sites || []);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur addSites:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const removeSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!userId) return false;

        // Pour les utilisateurs, on utilise PUT avec les sites restants
        const remainingSiteIds = sites
            .filter(site => !siteIds.includes(site.id))
            .map(site => site.id);

        return updateSites(remainingSiteIds);
    }, [userId, sites, updateSites]);

    useEffect(() => {
        fetchUserSites();
    }, [fetchUserSites]);

    return {
        sites,
        loading,
        error,
        updateSites,
        addSites,
        removeSites,
        refresh: fetchUserSites
    };
}

export function useSurgeonSiteAssignments(surgeonId: number | string): SiteAssignmentsResult {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSurgeonSites = useCallback(async () => {
        if (!surgeonId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/api/chirurgiens/${surgeonId}/sites`);
            setSites(response.data.sites || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur fetchSurgeonSites:', err);
        } finally {
            setLoading(false);
        }
    }, [surgeonId]);

    const updateSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!surgeonId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.put(`/api/chirurgiens/${surgeonId}/sites`, { siteIds });
            setSites(response.data.surgeon.sites || []);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur updateSites:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [surgeonId]);

    const addSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!surgeonId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post(`/api/chirurgiens/${surgeonId}/sites`, { siteIds });
            setSites(response.data.surgeon.sites || []);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur addSites:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [surgeonId]);

    const removeSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!surgeonId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.delete(`/api/chirurgiens/${surgeonId}/sites`, {
                data: { siteIds }
            });
            setSites(response.data.surgeon.sites || []);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            logger.error('Erreur removeSites:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [surgeonId]);

    useEffect(() => {
        fetchSurgeonSites();
    }, [fetchSurgeonSites]);

    return {
        sites,
        loading,
        error,
        updateSites,
        addSites,
        removeSites,
        refresh: fetchSurgeonSites
    };
}

// Hook générique qui peut être utilisé pour les deux
export function useSiteAssignments(
    entityType: 'user' | 'surgeon',
    entityId: number | string
): SiteAssignmentsResult {
    if (entityType === 'user') {
        return useUserSiteAssignments(entityId);
    } else {
        return useSurgeonSiteAssignments(entityId);
    }
} 