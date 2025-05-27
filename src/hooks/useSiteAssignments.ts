'use client';

import { useState, useEffect, useCallback } from 'react';

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

            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}/sites`);

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des sites');
            }

            const data = await response.json();
            setSites(data.sites || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur fetchUserSites:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!userId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}/sites`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ siteIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour');
            }

            const data = await response.json();
            setSites(data.user.sites || []);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur updateSites:', err);
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

            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ siteIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'ajout');
            }

            const data = await response.json();
            setSites(data.user.sites || []);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur addSites:', err);
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

            const response = await fetch(`http://localhost:3000/api/chirurgiens/${surgeonId}/sites`);

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des sites');
            }

            const data = await response.json();
            setSites(data.sites || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur fetchSurgeonSites:', err);
        } finally {
            setLoading(false);
        }
    }, [surgeonId]);

    const updateSites = useCallback(async (siteIds: string[]): Promise<boolean> => {
        if (!surgeonId) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:3000/api/chirurgiens/${surgeonId}/sites`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ siteIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour');
            }

            const data = await response.json();
            setSites(data.surgeon.sites || []);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur updateSites:', err);
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

            const response = await fetch(`http://localhost:3000/api/chirurgiens/${surgeonId}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ siteIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'ajout');
            }

            const data = await response.json();
            setSites(data.surgeon.sites || []);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur addSites:', err);
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

            const response = await fetch(`http://localhost:3000/api/chirurgiens/${surgeonId}/sites`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ siteIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            const data = await response.json();
            setSites(data.surgeon.sites || []);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('Erreur removeSites:', err);
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