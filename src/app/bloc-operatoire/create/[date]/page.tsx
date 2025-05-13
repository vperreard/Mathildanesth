'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

export default function CreateBlocPlanningPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [date, setDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [sites, setSites] = useState<Array<{ id: string, name: string }>>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        // Récupérer la date depuis les paramètres d'URL
        if (params?.date) {
            try {
                const parsedDate = parse(params.date as string, 'yyyy-MM-dd', new Date());
                if (!isNaN(parsedDate.getTime())) {
                    setDate(parsedDate);
                } else {
                    setError("Format de date invalide");
                }
            } catch (err) {
                console.error("Erreur lors du parsing de la date:", err);
                setError("Format de date invalide");
            }
        }

        // Récupérer le site depuis les paramètres de recherche
        const siteId = searchParams?.get('siteId');
        if (siteId) {
            setSelectedSiteId(siteId);
        }

        // Charger la liste des sites
        loadSites();
    }, [params?.date, searchParams]);

    // Fonction pour charger la liste des sites
    const loadSites = async () => {
        try {
            // Dans une application réelle, récupérer les sites depuis l'API
            // Pour l'instant, on utilise des données fictives
            const mockSites = [
                { id: '1', name: 'Hôpital Principal' },
                { id: '2', name: 'Clinique Sud' },
                { id: '3', name: 'Centre Médical Est' }
            ];
            setSites(mockSites);

            // Si aucun site n'est sélectionné, prendre le premier par défaut
            if (!selectedSiteId && mockSites.length > 0) {
                setSelectedSiteId(mockSites[0].id);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des sites:", err);
        }
    };

    // Formater la date pour affichage
    const formattedDateDisplay = date
        ? format(date, 'EEEE d MMMM yyyy', { locale: fr })
        : '';

    const handleCancel = () => {
        router.back();
    };

    const handleCreatePlanning = async () => {
        if (!date || !selectedSiteId) return;

        try {
            setCreating(true);
            setError(null);

            // Convertir la date au format UTC pour l'API
            const dateForApi = new Date(date);
            dateForApi.setHours(0, 0, 0, 0);

            // Création du planning avec les paramètres de base
            const createParams = {
                siteId: selectedSiteId,
                startDate: dateForApi,
                endDate: dateForApi,
                trameIds: [], // Aucune trame pour l'instant
                initiatorUserId: 1, // ID factice pour l'utilisateur actuel
            };

            // Appeler le service pour créer le planning
            const createdPlannings = await blocPlanningService.createOrUpdateBlocDayPlanningsFromTrames(createParams);

            if (createdPlannings && createdPlannings.length > 0) {
                // Rediriger vers la page d'édition du planning créé
                router.push(`/bloc-operatoire/edit/${createdPlannings[0].id}`);
            } else {
                setError("Erreur lors de la création du planning. Aucun planning créé.");
            }
        } catch (err) {
            console.error("Erreur lors de la création du planning:", err);
            setError("Une erreur est survenue lors de la création du planning. Veuillez réessayer.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <Button variant="outline" size="sm" onClick={handleCancel} className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                </Button>
                <h1 className="text-2xl font-bold">Création d'un nouveau planning</h1>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Nouveau planning du {formattedDateDisplay}
                    </CardTitle>
                    <CardDescription>
                        Créez le planning du bloc opératoire pour cette journée
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="site-select" className="block text-sm font-medium">
                                Site
                            </label>
                            <Select
                                value={selectedSiteId}
                                onValueChange={setSelectedSiteId}
                                disabled={loading || creating}
                            >
                                <SelectTrigger id="site-select" className="w-full max-w-md">
                                    <SelectValue placeholder="Sélectionner un site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sites.map(site => (
                                        <SelectItem key={site.id} value={site.id}>
                                            {site.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button variant="outline" onClick={handleCancel} disabled={creating}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleCreatePlanning}
                                disabled={!date || !selectedSiteId || creating}
                            >
                                {creating ? 'Création en cours...' : 'Créer le planning'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 