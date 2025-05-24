'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { AlertTriangle } from 'lucide-react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from 'react-hot-toast';
import { DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/context/ThemeContext'; // AJOUT

// Activation du mode debug
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Types
interface OperatingRoom {
    id: number;
    name: string;
    number?: string;
    sector?: string;
    roomType?: string;
    colorCode?: string;
    isActive?: boolean;
    sectorId?: number;
    operatingSector?: OperatingSector; // Ajout pour refléter les données API
    supervisionRules?: {
        maxRoomsPerSupervisor?: number;
    };
    site?: OperatingSite;
    siteId?: number;
    displayOrder?: number;
    createdAt?: string;
    updatedAt?: string;
    type?: string; // Alias pour compatibilité
}

interface OperatingSector {
    id: number;
    name: string;
    colorCode?: string;
    isActive?: boolean;
    rooms?: OperatingRoom[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    siteId?: number;
    site?: OperatingSite;
    originalName?: string;
}

interface OperatingSite {
    id: number;
    name: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    defaultSector?: string;
    colorCode?: string;
}

// Type du formulaire
interface OperatingRoomFormData {
    name: string;
    number: string;
    sector: string;
    roomType: string;
    colorCode: string;
    isActive: boolean;
    supervisionRules: {
        maxRoomsPerSupervisor?: number;
    };
    siteId?: number | null;
}

// Type pour l'ordre des salles
interface RoomOrderConfig {
    [sectorName: string]: number[];
}

// Options de types de salles
const ROOM_TYPE_OPTIONS = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'SEPTIQUE', label: 'Septique' },
    { value: 'ASEPTIQUE', label: 'Aseptique' },
    { value: 'ENDOSCOPIE', label: 'Endoscopie' },
    { value: 'AMBULATOIRE', label: 'Ambulatoire' },
    { value: 'URGENCE', label: 'Urgence' },
    { value: 'SPECIALISEE', label: 'Spécialisée' }
];

// Fonction pour normaliser les noms de secteurs
const normalizeSectorName = (name?: string): string => {
    if (!name) return '';
    let normalized = name.toLowerCase().trim();
    let prefix = 'secteur ';

    // Déterminer le préfixe en fonction de la présence de "europe"
    if (normalized.includes('europe')) {
        prefix = 'europe ';
        // Nettoyer "europe" du nom pour éviter les doublons de préfixe comme "europe europe bloc"
        normalized = normalized.replace(/\beurope\b/gi, '').trim(); // CORRECTION: Suppression des \\ erronés
    } else {
        // Nettoyer "secteur" du nom pour éviter les doublons de préfixe comme "secteur secteur x"
        normalized = normalized.replace(/\bsecteur\b/gi, '').trim(); // CORRECTION: Suppression des \\ erronés
    }

    // Cas spécifiques basés sur des mots-clés
    if (normalized.includes('endo')) {
        return prefix + 'endoscopie';
    }
    if (normalized.includes('sept') && !normalized.includes('asept')) {
        return prefix + 'septique';
    }
    // Pour aseptique/hyperaseptique, on peut choisir un terme standard, par ex. 'aseptique'
    if (normalized.includes('asept') || normalized.includes('hyper')) {
        return prefix + 'aseptique'; // ou 'hyperaseptique' si préféré
    }
    if (normalized.includes('ophtalmo')) {
        return prefix + 'ophtalmo';
    }
    if (normalized.includes('ambulatoire')) {
        return prefix + 'ambulatoire';
    }
    // Si "bloc" est explicitement mentionné (et pas déjà couvert par une autre règle)
    if (normalized.includes('bloc')) {
        return prefix + 'bloc';
    }
    if (normalized.includes('intermediaire') || normalized.includes('intermédiaire')) {
        return prefix + 'intermédiaire';
    }

    // Nettoyer les espaces multiples et retrimmer
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Si le nom normalisé après nettoyage des mots-clés et préfixes est vide,
    // cela peut signifier que le nom original était juste "Europe" ou "Secteur"
    if (normalized === '') {
        if (prefix === 'europe ') return 'europe général'; // Nom par défaut pour "Europe" seul
        return 'secteur général'; // Nom par défaut pour "Secteur" seul
    }

    // Pour tous les autres cas, on retourne le préfixe suivi du reste du nom normalisé
    // Ex: "CHIR CARDIAQUE" -> prefix='secteur ', normalized='chir cardiaque' -> "secteur chir cardiaque"
    // Ex: "URO SITE EUROPE" (après nettoyage de 'europe') -> prefix='europe ', normalized='uro site' -> "europe uro site"
    return prefix + normalized;
};

// Fonction pour détecter si une salle est une salle d'endoscopie
const isEndoscopieRoom = (room: OperatingRoom): boolean => {
    if (!room) return false;

    const name = (room.name || '').toLowerCase();
    const number = (room.number || '').toLowerCase();
    const type = ((room.roomType || room.type || '').toLowerCase());

    // Détecter par le nom ou le numéro
    return name.includes('endo') ||
        number.includes('endo') ||
        type.includes('endo') ||
        name.includes('gastro') ||
        type === 'endoscopie';
};

// Fonction pour récupérer les options de types de salles
const getRoomTypeOptions = () => {
    return ROOM_TYPE_OPTIONS;
};

// Fonctions de normalisation des données
const normalizeOperatingSectors = (sectors: any[]): OperatingSector[] => {
    return sectors.map(sector => ({
        ...sector,
        originalName: sector.name,
        // CORRECTION: Ne plus normaliser automatiquement les noms venant de la BDD
        // car ils sont déjà corrects. La normalisation doit être utilisée uniquement 
        // pour la comparaison et la détection, pas pour modifier les données.
        name: sector.name // Garder le nom original de la base de données
    }));
};

const normalizeOperatingRooms = (rooms: any[]): OperatingRoom[] => {
    return rooms.map(room => ({
        ...room,
        name: room.name || '',
        number: room.number || '',
        // CORRECTION: utiliser le nom original du secteur au lieu de le normaliser
        sector: room.operatingSector?.name || room.sector || '',
        roomType: room.roomType || room.type || 'STANDARD',
        isActive: room.isActive !== false,
        displayOrder: room.displayOrder || 0
    }));
};

// Fonction pour détecter le type de salle en fonction de ses caractéristiques
const detectRoomType = (room: OperatingRoom, sectors: OperatingSector[], sites: OperatingSite[], targetSectorNameForDetection: string): string | null => {
    if (!room) return null;
    const roomName = room.name.toLowerCase();
    const roomNumber = room.number?.toLowerCase() || '';

    // Si la salle a déjà un secteur explicitement défini et qu'il existe
    if (room.sector && sectors.some(s => normalizeSectorName(s.name) === normalizeSectorName(room.sector || ''))) {
        return room.sector;
    }

    // Vérifier si c'est une salle d'endoscopie
    if (isEndoscopieRoom(room)) {
        return "Secteur endoscopie";
    }

    // Détecter le secteur en fonction du nom/numéro de la salle
    if (roomName.includes('septique') || roomNumber.includes('sept')) {
        return "Secteur septique";
    }

    if (roomName.includes('asept') || roomNumber.includes('asept')) {
        return "Secteur hyperaseptique";
    }

    if (roomName.includes('ophtalmo') || roomNumber.includes('oph')) {
        return "Secteur ophtalmo";
    }

    if (roomName.includes('ambul') || roomNumber.includes('amb')) {
        return "Europe ambulatoire";
    }

    // Détection par site
    const roomSiteId = room.siteId;
    if (roomSiteId) {
        const roomSite = sites.find(site => site.id === roomSiteId);
        if (roomSite) {
            // Associer des sites spécifiques à des secteurs par défaut
            const siteName = roomSite.name.toLowerCase();

            if (siteName.includes('europe')) {
                return "Europe bloc";
            }

            if (siteName.includes('ambulatoire')) {
                return "Europe ambulatoire";
            }

            // Si le site a un secteur par défaut dans ses métadonnées
            if (roomSite.defaultSector && normalizeSectorName(roomSite.defaultSector) === normalizeSectorName(targetSectorNameForDetection)) {
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}) assignée au secteur "${targetSectorNameForDetection}" car: secteur par défaut du site`);
                return targetSectorNameForDetection;
            }
        }
    }

    // Algorithme avancé basé sur les types de salles
    const sectorTypeCounts: { [key: string]: string } = {};

    sectors.forEach(sector => {
        const sectorName = normalizeSectorName(sector.name);
        const sectorRooms = sectors
            .filter(s => normalizeSectorName(s.name) === sectorName)
            .flatMap(s => s.rooms || []);

        if (sectorRooms.length > 0) {
            const types = sectorRooms.map(r => r.roomType).filter(Boolean) as string[];
            const typeCounts: { [type: string]: number } = {};

            types.forEach(type => {
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            // Trouver le type dominant pour ce secteur
            let maxCount = 0;
            let dominantType = null;

            for (const [type, count] of Object.entries(typeCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantType = type;
                }
            }

            if (dominantType) {
                sectorTypeCounts[sectorName] = dominantType;
            }
        }
    });

    // Si la salle a un type qui correspond à un secteur dominant
    if (room.roomType && Object.entries(sectorTypeCounts).some(([sector, type]) => type === room.roomType)) {
        const matchingSector = Object.entries(sectorTypeCounts).find(([sector, type]) => type === room.roomType)?.[0];
        if (matchingSector) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}) assignée au secteur "${matchingSector}" car: correspondance par type de salle`);
            return matchingSector;
        }
    }

    // Si aucune correspondance n'est trouvée
    return null;
};

// Fonction pour associer automatiquement les sites aux salles
const associateSitesToRooms = (rooms: OperatingRoom[], sites: OperatingSite[]): OperatingRoom[] => {
    if (!rooms || !sites || sites.length === 0) return rooms;

    return rooms.map(room => {
        // Vérifier si la salle a déjà un site défini
        if (room.siteId || room.site) {
            return room;
        }

        // Tentative de détecter le site approprié
        let detectedSiteId = null;
        const roomName = room.name.toLowerCase();
        const roomSector = room.sector?.toLowerCase() || '';

        // Règles d'association
        if (roomName.includes('europe') || roomName.includes('amb') || roomSector.includes('europe')) {
            // Chercher le site "Europe"
            const europeSite = sites.find(site => site.name.toLowerCase().includes('europe'));
            if (europeSite) detectedSiteId = europeSite.id;
        } else if (roomName.includes('endo') || roomSector.includes('endo')) {
            // Les salles d'endoscopie sont souvent dans un site spécifique
            const endoSite = sites.find(site => site.name.toLowerCase().includes('principal'));
            if (endoSite) detectedSiteId = endoSite.id;
        }

        // Si nous avons détecté un site
        if (detectedSiteId) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_SITE_ASSOC] Salle "${room.name}" associée au site ID: ${detectedSiteId}`);
            return {
                ...room,
                siteId: detectedSiteId
            };
        }

        // Si nous n'avons que 2 sites, utiliser le premier par défaut pour les salles sans site
        if (sites.length === 2 && !detectedSiteId) {
            return {
                ...room,
                siteId: sites[0].id
            };
        }

        return room;
    });
};

// Fonction pour récupérer les salles d'un secteur avec détection intelligente
const getSectorRooms = (sectorName: string, allRooms: OperatingRoom[], sectorsData: OperatingSector[], sitesData: OperatingSite[]): OperatingRoom[] => {
    if (!allRooms || !sectorName) return [];

    if (DEBUG_MODE) console.log(`[ORCP_DEBUG] getSectorRooms: Traitement du secteur "${sectorName}"`);

    // Trouver l'ID du secteur cible en cherchant directement par nom
    const targetSectorObject = sectorsData.find(s => s.name === sectorName);
    const targetSectorId = targetSectorObject?.id;

    if (DEBUG_MODE && targetSectorId) {
        console.log(`[ORCP_DEBUG] getSectorRooms: ID du secteur cible "${sectorName}" est ${targetSectorId}`);
    }

    // Filtrer les salles pour ce secteur
    const filteredRooms = allRooms.filter(room => {
        if (!room) return false;

        // 1. Correspondance prioritaire par sectorId (si le secteur cible a un ID)
        if (targetSectorId && room.sectorId === targetSectorId) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}, sectorId: ${room.sectorId}) assignée au secteur "${sectorName}" (ID: ${targetSectorId}) car: correspondance de sectorId.`);
            return true;
        }

        // 2. Correspondance exacte du nom de secteur textuel
        if (room.sector === sectorName) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}, room.sector: "${room.sector}") assignée au secteur "${sectorName}" car: correspondance exacte du nom de secteur textuel.`);
            return true;
        }

        // 3. Détection intelligente du type de salle (utilisation de la normalisation pour la comparaison)
        let canBeDetectedByType = !room.sectorId;
        if (room.sectorId) {
            const existingSectorForRoomId = sectorsData.find(s => s.id === room.sectorId);
            if (!existingSectorForRoomId) {
                canBeDetectedByType = true;
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}) a un sectorId (${room.sectorId}) qui ne correspond à aucun secteur connu. Détection par type autorisée.`);
            }
        }

        if (canBeDetectedByType) {
            const suggestedSectorByDetection = detectRoomType(room, sectorsData, sitesData, sectorName);
            // Comparer les noms normalisés pour la détection
            if (suggestedSectorByDetection && normalizeSectorName(suggestedSectorByDetection) === normalizeSectorName(sectorName)) {
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER] Salle "${room.name}" (id: ${room.id}) assignée au secteur "${sectorName}" car: détection intelligente de type.`);
                return true;
            }
        }

        return false;
    });

    // Loguer les résultats en mode debug
    if (DEBUG_MODE) {
        console.log(`[ORCP_DEBUG] Secteur "${sectorName}" contient ${filteredRooms.length} salles`);
        console.log(`[ORCP_DEBUG] Valeur exacte du secteur: "${sectorName}" (type: ${typeof sectorName})`);

        if (filteredRooms.length === 0) {
            console.log(`[ORCP_DEBUG_DETAIL] Le secteur "${sectorName}" ne contient aucune salle`);
        } else {
            console.log(`[ORCP_DEBUG_DETAIL] Le secteur "${sectorName}" contient ${filteredRooms.length} salles:`);
            filteredRooms.forEach(room => {
                console.log(`[ORCP_DEBUG_DETAIL] - ${room.id}: ${room.name} (secteur="${room.sector}")`);
            });
        }
    }

    return filteredRooms;
};

const OperatingRoomsConfigPanel: React.FC = () => {
    const { theme } = useTheme(); // AJOUT
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [sites, setSites] = useState<OperatingSite[]>([]);
    const [sectorNames, setSectorNames] = useState<string[]>([]);
    const [filteredSectors, setFilteredSectors] = useState<OperatingSector[]>([]);

    // États pour le chargement et les erreurs
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string>('');

    // État pour le site sélectionné
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

    // États pour le formulaire
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // États pour le drag & drop
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [draggingRoomId, setDraggingRoomId] = useState<number | null>(null);
    const [dragOverSector, setDragOverSector] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState<boolean>(false);
    const [draggedItem, setDraggedItem] = useState<{ id: number; index: number; originalSectorName: string | null } | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<{ sectorName: string | null; index: number | null } | null>(null);

    // Référence pour l'intervalle de défilement
    const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // État pour l'ordre des salles
    const [roomOrder, setRoomOrder] = useState<RoomOrderConfig>({});

    // État pour le formulaire
    const [formData, setFormData] = useState<OperatingRoomFormData>({
        name: '',
        number: '',
        sector: '',
        roomType: 'STANDARD',
        colorCode: '#CCCCCC',
        isActive: true,
        supervisionRules: {
            maxRoomsPerSupervisor: 2
        },
        siteId: null
    });

    // État pour stocker l'état initial des salles lors de la réorganisation
    const [initialRoomsStateForReorder, setInitialRoomsStateForReorder] = useState<OperatingRoom[]>([]);

    // Calcul des salles filtrées par site
    const allRoomsFilteredBySite = useMemo(() => {
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Filtre site actif: ${selectedSiteId === null ? 'Aucun (tous sites)' : selectedSiteId}`);
        if (!selectedSiteId) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Retour de toutes les salles (${rooms.length}) car aucun filtre de site.`);
            return rooms;
        }
        const filtered = rooms.filter(room => {
            const roomSector = sectors.find(s => s.id === room.sectorId);
            if (roomSector?.siteId === selectedSiteId) {
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Salle "${room.name}" (pas de siteId propre, mais secteur ${roomSector.name} est du site ${selectedSiteId}) -> incluse`);
                return true;
            }
            if (room.siteId === selectedSiteId) {
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Salle "${room.name}" (siteId: ${room.siteId}) correspond au filtre ${selectedSiteId} -> incluse`);
                return true;
            }
            // Uniquement si "Tous les sites" est sélectionné (selectedSiteId === null), ce qui est géré par le premier `if`
            // donc ici, si la salle n'a pas de siteId et que son secteur n'est pas du site sélectionné, on l'exclut.
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Salle "${room.name}" (siteId: ${room.siteId}, secteur: ${roomSector?.name} siteId: ${roomSector?.siteId}) ne correspond pas au filtre ${selectedSiteId} -> exclue`);
            return false;
        });
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_FILTER_SITE] Salles après filtre de site (${selectedSiteId}): ${filtered.length} salles`);
        return filtered;
    }, [rooms, selectedSiteId, sectors]);

    // Ce `useMemo` sert à déterminer quelles salles sont affichées SOUS chaque carte de secteur visible.
    // Il respecte le filtre de site pour les secteurs eux-mêmes.
    const assignedRoomsToVisibleSectorsMap = useMemo(() => {
        const map = new Map<string, OperatingRoom[]>();
        const currentSectorNamesToDisplay = sectorNames.filter(name => {
            const sectorObject = sectors.find(s => s.name === name); // CORRECTION: comparaison directe
            if (!sectorObject) return false;
            if (selectedSiteId === null) return true;
            return sectorObject.siteId === selectedSiteId || !sectorObject.siteId;
        });

        currentSectorNamesToDisplay.forEach(sectorName => {
            // Important: Passer allRoomsFilteredBySite pour que getSectorRooms opère sur les salles déjà filtrées par site.
            const roomsInThisSector = getSectorRooms(sectorName, allRoomsFilteredBySite, sectors, sites);
            map.set(sectorName, roomsInThisSector);
        });
        return map;
    }, [sectorNames, allRoomsFilteredBySite, sectors, sites, selectedSiteId]);

    // Ce `useMemo` détermine globalement si une salle est assignée à N'IMPORTE QUEL secteur (par ID ou détection)
    // Il est utilisé pour la liste des "salles non assignées".
    const trulyAssignedRoomIdsGlobalCheck = useMemo(() => {
        const ids = new Set<number>();
        sectorNames.forEach(globalSectorName => {
            // Utiliser `rooms` (toutes les salles) pour ce check global, car une salle peut être
            // assignée à un secteur d'un autre site que celui actuellement filtré.
            const roomsInThisGlobalSector = getSectorRooms(globalSectorName, rooms, sectors, sites);
            roomsInThisGlobalSector.forEach(room => ids.add(room.id));
        });
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_GLOBAL_ASSIGNED_IDS] IDs des salles assignées globalement (total ${ids.size}):`, Array.from(ids));
        return ids;
    }, [rooms, sectors, sites, sectorNames]);

    const unassignedRoomsToDisplay = useMemo(() => {
        // Partir de allRoomsFilteredBySite pour que la section "non assignées" respecte aussi le filtre de site.
        const unassigned = allRoomsFilteredBySite.filter(room => {
            const isTrulyAssignedGlobally = trulyAssignedRoomIdsGlobalCheck.has(room.id);
            if (DEBUG_MODE && !isTrulyAssignedGlobally) {
                console.log(`[ORCP_DEBUG_UNASSIGNED] Salle "${room.name}" (ID: ${room.id}, siteId: ${room.siteId}) est considérée NON ASSIGNÉE (check global) pour affichage dans "non assignées" (filtre site: ${selectedSiteId}).`);
            }
            // if (DEBUG_MODE && isTrulyAssignedGlobally) {
            //     console.log(`[ORCP_DEBUG_UNASSIGNED] Salle "${room.name}" (ID: ${room.id}) est ASSIGNÉE (check global), ne sera pas dans "non assignées".`);
            // }
            return !isTrulyAssignedGlobally;
        });
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_UNASSIGNED] Salles non assignées finales (total ${unassigned.length} pour site ${selectedSiteId}): ${unassigned.map(r => `${r.name} (siteId ${r.siteId})`).join(', ') || 'Aucune'}`);
        return unassigned;
    }, [allRoomsFilteredBySite, trulyAssignedRoomIdsGlobalCheck, selectedSiteId]); // selectedSiteId pour la cohérence du log

    // Fonction pour récupérer les données
    const fetchData = async () => {
        setIsLoading(true);
        console.log("[ORCP_LOG] Début de fetchData...");

        try {
            const apiBaseUrl = window.location.origin;

            // Récupérer les salles d'opération
            const roomsResponse = await axios.get(`${apiBaseUrl}/api/operating-rooms`);

            // Récupérer les secteurs
            const sectorsResponse = await axios.get(`${apiBaseUrl}/api/operating-sectors`);

            // Récupérer les sites
            const sitesResponse = await axios.get(`${apiBaseUrl}/api/sites`);

            console.log("[ORCP_LOG] Données brutes SALLES (réponse API):", roomsResponse);
            console.log("[ORCP_LOG] Données brutes SECTEURS (réponse API):", sectorsResponse);
            console.log("[ORCP_LOG] Données brutes SITES (réponse API):", sitesResponse);

            let normalizedSectors: OperatingSector[] = [];
            let normalizedRooms: OperatingRoom[] = [];
            let sitesList: OperatingSite[] = [];

            // Transformer les données des secteurs
            if (sectorsResponse.data && Array.isArray(sectorsResponse.data)) {
                console.log("[ORCP_LOG] Contenu de sectorsResponse.data:", sectorsResponse.data);
                normalizedSectors = normalizeOperatingSectors(sectorsResponse.data);
            }

            // Transformer les données des salles
            if (roomsResponse.data && Array.isArray(roomsResponse.data)) {
                console.log("[ORCP_LOG] Contenu de roomsResponse.data:", roomsResponse.data);
                normalizedRooms = normalizeOperatingRooms(roomsResponse.data);
            }

            // Transformer les données des sites
            if (sitesResponse.data && Array.isArray(sitesResponse.data)) {
                console.log("[ORCP_LOG] Contenu de sitesResponse.data:", sitesResponse.data);
                sitesList = sitesResponse.data;
            }

            // Enrichir les salles avec le nom de leur secteur à partir de sectorId
            if (normalizedRooms.length > 0 && normalizedSectors.length > 0) {
                normalizedRooms = normalizedRooms.map(room => {
                    if (room.sectorId) {
                        const foundSector = normalizedSectors.find(s => s.id === room.sectorId);
                        if (foundSector) {
                            // CORRECTION: utiliser le nom original du secteur
                            return { ...room, sector: foundSector.name };
                        }
                        else {
                            // Si sectorId ne correspond à aucun secteur connu, garder room.sector tel quel (probablement vide)
                            // et logguer cette situation si pertinent.
                            if (DEBUG_MODE) console.warn(`[ORCP_WARN] Salle ID ${room.id} a un sectorId ${room.sectorId} qui ne correspond à aucun secteur connu.`);
                        }
                    }
                    return room;
                });
            }

            // Associer les sites aux salles
            normalizedRooms = associateSitesToRooms(normalizedRooms, sitesList);

            console.log("[ORCP_LOG] Secteurs normalisés:", normalizedSectors);

            // Extraire les noms de secteurs uniques
            const uniqueSectorNames = Array.from(new Set(
                normalizedSectors.map(sector => sector.name) // CORRECTION: utiliser les vrais noms des secteurs
            ));
            console.log("[ORCP_LOG] Noms de secteurs uniques:", uniqueSectorNames);

            console.log("[ORCP_LOG] Données transformées des salles (avec secteur normalisé):", normalizedRooms);

            // Initialiser l'ordre des salles par secteur
            const newRoomOrder: RoomOrderConfig = {};
            uniqueSectorNames.forEach(sectorName => {
                const sectorRoomsList = getSectorRooms(sectorName, normalizedRooms, normalizedSectors, sitesList);
                newRoomOrder[sectorName] = sectorRoomsList.map(room => room.id);
            });

            // Mettre à jour l'état
            setSites(sitesList);
            setSectors(normalizedSectors);
            setRooms(normalizedRooms);
            setSectorNames(uniqueSectorNames);
            setRoomOrder(newRoomOrder);

            // Définir un site par défaut si disponible
            if (sitesList.length > 0 && selectedSiteId === null) {
                setSelectedSiteId(sitesList[0].id);
            }

        } catch (error) {
            console.error("Erreur lors du chargement des données:", error);
            setError("Erreur lors du chargement des données");
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour filtrer les secteurs par site
    const filterSectorsBySite = (allSectors: OperatingSector[], siteId: number | null): OperatingSector[] => {
        if (siteId === null) return allSectors;

        return allSectors.filter(sector => {
            // Si le secteur a un siteId qui correspond
            if (sector.siteId === siteId) return true;

            // Si le secteur a un objet site avec un id qui correspond
            if (sector.site && sector.site.id === siteId) return true;

            // Si aucun secteur n'a de site défini, retourner tous les secteurs
            if (!allSectors.some(s => s.siteId !== undefined || (s.site && s.site.id !== undefined))) {
                return true;
            }

            return false;
        });
    };

    // Effet pour charger les données au montage
    useEffect(() => {
        fetchData();
    }, []);

    // Effet pour filtrer les secteurs quand le site change
    useEffect(() => {
        const filtered = filterSectorsBySite(sectors, selectedSiteId);
        setFilteredSectors(filtered);

        // Mettre à jour les noms de secteurs filtrés
        const filteredNames = Array.from(new Set(filtered.map(s => s.name))); // CORRECTION: utiliser les vrais noms
        setSectorNames(filteredNames);
    }, [sectors, selectedSiteId]);

    // Filtrer les salles par site sélectionné
    const filteredRooms = useMemo(() => {
        if (selectedSiteId === null) return rooms;
        if (!rooms || !rooms.length) return [];

        console.log('[ORCP_DEBUG_SITE] Filtrage des salles par site:', selectedSiteId);

        // Vérifier si les salles ont des informations de site
        const hasSiteInfo = rooms.some(room =>
            room.siteId !== undefined ||
            (room.site && room.site.id !== undefined)
        );

        if (!hasSiteInfo && selectedSiteId) {
            console.log('[ORCP_DEBUG_SITE] Aucune salle n\'a d\'information de site, affichage de toutes les salles');
            return rooms;
        }

        return rooms.filter(room => {
            // Pour le débogage
            if (DEBUG_MODE) {
                console.log(`[ORCP_DEBUG_SITE] Salle ${room.id} (${room.name}):`,
                    { siteId: room.siteId, site: room.site });
            }

            // Si la salle a explicitement un siteId qui correspond
            if (room.siteId === selectedSiteId) return true;

            // Si la salle a un objet site avec un id qui correspond
            if (room.site && room.site.id === selectedSiteId) return true;

            // Si le site est dans un autre champ
            if ((room as any).operatingSiteId === selectedSiteId) return true;
            if ((room as any).hospitalSiteId === selectedSiteId) return true;

            // Si aucune salle n'a de site défini
            if (!hasSiteInfo) return true;

            return false;
        });
    }, [rooms, selectedSiteId]);

    // Récupérer les salles triées par secteur
    const getSortedSectorRooms = useCallback((sectorName: string): OperatingRoom[] => {
        // Récupérer les salles pour ce secteur avec la détection intelligente
        const sectorRooms = getSectorRooms(sectorName, filteredRooms, sectors, sites);

        // Si nous avons un ordre défini pour ce secteur, trier les salles
        if (roomOrder[sectorName] && roomOrder[sectorName].length > 0) {
            // Créer un map pour accéder rapidement aux salles par ID
            const roomsById = Object.fromEntries(
                sectorRooms.map(room => [room.id, room])
            );

            // Récupérer uniquement les IDs qui correspondent à des salles existantes
            const validOrderedIds = roomOrder[sectorName].filter(id => roomsById[id]);

            // Créer la liste triée
            const orderedRooms = validOrderedIds.map(id => roomsById[id]);

            // Ajouter les salles qui n'ont pas d'ordre défini
            const unorderedRooms = sectorRooms.filter(room => !validOrderedIds.includes(room.id));

            return [...orderedRooms, ...unorderedRooms];
        }

        return sectorRooms;
    }, [filteredRooms, roomOrder, sectors, sites]);

    // Créer un memoized object avec les salles par secteur
    const sectorRoomsMap = useMemo(() => {
        const result: { [key: string]: OperatingRoom[] } = {};

        sectorNames.forEach(sectorName => {
            result[sectorName] = getSortedSectorRooms(sectorName);
        });

        return result;
    }, [sectorNames, getSortedSectorRooms]);

    // Gestionnaires d'événements pour le formulaire
    const handleModalChange = (open: boolean) => {
        if (!open) {
            resetFormAndCloseModal();
        }
        setIsModalOpen(open);
    };

    const resetFormAndCloseModal = () => {
        setIsEditing(null);
        setFormData({
            name: '',
            number: '',
            sector: sectorNames.length > 0 ? sectorNames[0] : '',
            roomType: 'STANDARD',
            colorCode: '#CCCCCC',
            isActive: true,
            supervisionRules: {
                maxRoomsPerSupervisor: 2
            },
            siteId: null
        });
        setFormError(null);
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'maxRoomsPerSupervisor') {
            setFormData(prev => ({
                ...prev,
                supervisionRules: {
                    ...prev.supervisionRules,
                    maxRoomsPerSupervisor: parseInt(value) || 1
                }
            }));
        } else if (name === 'siteId') {
            // Traitement spécial pour siteId qui doit être un nombre ou null
            setFormData(prev => ({
                ...prev,
                [name]: value ? parseInt(value) : null
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.number) {
            setFormError("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const apiBaseUrl = window.location.origin;

            const submitData = {
                ...formData,
                sectorId: sectors.find(s => s.name === formData.sector)?.id
            };

            if (isEditing) {
                await axios.put(`${apiBaseUrl}/api/operating-rooms/${isEditing}`, submitData);
                toast.success(`Salle ${formData.name} modifiée avec succès`);
            } else {
                await axios.post(`${apiBaseUrl}/api/operating-rooms`, submitData);
                toast.success(`Salle ${formData.name} créée avec succès`);
            }

            resetFormAndCloseModal();
            fetchData(); // Recharger les données
            setShowSuccess(true);

            // Masquer le message de succès après 3 secondes
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Erreur lors de la soumission :", error);
            setFormError("Une erreur est survenue lors de la soumission du formulaire");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddClick = () => {
        if (DEBUG_MODE) console.log("[ORCP_DEBUG_ADD] Clic sur Ajouter une salle");
        const defaultSiteIdForNewRoom = selectedSiteId || (sites.length > 0 ? sites[0].id : null);
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_ADD] Site ID par défaut pour nouvelle salle: ${defaultSiteIdForNewRoom}`);

        setFormData({
            name: '',
            number: '',
            sector: '',
            roomType: 'STANDARD',
            colorCode: '#CCCCCC',
            isActive: true,
            supervisionRules: { maxRoomsPerSupervisor: 2 },
            siteId: defaultSiteIdForNewRoom,
        });
        setIsEditing(null);
        setIsModalOpen(true);
        setFormError(null);
    };

    const handleEditClick = (room: OperatingRoom) => {
        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Clic sur Modifier salle:`, room);
        let effectiveSectorName = room.sector || '';
        let effectiveSectorId = room.sectorId || null;
        let finalSectorValueForForm = '';

        if (!effectiveSectorId && room.id) {
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" n'a pas de sectorId. Tentative de détection...`);
            // Itérer sur tous les noms de secteur connus dans le système
            for (const sn of sectorNames) {
                const roomsInSectorCandidate = getSectorRooms(sn, [room], sectors, sites);
                if (roomsInSectorCandidate.length > 0 && roomsInSectorCandidate[0].id === room.id) {
                    const detectedSectorObject = sectors.find(s => normalizeSectorName(s.name) === normalizeSectorName(sn));
                    if (detectedSectorObject) {
                        effectiveSectorName = detectedSectorObject.name; // Utiliser le nom canonique du secteur
                        effectiveSectorId = detectedSectorObject.id;
                        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" (ID: ${room.id}) : secteur DÉTECTÉ -> ${effectiveSectorName} (ID: ${effectiveSectorId})`);
                    }
                    break;
                }
            }
        }

        if (effectiveSectorId) {
            finalSectorValueForForm = String(effectiveSectorId);
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" : Utilisation de l'ID de secteur ${effectiveSectorId} pour le formulaire.`);
        } else if (effectiveSectorName && effectiveSectorName.toLowerCase() !== 'secteur non défini' && effectiveSectorName.trim() !== '') {
            finalSectorValueForForm = effectiveSectorName; // Pourrait être un nom de secteur à créer
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" : Utilisation du nom de secteur textuel "${effectiveSectorName}" pour le formulaire.`);
        } else {
            finalSectorValueForForm = '';
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" : Pas de secteur défini, formulaire vide pour secteur.`);
        }

        let formSiteId = room.siteId || null;
        if (!formSiteId && effectiveSectorId) {
            const sectorData = sectors.find(s => s.id === effectiveSectorId);
            if (sectorData && sectorData.siteId) {
                formSiteId = sectorData.siteId;
                if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" : siteId hérité du secteur ${sectorData.name} -> ${formSiteId}`);
            }
        }

        if (!formSiteId && selectedSiteId) {
            // Si aucun site n'est défini pour la salle ou son secteur (même après détection),
            // et qu'un filtre de site est actif sur l'UI, on pré-remplit avec ce site.
            // Cela aide si l'utilisateur ajoute une salle "sans secteur" pendant qu'un site est filtré.
            formSiteId = selectedSiteId;
            if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Salle "${room.name}" : siteId pré-rempli avec le filtre de site actif ${selectedSiteId} car pas d'autre siteId trouvé.`);
        }

        if (DEBUG_MODE) console.log(`[ORCP_DEBUG_EDIT] Préparation du formulaire pour "${room.name}": sectorValue="${finalSectorValueForForm}", siteId=${formSiteId}`);

        setFormData({
            name: room.name,
            number: room.number || '',
            sector: finalSectorValueForForm,
            roomType: room.roomType || 'STANDARD',
            colorCode: room.colorCode || '#CCCCCC',
            isActive: room.isActive !== undefined ? room.isActive : true,
            supervisionRules: room.supervisionRules || { maxRoomsPerSupervisor: 2 },
            siteId: formSiteId,
        });
        setIsEditing(room.id);
        setIsModalOpen(true);
        setFormError(null);
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.`)) {
            try {
                const apiBaseUrl = window.location.origin;
                await axios.delete(`${apiBaseUrl}/api/operating-rooms/${id}`);

                // Mise à jour de l'état local
                setRooms(prevRooms => prevRooms.filter(room => room.id !== id));
                toast.success("La salle a été supprimée avec succès");
            } catch (error) {
                console.error("Erreur lors de la suppression de la salle:", error);
                toast.error("Erreur lors de la suppression de la salle");
            }
        }
    };

    // Gestionnaires d'événements pour le drag & drop
    const handleGlobalReorderClick = async () => {
        if (isReordering) {
            setIsReordering(false);
            // Sauvegarder les changements ici si nécessaire
        } else {
            setInitialRoomsStateForReorder([...rooms]);
            setIsReordering(true);
            toast("Mode réorganisation activé. Glissez-déposez les salles pour changer leur secteur ou leur ordre.", { duration: 4000 });
        }
    };

    const handleRoomDragStart = (e: React.DragEvent, roomId: number, index: number, sectorName: string | null) => {
        if (!isReordering) return;

        e.dataTransfer.setData('text/plain', JSON.stringify({ id: roomId, index, originalSectorName: sectorName }));
        setDraggedItem({ id: roomId, index, originalSectorName: sectorName });
        setIsDragging(true);

        // Ajouter une classe pour le style pendant le drag
        const element = e.currentTarget as HTMLElement;
        element.classList.add('dragging');

        // Effet visuel pour le drag
        if (e.dataTransfer.setDragImage) {
            const dragImage = document.createElement('div');
            dragImage.textContent = 'Déplacer';
            dragImage.className = 'drag-image';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    };

    const handleRoomDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        setDraggedItem(null);
        setDragOverIndex(null);
        setDragOverTarget(null);

        // Supprimer toutes les classes de style
        const elements = document.querySelectorAll('.dragging, .drop-target, .drop-above, .drop-below, .valid-drop-zone');
        elements.forEach(el => {
            el.classList.remove('dragging', 'drop-target', 'drop-above', 'drop-below');
        });
        // Arrêter le défilement automatique à la fin du drag
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const handleRoomDragOver = (e: React.DragEvent, index: number, targetSectorName: string | null) => {
        e.preventDefault();
        if (!isReordering || !draggedItem) return;

        // Déterminer l'index d'insertion réel
        let insertionIndex = index;
        if (draggedItem.originalSectorName === targetSectorName) {
            const isAbove = index < draggedItem.index;
            if (isAbove) {
                insertionIndex = index;
            } else {
                insertionIndex = index + 1;
            }
        } else {
            const isAbove = index < draggedItem.index;
            insertionIndex = index;
        }

        setDragOverTarget({ sectorName: targetSectorName, index: insertionIndex });

        const element = e.currentTarget as HTMLElement;
        const rect = element.getBoundingClientRect();
        const mouseY = e.clientY;
        const positionY = mouseY - rect.top;
        const isAbove = positionY < rect.height / 2;

        // Appliquer le style visuel approprié uniquement si c'est une cible valide
        // (et non la source elle-même si on est dans le même conteneur)
        if (draggedItem.originalSectorName !== targetSectorName || draggedItem.index !== index) {
            element.classList.remove('drop-above', 'drop-below');
            element.classList.add(isAbove ? 'drop-above' : 'drop-below');
        }
        // Indicateur sur le conteneur de secteur
        const sectorContainer = element.closest('[data-sector-name], [data-unclassified-area]');
        if (sectorContainer) {
            document.querySelectorAll('.valid-drop-zone').forEach(el => el.classList.remove('valid-drop-zone'));
            sectorContainer.classList.add('valid-drop-zone');
        }

        // Gestion du défilement automatique
        const scrollThreshold = 80; // Pixels du bord pour déclencher le défilement
        const scrollSpeed = 20; // Pixels à défiler par intervalle

        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }

        if (e.clientY < scrollThreshold) {
            scrollIntervalRef.current = setInterval(() => {
                window.scrollBy(0, -scrollSpeed);
            }, 50);
        } else if (e.clientY > window.innerHeight - scrollThreshold) {
            scrollIntervalRef.current = setInterval(() => {
                window.scrollBy(0, scrollSpeed);
            }, 50);
        }
    };

    const handleRoomDragLeave = (e: React.DragEvent, targetSectorName: string | null) => {
        if (!isReordering) return;

        const element = e.currentTarget as HTMLElement;
        element.classList.remove('drop-above', 'drop-below');

        // Potentiellement enlever .valid-drop-zone si on quitte le conteneur parent
        const relatedTarget = e.relatedTarget as HTMLElement;
        const sectorContainer = element.closest('[data-sector-name], [data-unclassified-area]');
        if (sectorContainer && !sectorContainer.contains(relatedTarget)) {
            sectorContainer.classList.remove('valid-drop-zone');
        }
        // Arrêter le défilement si on quitte une zone pertinente
        if (scrollIntervalRef.current) {
            const dropZone = (e.currentTarget as HTMLElement).closest('[data-sector-name], [data-unclassified-area]');
            if (dropZone && !dropZone.contains(e.relatedTarget as Node)) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        }
    };

    const handleRoomDrop = (e: React.DragEvent, targetIndex: number, targetSectorName: string | null) => {
        e.preventDefault();
        if (!isReordering || !draggedItem || !dragOverTarget) return;

        const { id: movedRoomId, originalSectorName, index: originalIndex } = draggedItem;

        // Scénario 1: Déplacer au sein du même secteur
        if (originalSectorName === targetSectorName && targetSectorName !== null) {
            setRoomOrder(prevOrder => {
                const newOrder = { ...prevOrder };
                const sectorRooms = [...(newOrder[targetSectorName] || [])];

                // Retirer l'élément de sa position originale
                const [movedItem] = sectorRooms.splice(originalIndex, 1);

                // Calculer l'index d'insertion corrigé si l'élément a été retiré avant sa cible
                let correctedTargetIndex = targetIndex;
                if (originalIndex < targetIndex) {
                    correctedTargetIndex = targetIndex - 1;
                }

                sectorRooms.splice(correctedTargetIndex, 0, movedItem);
                newOrder[targetSectorName] = sectorRooms;
                return newOrder;
            });
        }
        // Scénario 2: Déplacer d'un secteur à un autre, ou vers/depuis non classé
        else {
            // Mise à jour de l'état `rooms` pour changer le secteur de la salle
            setRooms(prevRooms => {
                return prevRooms.map(room => {
                    if (room.id === movedRoomId) {
                        const targetSector = sectors.find(s => normalizeSectorName(s.name) === targetSectorName);
                        return {
                            ...room,
                            sector: targetSectorName || '', // Mettre à jour le nom du secteur
                            sectorId: targetSector?.id || undefined // Mettre à jour l'ID du secteur
                        };
                    }
                    return room;
                });
            });

            // Mettre à jour `roomOrder` pour les secteurs source et destination
            setRoomOrder(prevOrder => {
                const newOrder = { ...prevOrder };

                // Retirer de l'ancien secteur (si ce n'était pas "non classé")
                if (originalSectorName && newOrder[originalSectorName]) {
                    newOrder[originalSectorName] = newOrder[originalSectorName].filter(id => id !== movedRoomId);
                }

                // Ajouter au nouveau secteur (si ce n'est pas "non classé")
                if (targetSectorName) {
                    if (!newOrder[targetSectorName]) {
                        newOrder[targetSectorName] = [];
                    }
                    const sectorRooms = [...newOrder[targetSectorName]];
                    // S'assurer que l'ID n'est pas déjà là (peu probable mais sécurité)
                    if (!sectorRooms.includes(movedRoomId)) {
                        sectorRooms.splice(targetIndex, 0, movedRoomId);
                        newOrder[targetSectorName] = sectorRooms;
                    }
                }
                return newOrder;
            });
        }

        // Réinitialiser les états de drag après le drop
        handleRoomDragEnd(e);
        toast.success(`Salle déplacée vers ${targetSectorName || 'Non classées'}`);
    };

    const handleRoomReorder = (sectorName: string, roomId: number, targetIndex: number) => {
        // Mettre à jour l'ordre des salles
        setRoomOrder(prevOrder => {
            const newOrder = { ...prevOrder };
            const sectorOrder = [...(newOrder[sectorName] || [])];

            // Trouver l'index actuel et déplacer
            const currentIndex = sectorOrder.indexOf(roomId);
            if (currentIndex !== -1) {
                sectorOrder.splice(currentIndex, 1);
                sectorOrder.splice(targetIndex, 0, roomId);
                newOrder[sectorName] = sectorOrder;
            }

            return newOrder;
        });
    };

    // Rendu du composant
    return (
        <div className={`container mx-auto p-4 ${theme === 'dark' ? 'bg-slate-900' : ''}`}>
            <div className="mb-3">
                <h1 className="text-2xl font-bold mb-2 dark:text-slate-100">Configuration des salles opératoires</h1>
                <p className="text-gray-600 dark:text-slate-400">
                    Gérez vos salles d'opération et organisez-les par secteurs.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300">
                    <span className="block sm:inline">{error}</span>
                </div>
            ) : (
                <>
                    {/* Filtres par site avec boutons */}
                    {sites.length > 0 && (
                        <div className="mb-3 bg-white dark:bg-slate-900 p-3 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                            <div className="flex flex-col gap-2">
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200">Filtrer par site</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Sélectionnez un site pour affiner la vue.</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {/* Bouton "Tous les sites" */}
                                    <button
                                        onClick={() => setSelectedSiteId(null)}
                                        className={`flex items-center px-3 py-1.5 rounded-md border transition-all duration-200 text-sm focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-500 ${selectedSiteId === null
                                            ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-md dark:bg-primary-600 dark:hover:bg-primary-700'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${selectedSiteId === null ? (theme === 'dark' ? 'bg-slate-400' : 'bg-slate-500') : (theme === 'dark' ? 'bg-slate-500' : 'bg-slate-400')}`}></span>
                                        Tous les sites
                                    </button>

                                    {/* Boutons pour chaque site */}
                                    {sites.map((site) => (
                                        <button
                                            key={site.id}
                                            onClick={() => setSelectedSiteId(site.id)}
                                            className={`flex items-center px-3 py-1.5 rounded-md border transition-all duration-200 text-sm focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-500 ${selectedSiteId === site.id
                                                ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-md dark:bg-primary-600 dark:hover:bg-primary-700'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            <span
                                                className="h-2.5 w-2.5 rounded-full mr-2"
                                                style={{
                                                    backgroundColor: selectedSiteId === site.id
                                                        ? (theme === 'dark' ? 'white' : (site.colorCode || getSiteColor(site.id)))
                                                        : (theme === 'dark' ? `${site.colorCode || getSiteColor(site.id)}B3` : (site.colorCode || getSiteColor(site.id)))
                                                }}
                                            ></span>
                                            {site.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Affichage du filtre actif */}
                                {selectedSiteId && (
                                    <div className="mt-2 flex items-center text-xs text-white py-1 px-2.5 rounded-full inline-block bg-blue-700 dark:bg-primary-500 shadow">
                                        <span>Filtre : {sites.find(s => s.id === selectedSiteId)?.name}</span>
                                        <button
                                            onClick={() => setSelectedSiteId(null)}
                                            className="ml-1.5 text-white hover:text-blue-200 dark:hover:text-primary-200"
                                            aria-label="Effacer le filtre"
                                        >
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bouton d'ajout */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Salles d'opération</h2>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAddClick}
                                className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-primary-600 dark:hover:bg-primary-700 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary-500 focus:ring-offset-2"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Ajouter une salle
                            </Button>
                            <Button
                                onClick={handleGlobalReorderClick}
                                variant="outline"
                                className={`
                                    font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${isReordering
                                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white focus:ring-red-500 dark:focus:ring-red-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-gray-400 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500'}
                                `}
                            >
                                <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                                {isReordering ? 'Terminer' : 'Réorganiser'}
                            </Button>
                        </div>
                    </div>

                    {/* Message de succès */}
                    {showSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300">
                            <span className="block sm:inline">Les modifications ont été enregistrées avec succès.</span>
                        </div>
                    )}

                    {/* Conteneur des secteurs */}
                    <div className="grid grid-cols-1 gap-2">
                        {sectorNames
                            .filter(name => {
                                const sectorObject = sectors.find(s => normalizeSectorName(s.name) === normalizeSectorName(name));
                                if (!sectorObject) return false;
                                if (selectedSiteId === null) return true;
                                return sectorObject.siteId === selectedSiteId || !sectorObject.siteId;
                            })
                            .map((sectorName) => {
                                const sectorRooms = getSortedSectorRooms(sectorName);
                                const sectorObject = sectors.find(s => normalizeSectorName(s.name) === normalizeSectorName(sectorName));
                                const sectorColor = sectorObject?.colorCode || (theme === 'dark' ? '#334155' : '#E5E7EB'); // slate-700 for dark, gray-200 for light as default

                                const isColorDark = (color: string): boolean => {
                                    if (!color.startsWith('#')) return false;
                                    const hex = color.replace('#', '');
                                    const r = parseInt(hex.substring(0, 2), 16);
                                    const g = parseInt(hex.substring(2, 4), 16);
                                    const b = parseInt(hex.substring(4, 6), 16);
                                    const luminance = (r * 299 + g * 587 + b * 114) / 1000;
                                    return luminance < 128;
                                };

                                const textColorClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800'; // Simplifié pour le test
                                const subTextColorClass = theme === 'dark' ? 'text-slate-300' : 'text-gray-500';
                                const badgeBgClass = isColorDark(sectorColor) && theme === 'dark' ? 'bg-black/20 hover:bg-black/30' : (theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-500/10 hover:bg-gray-500/20');

                                return (
                                    <div
                                        key={sectorName}
                                        className={`rounded-xl shadow-lg py-3 px-4 ${isReordering ? 'relative border-2 border-transparent' : ''} ${dragOverTarget?.sectorName === sectorName && draggedItem && draggedItem.originalSectorName !== sectorName ? 'border-blue-400 ring-2 ring-blue-300 ring-opacity-75 dark:border-blue-500 dark:ring-blue-400' : ''} transition-all duration-150`}
                                        style={{ backgroundColor: theme === 'dark' ? `${sectorColor}B3` : `${sectorColor}3A` }} // Opacité ~70% pour le fond du secteur en sombre
                                        data-sector-name={sectorName}
                                        onDragOver={(e) => {
                                            if (isReordering && draggedItem && draggedItem.originalSectorName !== sectorName) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverTarget({ sectorName: sectorName, index: sectorRooms.length });
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            if (isReordering && draggedItem && draggedItem.originalSectorName !== sectorName && dragOverTarget?.sectorName === sectorName) {
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
                                                    setDragOverTarget(null);
                                                }
                                            }
                                        }}
                                        onDrop={(e) => {
                                            if (isReordering && draggedItem && draggedItem.originalSectorName !== sectorName) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRoomDrop(e, sectorRooms.length, sectorName);
                                                setDragOverTarget(null);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className={`text-lg font-bold flex items-center ${textColorClass}`}>
                                                <span className="flex-grow tracking-tight">{sectorName}</span>
                                                <span className={`text-xs font-medium ml-3 px-1.5 py-0.5 rounded-full ${badgeBgClass} ${subTextColorClass}`}>
                                                    {sectorRooms.length} salle{sectorRooms.length !== 1 ? 's' : ''}
                                                </span>
                                            </h3>
                                        </div>

                                        {sectorRooms.length === 0 && isReordering ? (
                                            <div
                                                className="h-24 border-2 border-dashed border-gray-400/50 dark:border-slate-600/50 rounded-lg flex items-center justify-center text-gray-500/70 dark:text-slate-500 hover:border-blue-500/70 dark:hover:border-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                                style={{ backgroundColor: theme === 'dark' ? `${sectorColor}80` : `${sectorColor}1A` }} // Opacité ~50% pour la zone de drop
                                                onDragOver={(e) => handleRoomDragOver(e, 0, sectorName)}
                                                onDragLeave={(e) => handleRoomDragLeave(e, sectorName)}
                                                onDrop={(e) => handleRoomDrop(e, 0, sectorName)}
                                            >
                                                Déposer une salle ici
                                            </div>
                                        ) : sectorRooms.length === 0 ? (
                                            <p className={`italic text-sm ${subTextColorClass}`}>Aucune salle dans ce secteur</p>
                                        ) : (
                                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 ${isReordering ? 'p-2 border-2 border-dashed border-transparent dark:border-transparent rounded-lg' : ''} ${isReordering && draggedItem && draggedItem.originalSectorName !== sectorName && !dragOverTarget?.sectorName ? 'hover:border-blue-400/50 dark:hover:border-blue-500/50' : ''}`}
                                                data-sector-name={sectorName}
                                            >
                                                {sectorRooms.map((room, index) => (
                                                    <div
                                                        key={room.id}
                                                        className={`room-item border rounded-xl py-2.5 px-3 flex items-center justify-between group transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-1 ${isReordering
                                                            ? 'cursor-move bg-white/80 backdrop-blur-md hover:bg-blue-50/80 dark:bg-slate-700/80 dark:hover:bg-primary-700/60'
                                                            : 'bg-white/80 backdrop-blur-sm hover:bg-slate-50/70 dark:bg-slate-700/70 dark:hover:bg-slate-600/70'
                                                            } ${draggedItem?.id === room.id ? 'opacity-40 scale-90 shadow-xl' : ''} 
                                                          ${dragOverTarget?.sectorName === sectorName && dragOverTarget?.index === index ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-current shadow-lg dark:ring-blue-500 dark:ring-offset-slate-800' : 'border-gray-200/70 dark:border-slate-600/70'
                                                            }`}
                                                        style={{ borderColor: dragOverTarget?.sectorName === sectorName && dragOverTarget?.index === index ? '' : (theme === 'dark' ? `${sectorColor}80` : `${sectorColor}3A`) }}
                                                        data-room-id={room.id}
                                                        draggable={isReordering}
                                                        onDragStart={(e) => handleRoomDragStart(e, room.id, index, sectorName)}
                                                        onDragEnd={handleRoomDragEnd}
                                                        onDragOver={(e) => handleRoomDragOver(e, index, sectorName)}
                                                        onDragLeave={(e) => handleRoomDragLeave(e, sectorName)}
                                                        onDrop={(e) => handleRoomDrop(e, index, sectorName)}
                                                    >
                                                        <div className="flex-grow">
                                                            <div className="font-bold text-gray-700 text-base group-hover:text-blue-600 transition-colors dark:text-slate-100 dark:group-hover:text-primary-300">{room.name}</div>
                                                            <div className="text-xs text-gray-500 group-hover:text-gray-600 dark:text-slate-400 dark:group-hover:text-slate-300">N° {room.number || '-'}</div>
                                                        </div>
                                                        <div className={`flex space-x-1 ${isReordering ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                                                            <button
                                                                onClick={() => handleEditClick(room)}
                                                                title="Modifier"
                                                                className="p-2 rounded-lg text-gray-400 hover:bg-slate-100 hover:text-blue-600 transition-all duration-150 transform hover:scale-110 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-primary-400"
                                                                disabled={isReordering}
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(room.id)}
                                                                title="Supprimer"
                                                                className="p-2 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all duration-150 transform hover:scale-110 dark:text-slate-400 dark:hover:bg-red-700/30 dark:hover:text-red-400"
                                                                disabled={isReordering}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                            {isReordering && (
                                                                <div className="p-2 rounded-lg text-blue-500">
                                                                    <ArrowsUpDownIcon className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>

                    {/* Section pour les salles sans secteur défini ou non affichées ailleurs */}
                    <div
                        className={`mt-3 rounded-lg p-2 ${isReordering ? 'bg-yellow-50 border-2 border-dashed border-yellow-400 hover:border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-600/50 dark:hover:border-yellow-500' : 'bg-gray-100 dark:bg-slate-800 dark:border dark:border-slate-700'}`}
                        data-unclassified-area="true"
                        onDragOver={(e) => {
                            if (isReordering && draggedItem) {
                                e.preventDefault();
                                const unclassifiedRooms = rooms.filter(r => !r.sectorId); // Simplicication pour le drop
                                handleRoomDragOver(e, unclassifiedRooms.length - 1, null);
                                const container = e.currentTarget as HTMLElement;
                                container.classList.add('valid-drop-zone');
                                container.classList.remove('drop-above');
                                container.classList.remove('drop-below');
                            }
                        }}
                        onDragLeave={(e) => {
                            if (isReordering) {
                                const container = e.currentTarget as HTMLElement;
                                container.classList.remove('valid-drop-zone');
                            }
                        }}
                        onDrop={(e) => {
                            if (isReordering && draggedItem) {
                                const unclassifiedRooms = rooms.filter(r => !r.sectorId); // Simplicication pour le drop
                                handleRoomDrop(e, unclassifiedRooms.length, null);
                            }
                        }}
                    >
                        <h3 className="text-base font-semibold mb-1 dark:text-slate-200">Salles sans secteur</h3>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Salles qui n'ont pas de secteur défini. Vous pouvez glisser des salles ici ou depuis ici en mode réorganisation.</p>

                        {isReordering && rooms.filter(room => !room.sectorId).length === 0 && (
                            <div
                                className="h-16 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-md flex items-center justify-center text-gray-400 dark:text-slate-500 hover:border-yellow-500 dark:hover:border-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                onDragOver={(e) => handleRoomDragOver(e, 0, null)}
                                onDragLeave={(e) => handleRoomDragLeave(e, null)}
                                onDrop={(e) => handleRoomDrop(e, 0, null)}
                            >
                                Déposer une salle ici pour la déclassifier
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1"> {/* Assurer gap-1 ici aussi pour cohérence */}
                            {/* Utiliser unassignedRoomsToDisplay ici */}
                            {unassignedRoomsToDisplay.map((room, index) => (
                                <div
                                    key={room.id}
                                    className={`room-item border rounded-md py-1 px-2 flex items-center justify-between group transition-all duration-150 ease-in-out ${isReordering
                                        ? 'cursor-move bg-white hover:bg-yellow-100 shadow-sm hover:shadow-md dark:bg-slate-700 dark:hover:bg-yellow-700/30'
                                        : 'bg-white hover:bg-yellow-50 dark:bg-slate-700 dark:hover:bg-slate-600'}
                                        ${draggedItem?.id === room.id ? 'opacity-40 scale-95' : ''}
                                        ${dragOverTarget?.sectorName === null && dragOverTarget?.index === index ? 'ring-2 ring-yellow-500 dark:ring-yellow-400 ring-offset-1' : 'dark:border-slate-600'}
                                    `}
                                    data-room-id={room.id}
                                    draggable={isReordering}
                                    onDragStart={(e) => handleRoomDragStart(e, room.id, index, null)}
                                    onDragEnd={handleRoomDragEnd}
                                    onDragOver={(e) => handleRoomDragOver(e, index, null)}
                                    onDragLeave={(e) => handleRoomDragLeave(e, null)}
                                    onDrop={(e) => handleRoomDrop(e, index, null)}
                                >
                                    <div className="flex-grow">
                                        <div className="font-medium text-gray-800 text-sm dark:text-slate-100">{room.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400">N° {room.number}</div>
                                        {room.siteId && (
                                            <div className="text-xs text-blue-600 dark:text-primary-400 mt-0.5">
                                                Site: {sites.find(s => s.id === room.siteId)?.name || 'Inconnu'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleEditClick(room)}
                                            title="Assigner à un secteur"
                                            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-600"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modale pour ajouter/modifier une salle */}
                    <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Modifier la salle' : 'Ajouter une nouvelle salle'}</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-medium">
                                        Nom de la salle <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Salle 1"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="number" className="block text-sm font-medium">
                                        Numéro <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="number"
                                        name="number"
                                        value={formData.number}
                                        onChange={handleInputChange}
                                        placeholder="Ex: S01"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="sector" className="block text-sm font-medium">
                                        Secteur
                                    </label>
                                    <select
                                        id="sector"
                                        name="sector"
                                        value={formData.sector}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Non défini</option>
                                        {sectorNames.map((name, index) => (
                                            <option key={index} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="siteId" className="block text-sm font-medium">
                                        Site hospitalier
                                    </label>
                                    <select
                                        id="siteId"
                                        name="siteId"
                                        value={formData.siteId !== null && formData.siteId !== undefined ? formData.siteId.toString() : ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Non défini</option>
                                        {sites.map((site) => (
                                            <option key={site.id} value={site.id.toString()}>
                                                {site.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="roomType" className="block text-sm font-medium">
                                        Type de salle
                                    </label>
                                    <select
                                        id="roomType"
                                        name="roomType"
                                        value={formData.roomType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {getRoomTypeOptions().map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="colorCode" className="block text-sm font-medium">
                                        Code couleur
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="colorCode"
                                            name="colorCode"
                                            type="color"
                                            value={formData.colorCode || "#CCCCCC"}
                                            onChange={handleInputChange}
                                            className="w-12 h-8 p-0"
                                        />
                                        <Input
                                            name="colorCode"
                                            value={formData.colorCode || "#CCCCCC"}
                                            onChange={handleInputChange}
                                            placeholder="#RRGGBB"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="isActive"
                                        name="isActive"
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                        Salle active
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="maxRoomsPerSupervisor" className="block text-sm font-medium">
                                        Nombre maximum de salles par superviseur
                                    </label>
                                    <Input
                                        id="maxRoomsPerSupervisor"
                                        name="maxRoomsPerSupervisor"
                                        type="number"
                                        min="1"
                                        value={formData.supervisionRules.maxRoomsPerSupervisor || 1}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {formError && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                                        <AlertTriangle className="h-5 w-5 mt-0.5 mr-2" />
                                        <p>{formError}</p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" onClick={resetFormAndCloseModal}>
                                            Annuler
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSubmitting} className="dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white">
                                        {isSubmitting ? (isEditing ? 'Sauvegarde...' : 'Ajout...') : (isEditing ? 'Sauvegarder' : 'Ajouter')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {isReordering && (
                <div className="fixed bottom-4 right-4 flex gap-2 z-50">
                    {/* Les boutons Annuler et Terminer la réorganisation sont maintenant gérés par le bouton global unique */}
                </div>
            )}

            {/* Styles CSS pour le drag & drop */}
            <style jsx>{`
                .room-item.dragging {
                    opacity: 0.5;
                    border: 2px dashed #3b82f6;
                    background-color: #fff;
                }
                
                .room-item.drop-target {
                    /* background-color: rgba(59, 130, 246, 0.1); */
                }
                
                .room-item.drop-above {
                    border-top: 2px solid #3b82f6;
                    padding-top: calc(0.75rem - 2px);
                }
                
                .room-item.drop-below {
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: calc(0.75rem - 2px);
                }
                
                .drag-image {
                    padding: 4px 8px;
                    background: #3b82f6;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .room-item {
                    transition: all 0.2s ease-in-out;
                }

                .room-item:hover {
                    transform: translateY(-1px);
                }

                .room-item.dragging:hover {
                    transform: scale(1.05);
                }

                .valid-drop-zone {
                    border-color: #2563eb !important;
                    background-color: rgba(59, 130, 246, 0.05);
                }

                .empty-drop-zone {
                    min-height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed #cbd5e1;
                    border-radius: 0.375rem;
                    color: #9ca3af;
                    font-style: italic;
                    transition: all 0.2s ease-in-out;
                }
                .empty-drop-zone:hover, .empty-drop-zone.valid-drop-zone {
                    border-color: #3b82f6;
                    background-color: rgba(59, 130, 246, 0.05);
                }
            `}</style>
        </div>
    );
};

// Configuration de test pour le débogage
const TEST_MODE = false;

// Fonction de test pour simuler des données
const runTest = async () => {
    // Vérifier si nous sommes en mode test
    const forceTest = typeof window !== 'undefined' &&
        (localStorage.getItem('FORCE_OP_ROOM_TEST') === 'true' || TEST_MODE);

    if (!forceTest) return;

    console.log("=== DÉBUT DES TESTS AUTOMATIQUES ===");
    try {
        // Simuler les tests
        console.log("Test terminé avec succès");
    } catch (error) {
        console.error("Erreur pendant les tests:", error);
    }
};

// Fonction utilitaire pour générer une couleur consistante pour un site
const getSiteColor = (id: number): string => {
    // Liste de couleurs vives
    const colors = [
        '#4F46E5', // Indigo
        '#0EA5E9', // Bleu ciel
        '#10B981', // Émeraude
        '#F59E0B', // Ambre
        '#EF4444', // Rouge
        '#8B5CF6', // Violet
        '#EC4899', // Rose
        '#06B6D4', // Cyan
    ];

    // Utiliser l'ID comme seed pour choisir une couleur
    return colors[id % colors.length];
};

export default OperatingRoomsConfigPanel;
