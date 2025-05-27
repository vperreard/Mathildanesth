"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PencilIcon,
    CheckIcon,
    InformationCircleIcon,
    Cog6ToothIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";
import { format, addWeeks, startOfWeek, endOfWeek, isToday, isWeekend, eachDayOfInterval, getISOWeek, isAfter, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { useSearchParams, useRouter } from 'next/navigation';
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

// Fonction pour obtenir le numéro de la semaine
const getWeekNumber = (date: Date): number => {
    return getISOWeek(date);
};

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
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tempAssignments, setTempAssignments] = useState<Assignment[]>([]);
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
        console.log(`[WeeklyPlanningPage_filteredRooms] Calcul pour selectedSiteId: ${selectedSiteId}, ${rooms.length} salles au total avant filtre.`);
        let result = rooms;

        // 1. Filtre par site sélectionné
        if (selectedSiteId) {
            result = result.filter(room => {
                // Assurer que room.siteId existe et comparer les chaînes de caractères
                const roomSiteIdStr = room.siteId ? String(room.siteId) : null;
                const selectedSiteIdStr = String(selectedSiteId);
                const match = roomSiteIdStr === selectedSiteIdStr;
                // console.log(`[DEBUG_FILTER_ROOM] Room: ${room.name} (ID: ${room.id}), RoomSiteID: ${roomSiteIdStr}, SelectedSiteID: ${selectedSiteIdStr}, Match: ${match}`);
                return match;
            });
        }

        // 2. Filtre par searchQuery et displayConfig
        result = result.filter(room => {
            const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
            const isVisibleByConfig = !displayConfig || !displayConfig.hiddenRoomIds || !displayConfig.hiddenRoomIds.includes(String(room.id));
            return matchesSearch && isVisibleByConfig;
        });
        console.log(`[WeeklyPlanningPage_filteredRooms] ${result.length} salles après filtre pour siteId: ${selectedSiteId}.`);
        return result;
    }, [rooms, selectedSiteId, searchQuery, displayConfig]);

    // Filtrer les assignations en fonction des salles filtrées
    const filteredAssignments = useMemo(() => {
        if (!selectedSiteId) {
            return tempAssignments; // Pas de filtre si aucun site n'est sélectionné
        }
        const currentFilteredRoomIds = new Set(filteredRooms.map(room => room.id));
        return tempAssignments.filter(assignment => currentFilteredRoomIds.has(assignment.roomId));
    }, [tempAssignments, filteredRooms, selectedSiteId]);

    // Fonction de chargement des données, appelée manuellement
    const fetchDataAndConfig = useCallback(async () => {
        console.log("[WeeklyPlanningPage] Chargement des données pour la période cible");
        setIsLoadingData(true);
        setIsLoading(true);
        // let finalConfig = { ...defaultDisplayConfig }; // Commenté car non utilisé directement ici
        // console.log("[WeeklyPlanningPage] finalConfig :", finalConfig);

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

            console.log(`[WeeklyPlanningPage] Période : ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`);

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

            console.log("[WeeklyPlanningPage] Données API (via apiClient) - Utilisateurs:", usersResponseData);
            console.log("[WeeklyPlanningPage] Données API (via apiClient) - Salles:", roomsResponseData);
            console.log("[WeeklyPlanningPage] Données API (via apiClient) - Assignations:", assignmentsResponseData);
            console.log("[WeeklyPlanningPage] Données API (via apiClient) - Sites:", sitesResponseData);

            const usersData = Array.isArray(usersResponseData) ? usersResponseData :
                (usersResponseData && Array.isArray(usersResponseData.users) ? usersResponseData.users : []);

            const roomsData = Array.isArray(roomsResponseData) ? roomsResponseData :
                (roomsResponseData && Array.isArray(roomsResponseData.rooms) ? roomsResponseData.rooms : []);

            const assignmentsData = Array.isArray(assignmentsResponseData) ? assignmentsResponseData :
                (assignmentsResponseData && Array.isArray(assignmentsResponseData.assignments) ? assignmentsResponseData.assignments : []);

            const sitesDataList = Array.isArray(sitesResponseData) ? sitesResponseData :
                (sitesResponseData && Array.isArray(sitesResponseData.sites) ? sitesResponseData.sites : []);

            setUsers(usersData);
            console.log("[WeeklyPlanningPage] état users mis à jour avec:", usersData.length, "utilisateurs");

            setSitesList(sitesDataList); // Mise à jour de l'état des sites
            console.log("[WeeklyPlanningPage] état sitesList mis à jour avec:", sitesDataList.length, "sites");

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
                    } catch (e) {
                        console.error('[WeeklyPlanningPage] Erreur lecture roomOrderConfig localStorage:', e);
                    }
                }
            }

            // Normaliser les données des salles
            const orderedRooms = fetchedRooms.map((apiRoomData: any) => {
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
            });

            // Trier les salles: d'abord par ordre personnalisé s'il existe,
            // sinon conserver l'ordre original venant de l'API (trié par displayOrder)
            const sortedRooms = [...orderedRooms].sort((a, b) => {
                // Si les deux salles ont un ordre personnalisé, les trier par cet ordre
                if (a.order !== Infinity && b.order !== Infinity) {
                    return a.order - b.order;
                }

                // Si seulement l'une des salles a un ordre personnalisé, la placer en premier
                if (a.order !== Infinity) return -1;
                if (b.order !== Infinity) return 1;

                // Si aucune n'a d'ordre personnalisé, préserver l'ordre original de l'API
                // qui est déjà trié par site.displayOrder, sector.displayOrder, salle.displayOrder
                return 0;
            });

            console.log("[WeeklyPlanningPage] état rooms mis à jour avec:", sortedRooms.length, "salles (triées par displayOrder)");
            setRooms(sortedRooms);

            const fetchedAssignments = assignmentsData;
            setAssignments(fetchedAssignments);
            setTempAssignments(fetchedAssignments);
            console.log("[WeeklyPlanningPage] état assignments mis à jour avec:", fetchedAssignments.length, "assignations");

            if (usersData.length === 0 && roomsData.length === 0 && assignmentsData.length === 0) {
                console.warn("[WeeklyPlanningPage] Toutes les listes de données (utilisateurs, salles, assignations) sont vides après le fetch initial.");
                // Utiliser toast simple, pas toast.info si non disponible
                toast("Aucune donnée de planning à afficher pour cette semaine.", { duration: 4000, icon: 'ℹ️' });
            }

        } catch (error) {
            console.error("Erreur lors du chargement des données :", error);
            toast.error("Erreur lors du chargement des données");
            setUsers([]);
            setRooms([]);
            setAssignments([]);
            setTempAssignments([]);
        } finally {
            setIsLoadingData(false);
            setIsLoading(false);
        }
    }, [activeDateRangeType, customStartDate, customEndDate, currentWeekStart]);

    // Chargement initial au montage uniquement
    useEffect(() => {
        fetchDataAndConfig();
    }, [fetchDataAndConfig]);

    // Effet pour initialiser selectedSiteId à partir de l'URL ou du premier site disponible
    useEffect(() => {
        if (!searchParams || !sitesList.length) return; // Attendre que searchParams et sitesList soient prêts

        const siteIdFromUrl = searchParams.get('siteId');
        const currentSelectedSiteId = selectedSiteId; // Capturer la valeur actuelle avant toute modification
        console.log(`[WeeklyPlanningPage_EFFECT_URL_DEBUG] Entrée useEffect. siteIdFromUrl: ${siteIdFromUrl}, currentSelectedSiteId: ${currentSelectedSiteId}, sitesList: ${sitesList.length}`);

        if (siteIdFromUrl) {
            // Si un siteId est dans l'URL et est valide
            if (sitesList.some(site => site.id === siteIdFromUrl)) {
                if (currentSelectedSiteId !== siteIdFromUrl) {
                    setSelectedSiteId(siteIdFromUrl);
                    console.log(`[WeeklyPlanningPage_EFFECT_URL] selectedSiteId mis à jour depuis URL: ${siteIdFromUrl}`);
                } else {
                    console.log(`[WeeklyPlanningPage_EFFECT_URL_DEBUG] siteIdFromUrl (${siteIdFromUrl}) est déjà le currentSelectedSiteId. Rien à faire.`);
                }
            } else {
                // siteId dans l'URL est invalide, ou pas encore dans sitesList :
                console.warn(`[WeeklyPlanningPage_EFFECT_URL] siteId de l'URL (${siteIdFromUrl}) est invalide ou non trouvé dans sitesList (${sitesList.map(s => s.id).join(', ')}).`);
                // Si un site est déjà sélectionné (par ex. par interaction user), ne pas l'écraser.
                // Si aucun site n'est sélectionné, et que le SiteSelector ne va pas le faire, on pourrait initialiser.
                // Mais avec autoSelectFirst={true} et persistInUrl={true} sur SiteSelector, il devrait gérer.
                // On vérifie si un site par défaut est nécessaire SEULEMENT SI currentSelectedSiteId est encore null/undefined.
                if (!currentSelectedSiteId && sitesList[0]?.id) {
                    const defaultSiteId = sitesList[0].id;
                    setSelectedSiteId(defaultSiteId);
                    // Si on met à jour l'URL ici, cela redéclenchera le useEffect.
                    // Il vaut mieux laisser SiteSelector (avec persistInUrl) être le seul à écrire l'URL suite à une sélection.
                    // router.push(`/planning/hebdomadaire?siteId=${defaultSiteId}`, { scroll: false }); 
                    console.log(`[WeeklyPlanningPage_EFFECT_URL] siteId de l'URL invalide ET currentSelectedSiteId vide. selectedSiteId initialisé avec le premier site par défaut: ${defaultSiteId}. L'URL devrait être mise à jour par SiteSelector.`);
                } else {
                    console.log(`[WeeklyPlanningPage_EFFECT_URL_DEBUG] siteId de l'URL invalide, mais currentSelectedSiteId (${currentSelectedSiteId}) est déjà défini. On ne change rien.`);
                }
            }
        } else {
            // Pas de siteId dans l'URL
            console.log(`[WeeklyPlanningPage_EFFECT_URL_DEBUG] Pas de siteId dans l'URL.`);
            // Si aucun site n'est sélectionné, et que SiteSelector n'a pas autoSelectFirst, on pourrait prendre le premier de la liste.
            // SiteSelector avec autoSelectFirst={true} et persistInUrl={true} devrait gérer la sélection initiale et la mise à jour de l'URL.
            if (!currentSelectedSiteId && sitesList[0]?.id) {
                // Normalement, SiteSelector devrait déjà avoir fait son travail s'il est configuré avec autoSelectFirst.
                // Ce bloc est une sécurité supplémentaire ou pour des cas où SiteSelector n'a pas persistInUrl.
                // const defaultSiteId = sitesList[0].id;
                // setSelectedSiteId(defaultSiteId);
                // router.push(`/planning/hebdomadaire?siteId=${defaultSiteId}`, { scroll: false });
                console.log(`[WeeklyPlanningPage_EFFECT_URL] Pas de siteId dans l'URL ET currentSelectedSiteId vide. SiteSelector devrait gérer l'initialisation et la mise à jour de l'URL.`);
            } else {
                console.log(`[WeeklyPlanningPage_EFFECT_URL_DEBUG] Pas de siteId dans l'URL, currentSelectedSiteId (${currentSelectedSiteId}) est déjà défini ou sitesList[0] n'existe pas. On ne change rien.`);
            }
        }
    }, [searchParams, sitesList, router]); // selectedSiteId retiré des dépendances

    const handleSaveRoomOrder = (orderedRoomIds: string[]) => {
        const newConfig = { orderedRoomIds };
        setRoomOrderConfig(newConfig);
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomOrderConfig', JSON.stringify(newConfig));
        }

        // Mettre à jour les salles avec le nouvel ordre personnalisé
        const orderedRooms = rooms.map((room: Room) => {
            const orderIndex = orderedRoomIds.indexOf(String(room.id));
            return { ...room, order: orderIndex === -1 ? Infinity : orderIndex };
        });

        // Trier les salles: d'abord par ordre personnalisé s'il existe,
        // sinon conserver l'ordre original venant de l'API (trié par displayOrder)
        const sortedRooms = [...orderedRooms].sort((a, b) => {
            // Si les deux salles ont un ordre personnalisé, les trier par cet ordre
            if (a.order !== Infinity && b.order !== Infinity) {
                return a.order - b.order;
            }

            // Si seulement l'une des salles a un ordre personnalisé, la placer en premier
            if (a.order !== Infinity) return -1;
            if (b.order !== Infinity) return 1;

            // Si aucune n'a d'ordre personnalisé, préserver l'ordre original de l'API
            // qui est déjà trié par site.displayOrder, sector.displayOrder, salle.displayOrder
            return 0;
        });

        setRooms(sortedRooms);

        // Mettre à jour la configuration d'affichage si elle existe
        if (displayConfig) {
            const newConfig = { ...displayConfig, roomOrder: orderedRoomIds };
            setDisplayConfig(newConfig);
            try {
                console.log("Préférences d'ordre des salles sauvegardées.");
            } catch (error) {
                console.error("Erreur sauvegarde préférences ordre salles:", error);
            }
        }
    };

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

    const getWeekDays = useCallback(() => {
        let intervalStart: Date;
        let intervalEnd: Date;

        if (activeDateRangeType === 'custom' && customStartDate && customEndDate) {
            intervalStart = customStartDate;
            intervalEnd = customEndDate;
            // Pour une plage personnalisée, on inclut tous les jours, y compris les week-ends
            return eachDayOfInterval({
                start: intervalStart,
                end: intervalEnd
            });
        } else {
            intervalStart = currentWeekStart;
            intervalEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            // Pour la vue semaine, on inclut également les week-ends pour pouvoir les afficher différemment
            return eachDayOfInterval({
                start: intervalStart,
                end: intervalEnd
            });
        }
    }, [currentWeekStart, activeDateRangeType, customStartDate, customEndDate]);

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
                className={`p-1 rounded text-xs mb-1 shadow-sm overflow-hidden ${cardBgStyle}`}
                style={{ color: textColor, maxHeight: '58px' }}
            >
                <div style={{ ...surgeonStyle, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatNameWithConfig(surgeon, 'chirurgien')}
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                    {mar && (
                        <span style={{ ...marStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="block truncate">
                            {formatNameWithConfig(mar, 'mar')}
                        </span>
                    )}
                    {iade && (
                        <span style={{ ...iadeStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className={mar ? 'ml-1 block truncate' : 'block truncate'}>
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

    // Méthode de rendu pour la vue par salle
    const renderRoomView = useCallback(() => {
        const daysToRender = getWeekDays();

        if (filteredRooms.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune salle à afficher pour le site sélectionné ou les filtres actifs.
                    {selectedSiteId && <p className="text-sm">Site ID: {selectedSiteId}</p>}
                    {rooms.length > 0 && <p className="text-sm">Total salles chargées (avant filtre site): {rooms.length}</p>}
                </div>
            );
        }

        interface SectorRenderInfo {
            name: string;
            colorCode: string;
            rooms: Room[];
            displayOrder: number;
        }

        const sectorsMap: Record<string, SectorRenderInfo> = filteredRooms.reduce((acc, room) => {
            const sectorName = room.sector || 'Sans secteur';
            const color = room.sectorColorCode || '#F3F4F6';
            const order = room.sectorDisplayOrder ?? Infinity;
            if (!acc[sectorName]) {
                acc[sectorName] = { name: sectorName, colorCode: color, rooms: [], displayOrder: order };
            }
            acc[sectorName].rooms.push(room);
            if (order < acc[sectorName].displayOrder) { // Garder le plus petit displayOrder pour le secteur
                acc[sectorName].displayOrder = order;
            }
            return acc;
        }, {} as Record<string, SectorRenderInfo>);

        const sortedSectorsRenderInfo = Object.values(sectorsMap).sort((a, b) => {
            if (a.displayOrder !== b.displayOrder) {
                return a.displayOrder - b.displayOrder;
            }
            if (a.name === 'Sans secteur') return 1;
            if (b.name === 'Sans secteur') return -1;
            return a.name.localeCompare(b.name);
        });

        return (
            <div className="overflow-x-auto overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-lg shadow" style={{ maxHeight: 'calc(100vh - 200px)' }}> {/* Exemple de hauteur */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 border-collapse border border-gray-300 dark:border-slate-600">
                    <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="sticky left-0 z-40 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 min-w-[100px] bg-gray-50 dark:bg-slate-800">
                                Secteur
                            </th>
                            <th scope="col" className="sticky left-[100px] z-40 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 min-w-[120px] md:min-w-[150px] bg-gray-50 dark:bg-slate-800">
                                Salle
                            </th>
                            {daysToRender.map(day => (
                                <th key={day.toISOString()} colSpan={2} className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 min-w-[200px] bg-gray-50 dark:bg-slate-800">
                                    {format(day, "EEE dd/MM", { locale: fr })}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th scope="col" className="sticky left-0 z-40 px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800" />
                            <th scope="col" className="sticky left-[100px] z-40 px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800" />
                            {daysToRender.map(day => (
                                <React.Fragment key={`${day.toISOString()}-periods`}>
                                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600 min-w-[100px] bg-gray-50 dark:bg-slate-800">
                                        Matin
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600 min-w-[100px] bg-gray-50 dark:bg-slate-800">
                                        Après-midi
                                    </th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-850">
                        {sortedSectorsRenderInfo.map(sectorInfo => (
                            <React.Fragment key={sectorInfo.name}>
                                {/* La ligne d'en-tête du secteur est supprimée ici */}
                                {sectorInfo.rooms
                                    .sort((a, b) => {
                                        const orderA = a.order ?? Infinity;
                                        const orderB = b.order ?? Infinity;
                                        if (orderA !== orderB) {
                                            return orderA - orderB;
                                        }
                                        return (a.name || '').localeCompare(b.name || '');
                                    })
                                    .map((room, roomIndex) => (
                                        <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50" style={{ backgroundColor: `${sectorInfo.colorCode}1A` /* 1A pour ~10% opacité en hex */ }}>
                                            {roomIndex === 0 && (
                                                <td
                                                    rowSpan={sectorInfo.rooms.length}
                                                    className="sticky left-0 z-20 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 align-middle text-center"
                                                    style={{
                                                        backgroundColor: `${sectorInfo.colorCode}33`, /* 33 pour ~20% opacité */
                                                        color: getTextColorForBackground(sectorInfo.colorCode),
                                                        // writingMode: 'vertical-rl', // Supprimé
                                                        // textOrientation: 'mixed', // Supprimé
                                                        minWidth: '100px', // Augmenter un peu pour texte horizontal
                                                        maxWidth: '150px' // Permettre le retour à la ligne
                                                    }}
                                                >
                                                    {sectorInfo.name}
                                                </td>
                                            )}
                                            <td
                                                className="sticky left-[100px] z-20 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-600 w-36 max-w-xs"
                                                style={{ backgroundColor: `${sectorInfo.colorCode}1A` }} // Appliquer aussi la couleur atténuée ici
                                            >
                                                {room.name}
                                                <span className="block text-xs text-gray-500 dark:text-gray-400"> (N° {room.number || 'N/A'})</span>
                                            </td>
                                            {daysToRender.map(day => {
                                                const dayStr = format(day, 'yyyy-MM-dd');
                                                const morningAssignments = getDailyAssignments(day, room.id).filter(a => a.period === 'MORNING' || a.shift === 'matin' || a.shift === 'MORNING' || (a.shift === 'FULL_DAY' || a.period === 'FULL_DAY'));
                                                const afternoonAssignments = getDailyAssignments(day, room.id).filter(a => a.period === 'AFTERNOON' || a.shift === 'apresmidi' || a.shift === 'AFTERNOON' || (a.shift === 'FULL_DAY' || a.period === 'FULL_DAY'));

                                                const morningDroppableId = `room-${room.id}-day-${dayStr}-period-MORNING`;
                                                const afternoonDroppableId = `room-${room.id}-day-${dayStr}-period-AFTERNOON`;

                                                return (
                                                    <React.Fragment key={`${dayStr}-${room.id}-cells`}>
                                                        <td className="px-0.5 py-0.5 align-top text-xs border border-gray-300 dark:border-slate-600 min-w-[100px] h-[60px]" style={{ backgroundColor: `${sectorInfo.colorCode}1A` }}>
                                                            <Droppable droppableId={morningDroppableId} type="ASSIGNMENT" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className={`w-full h-full p-0.5 rounded-sm ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-600/30' : 'hover:bg-gray-50/50 dark:hover:bg-slate-700/20'}`}
                                                                    >
                                                                        {morningAssignments.map((assignment, index) => renderAssignment(assignment, index))}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </td>
                                                        <td className="px-0.5 py-0.5 align-top text-xs border border-gray-300 dark:border-slate-600 min-w-[100px] h-[60px]" style={{ backgroundColor: `${sectorInfo.colorCode}1A` }}>
                                                            <Droppable droppableId={afternoonDroppableId} type="ASSIGNMENT" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className={`w-full h-full p-0.5 rounded-sm ${snapshot.isDraggingOver ? 'bg-amber-100 dark:bg-amber-600/30' : 'hover:bg-gray-50/50 dark:hover:bg-slate-700/20'}`}
                                                                    >
                                                                        {afternoonAssignments.map((assignment, index) => renderAssignment(assignment, index))}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                    ))
                                }
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, [filteredRooms, getWeekDays, users, getDailyAssignments, renderAssignment, getTextColorForBackground]);
    // ATTENTION: selectedSiteId, rooms.length, currentWeekStart, activeDateRangeType, customStartDate, customEndDate retirés des dépendances
    // car ils ne sont plus utilisés DIRECTEMENT par la logique de rendu de la table elle-même, mais par filteredRooms ou getWeekDays.
    // getTextColorForBackground ajoutée.

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

        const updatedAssignments = [...tempAssignments];

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
            const response = await fetch('/api/affectations/validate', {
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
        // const originalAssignments = assignments; // Plus besoin si on ne restaure pas

        try {
            const assignmentsToSave = tempAssignments.map(tempAssign => ({
                ...tempAssign,
                userId: Number(tempAssign.userId),
                date: new Date(tempAssign.date),
                roomId: tempAssign.roomId ? Number(tempAssign.roomId) : null,
            }));

            console.log("Assignations envoyées à /api/affectations/batch (via apiClient):", assignmentsToSave);

            // Utiliser apiClient pour la sauvegarde aussi
            const response = await apiClient.post('/api/affectations/batch', { assignments: assignmentsToSave });

            // Avec axios, le résultat est dans response.data
            const result = response.data;

            // La vérification de response.ok n'est plus nécessaire comme avec fetch, axios lève une erreur pour les status non-2xx
            // Gérer les erreurs spécifiques si l'API batch retourne des erreurs dans le corps même avec un statut 2xx (si c'est le cas)
            // if (response.status === 207 && result.errors) { // Exemple si 207 est possible et géré comme ça
            //     toast.error(`Erreur partielle: ${result.errors.length} affectation(s) non enregistrée(s).`);
            //     // Potentiellement throw new Error pour aller au catch, ou gérer différemment
            // } else if (result.error) { // Si l'API retourne un champ "error" dans un 2xx
            //    toast.error(result.error);
            //    throw new Error(result.error);
            // }


            setAssignments(tempAssignments);
            setHasPendingChanges(false);
            setValidationResult(null);
            setIsConfirmationDialogOpen(false);
            toast.success(result.message || "Changements sauvegardés avec succès !");

        } catch (error: any) { // Le catch d'axios error est plus détaillé
            console.error("Erreur lors de la sauvegarde des changements (apiClient):", error);
            let errorMessage = "Erreur lors de la sauvegarde des changements. Veuillez réessayer.";
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message; // S'il y a un message spécifique dans le corps de l'erreur
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [tempAssignments, /* assignments, */ hasPendingChanges, validationResult]);

    const handleCancelChanges = useCallback(() => {
        setTempAssignments(assignments);
        setHasPendingChanges(false);
        setValidationResult(null);
        setIsConfirmationDialogOpen(false);
    }, [assignments, setTempAssignments, setHasPendingChanges, setValidationResult, setIsConfirmationDialogOpen]);

    // Fonction pour ouvrir le panneau de configuration
    const openConfigPanel = () => setShowConfigPanel(true);

    const handleDateRangeChange = (startDate: Date, endDate: Date) => {
        // Vérifier que la plage est valide (startDate avant endDate)
        if (isAfter(startDate, endDate)) {
            toast.error("La date de début doit être antérieure à la date de fin.");
            return;
        }

        // Vérifier que la plage n'est pas trop grande (max 31 jours pour éviter des performances dégradées)
        const daysDiff = differenceInDays(endDate, startDate);
        if (daysDiff > 31) {
            toast.error("La plage de dates ne peut pas dépasser 31 jours.");
            return;
        }

        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        setActiveDateRangeType('custom');
        setIsDateRangeSelectorOpen(false);
    };

    const switchToWeekView = () => {
        setActiveDateRangeType('week');
        // Optionnel: On peut aussi réinitialiser les dates personnalisées
        // setCustomStartDate(null);
        // setCustomEndDate(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full p-4 bg-gray-50 items-center justify-center">
                <p className="text-lg text-gray-700">Chargement du planning en cours...</p>
            </div>
        );
    }

    if (!displayConfig) {
        return (
            <div className="flex flex-col h-full p-4 bg-gray-50 items-center justify-center">
                <p className="text-lg text-gray-700">Chargement de la configuration d'affichage...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 md:p-6 bg-gray-50 dark:bg-slate-900">
            {/* En-tête principal */}
            <div className="flex flex-col space-y-4">
                {/* En-tête principal avec titre, navigation et sélecteur de site */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-2 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                            Planning {activeDateRangeType === 'week' ? 'Hebdomadaire' : 'Personnalisé'}
                        </h1>

                        {/* Contrôles de navigation de semaine */}
                        {activeDateRangeType === 'week' && (
                            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-md shadow-sm overflow-hidden">
                                <Button onClick={goToPreviousWeek} variant="ghost" size="icon" aria-label="Semaine précédente" className="p-2 rounded-none hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </Button>
                                <Button onClick={goToCurrentWeek} variant="ghost" size="sm" className="px-3 py-2 border-l border-r border-gray-300 dark:border-slate-700 rounded-none text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                                    Aujourd'hui
                                </Button>
                                <Button onClick={goToNextWeek} variant="ghost" size="icon" aria-label="Semaine suivante" className="p-2 rounded-none hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </Button>
                            </div>
                        )}

                        {/* Sélecteur de Site */}
                        {sitesList.length > 0 && (
                            <div className="ml-0 sm:ml-4">
                                <SiteSelector
                                    sites={sitesList}
                                    selectedSiteId={selectedSiteId}
                                    onChange={setSelectedSiteId}
                                    includeAllSites={true}
                                    allSitesLabel="Tous les sites"
                                    autoSelectFirst={true}
                                    persistInUrl={true}
                                />
                            </div>
                        )}
                    </div>

                    {/* Affichage centralisé des informations de date et période */}
                    <div className="flex items-center gap-2">
                        {activeDateRangeType === 'custom' && customStartDate && customEndDate ? (
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                                {format(customStartDate, "d MMM", { locale: fr })} - {format(customEndDate, "d MMM yyyy", { locale: fr })}
                            </h2>
                        ) : (
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                                Semaine {getWeekNumber(currentWeekStart)} · {format(currentWeekStart, "MMMM yyyy", { locale: fr })}
                                <span className="ml-2 text-sm font-normal">
                                    ({format(currentWeekStart, "dd MMM", { locale: fr })} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "dd MMM", { locale: fr })})
                                </span>
                            </h2>
                        )}
                        <Button
                            onClick={() => setIsDateRangeSelectorOpen(true)}
                            variant="ghost"
                            size="icon"
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>
                    </div>

                    {/* Section Recherche et Paramètres */}
                    <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-end">
                        <input
                            type="text"
                            placeholder="Rechercher salle/chir..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-gray-200 w-full sm:w-auto max-w-xs"
                        />
                        <Button
                            onClick={openConfigPanel}
                            variant="outline"
                            size="icon"
                            data-testid="open-config-button"
                            aria-label="Configurer l'affichage"
                            className="border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </Button>
                    </div>
                </div>

                {/* Contrôles de sélection de date */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DatePicker
                            selected={customStartDate ?? startOfWeek(currentWeekStart, { weekStartsOn: 1 })}
                            onChange={(date: Date | null) => { if (date) { setCustomStartDate(date); setActiveDateRangeType('custom'); } }}
                            dateFormat="dd/MM/yyyy"
                            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-gray-200 w-32"
                        />
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                        <DatePicker
                            selected={customEndDate ?? endOfWeek(currentWeekStart, { weekStartsOn: 1 })}
                            onChange={(date: Date | null) => { if (date) { setCustomEndDate(date); setActiveDateRangeType('custom'); } }}
                            dateFormat="dd/MM/yyyy"
                            minDate={customStartDate || undefined}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-gray-200 w-32"
                        />
                    </div>
                    <Button
                        onClick={fetchDataAndConfig}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
                    >
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Sélecteur de plage de dates */}
            <Dialog open={isDateRangeSelectorOpen} onOpenChange={setIsDateRangeSelectorOpen}>
                <DialogContent className="max-w-md dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">Sélectionnez une plage de dates</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Choisissez une semaine ou une plage personnalisée.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="week-view"
                                    name="date-range-type"
                                    checked={activeDateRangeType === 'week'}
                                    onChange={() => switchToWeekView()}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label htmlFor="week-view" className="text-sm font-medium dark:text-gray-200">
                                    Vue semaine
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="custom-range"
                                    name="date-range-type"
                                    checked={activeDateRangeType === 'custom'}
                                    onChange={() => {
                                        // Si aucune date n'est encore sélectionnée, définir celle de la semaine actuelle
                                        if (!customStartDate || !customEndDate) {
                                            setCustomStartDate(currentWeekStart);
                                            setCustomEndDate(endOfWeek(currentWeekStart, { weekStartsOn: 1 }));
                                        }
                                        setActiveDateRangeType('custom');
                                    }}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label htmlFor="custom-range" className="text-sm font-medium dark:text-gray-200">
                                    Plage personnalisée
                                </label>
                            </div>
                        </div>

                        {/* Sélecteur de dates personnalisées */}
                        {activeDateRangeType === 'custom' && (
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Date de début
                                    </label>
                                    <DatePicker
                                        id="start-date"
                                        selected={customStartDate}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                setCustomStartDate(date);
                                                // Si la date de fin est avant la nouvelle date de début, ajuster la fin
                                                if (customEndDate && isBefore(customEndDate, date)) {
                                                    setCustomEndDate(date);
                                                }
                                            }
                                        }}
                                        dateFormat="dd/MM/yyyy"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-gray-200"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Date de fin
                                    </label>
                                    <DatePicker
                                        id="end-date"
                                        selected={customEndDate}
                                        onChange={(date: Date | null) => date && setCustomEndDate(date)}
                                        dateFormat="dd/MM/yyyy"
                                        minDate={customStartDate || undefined}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-gray-200"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDateRangeSelectorOpen(false)} className="dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700">
                            Annuler
                        </Button>
                        <Button
                            onClick={() => {
                                if (activeDateRangeType === 'custom' && customStartDate && customEndDate) {
                                    handleDateRangeChange(customStartDate, customEndDate);
                                } else {
                                    switchToWeekView();
                                    setIsDateRangeSelectorOpen(false);
                                }
                            }}
                            disabled={activeDateRangeType === 'custom' && (!customStartDate || !customEndDate)}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Appliquer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showConfigPanel} onOpenChange={setShowConfigPanel}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">Configuration de l'affichage</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Personnalisez les options d'affichage du planning hebdomadaire.
                        </DialogDescription>
                    </DialogHeader>
                    {displayConfig && (
                        <DisplayConfigPanel
                            onClose={() => setShowConfigPanel(false)}
                            config={displayConfig!}
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

            <DragDropContext onDragEnd={handleDragEnd} data-testid="dnd-context">
                <div className="flex-grow overflow-auto border rounded-lg shadow-sm bg-white dark:bg-slate-800">
                    {viewMode === "room" ? renderRoomView() : null /* renderSurgeonView() Temporairement commenté */}
                </div>
            </DragDropContext>

            {hasPendingChanges && (
                <div className="mt-4 p-4 border rounded-lg shadow-md bg-yellow-50 dark:bg-yellow-900/30 flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={handleCancelChanges}
                        data-testid="cancel-changes-button"
                        className="dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={openConfirmationDialog}
                        data-testid="validate-changes-button"
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Valider les changements
                    </Button>
                </div>
            )}
            <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
                <DialogContent data-testid="confirmation-dialog" className="dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">Confirmer les changements</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Veuillez vérifier les modifications et les éventuels conflits avant de sauvegarder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 my-4">
                        <div>
                            <h4 className="font-semibold dark:text-gray-200">Changements proposés :</h4>
                            {pendingChangesDiff.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                                    {pendingChangesDiff.map((change, index) => (
                                        <li key={index}>{change}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun changement détecté.</p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold dark:text-gray-200">Résultat de la validation :</h4>
                            {validationResult ? (
                                <ValidationSummaryDisplay result={validationResult!} />
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Validation en attente...</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmationDialogOpen(false)} className="dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700">Annuler</Button>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={isSaving || !validationResult?.valid || (validationResult?.violations?.some(v => v.severity === AssignmentRuleSeverity.CRITICAL) ?? false)}
                            data-testid="confirm-save-button"
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {isSaving ? "Sauvegarde..." : "Confirmer & Sauvegarder"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

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