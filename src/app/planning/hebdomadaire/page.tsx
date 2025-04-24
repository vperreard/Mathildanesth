"use client";

import React, { useState, useEffect } from "react";
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

// Import du panneau de configuration
import DisplayConfigPanel, { defaultDisplayConfig } from "./DisplayConfigPanel";
import { DisplayConfig, Room as RoomType, RoomOrderConfig } from "./types";

// Types
type Role = "SURGEON" | "MAR" | "IADE";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
    specialty?: string;
};

type Room = {
    id: string;
    name: string;
    sector: "HYPERASEPTIQUE" | "SECTEUR_5_8" | "SECTEUR_9_12B" | "OPHTALMOLOGIE" | "ENDOSCOPIE";
    order?: number;
};

type DayAssignment = {
    id: string;
    roomId: string;
    surgeonId: string;
    marId?: string;
    iadeId?: string;
    date: string;
    period: "MORNING" | "AFTERNOON" | "FULL_DAY";
};

type SectorColors = {
    [key: string]: string;
};

// Mock data
const sectors: SectorColors = {
    HYPERASEPTIQUE: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
    SECTEUR_5_8: "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700",
    SECTEUR_9_12B: "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700",
    OPHTALMOLOGIE: "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-700",
    ENDOSCOPIE: "bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700",
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

// Mock data functions
const getMockUsers = (): User[] => [
    { id: "1", firstName: "Jean", lastName: "Dupont", role: "SURGEON", specialty: "Orthopédie" },
    { id: "2", firstName: "Marie", lastName: "Laurent", role: "SURGEON", specialty: "Cardiologie" },
    { id: "3", firstName: "Sophie", lastName: "Martin", role: "SURGEON", specialty: "Ophtalmologie" },
    { id: "4", firstName: "Paul", lastName: "Petit", role: "MAR" },
    { id: "5", firstName: "Claire", lastName: "Dubois", role: "MAR" },
    { id: "6", firstName: "Thomas", lastName: "Leroy", role: "IADE" },
    { id: "7", firstName: "Laure", lastName: "Garnier", role: "IADE" },
];

const getMockRooms = (): Room[] => [
    { id: "1", name: "Salle 1", sector: "HYPERASEPTIQUE" },
    { id: "2", name: "Salle 2", sector: "HYPERASEPTIQUE" },
    { id: "3", name: "Salle 5", sector: "SECTEUR_5_8" },
    { id: "4", name: "Salle 6", sector: "SECTEUR_5_8" },
    { id: "5", name: "Salle 7", sector: "SECTEUR_5_8" },
    { id: "6", name: "Salle 8", sector: "SECTEUR_5_8" },
    { id: "7", name: "Salle 9", sector: "SECTEUR_9_12B" },
    { id: "8", name: "Salle 10", sector: "SECTEUR_9_12B" },
    { id: "9", name: "Salle 11", sector: "SECTEUR_9_12B" },
    { id: "10", name: "Salle 12B", sector: "SECTEUR_9_12B" },
    { id: "11", name: "Salle Ophtalmo", sector: "OPHTALMOLOGIE" },
    { id: "12", name: "Salle Endo 1", sector: "ENDOSCOPIE" },
    { id: "13", name: "Salle Endo 2", sector: "ENDOSCOPIE" },
];

const getMockAssignments = (weekStartDate: Date): DayAssignment[] => {
    const assignments: DayAssignment[] = [];
    const days = eachDayOfInterval({ start: weekStartDate, end: endOfWeek(weekStartDate, { weekStartsOn: 1 }) });
    const rooms = getMockRooms();
    const users = getMockUsers();
    const surgeons = users.filter(u => u.role === "SURGEON");
    const mars = users.filter(u => u.role === "MAR");
    const iades = users.filter(u => u.role === "IADE");

    days.forEach((day) => {
        if (isWeekend(day)) return;

        rooms.forEach((room, roomIndex) => {
            const surgeonIndex = (roomIndex + day.getDate()) % surgeons.length;
            const marIndex = (roomIndex + day.getDate()) % mars.length;
            const iadeIndex = (roomIndex + day.getDate()) % iades.length;

            assignments.push({
                id: `${day.toISOString()}-${room.id}-morning`,
                roomId: room.id,
                surgeonId: surgeons[surgeonIndex].id,
                marId: mars[marIndex].id,
                iadeId: iades[iadeIndex].id,
                date: day.toISOString(),
                period: "MORNING",
            });

            if (Math.random() > 0.3) { // Not all rooms have afternoon assignments
                assignments.push({
                    id: `${day.toISOString()}-${room.id}-afternoon`,
                    roomId: room.id,
                    surgeonId: surgeons[(surgeonIndex + 1) % surgeons.length].id,
                    marId: mars[marIndex].id,
                    iadeId: iades[(iadeIndex + 1) % iades.length].id,
                    date: day.toISOString(),
                    period: "AFTERNOON",
                });
            }
        });
    });

    return assignments;
};

// Component
export default function WeeklyPlanningPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"ROOMS" | "SURGEONS">("ROOMS");
    const [showLegend, setShowLegend] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [compactView, setCompactView] = useState(false);

    // État pour le panneau de configuration
    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [displayConfig, setDisplayConfig] = useState<DisplayConfig>(defaultDisplayConfig);

    // État pour l'ordre personnalisé des salles
    const [roomOrderConfig, setRoomOrderConfig] = useState<RoomOrderConfig>({ orderedRoomIds: [] });

    // Paramètres d'affichage étendus - à supprimer après migration vers DisplayConfig
    const [nameFormat, setNameFormat] = useState<'full' | 'lastName' | 'firstName' | 'initials' | 'firstInitial-lastName' | 'nom' | 'nomPrenom' | 'prenom-nom' | 'nom-specialite' | 'initiale-nom'>('full');
    const [fontStyle, setFontStyle] = useState<'normal' | 'bold' | 'italic' | 'bold-italic'>('normal');
    const [fontSize, setFontSize] = useState('14px');
    const [showRoles, setShowRoles] = useState(true);

    // État pour stocker la configuration active
    const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
    const [visibleRoomIds, setVisibleRoomIds] = useState<string[]>([]);
    const [visiblePersonnelIds, setVisiblePersonnelIds] = useState<string[]>([]);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<DayAssignment[]>([]);

    // Remplacer l'utilisation de useTheme par un useState local
    const [theme, setTheme] = useState<'light' | 'dark'>(
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            : 'light'
    );

    // Load data
    useEffect(() => {
        setIsLoading(true);

        // Simuler un appel API pour les préférences de configuration
        const loadConfigPreferences = async () => {
            // Dans une implémentation réelle, cette données viendrait d'une API
            // Simulons pour le moment une configuration par défaut

            // Récupérer la configuration par défaut (on simule la récupération)
            const defaultConfig = {
                id: "1",
                roomIds: [] as string[], // vide = toutes les salles
                personnelIds: [] as string[], // vide = tout le personnel
                displaySettings: {
                    compactView: false,
                    nameFormat: 'full' as const,
                    fontStyle: 'normal' as const,
                    fontSize: '14px',
                    showRoles: true
                }
            };

            setActiveConfigId(defaultConfig.id);
            setVisibleRoomIds(defaultConfig.roomIds);
            setVisiblePersonnelIds(defaultConfig.personnelIds);

            // Appliquer les paramètres d'affichage
            setCompactView(defaultConfig.displaySettings.compactView);
            setNameFormat(defaultConfig.displaySettings.nameFormat);
            setFontStyle(defaultConfig.displaySettings.fontStyle);
            setFontSize(defaultConfig.displaySettings.fontSize);
            setShowRoles(defaultConfig.displaySettings.showRoles);
        };

        const fetchDataAndConfig = async () => {
            try {
                // Charger la configuration d'affichage
                await loadConfigPreferences();

                // Charger les données
                const fetchedUsers = getMockUsers();
                setUsers(fetchedUsers);

                const fetchedRooms = getMockRooms();

                // Appliquer l'ordre personnalisé des salles si disponible
                const orderedRooms = fetchedRooms.map(room => {
                    // Si la salle est dans l'ordre personnalisé, lui donner cet ordre
                    const orderIndex = roomOrderConfig.orderedRoomIds.indexOf(room.id);
                    if (orderIndex !== -1) {
                        return {
                            ...room,
                            order: orderIndex
                        };
                    }
                    return room;
                });

                // Trier les salles par ordre si défini, ou par secteur/nom par défaut
                const sortedRooms = [...orderedRooms].sort((a, b) => {
                    // Si les deux salles ont un ordre défini, les comparer
                    if (a.order !== undefined && b.order !== undefined) {
                        return a.order - b.order;
                    }
                    // Si seulement a a un ordre, le placer avant
                    if (a.order !== undefined) {
                        return -1;
                    }
                    // Si seulement b a un ordre, le placer avant
                    if (b.order !== undefined) {
                        return 1;
                    }
                    // Sinon, trier par secteur puis par nom
                    if (a.sector !== b.sector) {
                        return a.sector.localeCompare(b.sector);
                    }
                    return a.name.localeCompare(b.name);
                });

                setRooms(sortedRooms);

                const fetchedAssignments = getMockAssignments(currentWeekStart);
                setAssignments(fetchedAssignments);

                setIsLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setIsLoading(false);
            }
        };

        fetchDataAndConfig();
    }, [currentWeekStart, roomOrderConfig.orderedRoomIds]);

    // Fonction pour sauvegarder l'ordre des salles
    const handleSaveRoomOrder = (orderedRoomIds: (string | number)[]) => {
        // Convertir tous les IDs en string pour être cohérent
        const stringifiedIds = orderedRoomIds.map(id => String(id));

        // Mettre à jour la configuration de l'ordre des salles
        setRoomOrderConfig({ orderedRoomIds: stringifiedIds });

        // Enregistrer cet ordre dans le localStorage (ou l'API dans une implémentation réelle)
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomOrderConfig', JSON.stringify({ orderedRoomIds: stringifiedIds }));
        }

        // Notifier l'utilisateur
        alert('L\'ordre des salles a été sauvegardé avec succès !');
    };

    // Récupérer l'ordre des salles depuis le localStorage au chargement initial
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRoomOrder = localStorage.getItem('roomOrderConfig');
            if (savedRoomOrder) {
                try {
                    const parsedOrder = JSON.parse(savedRoomOrder) as RoomOrderConfig;
                    setRoomOrderConfig(parsedOrder);
                } catch (e) {
                    console.error('Erreur lors de la lecture de l\'ordre des salles :', e);
                }
            }
        }
    }, []);

    // Filter data based on search query AND configuration preferences
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isVisibleByConfig = visibleRoomIds.length === 0 || visibleRoomIds.includes(room.id);
        return matchesSearch && isVisibleByConfig;
    });

    const filteredSurgeons = users
        .filter(user => user.role === "SURGEON")
        .filter(surgeon => {
            const matchesSearch = `${surgeon.firstName} ${surgeon.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (surgeon.specialty && surgeon.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
            const isVisibleByConfig = visiblePersonnelIds.length === 0 || visiblePersonnelIds.includes(surgeon.id);
            return matchesSearch && isVisibleByConfig;
        });

    // Filtrer les assignations en fonction de la configuration
    const filteredAssignments = assignments.filter(assignment => {
        // Vérifier si la salle est visible selon la configuration
        const roomVisible = visibleRoomIds.length === 0 || visibleRoomIds.includes(assignment.roomId);

        // Vérifier si le chirurgien est visible selon la configuration
        const surgeonVisible = visiblePersonnelIds.length === 0 || visiblePersonnelIds.includes(assignment.surgeonId);

        // L'assignation est visible si la salle ET le chirurgien sont visibles
        return roomVisible && surgeonVisible;
    });

    // Fonction pour formater le nom selon le format choisi
    const formatName = (firstName: string, lastName: string, format: typeof nameFormat, specialty?: string): string => {
        // Support pour les anciens formats (à conserver pendant la migration)
        switch (format) {
            case 'full':
                return `${firstName} ${lastName}`;
            case 'lastName':
                return lastName;
            case 'firstName':
                return firstName;
            case 'initials':
                return `${firstName.charAt(0)}.${lastName.charAt(0)}.`;
            case 'firstInitial-lastName':
                return `${firstName.charAt(0)}. ${lastName}`;
            // Support pour les nouveaux formats du DisplayConfigPanel
            case 'nom':
                return lastName;
            case 'nomPrenom':
                return `${lastName} ${firstName}`;
            case 'prenom-nom':
                return `${firstName} ${lastName}`;
            case 'nom-specialite':
                return `${lastName}${specialty ? ` (${specialty})` : ''}`;
            case 'initiale-nom':
                return `${firstName.charAt(0)}. ${lastName}`;
            default:
                return `${firstName} ${lastName}`;
        }
    };

    // Fonction pour obtenir la classe CSS pour le style de police
    const getFontStyleClass = (style: typeof fontStyle): string => {
        switch (style) {
            case 'bold':
                return 'font-bold';
            case 'italic':
                return 'italic';
            case 'bold-italic':
                return 'font-bold italic';
            default:
                return '';
        }
    };

    // Navigation functions
    const goToPreviousWeek = () => {
        setCurrentWeekStart(prev => addWeeks(prev, -1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(prev => addWeeks(prev, 1));
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    // Helper functions
    const getUserById = (id: string) => users.find(user => user.id === id);
    const getRoomById = (id: string) => rooms.find(room => room.id === id);

    const getDailyAssignments = (date: Date, roomId: string) => {
        return filteredAssignments.filter(
            assignment =>
                new Date(assignment.date).toDateString() === date.toDateString() &&
                assignment.roomId === roomId
        );
    };

    const getWeekDays = () => {
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        }).filter(day => !isWeekend(day));
    };

    // Get assignments for a specific surgeon on a specific day
    const getSurgeonDailyAssignments = (date: Date, surgeonId: string) => {
        return filteredAssignments.filter(
            assignment =>
                new Date(assignment.date).toDateString() === date.toDateString() &&
                assignment.surgeonId === surgeonId
        );
    };

    // Render functions avec les nouveaux formats de nom et styles de police
    const renderAssignment = (assignment: DayAssignment) => {
        const surgeon = getUserById(assignment.surgeonId);
        const mar = assignment.marId ? getUserById(assignment.marId) : null;
        const iade = assignment.iadeId ? getUserById(assignment.iadeId) : null;
        const room = getRoomById(assignment.roomId);

        if (!surgeon || !room) return null;

        // Extraction du nom de couleur du secteur pour l'utiliser dans les classes d'opacité
        const sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';

        // Classe CSS pour le style de police
        const nameStyleClass = getFontStyleClass(fontStyle);

        return (
            <div
                key={assignment.id}
                className={`p-2 mb-1 rounded border ${assignment.period === "MORNING"
                    ? `${sectors[room.sector]} border-l-4`
                    : `${sectorColor} bg-opacity-40 dark:bg-opacity-30 border-r-4 border-${room.sector.toLowerCase()}`
                    }`}
            >
                <div className={`font-semibold text-sm ${nameStyleClass}`} style={{ fontSize }}>
                    {formatName(surgeon.firstName, surgeon.lastName, nameFormat, surgeon.specialty)}
                </div>

                {showRoles && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {mar && (
                            <span className={`text-xs px-1 rounded ${roleColors.MAR} ${nameStyleClass}`} style={{ fontSize: `calc(${fontSize} - 2px)` }}>
                                MAR: {formatName(mar.firstName, mar.lastName, nameFormat, mar.specialty)}
                            </span>
                        )}
                        {iade && (
                            <span className={`text-xs px-1 rounded ${roleColors.IADE} ${nameStyleClass}`} style={{ fontSize: `calc(${fontSize} - 2px)` }}>
                                IADE: {formatName(iade.firstName, iade.lastName, nameFormat, iade.specialty)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderRoomView = () => {
        const weekDays = getWeekDays();

        return (
            <div className={`mt-4 overflow-x-auto ${compactView ? 'scale-compact' : ''}`}>
                <table className={`min-w-full border-collapse ${compactView ? 'compact-table' : ''}`}>
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className={`py-2 px-3 border border-gray-300 dark:border-gray-700 text-left ${compactView ? 'compact-cell' : ''}`}>Salles</th>
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
                        {filteredRooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className={`py-2 px-3 border border-gray-300 dark:border-gray-700 ${sectors[room.sector]} font-medium ${compactView ? 'compact-cell' : ''}`}>
                                    {room.name}
                                </td>
                                {weekDays.map((day) => {
                                    const dayAssignments = getDailyAssignments(day, room.id);
                                    const morningAssignment = dayAssignments.find(a => a.period === "MORNING");
                                    const afternoonAssignment = dayAssignments.find(a => a.period === "AFTERNOON");

                                    return (
                                        <td key={day.toISOString()} className={`py-2 px-3 border border-gray-300 dark:border-gray-700 ${compactView ? 'compact-cell' : ''}`}>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    {morningAssignment && renderCompactAssignment(morningAssignment)}
                                                </div>
                                                <div className="flex-1">
                                                    {afternoonAssignment && renderCompactAssignment(afternoonAssignment)}
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

    // Nouvelle fonction pour rendre les assignations en fonction du mode (compact ou normal)
    const renderCompactAssignment = (assignment: DayAssignment) => {
        if (compactView) {
            return renderCompactVersionAssignment(assignment);
        }
        return renderAssignment(assignment);
    };

    // Version compacte de l'affichage des assignations
    const renderCompactVersionAssignment = (assignment: DayAssignment) => {
        const surgeon = getUserById(assignment.surgeonId);
        const room = getRoomById(assignment.roomId);

        if (!surgeon || !room) return null;

        // Extraction du nom de couleur du secteur pour l'utiliser dans les classes d'opacité
        const sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';

        return (
            <div
                key={assignment.id}
                className={`p-1 mb-1 rounded border text-xs ${assignment.period === "MORNING"
                    ? `${sectors[room.sector]} border-l-2`
                    : `${sectorColor} bg-opacity-40 dark:bg-opacity-30 border-r-2 border-${room.sector.toLowerCase()}`
                    }`}
            >
                <div className="font-medium text-xs truncate">
                    {surgeon.firstName.charAt(0)}. {surgeon.lastName}
                </div>
            </div>
        );
    };

    const renderSurgeonView = () => {
        const weekDays = getWeekDays();

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
                                    <div className={compactView ? 'text-xs' : ''}>{surgeon.firstName} {surgeon.lastName}</div>
                                    {surgeon.specialty && !compactView && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400">{surgeon.specialty}</div>
                                    )}
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

                                                        if (!room) return null;

                                                        return compactView ? (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-1 mb-1 rounded border text-xs ${sectors[room.sector]} border-l-2`}
                                                            >
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-2 mb-1 rounded border ${sectors[room.sector]} border-l-4`}
                                                            >
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Matin
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex-1">
                                                    {afternoonAssignments.map(assignment => {
                                                        const room = getRoomById(assignment.roomId);

                                                        if (!room) return null;

                                                        // Extraction du nom de couleur pour l'utiliser dans les classes d'opacité
                                                        const sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
                                                        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';

                                                        return compactView ? (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-1 mb-1 rounded border text-xs ${sectorColor} bg-opacity-40 dark:bg-opacity-30 border-r-2 border-${room.sector.toLowerCase()}`}
                                                            >
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                key={assignment.id}
                                                                className={`p-2 mb-1 rounded border ${sectorColor} bg-opacity-40 dark:bg-opacity-30 border-r-4 border-${room.sector.toLowerCase()}`}
                                                            >
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Après-midi
                                                                </div>
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

    // Pour remplacer les tooltips de react-tooltip, vous pouvez créer une simple infobulle avec useState
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

    // Pour basculer le thème, au lieu de setTheme('dark') ou setTheme('light')
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        // Si vous voulez aussi appliquer une classe au document pour le mode sombre
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'light');
        }
    };

    const getRoomsBySector = (sector: string) => {
        return rooms
            .filter(room => room.sector === sector)
            .sort((a, b) => {
                // Si les deux salles ont un ordre, les comparer
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                // Si seulement a a un ordre, le placer avant
                if (a.order !== undefined) {
                    return -1;
                }
                // Si seulement b a un ordre, le placer avant
                if (b.order !== undefined) {
                    return 1;
                }
                // Sinon, trier par nom
                return a.name.localeCompare(b.name);
            });
    };

    // Mise à jour de la configuration d'affichage
    const handleConfigChange = (newConfig: DisplayConfig) => {
        setDisplayConfig(newConfig);

        // Sauvegarder dans le localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('displayConfig', JSON.stringify(newConfig));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: .5 }}
            className="container mx-auto px-4 py-6"
        >
            <h1 className="text-2xl font-bold mb-4">Planning Hebdomadaire des Blocs Opératoires</h1>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Semaine précédente"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>

                    <div className="text-lg font-medium">
                        Semaine du {format(currentWeekStart, "dd/MM/yyyy", { locale: fr })} au{" "}
                        {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "dd/MM/yyyy", { locale: fr })}
                    </div>

                    <button
                        onClick={goToNextWeek}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Semaine suivante"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>

                    <button
                        onClick={goToCurrentWeek}
                        className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                        Aujourd'hui
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-2 items-center">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher..."
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                        />
                        <PencilIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                    </div>

                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => setViewMode("ROOMS")}
                            className={`px-4 py-2 text-sm rounded-l-md ${viewMode === "ROOMS"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Par Salles
                        </button>
                        <button
                            onClick={() => setViewMode("SURGEONS")}
                            className={`px-4 py-2 text-sm rounded-r-md ${viewMode === "SURGEONS"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Par Chirurgiens
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="compactView"
                            checked={compactView}
                            onChange={() => setCompactView(!compactView)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="compactView" className="text-sm text-gray-700 dark:text-gray-300">
                            Vue d'ensemble
                        </label>
                    </div>

                    <SimpleTooltip content="Aide">
                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative"
                        >
                            <InformationCircleIcon className="h-5 w-5" />
                        </button>
                    </SimpleTooltip>

                    <SimpleTooltip content="Configuration d'affichage">
                        <button
                            onClick={() => setShowConfigPanel(true)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative"
                        >
                            <Cog6ToothIcon className="h-5 w-5" />
                        </button>
                    </SimpleTooltip>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {viewMode === "ROOMS" ? renderRoomView() : renderSurgeonView()}

                    {searchQuery &&
                        (viewMode === "ROOMS" && filteredRooms.length === 0) ||
                        (viewMode === "SURGEONS" && filteredSurgeons.length === 0) ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            Aucun résultat trouvé pour "{searchQuery}"
                        </div>
                    ) : null}
                </>
            )}

            {showLegend && renderLegend()}

            {/* Panneau de configuration */}
            {showConfigPanel && (
                <DisplayConfigPanel
                    config={displayConfig}
                    onConfigChange={handleConfigChange}
                    onClose={() => setShowConfigPanel(false)}
                    users={users.map(u => ({
                        id: u.id,
                        nom: u.lastName,
                        prenom: u.firstName,
                        role: u.role === 'MAR' ? 'MAR' : u.role === 'IADE' ? 'IADE' : 'SURGEON',
                    }))}
                    surgeons={users
                        .filter(u => u.role === 'SURGEON')
                        .map(s => ({
                            id: s.id,
                            nom: s.lastName,
                            prenom: s.firstName,
                            specialite: s.specialty || '',
                        }))}
                    rooms={rooms.map(r => ({
                        id: r.id,
                        name: r.name,
                        sector: r.sector,
                        order: r.order,
                    }))}
                    onSaveRoomOrder={handleSaveRoomOrder}
                />
            )}

            {/* Styles pour la vue compacte */}
            <style jsx global>{`
                .scale-compact {
                    transform-origin: top left;
                }
                .compact-table {
                    font-size: 0.8rem;
                }
                .compact-cell {
                    padding: 0.25rem 0.5rem !important; 
                }
                @media (max-width: 1200px) {
                    .scale-compact {
                        transform: scale(0.9);
                        width: 111%;
                    }
                }
                @media (min-width: 1201px) {
                    .scale-compact {
                        transform: scale(0.85);
                        width: 118%;
                    }
                }
            `}</style>
        </motion.div>
    );
} 