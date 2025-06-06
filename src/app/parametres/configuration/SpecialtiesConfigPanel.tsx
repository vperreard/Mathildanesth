'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import axios from 'axios';
// TODO: Replace @heroicons with lucide-react
import { AlertTriangle } from 'lucide-react';

// Types pour les spécialités et chirurgiens
type Specialty = {
    id: number;
    name: string;
    isPediatric: boolean;
};

type SpecialtyWithSurgeons = Specialty & {
    surgeons?: { id: number; nom: string; prenom: string }[];
};

type SpecialtyFormData = Pick<Specialty, 'name' | 'isPediatric'>;

type Surgeon = {
    id: number;
    nom: string;
    prenom: string;
    specialty1Id?: number;
    specialty2Id?: number;
    specialties?: { id: number; name: string }[];
};

const SpecialtiesConfigPanel: React.FC = () => {
    const [specialties, setSpecialties] = useState<SpecialtyWithSurgeons[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);

    // États pour le formulaire
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [formData, setFormData] = useState<SpecialtyFormData>({ name: '', isPediatric: false });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // Récupération des spécialités
    const fetchSpecialties = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get<SpecialtyWithSurgeons[]>('/api/specialties');
            setSpecialties(response.data);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des spécialités:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de charger les spécialités.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Récupération des chirurgiens
    const fetchSurgeons = useCallback(async () => {
        try {
            const response = await axios.get<Surgeon[]>('/api/chirurgiens');
            setSurgeons(response.data);
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des chirurgiens:', { error: err });
        }
    }, []);

    // Chargement initial des données
    useEffect(() => {
        fetchSpecialties();
        fetchSurgeons();
    }, [fetchSpecialties, fetchSurgeons]);

    // Gestion des changements de formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Réinitialisation du formulaire
    const resetForm = () => {
        setIsEditing(null);
        setFormData({ name: '', isPediatric: false });
        setFormError(null);
    };

    // Début de modification d'une spécialité
    const handleEditClick = (specialty: Specialty) => {
        setIsEditing(specialty.id);
        setFormData({ name: specialty.name, isPediatric: specialty.isPediatric });
        setFormError(null);
    };

    // Soumission du formulaire (Ajout ou Modification)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError('Le nom de la spécialité ne peut pas être vide.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        const url = isEditing ? `/api/specialties/${isEditing}` : '/api/specialties';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: formData });
            await fetchSpecialties();
            resetForm();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: unknown) {
            logger.error("Erreur lors de la soumission:", err);
            setFormError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Suppression d'une spécialité
    const handleDeleteClick = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ? Cette action est irréversible.\nNote: La suppression échouera si des chirurgiens sont encore liés à cette spécialité.')) {
            return;
        }
        setError(null);
        try {
            await axios.delete(`http://localhost:3000/api/specialties/${id}`);
            setSpecialties(prev => prev.filter(s => s.id !== id));
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: unknown) {
            logger.error("Erreur lors de la suppression:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de supprimer la spécialité (vérifiez si elle est utilisée).');
        }
    };

    // Recherche de chirurgiens liés à une spécialité
    const getLinkedSurgeons = (specialtyId: number) => {
        return surgeons.filter(surgeon => {
            if (surgeon.specialties && Array.isArray(surgeon.specialties)) {
                return surgeon.specialties.some(s => s.id === specialtyId);
            }
            return (surgeon.specialty1Id === specialtyId) || (surgeon.specialty2Id === specialtyId);
        });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Gestion des Spécialités Chirurgicales</h2>

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
            <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-4 text-gray-700">
                    {isEditing ? 'Modifier la Spécialité' : 'Ajouter une Spécialité'}
                </h3>

                {formError && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                        <p className="text-sm text-red-700">{formError}</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom de la spécialité</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Orthopédie"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isPediatric"
                            name="isPediatric"
                            checked={formData.isPediatric}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPediatric" className="ml-2 block text-sm font-medium text-gray-700">
                            Spécialité pédiatrique
                        </label>
                    </div>
                </div>

                <div className="mt-5 flex justify-end space-x-3">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            
                            Annuler
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        ) : isEditing ? (
                            null /* <CheckIcon className="h-4 w-4 mr-2" */ 
                        ) : (
                            null /* <PlusIcon className="h-4 w-4 mr-2" */
                        )}
                        {isEditing ? 'Enregistrer' : 'Ajouter'}
                    </button>
                </div>
            </form>
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Liste des Spécialités</h3>

                {isLoading ? (
                    <div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des spécialités...</p>
                    </div>
                ) : specialties.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 italic">Aucune spécialité trouvée</p>
                ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Type
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Chirurgiens assignés
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {specialties.map((specialty) => {
                                    const linkedSurgeons = getLinkedSurgeons(specialty.id);
                                    return (
                                        <tr key={specialty.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                {specialty.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {specialty.isPediatric ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Pédiatrique
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Adulte
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500">
                                                {linkedSurgeons.length === 0 ? (
                                                    <span className="text-gray-400 italic">Aucun</span>
                                                ) : (
                                                    <div className="max-h-16 overflow-y-auto">
                                                        {linkedSurgeons.map(surgeon => (
                                                            <div key={surgeon.id} className="text-xs py-0.5">
                                                                {surgeon.prenom} {surgeon.nom}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditClick(specialty)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    title="Modifier"
                                                >
                                                    
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(specialty.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                    disabled={linkedSurgeons.length > 0}
                                                >
                                                    {/* <TrashIcon className={`h-4 w-4 ${linkedSurgeons.length > 0 ? 'opacity-30 cursor-not-allowed' : ''}`} /> */}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpecialtiesConfigPanel; 