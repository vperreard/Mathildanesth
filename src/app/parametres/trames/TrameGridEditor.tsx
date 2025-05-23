'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { PlusIcon, RefreshCcw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Import du modal de création
const NewTrameModal = dynamic(() => import('@/components/trames/grid-view/NewTrameModal'), { ssr: false });

// Import dynamique pour éviter les problèmes SSR avec react-beautiful-dnd
const TrameGridView = dynamic(
    () => import('@/components/trames/grid-view/TrameGridView'),
    { ssr: false }
);

// Importer uniquement les types
import type { TrameModele, AffectationModele } from '@/components/trames/grid-view/TrameGridView';

// Interfaces pour les salles et secteurs
interface OperatingRoom {
    id: string;
    name: string;
    number?: string;
    operatingSectorId: string;
    isActive: boolean;
    displayOrder?: number;
    sector?: OperatingSector;
}

interface OperatingSector {
    id: string;
    name: string;
    description?: string;
    colorCode?: string;
    siteId: string;
    isActive: boolean;
}

// Fonction pour convertir les données du back-end vers le format attendu par TrameGridView
const mapTrameFromApi = (apiTrame: any): TrameModele => {
    // Mapping du type de semaine
    let weekType: 'ALL' | 'EVEN' | 'ODD' = 'ALL';
    if (apiTrame.typeSemaine === 'PAIRES') weekType = 'EVEN';
    if (apiTrame.typeSemaine === 'IMPAIRES') weekType = 'ODD';
    if (apiTrame.typeSemaine === 'TOUTES') weekType = 'ALL';

    // Mapping des affectations
    const affectations: AffectationModele[] = apiTrame.affectations?.map((aff: any) => {
        // Mapping du type de période
        let period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' = 'FULL_DAY';
        if (aff.periode === 'MATIN') period = 'MORNING';
        if (aff.periode === 'APRES_MIDI') period = 'AFTERNOON';
        if (aff.periode === 'JOURNEE_ENTIERE') period = 'FULL_DAY';

        // Mapping des personnels requis
        const requiredStaff = aff.personnelRequis?.map((pr: any) => ({
            id: pr.id.toString(),
            affectationId: aff.id.toString(),
            role: mapRoleFromApi(pr.roleGenerique),
            count: pr.nombreRequis || 1,
            userId: pr.personnelHabituelUserId?.toString() || pr.personnelHabituelSurgeonId?.toString() || undefined
        })) || [];

        return {
            id: aff.id.toString(),
            trameId: apiTrame.id.toString(),
            roomId: aff.operatingRoomId?.toString(),
            activityTypeId: aff.activityTypeId,
            period: period,
            dayOverride: aff.jourSemaine, // Convertir jour de la semaine si nécessaire
            weekTypeOverride: mapWeekTypeFromApi(aff.typeSemaine),
            requiredStaff: requiredStaff,
            isActive: aff.isActive
        };
    }) || [];

    // Convertir l'objet trame
    return {
        id: apiTrame.id.toString(),
        name: apiTrame.name,
        description: apiTrame.description || undefined,
        siteId: apiTrame.siteId || 'default',
        weekType: weekType,
        activeDays: apiTrame.joursSemaineActifs,
        effectiveStartDate: new Date(apiTrame.dateDebutEffet),
        effectiveEndDate: apiTrame.dateFinEffet ? new Date(apiTrame.dateFinEffet) : undefined,
        affectations: affectations
    };
};

// Fonction pour mapper les rôles depuis l'API
const mapRoleFromApi = (role: string): 'MAR' | 'SURGEON' | 'IADE' | 'IBODE' => {
    switch (role) {
        case 'MAR': return 'MAR';
        case 'CHIRURGIEN': return 'SURGEON';
        case 'IADE': return 'IADE';
        case 'IBODE': return 'IBODE';
        default: return 'MAR'; // Valeur par défaut
    }
};

// Fonction pour mapper les types de semaine depuis l'API
const mapWeekTypeFromApi = (typeSemaine: string): 'ALL' | 'EVEN' | 'ODD' => {
    switch (typeSemaine) {
        case 'PAIRES': return 'EVEN';
        case 'IMPAIRES': return 'ODD';
        case 'TOUTES': return 'ALL';
        default: return 'ALL';
    }
};

const TrameGridEditor: React.FC = () => {
    const { user } = useAuth();
    const [trames, setTrames] = useState<TrameModele[]>([]);
    const [selectedTrameId, setSelectedTrameId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sites, setSites] = useState<Array<{ id: string; name: string; }>>([]);
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

    const fetchTrames = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get('/api/trame-modeles?includeAffectations=true');

            if (response.status === 200) {
                setTrames(response.data);

                // Sélectionner la première trame par défaut s'il y en a
                if (response.data.length > 0 && !selectedTrameId) {
                    setSelectedTrameId(response.data[0].id);

                    // Si la trame a un siteId, on le sélectionne pour charger les salles/secteurs
                    if (response.data[0].siteId) {
                        setSelectedSiteId(response.data[0].siteId);
                    }
                }
            }
        } catch (err: any) {
            console.error('Erreur lors du chargement des trames:', err);

            if (err.response && err.response.status === 401) {
                setError("Erreur d'authentification. Votre session a peut-être expiré.");
            } else {
                setError("Une erreur est survenue lors du chargement des trames. Veuillez réessayer.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSites = async () => {
        try {
            const response = await axios.get('/api/sites');
            if (response.status === 200) {
                setSites(response.data);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des sites:', err);
        }
    };

    const fetchRoomsAndSectors = async (siteId: string) => {
        try {
            // Charger les secteurs pour ce site
            const sectorsResponse = await axios.get(`/api/operating-sectors?siteId=${siteId}`);
            if (sectorsResponse.status === 200) {
                setSectors(sectorsResponse.data);
            }

            // Charger les salles associées à ce site
            const roomsResponse = await axios.get(`/api/operating-rooms?siteId=${siteId}`);
            if (roomsResponse.status === 200) {
                setRooms(roomsResponse.data);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des secteurs et salles:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTrames();
            fetchSites();
        } else {
            setError("Vous devez être connecté pour accéder à cette fonctionnalité.");
            setIsLoading(false);
        }
    }, [user]);

    // Quand selectedSiteId change, charger les secteurs et salles
    useEffect(() => {
        if (selectedSiteId) {
            fetchRoomsAndSectors(selectedSiteId);
        }
    }, [selectedSiteId]);

    // Quand selectedTrameId change, mettre à jour selectedSiteId si nécessaire
    useEffect(() => {
        if (selectedTrameId) {
            const trame = trames.find(t => t.id === selectedTrameId);
            if (trame && trame.siteId && trame.siteId !== selectedSiteId) {
                setSelectedSiteId(trame.siteId);
            }
        }
    }, [selectedTrameId, trames]);

    const handleTrameChange = async (updatedTrame: TrameModele) => {
        try {
            // Mise à jour optimiste de l'UI
            setTrames(prevTrames =>
                prevTrames.map(trame =>
                    trame.id === updatedTrame.id ? updatedTrame : trame
                )
            );

            // Envoi au serveur
            await axios.put(`/api/trame-modeles/${updatedTrame.id}`, updatedTrame);

            // Si tout va bien, on ne fait rien de plus car l'UI est déjà à jour
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la trame:', err);
            setError("Erreur lors de la sauvegarde des modifications. Veuillez réessayer.");

            // En cas d'erreur, on recharge les données
            fetchTrames();
        }
    };

    const handleCreateTrameSuccess = (newTrameId: string) => {
        // Recharger les trames pour avoir les données complètes
        fetchTrames().then(() => {
            // Sélectionner la nouvelle trame
            setSelectedTrameId(newTrameId);
        });
        setIsModalOpen(false);
    };

    const handleRefresh = () => {
        fetchTrames();
        if (selectedSiteId) {
            fetchRoomsAndSectors(selectedSiteId);
        }
    };

    const selectedTrame = trames.find(trame => trame.id === selectedTrameId);

    // Rendu du composant
    return (
        <div className="space-y-4">
            {/* Gestion des erreurs */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCcw className="h-4 w-4 mr-2" /> Réessayer
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Sélection de trame et actions */}
            <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Sélectionner une trame:</span>
                        <Select
                            value={selectedTrameId || ''}
                            onValueChange={(value) => setSelectedTrameId(value)}
                            disabled={isLoading || trames.length === 0}
                        >
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Sélectionner une trame" />
                            </SelectTrigger>
                            <SelectContent>
                                {trames.map(trame => (
                                    <SelectItem key={trame.id} value={trame.id}>
                                        {trame.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" /> Actualiser
                    </Button>
                </div>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoading}
                >
                    <PlusIcon className="h-4 w-4 mr-2" /> Nouvelle trame
                </Button>
            </div>

            {/* État de chargement */}
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <>
                    {/* Affichage des trames */}
                    {selectedTrame ? (
                        <TrameGridView
                            trame={selectedTrame}
                            onTrameChange={handleTrameChange}
                            rooms={rooms}
                            sectors={sectors}
                        />
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                {trames.length === 0 ? (
                                    <>
                                        <p className="text-center text-muted-foreground mb-4">
                                            Aucune trame disponible. Créez votre première trame pour commencer.
                                        </p>
                                        <Button onClick={() => setIsModalOpen(true)}>
                                            <PlusIcon className="h-4 w-4 mr-2" /> Créer une trame
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-center text-muted-foreground">
                                        Sélectionnez une trame dans la liste déroulante ci-dessus.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de création de trame */}
            {isModalOpen && (
                <NewTrameModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateTrameSuccess}
                    sites={sites}
                />
            )}
        </div>
    );
};

export default TrameGridEditor; 