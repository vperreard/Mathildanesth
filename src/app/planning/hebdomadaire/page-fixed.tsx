"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { logger } from "../../../lib/logger";
// TODO: Replace @heroicons with lucide-react
import { format, addWeeks, startOfWeek, endOfWeek, isToday, isWeekend, eachDayOfInterval, getISOWeek, isAfter, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Attribution,
    DisplayConfig,
    Room,
    RoomOrderConfig,
    Surgeon,
    User,
} from './types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { RuleEngine, RuleEvaluationSummary } from '@/modules/rules/engine/rule-engine';
import { RuleEvaluationResult, RuleEvaluationContext, RuleSeverity as RuleEngineSeverity } from '@/modules/rules/types/rule';
import { AssignmentType } from '@/types/attribution';
import { ShiftType } from '@/types/common';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import DisplayConfigPanel from "./DisplayConfigPanel";
import { defaultDisplayConfig } from "./defaultConfig";
import { toast } from "react-hot-toast";
import SiteSelector, { Site as SiteType } from "@/components/ui/site-selector";

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

// Memoized Attribution Card component (or representation)
const MemoizedAssignment = memo(({ attribution, users }: { attribution: Attribution; users: User[] }) => {
    const user = users.find(u => u.id === attribution.userId);
    return (
        <div className="p-1 mb-1 border rounded bg-gray-100 text-xs shadow-sm">
            {user ? `${user.firstName} ${user.lastName}` : `Utilisateur ID: ${attribution.userId}`}
            {/* Ajouter d'autres détails si nécessaire */}
        </div>
    );
});
MemoizedAssignment.displayName = 'MemoizedAssignment';

// Fonction pour obtenir le numéro de la semaine
const getWeekNumber = (date: Date): number => {
    return getISOWeek(date);
};

// Type pour les données d'API de salle
interface ApiRoomData {
    id: string;
    name?: string;
    number?: string;
    colorCode?: string;
    siteId?: string | number;
    displayOrder?: number | null;
    operatingSector?: {
        name?: string;
        colorCode?: string;
        displayOrder?: number | null;
    };
    sector?: string | {
        name?: string;
        colorCode?: string;
        displayOrder?: number | null;
    };
}

export default function WeeklyPlanningPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    // Nouveaux états pour la plage de dates personnalisée
    const [activeDateRangeType, setActiveDateRangeType] = useState<'week' | 'custom'>('week');
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
    // État pour le sélecteur de plage de dates
    const [isDateRangeSelectorOpen, setIsDateRangeSelectorOpen] = useState(false);

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
    const [attributions, setAssignments] = useState<Attribution[]>([]);
    const [tempAssignments, setTempAssignments] = useState<Attribution[]>([]);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
    const [pendingChangesDiff, setPendingChangesDiff] = useState<string[]>([]);

    // Remplacer l'état des sites
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [sitesList, setSitesList] = useState<SiteType[]>([]);

    const ruleEngine = useMemo(() => new RuleEngine(), []);

    const searchParams = useSearchParams();
    const router = useRouter();

    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [isLoadingData, setIsLoadingData] = useState(true);

    // État pour stocker le type Site (à définir plus précisément)
    interface Site {
        id: string;
        name: string;
        description?: string;
    }

    // Filtrer les salles en fonction du site sélectionné, de la recherche et de la configuration d'affichage
    const filteredRooms = useMemo(() => {
        logger.info(`[WeeklyPlanningPage_filteredRooms] Calcul pour selectedSiteId: ${selectedSiteId}, ${rooms.length} salles au total avant filtre.`);
        let result = rooms;

        // 1. Filtre par site sélectionné
        if (selectedSiteId) {
            result = result.filter(room => {
                // Assurer que room.siteId existe et comparer les chaînes de caractères
                const roomSiteIdStr = room.siteId ? String(room.siteId) : null;
                const selectedSiteIdStr = String(selectedSiteId);
                const match = roomSiteIdStr === selectedSiteIdStr;
                // logger.info(`[DEBUG_FILTER_ROOM] Room: ${room.name} (ID: ${room.id}), RoomSiteID: ${roomSiteIdStr}, SelectedSiteID: ${selectedSiteIdStr}, Match: ${match}`);
                return match;
            });
        }

        // 2. Filtre par searchQuery et displayConfig
        result = result.filter(room => {
            const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
            const isVisibleByConfig = !displayConfig || !displayConfig.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(room.id));
            return matchesSearch && isVisibleByConfig;
        });
        logger.info(`[WeeklyPlanningPage_filteredRooms] ${result.length} salles après filtre pour siteId: ${selectedSiteId}.`);
        return result;
    }, [rooms, selectedSiteId, searchQuery, displayConfig]);

    // Filtrer les assignations en fonction des salles filtrées
    const filteredAssignments = useMemo(() => {
        if (!selectedSiteId) {
            return tempAssignments; // Pas de filtre si aucun site n'est sélectionné
        }
        const currentFilteredRoomIds = new Set(filteredRooms.map(room => room.id));
        return tempAssignments.filter(attribution => currentFilteredRoomIds.has(attribution.roomId));
    }, [tempAssignments, filteredRooms, selectedSiteId]);

    // Fonction de chargement des données, appelée manuellement
    const fetchDataAndConfig = useCallback(async () => {
        logger.info("[WeeklyPlanningPage] Chargement des données pour la période cible");
        setIsLoadingData(true);
        setIsLoading(true);
        // let finalConfig = { ...defaultDisplayConfig }; // Commenté car non utilisé directement ici
        // logger.info("[WeeklyPlanningPage] finalConfig :", finalConfig);

        try {
            // Déterminer la plage de dates active
            let startDate: Date;
            let endDate: Date;

            if (activeDateRangeType === 'custom' && customStartDate && customEndDate) {
                startDate = customStartDate;
                endDate = customEndDate;
            } else {
                startDate = currentWeekStart;
                endDate = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            }

            logger.info(`[WeeklyPlanningPage] Période : ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`);

            // Remplacer les appels fetch par apiClient
            const [
                usersResponse,
                roomsResponse,
                assignmentsResponse,
                sitesResponse
            ] = await Promise.all([
                apiClient.get('/api/utilisateurs'),
                apiClient.get('/api/operating-rooms'), // Temporairement sans siteId pour tout récupérer
                apiClient.get(`/api/affectations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
                apiClient.get('/api/sites')
            ]);

            // Les données sont directement dans .data avec axios
            const usersResponseData = usersResponse.data;
            const roomsResponseData = roomsResponse.data;
            const assignmentsResponseData = assignmentsResponse.data;
            const sitesResponseData = sitesResponse.data;

            logger.info("[WeeklyPlanningPage] Données API (via apiClient) - Utilisateurs:", usersResponseData);
            logger.info("[WeeklyPlanningPage] Données API (via apiClient) - Salles:", roomsResponseData);
            logger.info("[WeeklyPlanningPage] Données API (via apiClient) - Assignations:", assignmentsResponseData);
            logger.info("[WeeklyPlanningPage] Données API (via apiClient) - Sites:", sitesResponseData);

            const usersData = Array.isArray(usersResponseData) ? usersResponseData :
                (usersResponseData && Array.isArray(usersResponseData.users) ? usersResponseData.users : []);

            const roomsData = Array.isArray(roomsResponseData) ? roomsResponseData :
                (roomsResponseData && Array.isArray(roomsResponseData.rooms) ? roomsResponseData.rooms : []);

            const assignmentsData = Array.isArray(assignmentsResponseData) ? assignmentsResponseData :
                (assignmentsResponseData && Array.isArray(assignmentsResponseData.attributions) ? assignmentsResponseData.attributions : []);

            const sitesDataList = Array.isArray(sitesResponseData) ? sitesResponseData :
                (sitesResponseData && Array.isArray(sitesResponseData.sites) ? sitesResponseData.sites : []);

            setUsers(usersData);
            logger.info("[WeeklyPlanningPage] état users mis à jour avec:", usersData.length, "utilisateurs");

            setSitesList(sitesDataList); // Mise à jour de l'état des sites
            logger.info("[WeeklyPlanningPage] état sitesList mis à jour avec:", sitesDataList.length, "sites");

            const fetchedRooms = roomsData;
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
                    } catch (e: unknown) {
                        logger.error('[WeeklyPlanningPage] Erreur lecture roomOrderConfig localStorage:', { error: e });
                    }
                }
            }

            // Normaliser les données des salles
            const orderedRooms = fetchedRooms.map((apiRoomData: ApiRoomData) => {
                let sectorName = 'Sans secteur'; // Valeur par défaut
                const roomColor = apiRoomData.colorCode || '#E5E7EB'; // Couleur de la salle elle-même
                let sectorColor = '#F3F4F6'; // Couleur de fond par défaut pour l'en-tête de secteur (gris très clair)
                let sectorOrder = Infinity; // Ordre par défaut pour le secteur

                if (apiRoomData.operatingSector && typeof apiRoomData.operatingSector === 'object') {
                    if (apiRoomData.operatingSector.name) {
                        sectorName = apiRoomData.operatingSector.name;
                    }
                    if (apiRoomData.operatingSector.colorCode) {
                        sectorColor = apiRoomData.operatingSector.colorCode;
                    }
                    if (apiRoomData.operatingSector.displayOrder !== undefined && apiRoomData.operatingSector.displayOrder !== null) {
                        sectorOrder = apiRoomData.operatingSector.displayOrder;
                    }
                } else if (typeof apiRoomData.sector === 'string' && apiRoomData.sector.trim() !== '') {
                    sectorName = apiRoomData.sector;
                } else if (apiRoomData.sector && typeof apiRoomData.sector === 'object' && apiRoomData.sector.name) {
                    sectorName = apiRoomData.sector.name;
                    if (apiRoomData.sector.colorCode) {
                        sectorColor = apiRoomData.sector.colorCode;
                    }
                    // Essayer de récupérer l'ordre du secteur depuis cet objet aussi, si la structure le permet
                    if (apiRoomData.sector.displayOrder !== undefined && apiRoomData.sector.displayOrder !== null) {
                        sectorOrder = apiRoomData.sector.displayOrder;
                    }
                }

                const orderIndex = currentRoomOrder.indexOf(String(apiRoomData.id));
                const baseOrder = apiRoomData.displayOrder !== undefined && apiRoomData.displayOrder !== null ? apiRoomData.displayOrder : Infinity;

                const normalizedRoom: Room = {
                    id: apiRoomData.id,
                    name: apiRoomData.name || '',
                    number: apiRoomData.number || undefined,
                    sector: sectorName,
                    colorCode: roomColor, // Couleur de la salle (peut être utilisée pour la carte de la salle plus tard)
                    sectorColorCode: sectorColor, // Couleur pour l'en-tête du groupement de secteur
                    order: orderIndex === -1 ? baseOrder : orderIndex,
                    siteId: apiRoomData.siteId ? String(apiRoomData.siteId) : undefined,
                    sectorDisplayOrder: sectorOrder, // Stocker l'ordre du secteur
                };

                return normalizedRoom;
            }).sort((a, b) => {
                // D'abord trier par sectorDisplayOrder
                if (a.sectorDisplayOrder !== b.sectorDisplayOrder) {
                    return a.sectorDisplayOrder - b.sectorDisplayOrder;
                }
                // Ensuite par ordre de salle
                return a.order - b.order;
            });

            setRooms(orderedRooms);
            logger.info("[WeeklyPlanningPage] état rooms mis à jour avec:", orderedRooms.length, "salles");

            // Normaliser les assignations
            const normalizedAssignments = assignmentsData.map((apiAssignment: any) => ({
                id: apiAssignment.id,
                userId: apiAssignment.userId,
                roomId: apiAssignment.roomId,
                date: new Date(apiAssignment.date),
                shiftType: apiAssignment.shiftType || 'JOUR',
                assignmentType: apiAssignment.assignmentType || 'AFFECTATION',
                isLocked: apiAssignment.isLocked || false,
                metadata: apiAssignment.metadata || {},
                created: apiAssignment.created ? new Date(apiAssignment.created) : new Date(),
                updated: apiAssignment.updated ? new Date(apiAssignment.updated) : new Date(),
            }));

            setAssignments(normalizedAssignments);
            setTempAssignments(normalizedAssignments);
            logger.info("[WeeklyPlanningPage] état attributions mis à jour avec:", normalizedAssignments.length, "assignations");

            // Réinitialiser les changements en attente
            setHasPendingChanges(false);
            setPendingChangesDiff([]);

        } catch (error) {
            logger.error("[WeeklyPlanningPage] Erreur lors du chargement des données:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setIsLoadingData(false);
            setIsLoading(false);
        }
    }, [currentWeekStart, activeDateRangeType, customStartDate, customEndDate]);

    // Effet pour charger les données lors du montage et des changements de période
    useEffect(() => {
        fetchDataAndConfig();
    }, [fetchDataAndConfig]);

    // Fonction pour naviguer entre les semaines
    const navigateWeek = (direction: 'prev' | 'next') => {
        if (activeDateRangeType === 'week') {
            setCurrentWeekStart(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
        }
    };

    // Fonction pour revenir à la semaine courante
    const goToCurrentWeek = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
        setActiveDateRangeType('week');
    };

    // Validation des assignations
    const validateAssignments = useCallback(() => {
        try {
            const context: RuleEvaluationContext = {
                assignments: tempAssignments,
                users,
                rooms,
                date: currentWeekStart,
                timeRange: {
                    start: currentWeekStart,
                    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
                }
            };

            const result = ruleEngine.evaluate(context);
            
            // Transformer le résultat en ValidationResult
            const validationResult: ValidationResult = {
                valid: result.isValid,
                violations: result.violations.map(v => ({
                    id: v.id,
                    type: v.ruleId,
                    severity: mapRuleSeverity(v.severity),
                    message: v.message,
                    affectedAssignments: v.affectedEntities || []
                })),
                metrics: {
                    equiteScore: result.summary?.averageScore || 0,
                    fatigueScore: 100 - (result.summary?.violationsByCategory?.fatigue || 0) * 10,
                    satisfactionScore: 100 - (result.summary?.totalViolations || 0) * 5
                }
            };

            setValidationResult(validationResult);
            return validationResult;
        } catch (error) {
            logger.error("Erreur lors de la validation:", error);
            return null;
        }
    }, [tempAssignments, users, rooms, currentWeekStart, ruleEngine]);

    // Mapper la sévérité des règles
    const mapRuleSeverity = (severity: RuleEngineSeverity): AssignmentRuleSeverity => {
        switch (severity) {
            case 'critical':
                return AssignmentRuleSeverity.CRITICAL;
            case 'high':
                return AssignmentRuleSeverity.MAJOR;
            case 'medium':
                return AssignmentRuleSeverity.MINOR;
            case 'low':
                return AssignmentRuleSeverity.INFO;
            default:
                return AssignmentRuleSeverity.INFO;
        }
    };

    // Sauvegarder les changements
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Validation avant sauvegarde
            const validation = validateAssignments();
            if (validation && !validation.valid && validation.violations.some(v => v.severity === AssignmentRuleSeverity.CRITICAL)) {
                setIsConfirmationDialogOpen(true);
                setIsSaving(false);
                return;
            }

            // Sauvegarder les changements via l'API
            const response = await apiClient.put('/api/affectations/batch', {
                assignments: tempAssignments
            });

            if (response.data.success) {
                setAssignments(tempAssignments);
                setHasPendingChanges(false);
                setPendingChangesDiff([]);
                toast.success("Changements sauvegardés avec succès");
            }
        } catch (error) {
            logger.error("Erreur lors de la sauvegarde:", error);
            toast.error("Erreur lors de la sauvegarde des changements");
        } finally {
            setIsSaving(false);
        }
    };

    // Annuler les changements
    const handleCancelChanges = () => {
        setTempAssignments(attributions);
        setHasPendingChanges(false);
        setPendingChangesDiff([]);
        setValidationResult(null);
        toast.info("Changements annulés");
    };

    // Gestion du drag and drop
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        
        // Parser les IDs
        const [assignmentId, sourceRoomId, sourceDateStr] = source.droppableId.split('-');
        const [, destRoomId, destDateStr] = destination.droppableId.split('-');

        // Trouver l'assignation
        const assignmentToMove = tempAssignments.find(a => a.id === draggableId);
        if (!assignmentToMove) return;

        // Créer une nouvelle assignation mise à jour
        const updatedAssignment: Attribution = {
            ...assignmentToMove,
            roomId: destRoomId,
            date: new Date(destDateStr),
            updated: new Date()
        };

        // Mettre à jour les assignations temporaires
        const updatedAssignments = tempAssignments.map(a => 
            a.id === assignmentToMove.id ? updatedAssignment : a
        );

        setTempAssignments(updatedAssignments);
        setHasPendingChanges(true);

        // Ajouter au diff
        const changeDescription = `Déplacement de ${assignmentToMove.userId} de la salle ${sourceRoomId} vers ${destRoomId}`;
        setPendingChangesDiff(prev => [...prev, changeDescription]);

        // Valider automatiquement
        validateAssignments();
    };

    // Obtenir les jours de la semaine affichée
    const weekDays = useMemo(() => {
        if (activeDateRangeType === 'custom' && customStartDate && customEndDate) {
            return eachDayOfInterval({ start: customStartDate, end: customEndDate });
        }
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        });
    }, [currentWeekStart, activeDateRangeType, customStartDate, customEndDate]);

    // Filtrer les utilisateurs selon la vue et la recherche
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
            const isVisible = !displayConfig || !displayConfig.hiddenPersonnelIds || !displayConfig.hiddenPersonnelIds.includes(user.id);
            return matchesSearch && isVisible;
        });
    }, [users, searchQuery, displayConfig]);

    // Grouper les salles par secteur
    const roomsBySector = useMemo(() => {
        const grouped = new Map<string, Room[]>();
        
        filteredRooms.forEach(room => {
            const sector = room.sector || 'Sans secteur';
            if (!grouped.has(sector)) {
                grouped.set(sector, []);
            }
            grouped.get(sector)!.push(room);
        });

        // Trier les secteurs selon sectorDisplayOrder
        return new Map([...grouped.entries()].sort((a, b) => {
            const firstRoomA = a[1][0];
            const firstRoomB = b[1][0];
            return (firstRoomA?.sectorDisplayOrder || Infinity) - (firstRoomB?.sectorDisplayOrder || Infinity);
        }));
    }, [filteredRooms]);

    // Rendu du composant
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du planning...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Planning Hebdomadaire
                            </h1>
                            <Badge variant="outline" className="ml-4">
                                Semaine {getWeekNumber(currentWeekStart)}
                            </Badge>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Sélecteur de site */}
                            <SiteSelector
                                sites={sitesList}
                                selectedSiteId={selectedSiteId}
                                onSiteChange={setSelectedSiteId}
                            />

                            {/* Navigation semaine */}
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={() => navigateWeek('prev')}
                                    variant="outline"
                                    size="sm"
                                    disabled={activeDateRangeType === 'custom'}
                                >
                                    Semaine précédente
                                </Button>
                                <Button
                                    onClick={goToCurrentWeek}
                                    variant="outline"
                                    size="sm"
                                >
                                    Semaine actuelle
                                </Button>
                                <Button
                                    onClick={() => navigateWeek('next')}
                                    variant="outline"
                                    size="sm"
                                    disabled={activeDateRangeType === 'custom'}
                                >
                                    Semaine suivante
                                </Button>
                            </div>

                            {/* Bouton configuration */}
                            <Button
                                onClick={() => setShowConfigPanel(true)}
                                variant="outline"
                                size="sm"
                            >
                                {/* Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" */}
                                Configuration
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Barre de validation et actions */}
            {hasPendingChanges && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Badge variant="warning" className="mr-3">
                                    {pendingChangesDiff.length} changement(s) en attente
                                </Badge>
                                {validationResult && !validationResult.valid && (
                                    <Badge variant="destructive">
                                        {validationResult.violations.length} violation(s) détectée(s)
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <Button
                                    onClick={handleCancelChanges}
                                    variant="outline"
                                    size="sm"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSaveChanges}
                                    variant="default"
                                    size="sm"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu principal */}
            <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        {/* En-tête avec les jours */}
                        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 dark:border-gray-700">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900"></div>
                            {weekDays.map(day => (
                                <div
                                    key={day.toISOString()}
                                    className={`p-4 text-center border-l border-gray-200 dark:border-gray-700 ${
                                        isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : 
                                        isWeekend(day) ? 'bg-gray-50 dark:bg-gray-900' : ''
                                    }`}
                                >
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                        {format(day, 'EEEE', { locale: fr })}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {format(day, 'd MMM', { locale: fr })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Corps du planning */}
                        {viewMode === 'room' ? (
                            // Vue par salle
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {Array.from(roomsBySector).map(([sector, sectorRooms]) => (
                                    <div key={sector}>
                                        {/* En-tête de secteur */}
                                        <div 
                                            className="grid grid-cols-8 gap-0 bg-gray-50 dark:bg-gray-900"
                                            style={{ backgroundColor: sectorRooms[0]?.sectorColorCode || '#F3F4F6' }}
                                        >
                                            <div className="p-2 col-span-8">
                                                <h3 className="font-semibold text-sm">{sector}</h3>
                                            </div>
                                        </div>
                                        
                                        {/* Salles du secteur */}
                                        {sectorRooms.map(room => (
                                            <div key={room.id} className="grid grid-cols-8 gap-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                                    <div className="font-medium text-sm">{room.name}</div>
                                                    {room.number && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            N°{room.number}
                                                        </div>
                                                    )}
                                                </div>
                                                {weekDays.map(day => {
                                                    const droppableId = `room-${room.id}-${format(day, 'yyyy-MM-dd')}`;
                                                    const dayAssignments = filteredAssignments.filter(
                                                        a => a.roomId === room.id && 
                                                        format(a.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                                                    );

                                                    return (
                                                        <Droppable key={droppableId} droppableId={droppableId}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className={`p-2 min-h-[100px] border-l border-gray-200 dark:border-gray-700 ${
                                                                        snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                                    }`}
                                                                >
                                                                    {dayAssignments.map((assignment, index) => (
                                                                        <Draggable
                                                                            key={assignment.id}
                                                                            draggableId={assignment.id}
                                                                            index={index}
                                                                        >
                                                                            {(provided, snapshot) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    className={`mb-1 ${
                                                                                        snapshot.isDragging ? 'opacity-50' : ''
                                                                                    }`}
                                                                                >
                                                                                    <MemoizedAssignment
                                                                                        attribution={assignment}
                                                                                        users={users}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Vue par chirurgien (à implémenter)
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Vue par chirurgien en cours de développement
                            </div>
                        )}
                    </div>
                </DragDropContext>
            </main>

            {/* Panneau de configuration */}
            <DisplayConfigPanel
                isOpen={showConfigPanel}
                onClose={() => setShowConfigPanel(false)}
                displayConfig={displayConfig}
                onConfigChange={setDisplayConfig}
                rooms={rooms}
                users={users}
            />

            {/* Dialog de confirmation pour violations critiques */}
            <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Violations critiques détectées</DialogTitle>
                        <DialogDescription>
                            Des violations critiques ont été détectées dans le planning. 
                            Êtes-vous sûr de vouloir continuer ?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-4">
                        {validationResult?.violations
                            .filter(v => v.severity === AssignmentRuleSeverity.CRITICAL)
                            .map(v => (
                                <div key={v.id} className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    <p className="text-sm text-red-800 dark:text-red-200">{v.message}</p>
                                </div>
                            ))
                        }
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button 
                            variant="destructive"
                            onClick={async () => {
                                setIsConfirmationDialogOpen(false);
                                // Forcer la sauvegarde malgré les violations
                                try {
                                    const response = await apiClient.put('/api/affectations/batch', {
                                        assignments: tempAssignments,
                                        force: true
                                    });
                                    if (response.data.success) {
                                        setAssignments(tempAssignments);
                                        setHasPendingChanges(false);
                                        setPendingChangesDiff([]);
                                        toast.success("Changements sauvegardés malgré les violations");
                                    }
                                } catch (error) {
                                    logger.error("Erreur lors de la sauvegarde forcée:", error);
                                    toast.error("Erreur lors de la sauvegarde");
                                }
                            }}
                        >
                            Sauvegarder quand même
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Affichage des violations non critiques */}
            {validationResult && validationResult.violations.length > 0 && (
                <div className="fixed bottom-4 right-4 max-w-md">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Violations détectées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {validationResult.violations.slice(0, 3).map(v => (
                                <div key={v.id} className={`p-2 rounded text-xs ${
                                    v.severity === AssignmentRuleSeverity.CRITICAL ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                                    v.severity === AssignmentRuleSeverity.MAJOR ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200' :
                                    v.severity === AssignmentRuleSeverity.MINOR ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
                                    'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                }`}>
                                    {v.message}
                                </div>
                            ))}
                            {validationResult.violations.length > 3 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    +{validationResult.violations.length - 3} autres violations
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}