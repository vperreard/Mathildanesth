'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AffectationConfigModal from './AffectationConfigModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, UsersIcon, ClockIcon, AlertTriangle, MoreVertical, Edit, Trash, MessageSquareX, PlusIcon, MapPinIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Exports pour l'utilisation dans d'autres composants
export type WeekType = 'ALL' | 'EVEN' | 'ODD';
export type DayPeriod = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
export type StaffRole = 'MAR' | 'SURGEON' | 'IADE' | 'IBODE';

export interface TrameModele {
    id: string;
    name: string;
    description?: string;
    siteId: string;
    weekType: WeekType;
    activeDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    effectiveStartDate: Date;
    effectiveEndDate?: Date;
    affectations: AffectationModele[];
}

export interface AffectationModele {
    id: string;
    trameId: string;
    roomId?: string;
    activityTypeId: string;
    period: DayPeriod;
    dayOverride?: number;
    weekTypeOverride?: WeekType;
    requiredStaff: RequiredStaff[];
    isActive: boolean;
}

export interface RequiredStaff {
    id: string;
    affectationId: string;
    role: StaffRole;
    count: number;
    userId?: string; // L'utilisateur habituellement affecté
}

// Données simulées pour le prototype
const mockRooms = [
    { id: 'room1', name: 'Salle 1', sectorId: 'sector1' },
    { id: 'room2', name: 'Salle 2', sectorId: 'sector1' },
    { id: 'room3', name: 'Salle 3', sectorId: 'sector2' },
    { id: 'room4', name: 'Salle 4', sectorId: 'sector2' },
];

const mockSectors = {
    sector1: { id: 'sector1', name: 'Bloc A', color: 'bg-blue-100' },
    sector2: { id: 'sector2', name: 'Bloc B', color: 'bg-green-100' },
};

const mockUsers = [
    { id: 'user1', name: 'Dr. Martin', role: 'MAR' },
    { id: 'user2', name: 'Dr. Dupont', role: 'MAR' },
    { id: 'user3', name: 'Dr. Bernard', role: 'SURGEON' },
    { id: 'user4', name: 'Dr. Laurent', role: 'SURGEON' },
    { id: 'user5', name: 'Infirmier Richard', role: 'IADE' },
    { id: 'user6', name: 'Infirmière Dubois', role: 'IADE' },
];

const mockActivityTypes = [
    { id: 'activity1', name: 'Bloc Opératoire', code: 'BLOC' },
    { id: 'activity2', name: 'Consultation', code: 'CONSULT' },
    { id: 'activity3', name: 'Garde', code: 'GARDE' },
    { id: 'activity4', name: 'Astreinte', code: 'ASTREINTE' },
];

// Composant principal
const TrameGridView: React.FC<{
    trameModele?: TrameModele;
    readOnly?: boolean;
    onTrameChange?: (trameModele: TrameModele) => void;
    rooms?: unknown[];
    sectors?: unknown[];
    sites?: Array<{ id: string; name: string; }>;
    selectedSiteId?: string | null;
}> = ({ trameModele: initialTrame, readOnly = false, onTrameChange, rooms = [], sectors = [], sites = [], selectedSiteId }) => {
    // État du composant
    const [trameModele, setTrame] = useState<TrameModele>(
        initialTrame || {
            id: 'new-trameModele',
            name: 'Nouvelle TrameModele',
            siteId: 'site1',
            weekType: 'ALL',
            activeDays: [1, 2, 3, 4, 5], // Lundi à vendredi
            effectiveStartDate: new Date(),
            affectations: [],
        }
    );

    const [showWeekType, setShowWeekType] = useState<WeekType | 'ALL'>('ALL');
    const [showPersonnel, setShowPersonnel] = useState(true);
    const [compactView, setCompactView] = useState(false);

    // États pour le modal de configuration des affectations
    const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        roomId: string;
        dayCode: number;
        period: DayPeriod;
        roomName?: string;
        dayName?: string;
    } | null>(null);

    // États pour le filtrage des secteurs
    const [sectorFilter, setSectorFilter] = useState<'ALL' | 'SELECTED'>('ALL');
    const [selectedSectorIds, setSelectedSectorIds] = useState<Set<number>>(new Set());
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    // Clé unique pour le stockage des préférences de filtrage par trameModele
    const filterStorageKey = `trameModele-filters-${trameModele.id}`;

    // Charger les préférences de filtrage depuis localStorage au montage du composant
    useEffect(() => {
        const savedFilters = localStorage.getItem(filterStorageKey);
        if (savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                if (parsed.sectorFilter) setSectorFilter(parsed.sectorFilter);
                if (parsed.selectedSectorIds) setSelectedSectorIds(new Set(parsed.selectedSectorIds));
                if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter);
                if (parsed.showPersonnel !== undefined) setShowPersonnel(parsed.showPersonnel);
                if (parsed.compactView !== undefined) setCompactView(parsed.compactView);
                logger.info(`Préférences de filtrage chargées pour la trameModele ${trameModele.id}:`, parsed);
            } catch (error: unknown) {
                logger.error('Erreur lors du chargement des préférences de filtrage:', { error: error });
            }
        }
    }, [trameModele.id, filterStorageKey]);

    // Sauvegarder les préférences de filtrage dans localStorage à chaque changement
    useEffect(() => {
        const filtersToSave = {
            sectorFilter,
            selectedSectorIds: Array.from(selectedSectorIds),
            categoryFilter,
            showPersonnel,
            compactView
        };

        localStorage.setItem(filterStorageKey, JSON.stringify(filtersToSave));
        logger.info(`Préférences de filtrage sauvegardées pour la trameModele ${trameModele.id}:`, filtersToSave);
    }, [sectorFilter, selectedSectorIds, categoryFilter, showPersonnel, compactView, trameModele.id, filterStorageKey]);

    // Utiliser les vraies salles ou les mockées si vides
    const actualRooms = useMemo(() => {
        return rooms && rooms.length > 0 ? rooms : mockRooms;
    }, [rooms]);

    // Créer un objet de secteurs facile à utiliser avec les salles
    const sectorsMap = useMemo(() => {
        if (sectors && sectors.length > 0) {
            return sectors.reduce((acc: unknown, sector: unknown) => {
                acc[sector.id] = {
                    ...sector,
                    color: sector.colorCode ? `bg-[${sector.colorCode}]` : 'bg-gray-100',
                };
                return acc;
            }, {});
        }
        return mockSectors;
    }, [sectors]);

    // Fonction pour détecter intelligemment le secteur d'une salle
    const detectRoomSector = useCallback((room: unknown) => {
        // Si la salle a déjà un operatingSectorId valide, l'utiliser
        if (room.operatingSectorId && sectorsMap[room.operatingSectorId]) {
            return room.operatingSectorId;
        }

        // Sinon, essayer de détecter le secteur par le nom
        const roomNameLower = room.name.toLowerCase();

        // Détection intelligente basée sur le nom de la salle
        for (const sector of sectors) {
            const sectorNameLower = sector.name.toLowerCase();

            // Détection par type de salle (plus spécifique d'abord)
            if (roomNameLower.includes('garde') || roomNameLower.includes('astreinte')) {
                if (sectorNameLower.includes('garde') || sectorNameLower.includes('astreinte')) {
                    logger.info(`[SMART_DETECTION] Salle "${room.name}" assignée au secteur "${sector.name}" par type garde/astreinte`);
                    return sector.id;
                }
            }

            if (roomNameLower.includes('consultation') || roomNameLower.includes('cs')) {
                if (sectorNameLower.includes('consultation') || sectorNameLower.includes('cs')) {
                    logger.info(`[SMART_DETECTION] Salle "${room.name}" assignée au secteur "${sector.name}" par type consultation`);
                    return sector.id;
                }
            }

            // Correspondance exacte du nom de secteur dans le nom de la salle (plus générale)
            const normalizedSectorName = sectorNameLower.replace(/[^a-z0-9]/gi, '').toLowerCase();
            const normalizedRoomName = roomNameLower.replace(/[^a-z0-9]/gi, '').toLowerCase();
            if (normalizedRoomName.includes(normalizedSectorName) && normalizedSectorName.length > 3) {
                logger.info(`[SMART_DETECTION] Salle "${room.name}" assignée au secteur "${sector.name}" par correspondance de nom`);
                return sector.id;
            }
        }

        // Si aucune correspondance trouvée, retourner l'operatingSectorId original (peut être null)
        logger.info(`[SMART_DETECTION] Aucun secteur trouvé pour la salle "${room.name}" (operatingSectorId: ${room.operatingSectorId})`);
        return room.operatingSectorId;
    }, [sectorsMap, sectors]);

    // Enrichir les salles avec la détection intelligente de secteur
    const enrichedRooms = useMemo(() => {
        return actualRooms.map(room => {
            const detectedSectorId = detectRoomSector(room);
            return {
                ...room,
                operatingSectorId: detectedSectorId
            };
        });
    }, [actualRooms, detectRoomSector]);

    // Trier les salles par secteur et par ordre dans chaque secteur
    const sortedRooms = useMemo(() => {
        if (!enrichedRooms.length) return [];

        // Journalisation pour le débogage
        logger.info("Secteurs disponibles:", sectors);
        logger.info("Salles enrichies:", enrichedRooms);

        // Créer une map des secteurs avec leur displayOrder comme clé de tri
        const sectorOrderMap = new Map();
        if (sectors && sectors.length > 0) {
            // Trier d'abord les secteurs par displayOrder
            const sortedSectors = [...sectors].sort((a, b) => {
                // Utiliser displayOrder s'il existe, sinon utiliser l'ID comme critère secondaire
                const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder : 999;
                const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder : 999;

                if (orderA !== orderB) return orderA - orderB;

                // Si les displayOrder sont identiques, trier par ID pour un ordre stable (IDs numériques)
                return a.id - b.id;
            });

            // Journalisation pour le débogage
            logger.info("Secteurs triés:", sortedSectors.map(s => ({ id: s.id, name: s.name, order: s.displayOrder })));

            // Utiliser l'index du secteur trié comme ordre de tri
            sortedSectors.forEach((sector, index) => {
                sectorOrderMap.set(sector.id, index);
            });
        }

        // Trier les salles en utilisant l'ordre des secteurs et l'ordre des salles dans chaque secteur
        return [...enrichedRooms].sort((a, b) => {
            // D'abord comparer les secteurs selon l'ordre défini précédemment
            const sectorOrderA = sectorOrderMap.get(a.operatingSectorId);
            const sectorOrderB = sectorOrderMap.get(b.operatingSectorId);

            // Journalisation pour le débogage des salles spécifiques
            if (a.name.includes("Garde") || b.name.includes("Garde")) {
                logger.info(`[SORT_DEBUG] Comparaison salles: ${a.name} (secteur: ${a.operatingSectorId}, ordre: ${sectorOrderA}) vs ${b.name} (secteur: ${b.operatingSectorId}, ordre: ${sectorOrderB})`);
            }

            // Si les deux salles ont un secteur défini, comparer leur ordre de secteur
            if (sectorOrderA !== undefined && sectorOrderB !== undefined) {
                if (sectorOrderA !== sectorOrderB) {
                    return sectorOrderA - sectorOrderB;
                }
            } else if (sectorOrderA !== undefined) {
                return -1; // a a un secteur, b n'en a pas
            } else if (sectorOrderB !== undefined) {
                return 1;  // b a un secteur, a n'en a pas
            }

            // Pour les salles du même secteur, utiliser displayOrder, puis number, puis name
            const roomOrderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder :
                (a.number ? parseInt(a.number, 10) : 999);
            const roomOrderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder :
                (b.number ? parseInt(b.number, 10) : 999);

            if (roomOrderA !== roomOrderB) {
                return roomOrderA - roomOrderB;
            }

            // Si tout le reste est égal, trier par nom
            return a.name.localeCompare(b.name);
        });
    }, [enrichedRooms, sectors]);

    // Créer des "salles virtuelles" pour les secteurs spéciaux (consultations, gardes, astreintes)
    // qui n'ont pas de salles physiques associées
    const roomsWithVirtualRooms = useMemo(() => {
        if (!sectors || sectors.length === 0) return sortedRooms;

        // Créer un Set des secteurs qui ont déjà des salles
        const sectorsWithRooms = new Set(sortedRooms.map(room => room.operatingSectorId));

        // Trouver les secteurs qui n'ont pas de salles (peu importe leur catégorie)
        const sectorsWithoutRooms = sectors.filter(sector =>
            !sectorsWithRooms.has(sector.id) && sector.isActive
        );

        // Créer des salles virtuelles pour ces secteurs
        const virtualRooms = sectorsWithoutRooms.map(sector => ({
            id: `virtual-${sector.id}`,
            name: sector.name,
            operatingSectorId: sector.id,
            isActive: sector.isActive,
            displayOrder: sector.displayOrder,
            isVirtual: true // Marquer comme virtuelle pour pouvoir la distinguer
        }));

        // Journalisation pour le débogage
        logger.info("Salles virtuelles créées:", virtualRooms);

        // Créer une map des secteurs avec leur displayOrder comme clé de tri
        const sectorOrderMap = new Map();
        if (sectors && sectors.length > 0) {
            // Trier d'abord les secteurs par displayOrder
            const sortedSectors = [...sectors].sort((a, b) => {
                // Utiliser displayOrder s'il existe, sinon utiliser l'ID comme critère secondaire
                const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder : 999;
                const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder : 999;

                if (orderA !== orderB) return orderA - orderB;

                // Si les displayOrder sont identiques, trier par ID pour un ordre stable (IDs numériques)
                return a.id - b.id;
            });

            // Utiliser l'index du secteur trié comme ordre de tri
            sortedSectors.forEach((sector, index) => {
                sectorOrderMap.set(sector.id, index);
            });
        }

        // Combiner et trier à nouveau en utilisant la même logique que pour sortedRooms
        return [...sortedRooms, ...virtualRooms].sort((a, b) => {
            // D'abord comparer les secteurs selon l'ordre défini
            const sectorOrderA = sectorOrderMap.get(a.operatingSectorId);
            const sectorOrderB = sectorOrderMap.get(b.operatingSectorId);

            // Si les deux salles ont un secteur défini, comparer leur ordre de secteur
            if (sectorOrderA !== undefined && sectorOrderB !== undefined) {
                if (sectorOrderA !== sectorOrderB) {
                    return sectorOrderA - sectorOrderB;
                }
            } else if (sectorOrderA !== undefined) {
                return -1; // a a un secteur, b n'en a pas
            } else if (sectorOrderB !== undefined) {
                return 1;  // b a un secteur, a n'en a pas
            }

            // Pour les salles du même secteur, utiliser displayOrder, puis number, puis name
            const roomOrderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder :
                (a.number ? parseInt(a.number, 10) : 999);
            const roomOrderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder :
                (b.number ? parseInt(b.number, 10) : 999);

            if (roomOrderA !== roomOrderB) {
                return roomOrderA - roomOrderB;
            }

            // Si tout le reste est égal, trier par nom
            return a.name.localeCompare(b.name);
        });
    }, [sortedRooms, sectors]);

    // Filtrer les salles selon les critères de filtrage
    const filteredRooms = useMemo(() => {
        let filtered = roomsWithVirtualRooms;

        // Filtrage par secteur
        if (sectorFilter === 'SELECTED' && selectedSectorIds.size > 0) {
            filtered = filtered.filter(room =>
                selectedSectorIds.has(room.operatingSectorId) ||
                selectedSectorIds.has(room.sectorId) // Support pour les deux formats d'ID
            );
        }

        // Filtrage par catégorie de secteur
        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(room => {
                const sector = sectorsMap[room.operatingSectorId] || sectorsMap[room.sectorId];
                if (!sector) return false;

                // Mappage des catégories de filtre aux catégories de secteur
                switch (categoryFilter) {
                    case 'BLOC':
                        return !sector.category ||
                            sector.category === 'STANDARD' ||
                            sector.category === 'HYPERASEPTIQUE' ||
                            sector.category === 'OPHTALMOLOGIE' ||
                            sector.category === 'ENDOSCOPIE';
                    case 'CONSULTATION':
                        return sector.category === 'CONSULTATION' ||
                            room.name.toLowerCase().includes('consultation') ||
                            room.name.toLowerCase().includes('cs ');
                    case 'GARDE_ASTREINTE':
                        return room.name.toLowerCase().includes('garde') ||
                            room.name.toLowerCase().includes('astreinte');
                    default:
                        return true;
                }
            });
        }

        logger.info(`Salles filtrées: ${filtered.length}/${roomsWithVirtualRooms.length} salles affichées`);
        return filtered;
    }, [roomsWithVirtualRooms, sectorFilter, selectedSectorIds, categoryFilter, sectorsMap]);

    // Calculer si des filtres personnalisés sont actifs
    const hasActiveFilters = useMemo(() => {
        return categoryFilter !== 'ALL' ||
            (sectorFilter === 'SELECTED' && selectedSectorIds.size > 0) ||
            !showPersonnel ||
            compactView;
    }, [categoryFilter, sectorFilter, selectedSectorIds.size, showPersonnel, compactView]);

    // Jours de la semaine pour l'affichage
    const weekDays = useMemo(() => {
        // Valeur par défaut pour les jours actifs si non défini
        const activeDays = trameModele?.activeDays?.length ? trameModele.activeDays : [1, 2, 3, 4, 5]; // Par défaut lundi-vendredi

        return [
            { code: 1, name: 'Lundi' },
            { code: 2, name: 'Mardi' },
            { code: 3, name: 'Mercredi' },
            { code: 4, name: 'Jeudi' },
            { code: 5, name: 'Vendredi' },
            { code: 6, name: 'Samedi' },
            { code: 0, name: 'Dimanche' },
        ].filter(day => activeDays.includes(day.code));
    }, [trameModele?.activeDays]);

    // Filtrer les affectations en fonction du type de semaine sélectionné
    const filteredAffectations = useMemo(() => {
        // Vérifier si les affectations existent
        if (!trameModele.affectations || trameModele.affectations.length === 0) {
            logger.info("Aucune affectation trouvée dans la trameModele");
            return [];
        }

        logger.info("Affectations dans la trameModele:", trameModele.affectations);

        if (showWeekType === 'ALL') {
            return trameModele.affectations;
        }
        return trameModele.affectations.filter(
            affectation => !affectation.weekTypeOverride || affectation.weekTypeOverride === showWeekType
        );
    }, [trameModele.affectations, showWeekType]);

    // Fonction pour obtenir les affectations pour une salle et un jour spécifiques
    const getRoomDayAffectations = useCallback(
        (roomId: string, dayCode: number) => {
            const result = filteredAffectations.filter(
                affectation =>
                    affectation.roomId === roomId &&
                    (!affectation.dayOverride || affectation.dayOverride === dayCode)
            );

            // Retirer le log de débogage spécifique à la salle mockée
            return result;
        },
        [filteredAffectations]
    );

    // Fonction pour vérifier si une salle/jour a des affectations 24h
    const hasFullDayAffectations = useCallback(
        (roomId: string, dayCode: number) => {
            const affectations = getRoomDayAffectations(roomId, dayCode);
            return affectations.some(aff => {
                const activity = mockActivityTypes.find(a => a.id === aff.activityTypeId);
                return aff.period === 'FULL_DAY' || 
                       (activity && (activity.code === 'GARDE' || activity.code === 'ASTREINTE'));
            });
        },
        [getRoomDayAffectations, mockActivityTypes]
    );

    // Fonction pour vérifier si une salle est principalement pour des affectations 24h
    const isFullDayRoom = useCallback(
        (roomId: string) => {
            // Vérifier si c'est une salle virtuelle pour garde ou astreinte
            const room = roomsWithVirtualRooms.find(r => r.id === roomId);
            if (room && (room.name.toLowerCase().includes('garde') || room.name.toLowerCase().includes('astreinte'))) {
                return true;
            }
            return false;
        },
        [roomsWithVirtualRooms]
    );

    // Fonctions de gestion des filtres
    const handleToggleSector = useCallback((sectorId: number) => {
        setSelectedSectorIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectorId)) {
                newSet.delete(sectorId);
            } else {
                newSet.add(sectorId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAllSectors = useCallback(() => {
        const allSectorIds = new Set(sectors.map(sector => sector.id));
        setSelectedSectorIds(allSectorIds);
        setSectorFilter('ALL');
    }, [sectors]);

    const handleDeselectAllSectors = useCallback(() => {
        setSelectedSectorIds(new Set());
        setSectorFilter('SELECTED');
    }, []);

    const handleQuickFilter = useCallback((filterType: string) => {
        setCategoryFilter(filterType);
        setSectorFilter('ALL'); // Réinitialiser le filtre par secteur quand on utilise les filtres rapides
    }, []);

    const handleResetFilters = useCallback(() => {
        setSectorFilter('ALL');
        setSelectedSectorIds(new Set());
        setCategoryFilter('ALL');
        setShowPersonnel(true);
        setCompactView(false);
        // Supprimer les préférences sauvegardées
        localStorage.removeItem(filterStorageKey);
        logger.info(`Filtres réinitialisés pour la trameModele ${trameModele.id}`);
    }, [trameModele.id, filterStorageKey]);

    // Fonction pour éditer une affectation existante
    const handleEditAffectation = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            logger.info(`Édition de l'affectation ${affectationId}`);

            // Logique d'édition à implémenter plus tard
            // Par exemple, ouvrir une boîte de dialogue ou mettre à jour l'état
        },
        [readOnly]
    );

    // Fonction pour supprimer une affectation
    const handleDeleteAffectation = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            // Mise à jour de la trameModele sans l'affectation supprimée
            const updatedTrame = {
                ...trame,
                affectations: trameModele.affectations.filter(a => a.id !== affectationId)
            };

            setTrame(updatedTrame);

            // Notification de changement
            if (onTrameChange) {
                onTrameChange(updatedTrame);
            }

            logger.info(`Affectation ${affectationId} supprimée`);
        },
        [trameModele, readOnly, onTrameChange]
    );

    // Fonction pour basculer l'état actif/inactif d'une affectation
    const handleToggleAffectationActive = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            // Mise à jour de l'état actif de l'affectation
            const updatedTrame = {
                ...trame,
                affectations: trameModele.affectations.map(a =>
                    a.id === affectationId
                        ? { ...a, isActive: !a.isActive }
                        : a
                )
            };

            setTrame(updatedTrame);

            // Notification de changement
            if (onTrameChange) {
                onTrameChange(updatedTrame);
            }

            logger.info(`État actif de l'affectation ${affectationId} basculé`);
        },
        [trameModele, readOnly, onTrameChange]
    );

    // Fonction pour rendre l'affectation (MAR, CHIR, IADE)
    const renderAssignment = useCallback(
        (affectation: AffectationModele, period: DayPeriod) => {
            // Filtrer par période
            if (affectation.period !== period && affectation.period !== 'FULL_DAY') {
                return null;
            }

            // Différents styles en fonction du type d'activité et de la période
            const getCardStyle = () => {
                const activity = mockActivityTypes.find(a => a.id === affectation.activityTypeId);
                if (!affectation.isActive) return 'bg-red-100 border-red-300';

                // Style spécial pour les gardes et astreintes (24h)
                if (activity && (activity.code === 'GARDE' || activity.code === 'ASTREINTE')) {
                    return 'bg-purple-50 border-purple-300';
                }

                if (period === 'MORNING') return 'bg-blue-50 border-blue-200';
                if (period === 'AFTERNOON') return 'bg-amber-50 border-amber-200';
                if (period === 'FULL_DAY') return 'bg-indigo-50 border-indigo-300';
                return 'bg-indigo-50 border-indigo-200';
            };

            return (
                <Card
                    key={`${affectation.id}-${period}`}
                    className={`mb-1 shadow-sm ${getCardStyle()} ${compactView ? 'p-1 text-xs' : 'p-1'}`}
                >
                    <CardContent className="p-1">
                        {/* Entête de l'affectation */}
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-xs truncate">
                                {mockActivityTypes.find(a => a.id === affectation.activityTypeId)?.code || "ACT"}
                            </span>
                            <div className="flex items-center flex-shrink-0">
                                {!affectation.isActive && (
                                    <Badge variant="destructive" className="text-xs mr-1">×</Badge>
                                )}

                                {!readOnly && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-4 w-4">
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditAffectation(affectation.id)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleAffectationActive(affectation.id)}>
                                                <MessageSquareX className="mr-2 h-4 w-4" />
                                                {affectation.isActive ? 'Fermer' : 'Ouvrir'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteAffectation(affectation.id)}
                                                className="text-red-600"
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Personnel requis - Version compacte */}
                        {showPersonnel && affectation.requiredStaff.length > 0 && (
                            <div className="mt-1">
                                <div className="flex flex-wrap gap-1">
                                    {affectation.requiredStaff.map(staff => {
                                        const assignedUser = staff.userId
                                            ? mockUsers.find(u => u.id === staff.userId)
                                            : null;

                                        // Couleurs selon le rôle
                                        let bgColor = 'bg-gray-100';
                                        let textColor = 'text-gray-800';

                                        switch (staff.role) {
                                            case 'MAR':
                                                bgColor = 'bg-blue-100';
                                                textColor = 'text-blue-800';
                                                break;
                                            case 'SURGEON':
                                                bgColor = 'bg-indigo-100';
                                                textColor = 'text-indigo-800';
                                                break;
                                            case 'IADE':
                                                bgColor = 'bg-emerald-100';
                                                textColor = 'text-emerald-800';
                                                break;
                                            case 'IBODE':
                                                bgColor = 'bg-amber-100';
                                                textColor = 'text-amber-800';
                                                break;
                                        }

                                        return (
                                            <div
                                                key={staff.id}
                                                className={`${bgColor} ${textColor} rounded px-1 py-0.5 text-xs font-medium flex items-center`}
                                                title={assignedUser ? `${assignedUser.name} (${staff.role})` : `Poste ${staff.role} non assigné`}
                                            >
                                                {staff.role}
                                                {staff.count > 1 && <span className="ml-1">×{staff.count}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        },
        [compactView, showPersonnel, readOnly, handleEditAffectation, handleDeleteAffectation, handleToggleAffectationActive]
    );

    // Gestion du drag and drop
    const handleDragEnd = useCallback(
        (result: unknown) => {
            const { source, destination, draggableId } = result;

            // Abandon si pas de destination
            if (!destination) return;

            // Ici on implémenterait la logique pour déplacer une affectation
            logger.info('Affectation déplacée:', { source, destination, draggableId });

            // Mise à jour du state
            // ...
        },
        []
    );

    // Fonction pour ouvrir le modal de configuration d'affectation
    const handleAddAffectation = useCallback(
        (roomId: string, dayCode: number, period: DayPeriod) => {
            if (readOnly) return;

            // Trouver les informations de la salle et du jour pour l'affichage
            const room = roomsWithVirtualRooms.find(r => r.id === roomId);
            const day = weekDays.find(d => d.code === dayCode);

            setModalConfig({
                roomId,
                dayCode,
                period,
                roomName: room?.name || 'Salle',
                dayName: day?.name || 'Jour'
            });
            setIsAffectationModalOpen(true);

            logger.info(`Ouverture du modal de configuration pour ${roomId}, jour ${dayCode}, période ${period}`);
        },
        [readOnly, roomsWithVirtualRooms, weekDays]
    );

    // Fonction pour sauvegarder une nouvelle affectation configurée
    const handleSaveAffectation = useCallback(
        (affectationData: Partial<AffectationModele>) => {
            if (readOnly) return;

            // Créer l'affectation complète
            const newAffectation: AffectationModele = {
                ...affectationData,
                id: affectationData.id || `new-${Date.now()}`,
                trameId: trameModele.id,
                isActive: affectationData.isActive !== undefined ? affectationData.isActive : true,
            } as AffectationModele;

            // Mise à jour de la trameModele
            const updatedTrame = {
                ...trameModele,
                affectations: [...trameModele.affectations, newAffectation]
            };

            // Notification de changement
            if (onTrameChange) {
                onTrameChange(updatedTrame);
            }

            logger.info(`Nouvelle affectation sauvegardée:`, newAffectation);
        },
        [trameModele, readOnly, onTrameChange]
    );

    // Fonction pour obtenir le nom du site
    const getSiteName = useCallback(() => {
        if (trameModele.siteId) {
            // TrameModele liée à un site spécifique
            const site = sites.find(s => s.id === trameModele.siteId);
            return site ? site.name : `Site ${trameModele.siteId}`;
        } else if (selectedSiteId) {
            // TrameModele globale avec un site sélectionné
            const site = sites.find(s => s.id === selectedSiteId);
            return site ? `${site.name} (vue filtrée)` : `Site ${selectedSiteId} (vue filtrée)`;
        } else {
            // TrameModele globale, tous les sites
            return 'Tous les sites (globale)';
        }
    }, [trameModele.siteId, selectedSiteId, sites]);

    // Rendu de la grille de trameModele
    const renderTrameGrid = () => {
        // Si aucune salle n'est disponible, afficher un message
        if (filteredRooms.length === 0) {
            if (roomsWithVirtualRooms.length === 0) {
                return (
                    <div className="py-6 text-center bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Aucune salle d'opération n'a été configurée pour ce site.</p>
                        <p className="text-xs text-gray-400 mt-1">Veuillez créer des secteurs et des salles dans la configuration.</p>
                    </div>
                );
            } else {
                return (
                    <div className="py-6 text-center bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Aucune salle ne correspond aux filtres sélectionnés.</p>
                        <p className="text-xs text-gray-400 mt-1">Modifiez les filtres pour voir plus de salles.</p>
                    </div>
                );
            }
        }

        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className={`mt-3 ${compactView ? 'text-xs' : 'text-sm'}`}>
                    {/* Version mobile : cartes empilées */}
                    <div className="block lg:hidden space-y-4">
                        {filteredRooms.map(room => (
                            <div key={room.id} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                                {/* En-tête de la salle */}
                                <div
                                    className="p-3 border-b"
                                    style={{
                                        backgroundColor: sectorsMap[room.operatingSectorId]?.colorCode || sectorsMap[room.sectorId]?.colorCode || '#f3f4f6'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">{room.name}</span>
                                            {room.isVirtual && (
                                                <Badge variant="outline" className="text-xs">
                                                    {room.name.toLowerCase().includes('consultation') ? 'Consult' :
                                                        room.name.toLowerCase().includes('garde') ? 'Garde' :
                                                            room.name.toLowerCase().includes('astreinte') ? 'Astrte' : 'Virt'}
                                                </Badge>
                                            )}
                                        </div>
                                        {room.isVirtual && !readOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                                title="Créer une vraie salle"
                                                onClick={() => {
                                                    window.open(`/admin/bloc-operatoire/salles?sectorId=${room.operatingSectorId}`, '_blank');
                                                }}
                                            >
                                                <PlusIcon className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {sectorsMap[room.operatingSectorId]?.name || sectorsMap[room.sectorId]?.name || 'Secteur non défini'}
                                    </div>
                                </div>

                                {/* Grille des jours pour mobile */}
                                <div className="p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {weekDays.map(day => {
                                            const isFullDay = isFullDayRoom(room.id) || hasFullDayAffectations(room.id, day.code);
                                            
                                            return (
                                                <div key={day.code} className="border rounded-lg p-2">
                                                    <div className="font-medium text-sm mb-2 text-center">{day.name}</div>
                                                    <div className="space-y-2">
                                                        {isFullDay ? (
                                                            // Affichage 24h mobile
                                                            <div className="bg-indigo-50 rounded p-2">
                                                                <div className="text-xs font-medium mb-1 text-indigo-700">24 heures</div>
                                                                <Droppable
                                                                    droppableId={`${room.id}-${day.code}-fullday-mobile`}
                                                                    isDropDisabled={false}
                                                                    isCombineEnabled={false}
                                                                    ignoreContainerClipping={false}
                                                                >
                                                                    {(provided) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.droppableProps}
                                                                            className="min-h-[40px]"
                                                                        >
                                                                            {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                                <Draggable
                                                                                    key={`${affectation.id}-fullday-mobile`}
                                                                                    draggableId={`${affectation.id}-fullday-mobile`}
                                                                                    index={index}
                                                                                    isDragDisabled={readOnly}
                                                                                >
                                                                                    {(provided) => (
                                                                                        <div
                                                                                            ref={provided.innerRef}
                                                                                            {...provided.draggableProps}
                                                                                            {...provided.dragHandleProps}
                                                                                        >
                                                                                            {renderAssignment(affectation, 'FULL_DAY')}
                                                                                        </div>
                                                                                    )}
                                                                                </Draggable>
                                                                            ))}
                                                                            {provided.placeholder}
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="w-full mt-1 text-xs h-6 border border-dashed border-indigo-300 text-indigo-600"
                                                                                    onClick={() => handleAddAffectation(room.id.toString(), day.code, 'FULL_DAY')}
                                                                                >
                                                                                    + Ajouter 24h
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Droppable>
                                                            </div>
                                                        ) : (
                                                            // Affichage AM/PM mobile
                                                            <>
                                                                {/* Matin */}
                                                                <div className="bg-blue-50 rounded p-2">
                                                                    <div className="text-xs font-medium mb-1 text-blue-700">Matin</div>
                                                                    <Droppable
                                                                        droppableId={`${room.id}-${day.code}-morning`}
                                                                        isDropDisabled={false}
                                                                        isCombineEnabled={false}
                                                                        ignoreContainerClipping={false}
                                                                    >
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.droppableProps}
                                                                                className="min-h-[40px]"
                                                                            >
                                                                                {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                                    <Draggable
                                                                                        key={`${affectation.id}-morning`}
                                                                                        draggableId={`${affectation.id}-morning`}
                                                                                        index={index}
                                                                                        isDragDisabled={readOnly}
                                                                                    >
                                                                                        {(provided) => (
                                                                                            <div
                                                                                                ref={provided.innerRef}
                                                                                                {...provided.draggableProps}
                                                                                                {...provided.dragHandleProps}
                                                                                            >
                                                                                                {renderAssignment(affectation, 'MORNING')}
                                                                                            </div>
                                                                                        )}
                                                                                    </Draggable>
                                                                                ))}
                                                                                {provided.placeholder}
                                                                                {!readOnly && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="w-full mt-1 text-xs h-6 border border-dashed border-gray-300 text-gray-500"
                                                                                        onClick={() => handleAddAffectation(room.id.toString(), day.code, 'MORNING')}
                                                                                    >
                                                                                        + Ajouter
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </Droppable>
                                                                </div>

                                                                {/* Après-midi */}
                                                                <div className="bg-amber-50 rounded p-2">
                                                                    <div className="text-xs font-medium mb-1 text-amber-700">Après-midi</div>
                                                                    <Droppable
                                                                        droppableId={`${room.id}-${day.code}-afternoon`}
                                                                        isDropDisabled={false}
                                                                        isCombineEnabled={false}
                                                                        ignoreContainerClipping={false}
                                                                    >
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.droppableProps}
                                                                                className="min-h-[40px]"
                                                                            >
                                                                                {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                                    <Draggable
                                                                                        key={`${affectation.id}-afternoon`}
                                                                                        draggableId={`${affectation.id}-afternoon`}
                                                                                        index={index}
                                                                                        isDragDisabled={readOnly}
                                                                                    >
                                                                                        {(provided) => (
                                                                                            <div
                                                                                                ref={provided.innerRef}
                                                                                                {...provided.draggableProps}
                                                                                                {...provided.dragHandleProps}
                                                                                            >
                                                                                                {renderAssignment(affectation, 'AFTERNOON')}
                                                                                            </div>
                                                                                        )}
                                                                                    </Draggable>
                                                                                ))}
                                                                                {provided.placeholder}
                                                                                {!readOnly && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="w-full mt-1 text-xs h-6 border border-dashed border-gray-300 text-gray-500"
                                                                                        onClick={() => handleAddAffectation(room.id.toString(), day.code, 'AFTERNOON')}
                                                                                    >
                                                                                        + Ajouter
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </Droppable>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Version desktop : grille vraiment responsive */}
                    <div className="hidden lg:block">
                        {/* En-têtes des jours */}
                        <div
                            className="grid gap-1 mb-2"
                            style={{
                                gridTemplateColumns: `minmax(160px, 200px) repeat(${weekDays.length}, 1fr)`
                            }}
                        >
                            {/* Colonne des salles */}
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded">
                                <div className="font-medium text-sm">Salles ({filteredRooms.length})</div>
                            </div>

                            {/* Colonnes des jours */}
                            {weekDays.map(day => (
                                <div
                                    key={day.code}
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded text-center"
                                >
                                    <div className="font-medium text-sm">{compactView ? day.name.slice(0, 3) : day.name}</div>
                                    <div className="flex justify-center mt-1 gap-1">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">AM</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">PM</span>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded">24h</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Corps de la grille */}
                        <div className="space-y-1">
                            {filteredRooms.map(room => (
                                <div
                                    key={room.id}
                                    className="grid gap-1"
                                    style={{
                                        gridTemplateColumns: `minmax(160px, 200px) repeat(${weekDays.length}, 1fr)`
                                    }}
                                >
                                    {/* Colonne salle */}
                                    <div
                                        className={`border border-gray-300 dark:border-gray-700 p-2 font-medium ${room.isVirtual ? 'border-dashed bg-opacity-60' : ''} rounded`}
                                        style={{
                                            backgroundColor: sectorsMap[room.operatingSectorId]?.colorCode || sectorsMap[room.sectorId]?.colorCode || '#f3f4f6'
                                        }}
                                    >
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1">
                                                    <span className={compactView ? 'text-xs font-medium truncate' : 'text-sm font-medium truncate'}>{room.name}</span>
                                                    {room.isVirtual && (
                                                        <Badge variant="outline" className="text-xs px-1 py-0 ml-1 flex-shrink-0">
                                                            {room.name.toLowerCase().includes('consultation') ? 'C' :
                                                                room.name.toLowerCase().includes('garde') ? 'G' :
                                                                    room.name.toLowerCase().includes('astreinte') ? 'A' : 'V'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {room.isVirtual && !readOnly && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 flex-shrink-0"
                                                        title="Créer une vraie salle"
                                                        onClick={() => {
                                                            window.open(`/admin/bloc-operatoire/salles?sectorId=${room.operatingSectorId}`, '_blank');
                                                        }}
                                                    >
                                                        <PlusIcon className="h-2 w-2" />
                                                    </Button>
                                                )}
                                            </div>
                                            {!compactView && (
                                                <div className="text-xs text-gray-500 truncate">
                                                    {sectorsMap[room.operatingSectorId]?.name || sectorsMap[room.sectorId]?.name || 'Secteur non défini'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Colonnes des jours */}
                                    {weekDays.map(day => {
                                        const isFullDay = isFullDayRoom(room.id) || hasFullDayAffectations(room.id, day.code);
                                        
                                        return (
                                            <div key={`${room.id}-${day.code}`} className="border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                                                {isFullDay ? (
                                                    // Affichage 24h (colonne unique)
                                                    <div className="bg-indigo-50 p-1 h-full">
                                                        <Droppable
                                                            droppableId={`${room.id}-${day.code}-fullday`}
                                                            isDropDisabled={false}
                                                            isCombineEnabled={false}
                                                            ignoreContainerClipping={false}
                                                        >
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className="min-h-[60px]"
                                                                >
                                                                    {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                        <Draggable
                                                                            key={`${affectation.id}-fullday`}
                                                                            draggableId={`${affectation.id}-fullday`}
                                                                            index={index}
                                                                            isDragDisabled={readOnly}
                                                                        >
                                                                            {(provided) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                >
                                                                                    {renderAssignment(affectation, 'FULL_DAY')}
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                    {!readOnly && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="w-full mt-1 text-xs h-5 border border-dashed border-indigo-300 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                                                            onClick={() => handleAddAffectation(room.id.toString(), day.code, 'FULL_DAY')}
                                                                        >
                                                                            + 24h
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                ) : (
                                                    // Affichage AM/PM (colonnes séparées)
                                                    <div className="grid grid-cols-2 h-full">
                                                        {/* Matin */}
                                                        <div className="bg-blue-50 border-r border-gray-200 p-1">
                                                            <Droppable
                                                                droppableId={`${room.id}-${day.code}-morning`}
                                                                isDropDisabled={false}
                                                                isCombineEnabled={false}
                                                                ignoreContainerClipping={false}
                                                            >
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className="min-h-[60px]"
                                                                    >
                                                                        {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                            <Draggable
                                                                                key={`${affectation.id}-morning`}
                                                                                draggableId={`${affectation.id}-morning`}
                                                                                index={index}
                                                                                isDragDisabled={readOnly}
                                                                            >
                                                                                {(provided) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        {...provided.dragHandleProps}
                                                                                    >
                                                                                        {renderAssignment(affectation, 'MORNING')}
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {provided.placeholder}
                                                                        {!readOnly && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="w-full mt-1 text-xs h-5 border border-dashed border-gray-300 text-gray-500"
                                                                                onClick={() => handleAddAffectation(room.id.toString(), day.code, 'MORNING')}
                                                                            >
                                                                                +
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </div>

                                                        {/* Après-midi */}
                                                        <div className="bg-amber-50 p-1">
                                                            <Droppable
                                                                droppableId={`${room.id}-${day.code}-afternoon`}
                                                                isDropDisabled={false}
                                                                isCombineEnabled={false}
                                                                ignoreContainerClipping={false}
                                                            >
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className="min-h-[60px]"
                                                                    >
                                                                        {getRoomDayAffectations(room.id, day.code).map((affectation, index) => (
                                                                            <Draggable
                                                                                key={`${affectation.id}-afternoon`}
                                                                                draggableId={`${affectation.id}-afternoon`}
                                                                                index={index}
                                                                                isDragDisabled={readOnly}
                                                                            >
                                                                                {(provided) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        {...provided.dragHandleProps}
                                                                                    >
                                                                                        {renderAssignment(affectation, 'AFTERNOON')}
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {provided.placeholder}
                                                                        {!readOnly && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="w-full mt-1 text-xs h-5 border border-dashed border-gray-300 text-gray-500"
                                                                                onClick={() => handleAddAffectation(room.id.toString(), day.code, 'AFTERNOON')}
                                                                            >
                                                                                +
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DragDropContext>
        );
    };

    // Rendu principal du composant
    return (
        <div className="space-y-4">
            {/* En-tête de la trameModele */}
            <div className={`mb-3 p-3 rounded-lg border ${compactView ? 'bg-gray-50' : 'bg-white'} dark:bg-gray-800`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${compactView ? 'text-base' : 'text-lg'}`}>{trameModele.name}</span>
                        <Badge variant="outline" className="text-xs">
                            {trameModele.weekType === 'ALL' ? 'Toutes' :
                                trameModele.weekType === 'EVEN' ? 'Paires' : 'Impaires'}
                        </Badge>

                        {/* Indicateur de site - Nouveau */}
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                            <MapPinIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{getSiteName()}</span>
                        </div>
                    </div>

                    {/* Informations supplémentaires sur la trameModele */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {trameModele.description && !compactView && (
                            <span className="italic">"{trameModele.description}"</span>
                        )}
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>
                                {trameModele.effectiveStartDate && !isNaN(new Date(trameModele.effectiveStartDate).getTime()) ? (
                                    <>
                                        {format(new Date(trameModele.effectiveStartDate), 'dd/MM/yy', { locale: fr })}
                                        {trameModele.effectiveEndDate && !isNaN(new Date(trameModele.effectiveEndDate).getTime())
                                            ? ` - ${format(new Date(trameModele.effectiveEndDate), 'dd/MM/yy', { locale: fr })}`
                                            : ' (perm.)'
                                        }
                                    </>
                                ) : (
                                    'Dates non définies'
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <UsersIcon className="h-3 w-3" />
                            <span>{filteredAffectations.length} affectation{filteredAffectations.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contrôles compacts */}
            <div className="flex flex-col space-y-3 mb-3">
                {/* Première ligne : contrôles principaux */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="filter-week-type" className="text-xs font-medium">Type:</Label>
                            <Select
                                value={showWeekType}
                                onValueChange={(value) => setShowWeekType(value as WeekType | 'ALL')}
                            >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue placeholder="Type semaine" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Toutes</SelectItem>
                                    <SelectItem value="EVEN">Paires</SelectItem>
                                    <SelectItem value="ODD">Impaires</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Label htmlFor="show-personnel" className="text-xs font-medium">Personnel</Label>
                            <Switch
                                id="show-personnel"
                                checked={showPersonnel}
                                onCheckedChange={() => setShowPersonnel(!showPersonnel)}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Label htmlFor="compact-view" className="text-xs font-medium">Compact</Label>
                            <Switch
                                id="compact-view"
                                checked={compactView}
                                onCheckedChange={() => setCompactView(!compactView)}
                            />
                        </div>
                    </div>

                    {/* Indicateur de compteur - responsive */}
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded sm:ml-auto">
                        {filteredRooms.length} / {roomsWithVirtualRooms.length} salles
                    </div>
                </div>
            </div>

            {/* Section de filtrage des secteurs - version compacte et responsive */}
            <div className={`rounded-lg ${compactView ? 'p-2 mb-2' : 'p-3 mb-3'} ${hasActiveFilters ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex flex-col gap-2">
                    {/* En-tête compact */}
                    {hasActiveFilters && (
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                                Filtres actifs
                            </Badge>
                            {!compactView && (
                                <span className="text-xs text-gray-500 italic hidden sm:block">
                                    Préférences sauvegardées
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message d'aide pour la première utilisation - version compacte */}
                    {!hasActiveFilters && !compactView && (
                        <span className="text-xs text-gray-500 italic hidden sm:block">
                            💡 Préférences sauvegardées automatiquement
                        </span>
                    )}

                    {/* Filtres rapides */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label className="text-xs font-medium">Filtres:</Label>
                        <div className="flex flex-wrap gap-1">
                            <Button
                                variant={categoryFilter === 'ALL' ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQuickFilter('ALL')}
                                className="h-7 px-2 text-xs"
                            >
                                Tous
                            </Button>
                            <Button
                                variant={categoryFilter === 'BLOC' ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQuickFilter('BLOC')}
                                className="h-7 px-2 text-xs"
                            >
                                Bloc
                            </Button>
                            <Button
                                variant={categoryFilter === 'CONSULTATION' ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQuickFilter('CONSULTATION')}
                                className="h-7 px-2 text-xs"
                            >
                                Consult
                            </Button>
                            <Button
                                variant={categoryFilter === 'GARDE_ASTREINTE' ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleQuickFilter('GARDE_ASTREINTE')}
                                className="h-7 px-2 text-xs"
                            >
                                Garde
                            </Button>
                        </div>
                    </div>

                    {/* Sélecteur de secteurs individuels */}
                    {sectors && sectors.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Label className="text-xs font-medium">Secteurs:</Label>
                            <div className="flex flex-wrap gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllSectors}
                                    className="h-7 px-2 text-xs"
                                >
                                    Tous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeselectAllSectors}
                                    className="h-7 px-2 text-xs"
                                >
                                    Aucun
                                </Button>
                                {sectors.map(sector => (
                                    <Button
                                        key={sector.id}
                                        variant={
                                            sectorFilter === 'ALL' || selectedSectorIds.has(sector.id)
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() => {
                                            handleToggleSector(sector.id);
                                            setSectorFilter('SELECTED');
                                        }}
                                        className="h-7 px-2 text-xs"
                                        style={{
                                            backgroundColor: (sectorFilter === 'ALL' || selectedSectorIds.has(sector.id))
                                                ? `${sector.colorCode}20`
                                                : undefined,
                                            borderColor: sector.colorCode,
                                            color: (sectorFilter === 'ALL' || selectedSectorIds.has(sector.id))
                                                ? sector.colorCode
                                                : undefined
                                        }}
                                    >
                                        {compactView ? sector.name.slice(0, 6) : sector.name.slice(0, 12)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bouton de réinitialisation */}
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-800 border-red-300 hover:border-red-400"
                            title="Réinitialiser tous les filtres et préférences"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grille de trameModele */}
            {renderTrameGrid()}

            {/* Modal de configuration des affectations */}
            {modalConfig && (
                <AffectationConfigModal
                    isOpen={isAffectationModalOpen}
                    onClose={() => {
                        setIsAffectationModalOpen(false);
                        setModalConfig(null);
                    }}
                    onSave={handleSaveAffectation}
                    roomId={modalConfig.roomId}
                    dayCode={modalConfig.dayCode}
                    period={modalConfig.period}
                    roomName={modalConfig.roomName}
                    dayName={modalConfig.dayName}
                    availableActivityTypes={mockActivityTypes}
                />
            )}
        </div>
    );
};

export default TrameGridView; 