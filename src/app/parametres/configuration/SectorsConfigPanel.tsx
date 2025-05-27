'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArrowsUpDownIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    Input,
    Textarea,
    Checkbox,
    Label
} from "@/components/ui";
import { Role } from '@prisma/client';
import { SECTOR_CATEGORY_TYPES, SECTOR_CATEGORY_LABELS, getSectorCategoryOptions } from '../../../modules/planning/bloc-operatoire/constants/sectorCategoryTypes';

// Types pour les secteurs
type Sector = {
    id: number;
    name: string;
    color: string; // Supposé exister, même si pas utilisé dans le form ?
    colorCode: string;
    description?: string;
    category?: string; // Ajout du champ category
    rules?: {
        maxRoomsPerSupervisor: number;
    };
    isActive: boolean;
    siteId: string | null; // ID du site est une string (cuid) ou null
    displayOrder?: number;
};

type SectorFormData = {
    name: string;
    colorCode: string;
    isActive: boolean;
    description: string;
    category?: string; // Ajout du champ category
    rules: any;
    siteId: string | null; // ID du site est une string (cuid) ou null
};

// Type pour un site (correspondant au template Prisma)
type Site = {
    id: string; // ID est une string (cuid)
    name: string;
    description?: string | null; // Rendre description nullable comme dans Prisma
    isActive: boolean;
    displayOrder?: number; // Ajouté pour le tri
    createdAt?: string; // Optionnel, ajouté pour info
    updatedAt?: string; // Optionnel, ajouté pour info
    operatingSectors?: Sector[]; // Ajouté pour les secteurs opératoires
};

// Type pour les données du formulaire de site
type SiteFormData = {
    name: string;
    description: string;
    isActive: boolean;
};

// Type pour la configuration de l'ordre des secteurs par site
type SectorOrderConfig = {
    orderedSectorIdsBySite: { [siteId: string]: number[] }; // Utiliser string pour siteId
};

// Sites statiques pour le développement (SERA SUPPRIMÉ)
// const STATIC_SITES: Site[] = [
//     { id: 1, name: "Site Principal", description: "Hôpital principal", isActive: true },
//     { id: 2, name: "Clinique Nord", description: "Clinique secondaire", isActive: true },
//     { id: 3, name: "Centre de Jour", description: "Centre ambulatoire", isActive: true }
// ];

// Styles pour les animations
const globalStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.sector-item {
  cursor: move;
  transition: all 0.2s ease-in-out;
  position: relative;
  z-index: 1;
}

.sector-item.dragging {
  opacity: 0.7;
  transform: scale(0.98) rotate(1deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.drop-target {
  transition: all 0.3s ease-in-out;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  min-height: 50px;
}

.drop-target.drag-over {
  background-color: #dbeafe;
  border: 2px dashed #93c5fd;
  padding: 8px;
  transform: scale(1.005);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.dark .drop-target.drag-over {
  background-color: #1e3a8a;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.drop-above {
  position: relative;
  border-top: 3px solid #3B82F6 !important;
  margin-top: -1px;
  z-index: 5;
}

.drop-below {
  position: relative;
  border-bottom: 3px solid #3B82F6 !important;
  margin-bottom: -1px;
  z-index: 5;
}

@keyframes appear {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.sector-item-new {
  animation: appear 0.5s ease-out forwards;
}
`;

// Fonction utilitaire pour générer des IDs stables
function safeId(prefix: string, id: string | number | null): string {
    // Gérer le cas null explicitement, par exemple en utilisant une chaîne spéciale
    const safeIdValue = id === null ? 'null-site' : id;
    return `${prefix}-${safeIdValue}`.replace(/\s+/g, '-');
}

const SectorsConfigPanel: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [sites, setSites] = useState<Site[]>([]); // Initialiser avec un tableau vide
    const [isLoadingSectors, setIsLoadingSectors] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // États pour le drag and drop
    const [draggingSectorId, setDraggingSectorId] = useState<number | null>(null);
    const [dragOverSiteId, setDragOverSiteId] = useState<string | null>(null); // Utiliser string | null
    const [dragOverSectorId, setDragOverSectorId] = useState<number | null>(null);

    // --- États ajoutés pour la réorganisation ---
    const [isReordering, setIsReordering] = useState<boolean>(false);
    const [sectorOrder, setSectorOrder] = useState<SectorOrderConfig>({ orderedSectorIdsBySite: {} });
    const [saveMessage, setSaveMessage] = useState('');

    // Ajouter un état pour les erreurs de chargement
    const [sitesLoading, setSitesLoading] = useState(true);
    const [sitesError, setSitesError] = useState<string | null>(null); // Ajouté pour les erreurs de chargement des sites
    const [sectorsError, setSectorsError] = useState<string | null>(null);

    // États pour le formulaire et la modale (SECTEUR)
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState<SectorFormData>({
        name: '',
        colorCode: '#3B82F6',
        isActive: true,
        description: '',
        rules: {
            maxRoomsPerSupervisor: 2
        },
        siteId: null // Site par défaut est null ou le premier site chargé
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // --- NOUVEAU : États pour le formulaire et la modale (SITE)
    const [isSiteModalOpen, setIsSiteModalOpen] = useState<boolean>(false);
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null); // ID du site en cours d'édition (string)
    const [siteFormData, setSiteFormData] = useState<SiteFormData>({
        name: '',
        description: '',
        isActive: true,
    });
    const [siteFormError, setSiteFormError] = useState<string | null>(null); // Erreur formulaire SITE
    const [isSubmittingSite, setIsSubmittingSite] = useState<boolean>(false);

    // État pour le mode réorganisation
    const [isReorderingMode, setIsReorderingMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(false);

    // Injecter les styles globaux
    useEffect(() => {
        // Créer et injecter la balise style
        const styleElement = document.createElement('style');
        styleElement.innerHTML = globalStyles;
        document.head.appendChild(styleElement);

        // Nettoyer lors du démontage
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Charger les sites depuis l'API
    const fetchSites = useCallback(async () => {
        setSitesLoading(true);
        setSitesError(null);
        try {
            console.log("Fetching sites from API...");
            const response = await axios.get<Site[]>('/api/sites');
            const fetchedSites = response.data || [];
            console.log("Sites fetched successfully:", fetchedSites);
            // Trier les sites par nom par défaut pour la cohérence
            fetchedSites.sort((a, b) => a.name.localeCompare(b.name));
            setSites(fetchedSites);
            // Mettre à jour le siteId par défaut dans formData (secteur) si nécessaire
            if (fetchedSites.length > 0 && formData.siteId === null) {
                setFormData(prev => ({ ...prev, siteId: fetchedSites[0].id }));
            }
            // Si aucun site n'existe, s'assurer que le siteId du formulaire secteur est null
            if (fetchedSites.length === 0) {
                setFormData(prev => ({ ...prev, siteId: null }));
            }
        } catch (err: any) {
            console.error("Erreur lors du chargement des sites:", err);
            setSitesError(err.response?.data?.error || err.message || 'Impossible de charger les sites.');
            toast.error('Erreur lors du chargement des sites');
        } finally {
            setSitesLoading(false);
        }
    }, [formData.siteId]); // Conserver formData.siteId ici

    // Charger les secteurs
    const fetchSectors = useCallback(async () => {
        setIsLoadingSectors(true);
        setSectorsError(null);
        try {
            const response = await axios.get<Sector[]>('/api/sectors');
            const fetchedSectors = response.data || [];

            // Le backend devrait maintenant renvoyer siteId comme string ou null
            // Pas besoin de mapper ici si l'API est correcte

            setSectors(fetchedSectors);
        } catch (error: any) {
            console.error("Erreur lors du chargement des secteurs:", error);
            setSectorsError(error.response?.data?.error || error.message || 'Impossible de charger les secteurs.');
            toast.error('Erreur lors du chargement des secteurs');
            // Ne plus utiliser de données mock ici
        } finally {
            setIsLoadingSectors(false);
        }
    }, []);

    // Charger l'ordre initial des secteurs depuis localStorage ou API si nécessaire
    useEffect(() => {
        fetchSites(); // Charger les sites en premier
        fetchSectors();
        // Charger l'ordre depuis localStorage
        const storedOrder = localStorage.getItem('sectorOrderConfig');
        if (storedOrder) {
            try {
                const parsedOrder: SectorOrderConfig = JSON.parse(storedOrder);
                const validatedOrder: { [siteId: string]: number[] } = {};
                if (parsedOrder && parsedOrder.orderedSectorIdsBySite && typeof parsedOrder.orderedSectorIdsBySite === 'object') {
                    Object.keys(parsedOrder.orderedSectorIdsBySite).forEach(key => {
                        const ids = parsedOrder.orderedSectorIdsBySite[key];
                        if (typeof key === 'string' && Array.isArray(ids) && ids.every(id => typeof id === 'number')) {
                            // Assurer l'unicité des IDs au chargement et filtrer les non-nombres au cas où
                            const uniqueIds = [...new Set(ids.filter(id => typeof id === 'number'))];
                            validatedOrder[key] = uniqueIds;
                        } else {
                            console.warn(`Invalid or corrupt data in localStorage for sectorOrderConfig site key ${key}. Contents:`, ids, `Skipping this key.`);
                        }
                    });
                } else {
                    console.warn("Invalid structure for sectorOrderConfig in localStorage. Resetting to empty.", parsedOrder);
                }
                setSectorOrder({ orderedSectorIdsBySite: validatedOrder });
                console.log("Ordre des secteurs chargé (et validé/nettoyé) depuis localStorage:", validatedOrder);
            } catch (e) {
                console.error("Erreur lors du parsing de l'ordre des secteurs depuis localStorage (ou données corrompues):", e);
                localStorage.removeItem('sectorOrderConfig'); // Nettoyer si invalide
                setSectorOrder({ orderedSectorIdsBySite: {} }); // Réinitialiser à un état vide
            }
        } else {
            console.log("Aucun sectorOrderConfig trouvé dans localStorage. Initialisation à un état vide.");
            setSectorOrder({ orderedSectorIdsBySite: {} }); // Initialiser si rien n'est stocké
        }
    }, [fetchSites, fetchSectors]); // Dépendances correctes

    // Sauvegarder l'ordre des secteurs dans localStorage
    const saveSectorOrderToStorage = useCallback((newOrder: SectorOrderConfig) => {
        try {
            // Assurer que les clés sont des strings
            const orderToSave: { [siteId: string]: number[] } = {};
            Object.keys(newOrder.orderedSectorIdsBySite).forEach(key => {
                if (typeof key === 'string') {
                    orderToSave[key] = newOrder.orderedSectorIdsBySite[key];
                }
            });
            localStorage.setItem('sectorOrderConfig', JSON.stringify({ orderedSectorIdsBySite: orderToSave }));
            console.log("Ordre des secteurs sauvegardé dans localStorage:", orderToSave);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'ordre des secteurs dans localStorage:", e);
        }
    }, []);

    // Drag and Drop Handlers (ajuster pour siteId string)
    const handleDragStart = (e: React.DragEvent, sectorId: number) => {
        if (!isReordering) { // Ajout de cette condition
            e.preventDefault(); // Empêcher le drag si pas en mode réorganisation
            return;
        }
        console.log(`Drag Start: Sector ${sectorId}`);
        setDraggingSectorId(sectorId);
        e.dataTransfer.effectAllowed = 'move';
        // Optionnel: passer l'ID dans dataTransfer
        e.dataTransfer.setData('text/plain', sectorId.toString());
    };

    const handleDragEnd = (e: React.DragEvent) => {
        console.log("Drag End");
        // Retirer les styles visuels du drop target
        if (dragOverSiteId) {
            const targetElement = document.getElementById(safeId('drop-target-site', dragOverSiteId));
            targetElement?.classList.remove('drag-over');
        }
        if (dragOverSectorId !== null) {
            const targetElement = document.getElementById(safeId('sector-item', dragOverSectorId));
            targetElement?.classList.remove('drop-above', 'drop-below');
        }
        setDraggingSectorId(null);
        setDragOverSiteId(null);
        setDragOverSectorId(null);
    };

    // Quand on survole une zone de site
    const handleDragOver = (e: React.DragEvent, siteId: string) => {
        e.preventDefault(); // Nécessaire pour permettre le drop
        e.dataTransfer.dropEffect = 'move';

        if (siteId !== dragOverSiteId) {
            console.log(`Drag Over Site: ${siteId}`);
            // Retirer l'ancien highlight
            if (dragOverSiteId) {
                const oldTarget = document.getElementById(safeId('drop-target-site', dragOverSiteId));
                oldTarget?.classList.remove('drag-over');
            }
            // Ajouter le nouveau highlight
            const targetElement = document.getElementById(safeId('drop-target-site', siteId));
            targetElement?.classList.add('drag-over');
            setDragOverSiteId(siteId);
            setDragOverSectorId(null); // Réinitialiser le survol de secteur
        }
    };

    // Quand on survole un secteur spécifique (pour insérer avant/après)
    const handleSectorDragOver = (e: React.DragEvent, sectorId: number) => {
        e.preventDefault();
        e.stopPropagation(); // Empêcher handleDragOver du site parent de s'exécuter
        e.dataTransfer.dropEffect = 'move';

        if (!draggingSectorId || sectorId === draggingSectorId) return; // Ne rien faire si on survole le secteur qu'on déplace

        if (sectorId !== dragOverSectorId) {
            console.log(`Drag Over Sector: ${sectorId}`);
            const targetElement = e.currentTarget as HTMLElement;
            const rect = targetElement.getBoundingClientRect();
            const verticalMidpoint = rect.top + rect.height / 2;
            const isOverTopHalf = e.clientY < verticalMidpoint;

            // Retirer les anciens indicateurs
            document.querySelectorAll('.drop-above, .drop-below').forEach(el => el.classList.remove('drop-above', 'drop-below'));

            // Ajouter le nouvel indicateur
            if (isOverTopHalf) {
                targetElement.classList.add('drop-above');
            } else {
                targetElement.classList.add('drop-below');
            }
            setDragOverSectorId(sectorId); // Mémoriser le secteur survolé
        }
    };

    // Quand on quitte le survol d'un secteur
    const handleSectorDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Ne retirer l'indicateur que si on quitte vraiment l'élément (relatedTarget)
        const targetElement = e.currentTarget as HTMLElement;
        if (!targetElement.contains(e.relatedTarget as Node)) {
            targetElement.classList.remove('drop-above', 'drop-below');
            if (dragOverSectorId === parseInt(targetElement.id.split('-').pop() || '0')) {
                setDragOverSectorId(null);
            }
        }
    };

    // Quand on quitte une zone de site
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        const targetElement = e.currentTarget as HTMLElement;
        // Ne retirer la classe que si on quitte vraiment la zone (pas juste un enfant)
        if (!targetElement.contains(e.relatedTarget as Node)) {
            targetElement.classList.remove('drag-over');
            setDragOverSiteId(null);
        }
    };

    // Quand on lâche le secteur
    const handleDrop = (e: React.DragEvent, targetSiteId: string) => {
        e.preventDefault();
        console.log(`Drop on Site: ${targetSiteId}, Sector Over: ${dragOverSectorId}`);
        if (draggingSectorId === null) return;

        const droppedSectorId = draggingSectorId; // Pour clarté

        setSectorOrder(prevOrder => {
            console.log("setSectorOrder - prevOrder.orderedSectorIdsBySite:", JSON.stringify(prevOrder.orderedSectorIdsBySite, null, 2));
            const newOrderedIdsBySite = JSON.parse(JSON.stringify(prevOrder.orderedSectorIdsBySite));

            const currentSectorInfo = sectors.find(s => s.id === droppedSectorId);
            const originalSiteKey = currentSectorInfo?.siteId === null ? 'null' : (currentSectorInfo?.siteId || 'null'); // Assurer clé valide

            // ÉTAPE A: Retirer droppedSectorId de PARTOUT dans newOrderedIdsBySite
            Object.keys(newOrderedIdsBySite).forEach(siteKey => {
                newOrderedIdsBySite[siteKey] = newOrderedIdsBySite[siteKey].filter((id: number) => id !== droppedSectorId);
                // Optionnel mais propre: supprimer la clé du site si la liste devient vide après le retrait
                if (newOrderedIdsBySite[siteKey].length === 0) {
                    delete newOrderedIdsBySite[siteKey];
                }
            });

            // ÉTAPE B: Préparer la liste cible et y insérer l'élément
            const targetListKey = targetSiteId; // targetSiteId est 'null' (string) ou CUID
            if (!newOrderedIdsBySite[targetListKey]) {
                newOrderedIdsBySite[targetListKey] = [];
            }
            const targetList = newOrderedIdsBySite[targetListKey];

            // La logique d'insertion existante (avec dragOverSectorId etc.) doit être préservée ici
            // et opérer sur `targetList`.
            let targetIndex = -1;

            if (dragOverSectorId !== null && dragOverSectorId !== droppedSectorId) {
                targetIndex = targetList.indexOf(dragOverSectorId);
            }

            if (targetIndex !== -1) {
                const targetElement = document.getElementById(safeId('sector-item', dragOverSectorId!));
                const insertAbove = targetElement?.classList.contains('drop-above');
                targetList.splice(insertAbove ? targetIndex : targetIndex + 1, 0, droppedSectorId);
            } else {
                targetList.push(droppedSectorId);
            }

            const newOrderConfig = { orderedSectorIdsBySite: newOrderedIdsBySite };
            console.log("New sector order calculated (handleDrop):", JSON.stringify(newOrderConfig, null, 2));
            saveSectorOrderToStorage(newOrderConfig); // Sauvegarder dans localStorage
            return newOrderConfig;
        });

        // --- Mettre à jour l'état local des secteurs (juste le siteId) --- 
        setSectors(prevSectors => {
            const updatedSectors = prevSectors.map(s => {
                if (s.id === droppedSectorId) {
                    // Convertir la chaîne "null" en null primitif pour le stockage dans l'état
                    const newSiteId = targetSiteId === 'null' ? null : targetSiteId;
                    console.log(`Updating siteId for Sector ${droppedSectorId} to ${newSiteId} (original target: ${targetSiteId})`);
                    return { ...s, siteId: newSiteId };
                }
                return s;
            });
            console.log("Sectors state updated with new siteId:", updatedSectors.map(s => ({ id: s.id, siteId: s.siteId })));
            // applySectorOrder n'est plus appelé ici, useMemo(displayedSectors) s'en chargera
            return updatedSectors;
        });

        // Réinitialiser les états de drag
        setDraggingSectorId(null);
        setDragOverSiteId(null);
        setDragOverSectorId(null);
    };

    // --- Fonctions utilitaires --- 

    // Appliquer l'ordre stocké à la liste des secteurs pour l'affichage
    const applySectorOrder = useCallback((sectorsToSort: Sector[], orderedIdsBySite: { [siteId: string]: number[] }): Sector[] => {
        console.log("Applying sector order. Sectors:", sectorsToSort, "Order:", orderedIdsBySite);
        if (!sectorsToSort || sectorsToSort.length === 0) return [];
        if (!orderedIdsBySite || Object.keys(orderedIdsBySite).length === 0) {
            console.log("No order config found, returning original sectors.");
            return sectorsToSort; // Pas d'ordre défini, retourner l'original
        }

        const sectorMap = new Map(sectorsToSort.map(s => [s.id, s]));
        const orderedSectors: Sector[] = [];
        const unassignedSectors = [...sectorsToSort]; // Secteurs non encore placés

        // Itérer sur les sites dans l'ordre défini par les clés (peut nécessiter un tri des clés si l'ordre des sites compte)
        Object.keys(orderedIdsBySite).forEach(siteId => {
            const sectorIds = orderedIdsBySite[siteId] || [];
            sectorIds.forEach(sectorIdNum => {
                const sector = sectorMap.get(sectorIdNum);
                if (sector && sector.siteId === siteId) { // Vérifier si le secteur appartient bien à ce site
                    orderedSectors.push(sector);
                    // Retirer le secteur des non assignés
                    const indexToRemove = unassignedSectors.findIndex(s => s.id === sectorIdNum);
                    if (indexToRemove > -1) {
                        unassignedSectors.splice(indexToRemove, 1);
                    }
                } else {
                    console.warn(`Sector ${sectorIdNum} found in order for site ${siteId}, but mismatch in sector data or not found.`);
                }
            });
        });

        // Ajouter les secteurs non présents dans l'ordre à la fin (par exemple, nouveaux secteurs)
        const finalSectors = [...orderedSectors, ...unassignedSectors];
        console.log("Sectors after applying order:", finalSectors);
        return finalSectors;

    }, []);

    // Calculer les secteurs à afficher, triés par site et par ordre manuel
    const displayedSectors = useMemo(() => {
        console.log("Recalculating displayedSectors. Current `sectors` state:", JSON.stringify(sectors.map(s => ({ id: s.id, name: s.name, siteId: s.siteId }))));
        console.log("Current `sectorOrder` state:", JSON.stringify(sectorOrder));
        console.log("Recalculating displayedSectors with new logic...");
        const sectorsById: { [id: number]: Sector } = {};
        sectors.forEach(s => sectorsById[s.id] = s);

        const finalSortedSectors: Sector[] = [];
        const processedSectorIds = new Set<number>();

        // 1. Traiter les secteurs explicitement ordonnés pour chaque site
        sites.forEach(site => {
            const siteIdStr = site.id;
            const orderedIdsForSite = sectorOrder.orderedSectorIdsBySite[siteIdStr] || [];
            console.log(`Site ${siteIdStr}: Processing ${orderedIdsForSite.length} ordered IDs from state:`, orderedIdsForSite);
            orderedIdsForSite.forEach(id => {
                if (sectorsById[id] && sectorsById[id].siteId === siteIdStr) {
                    if (!processedSectorIds.has(id)) {
                        finalSortedSectors.push(sectorsById[id]);
                        processedSectorIds.add(id);
                    } else {
                        console.warn(`Sector ${id} for site ${siteIdStr} was already processed but found again in ordered list.`);
                    }
                } else {
                    // Peut arriver si l'ordre contient un ID qui n'est plus assigné à ce site
                    console.warn(`Ordered sector ${id} for site ${siteIdStr} has mismatched siteId (${sectorsById[id]?.siteId}) or not found.`);
                }
            });
        });

        // 2. Traiter les secteurs non assignés explicitement ordonnés
        const nullSiteKey = 'null';
        const unassignedOrderedIds = sectorOrder.orderedSectorIdsBySite[nullSiteKey] || [];
        console.log(`Site null (ordered): Processing ${unassignedOrderedIds.length} IDs from state:`, unassignedOrderedIds);
        unassignedOrderedIds.forEach(id => {
            // Ici on s'attend à ce que sector.siteId soit null (primitif)
            if (sectorsById[id] && sectorsById[id].siteId === null) { // Check against primitive null
                if (!processedSectorIds.has(id)) {
                    finalSortedSectors.push(sectorsById[id]);
                    processedSectorIds.add(id);
                } else {
                    console.warn(`Unassigned sector ${id} (ordered) was already processed.`);
                }
            } else {
                console.warn(`Ordered unassigned sector ${id} has mismatched siteId (found: ${sectorsById[id]?.siteId}, expected: null) or sector not found.`);
            }
        });

        // 3. Regrouper les secteurs restants par siteId (y compris null pour non assignés)
        const remainingSectorsBySite: { [siteId: string]: Sector[] } = {};
        sectors.forEach(sector => {
            if (!processedSectorIds.has(sector.id)) {
                const groupKey = sector.siteId || nullSiteKey;
                if (!remainingSectorsBySite[groupKey]) {
                    remainingSectorsBySite[groupKey] = [];
                }
                remainingSectorsBySite[groupKey].push(sector);
            }
        });

        // 4. Ajouter les secteurs restants groupés, en respectant l'ordre des sites existants
        sites.forEach(site => {
            const siteIdStr = site.id;
            if (remainingSectorsBySite[siteIdStr]) {
                console.log(`Site ${siteIdStr}: Adding ${remainingSectorsBySite[siteIdStr].length} remaining (unordered) sectors.`);
                finalSortedSectors.push(...remainingSectorsBySite[siteIdStr]);
                remainingSectorsBySite[siteIdStr].forEach(s => processedSectorIds.add(s.id)); // Marquer comme traités
                delete remainingSectorsBySite[siteIdStr]; // Retirer pour ne pas les traiter en orphelins
            }
        });

        // 5. Ajouter les secteurs restants non assignés (ceux sous la clé 'null')
        if (remainingSectorsBySite[nullSiteKey]) {
            console.log(`Site null: Adding ${remainingSectorsBySite[nullSiteKey].length} remaining (unordered) unassigned sectors.`);
            finalSortedSectors.push(...remainingSectorsBySite[nullSiteKey]);
            remainingSectorsBySite[nullSiteKey].forEach(s => processedSectorIds.add(s.id));
            delete remainingSectorsBySite[nullSiteKey];
        }

        // 6. Ajouter les éventuels secteurs orphelins (siteId qui n'existe plus dans `sites`)
        Object.keys(remainingSectorsBySite).forEach(orphanSiteKey => {
            if (remainingSectorsBySite[orphanSiteKey] && remainingSectorsBySite[orphanSiteKey].length > 0) {
                console.warn(`Site ${orphanSiteKey} (orphaned?): Adding ${remainingSectorsBySite[orphanSiteKey].length} sectors.`);
                finalSortedSectors.push(...remainingSectorsBySite[orphanSiteKey]);
                // Pas besoin de marquer processedSectorIds ici car ils sont déjà filtrés par le !processedSectorIds.has(sector.id) initial
            }
        });

        console.log("Final displayedSectors (new logic):", finalSortedSectors.map(s => ({ id: s.id, name: s.name, siteId: s.siteId, order: s.displayOrder })));
        return finalSortedSectors;
    }, [sectors, sites, sectorOrder]); // Dépendances : secteurs bruts, sites, et l'ordre manuel

    // --- Fonction de gestion des changements dans les inputs du formulaire SECTEUR ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let parsedValue: string | number | boolean | object = value;

        if (type === 'checkbox') {
            parsedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            parsedValue = parseFloat(value) || 0;
        }

        if (name.includes('.')) {
            const [outerKey, innerKey] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [outerKey]: {
                    ...(prev[outerKey as keyof SectorFormData] as object),
                    [innerKey]: parsedValue
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: parsedValue }));
        }
    };

    // --- Fonction pour sauvegarder l'ordre en BDD --- 
    const saveSectorOrderToDatabase = async () => {
        console.log("Attempting to save sector order to database...");
        console.log("Current user role:", user?.role);

        if (authLoading) {
            toast.error("Vérification de l'authentification en cours. Veuillez réessayer.");
            setError("Authentification en cours...");
            return;
        }
        if (!isAuthenticated) {
            toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
            setError("Authentification requise pour sauvegarder.");
            return;
        }
        if (user?.role !== Role.ADMIN_TOTAL) {
            toast.error("Permissions insuffisantes pour sauvegarder l'ordre des secteurs.");
            setError("Action non autorisée pour votre rôle.");
            setSaveMessage("Erreur de permission.");
            return;
        }

        setIsSubmitting(true);
        setSaveMessage('Enregistrement de l\'ordre...');
        setError(null);

        try {
            // Filtrer les sites inexistants avant envoi
            const validSiteIds = new Set(sites.map(site => site.id));
            validSiteIds.add('null'); // Ajouter 'null' pour les secteurs non assignés

            const payload = Object.entries(sectorOrder.orderedSectorIdsBySite)
                .filter(([siteId, _]) => validSiteIds.has(siteId))
                .map(([siteId, sectorIds]) => ({
                    siteId: siteId,
                    orderedSectorIds: sectorIds
                }));

            console.log("Sites valides:", Array.from(validSiteIds));
            console.log("Payload filtré for /api/sectors/reorder-by-site:", payload);

            const response = await axios.post('http://localhost:3000/api/sectors/reorder-by-site', { sitesOrder: payload });

            if (response.status === 200) {
                setSaveMessage('');
                toast.success('Ordre des secteurs sauvegardé avec succès');

                // Nettoyer l'ordre local pour supprimer les sites inexistants
                const cleanedOrderConfig = {
                    orderedSectorIdsBySite: Object.fromEntries(
                        payload.map(item => [item.siteId, item.orderedSectorIds])
                    )
                };
                setSectorOrder(cleanedOrderConfig);
                saveSectorOrderToStorage(cleanedOrderConfig);
                console.log("Ordre local nettoyé:", cleanedOrderConfig);
            } else {
                throw new Error(response.data.error || "Erreur inconnue lors de la sauvegarde de l'ordre");
            }
        } catch (error: any) {
            console.error("Erreur lors de l'enregistrement de l'ordre des secteurs en BDD:", error);
            const errorMsg = error.response?.data?.error || error.message || "Erreur lors de l'enregistrement de l'ordre des secteurs";
            toast.error(errorMsg);
            setError(errorMsg);
            setSaveMessage('Erreur lors de la sauvegarde');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Gestion du mode réorganisation --- 
    const handleReorderingToggle = () => {
        if (isReordering) {
            // Sauvegarder l'ordre même si l'utilisateur n'est pas ADMIN_TOTAL
            // L'API vérifiera les permissions, mais on doit au moins essayer de sauvegarder
            saveSectorOrderToDatabase();

            // Afficher un message pour indiquer que l'ordre a été sauvegardé
            toast.info('Les modifications d\'ordre ont été enregistrées');

            // Si on quitte le mode réorganisation, mettre à jour l'interface
            setIsReordering(false);
        } else {
            // Entrer en mode réorganisation
            setIsReordering(true);

            // Afficher un message pour guider l'utilisateur
            toast.info('Mode réorganisation activé. Glissez-déposez les secteurs pour modifier leur ordre puis cliquez à nouveau sur "Réorganiser" pour sauvegarder.');
        }
    };

    // --- Gestion Formulaire Secteur --- 
    const resetFormAndCloseModal = () => {
        setIsEditing(null);
        setIsModalOpen(false);
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            category: 'STANDARD', // Catégorie standard par défaut
            rules: {
                maxRoomsPerSupervisor: 2
            },
            siteId: sites.length > 0 ? sites[0].id : null
        });
        setFormError(null);
    };

    const handleAddClick = () => {
        setIsEditing(null);
        // Initialisation avec des valeurs par défaut
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            category: 'STANDARD', // Catégorie standard par défaut
            rules: {
                maxRoomsPerSupervisor: 2
            },
            siteId: sites.length > 0 ? sites[0].id : null
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (sector: Sector) => {
        setIsEditing(sector.id);
        setFormData({
            name: sector.name,
            colorCode: sector.colorCode || '#3B82F6',
            isActive: sector.isActive,
            description: sector.description || '',
            category: sector.category || 'STANDARD', // Utiliser la catégorie existante ou 'STANDARD' par défaut
            rules: sector.rules || { maxRoomsPerSupervisor: 2 },
            siteId: sector.siteId
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        if (!formData.siteId && sites.length > 0) { // Ne pas bloquer si aucun site n'existe
            setFormError("Veuillez sélectionner un site.");
            setIsSubmitting(false);
            return;
        }

        const url = isEditing ? `/api/sectors/${isEditing}` : '/api/sectors';
        const method = isEditing ? 'put' : 'post';

        try {
            const response = await axios[method](url, formData);
            toast.success(isEditing ? 'Secteur mis à jour' : 'Secteur ajouté');
            resetFormAndCloseModal();
            fetchSectors(); // Recharger les secteurs
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la soumission du formulaire secteur:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Une erreur est survenue.';
            setFormError(errorMsg);
            toast.error(`Erreur: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) {
            return;
        }
        setError(null); // Utiliser l'erreur générale
        try {
            await axios.delete(`http://localhost:3000/api/sectors/${id}`);
            toast.success('Secteur supprimé avec succès');
            // Retirer de l'état local
            const deletedSector = sectors.find(s => s.id === id);
            setSectors(prev => prev.filter(s => s.id !== id));
            // Retirer de l'ordre stocké
            if (deletedSector?.siteId) {
                const siteIdKey = deletedSector.siteId;
                setSectorOrder(currentOrder => {
                    const newOrderedIdsBySite = { ...currentOrder.orderedSectorIdsBySite };
                    if (newOrderedIdsBySite[siteIdKey]) {
                        newOrderedIdsBySite[siteIdKey] = newOrderedIdsBySite[siteIdKey].filter(sectorId => sectorId !== id);
                        // Si le site devient vide, le supprimer de l'ordre
                        if (newOrderedIdsBySite[siteIdKey].length === 0) {
                            delete newOrderedIdsBySite[siteIdKey];
                        }
                    }
                    const newOrderConfig = { orderedSectorIdsBySite: newOrderedIdsBySite };
                    saveSectorOrderToStorage(newOrderConfig);
                    return newOrderConfig;
                });
            } else { // Gérer le cas où le secteur est non assigné
                setSectorOrder(currentOrder => {
                    const newOrderedIdsBySite = { ...currentOrder.orderedSectorIdsBySite };
                    if (newOrderedIdsBySite['null']) { // Supposer que 'null' est la clé pour non assigné si utilisé
                        newOrderedIdsBySite['null'] = newOrderedIdsBySite['null'].filter(sectorId => sectorId !== id);
                        if (newOrderedIdsBySite['null'].length === 0) {
                            delete newOrderedIdsBySite['null'];
                        }
                    }
                    const newOrderConfig = { orderedSectorIdsBySite: newOrderedIdsBySite };
                    saveSectorOrderToStorage(newOrderConfig);
                    return newOrderConfig;
                });
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la suppression du secteur:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Impossible de supprimer le secteur.';
            toast.error(`Erreur: ${errorMsg}`);
            setError(errorMsg); // Afficher l'erreur générale
        }
    };

    // --- NOUVEAU : Gestion Formulaire Site ---
    const resetSiteFormAndCloseModal = () => {
        setEditingSiteId(null);
        setSiteFormData({ name: '', description: '', isActive: true });
        setSiteFormError(null);
        setIsSiteModalOpen(false);
        setIsSubmittingSite(false);
    };

    const handleAddSiteClick = () => {
        setEditingSiteId(null);
        setSiteFormData({ name: '', description: '', isActive: true });
        setSiteFormError(null);
        setIsSiteModalOpen(true);
    };

    const handleEditSiteClick = (site: Site) => {
        setEditingSiteId(site.id);
        setSiteFormData({
            name: site.name,
            description: site.description || '',
            isActive: site.isActive,
        });
        setSiteFormError(null);
        setIsSiteModalOpen(true);
    };

    const handleSiteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setSiteFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSiteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmittingSite(true);
        setSiteFormError(null);

        const url = editingSiteId ? `/api/sites/${editingSiteId}` : '/api/sites';
        const method = editingSiteId ? 'put' : 'post';

        try {
            await axios[method](url, siteFormData);
            toast.success(editingSiteId ? 'Site mis à jour' : 'Site ajouté');
            resetSiteFormAndCloseModal();
            fetchSites(); // Recharger les sites après ajout/modification
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la soumission du formulaire site:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Une erreur est survenue.';
            setSiteFormError(errorMsg);
            toast.error(`Erreur: ${errorMsg}`);
        } finally {
            setIsSubmittingSite(false);
        }
    };

    const handleDeleteSiteClick = async (id: string) => {
        // Vérifier si des secteurs sont encore liés à ce site
        const sectorsOnSite = sectors.filter(s => s.siteId === id);
        const confirmationMessage = sectorsOnSite.length > 0
            ? `Êtes-vous sûr de vouloir supprimer ce site ? ${sectorsOnSite.length} secteur(s) deviendra(ont) non assigné(s).`
            : 'Êtes-vous sûr de vouloir supprimer ce site ?';

        if (!confirm(confirmationMessage)) {
            return;
        }
        setError(null); // Utiliser l'erreur générale
        try {
            await axios.delete(`http://localhost:3000/api/sites/${id}`);
            toast.success('Site supprimé avec succès');
            fetchSites(); // Recharger les sites
            // Recharger aussi les secteurs car leur siteId a pu changer en null
            fetchSectors();
            // Nettoyer l'ordre des secteurs pour le site supprimé
            setSectorOrder(currentOrder => {
                const newOrderedIdsBySite = { ...currentOrder.orderedSectorIdsBySite };
                if (newOrderedIdsBySite[id]) {
                    delete newOrderedIdsBySite[id];
                }
                const newOrderConfig = { orderedSectorIdsBySite: newOrderedIdsBySite };
                saveSectorOrderToStorage(newOrderConfig);
                return newOrderConfig;
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la suppression du site:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Impossible de supprimer le site.';
            toast.error(`Erreur: ${errorMsg}`);
            setError(errorMsg); // Afficher l'erreur générale
        }
    };

    // Fonction pour réinitialiser l'ordre des secteurs
    const handleResetOrder = async () => {
        if (!confirm('Êtes-vous sûr de vouloir réinitialiser l\'ordre de tous les secteurs ? Les secteurs seront triés par ordre alphabétique.')) {
            return;
        }

        setIsSaving(true);
        try {
            // Préparer les données avec tous les secteurs réinitialisés à null pour le displayOrder
            const payload = {
                sitesOrder: sites.map(site => ({
                    siteId: site.id,
                    sectorsOrder: (site.operatingSectors || []).map((sector: any) => ({
                        sectorId: sector.id,
                        // Réinitialiser à null pour revenir à l'ordre par défaut
                        displayOrder: null
                    }))
                }))
            };

            // Envoyer à l'API
            const response = await fetch('http://localhost:3000/api/sectors/reorder-by-site', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Échec de la réinitialisation');
            }

            // Rafraîchir les données
            await fetchSites();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation de l\'ordre:', error);
            setSaveError(true);
            setTimeout(() => setSaveError(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Rendu JSX --- 

    // Vérifications d'authentification et de rôle...
    if (authLoading || sitesLoading) { // Conserver sitesLoading
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span>Chargement des données...</span>
            </div>
        );
    }
    // ... (reste des vérifications auth/role inchangé) ...

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-4">
            {/* Section Titre et Boutons Généraux */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration des Sites et Secteurs du Bloc Opératoire</h2>
                <div className="flex space-x-4">
                    {/* --- MODIFIÉ --- */}
                    <Button onClick={handleAddSiteClick} className="flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter un Site
                    </Button>
                    <Button onClick={handleAddClick} className="flex items-center" disabled={sites.length === 0}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter un Secteur
                    </Button>
                    {/* --- FIN MODIFIÉ --- */}
                    <Button
                        onClick={handleReorderingToggle}
                        variant={isReordering ? "destructive" : "outline"} // Mieux: destructive?
                        className="flex items-center"
                        disabled={sectors.length < 2}
                    >
                        {isReordering ? (
                            <CheckIcon className="h-5 w-5 mr-2" />
                        ) : (
                            <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                        )}
                        {isReordering ? "Terminer Réorganisation" : "Réorganiser Secteurs"}
                    </Button>
                </div>
            </div>

            {/* Message d'information important */}
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Important : Ordre d'affichage</h3>
                <p className="text-blue-700">
                    L'ordre dans lequel vous organisez les secteurs et sites ici sera utilisé pour l'affichage des salles dans les trameModeles et plannings.
                </p>
                <p className="text-blue-700 mt-2">
                    <strong>Pour réorganiser :</strong> Cliquez sur le bouton "Réorganiser Secteurs", glissez-déposez les secteurs dans l'ordre souhaité, puis cliquez sur "Terminer Réorganisation" pour sauvegarder vos modifications.
                </p>
                <p className="text-blue-700 mt-2">
                    <strong>Remarque :</strong> Après avoir modifié l'ordre, il peut être nécessaire de rafraîchir la page des trameModeles pour voir les changements.
                </p>
            </div>

            {/* --- MODIFIÉ : Section Gestion des Sites --- */}
            <div className="mb-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Gestion des Sites</h3>
                    <Button onClick={handleAddSiteClick} size="sm">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Nouveau Site
                    </Button>
                </div>
                {sitesError && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">Erreur de chargement des sites</p>
                        <p>{sitesError}</p>
                    </div>
                )}
                {sites.length === 0 && !sitesLoading && !sitesError && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucun site n'a été configuré. Cliquez sur "Nouveau Site" pour commencer.</p>
                )}
                {sites.length > 0 && (
                    <ul className="space-y-2">
                        {sites.map(site => (
                            <li key={site.id} className="flex justify-between items-center p-3 border rounded bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                                <div className='flex items-center'>
                                    <span className='font-medium'>{site.name}</span>
                                    {site.description && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 italic hidden sm:inline">({site.description})</span>}
                                    {!site.isActive && <span className="ml-2 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Inactif</span>}
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditSiteClick(site)} title="Modifier">
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSiteClick(site.id)} title="Supprimer">
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* --- FIN MODIFIÉ --- */}

            {/* Section Réorganisation Info */}
            {isReordering && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md animate-fadeIn">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Mode réorganisation activé</strong> - Glissez-déposez les secteurs pour les réorganiser.
                                Vous pouvez déplacer un secteur d'un site à un autre en le déposant dans la section cible.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Affichage des erreurs globales ou succès */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}
            {showSuccess && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md animate-fadeIn">
                    <div className="flex">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                        <div className="ml-3">
                            <p className="text-sm text-green-700">Opération réalisée avec succès.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Boutons d'action pour la réorganisation */}
            <div className="flex space-x-4">
                <Button
                    onClick={handleReorderingToggle}
                    className={`flex items-center ${isReorderingMode ? 'bg-blue-600' : ''}`}
                >
                    {isReorderingMode ? (
                        <>
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Terminer la réorganisation
                        </>
                    ) : (
                        <>
                            <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                            Réorganiser les secteurs
                        </>
                    )}
                </Button>

                {isReorderingMode && (
                    <Button
                        onClick={handleResetOrder}
                        className="flex items-center bg-amber-600 hover:bg-amber-700"
                        disabled={isSaving}
                    >
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Réinitialiser l'ordre
                    </Button>
                )}
            </div>

            {/* Indicateurs de statut */}
            {isSaving && <span className="text-blue-500 ml-2">Enregistrement en cours...</span>}
            {saveSuccess && <span className="text-green-500 ml-2">Ordre sauvegardé avec succès !</span>}
            {saveError && <span className="text-red-500 ml-2">Erreur lors de la sauvegarde</span>}

            {/* Affichage erreur chargement secteurs */}
            {sectorsError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{sectorsError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Affichage des Secteurs par Site --- */}
            <div className="space-y-6">
                {sites.map(site => (
                    <div
                        key={site.id}
                        id={safeId('drop-target-site', site.id)}
                        className={`p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 drop-target ${dragOverSiteId === site.id ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, site.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, site.id)}
                    >
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 border-b pb-2">{site.name}</h3>
                        {isLoadingSectors ? (
                            <p className="text-gray-500">Chargement des secteurs...</p>
                        ) : (
                            <ul className="space-y-2 min-h-[50px]"> {/* min-h pour la zone de drop */}
                                {displayedSectors.filter(sector => sector.siteId === site.id).map(sector => (
                                    <li
                                        key={sector.id}
                                        id={safeId('sector-item', sector.id)}
                                        className={`flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded shadow sector-item ${isReordering ? 'cursor-move' : ''} ${draggingSectorId === sector.id ? 'dragging opacity-50' : ''}`}
                                        draggable={isReordering}
                                        onDragStart={(e) => handleDragStart(e, sector.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={isReordering ? (e) => handleSectorDragOver(e, sector.id) : undefined}
                                        onDragLeave={isReordering ? handleSectorDragLeave : undefined}
                                    // Drop sur un secteur n'est pas géré directement ici, seulement sur le site
                                    >
                                        <div className="flex items-center">
                                            <span
                                                className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                                style={{ backgroundColor: sector.colorCode || '#ccc' }}
                                                title={`Couleur: ${sector.colorCode}`}
                                            ></span>
                                            <span className="font-medium">{sector.name}</span>
                                            {sector.description && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 italic">({sector.description})</span>}
                                            {sector.category && <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{SECTOR_CATEGORY_LABELS[sector.category as keyof typeof SECTOR_CATEGORY_LABELS] || sector.category}</span>}
                                            {!sector.isActive && <span className="ml-2 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Inactif</span>}
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(sector)} title="Modifier">
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(sector.id)} title="Supprimer">
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {displayedSectors.filter(sector => sector.siteId === site.id).length === 0 && !isLoadingSectors && (
                                    <li className="text-center text-gray-400 dark:text-gray-500 py-4">Aucun secteur dans ce site. {isReordering ? 'Glissez un secteur ici.' : ''}</li>
                                )}
                            </ul>
                        )}
                    </div>
                ))}

                {/* Section pour les secteurs non assignés (siteId = null) */}
                <div
                    key="unassigned-site"
                    id={safeId('drop-target-site', 'null')} // Utiliser 'null' comme ID spécial pour le drop target
                    className={`p-4 border rounded-lg border-dashed border-gray-400 bg-gray-100 dark:bg-gray-800 drop-target ${dragOverSiteId === 'null' ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'null')} // Permettre le drop ici
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'null')} // Gérer le drop ici avec 'null' comme siteId cible
                >
                    <h3 className="text-lg font-semibold mb-3 text-gray-600 dark:text-gray-300 border-b pb-2">Secteurs non assignés</h3>
                    {isLoadingSectors ? (
                        <p className="text-gray-500">Chargement...</p>
                    ) : (
                        <ul className="space-y-2 min-h-[50px]">
                            {displayedSectors.filter(sector => sector.siteId === null).map(sector => (
                                <li
                                    key={sector.id}
                                    id={safeId('sector-item', sector.id)}
                                    // ... (mêmes classes et handlers que les secteurs assignés)
                                    className={`flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded shadow sector-item ${isReordering ? 'cursor-move' : ''} ${draggingSectorId === sector.id ? 'dragging opacity-50' : ''}`}
                                    draggable={isReordering}
                                    onDragStart={(e) => handleDragStart(e, sector.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={isReordering ? (e) => handleSectorDragOver(e, sector.id) : undefined}
                                    onDragLeave={isReordering ? handleSectorDragLeave : undefined}
                                >
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sector.colorCode || '#ccc' }}></span>
                                        <span className="font-medium">{sector.name}</span>
                                        {sector.description && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 italic">({sector.description})</span>}
                                        {sector.category && <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{SECTOR_CATEGORY_LABELS[sector.category as keyof typeof SECTOR_CATEGORY_LABELS] || sector.category}</span>}
                                        {!sector.isActive && <span className="ml-2 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Inactif</span>}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(sector)} title="Modifier"><PencilIcon className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(sector.id)} title="Supprimer"><TrashIcon className="h-4 w-4" /></Button>
                                    </div>
                                </li>
                            ))}
                            {displayedSectors.filter(sector => sector.siteId === null).length === 0 && !isLoadingSectors && (
                                <li className="text-center text-gray-400 dark:text-gray-500 py-4">Aucun secteur non assigné. {isReordering ? 'Glissez un secteur ici pour le désassigner.' : ''}</li>
                            )}
                        </ul>
                    )}
                </div>

            </div>

            {/* Modale pour Ajouter/Modifier Secteur */}
            <Dialog open={isModalOpen} onOpenChange={resetFormAndCloseModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Modifier le Secteur' : 'Ajouter un Secteur'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        {formError && (
                            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md">
                                <p className="text-sm">{formError}</p>
                            </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Nom */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du secteur</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            {/* Couleur */}
                            <div>
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur</label>
                                <input
                                    type="color"
                                    id="colorCode"
                                    name="colorCode"
                                    value={formData.colorCode}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none dark:bg-gray-700"
                                />
                            </div>
                        </div>
                        {/* Site */}
                        <div className="mt-4">
                            <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site d'appartenance</label>
                            <select
                                id="siteId"
                                name="siteId"
                                value={formData.siteId ?? ''} // Gérer la valeur null
                                onChange={handleInputChange}
                                required={sites.length > 0} // Requis seulement si des sites existent
                                disabled={sites.length === 0} // Désactiver si aucun site
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <option value="" disabled>
                                    {sites.length === 0 ? "Aucun site disponible" : "Sélectionnez un site"}
                                </option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Description */}
                        <div className="mt-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optionnel)</label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            ></textarea>
                        </div>
                        {/* Catégorie */}
                        <div className="mt-4">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie du secteur</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category || 'STANDARD'}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            >
                                {Object.entries(SECTOR_CATEGORY_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        {/* Règles (Simplifié pour l'instant) */}
                        <div className="mt-4">
                            <label htmlFor="maxRoomsPerSupervisor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salles / Superviseur (Règle)</label>
                            <input
                                type="number"
                                id="maxRoomsPerSupervisor"
                                name="rules.maxRoomsPerSupervisor" // Utiliser la notation pointée pour la mise à jour
                                value={formData.rules?.maxRoomsPerSupervisor ?? 2}
                                onChange={handleInputChange}
                                min="1"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        {/* Actif */}
                        <div className="mt-4 flex items-center">
                            <input
                                id="isActive"
                                name="isActive"
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Actif</label>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Annuler</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting || sites.length === 0}>
                                {isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Ajouter')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- NOUVEAU : Modale pour Ajouter/Modifier Site --- */}
            <Dialog open={isSiteModalOpen} onOpenChange={resetSiteFormAndCloseModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingSiteId ? 'Modifier le Site' : 'Ajouter un Site'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSiteSubmit} className="mt-4 space-y-4">
                        {siteFormError && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md">
                                <p className="text-sm">{siteFormError}</p>
                            </div>
                        )}
                        {/* Nom du Site */}
                        <div>
                            <Label htmlFor="site-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du site</Label>
                            <Input
                                id="site-name"
                                name="name"
                                value={siteFormData.name}
                                onChange={handleSiteInputChange}
                                required
                                placeholder="Ex: Hôpital Central"
                                className="mt-1"
                            />
                        </div>
                        {/* Description du Site */}
                        <div>
                            <Label htmlFor="site-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optionnel)</Label>
                            <Textarea
                                id="site-description"
                                name="description"
                                rows={3}
                                value={siteFormData.description}
                                onChange={handleSiteInputChange}
                                placeholder="Ex: Site principal pour les chirurgies majeures"
                                className="mt-1"
                            />
                        </div>
                        {/* Site Actif */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="site-isActive"
                                name="isActive"
                                checked={siteFormData.isActive}
                                onCheckedChange={(checked) => setSiteFormData(prev => ({ ...prev, isActive: Boolean(checked) }))}
                            />
                            <Label htmlFor="site-isActive" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                Actif
                            </Label>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Annuler</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmittingSite}>
                                {isSubmittingSite ? 'Enregistrement...' : (editingSiteId ? 'Mettre à jour' : 'Ajouter')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* --- FIN NOUVEAU --- */}

        </div>
    );
};

export default SectorsConfigPanel;