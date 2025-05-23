'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, UsersIcon, ClockIcon, AlertTriangle, MoreVertical, Edit, Trash, MessageSquareX, PlusIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    trame?: TrameModele;
    readOnly?: boolean;
    onTrameChange?: (trame: TrameModele) => void;
    rooms?: any[];
    sectors?: any[];
}> = ({ trame: initialTrame, readOnly = false, onTrameChange, rooms = [], sectors = [] }) => {
    // État du composant
    const [trame, setTrame] = useState<TrameModele>(
        initialTrame || {
            id: 'new-trame',
            name: 'Nouvelle Trame',
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

    // Utiliser les vraies salles ou les mockées si vides
    const actualRooms = useMemo(() => {
        return rooms && rooms.length > 0 ? rooms : mockRooms;
    }, [rooms]);

    // Créer un objet de secteurs facile à utiliser avec les salles
    const sectorsMap = useMemo(() => {
        if (sectors && sectors.length > 0) {
            return sectors.reduce((acc: any, sector: any) => {
                acc[sector.id] = {
                    ...sector,
                    color: sector.colorCode ? `bg-[${sector.colorCode}]` : 'bg-gray-100',
                };
                return acc;
            }, {});
        }
        return mockSectors;
    }, [sectors]);

    // Trier les salles par secteur et par ordre dans chaque secteur
    const sortedRooms = useMemo(() => {
        if (!actualRooms.length) return [];

        // Journalisation pour le débogage
        console.log("Secteurs disponibles:", sectors);
        console.log("Salles disponibles:", actualRooms);

        // Créer une map des secteurs avec leur displayOrder comme clé de tri
        const sectorOrderMap = new Map();
        if (sectors && sectors.length > 0) {
            // Trier d'abord les secteurs par displayOrder
            const sortedSectors = [...sectors].sort((a, b) => {
                // Utiliser displayOrder s'il existe, sinon utiliser l'ID comme critère secondaire
                const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder : 999;
                const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder : 999;

                if (orderA !== orderB) return orderA - orderB;

                // Si les displayOrder sont identiques, trier par ID pour un ordre stable
                return a.id.localeCompare(b.id);
            });

            // Journalisation pour le débogage
            console.log("Secteurs triés:", sortedSectors.map(s => ({ id: s.id, name: s.name, order: s.displayOrder })));

            // Utiliser l'index du secteur trié comme ordre de tri
            sortedSectors.forEach((sector, index) => {
                sectorOrderMap.set(sector.id, index);
            });
        }

        // Trier les salles en utilisant l'ordre des secteurs et l'ordre des salles dans chaque secteur
        return [...actualRooms].sort((a, b) => {
            // D'abord comparer les secteurs selon l'ordre défini précédemment
            const sectorOrderA = sectorOrderMap.get(a.operatingSectorId);
            const sectorOrderB = sectorOrderMap.get(b.operatingSectorId);

            // Journalisation pour le débogage des salles spécifiques
            if (a.name.includes("Consultation") || b.name.includes("Consultation")) {
                console.log(`Comparaison salles: ${a.name} (ordre secteur: ${sectorOrderA}) vs ${b.name} (ordre secteur: ${sectorOrderB})`);
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
    }, [actualRooms, sectors]);

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
        console.log("Salles virtuelles créées:", virtualRooms);

        // Créer une map des secteurs avec leur displayOrder comme clé de tri
        const sectorOrderMap = new Map();
        if (sectors && sectors.length > 0) {
            // Trier d'abord les secteurs par displayOrder
            const sortedSectors = [...sectors].sort((a, b) => {
                // Utiliser displayOrder s'il existe, sinon utiliser l'ID comme critère secondaire
                const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? a.displayOrder : 999;
                const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? b.displayOrder : 999;

                if (orderA !== orderB) return orderA - orderB;

                // Si les displayOrder sont identiques, trier par ID pour un ordre stable
                return a.id.localeCompare(b.id);
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

    // Jours de la semaine pour l'affichage
    const weekDays = useMemo(() => {
        // Valeur par défaut pour les jours actifs si non défini
        const activeDays = trame?.activeDays?.length ? trame.activeDays : [1, 2, 3, 4, 5]; // Par défaut lundi-vendredi

        return [
            { code: 1, name: 'Lundi' },
            { code: 2, name: 'Mardi' },
            { code: 3, name: 'Mercredi' },
            { code: 4, name: 'Jeudi' },
            { code: 5, name: 'Vendredi' },
            { code: 6, name: 'Samedi' },
            { code: 0, name: 'Dimanche' },
        ].filter(day => activeDays.includes(day.code));
    }, [trame?.activeDays]);

    // Filtrer les affectations en fonction du type de semaine sélectionné
    const filteredAffectations = useMemo(() => {
        // Vérifier si les affectations existent
        if (!trame.affectations || trame.affectations.length === 0) {
            console.log("Aucune affectation trouvée dans la trame");
            return [];
        }

        console.log("Affectations dans la trame:", trame.affectations);

        if (showWeekType === 'ALL') {
            return trame.affectations;
        }
        return trame.affectations.filter(
            affectation => !affectation.weekTypeOverride || affectation.weekTypeOverride === showWeekType
        );
    }, [trame.affectations, showWeekType]);

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

    // Fonction pour éditer une affectation existante
    const handleEditAffectation = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            console.log(`Édition de l'affectation ${affectationId}`);

            // Logique d'édition à implémenter plus tard
            // Par exemple, ouvrir une boîte de dialogue ou mettre à jour l'état
        },
        [readOnly]
    );

    // Fonction pour supprimer une affectation
    const handleDeleteAffectation = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            // Mise à jour de la trame sans l'affectation supprimée
            const updatedTrame = {
                ...trame,
                affectations: trame.affectations.filter(a => a.id !== affectationId)
            };

            setTrame(updatedTrame);

            // Notification de changement
            if (onTrameChange) {
                onTrameChange(updatedTrame);
            }

            console.log(`Affectation ${affectationId} supprimée`);
        },
        [trame, readOnly, onTrameChange]
    );

    // Fonction pour basculer l'état actif/inactif d'une affectation
    const handleToggleAffectationActive = useCallback(
        (affectationId: string) => {
            if (readOnly) return;

            // Mise à jour de l'état actif de l'affectation
            const updatedTrame = {
                ...trame,
                affectations: trame.affectations.map(a =>
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

            console.log(`État actif de l'affectation ${affectationId} basculé`);
        },
        [trame, readOnly, onTrameChange]
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

                if (period === 'MORNING') return 'bg-blue-50 border-blue-200';
                if (period === 'AFTERNOON') return 'bg-amber-50 border-amber-200';
                return 'bg-indigo-50 border-indigo-200';
            };

            return (
                <Card
                    key={`${affectation.id}-${period}`}
                    className={`mb-1 shadow-sm ${getCardStyle()} ${compactView ? 'p-1 text-xs' : 'p-2'}`}
                >
                    <CardContent className="p-2">
                        {/* Entête de l'affectation */}
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                                {mockActivityTypes.find(a => a.id === affectation.activityTypeId)?.name || "Activité"}
                            </span>
                            <div className="flex items-center">
                                {!affectation.isActive && (
                                    <Badge variant="destructive" className="text-xs mr-1">Fermé</Badge>
                                )}

                                {!readOnly && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreVertical className="h-4 w-4" />
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

                        {/* Personnel requis */}

                        {/* Personnel requis - Version en ligne */}
                        {showPersonnel && (
                            <div className="mt-2">
                                <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <UsersIcon className="h-3 w-3 mr-1" />
                                    <span>Personnel requis ({affectation.requiredStaff.length} poste{affectation.requiredStaff.length > 1 ? 's' : ''})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {affectation.requiredStaff.map(staff => {
                                        const assignedUser = staff.userId
                                            ? mockUsers.find(u => u.id === staff.userId)
                                            : null;

                                        // Couleurs et icônes selon le rôle
                                        let bgColor = 'bg-gray-100';
                                        let textColor = 'text-gray-800';
                                        let icon = null;

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
                                                className={`${bgColor} ${textColor} rounded-full px-3 py-1 text-xs font-medium flex items-center`}
                                                title={assignedUser ? `${assignedUser.name} (${staff.role})` : `Poste ${staff.role} non assigné`}
                                            >
                                                <UsersIcon className="h-3 w-3 mr-1" />
                                                {staff.role}
                                                {staff.count > 1 && <span className="ml-1">×{staff.count}</span>}
                                                {assignedUser && (
                                                    <span className="ml-1 font-medium">: {assignedUser.name}</span>
                                                )}
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
        (result: any) => {
            const { source, destination, draggableId } = result;

            // Abandon si pas de destination
            if (!destination) return;

            // Ici on implémenterait la logique pour déplacer une affectation
            console.log('Affectation déplacée:', { source, destination, draggableId });

            // Mise à jour du state
            // ...
        },
        []
    );

    // Fonction pour ajouter une nouvelle affectation
    const handleAddAffectation = useCallback(
        (roomId: string, dayCode: number, period: DayPeriod) => {
            if (readOnly) return;

            // Déterminer le type d'activité approprié en fonction de la salle
            let defaultActivityType = mockActivityTypes[0].id; // Bloc opératoire par défaut

            // Si c'est une salle virtuelle, utiliser le type d'activité correspondant
            if (roomId.startsWith('virtual-')) {
                const room = roomsWithVirtualRooms.find(r => r.id === roomId);
                if (room) {
                    if (room.name.toLowerCase().includes('consultation')) {
                        const consultationType = mockActivityTypes.find(a => a.code === 'CONSULT')?.id;
                        if (consultationType) defaultActivityType = consultationType;
                    } else if (room.name.toLowerCase().includes('garde')) {
                        const gardeType = mockActivityTypes.find(a => a.code === 'GARDE')?.id;
                        if (gardeType) defaultActivityType = gardeType;
                    } else if (room.name.toLowerCase().includes('astreinte')) {
                        const astreinteType = mockActivityTypes.find(a => a.code === 'ASTREINTE')?.id;
                        if (astreinteType) defaultActivityType = astreinteType;
                    }
                }
            }

            // Création d'une nouvelle affectation
            const newAffectation: AffectationModele = {
                id: `new-${Date.now()}`,
                trameId: trame.id,
                roomId: roomId,
                activityTypeId: defaultActivityType,
                period: period,
                dayOverride: dayCode,
                isActive: true,
                requiredStaff: [
                    {
                        id: `staff-${Date.now()}`,
                        affectationId: `new-${Date.now()}`,
                        role: 'MAR',
                        count: 1
                    }
                ]
            };

            // Mise à jour de la trame
            const updatedTrame = {
                ...trame,
                affectations: [...trame.affectations, newAffectation]
            };

            setTrame(updatedTrame);

            // Notification de changement
            if (onTrameChange) {
                onTrameChange(updatedTrame);
            }

            console.log(`Nouvelle affectation créée pour ${roomId}, jour ${dayCode}, période ${period}`);
        },
        [trame, readOnly, onTrameChange, roomsWithVirtualRooms, mockActivityTypes]
    );

    // Rendu de la grille de trame
    const renderTrameGrid = () => {
        // Si aucune salle n'est disponible, afficher un message
        if (roomsWithVirtualRooms.length === 0) {
            return (
                <div className="py-8 text-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Aucune salle d'opération n'a été configurée pour ce site.</p>
                    <p className="text-sm text-gray-400 mt-2">Veuillez créer des secteurs et des salles dans la configuration.</p>
                </div>
            );
        }

        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className={`mt-4 overflow-x-auto ${compactView ? 'scale-98' : ''}`}>
                    <table className={`min-w-full border-collapse ${compactView ? 'compact-table' : ''}`}>
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className={`py-2 px-3 border border-gray-300 dark:border-gray-700 text-left ${compactView ? 'compact-cell' : ''}`}>
                                    Salles
                                </th>
                                {weekDays.map(day => (
                                    <th
                                        key={day.code}
                                        colSpan={2}
                                        className={`py-2 px-3 border border-gray-300 dark:border-gray-700 text-center ${compactView ? 'compact-cell' : ''}`}
                                    >
                                        <div className={compactView ? 'text-xs' : ''}>{day.name}</div>
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="py-2 px-3 border border-gray-300 dark:border-gray-700"></th>
                                {weekDays.map(day => (
                                    <React.Fragment key={`periods-${day.code}`}>
                                        <th className="py-2 px-3 border border-gray-300 dark:border-gray-700 text-center bg-blue-50">
                                            Matin
                                        </th>
                                        <th className="py-2 px-3 border border-gray-300 dark:border-gray-700 text-center bg-amber-50">
                                            Après-midi
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roomsWithVirtualRooms.map(room => (
                                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td
                                        className={`py-2 px-3 border border-gray-300 dark:border-gray-700 font-medium ${compactView ? 'compact-cell' : ''} ${room.isVirtual ? 'border-dashed bg-opacity-60' : ''}`}
                                        style={{
                                            backgroundColor: sectorsMap[room.operatingSectorId]?.colorCode || sectorsMap[room.sectorId]?.colorCode || '#f3f4f6'
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span>{room.name}</span>
                                                    {room.isVirtual && (
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            {sectorsMap[room.operatingSectorId]?.category === 'CONSULTATION' ? 'Consultation' :
                                                                sectorsMap[room.operatingSectorId]?.category === 'HYPERASEPTIQUE' ? 'Hyperaseptique' :
                                                                    sectorsMap[room.operatingSectorId]?.category === 'OPHTALMOLOGIE' ? 'Ophtalmologie' :
                                                                        sectorsMap[room.operatingSectorId]?.category === 'ENDOSCOPIE' ? 'Endoscopie' :
                                                                            room.name.toLowerCase().includes('consultation') ? 'Consultation' :
                                                                                room.name.toLowerCase().includes('garde') ? 'Garde' :
                                                                                    room.name.toLowerCase().includes('astreinte') ? 'Astreinte' : 'Virtuel'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex space-x-1">
                                                    {!compactView && (
                                                        <span className="text-xs text-gray-400" title="Ordre d'affichage">
                                                            #{room.displayOrder !== undefined ? room.displayOrder : '?'}
                                                        </span>
                                                    )}
                                                    {room.isVirtual && !readOnly && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5"
                                                            title="Créer une vraie salle"
                                                            onClick={() => {
                                                                // Ouvrir une nouvelle fenêtre/onglet vers l'interface de création de salles
                                                                window.open(`/admin/bloc-operatoire/salles?sectorId=${room.operatingSectorId}`, '_blank');
                                                            }}
                                                        >
                                                            <PlusIcon className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {!compactView && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {sectorsMap[room.operatingSectorId]?.name || sectorsMap[room.sectorId]?.name || 'Secteur non défini'}
                                                    </span>
                                                    {!compactView && sectorsMap[room.operatingSectorId] && (
                                                        <span className="text-xs text-gray-400" title="Ordre du secteur">
                                                            #{sectorsMap[room.operatingSectorId]?.displayOrder !== undefined ? sectorsMap[room.operatingSectorId]?.displayOrder : '?'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {room.isVirtual && (
                                                <div className="text-xs text-blue-500 mt-1">
                                                    <span className="italic">Créez des salles dans ce secteur pour organiser les affectations</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {weekDays.map(day => (
                                        <React.Fragment key={`${room.id}-${day.code}`}>
                                            <td className="py-2 px-3 border border-gray-300 dark:border-gray-700 align-top">
                                                <Droppable droppableId={`${room.id}-${day.code}-morning`} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className="min-h-[80px]"
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

                                                            {/* Bouton pour ajouter une nouvelle affectation */}
                                                            {!readOnly && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full mt-2 border border-dashed border-gray-300 text-gray-500"
                                                                    onClick={() => handleAddAffectation(room.id.toString(), day.code, 'MORNING')}
                                                                >
                                                                    + Ajouter
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </td>
                                            <td className="py-2 px-3 border border-gray-300 dark:border-gray-700 align-top">
                                                <Droppable droppableId={`${room.id}-${day.code}-afternoon`} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className="min-h-[80px]"
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

                                                            {/* Bouton pour ajouter une nouvelle affectation */}
                                                            {!readOnly && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full mt-2 border border-dashed border-gray-300 text-gray-500"
                                                                    onClick={() => handleAddAffectation(room.id.toString(), day.code, 'AFTERNOON')}
                                                                >
                                                                    + Ajouter
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DragDropContext>
        );
    };

    // Rendu principal du composant
    return (
        <div className="space-y-4">
            {/* En-tête avec type de trame et options */}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{trame.name}</span>
                    <Badge variant="outline" className="ml-2">
                        {trame.weekType === 'ALL' ? 'Toutes semaines' :
                            trame.weekType === 'EVEN' ? 'Semaines paires' : 'Semaines impaires'}
                    </Badge>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="filter-week-type">Type de semaine:</Label>
                        <Select
                            value={showWeekType}
                            onValueChange={(value) => setShowWeekType(value as WeekType | 'ALL')}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Type de semaine" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Toutes les semaines</SelectItem>
                                <SelectItem value="EVEN">Semaines paires</SelectItem>
                                <SelectItem value="ODD">Semaines impaires</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label htmlFor="show-personnel">Personnel habituel</Label>
                        <Switch
                            id="show-personnel"
                            checked={showPersonnel}
                            onCheckedChange={() => setShowPersonnel(!showPersonnel)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label htmlFor="compact-view">Vue compacte</Label>
                        <Switch
                            id="compact-view"
                            checked={compactView}
                            onCheckedChange={() => setCompactView(!compactView)}
                        />
                    </div>
                </div>
            </div>

            {/* Grille de trame */}
            {renderTrameGrid()}
        </div>
    );
};

export default TrameGridView; 