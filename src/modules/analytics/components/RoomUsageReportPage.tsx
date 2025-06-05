'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from "../../../lib/logger";
import { RoomUsageFilters, RoomUsageFiltersState } from './RoomUsageFilters';
import { RoomUsageDisplay } from './RoomUsageDisplay';
import { RoomUsageCharts } from './RoomUsageCharts';
import { RoomUtilizationReport } from '@/modules/analytics/services/analyticsService'; // Ajustez le chemin si nécessaire
import { Container } from '@/components/layout/Container'; // Supposant l'existence de ce composant

// Simule la structure d'un Site pour le nommage
interface SiteInfo {
    id: string;
    name: string;
}

export default function RoomUsageReportPage() {
    const [filters, setFilters] = useState<RoomUsageFiltersState | null>(null);
    const [reportData, setReportData] = useState<RoomUtilizationReport | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Principalement pour le chargement du rapport
    const [sitesError, setSitesError] = useState<string | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [currentSiteName, setCurrentSiteName] = useState<string | undefined>(undefined);
    const [availableSites, setAvailableSites] = useState<SiteInfo[]>([]);
    const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);

    useEffect(() => {
        const fetchSitesData = async () => {
            setIsLoadingSites(true);
            setSitesError(null);
            try {
                const response = await fetch('http://localhost:3000/api/sites');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erreur ${response.status} lors de la récupération des sites.`);
                }
                const sitesData: SiteInfo[] = await response.json();
                setAvailableSites(sitesData);
            } catch (err) {
                logger.error("Erreur lors de la récupération des sites:", err);
                setSitesError(err instanceof Error ? err.message : 'Impossible de charger la liste des sites.');
                setAvailableSites([]);
            } finally {
                setIsLoadingSites(false);
            }
        };
        fetchSitesData();
    }, []);

    const handleFiltersChange = useCallback((newFilters: RoomUsageFiltersState) => {
        if (newFilters.siteId && newFilters.startDate && newFilters.endDate) {
            setFilters(newFilters);
            const site = availableSites.find(s => s.id === newFilters.siteId);
            setCurrentSiteName(site?.name);
        } else {
            setFilters(null);
            setReportData(null);
            setCurrentSiteName(undefined);
        }
    }, [availableSites]);

    useEffect(() => {
        if (filters && filters.siteId && filters.startDate && filters.endDate) {
            const fetchData = async () => {
                setIsLoading(true);
                setReportError(null);
                setReportData(null);

                try {
                    const { siteId, startDate, endDate } = filters;
                    const queryParams = new URLSearchParams({
                        siteId: siteId!,
                        startDate: startDate!.toISOString(),
                        endDate: endDate!.toISOString(),
                    });

                    const response = await fetch(`http://localhost:3000/api/analytics/room-utilization?${queryParams}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Erreur ${response.status} lors de la récupération des données.`);
                    }
                    const data: RoomUtilizationReport = await response.json();
                    setReportData(data);
                } catch (err) {
                    logger.error("Erreur lors du fetch des données du rapport:", err);
                    setReportError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [filters]);

    const initialReportFilters = useMemo((): RoomUsageFiltersState => {
        return {
            // Laisser vide pour que l'utilisateur choisisse, ou définir des valeurs par défaut
        };
    }, []);


    return (
        <Container title="Rapport d'Utilisation des Salles d'Opération">
            <div className="space-y-6">
                {sitesError && <p className="text-red-500">Erreur de chargement des sites: {sitesError}</p>}
                <RoomUsageFilters
                    initialFilters={initialReportFilters}
                    onFiltersChange={handleFiltersChange}
                    sites={availableSites}
                    isLoadingSites={isLoadingSites}
                />
                <RoomUsageDisplay
                    reportData={reportData}
                    isLoading={isLoading}
                    error={reportError} // Utiliser reportError ici
                    siteName={currentSiteName}
                />
                <RoomUsageCharts reportData={reportData} />
            </div>
        </Container>
    );
} 