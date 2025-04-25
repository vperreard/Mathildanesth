'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui";

// Types pour les secteurs
type Sector = {
    id: number;
    name: string;
    color: string; // Supposé exister, même si pas utilisé dans le form ?
    colorCode: string;
    description?: string;
    rules?: {
        maxRoomsPerSupervisor: number;
    };
    isActive: boolean;
    siteId: number;
};

type SectorFormData = {
    name: string;
    colorCode: string;
    isActive: boolean;
    description: string;
    rules: any;
    siteId: number;
};

// Type pour un site
type Site = {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
};

// Type pour la configuration de l'ordre des secteurs par site
type SectorOrderConfig = {
    orderedSectorIdsBySite: { [siteId: number]: number[] };
};

// Sites statiques pour le développement (à remplacer par l'API quand disponible)
const STATIC_SITES: Site[] = [
    { id: 1, name: "Site Principal", description: "Hôpital principal", isActive: true },
    { id: 2, name: "Clinique Nord", description: "Clinique secondaire", isActive: true },
    { id: 3, name: "Centre de Jour", description: "Centre ambulatoire", isActive: true }
];

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
function safeId(prefix: string, id: string | number): string {
    return `${prefix}-${id}`.replace(/\s+/g, '-');
}

const SectorsConfigPanel: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [sites, setSites] = useState<Site[]>(STATIC_SITES); // Utiliser les sites statiques par défaut
    const [isLoadingSectors, setIsLoadingSectors] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // États pour le drag and drop
    const [draggingSectorId, setDraggingSectorId] = useState<number | null>(null);
    const [dragOverSiteId, setDragOverSiteId] = useState<number | null>(null);
    const [dragOverSectorId, setDragOverSectorId] = useState<number | null>(null);

    // --- États ajoutés pour la réorganisation ---
    const [isReordering, setIsReordering] = useState<boolean>(false);
    const [sectorOrder, setSectorOrder] = useState<SectorOrderConfig>({ orderedSectorIdsBySite: {} });
    const [saveMessage, setSaveMessage] = useState('');

    // Ajouter un état pour les erreurs de chargement
    const [sitesLoading, setSitesLoading] = useState(true);
    const [sectorsError, setSectorsError] = useState<string | null>(null);

    // États pour le formulaire et la modale
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
        siteId: 1 // Site par défaut
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

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

    // Charger les sites
    const fetchSites = useCallback(async () => {
        try {
            // Tentative d'appel à l'API des sites (à décommenter quand disponible)
            // const response = await axios.get<Site[]>('/api/sites');
            // setSites(response.data || []);

            // En attendant, utiliser les sites statiques
            setSites(STATIC_SITES);
            setSitesLoading(false);
        } catch (error) {
            console.error("Erreur lors du chargement des sites:", error);
            // Ne pas afficher de toast d'erreur pour les sites statiques
            // toast.error('Erreur lors du chargement des sites');

            // Même en cas d'erreur, utiliser les sites statiques
            setSites(STATIC_SITES);
            setSitesLoading(false);
        }
    }, []);

    // Charger les secteurs
    const fetchSectors = useCallback(async () => {
        setIsLoadingSectors(true);
        setSectorsError(null);
        try {
            const response = await axios.get<Sector[]>('/api/sectors');
            let fetchedSectors = response.data || [];

            // Assurer que chaque secteur a un siteId valide
            fetchedSectors = fetchedSectors.map(sector => ({
                ...sector,
                siteId: sector.siteId || 1 // Default to first site if not specified
            }));

            // En mode développement, créons des secteurs factices pour démontrer le glisser-déposer
            if (!fetchedSectors.length) {
                const mockSectors: Sector[] = [
                    { id: 1, name: "Hyperaseptique", colorCode: "#3B82F6", color: "#3B82F6", isActive: true, siteId: 1, description: "Salles 1-4" },
                    { id: 2, name: "Secteur 5-8", colorCode: "#10B981", color: "#10B981", isActive: true, siteId: 1, description: "Bloc central" },
                    { id: 3, name: "Secteur 9-12B", colorCode: "#F97316", color: "#F97316", isActive: true, siteId: 2, description: "Aile Est" },
                    { id: 4, name: "Ophtalmologie", colorCode: "#EC4899", color: "#EC4899", isActive: true, siteId: 2, description: "Spécialisé" },
                    { id: 5, name: "Endoscopie", colorCode: "#4F46E5", color: "#4F46E5", isActive: true, siteId: 3, description: "Interventions légères" }
                ];

                fetchedSectors = mockSectors;
                setSectorsError('API /api/sectors non disponible. Utilisation de données de démonstration.');
            }

            setSectors(fetchedSectors);
        } catch (error) {
            console.error("Erreur lors du chargement des secteurs:", error);
            // En mode développement, créons des secteurs factices pour démontrer le glisser-déposer
            const mockSectors: Sector[] = [
                { id: 1, name: "Hyperaseptique", colorCode: "#3B82F6", color: "#3B82F6", isActive: true, siteId: 1, description: "Salles 1-4" },
                { id: 2, name: "Secteur 5-8", colorCode: "#10B981", color: "#10B981", isActive: true, siteId: 1, description: "Bloc central" },
                { id: 3, name: "Secteur 9-12B", colorCode: "#F97316", color: "#F97316", isActive: true, siteId: 2, description: "Aile Est" },
                { id: 4, name: "Ophtalmologie", colorCode: "#EC4899", color: "#EC4899", isActive: true, siteId: 2, description: "Spécialisé" },
                { id: 5, name: "Endoscopie", colorCode: "#4F46E5", color: "#4F46E5", isActive: true, siteId: 3, description: "Interventions légères" }
            ];

            setSectors(mockSectors);
            setSectorsError('API /api/sectors non disponible. Utilisation de données de démonstration.');
        } finally {
            setIsLoadingSectors(false);
        }
    }, []);

    // Initialiser les données
    useEffect(() => {
        fetchSites();
        fetchSectors();
    }, [fetchSites, fetchSectors]);

    // Initialiser l'ordre des secteurs lors du chargement
    useEffect(() => {
        if (sectors.length > 0) {
            // Vérifier si nous avons besoin d'initialiser l'ordre
            const needsInitialization = Object.keys(sectorOrder.orderedSectorIdsBySite).length === 0;

            if (needsInitialization) {
                console.log("Initialisation de l'ordre des secteurs");
                // Grouper les secteurs par site
                const sectorsBySite: { [siteId: number]: number[] } = {};

                sectors.forEach(sector => {
                    if (!sectorsBySite[sector.siteId]) {
                        sectorsBySite[sector.siteId] = [];
                    }
                    sectorsBySite[sector.siteId].push(sector.id);
                });

                // Mettre à jour l'état
                const newOrder = { orderedSectorIdsBySite: sectorsBySite };
                console.log("Nouvel ordre initial:", newOrder);
                setSectorOrder(newOrder);

                // Sauvegarder dans localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('sectorOrderConfig', JSON.stringify(newOrder));
                }
            }
        }
    }, [sectors, sectorOrder.orderedSectorIdsBySite]);

    // Charger l'ordre des secteurs depuis le localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedOrder = localStorage.getItem('sectorOrderConfig');
            if (savedOrder) {
                try {
                    const parsedData = JSON.parse(savedOrder);
                    if (parsedData && parsedData.orderedSectorIdsBySite) {
                        console.log("Ordre des secteurs chargé:", parsedData);
                        setSectorOrder(parsedData);
                    } else {
                        console.warn("Structure invalide pour sectorOrderConfig dans localStorage.");
                        localStorage.removeItem('sectorOrderConfig');
                    }
                } catch (e) {
                    console.error("Erreur chargement sectorOrderConfig:", e);
                    localStorage.removeItem('sectorOrderConfig');
                }
            }
        }
    }, []);

    // Sauvegarder l'ordre des secteurs
    const saveSectorOrderToStorage = (newOrder: SectorOrderConfig) => {
        console.log("Saving sector order:", newOrder);
        setSectorOrder(newOrder);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sectorOrderConfig', JSON.stringify(newOrder));
        }
        setSaveMessage('Ordre des secteurs mis à jour');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    // Simplifier les gestionnaires d'événements pour le drag & drop
    const handleDragStart = (e: React.DragEvent, sectorId: number) => {
        if (!isReordering) return;

        // Stocker l'ID du secteur en cours de déplacement
        setDraggingSectorId(sectorId);

        // Stocker l'ID dans l'événement de transfert
        e.dataTransfer.setData('text/plain', sectorId.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Ajouter la classe de style pour l'élément en cours de déplacement
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.add('dragging');
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        // Nettoyer l'état de déplacement
        setDraggingSectorId(null);
        setDragOverSiteId(null);

        // Supprimer la classe de style
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('dragging');
        }
    };

    const handleDragOver = (e: React.DragEvent, siteId: number) => {
        if (!isReordering) return;

        // Prévenir le comportement par défaut pour permettre le drop
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        // Mettre à jour le site survolé
        setDragOverSiteId(siteId);

        // Ajouter une classe CSS pour indiquer la zone de drop
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.add('drag-over');
        }
    };

    const handleSectorDragOver = (e: React.DragEvent, sectorId: number) => {
        e.preventDefault();
        e.stopPropagation(); // Empêcher la propagation vers le site parent

        // Ne pas marquer si c'est le même secteur qui est survolé
        if (sectorId === draggingSectorId) return;

        const sectorElement = e.currentTarget as HTMLElement;
        const rect = sectorElement.getBoundingClientRect();
        const mouseY = e.clientY;

        // Déterminer si on est sur la moitié supérieure ou inférieure de l'élément
        const relativeMousePos = mouseY - rect.top;
        const isTopHalf = relativeMousePos < rect.height / 2;

        // Enlever toutes les classes de survol existantes
        document.querySelectorAll('.drop-above, .drop-below').forEach(el => {
            el.classList.remove('drop-above', 'drop-below');
        });

        // Ajouter la classe appropriée
        if (isTopHalf) {
            sectorElement.classList.add('drop-above');
        } else {
            sectorElement.classList.add('drop-below');
        }
    };

    const handleSectorDragLeave = (e: React.DragEvent) => {
        try {
            // Utiliser setTimeout pour éviter les clignotements lors du passage
            // d'une partie à l'autre de l'élément
            setTimeout(() => {
                const element = e.currentTarget as HTMLElement;
                if (!element) return;

                const sectorId = element.getAttribute('data-sector-id');
                if (!sectorId) return;

                // Vérifier si l'élément est toujours survolé avant de supprimer la classe
                if (!document.querySelector(`:hover.sector-item[data-sector-id="${sectorId}"]`)) {
                    element.classList.remove('drop-above', 'drop-below');
                }
            }, 50);
        } catch (err) {
            console.log("Erreur dans handleSectorDragLeave:", err);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Supprimer la classe CSS
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('drag-over');
        }
        setDragOverSiteId(null);
    };

    const handleDrop = (e: React.DragEvent, targetSiteId: number) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Nettoyer les classes de survol au début
            const dropClasses = document.querySelectorAll('.drop-above, .drop-below');

            // Récupérer l'ID du secteur depuis l'événement de transfert
            const draggedSectorId = parseInt(e.dataTransfer.getData('text/plain'));

            // Vérifier si on a un secteur en cours de glisser
            if (!draggedSectorId || isNaN(draggedSectorId)) {
                console.warn("Aucun ID de secteur valide n'est en cours de glisser");
                return;
            }

            // Récupérer le secteur et le site source
            const sourceSector = sectors.find(s => s.id === draggedSectorId);
            if (!sourceSector) {
                console.error("Secteur introuvable:", draggedSectorId);
                throw new Error("Secteur introuvable");
            }

            const sourceSiteId = sourceSector.siteId;
            const destSiteId = targetSiteId;

            // Vérifier si on a un élément avec la classe drop-above ou drop-below
            const siteContainer = e.currentTarget as HTMLElement;
            const dropTarget = siteContainer.querySelector('.drop-above, .drop-below');
            const isDropAbove = dropTarget?.classList.contains('drop-above');
            const targetSectorId = dropTarget?.getAttribute('data-sector-id');

            console.log(`Déplacement du secteur ${draggedSectorId} ${sourceSiteId !== destSiteId ?
                `du site ${sourceSiteId} vers ${destSiteId}` :
                "à l'intérieur de son site"}`);

            // Copier l'ordre actuel
            const newOrderedSectorIdsBySite = { ...sectorOrder.orderedSectorIdsBySite };

            // Retirer le secteur de son site d'origine
            if (newOrderedSectorIdsBySite[sourceSiteId]) {
                newOrderedSectorIdsBySite[sourceSiteId] = newOrderedSectorIdsBySite[sourceSiteId]
                    .filter(id => id !== draggedSectorId);
            }

            // Ajouter le secteur au site de destination
            if (!newOrderedSectorIdsBySite[destSiteId]) {
                newOrderedSectorIdsBySite[destSiteId] = [];
            }

            // Placer le secteur au bon endroit dans le site de destination
            if (dropTarget && targetSectorId) {
                // On a une cible précise (position au dessus/en dessous d'un secteur)
                const targetId = parseInt(targetSectorId);
                const targetIndex = newOrderedSectorIdsBySite[destSiteId].indexOf(targetId);

                if (targetIndex !== -1) {
                    // Insérer avant ou après selon la position
                    const insertIndex = isDropAbove ? targetIndex : targetIndex + 1;
                    newOrderedSectorIdsBySite[destSiteId].splice(insertIndex, 0, draggedSectorId);
                    console.log(`Secteur positionné ${isDropAbove ? 'avant' : 'après'} le secteur ${targetId}`);
                } else {
                    // Si l'id cible n'est pas trouvé, ajouter à la fin
                    newOrderedSectorIdsBySite[destSiteId].push(draggedSectorId);
                    console.log(`Secteur ajouté à la fin du site (cible introuvable)`);
                }
            } else {
                // Pas de cible précise, ajouter à la fin du site
                newOrderedSectorIdsBySite[destSiteId].push(draggedSectorId);
                console.log(`Secteur ajouté à la fin du site ${destSiteId}`);
            }

            // Mettre à jour l'état local si changement de site
            if (sourceSiteId !== destSiteId) {
                setSectors(prevSectors => prevSectors.map(s =>
                    s.id === draggedSectorId ? { ...s, siteId: destSiteId } : s
                ));
            }

            // Mettre à jour l'état avec le nouvel ordre
            setSectorOrder({ orderedSectorIdsBySite: newOrderedSectorIdsBySite });

            // Sauvegarder dans le localStorage
            saveSectorOrderToStorage({ orderedSectorIdsBySite: newOrderedSectorIdsBySite });

            // Mode simulation - pas d'API call qui échoue, mais simulation de mise à jour
            if (sourceSiteId !== destSiteId) {
                setSaveMessage('Secteur déplacé vers un nouveau site (mode simulation)');
            } else {
                setSaveMessage('Ordre des secteurs mis à jour');
            }

            // Réinitialiser l'état de déplacement
            setDraggingSectorId(null);

            // Nettoyer toutes les classes de survol
            dropClasses.forEach(el => {
                el.classList.remove('drop-above', 'drop-below');
            });
        } catch (error) {
            console.error("Erreur lors du drag & drop:", error);
            toast.error('Une erreur est survenue pendant le déplacement du secteur.');
        }
    };

    // Gestion des changements de formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Fonction pour appliquer l'ordre sauvegardé
    const applySectorOrder = (sectorsToSort: Sector[], orderedIdsBySite: { [siteId: number]: number[] }): Sector[] => {
        if (!orderedIdsBySite || Object.keys(orderedIdsBySite).length === 0) {
            console.log("Pas d'ordre sauvegardé pour les secteurs");
            return sectorsToSort;
        }

        console.log("Appliquer l'ordre des secteurs:", orderedIdsBySite);

        // Créer une copie des secteurs à trier
        const sortedSectors = [...sectorsToSort];

        // Trier les secteurs pour chaque site
        Object.entries(orderedIdsBySite).forEach(([siteId, orderedIds]) => {
            const siteSectors = sortedSectors.filter(s => s.siteId === parseInt(siteId));

            if (siteSectors.length === 0) {
                console.log(`Aucun secteur trouvé pour le site ${siteId}`);
                return;
            }

            console.log(`Tri des secteurs du site ${siteId}:`, siteSectors);

            const orderedSectors = orderedIds
                .map(id => siteSectors.find(s => s.id === id))
                .filter((s): s is Sector => s !== undefined);

            console.log(`Secteurs ordonnés pour le site ${siteId}:`, orderedSectors);

            // Remplacer les secteurs du site dans la liste triée
            const otherSectors = sortedSectors.filter(s => s.siteId !== parseInt(siteId));
            sortedSectors.length = 0;
            sortedSectors.push(...otherSectors, ...orderedSectors);
        });

        return sortedSectors;
    };

    // Réinitialisation du formulaire et fermeture de la modale
    const resetFormAndCloseModal = () => {
        setIsEditing(null);
        setIsModalOpen(false);
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            rules: {
                maxRoomsPerSupervisor: 2
            },
            siteId: 1
        });
        setFormError(null);
    };

    // Ouverture de la modale pour AJOUT
    const handleAddClick = () => {
        setIsEditing(null);
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            rules: {
                maxRoomsPerSupervisor: 2
            },
            siteId: 1
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    // Ouverture de la modale pour MODIFICATION
    const handleEditClick = (sector: Sector) => {
        setIsEditing(sector.id);
        setFormData({
            name: sector.name,
            colorCode: sector.colorCode || '#3B82F6',
            isActive: sector.isActive,
            description: sector.description || '',
            rules: sector.rules || { maxRoomsPerSupervisor: 2 },
            siteId: sector.siteId
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    // Soumission du formulaire (Ajout ou Modification)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setFormError('Le nom du secteur est requis');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        const url = isEditing ? `/api/sectors/${isEditing}` : '/api/sectors';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: formData });
            toast.success(`Secteur ${isEditing ? 'mis à jour' : 'ajouté'} avec succès`);
            resetFormAndCloseModal();
            fetchSectors();
            setShowSuccess(true); // Afficher le message global de succès
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de l'enregistrement du secteur:", err);
            toast.error("Erreur lors de l'enregistrement du secteur");
            setFormError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Suppression d'un secteur
    const handleDeleteClick = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur ? Les salles associées à ce secteur pourraient ne plus fonctionner correctement.')) {
            return;
        }
        setError(null);
        try {
            await axios.delete(`/api/sectors/${id}`);
            toast.success('Secteur supprimé avec succès');
            setSectors(prev => prev.filter(s => s.id !== id));
            setShowSuccess(true); // Afficher le message global de succès
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la suppression du secteur:", err);
            toast.error('Erreur lors de la suppression du secteur');
            setError(err.response?.data?.message || err.message || 'Impossible de supprimer le secteur.');
        }
    };

    // Gestion du mode réorganisation
    const handleReorderingToggle = () => {
        console.log("Toggle reordering mode, current state:", isReordering);
        setIsReordering(prev => !prev);
        // Si on désactive le mode, sauvegarder l'ordre actuel
        if (isReordering) {
            console.log("Saving current order:", sectorOrder);
            saveSectorOrderToStorage(sectorOrder);
        }
    };

    // Vérifications d'authentification et de rôle...
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    if (!user) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                </div>
            </div>
        );
    }
    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
        return (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration des Secteurs du Bloc Opératoire</h2>
                <div className="flex space-x-4">
                    <Button onClick={handleAddClick} className="flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter un Secteur
                    </Button>
                    <Button
                        onClick={handleReorderingToggle}
                        variant={isReordering ? "danger" : "outline"}
                        className="flex items-center"
                        disabled={sectors.length < 2}
                    >
                        {isReordering ? (
                            <CheckIcon className="h-5 w-5 mr-2" />
                        ) : (
                            <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                        )}
                        {isReordering ? "Terminer" : "Réorganiser"}
                    </Button>
                </div>
            </div>

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
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">Opération réalisée avec succès</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bannière d'information sur les sites statiques */}
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>Mode de développement</strong> - Les sites affichés sont des exemples statiques.
                            L'API <code>/api/sites</code> n'existe pas encore dans cette application.
                        </p>
                    </div>
                </div>
            </div>

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

            {/* Formulaire d'ajout/modification dans une modale */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Modifier le Secteur' : 'Ajouter un Secteur'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        {formError && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom du secteur</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: Hyperaseptique"
                                />
                            </div>

                            <div>
                                <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                                <select
                                    id="siteId"
                                    name="siteId"
                                    value={formData.siteId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {sites.map(site => (
                                        <option key={site.id} value={site.id}>{site.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        id="colorCode"
                                        name="colorCode"
                                        value={formData.colorCode || '#3B82F6'}
                                        onChange={handleInputChange}
                                        className="h-10 w-10 border border-gray-300 rounded"
                                    />
                                    <input
                                        type="text"
                                        value={formData.colorCode || ''}
                                        onChange={handleInputChange}
                                        name="colorCode"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: #3B82F6"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (facultatif)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Décrire brièvement le secteur..."
                                ></textarea>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange(e as any)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                                    Secteur actif
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={resetFormAndCloseModal}>
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center"
                            >
                                {isSubmitting ? (
                                    <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                ) : isEditing ? (
                                    <CheckIcon className="h-4 w-4 mr-2" />
                                ) : (
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                {isEditing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Liste des secteurs par site */}
            <div className="mt-6">
                {isLoadingSectors ? (
                    <div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des secteurs...</p>
                    </div>
                ) : sectors.length === 0 ? (
                    <div className="text-center py-8 border border-gray-200 rounded-lg">
                        <p className="text-gray-500 italic">Aucun secteur configuré. Commencez par en ajouter un.</p>
                    </div>
                ) : (
                    <div>
                        {sites.map(site => {
                            const siteSectors = sectors.filter(s => s.siteId === site.id);
                            // Appliquer l'ordre local si disponible
                            const orderedIds = sectorOrder.orderedSectorIdsBySite[site.id] || [];

                            if (orderedIds.length > 0) {
                                // Trier selon l'ordre sauvegardé
                                siteSectors.sort((a, b) => {
                                    const indexA = orderedIds.indexOf(a.id);
                                    const indexB = orderedIds.indexOf(b.id);
                                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                    if (indexA !== -1) return -1;
                                    if (indexB !== -1) return 1;
                                    return a.id - b.id;
                                });
                            }

                            return (
                                <div key={safeId('site', site.id)} className="mb-8">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center">
                                        {site.name}
                                        {site.description && (
                                            <span className="ml-2 text-sm text-gray-500 font-normal">
                                                ({site.description})
                                            </span>
                                        )}
                                    </h3>
                                    <div
                                        className={`${dragOverSiteId === site.id ? 'drop-target drag-over' : 'drop-target'}`}
                                        onDragOver={(e) => handleDragOver(e, site.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, site.id)}
                                    >
                                        {/* En-tête des colonnes */}
                                        <div className="grid grid-cols-5 gap-2 py-2 text-sm text-gray-600 border-b mb-2">
                                            <div className="font-medium pl-4">Nom</div>
                                            <div className="font-medium">Site</div>
                                            <div className="font-medium">Description</div>
                                            <div className="font-medium">Couleur</div>
                                            <div className="font-medium text-right pr-4">Actions</div>
                                        </div>

                                        {siteSectors.length > 0 ? (
                                            <div>
                                                {siteSectors.map((sector) => (
                                                    <div
                                                        key={safeId('sector', sector.id)}
                                                        className={`grid grid-cols-5 gap-2 items-center p-2 mb-1 rounded sector-item
                                                            ${sector.id === draggingSectorId ? 'dragging' : ''}
                                                            ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}
                                                            ${sector.siteId !== site.id ? 'sector-item-new' : ''}
                                                            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                                            hover:bg-gray-50 dark:hover:bg-gray-700
                                                        `}
                                                        draggable={isReordering}
                                                        onDragStart={(e) => handleDragStart(e, sector.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onDragOver={(e) => handleSectorDragOver(e, sector.id)}
                                                        onDragLeave={handleSectorDragLeave}
                                                        data-sector-id={sector.id}
                                                    >
                                                        <div className="pl-4 truncate">{sector.name}</div>
                                                        <div className="truncate">{site.name}</div>
                                                        <div className="truncate">{sector.description || 'N/A'}</div>
                                                        <div className="flex items-center">
                                                            <span
                                                                className="inline-block w-4 h-4 rounded-full mr-2"
                                                                style={{ backgroundColor: sector.colorCode || '#cccccc' }}
                                                                title={sector.colorCode || 'Pas de couleur'}
                                                            />
                                                            <span className="truncate">{sector.colorCode || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-end pr-4 space-x-2">
                                                            <button
                                                                onClick={() => handleEditClick(sector)}
                                                                className={`p-1 ${isReordering
                                                                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                                                                    : 'text-gray-600 hover:text-indigo-600'
                                                                    }`}
                                                                disabled={isReordering}
                                                                title={isReordering ? "Modification désactivée en mode réorganisation" : "Modifier"}
                                                            >
                                                                <PencilIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(sector.id)}
                                                                className={`p-1 ${isReordering
                                                                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                                                                    : 'text-gray-600 hover:text-red-600'
                                                                    }`}
                                                                disabled={isReordering}
                                                                title={isReordering ? "Suppression désactivée en mode réorganisation" : "Supprimer"}
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic ml-4 py-2">
                                                Aucun secteur dans ce site.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {saveMessage && (
                <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md animate-fadeIn">
                    <div className="flex items-center">
                        <CheckIcon className="h-5 w-5 mr-3 text-green-500" />
                        <div>
                            <p className="text-sm text-green-700">{saveMessage}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectorsConfigPanel;