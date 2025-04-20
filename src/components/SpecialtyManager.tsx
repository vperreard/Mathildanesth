'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Specialty } from '@prisma/client';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Using Heroicons for icons

// Type élargi pour inclure les chirurgiens optionnels
// Prisma inclut les relations dans le type de base si elles sont fetchées
type SpecialtyWithSurgeons = Specialty & {
    surgeons?: { id: number; nom: string; prenom: string }[];
};

// Type for form data (subset of Specialty)
type SpecialtyFormData = Pick<Specialty, 'name' | 'isPediatric'>;

export default function SpecialtyManager() {
    const [specialties, setSpecialties] = useState<SpecialtyWithSurgeons[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for the add/edit form
    const [isEditing, setIsEditing] = useState<number | null>(null); // Store ID of item being edited, null for adding
    const [formData, setFormData] = useState<SpecialtyFormData>({ name: '', isPediatric: false });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Fetch specialties function
    const fetchSpecialties = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // L'API retourne maintenant SpecialtyWithSurgeons
            const response = await axios.get<SpecialtyWithSurgeons[]>('/api/specialties');
            setSpecialties(response.data);
        } catch (err: any) {
            console.error("Fetch specialties error:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de charger les spécialités.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on component mount
    useEffect(() => {
        fetchSpecialties();
    }, [fetchSpecialties]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Reset form and editing state
    const resetForm = () => {
        setIsEditing(null);
        setFormData({ name: '', isPediatric: false });
        setFormError(null);
    };

    // Start editing an existing specialty
    const handleEditClick = (specialty: Specialty) => {
        setIsEditing(specialty.id);
        setFormData({ name: specialty.name, isPediatric: specialty.isPediatric });
        setFormError(null);
    };

    // Handle form submission (Add or Edit)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError('Le nom ne peut pas être vide.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        const url = isEditing ? `/api/specialties/${isEditing}` : '/api/specialties';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: formData });
            await fetchSpecialties(); // Re-fetch the list
            resetForm(); // Reset form after successful submission
        } catch (err: any) {
            console.error("Submit specialty error:", err);
            setFormError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deletion
    const handleDeleteClick = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ? Cette action est irréversible.\nNote: La suppression échouera si des chirurgiens sont encore liés à cette spécialité.')) {
            return;
        }
        setError(null); // Clear previous main errors
        try {
            await axios.delete(`/api/specialties/${id}`);
            setSpecialties(prev => prev.filter(s => s.id !== id)); // Optimistic update
        } catch (err: any) {
            console.error("Delete specialty error:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de supprimer la spécialité (vérifiez si elle est utilisée).');
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            {/* Add/Edit Form Section */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    {isEditing ? 'Modifier la Spécialité' : 'Ajouter une Spécialité'}
                </h2>
                {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ex: Orthopédie"
                        />
                    </div>
                    <div className="flex items-center pt-4 md:pt-0 md:pb-1">
                        <input
                            type="checkbox"
                            id="isPediatric"
                            name="isPediatric"
                            checked={formData.isPediatric}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPediatric" className="ml-2 block text-sm font-medium text-gray-700">Pédiatrique</label>
                    </div>
                    <div className="flex items-end space-x-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'En cours...' : (isEditing ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />)}
                            <span className="ml-2">{isEditing ? 'Enregistrer' : 'Ajouter'}</span>
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <XMarkIcon className="h-5 w-5 mr-1" /> Annuler
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Display List Section */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Liste des Spécialités</h2>
            {isLoading ? (
                <p className="text-gray-500">Chargement...</p>
            ) : error ? (
                <p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">Erreur: {error}</p>
            ) : specialties.length === 0 ? (
                <p className="text-gray-500">Aucune spécialité ajoutée pour le moment.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pédiatrique</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chirurgiens Liés</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {specialties.map((spec) => (
                                <tr key={spec.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spec.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {spec.isPediatric ?
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Oui</span> :
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Non</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(spec.surgeons && spec.surgeons.length > 0) ? (
                                            spec.surgeons.map(s => `${s.prenom} ${s.nom}`).join(', ')
                                        ) : (
                                            <span className="text-gray-400 italic">Aucun</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEditClick(spec)}
                                            disabled={isEditing === spec.id}
                                            className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded-md hover:bg-indigo-50 disabled:hover:bg-transparent"
                                            title="Modifier"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(spec.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
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
    );
} 