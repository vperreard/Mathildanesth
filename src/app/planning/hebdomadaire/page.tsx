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
import { DragDropAssignmentEditor } from './components';
import { ApiService } from "@/services/api";
import {
    Assignment,
    DisplayConfig,
    Room,
    RoomOrderConfig,
    Surgeon,
    User,
} from './types';

// Import du panneau de configuration et des types associés
import DisplayConfigPanel, { defaultDisplayConfig } from "./DisplayConfigPanel";
// Importer les données mock depuis le fichier dédié
import { mockUsers, mockRooms, mockAssignments } from './mockData';

// Les constantes de style restent locales pour l'instant
const sectors: Record<string, string> = {
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

export default function WeeklyPlanningPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"room" | "surgeon">("room");
    const [showLegend, setShowLegend] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [compactView, setCompactView] = useState(false);

    // État pour le panneau de configuration
    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [displayConfig, setDisplayConfig] = useState<DisplayConfig | null>(null);

    // État pour l'ordre personnalisé des salles
    const [roomOrderConfig, setRoomOrderConfig] = useState<RoomOrderConfig>({ orderedRoomIds: [] });

    // État pour stocker la configuration active
    const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
    const [visibleRoomIds, setVisibleRoomIds] = useState<string[]>([]);
    const [visiblePersonnelIds, setVisiblePersonnelIds] = useState<string[]>([]);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // Remplacer l'utilisation de useTheme par un useState local
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Load data
    useEffect(() => {
        const fetchDataAndConfig = async () => {
            setIsLoading(true);
            let finalConfig = defaultDisplayConfig;
            try {
                const api = ApiService.getInstance();
                const configData = await api.getUserPreferences();
                // Valider ou fusionner configData avec defaultDisplayConfig si nécessaire
                if (configData && typeof configData === 'object') {
                    // Ici, on pourrait avoir une fonction de validation/fusion
                    // Pour l'instant, on suppose que configData est valide si elle existe
                    finalConfig = { ...defaultDisplayConfig, ...configData } as DisplayConfig;
                } else {
                    console.warn("Préférences utilisateur invalides reçues, utilisation des défauts.");
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la config d\'affichage:', error);
                // Utiliser config par défaut en cas d'erreur (401, 500, etc.)
            } finally {
                setDisplayConfig(finalConfig);
            }

            try {
                // Utiliser les données mock importées
                const fetchedUsers = mockUsers; // Utiliser mockUsers importés
                setUsers(fetchedUsers);

                const fetchedRooms = mockRooms; // Utiliser mockRooms importés
                let currentRoomOrder: string[] = [];
                if (typeof window !== 'undefined') {
                    const savedRoomOrder = localStorage.getItem('roomOrderConfig');
                    if (savedRoomOrder) {
                        try {
                            const parsedOrder = JSON.parse(savedRoomOrder);
                            if (parsedOrder && Array.isArray(parsedOrder.orderedRoomIds)) {
                                currentRoomOrder = parsedOrder.orderedRoomIds.map(String); // Assurer string[]
                                setRoomOrderConfig({ orderedRoomIds: currentRoomOrder });
                            } else {
                                console.warn("Format roomOrderConfig invalide dans localStorage.");
                            }
                        } catch (e) {
                            console.error('Erreur lecture roomOrderConfig:', e);
                        }
                    }
                }
                const orderedRooms = fetchedRooms.map(room => {
                    const orderIndex = currentRoomOrder.indexOf(String(room.id));
                    return { ...room, order: orderIndex === -1 ? Infinity : orderIndex }; // Gérer les salles non ordonnées
                });
                const sortedRooms = [...orderedRooms].sort((a, b) => {
                    if (a.order !== b.order) return a.order - b.order;
                    if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
                    return a.name.localeCompare(b.name);
                });
                setRooms(sortedRooms);

                const fetchedAssignments = mockAssignments; // Utiliser mockAssignments importés
                setAssignments(fetchedAssignments);

            } catch (error) {
                console.error('Erreur lors du chargement des données (users/rooms/assignments):', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDataAndConfig();
    }, [currentWeekStart]);

    // Fonction pour sauvegarder l'ordre des salles
    const handleSaveRoomOrder = (orderedRoomIds: string[]) => {
        const newConfig = { orderedRoomIds };
        setRoomOrderConfig(newConfig);
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomOrderConfig', JSON.stringify(newConfig));
        }
        // Mettre à jour l'ordre des salles dans l'état local immédiatement
        // Typage explicite pour 'room'
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
        alert('L\'ordre des salles a été sauvegardé avec succès !');
    };

    // Filter data based on search query AND configuration preferences
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isVisibleByConfig = !displayConfig?.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(room.id));
        return matchesSearch && isVisibleByConfig;
    });

    const filteredSurgeons = users
        .filter(user => user.role === "SURGEON")
        .filter(surgeon => {
            const matchesSearch = `${surgeon.prenom} ${surgeon.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
            const isVisibleByConfig = !displayConfig?.hiddenPersonnelIds || !displayConfig.hiddenPersonnelIds.includes(String(surgeon.id));
            return matchesSearch && isVisibleByConfig;
        });

    const filteredAssignments = assignments.filter(assignment => {
        const roomVisible = !displayConfig?.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(assignment.roomId));
        const surgeonVisible = !displayConfig?.hiddenPersonnelIds || !displayConfig.hiddenPersonnelIds.includes(String(assignment.surgeonId));
        return roomVisible && surgeonVisible;
    });

    // ========= Nouvelles fonctions utilitaires utilisant displayConfig =========

    const formatNameWithConfig = (person: User | null, role: 'chirurgien' | 'mar' | 'iade'): string => {
        if (!person || !displayConfig || !displayConfig.personnel || !displayConfig.personnel[role]) {
            return person ? `${person.prenom} ${person.nom}` : '';
        }

        // Adapter le type User local au type attendu par la logique de formatage
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

        // Définir le format de nom en fonction de la configuration disponible
        if (config.format) {
            // Utiliser le format spécifié directement
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

        // Appliquer le style de casse si configuré
        if (config.casse) {
            switch (config.casse) {
                case 'uppercase': name = name.toUpperCase(); break;
                case 'lowercase': name = name.toLowerCase(); break;
                case 'capitalize': name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); break;
                default: break;
            }
        }

        // Ajouter le préfixe de rôle si configuré
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

    // Fonction utilitaire pour déterminer la couleur du texte en fonction de la couleur d'arrière-plan
    const getTextColorForBackground = (backgroundColor: string): string => {
        // Convertir la couleur hex en RGB
        let hex = backgroundColor.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculer la luminosité (formule standard)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Si la luminance est élevée (couleur claire), utiliser du texte foncé, sinon du texte clair
        return luminance > 0.5 ? '#000000' : '#ffffff';
    };

    const getStyleWithConfig = (assignment: Assignment | null | undefined): React.CSSProperties => {
        if (!assignment) {
            return {
                backgroundColor: "#e5e7eb", // Couleur grise par défaut
                color: "#374151"
            };
        }

        const surgeonId = assignment.surgeonId;
        if (!surgeonId || !displayConfig || !displayConfig.couleurs || !displayConfig.couleurs.chirurgiens) {
            return {
                backgroundColor: "#e5e7eb",
                color: "#374151"
            }; // Style par défaut si pas de configuration
        }

        const surgeonColorMap = displayConfig.couleurs.chirurgiens;
        const color = surgeonColorMap[surgeonId] || "#e5e7eb"; // Couleur par défaut si pas de correspondance

        return {
            backgroundColor: color,
            color: getTextColorForBackground(color)
        };
    };

    // =====================================================================

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
        const stringRoomId = String(roomId);
        return filteredAssignments.filter(
            assignment =>
                new Date(assignment.date).toDateString() === date.toDateString() &&
                String(assignment.roomId) === stringRoomId
        );
    };

    const getWeekDays = () => {
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        }).filter(day => !isWeekend(day));
    };

    // Get assignments for a specific surgeon on a specific day
    const getSurgeonDailyAssignments = (date: Date, surgeonId: string | number) => {
        const stringSurgeonId = String(surgeonId);
        return filteredAssignments.filter(
            assignment =>
                new Date(assignment.date).toDateString() === date.toDateString() &&
                String(assignment.surgeonId) === stringSurgeonId
        );
    };

    // Render functions avec les nouveaux formats de nom et styles de police
    const renderAssignment = (assignment: Assignment) => {
        const surgeon = getUserById(assignment.surgeonId);
        const mar = assignment.marId ? getUserById(assignment.marId) : null;
        const iade = assignment.iadeId ? getUserById(assignment.iadeId) : null;
        const room = getRoomById(assignment.roomId);

        // Vérifier si les données essentielles sont présentes
        if (!surgeon || !room) return null;

        // Styles et formatage depuis displayConfig (avec vérification de sécurité)
        const surgeonStyle = getStyleWithConfig(assignment);
        const marStyle = getStyleWithConfig(assignment);
        const iadeStyle = getStyleWithConfig(assignment);

        const sectorColorMatch = sectors[room.sector]?.match(/(bg-\w+-\d+)/);
        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : 'bg-gray-100'; // Fallback color

        // Appliquer l'opacité de fond configurée avec vérification de sécurité
        const opacityValue = displayConfig?.backgroundOpacity ? Math.round(displayConfig.backgroundOpacity * 100) : 50;
        const cardBgStyle = assignment.period === "MORNING"
            ? sectors[room.sector]
            : `${sectorColor} bg-opacity-${opacityValue} dark:bg-opacity-${opacityValue}`;

        return (
            <div
                key={assignment.id}
                className={`p-2 mb-1 rounded border ${cardBgStyle}`}
            >
                {/* Chirurgien */}
                <div style={surgeonStyle}>
                    {formatNameWithConfig(surgeon, 'chirurgien')}
                </div>

                {/* MAR et IADE */}
                <div className="flex flex-wrap gap-1 mt-1">
                    {mar && (
                        <span style={marStyle}>
                            {formatNameWithConfig(mar, 'mar')}
                        </span>
                    )}
                    {iade && (
                        <span style={iadeStyle} className={mar ? 'ml-2' : ''}> {/* Ajoute marge si MAR présent */}
                            {formatNameWithConfig(iade, 'iade')}
                        </span>
                    )}
                </div>
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
    const renderCompactAssignment = (assignment: Assignment) => {
        if (compactView) {
            return renderCompactVersionAssignment(assignment);
        }
        return renderAssignment(assignment);
    };

    // Version compacte de l'affichage des assignations
    const renderCompactVersionAssignment = (assignment: Assignment) => {
        const surgeon = getUserById(assignment.surgeonId);
        const room = getRoomById(assignment.roomId);

        if (!surgeon || !room) return null;

        // Utiliser la config pour le style (partiellement ou totalement)
        const surgeonStyle = getStyleWithConfig(assignment);

        // Pour la vue compacte, on peut choisir de forcer une petite taille
        // ou utiliser celle de la config. Utilisons celle de la config pour l'instant.
        // surgeonStyle.fontSize = '0.75rem'; // Forcer taille xs

        const sectorColorMatch = sectors[room.sector]?.match(/(bg-\w+-\d+)/);
        const sectorColor = sectorColorMatch ? sectorColorMatch[1] : 'bg-gray-100';

        // Appliquer l'opacité configurée (avec vérification de sécurité)
        const opacityValue = displayConfig?.backgroundOpacity ? Math.round(displayConfig.backgroundOpacity * 100) : 50;
        const cardBgStyle = assignment.period === "MORNING"
            ? sectors[room.sector]
            : `${sectorColor} bg-opacity-${opacityValue} dark:bg-opacity-${opacityValue}`;

        return (
            <div
                key={assignment.id}
                className={`p-1 mb-1 rounded border text-xs ${cardBgStyle}`}
            >
                {/* Utiliser le style et format configurés */}
                <div style={surgeonStyle} className="truncate">
                    {formatNameWithConfig(surgeon, 'chirurgien')}
                </div>
            </div>
        );
    };

    const renderSurgeonView = () => {
        const weekDays = getWeekDays();

        // Ajout de la condition pour retourner early
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
                                    {/* Formater nom chirurgien avec config */}
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
                                                                {/* Optionnel: afficher MAR/IADE en compact ? */}
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
                                                                {/* Afficher MAR/IADE avec config */}
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
                                                        // Vérification de sécurité pour displayConfig
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
                                                                {/* Optionnel: afficher MAR/IADE en compact ? */}
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
                                                                {/* Afficher MAR/IADE avec config */}
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

    // Mise à jour de la configuration d'affichage via API
    const handleConfigChange = async (newConfig: DisplayConfig) => {
        setDisplayConfig(newConfig);
        setShowConfigPanel(false);
        // Sauvegarder la configuration via API
        try {
            const api = ApiService.getInstance();
            // Correction: Commenter car la méthode n'existe pas
            // await api.saveUserPreferences(newConfig);
            console.log("Sauvegarde API désactivée (méthode saveUserPreferences non implémentée).");
            // Afficher une notification de succès
            console.log("Préférences sauvegardées localement");
        } catch (error) {
            console.error("Erreur sauvegarde préférences via API (appel désactivé):", error);
            // Afficher une notification d'erreur
        }
    };

    // Correction du problème setState during render en déplaçant les logiques de setState dans des useEffect
    // Création d'un nouvel useEffect pour initialiser les états après le chargement des données
    useEffect(() => {
        // Ne faire ces traitements que si les données sont chargées
        if (!isLoading && rooms.length > 0) {
            // Initialiser les salles visibles (toutes les salles par défaut)
            if (visibleRoomIds.length === 0) {
                // Correction: Convertir ID en string
                setVisibleRoomIds(rooms.map(room => String(room.id)));
            }

            // Initialiser les personnels visibles (tous les chirurgiens par défaut)
            if (visiblePersonnelIds.length === 0) {
                const surgeonIds = users
                    .filter(user => user.role === "SURGEON")
                    // Correction: Convertir ID en string
                    .map(user => String(user.id));
                setVisiblePersonnelIds(surgeonIds);
            }
        }
    }, [isLoading, rooms, users, visibleRoomIds.length, visiblePersonnelIds.length]);

    // Modification de useEffect pour le chargement de la config d'affichage
    useEffect(() => {
        const loadDefaultConfig = () => {
            if (!displayConfig) {
                console.log("Chargement de la configuration par défaut");
                setDisplayConfig(defaultDisplayConfig);
            }
        };

        // Si l'API échoue, charger la config par défaut après un délai
        const timer = setTimeout(loadDefaultConfig, 3000);

        // Nettoyer le timer si le composant est démonté ou si displayConfig est chargé entre-temps
        return () => clearTimeout(timer);
    }, [displayConfig]);

    // Ajouter un useEffect séparé pour la gestion du thème (pour éviter les setState during render)
    useEffect(() => {
        const handleThemeChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Écouter les changements de thème du système
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else {
            // Fallback pour les anciens navigateurs
            mediaQuery.addListener(handleThemeChange);
        }

        // Cleanup
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleThemeChange);
            } else {
                // Fallback pour les anciens navigateurs
                mediaQuery.removeListener(handleThemeChange);
            }
        };
    }, []);

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
                            onClick={() => setViewMode("room")}
                            className={`px-4 py-2 text-sm rounded-l-md ${viewMode === "room"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Par Salles
                        </button>
                        <button
                            onClick={() => setViewMode("surgeon")}
                            className={`px-4 py-2 text-sm rounded-r-md ${viewMode === "surgeon"
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
                    {viewMode === "room" ? renderRoomView() : renderSurgeonView()}

                    {searchQuery &&
                        (viewMode === "room" && filteredRooms.length === 0) ||
                        (viewMode === "surgeon" && filteredSurgeons.length === 0) ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            Aucun résultat trouvé pour "{searchQuery}"
                        </div>
                    ) : null}
                </>
            )}

            {showLegend && renderLegend()}

            {/* Panneau de configuration */}
            {showConfigPanel && displayConfig && (
                <DisplayConfigPanel
                    config={displayConfig}
                    onConfigChange={handleConfigChange}
                    onClose={() => setShowConfigPanel(false)}
                    users={users.map(u => ({
                        id: u.id,
                        nom: u.nom,
                        prenom: u.prenom,
                        role: u.role === 'MAR' ? 'MAR' : u.role === 'IADE' ? 'IADE' : 'SURGEON',
                    }))}
                    surgeons={users
                        .filter(u => u.role === 'SURGEON')
                        .map(s => ({
                            id: s.id,
                            nom: s.nom,
                            prenom: s.prenom,
                            specialite: s.specialty || '',
                        }))}
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