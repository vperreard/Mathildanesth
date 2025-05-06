"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PencilIcon,
    CheckIcon,
    InformationCircleIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { format, addWeeks, startOfWeek, endOfWeek, isToday, isWeekend, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { ApiService } from "@/services/api";
import {
    Assignment,
    DisplayConfig,
    Room,
    RoomOrderConfig,
    Surgeon,
    User,
} from './types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { RuleEngine, RuleEvaluationSummary } from '@/modules/rules/engine/rule-engine';
import { RuleEvaluationResult, RuleEvaluationContext, RuleSeverity as RuleEngineSeverity } from '@/modules/rules/types/rule';
import { AssignmentType } from '@/types/assignment';
import { ShiftType } from '@/types/common';

import DisplayConfigPanel, { defaultDisplayConfig } from "./DisplayConfigPanel";
import { toast } from "react-hot-toast";

const sectors: Record<string, string> = {
    'Hyperaseptique': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
    'Orthopédie': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    'Viscéral': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    'Ambulatoire': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    'Ophtalmologie': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
    'Bloc A': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
    'Bloc B': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
    'default': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
};
const sectorLabels = {
    HYPERASEPTIQUE: "Hyperaseptique",
    SECTEUR_5_8: "Secteur 5-8",
    SECTEUR_9_12B: "Secteur 9-12B",
    OPHTALMOLOGIE: "Ophtalmologie",
    ENDOSCOPIE: "Endoscopie",
};
const roleColors = {
    SURGEON: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    MAR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IADE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

// Définition directe pour éviter les conflits d'import
enum AssignmentRuleSeverity {
    CRITICAL = 'CRITICAL',
    MAJOR = 'MAJOR',
    MINOR = 'MINOR',
    INFO = 'INFO'
}

// Redéfinition locale de RuleViolation pour utiliser notre propre énumération
interface RuleViolation {
    id: string;
    type: string;
    severity: AssignmentRuleSeverity;
    message: string;
    affectedAssignments: string[];
}

// Redéfinition locale de ValidationResult pour utiliser notre propre RuleViolation
interface ValidationResult {
    valid: boolean;
    violations: RuleViolation[];
    metrics: {
        equiteScore: number;
        fatigueScore: number;
        satisfactionScore: number;
    };
}

// Memoized Assignment Card component (or representation)
const MemoizedAssignment = memo(({ assignment, users }: { assignment: Assignment; users: User[] }) => {
    const user = users.find(u => u.id === assignment.userId);
    return (
        <div className="p-1 mb-1 border rounded bg-gray-100 text-xs shadow-sm">
            {user ? `${user.firstName} ${user.lastName}` : `Utilisateur ID: ${assignment.userId}`}
            {/* Ajouter d'autres détails si nécessaire */}
        </div>
    );
});
MemoizedAssignment.displayName = 'MemoizedAssignment';

export default function WeeklyPlanningPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"room" | "surgeon">("room");
    const [showLegend, setShowLegend] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [compactView, setCompactView] = useState(false);

    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [displayConfig, setDisplayConfig] = useState<DisplayConfig | null>(null);

    const [roomOrderConfig, setRoomOrderConfig] = useState<RoomOrderConfig>({ orderedRoomIds: [] });

    const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
    const [visibleRoomIds, setVisibleRoomIds] = useState<string[]>([]);
    const [visiblePersonnelIds, setVisiblePersonnelIds] = useState<string[]>([]);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tempAssignments, setTempAssignments] = useState<Assignment[]>([]);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
    const [pendingChangesDiff, setPendingChangesDiff] = useState<string[]>([]);

    const ruleEngine = useMemo(() => new RuleEngine(), []);

    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchDataAndConfig = async () => {
            setIsLoadingData(true);
            setIsLoading(true);
            let finalConfig = defaultDisplayConfig;

            try {
                const api = ApiService.getInstance();
                const configData = await api.getUserPreferences();
                if (configData && typeof configData === 'object') {
                    finalConfig = { ...defaultDisplayConfig, ...configData } as DisplayConfig;
                } else {
                    console.warn("Préférences utilisateur invalides reçues, utilisation des défauts.");
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la config d\'affichage:', error);
            } finally {
                setDisplayConfig(finalConfig);
            }

            try {
                const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

                const [usersResponse, roomsResponse, assignmentsResponse] = await Promise.all([
                    fetch('/api/utilisateurs'),
                    fetch('/api/operating-rooms'),
                    fetch(`/api/assignments?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`)
                ]);

                if (!usersResponse.ok || !roomsResponse.ok || !assignmentsResponse.ok) {
                    throw new Error('Erreur lors du chargement des données initiales');
                }

                const usersData = await usersResponse.json();
                const roomsData = await roomsResponse.json();
                const assignmentsData = await assignmentsResponse.json();

                setUsers(usersData.users || []);
                const fetchedRooms = roomsData.rooms || [];

                let currentRoomOrder: string[] = [];
                if (typeof window !== 'undefined') {
                    const savedRoomOrder = localStorage.getItem('roomOrderConfig');
                    if (savedRoomOrder) {
                        try {
                            const parsedOrder = JSON.parse(savedRoomOrder);
                            if (parsedOrder && Array.isArray(parsedOrder.orderedRoomIds)) {
                                currentRoomOrder = parsedOrder.orderedRoomIds.map(String);
                                setRoomOrderConfig({ orderedRoomIds: currentRoomOrder });
                            }
                        } catch (e) {
                            console.error('Erreur lecture roomOrderConfig:', e);
                        }
                    }
                }
                const orderedRooms = fetchedRooms.map((room: Room) => {
                    const orderIndex = currentRoomOrder.indexOf(String(room.id));
                    return { ...room, order: orderIndex === -1 ? Infinity : orderIndex };
                });
                const sortedRooms = [...orderedRooms].sort((a, b) => {
                    if (a.order !== b.order) return a.order - b.order;
                    if (a.sector && b.sector && a.sector !== b.sector) return a.sector.localeCompare(b.sector);
                    return a.name.localeCompare(b.name);
                });
                setRooms(sortedRooms);

                const fetchedAssignments = assignmentsData.assignments || [];
                setAssignments(fetchedAssignments);
                setTempAssignments(fetchedAssignments);

            } catch (error) {
                console.error('Erreur lors du chargement des données (users/rooms/assignments):', error);
                toast.error("Erreur lors du chargement des données du planning.");
                setUsers([]);
                setRooms([]);
                setAssignments([]);
                setTempAssignments([]);
            } finally {
                setIsLoadingData(false);
                setIsLoading(false);
            }
        };

        fetchDataAndConfig();
    }, [currentWeekStart]);

    const handleSaveRoomOrder = (orderedRoomIds: string[]) => {
        const newConfig = { orderedRoomIds };
        setRoomOrderConfig(newConfig);
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomOrderConfig', JSON.stringify(newConfig));
        }
        const orderedRooms = rooms.map((room: Room) => {
            const orderIndex = orderedRoomIds.indexOf(String(room.id));
            return { ...room, order: orderIndex === -1 ? Infinity : orderIndex };
        });
        const sortedRooms = [...orderedRooms].sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
            return a.name.localeCompare(b.name);
        });
        setRooms(sortedRooms);
        if (displayConfig) {
            const newConfig = { ...displayConfig, roomOrder: orderedRoomIds };
            setDisplayConfig(newConfig);
            try {
                console.log("Préférences d'ordre des salles (simulé) sauvegardées.");
            } catch (error) {
                console.error("Erreur sauvegarde préférences ordre salles:", error);
            }
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isVisibleByConfig = !displayConfig || !displayConfig.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(room.id));
        return matchesSearch && isVisibleByConfig;
    });

    const filteredSurgeons = users
        .filter(user => user.role === "SURGEON")
        .filter(surgeon => {
            const matchesSearch = `${surgeon.prenom} ${surgeon.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
            const isVisibleByConfig = !displayConfig || !displayConfig.hiddenPersonnelIds || !displayConfig.hiddenPersonnelIds.includes(String(surgeon.id));
            return matchesSearch && isVisibleByConfig;
        });

    const filteredTempAssignments = tempAssignments.filter(assignment => {
        const roomVisible = !displayConfig || !displayConfig.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(assignment.roomId));
        const surgeonVisible = !displayConfig || !displayConfig.hiddenPersonnelIds || !displayConfig.hiddenPersonnelIds.includes(String(assignment.surgeonId));
        return roomVisible && surgeonVisible;
    });

    const formatNameWithConfig = (person: User | null, role: 'chirurgien' | 'mar' | 'iade'): string => {
        if (!person || !displayConfig || !displayConfig.personnel || !displayConfig.personnel[role]) {
            return person ? `${person.prenom} ${person.nom}` : '';
        }

        const configPerson: Surgeon = {
            id: person.id,
            nom: person.nom,
            prenom: person.prenom,
            specialite: person.specialty || '',
            firstName: person.firstName,
            lastName: person.lastName,
            specialty: person.specialty
        };

        const config = displayConfig.personnel[role];

        let name = '';
        const { prenom, nom, specialty } = configPerson;

        if (config.format) {
            switch (config.format) {
                case 'nom': name = nom; break;
                case 'nomPrenom': name = `${nom} ${prenom}`; break;
                case 'prenom-nom': name = `${prenom} ${nom}`; break;
                case 'nom-specialite': name = `${nom}${specialty ? ` (${specialty})` : ''}`; break;
                case 'initiale-nom': name = prenom && prenom.length > 0 ? `${prenom.charAt(0)}. ${nom}` : nom; break;
                case 'alias':
                    if (person.alias && person.alias.trim() !== '') {
                        name = person.alias;
                    } else {
                        name = prenom && prenom.length > 0 ? `${prenom.charAt(0)}. ${nom}` : nom;
                    }
                    break;
                case 'full': name = `${prenom} ${nom}`; break;
                case 'lastName': name = nom; break;
                case 'firstName': name = prenom; break;
                case 'initials': name = prenom && nom && prenom.length > 0 && nom.length > 0 ? `${prenom.charAt(0)}.${nom.charAt(0)}.` : nom; break;
                case 'firstInitial-lastName': name = prenom && prenom.length > 0 ? `${prenom.charAt(0)}. ${nom}` : nom; break;
                default: name = nom;
            }
        } else {
            name = `${prenom} ${nom}`;
        }

        if (config.casse) {
            switch (config.casse) {
                case 'uppercase': name = name.toUpperCase(); break;
                case 'lowercase': name = name.toLowerCase(); break;
                case 'capitalize': name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); break;
                default: break;
            }
        }

        if (config.showRolePrefix) {
            let rolePrefix = '';
            switch (role) {
                case 'chirurgien': rolePrefix = 'Chir: '; break;
                case 'mar': rolePrefix = 'MAR: '; break;
                case 'iade': rolePrefix = 'IADE: '; break;
            }
            return `${rolePrefix}${name}`;
        } else {
            return name;
        }
    };

    const getTextColorForBackground = (backgroundColor: string): string => {
        let hex = backgroundColor.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#ffffff';
    };

    const getStyleWithConfig = (assignment: Assignment | null | undefined): React.CSSProperties => {
        if (!assignment) {
            return {
                backgroundColor: "#e5e7eb",
                color: "#374151"
            };
        }

        const surgeonId = assignment.surgeonId;
        if (!surgeonId || !displayConfig || !displayConfig.couleurs || !displayConfig.couleurs.chirurgiens) {
            return {
                backgroundColor: "#e5e7eb",
                color: "#374151"
            };
        }

        const surgeonColorMap = displayConfig.couleurs.chirurgiens;
        const color = surgeonColorMap[surgeonId] || "#e5e7eb";

        return {
            backgroundColor: color,
            color: getTextColorForBackground(color)
        };
    };

    const goToPreviousWeek = () => {
        setCurrentWeekStart(prev => addWeeks(prev, -1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(prev => addWeeks(prev, 1));
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const getUserById = (id: string | number | null) => {
        if (id === null || id === undefined) return undefined;
        const stringId = String(id);
        return users.find(user => String(user.id) === stringId);
    }
    const getRoomById = (id: string | number) => {
        const stringId = String(id);
        return rooms.find(room => String(room.id) === stringId);
    }

    const getDailyAssignments = (date: Date, roomId: string | number) => {
        const dateString = format(date, "yyyy-MM-dd");
        return filteredTempAssignments.filter(
            (a) => format(new Date(a.date), "yyyy-MM-dd") === dateString && String(a.roomId) === String(roomId)
        );
    };

    const getWeekDays = () => {
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        }).filter(day => !isWeekend(day));
    };

    const getSurgeonDailyAssignments = (date: Date, surgeonId: string | number) => {
        const dateString = format(date, "yyyy-MM-dd");
        return filteredTempAssignments.filter(
            (a) => format(new Date(a.date), "yyyy-MM-dd") === dateString && String(a.surgeonId) === String(surgeonId)
        );
    };

    const renderAssignment = (assignment: Assignment, index: number = 0) => {
        const surgeon = assignment.surgeonId != null ? getUserById(assignment.surgeonId) : undefined;
        const mar = assignment.marId != null ? getUserById(assignment.marId) : undefined;
        const iade = assignment.iadeId != null ? getUserById(assignment.iadeId) : undefined;
        const room = assignment.roomId != null ? getRoomById(assignment.roomId) : undefined;

        if (!surgeon || !room) return null;

        const surgeonStyle = getStyleWithConfig(assignment);
        const marStyle = mar ? getStyleWithConfig(assignment) : {};
        const iadeStyle = iade ? getStyleWithConfig(assignment) : {};

        const sectorColorMatch = room.sector ? sectors[room.sector]?.match(/(bg-\w+-\d+)/) : null;
        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : 'bg-gray-100';

        const opacityValue = displayConfig?.backgroundOpacity ? Math.round(displayConfig.backgroundOpacity * 100) : 50;
        const cardBgStyle = assignment.period === "MORNING"
            ? (room.sector ? sectors[room.sector] : sectors['default'])
            : `${sectorColor} bg-opacity-${opacityValue} dark:bg-opacity-${opacityValue}`;

        const textColor = getTextColorForBackground(cardBgStyle);

        const content = (
            <div
                className={`p-1 rounded text-xs mb-1 shadow-sm ${cardBgStyle}`}
                style={{ color: textColor }}
            >
                <div style={surgeonStyle}>
                    {formatNameWithConfig(surgeon, 'chirurgien')}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    {mar && (
                        <span style={marStyle}>
                            {formatNameWithConfig(mar, 'mar')}
                        </span>
                    )}
                    {iade && (
                        <span style={iadeStyle} className={mar ? 'ml-2' : ''}>
                            {formatNameWithConfig(iade, 'iade')}
                        </span>
                    )}
                </div>
            </div>
        );

        return (
            <Draggable draggableId={`assignment-${assignment.id}`} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-shadow duration-150 ease-in-out ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-1' : 'shadow-sm'}`}
                        style={{
                            ...provided.draggableProps.style,
                        }}
                    >
                        {content}
                    </div>
                )}
            </Draggable>
        );
    };

    // Fonction pour rendre les assignations d'une salle spécifique
    const renderRoomAssignments = useCallback((room: Room) => {
        const weekDays = getWeekDays();
        const dailyAssignments = getDailyAssignments(new Date(currentWeekStart), room.id);
        const morningAssignments = dailyAssignments.filter(a => a.period === 'MORNING');
        const afternoonAssignments = dailyAssignments.filter(a => a.period === 'AFTERNOON');
        const morningDroppableId = `room-${room.id}-day-${format(currentWeekStart, 'yyyy-MM-dd')}-period-MORNING`;
        const afternoonDroppableId = `room-${room.id}-day-${format(currentWeekStart, 'yyyy-MM-dd')}-period-AFTERNOON`;

        return (
            <div className="grid grid-cols-2 gap-1 h-full">
                <Droppable droppableId={morningDroppableId} type="ASSIGNMENT">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[60px] p-1 rounded-md transition-colors duration-150 ease-in-out ${snapshot.isDraggingOver ? 'bg-blue-200 dark:bg-blue-700 shadow-inner' : 'bg-blue-50/30 dark:bg-blue-900/20'}`}
                        >
                            {morningAssignments.map((assignment, index) => renderAssignment(assignment, index))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable droppableId={afternoonDroppableId} type="ASSIGNMENT">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[60px] p-1 rounded-md transition-colors duration-150 ease-in-out ${snapshot.isDraggingOver ? 'bg-amber-200 dark:bg-amber-700 shadow-inner' : 'bg-amber-50/30 dark:bg-amber-900/20'}`}
                        >
                            {afternoonAssignments.map((assignment, index) => renderAssignment(assignment, index))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    }, [currentWeekStart, getWeekDays, renderAssignment, filteredTempAssignments]);

    const renderRoomView = useCallback(() => {
        const weekDays = getWeekDays();
        const roomsToDisplay = filteredRooms;

        // Group rooms by sector
        const groupedRoomsBySector = roomsToDisplay.reduce((acc, room) => {
            const sector = room.sector || 'Non classé';
            if (!acc[sector]) {
                acc[sector] = [];
            }
            acc[sector].push(room);
            return acc;
        }, {} as Record<string, Room[]>);

        return (
            <div className="p-4">
                <div className="font-medium text-gray-700 mb-4">
                    Semaine du {format(currentWeekStart, "d MMMM", { locale: fr })} au {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: fr })}
                </div>
                <div className="grid gap-4">
                    {Object.entries(groupedRoomsBySector).map(([sector, roomsInSection]) => (
                        <React.Fragment key={sector}>
                            {/* En-tête de Secteur */}
                            <div className="col-span-full p-2 bg-gray-200 font-medium text-sm rounded">{sector}</div>
                            {/* Salles dans ce secteur */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {roomsInSection.map(room => (
                                    <div key={room.id} className="border rounded p-3 bg-white shadow-sm">
                                        <h3 className="font-semibold text-sm mb-2">{room.name}</h3>
                                        {renderRoomAssignments(room)}
                                    </div>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }, [filteredRooms, currentWeekStart, getWeekDays, renderRoomAssignments]);

    const renderSurgeonView = () => {
        const weekDays = getWeekDays();

        if (!displayConfig) {
            return (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Chargement de la configuration...
                </div>
            );
        }

        return (
            <div className={`mt-4 overflow-x-auto ${compactView ? 'scale-compact' : ''}`}>
                <table className={`min-w-full border-collapse ${compactView ? 'compact-table' : ''}`}>
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className={`py-2 px-3 border border-gray-300 dark:border-gray-700 text-left ${compactView ? 'compact-cell' : ''}`}>Chirurgiens</th>
                            {weekDays.map((day) => (
                                <th
                                    key={day.toISOString()}
                                    className={`py-2 px-3 border border-gray-300 dark:border-gray-700 text-center ${isToday(day) ? "bg-blue-50 dark:bg-blue-900" : ""} ${compactView ? 'compact-cell' : ''}`}
                                >
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "EEEE", { locale: fr })}</div>
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "dd/MM", { locale: fr })}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSurgeons.map((surgeon) => (
                            <tr key={surgeon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className={`py-2 px-3 border border-gray-300 dark:border-gray-700 font-medium ${compactView ? 'compact-cell' : ''}`}>
                                    <div style={getStyleWithConfig(null)}>
                                        {formatNameWithConfig(surgeon, 'chirurgien')}
                                    </div>
                                </td>
                                {weekDays.map((day) => {
                                    const surgeonAssignments = getSurgeonDailyAssignments(day, surgeon.id);
                                    const morningAssignments = surgeonAssignments.filter(a => a.period === "MORNING");
                                    const afternoonAssignments = surgeonAssignments.filter(a => a.period === "AFTERNOON");

                                    return (
                                        <td key={day.toISOString()} className={`py-2 px-3 border border-gray-300 dark:border-gray-700 ${compactView ? 'compact-cell' : ''}`}>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    {morningAssignments.map(assignment => {
                                                        const room = getRoomById(assignment.roomId);
                                                        const mar = assignment.marId ? getUserById(assignment.marId) : null;
                                                        const iade = assignment.iadeId ? getUserById(assignment.iadeId) : null;

                                                        if (!room) return null;

                                                        const cardBgStyle = sectors[room.sector];
                                                        const roomStyle = { /* Pourrait utiliser config générale */ };
                                                        const marStyle = getStyleWithConfig(assignment);
                                                        const iadeStyle = getStyleWithConfig(assignment);

                                                        return compactView ? (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-1 mb-1 rounded border text-xs ${cardBgStyle} border-l-2`}
                                                                style={roomStyle}
                                                            >
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-2 mb-1 rounded border ${cardBgStyle} border-l-4`}
                                                                style={roomStyle}
                                                            >
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Matin
                                                                </div>
                                                                {mar && <div style={marStyle}>{formatNameWithConfig(mar, 'mar')}</div>}
                                                                {iade && <div style={iadeStyle}>{formatNameWithConfig(iade, 'iade')}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex-1">
                                                    {afternoonAssignments.map(assignment => {
                                                        const room = getRoomById(assignment.roomId);
                                                        const mar = assignment.marId ? getUserById(assignment.marId) : null;
                                                        const iade = assignment.iadeId ? getUserById(assignment.iadeId) : null;

                                                        if (!room) return null;

                                                        const sectorColorMatch = sectors[room.sector]?.match(/(bg-\w+-\d+)/);
                                                        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : 'bg-gray-100';
                                                        const opacityValue = displayConfig?.backgroundOpacity ? Math.round(displayConfig.backgroundOpacity * 100) : 50;
                                                        const cardBgStyle = `${sectorColor} bg-opacity-${opacityValue} dark:bg-opacity-${opacityValue}`;
                                                        const roomStyle = { /* Pourrait utiliser config générale */ };
                                                        const marStyle = getStyleWithConfig(assignment);
                                                        const iadeStyle = getStyleWithConfig(assignment);

                                                        return compactView ? (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-1 mb-1 rounded border text-xs ${cardBgStyle} border-r-2`}
                                                                style={roomStyle}
                                                            >
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-2 mb-1 rounded border ${cardBgStyle} border-r-4`}
                                                                style={roomStyle}
                                                            >
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Après-midi
                                                                </div>
                                                                {mar && <div style={marStyle}>{formatNameWithConfig(mar, 'mar')}</div>}
                                                                {iade && <div style={iadeStyle}>{formatNameWithConfig(iade, 'iade')}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderLegend = () => {
        return (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Légende</h3>

                <div className="space-y-2">
                    <div>
                        <h4 className="font-medium">Secteurs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {Object.entries(sectorLabels).map(([key, label]) => (
                                <div key={key} className={`p-2 rounded border ${sectors[key]} flex items-center`}>
                                    <span className="text-sm">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium">Rôles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {Object.entries(roleColors).map(([role, colorClass]) => (
                                <div key={role} className={`p-2 rounded ${colorClass} flex items-center`}>
                                    <span className="text-sm">{role === "SURGEON" ? "Chirurgien" : role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium">Périodes</h4>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="p-2 rounded border border-l-4 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 flex items-center">
                                <span className="text-sm">Matin</span>
                            </div>
                            <div className="p-2 rounded border border-r-4 bg-blue-100 bg-opacity-40 dark:bg-blue-900 dark:bg-opacity-30 border-blue-300 dark:border-blue-700 flex items-center">
                                <span className="text-sm">Après-midi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SimpleTooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
        const [isVisible, setIsVisible] = useState(false);

        return (
            <div
                className="relative inline-block"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
                {isVisible && (
                    <div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-md -top-10 left-1/2 transform -translate-x-1/2">
                        {content}
                    </div>
                )}
            </div>
        );
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'light');
        }
    };

    const getRoomsBySector = (sector: string) => {
        return rooms
            .filter(room => room.sector === sector)
            .sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                if (a.order !== undefined) {
                    return -1;
                }
                if (b.order !== undefined) {
                    return 1;
                }
                return a.name.localeCompare(b.name);
            });
    };

    const handleConfigChange = async (newConfig: DisplayConfig) => {
        setDisplayConfig(newConfig);
        setShowConfigPanel(false);
        console.log("Préférences sauvegardées localement");
    };

    useEffect(() => {
        if (!isLoading && rooms.length > 0) {
            if (visibleRoomIds.length === 0) {
                setVisibleRoomIds(rooms.map(room => String(room.id)));
            }

            if (visiblePersonnelIds.length === 0) {
                const surgeonIds = users
                    .filter(user => user.role === "SURGEON")
                    .map(user => String(user.id));
                setVisiblePersonnelIds(surgeonIds);
            }
        }
    }, [isLoading, rooms, users, visibleRoomIds.length, visiblePersonnelIds.length]);

    useEffect(() => {
        const loadDefaultConfig = () => {
            if (!displayConfig) {
                console.log("Chargement de la configuration par défaut");
                setDisplayConfig(defaultDisplayConfig);
            }
        };

        const timer = setTimeout(loadDefaultConfig, 3000);

        return () => clearTimeout(timer);
    }, [displayConfig]);

    useEffect(() => {
        const handleThemeChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else {
            mediaQuery.addListener(handleThemeChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleThemeChange);
            } else {
                mediaQuery.removeListener(handleThemeChange);
            }
        };
    }, []);

    const handleDragEnd = useCallback(async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        const assignmentId = draggableId.replace('assignment-', '');

        const movedAssignmentIndex = tempAssignments.findIndex(a => String(a.id) === assignmentId);
        if (movedAssignmentIndex === -1) {
            console.error("Assignation déplacée non trouvée:", assignmentId);
            return;
        }
        const movedAssignment = { ...tempAssignments[movedAssignmentIndex] };

        const destParts = destination.droppableId.split('-');
        if (destParts.length !== 6 || destParts[0] !== 'room' || destParts[2] !== 'day' || destParts[4] !== 'period') {
            console.error("ID de destination invalide:", destination.droppableId);
            return;
        }
        const newRoomId = parseInt(destParts[1], 10);
        const newDateStr = destParts[3];
        const newPeriod = destParts[5] as 'MORNING' | 'AFTERNOON';
        const newDate = new Date(newDateStr + 'T12:00:00Z');

        let updatedAssignments = [...tempAssignments];

        updatedAssignments[movedAssignmentIndex] = {
            ...movedAssignment,
            roomId: newRoomId,
            date: newDate,
            period: newPeriod,
        };

        setTempAssignments(updatedAssignments);
        setHasPendingChanges(true);
    }, [tempAssignments]);

    const calculateDiff = () => {
        const diffMessages: string[] = [];
        const originalMap = new Map(assignments.map(a => [a.id, a]));
        const tempMap = new Map(tempAssignments.map(a => [a.id, a]));

        tempMap.forEach((tempAssign, id) => {
            const originalAssign = originalMap.get(id);
            if (!originalAssign) {
                // Nouvelle assignation (pas géré par DND actuel, mais pourrait l'être)
                // diffMessages.push(`Nouvelle affectation: ...`);
            } else if (
                tempAssign.roomId !== originalAssign.roomId ||
                tempAssign.date !== originalAssign.date ||
                tempAssign.period !== originalAssign.period
            ) {
                // Assignation modifiée (déplacée)
                const surgeon = getUserById(tempAssign.surgeonId);
                const originalRoom = getRoomById(originalAssign.roomId);
                const newRoom = getRoomById(tempAssign.roomId);
                const originalDateStr = format(new Date(originalAssign.date), 'dd/MM');
                const newDateStr = format(new Date(tempAssign.date), 'dd/MM');
                const surgeonName = surgeon ? `${surgeon.prenom} ${surgeon.nom}` : `ID ${tempAssign.surgeonId}`;
                const originalSlot = `${originalRoom?.name || 'Inconnue'} (${originalAssign.period === 'MORNING' ? 'Matin' : 'Après-midi'} ${originalDateStr})`;
                const newSlot = `${newRoom?.name || 'Inconnue'} (${tempAssign.period === 'MORNING' ? 'Matin' : 'Après-midi'} ${newDateStr})`;

                diffMessages.push(`Dr. ${surgeonName} déplacé de ${originalSlot} vers ${newSlot}`);
            }
        });

        // Vérifier les assignations supprimées (pas géré par DND actuel)
        // originalMap.forEach((originalAssign, id) => {
        //     if (!tempMap.has(id)) {
        //         // Assignation supprimée
        //     }
        // });

        setPendingChangesDiff(diffMessages);
    };

    const validateChanges = useCallback(async (assignmentsToValidate: Assignment[]) => {
        setIsLoading(true);
        let clientValidationResult: ValidationResult | null = null;
        let serverValidationResult: RuleEvaluationSummary | null = null;

        // --- Validation Client (avec RuleEngine local) ---
        try {
            const context: RuleEvaluationContext = {
                assignments: assignmentsToValidate,
                startDate: currentWeekStart,
                endDate: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
                medecins: users.filter(u => u.role === 'SURGEON' || u.role === 'MAR' || u.role === 'IADE').map(u => ({
                    id: String(u.id),
                    firstName: u.prenom || '',
                    lastName: u.nom || '',
                    department: 'N/A',
                    speciality: 'N/A',
                    qualifications: []
                })),
                rooms: rooms.map(r => ({
                    id: String(r.id),
                    name: r.name,
                    sector: r.sector || 'N/A',
                    capacity: 1,
                    equipment: []
                })),
            };
            const result: RuleEvaluationSummary = await ruleEngine.evaluate(context);
            console.log("Résultat validation RuleEngine (Client):", result);

            // Mapper le résultat du RuleEngine local vers le format ValidationResult
            const mapResultToViolation = (evalResult: RuleEvaluationResult): RuleViolation => {
                const affectedAssignments = evalResult.details?.affectedAssignments?.map(String) || [];
                let severity: AssignmentRuleSeverity;
                switch (evalResult.severity) {
                    case RuleEngineSeverity.ERROR:
                        severity = AssignmentRuleSeverity.CRITICAL;
                        break;
                    case RuleEngineSeverity.WARNING:
                        severity = AssignmentRuleSeverity.MAJOR;
                        break;
                    case RuleEngineSeverity.INFO:
                    default:
                        severity = AssignmentRuleSeverity.INFO;
                        break;
                }

                return {
                    id: evalResult.ruleId || `violation-${Math.random()}`,
                    type: evalResult.details?.ruleType || 'Unknown',
                    severity: severity,
                    message: evalResult.message,
                    affectedAssignments: affectedAssignments,
                };
            };
            const allViolations = [
                ...(result.violations || []),
                ...(result.warnings || [])
            ].map(mapResultToViolation);
            clientValidationResult = {
                valid: result.isValid,
                violations: allViolations,
                metrics: {
                    equiteScore: result.score || 0,
                    fatigueScore: 0,
                    satisfactionScore: 0,
                }
            };

        } catch (error) {
            console.error("Erreur validation règles (Client):", error);
            clientValidationResult = {
                valid: false,
                violations: [{
                    id: 'client-validation-error',
                    type: 'System',
                    severity: AssignmentRuleSeverity.CRITICAL,
                    message: "Erreur interne lors de la validation (client).",
                    affectedAssignments: []
                }],
                metrics: { equiteScore: 0, fatigueScore: 0, satisfactionScore: 0 }
            };
        }

        // --- Validation Serveur (optionnelle ou complémentaire) ---
        try {
            const response = await fetch('/api/assignments/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: assignmentsToValidate }),
            });
            if (!response.ok) {
                throw new Error(`Erreur serveur validation: ${response.statusText}`);
            }
            serverValidationResult = await response.json();
            console.log("Résultat validation RuleEngine (Serveur):", serverValidationResult);

            // Combiner les résultats ou choisir lequel afficher ?
            // Pour l'instant, on utilise le résultat client, mais on pourrait merger
            // les violations ou afficher les erreurs serveur si la validation client passe.

        } catch (error) {
            console.error("Erreur validation règles (Serveur):", error);
            if (clientValidationResult) {
                clientValidationResult.valid = false;
                clientValidationResult.violations.push({
                    id: 'server-validation-error',
                    type: 'System',
                    severity: AssignmentRuleSeverity.CRITICAL,
                    message: "Erreur interne lors de la validation (serveur).",
                    affectedAssignments: []
                });
            }
        }

        setValidationResult(clientValidationResult);
        setIsLoading(false);

    }, [currentWeekStart, users, rooms, ruleEngine]);

    const openConfirmationDialog = useCallback(async () => {
        // Valider les tempAssignments actuels
        await validateChanges(tempAssignments);
        calculateDiff();
        setIsConfirmationDialogOpen(true);
    }, [validateChanges, calculateDiff, tempAssignments]);

    const handleSaveChanges = useCallback(async () => {
        if (!hasPendingChanges || !validationResult?.valid) {
            toast.error("Impossible de sauvegarder : changements invalides ou aucune modification.");
            return;
        }
        setIsSaving(true);
        const originalAssignments = assignments;

        try {
            // Préparer les données pour l'API batch
            // Assurez-vous que le format correspond à ce qu'attend POST /api/assignments/batch
            const assignmentsToSave = tempAssignments.map(tempAssign => {
                // Convertir les champs si nécessaire (ex: userId en number si l'API l'attend)
                return {
                    ...tempAssign,
                    userId: Number(tempAssign.userId), // Assumer que l'API batch attend un number
                    date: new Date(tempAssign.date), // Envoyer objet Date ou string ISO?
                    roomId: tempAssign.roomId ? Number(tempAssign.roomId) : null, // API attend number?
                    // Retirer les champs non persistés (ex: `order` ajouté localement)
                };
            });

            console.log("Assignations envoyées à /api/assignments/batch:", assignmentsToSave);

            const response = await fetch('/api/assignments/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: assignmentsToSave }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Erreur API batch:", result);
                // Gérer les erreurs 207 (Multi-Status) spécifiquement
                if (response.status === 207 && result.errors) {
                    toast.error(`Erreur partielle: ${result.errors.length} affectation(s) non enregistrée(s).`);
                } else {
                    toast.error(result.error || "Erreur lors de la sauvegarde des changements.");
                }
                throw new Error(result.error || 'Sauvegarde échouée');
            }

            // Succès
            setAssignments(tempAssignments); // Mettre à jour l'état principal
            setHasPendingChanges(false);
            setValidationResult(null);
            setIsConfirmationDialogOpen(false);
            toast.success(result.message || "Changements sauvegardés avec succès !");

        } catch (error) {
            console.error("Erreur lors de la sauvegarde des changements:", error);
            // Ne pas restaurer tempAssignments ici pour permettre à l'utilisateur de réessayer
            // setTempAssignments(originalAssignments); // Ou restaurer si on préfère annuler en cas d'erreur
            toast.error(`Erreur sauvegarde: ${error instanceof Error ? error.message : 'Veuillez réessayer.'}`);
            // Garder la modale ouverte ?
            // setIsConfirmationDialogOpen(false);
        } finally {
            setIsSaving(false);
        }
    }, [tempAssignments, assignments, hasPendingChanges, validationResult]);

    const handleCancelChanges = useCallback(() => {
        setTempAssignments(assignments);
        setHasPendingChanges(false);
        setValidationResult(null);
        setIsConfirmationDialogOpen(false);
    }, [assignments, setTempAssignments, setHasPendingChanges, setValidationResult, setIsConfirmationDialogOpen]);

    // Fonction pour ouvrir le panneau de configuration
    const openConfigPanel = () => setShowConfigPanel(true);

    return (
        <div className="flex flex-col h-full p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Planning Hebdomadaire du Bloc Opératoire</h1>
                {/* Bouton pour ouvrir les paramètres */}
                <Button onClick={openConfigPanel} variant="outline" size="icon" data-testid="open-config-button">
                    <Cog6ToothIcon className="h-5 w-5" />
                </Button>
            </div>

            {/* Dialog pour les paramètres */}
            <Dialog open={showConfigPanel} onOpenChange={setShowConfigPanel}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {/* Rendu conditionnel pour éviter les erreurs si displayConfig est null au début */}
                    {displayConfig && (
                        <DisplayConfigPanel
                            onClose={() => setShowConfigPanel(false)} // Appeler setShowConfigPanel pour fermer
                            config={displayConfig}
                            onConfigChange={handleConfigChange}
                            rooms={rooms}
                            users={users}
                            roomOrderConfig={roomOrderConfig}
                            onSaveRoomOrder={handleSaveRoomOrder}
                            data-testid="config-panel"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {isLoading ? (
                <p>Chargement du planning...</p>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd} data-testid="dnd-context">
                    <div className="flex-grow overflow-auto border rounded-lg shadow-sm bg-white">
                        {viewMode === "room" ? renderRoomView() : renderSurgeonView()}
                    </div>
                </DragDropContext>
            )}
            {hasPendingChanges && (
                <div className="mt-4 p-4 border rounded-lg shadow-md bg-yellow-50 flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={handleCancelChanges}
                        data-testid="cancel-changes-button"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={openConfirmationDialog}
                        data-testid="validate-changes-button"
                    >
                        Valider les changements
                    </Button>
                </div>
            )}
            <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
                <DialogContent data-testid="confirmation-dialog">
                    <DialogHeader>
                        <DialogTitle>Confirmer les changements</DialogTitle>
                        <DialogDescription>
                            Veuillez vérifier les modifications et les éventuels conflits avant de sauvegarder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 my-4">
                        <div>
                            <h4 className="font-semibold">Changements proposés :</h4>
                            {pendingChangesDiff.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                    {pendingChangesDiff.map((change, index) => (
                                        <li key={index}>{change}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">Aucun changement détecté.</p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold">Résultat de la validation :</h4>
                            {validationResult ? (
                                <ValidationSummaryDisplay result={validationResult} />
                            ) : (
                                <p className="text-sm text-gray-500">Validation en attente...</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmationDialogOpen(false)}>Annuler</Button>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={!validationResult?.valid || validationResult.violations.length > 0}
                            data-testid="confirm-save-button"
                        >
                            Confirmer & Sauvegarder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Composant interne pour afficher le résumé de la validation
const ValidationSummaryDisplay = ({ result }: { result: ValidationResult }) => (
    <div className="space-y-2 max-h-[150px] overflow-y-auto">
        {result.valid && (
            <div className="flex items-center p-2 rounded bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">Aucune violation critique détectée.</span>
            </div>
        )}
        {result.violations && result.violations.length > 0 ? (
            result.violations.map((violation: RuleViolation) => (
                <div key={violation.id} className={`flex items-start p-2 rounded text-sm ${violation.severity === AssignmentRuleSeverity.CRITICAL ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                    violation.severity === AssignmentRuleSeverity.MAJOR ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' :
                        violation.severity === AssignmentRuleSeverity.MINOR ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
                            'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' // INFO
                    }`}>
                    {violation.severity === AssignmentRuleSeverity.CRITICAL ? <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" /> :
                        <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-yellow-500" />}
                    <span>{violation.message}</span>
                </div>
            ))
        ) : !result.valid && (!result.violations || result.violations.length === 0) ? (
            <div className="flex items-center p-2 rounded bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                <span className="text-sm">Des violations existent mais n'ont pu être détaillées.</span>
            </div>
        ) : null}
    </div>
); 