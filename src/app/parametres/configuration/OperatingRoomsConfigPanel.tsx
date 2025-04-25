'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArrowsUpDownIcon as HeroArrowsUpDownIcon,
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
    DialogClose
} from "@/components/ui"; // Assurez-vous que ces composants existent

// Style global pour les animations
const globalStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.room-item {
  cursor: move;
  transition: all 0.2s ease-in-out;
  position: relative;
  z-index: 1;
}

.room-item.dragging {
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

.room-item-new {
  animation: appear 0.5s ease-out forwards;
}
`;

// --- Custom Hook pour vérifier le montage client ---
function useIsMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
}
// -------------------------------------------------

// Fonction utilitaire pour générer des IDs stables
function safeId(prefix: string, id: string | number): string {
    return `${prefix}-${id}`.replace(/\s+/g, '-');
}

// Types pour les salles opératoires
type OperatingRoom = {
    id: number;
    name: string;
    number: string;
    sector: string;
    roomType?: string;
    colorCode: string | null;
    isActive: boolean;
    supervisionRules: any;
    createdAt: string;
    updatedAt: string;
};

// Type pour l'ordre des salles (adapté pour les ID numériques ET par secteur)
// type RoomOrderConfig = {
//     orderedRoomIds: number[];
// };
// Nouvelle structure pour l'ordre par secteur
type RoomOrderConfig = {
    orderedRoomIdsBySector: { [sectorName: string]: number[] };
};

// Type pour un secteur (simplifié pour ce composant)
type Sector = {
    id: number;
    name: string;
    colorCode: string;
};

// Type pour une salle avec le nom du secteur
type OperatingRoomWithSector = OperatingRoom & {
    sector: string; // Garder le nom du secteur venant de l'API pour l'instant
};

interface OperatingRoomFormData {
    name: string;
    number: string;
    sector: string;
    colorCode: string;
    isActive: boolean;
    supervisionRules: any;
}

// Liste des secteurs prédéfinis
const SECTORS = [
    'Hyperaseptique', // Salles 1-4
    'Secteur 5-8',
    'Secteur 9-12B',
    'Ophtalmologie',
    'Endoscopie'
];

// Couleurs suggérées par secteur
const SECTOR_COLORS = {
    'Hyperaseptique': '#3B82F6', // Bleu
    'Secteur 5-8': '#10B981', // Vert
    'Secteur 9-12B': '#F97316', // Orange
    'Ophtalmologie': '#EC4899', // Rose
    'Endoscopie': '#4F46E5' // Bleu roi
};

const OperatingRoomsConfigPanel: React.FC = () => {
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [initialRooms, setInitialRooms] = useState<OperatingRoom[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]); // Nouvel état pour les secteurs
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useIsMounted();

    // État pour le drag and drop
    const [draggingRoomId, setDraggingRoomId] = useState<number | null>(null);
    const [dragOverSector, setDragOverSector] = useState<string | null>(null);
    const [dragOverRoomId, setDragOverRoomId] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState<boolean>(false);

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

    // États pour le formulaire et la modale
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState<OperatingRoomFormData>({
        name: '',
        number: '',
        sector: SECTORS[0],
        colorCode: SECTOR_COLORS[SECTORS[0]],
        isActive: true,
        supervisionRules: {
            maxRoomsPerSupervisor: 2
        }
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // État pour l'ordre des salles (adapté par secteur)
    // const [roomOrder, setRoomOrder] = useState<RoomOrderConfig>({ orderedRoomIds: [] });
    const [roomOrder, setRoomOrder] = useState<RoomOrderConfig>({ orderedRoomIdsBySector: {} });
    const [saveMessage, setSaveMessage] = useState('');

    // Charger les données initiales (salles ET secteurs)
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Utiliser Promise.all pour charger en parallèle
            const [roomsResponse, sectorsResponse] = await Promise.all([
                axios.get<OperatingRoom[]>('/api/operating-rooms'),
                axios.get<Sector[]>('/api/sectors') // Charger les secteurs
            ]);

            console.log("Données brutes salles:", roomsResponse.data);
            console.log("Données brutes secteurs:", sectorsResponse.data);

            // Assurer que les salles ont une propriété 'sector'
            const roomsData = roomsResponse.data.map(room => ({ ...room, sector: room.sector || 'Non défini' }));

            setInitialRooms(roomsData);
            setRooms(roomsData);
            setSectors(sectorsResponse.data || []); // Stocker les secteurs

        } catch (err: any) {
            console.error("Erreur lors du chargement des données:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de charger les données de configuration.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Charger l'ordre des salles depuis le localStorage au démarrage
    useEffect(() => {
        // Fonction pour définir l'état à la valeur par défaut et nettoyer localStorage
        const setDefaultOrder = () => {
            localStorage.removeItem('operatingRoomOrderConfig');
            setRoomOrder({ orderedRoomIdsBySector: {} });
        };

        if (typeof window !== 'undefined') {
            const savedRoomOrder = localStorage.getItem('operatingRoomOrderConfig');
            if (savedRoomOrder) {
                try {
                    const parsedData = JSON.parse(savedRoomOrder);

                    // VALIDER la structure principale
                    if (parsedData && typeof parsedData.orderedRoomIdsBySector === 'object' && parsedData.orderedRoomIdsBySector !== null) {
                        const validatedOrder: RoomOrderConfig = { orderedRoomIdsBySector: {} };
                        let hasValidData = false;

                        // VALIDER chaque entrée de secteur
                        for (const sector in parsedData.orderedRoomIdsBySector) {
                            if (Object.prototype.hasOwnProperty.call(parsedData.orderedRoomIdsBySector, sector)) {
                                const ids = parsedData.orderedRoomIdsBySector[sector];
                                // Vérifier si c'est un tableau de nombres
                                if (Array.isArray(ids) && ids.every((id: any) => typeof id === 'number')) {
                                    validatedOrder.orderedRoomIdsBySector[sector] = ids;
                                    hasValidData = true; // Marquer qu'on a trouvé au moins une entrée valide
                                } else {
                                    console.warn(`Données d'ordre invalides pour le secteur '${sector}' dans localStorage. Ignoré.`);
                                }
                            }
                        }

                        // Appliquer l'état seulement si on a trouvé des données valides
                        if (hasValidData) {
                            setRoomOrder(validatedOrder);
                            console.log("Ordre des salles valide chargé depuis localStorage:", validatedOrder);
                        } else {
                            console.warn("Aucune donnée d'ordre valide trouvée après validation. Réinitialisation.");
                            setDefaultOrder();
                        }

                    } else {
                        // Structure principale incorrecte (ou ancienne version)
                        console.warn("La structure de l'ordre des salles dans localStorage est incorrecte ou ancienne. Réinitialisation.");
                        setDefaultOrder();
                    }
                } catch (e) {
                    console.error('Erreur lors de la lecture ou validation de l\'ordre des salles depuis localStorage: ', e);
                    setDefaultOrder();
                }
            } else {
                // Aucun ordre sauvegardé, l'état initial est déjà correct
                console.log("Aucun ordre de salles trouvé dans localStorage. Utilisation de l'ordre par défaut.");
                // setRoomOrder({ orderedRoomIdsBySector: {} }); // Pas nécessaire car état initial
            }
        }
    }, []); // Le tableau vide assure que ça ne tourne qu'au montage

    // Gestion des changements de formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        // Si le secteur change, suggérer une couleur par défaut
        if (name === 'sector' && SECTOR_COLORS[value as keyof typeof SECTOR_COLORS]) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                colorCode: SECTOR_COLORS[value as keyof typeof SECTOR_COLORS]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: newValue,
            }));
        }
    };

    // Réinitialisation du formulaire et fermeture de la modale
    const resetFormAndCloseModal = () => {
        setIsEditing(null);
        setIsModalOpen(false);
        setFormData({
            name: '',
            number: '',
            sector: SECTORS[0],
            colorCode: SECTOR_COLORS[SECTORS[0]],
            isActive: true,
            supervisionRules: {
                maxRoomsPerSupervisor: 2
            }
        });
        setFormError(null);
    };

    // Ouverture de la modale pour AJOUT
    const handleAddClick = () => {
        setIsEditing(null);
        setFormData({
            name: '',
            number: '',
            sector: SECTORS[0],
            colorCode: SECTOR_COLORS[SECTORS[0]],
            isActive: true,
            supervisionRules: {
                maxRoomsPerSupervisor: 2
            }
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    // Ouverture de la modale pour MODIFICATION
    const handleEditClick = (room: OperatingRoom) => {
        setIsEditing(room.id);
        setFormData({
            name: room.name,
            number: room.number,
            sector: room.sector,
            colorCode: room.colorCode || '',
            isActive: room.isActive,
            supervisionRules: room.supervisionRules
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    // Soumission du formulaire (Ajout ou Modification)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            setFormError('Le nom de la salle est obligatoire.');
            return;
        }
        if (!formData.number?.trim()) {
            setFormError('Le numéro de la salle est obligatoire.');
            return;
        }
        if (!formData.sector?.trim()) {
            setFormError('Le secteur de la salle est obligatoire.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        const url = isEditing ? `/api/operating-rooms/${isEditing}` : '/api/operating-rooms';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: formData });
            await fetchData();
            resetFormAndCloseModal();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la soumission:", err);
            setFormError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Suppression d'une salle
    const handleDeleteClick = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.')) {
            return;
        }
        setError(null);
        try {
            await axios.delete(`/api/operating-rooms/${id}`);
            setRooms(prev => prev.filter(r => r.id !== id));
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error("Erreur lors de la suppression:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de supprimer la salle.');
        }
    };

    // Fonction pour sauvegarder l'ordre des salles par secteur
    const saveRoomOrderToStorage = (newOrder: RoomOrderConfig) => {
        // Vérifier que l'ordre est valide avant de continuer
        if (!newOrder || !newOrder.orderedRoomIdsBySector) {
            console.error("Tentative de sauvegarde d'un ordre invalide:", newOrder);
            return;
        }

        try {
            // Met à jour l'état local avec la nouvelle structure d'ordre
            setRoomOrder(newOrder);

            if (typeof window !== 'undefined') {
                // Convertir l'objet en JSON et le sauvegarder
                const orderJSON = JSON.stringify(newOrder);
                localStorage.setItem('operatingRoomOrderConfig', orderJSON);
                console.log("Ordre des salles sauvegardé dans localStorage:", orderJSON);
            }

            setSaveMessage('Ordre des salles mis à jour (localement)');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'ordre des salles:", error);
            setError("Impossible de sauvegarder l'ordre des salles. Veuillez réessayer.");
        }
    };

    // Simplifier les gestionnaires d'événements pour le drag & drop
    const handleDragStart = (e: React.DragEvent, roomId: number) => {
        if (!isReordering) return;

        // Stocker l'ID de la salle en cours de déplacement
        setDraggingRoomId(roomId);

        // Stocker l'ID dans l'événement de transfert
        e.dataTransfer.setData('text/plain', roomId.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Ajouter la classe de style pour l'élément en cours de déplacement
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.add('dragging');
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        // Nettoyer l'état de déplacement
        setDraggingRoomId(null);
        setDragOverSector(null);

        // Supprimer la classe de style
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('dragging');
        }
    };

    const handleDragOver = (e: React.DragEvent, sectorName: string) => {
        if (!isReordering) return;

        // Prévenir le comportement par défaut pour permettre le drop
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        // Mettre à jour le secteur survolé
        setDragOverSector(sectorName);

        // Ajouter une classe CSS pour indiquer la zone de drop
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.add('drag-over');
        }
    };

    const handleRoomDragOver = (e: React.DragEvent, roomId: number) => {
        e.preventDefault();
        e.stopPropagation(); // Empêcher la propagation vers le secteur parent

        // Ne pas marquer si c'est la même salle qui est survolée
        if (roomId === draggingRoomId) return;

        const roomElement = e.currentTarget as HTMLElement;
        const rect = roomElement.getBoundingClientRect();
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
            roomElement.classList.add('drop-above');
        } else {
            roomElement.classList.add('drop-below');
        }
    };

    const handleRoomDragLeave = (e: React.DragEvent) => {
        try {
            // Utiliser setTimeout pour éviter les clignotements lors du passage
            // d'une partie à l'autre de l'élément
            setTimeout(() => {
                const element = e.currentTarget as HTMLElement;
                if (!element) return;

                const roomId = element.getAttribute('data-room-id');
                if (!roomId) return;

                // Vérifier si l'élément est toujours survolé avant de supprimer la classe
                if (!document.querySelector(`:hover.room-item[data-room-id="${roomId}"]`)) {
                    element.classList.remove('drop-above', 'drop-below');
                }
            }, 50);
        } catch (err) {
            console.log("Erreur dans handleRoomDragLeave:", err);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Supprimer la classe CSS
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('drag-over');
        }
        setDragOverSector(null);
    };

    const handleDrop = (e: React.DragEvent, targetSectorName: string) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Nettoyer les classes de survol au début
            const dropClasses = document.querySelectorAll('.drop-above, .drop-below');

            // Récupérer l'ID de la salle depuis l'événement de transfert
            const draggedRoomId = parseInt(e.dataTransfer.getData('text/plain'));

            // Vérifier si on a une salle en cours de glisser
            if (!draggedRoomId || isNaN(draggedRoomId)) {
                console.warn("Aucun ID de salle valide n'est en cours de glisser");
                return;
            }

            // Récupérer la salle et le secteur source
            const sourceRoom = rooms.find(r => r.id === draggedRoomId);
            if (!sourceRoom) {
                console.error("Salle introuvable:", draggedRoomId);
                throw new Error("Salle introuvable");
            }

            const sourceSector = sourceRoom.sector;
            const destSector = targetSectorName;

            // Vérifier si on a un élément avec la classe drop-above ou drop-below
            const sectorContainer = e.currentTarget as HTMLElement;
            const dropTarget = sectorContainer.querySelector('.drop-above, .drop-below');
            const isDropAbove = dropTarget?.classList.contains('drop-above');
            const targetRoomId = dropTarget?.getAttribute('data-room-id');

            console.log(`Déplacement de la salle ${draggedRoomId} ${sourceSector !== destSector ?
                `du secteur ${sourceSector} vers ${destSector}` :
                "à l'intérieur de son secteur"}`);

            // Créer une copie de l'ordre actuel
            const newOrderedRoomIdsBySector = { ...roomOrder.orderedRoomIdsBySector };

            // Initialiser la liste pour le secteur de destination s'il n'existe pas
            if (!newOrderedRoomIdsBySector[destSector]) {
                newOrderedRoomIdsBySector[destSector] = [];
            }

            // Retirer la salle de son secteur d'origine
            if (sourceSector && newOrderedRoomIdsBySector[sourceSector]) {
                newOrderedRoomIdsBySector[sourceSector] = newOrderedRoomIdsBySector[sourceSector].filter(id => id !== draggedRoomId);
            }

            // Placer la salle au bon endroit dans le secteur de destination
            if (dropTarget && targetRoomId) {
                // On a une cible précise (position au dessus/en dessous d'une salle)
                const targetId = parseInt(targetRoomId);
                const targetIndex = newOrderedRoomIdsBySector[destSector].indexOf(targetId);

                if (targetIndex !== -1) {
                    // Insérer avant ou après selon la position
                    const insertIndex = isDropAbove ? targetIndex : targetIndex + 1;
                    newOrderedRoomIdsBySector[destSector].splice(insertIndex, 0, draggedRoomId);
                    console.log(`Salle positionnée ${isDropAbove ? 'avant' : 'après'} la salle ${targetId}`);
                } else {
                    // Si l'id cible n'est pas trouvé, ajouter à la fin
                    newOrderedRoomIdsBySector[destSector].push(draggedRoomId);
                    console.log(`Salle ajoutée à la fin du secteur (cible introuvable)`);
                }
            } else {
                // Pas de cible précise, ajouter à la fin du secteur
                newOrderedRoomIdsBySector[destSector].push(draggedRoomId);
                console.log(`Salle ajoutée à la fin du secteur ${destSector}`);
            }

            // Mettre à jour l'état local si changement de secteur
            if (sourceSector !== destSector) {
                setRooms(prevRooms => prevRooms.map(r =>
                    r.id === draggedRoomId ? { ...r, sector: destSector } : r
                ));
            }

            // Mettre à jour l'état avec le nouvel ordre
            setRoomOrder({ orderedRoomIdsBySector: newOrderedRoomIdsBySector });

            // Sauvegarder dans le localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('operatingRoomOrderConfig', JSON.stringify({
                    orderedRoomIdsBySector: newOrderedRoomIdsBySector
                }));
            }

            // Mode simulation - pas d'API call qui échoue, mais simulation de mise à jour
            if (sourceSector !== destSector) {
                setSaveMessage('Salle déplacée vers un nouveau secteur (mode simulation)');
            } else {
                setSaveMessage('Ordre des salles mis à jour');
            }
            setTimeout(() => setSaveMessage(''), 3000);

            // Réinitialiser l'état de déplacement
            setDraggingRoomId(null);

            // Nettoyer toutes les classes de survol
            dropClasses.forEach(el => {
                el.classList.remove('drop-above', 'drop-below');
            });
        } catch (error) {
            console.error("Erreur lors du drag & drop:", error);
            setError('Une erreur est survenue pendant le déplacement de la salle.');
        }
    };

    // Version simulée qui ne fait pas d'appels API
    const updateRoomSector = (roomId: number, destSector: string) => {
        // Cette fonction est maintenant juste un stub pour compatibilité
        // Elle n'est plus appelée directement
        return Promise.resolve();
    };

    // --- Regroupement et Tri des salles par secteur pour l'affichage ---
    const roomsBySector = useMemo(() => {
        // Si rooms est vide, retourner un objet vide pour éviter des problèmes
        if (!rooms.length) {
            return {};
        }

        // Créer un objet pour stocker les salles groupées par secteur
        const grouped: { [key: string]: OperatingRoom[] } = {};

        // Initialiser les groupes pour tous les secteurs connus (même vides)
        sectors.forEach(sector => {
            grouped[sector.name] = [];
        });

        // Préparer un set des noms de secteurs définis (mémoisation)
        const definedSectorNames = new Set(sectors.map(s => s.name));

        // Grouper les salles
        rooms.forEach(room => {
            // Vérifier que la salle a un ID valide
            if (!room || typeof room.id !== 'number') {
                console.warn("Salle invalide trouvée:", room);
                return; // Skip cette salle
            }

            // Utiliser 'Salles non assignées' si le secteur n'existe pas ou est null/vide
            const sectorName = (room.sector && definedSectorNames.has(room.sector)) ? room.sector : 'Salles non assignées';
            if (!grouped[sectorName]) {
                grouped[sectorName] = []; // Créer le groupe 'Salles non assignées' si nécessaire
            }
            grouped[sectorName].push(room);
        });

        // Trier les salles DANS CHAQUE groupe selon l'ordre sauvegardé
        Object.keys(grouped).forEach(sectorName => {
            const orderedIds = roomOrder.orderedRoomIdsBySector[sectorName];
            if (orderedIds) {
                grouped[sectorName].sort((a, b) => {
                    const indexA = orderedIds.indexOf(a.id);
                    const indexB = orderedIds.indexOf(b.id);
                    // Les salles connues dans l'ordre viennent en premier
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    // Les salles inconnues (nouvelles) viennent après
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    // Garder l'ordre relatif pour les salles inconnues (par ID pour stabilité)
                    return a.id - b.id;
                });
            }
        });

        // S'assurer que le groupe 'Salles non assignées' existe s'il y a des salles concernées,
        // même s'il n'y avait pas de secteur 'Salles non assignées' défini initialement.
        if (rooms.some(r => !r.sector || !definedSectorNames.has(r.sector)) && !grouped['Salles non assignées']) {
            grouped['Salles non assignées'] = rooms.filter(r => !r.sector || !definedSectorNames.has(r.sector));
            // Trier aussi ce groupe par sécurité (nouvelles salles)
            const orderedIds = roomOrder.orderedRoomIdsBySector['Salles non assignées'];
            if (orderedIds) {
                grouped['Salles non assignées'].sort((a, b) => {
                    const indexA = orderedIds.indexOf(a.id);
                    const indexB = orderedIds.indexOf(b.id);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.id - b.id;
                });
            }
        }

        return grouped;
    }, [rooms, sectors, roomOrder]); // Dépendances: données des salles, secteurs et ordre

    // Liste ordonnée des noms de secteurs pour l'affichage
    const orderedSectorNames = useMemo(() => {
        const names = sectors.map(s => s.name);
        // Ajouter 'Salles non assignées' s'il y a des salles sans secteur
        if (rooms.some(r => !r.sector || !sectors.find(s => s.name === r.sector))) {
            if (!names.includes('Salles non assignées')) {
                names.push('Salles non assignées');
            }
        }
        // TODO: Utiliser l'ordre sauvegardé des secteurs s'il existe
        return names;
    }, [sectors, rooms]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration du Bloc Opératoire</h2>
                <div className="flex space-x-4">
                    <Button onClick={handleAddClick} className="flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter une Salle
                    </Button>
                    <Button
                        onClick={() => setIsReordering(prev => !prev)}
                        variant={isReordering ? "danger" : "outline"}
                        className="flex items-center"
                    >
                        {isReordering ? (
                            <CheckIcon className="h-5 w-5 mr-2" />
                        ) : (
                            <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                        )}
                        {isReordering ? "Terminer la réorganisation" : "Réorganiser les salles"}
                    </Button>
                </div>
            </div>

            {isReordering && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md animate-fadeIn">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Mode réorganisation activé</strong> - Glissez-déposez les salles pour les réorganiser.
                                Vous pouvez déplacer une salle d'un secteur à un autre en la déposant dans la section cible.
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

            {/* Formulaire d'ajout/modification dans une modale */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Modifier la Salle' : 'Ajouter une Salle'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        {formError && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom de la salle</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: Salle de Chirurgie 1"
                                />
                            </div>

                            <div>
                                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
                                <input
                                    type="text"
                                    id="number"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: 1, 10, Ophta 3"
                                />
                            </div>

                            <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                                <select
                                    id="sector"
                                    name="sector"
                                    value={formData.sector}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {SECTORS.map(sector => (
                                        <option key={sector} value={sector}>{sector}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">Code couleur</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        id="colorCode"
                                        name="colorCode"
                                        value={formData.colorCode || '#000000'}
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
                                    Salle active
                                </label>
                            </div>

                            <div>
                                <label htmlFor="maxRooms" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre max. de salles supervisées
                                </label>
                                <input
                                    type="number"
                                    id="maxRooms"
                                    min="1"
                                    max="5"
                                    value={formData.supervisionRules?.maxRoomsPerSupervisor || 2}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setFormData(prev => ({
                                            ...prev,
                                            supervisionRules: {
                                                ...prev.supervisionRules,
                                                maxRoomsPerSupervisor: value
                                            }
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
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

            {/* Table des salles d'opération simplifiée avec drag and drop HTML5 natif */}
            <div className="bg-white dark:bg-gray-800 shadow px-4 md:px-10 pt-4 md:pt-7 pb-5 overflow-y-auto">
                {error && <p className="text-red-500">{error}</p>}
                {isLoading ? (
                    <p>Chargement des salles...</p>
                ) : (
                    <div>
                        {orderedSectorNames.map((sectorName) => {
                            const sectorRooms = roomsBySector[sectorName] || [];
                            return (
                                <div
                                    key={safeId('sector', sectorName)}
                                    className={`mb-8 border-b pb-4 ${dragOverSector === sectorName ? 'drop-target drag-over' : 'drop-target'}`}
                                    onDragOver={(e) => handleDragOver(e, sectorName)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, sectorName)}
                                >
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">
                                        {sectorName}
                                    </h3>

                                    {/* En-tête des colonnes */}
                                    <div className="grid grid-cols-5 gap-2 py-2 text-sm text-gray-600 border-b mb-2">
                                        <div className="font-medium pl-4">Nom</div>
                                        <div className="font-medium">Secteur</div>
                                        <div className="font-medium">Type</div>
                                        <div className="font-medium">Couleur</div>
                                        <div className="font-medium text-right pr-4">Actions</div>
                                    </div>

                                    {sectorRooms.length > 0 ? (
                                        <div>
                                            {sectorRooms.map((room) => (
                                                <div
                                                    key={safeId('room', room.id)}
                                                    className={`grid grid-cols-5 gap-2 items-center p-2 mb-1 rounded room-item
                                                        ${room.id === draggingRoomId ? 'dragging' : ''}
                                                        ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}
                                                        ${room.sector !== sectorName ? 'room-item-new' : ''}
                                                        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                                        hover:bg-gray-50 dark:hover:bg-gray-700
                                                    `}
                                                    draggable={isReordering}
                                                    onDragStart={(e) => handleDragStart(e, room.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={(e) => handleRoomDragOver(e, room.id)}
                                                    onDragLeave={handleRoomDragLeave}
                                                    data-room-id={room.id}
                                                >
                                                    <div className="pl-4 truncate">{room.name}</div>
                                                    <div className="truncate">{room.sector || 'N/A'}</div>
                                                    <div className="truncate">{room.roomType || 'N/A'}</div>
                                                    <div className="flex items-center">
                                                        <span
                                                            className="inline-block w-4 h-4 rounded-full mr-2"
                                                            style={{ backgroundColor: room.colorCode || '#cccccc' }}
                                                            title={room.colorCode || 'Pas de couleur'}
                                                        />
                                                        <span className="truncate">{room.colorCode || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-end pr-4 space-x-2">
                                                        <button
                                                            onClick={() => handleEditClick(room)}
                                                            className={`p-1 ${isReordering
                                                                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                                    : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                                }`}
                                                            disabled={isReordering}
                                                            title={isReordering ? "Modification désactivée en mode réorganisation" : "Modifier"}
                                                        >
                                                            <PencilIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(room.id)}
                                                            className={`p-1 ${isReordering
                                                                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                                    : 'text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
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
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic ml-4 py-2">
                                            Aucune salle dans ce secteur.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {saveMessage && (
                <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md animate-fadeIn">
                    <div className="flex items-center">
                        {saveMessage.includes('en cours') ? (
                            <span className="inline-block h-4 w-4 mr-3 rounded-full border-2 border-green-400 border-t-transparent animate-spin"></span>
                        ) : (
                            <CheckIcon className="h-5 w-5 mr-3 text-green-500" />
                        )}
                        <div>
                            <p className="text-sm text-green-700">{saveMessage}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatingRoomsConfigPanel; 