'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../lib/logger";
import { Specialty } from '@prisma/client';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
    Button,
    Input,
    Badge,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Card,
    CardContent
} from '@/components/ui';

// Type élargi pour inclure les chirurgiens optionnels
// Prisma inclut les relations dans le type de base si elles sont fetchées
type SpecialtyWithSurgeons = Specialty & {
    surgeons?: { id: number; nom: string; prenom: string }[];
};

// Type for form data (subset of Specialty)
type SpecialtyFormData = Pick<Specialty, 'name' | 'isPediatric'>;

// Définition d'un type pour les chirurgiens
type Surgeon = {
    id: number;
    nom: string;
    prenom: string;
    specialty1Id?: number;
    specialty2Id?: number;
    specialties?: { id: number; name: string }[];
};

export default function SpecialtyManager() {
    const [specialties, setSpecialties] = useState<SpecialtyWithSurgeons[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for the add/edit form
    const [isEditing, setIsEditing] = useState<number | null>(null); // Store ID of item being edited, null for adding
    const [formData, setFormData] = useState<SpecialtyFormData>({ name: '', isPediatric: false });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Ajout d'un état pour stocker la liste des chirurgiens
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);

    // Fetch specialties function
    const fetchSpecialties = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // L'API retourne maintenant SpecialtyWithSurgeons
            const response = await axios.get<SpecialtyWithSurgeons[]>('/api/specialties');
            setSpecialties(response.data);
        } catch (err: unknown) {
            logger.error("Fetch specialties error:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de charger les spécialités.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on component mount
    useEffect(() => {
        fetchSpecialties();
    }, [fetchSpecialties]);

    // Fetch surgeons function
    useEffect(() => {
        const fetchSurgeons = async () => {
            try {
                const response = await axios.get<Surgeon[]>('/api/chirurgiens');
                setSurgeons(response.data);
            } catch (err: unknown) {
                logger.error('Fetch surgeons error:', { error: err });
            }
        };
        fetchSurgeons();
    }, []);

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
        } catch (err: unknown) {
            logger.error("Submit specialty error:", err);
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
            await axios.delete(`http://localhost:3000/api/specialties/${id}`);
            setSpecialties(prev => prev.filter(s => s.id !== id)); // Optimistic update
        } catch (err: unknown) {
            logger.error("Delete specialty error:", err);
            setError(err.response?.data?.message || err.message || 'Impossible de supprimer la spécialité (vérifiez si elle est utilisée).');
        }
    };

    return (
        <div>
            {/* Add/Edit Form Section */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {isEditing ? 'Modifier la Spécialité' : 'Ajouter une Spécialité'}
                    </h2>
                    {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-grow">
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    label="Nom"
                                    placeholder="Ex: Orthopédie"
                                    error={formError && !formData.name.trim() ? "Le nom est requis" : undefined}
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
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    isLoading={isSubmitting}
                                >
                                    {!isSubmitting && (isEditing ? <CheckIcon className="h-5 w-5 mr-1" /> : <PlusIcon className="h-5 w-5 mr-1" />)}
                                    {isEditing ? 'Enregistrer' : 'Ajouter'}
                                </Button>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        onClick={resetForm}
                                        variant="secondary"
                                    >
                                        <XMarkIcon className="h-5 w-5 mr-1" /> Annuler
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Display List Section */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Liste des Spécialités</h2>
            {isLoading ? (
                <p className="text-gray-500">Chargement...</p>
            ) : error ? (
                <p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">Erreur: {error}</p>
            ) : specialties.length === 0 ? (
                <p className="text-gray-500">Aucune spécialité ajoutée pour le moment.</p>
            ) : (
                <Table bordered hover striped>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Chirurgiens</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {specialties.map(specialty => (
                            <TableRow key={specialty.id}>
                                <TableCell className="font-medium">{specialty.name}</TableCell>
                                <TableCell>
                                    <Badge variant={specialty.isPediatric ? "info" : "secondary"}>
                                        {specialty.isPediatric ? 'Pédiatrique' : 'Adulte'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {specialty.surgeons && specialty.surgeons.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1">
                                            {specialty.surgeons.slice(0, 3).map((surgeon) => (
                                                <div
                                                    key={surgeon.id}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                                >
                                                    <span>{surgeon.prenom} {surgeon.nom}</span>
                                                </div>
                                            ))}
                                            {specialty.surgeons.length > 3 && (
                                                <span className="text-xs font-medium text-gray-500">
                                                    +{specialty.surgeons.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Aucun</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => handleEditClick(specialty)}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" /> Modifier
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteClick(specialty.id)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            <TrashIcon className="h-4 w-4 mr-1" /> Supprimer
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
} 