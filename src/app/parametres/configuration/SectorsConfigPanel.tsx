'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon
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
} from "@/components/ui"; // Assurez-vous que ces composants existent

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
};

type SectorFormData = {
    name: string;
    colorCode: string;
    isActive: boolean;
    description: string;
    rules: any;
};

const SectorsConfigPanel: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
        }
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    useEffect(() => {
        console.log("SectorsConfigPanel - Mounted. Fetching sectors...");
        fetchSectors();
    }, []);

    const fetchSectors = async () => {
        setIsLoadingSectors(true);
        console.log("SectorsConfigPanel - fetchSectors: START");
        try {
            const response = await axios.get('/api/sectors');
            console.log("SectorsConfigPanel - fetchSectors: SUCCESS", { data: response.data });
            setSectors(response.data || []); // Assurer que sectors est toujours un tableau
        } catch (error) {
            console.error("SectorsConfigPanel - fetchSectors: ERROR", error);
            toast.error('Erreur lors de la récupération des secteurs');
            setError('Impossible de charger les secteurs.'); // Définir un message d'erreur générique
        } finally {
            console.log("SectorsConfigPanel - fetchSectors: END");
            setIsLoadingSectors(false);
        }
    };

    // Gestion des changements de formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Gestion du changement de nombre max de salles par superviseur
    const handleMaxRoomsChange = (value: number) => {
        setFormData(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                maxRoomsPerSupervisor: value
            }
        }));
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
            }
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
            }
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
            rules: sector.rules || { maxRoomsPerSupervisor: 2 }
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
                <Button onClick={handleAddClick} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Ajouter un Secteur
                </Button>
            </div>

            {error && !isLoadingSectors && (
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
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                                <input
                                    type="color"
                                    id="colorCode"
                                    name="colorCode"
                                    value={formData.colorCode || '#3B82F6'}
                                    onChange={handleInputChange}
                                    className="h-10 w-full border border-gray-300 rounded"
                                />
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

                            <div>
                                <label htmlFor="maxRooms" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre max. de salles par superviseur
                                </label>
                                <input
                                    type="number"
                                    id="maxRooms"
                                    min="1"
                                    max="5"
                                    value={formData.rules?.maxRoomsPerSupervisor || 2}
                                    onChange={(e) => handleMaxRoomsChange(parseInt(e.target.value))}
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

            {/* Liste des secteurs */}
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Liste des Secteurs</h3>

                {isLoadingSectors ? (
                    <div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des secteurs...</p>
                    </div>
                ) : sectors.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 italic">Aucun secteur configuré</p>
                ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Description
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Max. Salles / Sup.
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sectors.map((sector) => (
                                    <tr key={sector.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            {sector.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className="inline-flex items-center space-x-2">
                                                <span
                                                    className="h-4 w-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: sector.colorCode }}
                                                ></span>
                                                <span>{sector.colorCode}</span>
                                            </span>
                                        </td>
                                        <td className="whitespace-normal px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {sector.description || <span className="italic text-gray-400">N/A</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {sector.isActive ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {sector.rules?.maxRoomsPerSupervisor || 'N/A'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(sector)} // Ouvre la modale ici
                                                className="text-blue-600 hover:text-blue-800 mr-3"
                                                title="Modifier"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(sector.id)}
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
        </div>
    );
};

export default SectorsConfigPanel;