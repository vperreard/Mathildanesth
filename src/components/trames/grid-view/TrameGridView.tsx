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
import Switch from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, UsersIcon, ClockIcon, AlertTriangle } from 'lucide-react';

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
}> = ({ trame: initialTrame, readOnly = false, onTrameChange }) => {
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

    // Jours de la semaine pour l'affichage
    const weekDays = useMemo(() => {
        return [
            { code: 1, name: 'Lundi' },
            { code: 2, name: 'Mardi' },
            { code: 3, name: 'Mercredi' },
            { code: 4, name: 'Jeudi' },
            { code: 5, name: 'Vendredi' },
            { code: 6, name: 'Samedi' },
            { code: 0, name: 'Dimanche' },
        ].filter(day => trame.activeDays.includes(day.code));
    }, [trame.activeDays]);

    // Filtrer les affectations en fonction du type de semaine sélectionné
    const filteredAffectations = useMemo(() => {
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
            return filteredAffectations.filter(
                affectation =>
                    affectation.roomId === roomId &&
                    (!affectation.dayOverride || affectation.dayOverride === dayCode)
            );
        },
        [filteredAffectations]
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
                            {!affectation.isActive && (
                                <Badge variant="destructive" className="text-xs">Fermé</Badge>
                            )}
                        </div>

                        {/* Personnel requis */}
                        {showPersonnel && (
                            <div className="space-y-1">
                                {affectation.requiredStaff.map(staff => {
                                    const assignedUser = staff.userId
                                        ? mockUsers.find(u => u.id === staff.userId)
                                        : null;

                                    return (
                                        <div key={staff.id} className="flex items-center text-sm">
                                            <Badge
                                                variant="outline"
                                                className={`mr-1 ${staff.role === 'MAR' ? 'bg-blue-50' :
                                                    staff.role === 'SURGEON' ? 'bg-indigo-50' :
                                                        staff.role === 'IADE' ? 'bg-emerald-50' : 'bg-gray-50'
                                                    }`}
                                            >
                                                {staff.role}
                                            </Badge>
                                            {assignedUser ? assignedUser.name : '—'}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        },
        [compactView, showPersonnel]
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

    // Rendu de la grille de trame
    const renderTrameGrid = () => {
        return (
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
                        {mockRooms.map(room => (
                            <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td
                                    className={`py-2 px-3 border border-gray-300 dark:border-gray-700 ${mockSectors[room.sectorId as keyof typeof mockSectors]?.color || ''
                                        } font-medium ${compactView ? 'compact-cell' : ''}`}
                                >
                                    {room.name}
                                </td>
                                {weekDays.map(day => (
                                    <React.Fragment key={`${room.id}-${day.code}`}>
                                        <td className="py-2 px-3 border border-gray-300 dark:border-gray-700 align-top">
                                            <DragDropContext onDragEnd={handleDragEnd}>
                                                <Droppable droppableId={`${room.id}-${day.code}-morning`}>
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
                                                                >
                                                                    + Ajouter
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                        </td>
                                        <td className="py-2 px-3 border border-gray-300 dark:border-gray-700 align-top">
                                            <DragDropContext onDragEnd={handleDragEnd}>
                                                <Droppable droppableId={`${room.id}-${day.code}-afternoon`}>
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
                                                                >
                                                                    + Ajouter
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
                        <Switch
                            checked={showPersonnel}
                            onChange={() => setShowPersonnel(!showPersonnel)}
                            label="Personnel habituel"
                            ariaLabel="show-personnel"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={compactView}
                            onChange={() => setCompactView(!compactView)}
                            label="Vue compacte"
                            ariaLabel="compact-view"
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