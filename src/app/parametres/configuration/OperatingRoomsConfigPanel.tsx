'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArrowsUpDownIcon as HeroArrowsUpDownIcon
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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Types pour les salles opératoires
type OperatingRoom = {
    id: number;
    name: string;
    number: string;
    sector: string;
    colorCode: string | null;
    isActive: boolean;
    supervisionRules: any;
    createdAt: string;
    updatedAt: string;
};

// Type pour l'ordre des salles (adapté pour les ID numériques)
type RoomOrderConfig = {
    orderedRoomIds: number[];
};

// Type pour le RoomOrderPanel (utilise des ID string pour le DND)
type RoomOrderPanelRoom = {
    id: string;
    name: string;
    sector: string;
}

type OperatingRoomFormData = {
    name: string;
    number: string;
    sector: string;
    colorCode: string;
    isActive: boolean;
    supervisionRules: any;
};

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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    // Nouveaux états pour la réorganisation des salles
    const [showRoomOrderPanel, setShowRoomOrderPanel] = useState<boolean>(false);
    const [roomOrder, setRoomOrder] = useState<RoomOrderConfig>({ orderedRoomIds: [] });
    const [saveMessage, setSaveMessage] = useState('');

    // Récupération des salles
    const fetchRooms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get<OperatingRoom[]>('/api/operating-rooms');
            setRooms(response.data);
        } catch (err: any) {
            console.error("Erreur lors du chargement des salles:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de charger les salles opératoires.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Chargement initial des données
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Charger l'ordre des salles depuis le localStorage au démarrage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRoomOrder = localStorage.getItem('operatingRoomOrderConfig');
            if (savedRoomOrder) {
                try {
                    const parsedOrder = JSON.parse(savedRoomOrder) as RoomOrderConfig;
                    parsedOrder.orderedRoomIds = parsedOrder.orderedRoomIds.map(id => Number(id));
                    setRoomOrder(parsedOrder);
                } catch (e) {
                    console.error('Erreur lors de la lecture de l\'ordre des salles :', e);
                    localStorage.removeItem('operatingRoomOrderConfig');
                }
            }
        }
    }, []);

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
        if (!formData.name.trim()) {
            setFormError('Le nom de la salle est obligatoire.');
            return;
        }
        if (!formData.number.trim()) {
            setFormError('Le numéro de la salle est obligatoire.');
            return;
        }
        if (!formData.sector.trim()) {
            setFormError('Le secteur de la salle est obligatoire.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        const url = isEditing ? `/api/operating-rooms/${isEditing}` : '/api/operating-rooms';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: formData });
            await fetchRooms();
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

    // Fonction pour sauvegarder l'ordre des salles
    const handleSaveRoomOrder = (orderedRoomIdsAsString: string[]) => {
        const orderedRoomIds = orderedRoomIdsAsString.map(id => Number(id));
        setRoomOrder({ orderedRoomIds });

        if (typeof window !== 'undefined') {
            localStorage.setItem('operatingRoomOrderConfig', JSON.stringify({ orderedRoomIds }));
        }

        setSaveMessage('L\'ordre des salles a été enregistré avec succès');
        setTimeout(() => setSaveMessage(''), 3000);

        setShowRoomOrderPanel(false);
    };

    // Préparer les données pour le RoomOrderPanel (convertir ID en string)
    const roomsForPanel: RoomOrderPanelRoom[] = rooms.map(room => ({
        id: String(room.id),
        name: room.name,
        sector: room.sector
    }));

    // Préparer l'ordre pour le RoomOrderPanel (convertir ID en string)
    const roomOrderForPanel: { orderedRoomIds: string[] } = {
        orderedRoomIds: roomOrder.orderedRoomIds.map(id => String(id))
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration du Bloc Opératoire</h2>
                <Button onClick={handleAddClick} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Ajouter une Salle
                </Button>
            </div>

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

            {/* Liste des salles */}
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Liste des Salles</h3>
                    <Button
                        variant="outline"
                        onClick={() => setShowRoomOrderPanel(true)}
                        className="flex items-center gap-1 text-sm"
                        disabled={isLoading || rooms.length < 2}
                    >
                        <HeroArrowsUpDownIcon className="h-4 w-4" />
                        Réorganiser les salles
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des salles...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 italic">Aucune salle configurée</p>
                ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Numéro
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Secteur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Max. Supervision
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            {room.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.number}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.sector}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.colorCode ? (
                                                <span className="inline-flex items-center space-x-2">
                                                    <span
                                                        className="h-4 w-4 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: room.colorCode }}
                                                    ></span>
                                                    <span>{room.colorCode}</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {room.isActive ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.supervisionRules?.maxRoomsPerSupervisor || 'N/A'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(room)} // Ouvre la modale ici
                                                className="text-blue-600 hover:text-blue-800 mr-3"
                                                title="Modifier"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(room.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Supprimer"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {saveMessage && (
                <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{saveMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {showRoomOrderPanel && (
                <RoomOrderPanel
                    rooms={roomsForPanel}
                    roomOrder={roomOrderForPanel}
                    onSave={handleSaveRoomOrder}
                    onClose={() => setShowRoomOrderPanel(false)}
                />
            )}
        </div>
    );
};

interface RoomOrderPanelProps {
    rooms: RoomOrderPanelRoom[];
    roomOrder: { orderedRoomIds: string[] };
    onSave: (orderedRoomIds: string[]) => void;
    onClose: () => void;
}

const RoomOrderPanel: React.FC<RoomOrderPanelProps> = ({
    rooms,
    roomOrder,
    onSave,
    onClose
}) => {
    const [sectorRooms, setSectorRooms] = useState<{ [sector: string]: RoomOrderPanelRoom[] }>({});
    const [orderedSectors, setOrderedSectors] = useState<string[]>([]);

    useEffect(() => {
        const groupedRooms: { [sector: string]: RoomOrderPanelRoom[] } = {};
        const initialOrderedSectors: string[] = [];

        // Utiliser l'ordre existant dans roomOrder.orderedRoomIds pour déterminer l'ordre initial des secteurs et des salles
        const orderedRoomIds = roomOrder.orderedRoomIds;
        const roomMap = new Map(rooms.map(r => [r.id, r]));

        orderedRoomIds.forEach(roomId => {
            const room = roomMap.get(roomId);
            if (room) {
                if (!groupedRooms[room.sector]) {
                    groupedRooms[room.sector] = [];
                    initialOrderedSectors.push(room.sector);
                }
                groupedRooms[room.sector].push(room);
                roomMap.delete(roomId); // Marquer comme traité
            }
        });

        // Ajouter les salles restantes (non présentes dans l'ordre sauvegardé)
        roomMap.forEach(room => {
            if (!groupedRooms[room.sector]) {
                groupedRooms[room.sector] = [];
                initialOrderedSectors.push(room.sector);
            }
            groupedRooms[room.sector].push(room);
        });

        // S'assurer que toutes les salles dans chaque secteur sont triées selon l'ordre global si possible
        Object.keys(groupedRooms).forEach(sector => {
            groupedRooms[sector].sort((a, b) => {
                const indexA = orderedRoomIds.indexOf(a.id);
                const indexB = orderedRoomIds.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name); // Fallback
            });
        });

        setSectorRooms(groupedRooms);
        setOrderedSectors(initialOrderedSectors);
    }, [rooms, roomOrder]);

    const handleDragEnd = (result: any) => {
        console.log('Drag End Result:', result);
        const { source, destination, draggableId, type } = result;

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        // --- Déplacement d'un SECTEUR --- (Identifié par type="SECTOR" sur le Droppable source/destination)
        if (type === 'SECTOR') {
            // draggableId est le nom du secteur
            const newOrderedSectors = Array.from(orderedSectors);
            // On retire l'élément à l'index source (l'index correspond à l'ordre des secteurs)
            newOrderedSectors.splice(source.index, 1);
            // On insère l'élément (draggableId = nom du secteur) à l'index de destination
            newOrderedSectors.splice(destination.index, 0, draggableId);
            setOrderedSectors(newOrderedSectors);
            return;
        }

        // --- Déplacement d'une SALLE --- (Identifié par type="ROOM")
        if (type === 'ROOM') {
            const startSector = source.droppableId;
            const endSector = destination.droppableId;

            // Si déplacement dans le même secteur
            if (startSector === endSector) {
                const currentRooms = sectorRooms[startSector] || [];
                const updatedRooms = Array.from(currentRooms);
                const [movedRoom] = updatedRooms.splice(source.index, 1);
                updatedRooms.splice(destination.index, 0, movedRoom);

                setSectorRooms(prev => ({
                    ...prev,
                    [startSector]: updatedRooms
                }));
            } else {
                // Déplacement inter-secteurs (optionnel, non implémenté)
                // console.log("Déplacement inter-secteurs non géré pour le moment");
            }
        }
    };

    const saveRoomOrder = () => {
        const finalOrderedRoomIds: string[] = [];

        orderedSectors.forEach(sector => {
            if (sectorRooms[sector]) {
                sectorRooms[sector].forEach(room => {
                    finalOrderedRoomIds.push(room.id);
                });
            }
        });

        onSave(finalOrderedRoomIds);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Réorganisation des salles de bloc
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4 flex items-center text-gray-600 dark:text-gray-300">
                    <HeroArrowsUpDownIcon className="h-5 w-5 mr-2" />
                    <span>Faire glisser les secteurs ou les salles pour réorganiser leur ordre d'affichage</span>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="all-sectors" type="SECTOR">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {orderedSectors.map((sector, index) => (
                                    <Draggable key={sector} draggableId={sector} index={index}>
                                        {(providedSector, snapshotSector) => (
                                            <div
                                                ref={providedSector.innerRef}
                                                {...providedSector.draggableProps}
                                                className={`mb-6 border rounded-md ${snapshotSector.isDragging ? 'border-blue-300 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}
                                            >
                                                <div
                                                    {...providedSector.dragHandleProps}
                                                    className={`flex items-center text-lg font-medium mb-0 text-gray-800 dark:text-gray-200 p-2 rounded-t-md cursor-grab ${snapshotSector.isDragging ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                >
                                                    <HeroArrowsUpDownIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                                                    {sector}
                                                </div>

                                                <Droppable droppableId={sector} type="ROOM">
                                                    {(providedRoomList) => (
                                                        <div
                                                            {...providedRoomList.droppableProps}
                                                            ref={providedRoomList.innerRef}
                                                            className={`bg-gray-50 dark:bg-gray-800 rounded-b-md p-2 min-h-[50px] ${snapshotSector.isDragging ? 'opacity-50' : ''}`}
                                                        >
                                                            {(sectorRooms[sector] || []).map((room, roomIndex) => (
                                                                <Draggable
                                                                    key={room.id}
                                                                    draggableId={room.id}
                                                                    index={roomIndex}
                                                                    isDragDisabled={snapshotSector.isDragging}
                                                                >
                                                                    {(providedRoom, snapshotRoom) => (
                                                                        <div
                                                                            ref={providedRoom.innerRef}
                                                                            {...providedRoom.draggableProps}
                                                                            {...providedRoom.dragHandleProps}
                                                                            className={`p-3 mb-2 rounded-md flex justify-between items-center shadow-sm ${snapshotRoom.isDragging
                                                                                ? "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 scale-105"
                                                                                : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                                                                } ${snapshotSector.isDragging ? 'cursor-not-allowed' : 'cursor-grab'}`}
                                                                        >
                                                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                                                                {room.name}
                                                                            </span>
                                                                            <HeroArrowsUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {providedRoomList.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="flex justify-end mt-6 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={saveRoomOrder}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Enregistrer l'ordre
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OperatingRoomsConfigPanel; 