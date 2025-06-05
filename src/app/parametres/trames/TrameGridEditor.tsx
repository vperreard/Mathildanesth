'use client';

import React, { useEffect, useState } from 'react';
import { logger } from "../../../lib/logger";
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { PlusIcon, RefreshCcw, AlertCircle, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';

// Import du modal de création
const NewTrameModal = dynamic(() => import('@/components/trames/grid-view/NewTrameModal'), { ssr: false });

// Import dynamique pour éviter les problèmes SSR avec react-beautiful-dnd
const TrameGridView = dynamic(
    () => import('@/components/trames/grid-view/TrameGridView'),
    { ssr: false }
);

// Importer uniquement les types
import type { TrameModele, AffectationModele } from '@/components/trames/grid-view/TrameGridView';

// Utilitaire pour des toasts plus sûrs
const safeToast = {
    success: (message: string) => {
        try {
            // Supprimer les toasts précédents pour éviter les conflits
            toast.dismiss();
            setTimeout(() => {
                toast.success(message, {
                    toastId: `success-${Date.now()}`, // ID unique
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }, 100);
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'affichage du toast:', error instanceof Error ? error : new Error(String(error)));
        }
    },
    error: (message: string) => {
        try {
            toast.dismiss();
            setTimeout(() => {
                toast.error(message, {
                    toastId: `error-${Date.now()}`,
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }, 100);
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'affichage du toast d\'erreur:', error instanceof Error ? error : new Error(String(error)));
        }
    }
};

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
const mapTrameFromApi = (apiTrame: unknown): TrameModele => {
    logger.info('[MAPPING] API TrameModele before mapping:', apiTrame);

    // Mapping du type de semaine
    let weekType: 'ALL' | 'EVEN' | 'ODD' = 'ALL';
    if (apiTrame.typeSemaine === 'PAIRES') weekType = 'EVEN';
    if (apiTrame.typeSemaine === 'IMPAIRES') weekType = 'ODD';
    if (apiTrame.typeSemaine === 'TOUTES') weekType = 'ALL';

    logger.info(`[MAPPING] typeSemaine "${apiTrame.typeSemaine}" mapped to weekType "${weekType}"`);

    // Mapping des affectations
    const affectations: AffectationModele[] = apiTrame.affectations?.map((aff: unknown) => {
        // Mapping du type de période
        let period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' = 'FULL_DAY';
        if (aff.periode === 'MATIN') period = 'MORNING';
        if (aff.periode === 'APRES_MIDI') period = 'AFTERNOON';
        if (aff.periode === 'JOURNEE_ENTIERE') period = 'FULL_DAY';

        // Mapping des personnels requis
        const requiredStaff = aff.personnelRequis?.map((pr: unknown) => ({
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

    const mappedTrame: TrameModele = {
        id: apiTrame.id.toString(),
        name: apiTrame.name,
        description: apiTrame.description,
        siteId: apiTrame.siteId,
        weekType: weekType,
        activeDays: apiTrame.joursSemaineActifs || [1, 2, 3, 4, 5],
        effectiveStartDate: new Date(apiTrame.dateDebutEffet),
        effectiveEndDate: apiTrame.dateFinEffet ? new Date(apiTrame.dateFinEffet) : undefined,
        affectations: affectations
    };

    logger.info('[MAPPING] Final mapped TrameModele:', mappedTrame);
    return mappedTrame;
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

// Fonction pour mapper de TrameModele vers le format API
const mapTrameToApi = (trameModele: TrameModele): any => {
    // Mapping inverse du type de semaine
    let typeSemaine: 'TOUTES' | 'PAIRES' | 'IMPAIRES' = 'TOUTES';
    if (trameModele.weekType === 'EVEN') typeSemaine = 'PAIRES';
    if (trameModele.weekType === 'ODD') typeSemaine = 'IMPAIRES';
    if (trameModele.weekType === 'ALL') typeSemaine = 'TOUTES';

    return {
        name: trameModele.name,
        description: trameModele.description,
        siteId: trameModele.siteId,
        isActive: true,
        dateDebutEffet: trameModele.effectiveStartDate,
        dateFinEffet: trameModele.effectiveEndDate,
        recurrenceType: 'HEBDOMADAIRE',
        joursSemaineActifs: trameModele.activeDays,
        typeSemaine: typeSemaine,
        roles: ['TOUS']
    };
};

const TrameGridEditor: React.FC = () => {
    const { user } = useAuth();
    const [trameModeles, setTrames] = useState<TrameModele[]>([]);
    const [selectedTrameId, setSelectedTrameId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sites, setSites] = useState<Array<{ id: string; name: string; }>>([]);
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [trameToEdit, setTrameToEdit] = useState<TrameModele | null>(null);

    const fetchTrames = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:3000/api/trameModele-modeles?includeAffectations=true');

            if (response.status === 200) {
                // Mapper les données de l'API au format attendu par TrameGridView
                const mappedTrames = response.data.map(mapTrameFromApi);
                setTrames(mappedTrames);

                // Sélectionner la première trameModele par défaut s'il y en a
                if (mappedTrames.length > 0 && !selectedTrameId) {
                    setSelectedTrameId(mappedTrames[0].id);

                    // Si la trameModele a un siteId, on le sélectionne pour charger les salles/secteurs
                    if (mappedTrames[0].siteId) {
                        setSelectedSiteId(mappedTrames[0].siteId);
                    }
                }
            }
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des trames:', err);

            if (err.response && err.response.status === 401) {
                setError("Erreur d'authentification. Votre session a peut-être expiré.");
            } else {
                setError("Une erreur est survenue lors du chargement des trameModeles. Veuillez réessayer.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSites = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/sites');
            if (response.status === 200) {
                setSites(response.data);
            }
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des sites:', err);
        }
    };

    const fetchRoomsAndSectors = async (siteId: string | null) => {
        try {
            setIsRefreshing(true);

            if (siteId) {
                // Charger les secteurs pour ce site spécifique
                const sectorsResponse = await axios.get(`http://localhost:3000/api/operating-sectors?siteId=${siteId}`);
                if (sectorsResponse.status === 200) {
                    setSectors(sectorsResponse.data);
                }

                // Charger les salles associées à ce site
                const roomsResponse = await axios.get(`http://localhost:3000/api/operating-rooms?siteId=${siteId}`);
                if (roomsResponse.status === 200) {
                    setRooms(roomsResponse.data);
                }
            } else {
                // TrameModele globale (siteId null) : charger tous les secteurs et salles
                logger.info("📍 TrameModele globale détectée - chargement de tous les secteurs et salles");

                const sectorsResponse = await axios.get('http://localhost:3000/api/operating-sectors');
                if (sectorsResponse.status === 200) {
                    setSectors(sectorsResponse.data);
                    logger.info(`📍 Secteurs chargés: ${sectorsResponse.data.length} secteurs`);
                }

                const roomsResponse = await axios.get('http://localhost:3000/api/operating-rooms');
                if (roomsResponse.status === 200) {
                    setRooms(roomsResponse.data);
                    logger.info(`📍 Salles chargées: ${roomsResponse.data.length} salles`);
                }
            }
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des secteurs et salles:', err);
        } finally {
            setIsRefreshing(false);
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
        if (selectedSiteId !== undefined) {
            fetchRoomsAndSectors(selectedSiteId);
        }
    }, [selectedSiteId]);

    // Quand selectedTrameId change, mettre à jour selectedSiteId
    useEffect(() => {
        if (selectedTrameId) {
            const trameModele = trameModeles.find(t => t.id === selectedTrameId);
            if (trameModele) {
                logger.info(`📍 Sélection de la trameModele "${trameModele.name}" avec siteId: ${trameModele.siteId}`);

                if (trameModele.siteId) {
                    // TrameModele liée à un site spécifique : forcer ce site
                    setSelectedSiteId(trameModele.siteId);
                } else {
                    // TrameModele globale : garder le site actuellement sélectionné ou mettre null (tous les sites)
                    if (selectedSiteId === undefined) {
                        setSelectedSiteId(null); // Par défaut : tous les sites
                    }
                    // Sinon on garde selectedSiteId tel qu'il est
                }
            }
        }
    }, [selectedTrameId, trameModeles]);

    // Actualisation automatique des données quand on change de trameModele OU de site
    useEffect(() => {
        if (selectedTrameId && selectedSiteId !== undefined) {
            logger.info(`🔄 Actualisation automatique pour la trameModele ${selectedTrameId} (site: ${selectedSiteId || 'global'})`);
            fetchRoomsAndSectors(selectedSiteId);
        }
    }, [selectedTrameId, selectedSiteId, trameModeles, sites]);

    const handleTrameChange = async (updatedTrame: TrameModele) => {
        try {
            // Convertir au format API
            const apiTrame = mapTrameToApi(updatedTrame);

            // Envoi au serveur
            const response = await axios.put(`http://localhost:3000/api/trameModele-modeles/${updatedTrame.id}`, apiTrame);

            // Mapper la réponse de l'API et mettre à jour l'état
            if (response.status === 200) {
                const mappedUpdatedTrame = mapTrameFromApi(response.data);
                setTrames(prevTrames =>
                    prevTrames.map(trameModele =>
                        trameModele.id === updatedTrame.id ? mappedUpdatedTrame : trameModele
                    )
                );
            }
        } catch (err: unknown) {
            logger.error('Erreur lors de la mise à jour de la trameModele:', err);
            setError("Erreur lors de la sauvegarde des modifications. Veuillez réessayer.");

            // En cas d'erreur, on recharge les données
            fetchTrames();
        }
    };

    const handleCreateTrameSuccess = (newTrameId: string) => {
        // Recharger les trameModeles pour avoir les données complètes avec mapping
        fetchTrames().then(() => {
            // Sélectionner la nouvelle trameModele
            setSelectedTrameId(newTrameId);
        });
        setIsModalOpen(false);
    };

    const handleRefresh = () => {
        fetchTrames();
        if (selectedSiteId !== undefined) {
            fetchRoomsAndSectors(selectedSiteId);
        }
    };

    const handleEditTrame = (trameModele: TrameModele) => {
        setTrameToEdit(trameModele);
        setIsEditModalOpen(true);
    };

    const handleEditTrameSuccess = (updatedTrameId: string) => {
        // Recharger les trameModeles pour avoir les données mises à jour avec mapping
        fetchTrames().then(() => {
            // Garder la trameModele sélectionnée actuelle
            setSelectedTrameId(updatedTrameId);
        });
        setIsEditModalOpen(false);
        setTrameToEdit(null);
    };

    const selectedTrame = trameModeles.find(trameModele => trameModele.id === selectedTrameId);

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

            {/* Sélection de trameModele et actions */}
            <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Sélectionner une trameModele:</span>
                        <div className="flex items-center space-x-2">
                            <Select
                                value={selectedTrameId || ''}
                                onValueChange={(value) => setSelectedTrameId(value)}
                                disabled={isLoading || trameModeles.length === 0}
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Sélectionner une trameModele" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trameModeles.map(trameModele => {
                                        const site = sites.find(s => s.id === trameModele.siteId);
                                        return (
                                            <SelectItem key={trameModele.id} value={trameModele.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{trameModele.name}</span>
                                                    {trameModele.siteId ? (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {site ? site.name : `Site ${trameModele.siteId}`}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs">Global</Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {isRefreshing && (
                                <div className="flex items-center space-x-1 text-xs text-blue-600">
                                    <RefreshCcw className="h-3 w-3 animate-spin" />
                                    <span>Actualisation...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Indicateur permanent du site de la trameModele sélectionnée */}
                    {selectedTrame && (
                        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Site actuel:</span>
                            {selectedTrame.siteId ? (
                                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                                    {sites.find(s => s.id === selectedTrame.siteId)?.name || `Site ${selectedTrame.siteId}`}
                                </span>
                            ) : (
                                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                                    TrameModele globale
                                </span>
                            )}
                        </div>
                    )}

                    {/* Sélecteur de site - affiché seulement pour les trameModeles globales */}
                    {selectedTrame && !selectedTrame.siteId && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Vue site:</span>
                            <Select
                                value={selectedSiteId || 'all'}
                                onValueChange={(value) => setSelectedSiteId(value === 'all' ? null : value)}
                                disabled={isLoading || sites.length === 0}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Choisir un site" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span>Tous les sites</span>
                                            <Badge variant="secondary" className="text-xs">Global</Badge>
                                        </div>
                                    </SelectItem>
                                    {sites.map(site => (
                                        <SelectItem key={site.id} value={site.id}>
                                            {site.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" /> Actualiser
                    </Button>

                    {/* Bouton d'urgence pour fermer tous les toasts */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            try {
                                // Fermer tous les toasts react-toastify
                                toast.dismiss();
                                // Également nettoyer le DOM des toasts orphelins
                                const toastElements = document.querySelectorAll('[class*="Toastify"]');
                                toastElements.forEach(el => el.remove());
                                logger.info('Tous les toasts ont été fermés');
                            } catch (error: unknown) {
                                logger.error('Erreur lors de la fermeture des toasts:', error instanceof Error ? error : new Error(String(error)));
                            }
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300"
                        title="Fermer tous les toasts problématiques"
                    >
                        🚫 Fermer toasts
                    </Button>

                    {/* Bouton de modification de la trameModele sélectionnée */}
                    {selectedTrame && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrame(selectedTrame)}
                            disabled={isLoading}
                            className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                            <Settings className="h-4 w-4 mr-2" /> Modifier la trameModele
                        </Button>
                    )}
                </div>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoading}
                >
                    <PlusIcon className="h-4 w-4 mr-2" /> Nouvelle trameModele
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
                    {/* Affichage des trameModeles */}
                    {selectedTrame ? (
                        <TrameGridView
                            key={`${selectedTrame.id}-${rooms.length}-${sectors.length}`}
                            trameModele={selectedTrame}
                            onTrameChange={handleTrameChange}
                            rooms={rooms}
                            sectors={sectors}
                            sites={sites}
                            selectedSiteId={selectedSiteId}
                        />
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                {trameModeles.length === 0 ? (
                                    <>
                                        <p className="text-center text-muted-foreground mb-4">
                                            Aucune trameModele disponible. Créez votre première trameModele pour commencer.
                                        </p>
                                        <Button onClick={() => setIsModalOpen(true)}>
                                            <PlusIcon className="h-4 w-4 mr-2" /> Créer une trameModele
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-center text-muted-foreground">
                                        Sélectionnez une trameModele dans la liste déroulante ci-dessus.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de création de trameModele */}
            {isModalOpen && (
                <NewTrameModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateTrameSuccess}
                    sites={sites}
                />
            )}

            {/* Modal de modification de trameModele */}
            {isEditModalOpen && trameToEdit && (
                <NewTrameModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setTrameToEdit(null);
                    }}
                    onSuccess={handleEditTrameSuccess}
                    sites={sites}
                    initialTrame={trameToEdit}
                    isEditMode={true}
                />
            )}
        </div>
    );
};

export default TrameGridEditor;