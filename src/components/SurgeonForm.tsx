'use client';

import React, { useState, useEffect } from 'react';
import { Surgeon, Specialty, UserStatus } from '@prisma/client';
import { User } from '@/types/user';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Interface Surgeon avec les spécialités correctement typées
interface SurgeonWithSpecialties extends Omit<Surgeon, 'specialties'> {
    specialties: Pick<Specialty, 'id' | 'name'>[];
}

// Type pour les données du formulaire interne
interface SurgeonFormDataInternal {
    nom: string;
    prenom: string;
    email: string;
    phoneNumber: string;
    status: UserStatus;
    userId: number | null;
    specialty1Id: number | null;
    specialty2Id: number | null;
}

// Type pour les données envoyées à l'API via onSubmit
export interface SurgeonSubmitData {
    nom: string;
    prenom: string;
    email?: string | null;
    phoneNumber?: string | null;
    status: UserStatus;
    userId: number | null;
    specialtyIds: number[];
}

const STATUS_OPTIONS = Object.values(UserStatus);

// Interface simplifiée pour les utilisateurs linkables
type LinkableUser = Pick<User, 'id' | 'nom' | 'prenom' | 'login'>;

interface SurgeonFormProps {
    onSubmit: (data: SurgeonSubmitData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: SurgeonWithSpecialties | null;
}

export default function SurgeonForm({
    onSubmit,
    onCancel,
    isLoading = false,
    initialData = null,
}: SurgeonFormProps) {
    // Initialiser l'état interne du formulaire
    const [formData, setFormData] = useState<SurgeonFormDataInternal>(() => ({
        nom: initialData?.nom || '',
        prenom: initialData?.prenom || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        status: initialData?.status || UserStatus.ACTIF,
        userId: initialData?.userId || null,
        specialty1Id: initialData?.specialties?.[0]?.id || null,
        specialty2Id: initialData?.specialties?.[1]?.id || null,
    }));
    // Nouvel état pour contrôler l'affichage du champ Spécialité 2
    const [showSpecialty2, setShowSpecialty2] = useState<boolean>(!!initialData?.specialties?.[1]?.id);

    const [linkableUsers, setLinkableUsers] = useState<LinkableUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingSpecialties, setLoadingSpecialties] = useState(false);
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);

    const isEditMode = initialData !== null;

    // Mise à jour de l'état si initialData change
    useEffect(() => {
        const initialSpecialty1 = initialData?.specialties?.[0]?.id || null;
        const initialSpecialty2 = initialData?.specialties?.[1]?.id || null;
        setFormData({
            nom: initialData?.nom || '',
            prenom: initialData?.prenom || '',
            email: initialData?.email || '',
            phoneNumber: initialData?.phoneNumber || '',
            status: initialData?.status || UserStatus.ACTIF,
            userId: initialData?.userId || null,
            specialty1Id: initialSpecialty1,
            specialty2Id: initialSpecialty2,
        });
        // Mettre à jour showSpecialty2 basé sur les données initiales
        setShowSpecialty2(!!initialSpecialty2);
        setError(null);
    }, [initialData]);

    // Fetch linkable users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const response = await axios.get<LinkableUser[]>('/api/users/linkable');
                setLinkableUsers(response.data);
            } catch (err) {
                console.error("Erreur fetch linkable users:", err);
                // Gérer l'erreur si nécessaire (ex: afficher un message)
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // Récupérer la liste des spécialités au montage
    useEffect(() => {
        const fetchSpecialties = async () => {
            setLoadingSpecialties(true);
            setError(null);
            try {
                const response = await fetch('/api/specialties');
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Erreur lors de la récupération des spécialités');
                }
                const data: Specialty[] = await response.json();
                setAvailableSpecialties(data);
            } catch (err: any) {
                console.error("Fetch specialties error:", err);
                setError(err.message || 'Impossible de charger la liste des spécialités.');
            } finally {
                setLoadingSpecialties(false);
            }
        };
        fetchSpecialties();
    }, []);

    // Handler générique pour les champs (input, select)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'userId') {
            setFormData(prev => ({ ...prev, userId: value ? parseInt(value, 10) : null }));
        } else if (name === 'status') {
            const statusValue = value as UserStatus;
            if (Object.values(UserStatus).includes(statusValue)) {
                setFormData(prev => ({ ...prev, status: statusValue }));
            }
        } else if (name === 'specialty1Id') {
            const idValue = (value && value !== "null") ? parseInt(value, 10) : null;
            setFormData(prev => {
                if (idValue === null && prev.specialty2Id !== null) {
                    setShowSpecialty2(false);
                    return { ...prev, specialty1Id: prev.specialty2Id, specialty2Id: null };
                } else {
                    return { ...prev, specialty1Id: idValue };
                }
            });
        } else if (name === 'specialty2Id') {
            const idValue = (value && value !== "null") ? parseInt(value, 10) : null;
            setFormData(prev => ({ ...prev, specialty2Id: idValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!formData.nom || !formData.prenom) {
            setError('Nom et prénom sont obligatoires.');
            return;
        }
        const specialtyIds = [
            formData.specialty1Id,
            formData.specialty2Id
        ].filter((id): id is number => id !== null && !isNaN(id));

        const uniqueSpecialtyIds = Array.from(new Set(specialtyIds));

        const dataToSubmit: SurgeonSubmitData = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email || null,
            phoneNumber: formData.phoneNumber || null,
            status: formData.status,
            userId: formData.userId,
            specialtyIds: uniqueSpecialtyIds,
        };

        try {
            await onSubmit(dataToSubmit);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de la sauvegarde.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm font-medium mb-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optionnel)</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="contact@example.com"
                    />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Téléphone (Optionnel)</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0612345678"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                <div>
                    <label htmlFor="specialty1Id" className="block text-sm font-medium text-gray-700 mb-1">Spécialité Principale</label>
                    <div className="flex items-center space-x-2">
                        <select
                            id="specialty1Id"
                            name="specialty1Id"
                            value={formData.specialty1Id ?? 'null'}
                            onChange={handleChange}
                            disabled={loadingSpecialties}
                            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                        >
                            <option value="null">-- Aucune --</option>
                            {availableSpecialties.map((specialty) => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}{specialty.isPediatric ? ' (Péd.)' : ''}
                                </option>
                            ))}
                        </select>
                        {formData.specialty1Id !== null && !showSpecialty2 && (
                            <motion.button
                                type="button"
                                onClick={() => setShowSpecialty2(true)}
                                className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0"
                                title="Ajouter une seconde spécialité"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <PlusIcon className="h-5 w-5" />
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="min-h-[62px]">
                    <AnimatePresence>
                        {showSpecialty2 && (
                            <motion.div
                                key="specialty2-field"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <label htmlFor="specialty2Id" className="block text-sm font-medium text-gray-700 mb-1">Spécialité Secondaire</label>
                                <select
                                    id="specialty2Id"
                                    name="specialty2Id"
                                    value={formData.specialty2Id ?? 'null'}
                                    onChange={handleChange}
                                    disabled={loadingSpecialties}
                                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                                >
                                    <option value="null">-- Aucune --</option>
                                    {availableSpecialties.map((specialty) => (
                                        <option key={specialty.id} value={specialty.id} disabled={specialty.id === formData.specialty1Id}>
                                            {specialty.name}{specialty.isPediatric ? ' (Péd.)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {loadingSpecialties && <p className="text-xs text-gray-500 -mt-4 mb-4">Chargement des spécialités...</p>}

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    {STATUS_OPTIONS.map(statusValue => (
                        <option key={statusValue} value={statusValue}>{statusValue}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Lier au compte utilisateur (Optionnel)</label>
                <select
                    id="userId"
                    name="userId"
                    value={formData.userId === null ? '' : formData.userId}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                >
                    <option value="">-- Non lié --</option>
                    {initialData?.userId && !linkableUsers.some(u => u.id === initialData.userId) && (
                        <option value={initialData.userId} disabled style={{ fontStyle: 'italic', color: 'gray' }}>
                            (Lié actuellement - ID: {initialData.userId})
                        </option>
                    )}
                    {linkableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.prenom} {user.nom} ({user.login})
                        </option>
                    ))}
                </select>
                {loadingUsers && <p className="text-xs text-gray-500 mt-1">Chargement des utilisateurs...</p>}
                {initialData?.userId && (
                    <p className="text-xs text-gray-500 mt-1">Pour délier, sélectionnez "-- Non lié --".</p>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading || loadingSpecialties}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading
                        ? (isEditMode ? 'Enregistrement...' : 'Création...')
                        : (isEditMode ? 'Enregistrer' : 'Ajouter Chirurgien')}
                </button>
            </div>
        </form>
    );
} 