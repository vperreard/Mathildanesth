"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Edit, Calendar, MapPin, Tag, User, Save, X,
    Clock, Info, ArrowRight, CheckCircle2, XCircle, Bell, AlertTriangle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Types pour les affectations
type AssignmentType = {
    id: number;
    name: string;
    code: string;
    description: string;
    icon: string;
    color: string;
    isActive: boolean;
    allowsMultiple: boolean;
    requiresLocation: boolean;
    properties: Property[];
    createdAt: Date;
    updatedAt: Date;
};

type Property = {
    id: number;
    name: string;
    code: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'select';
    required: boolean;
    options?: string[]; // Pour le type 'select'
    defaultValue?: any;
};

// Données mockées pour contourner les problèmes d'authentification
const MOCK_ASSIGNMENT_TYPES: AssignmentType[] = [
    {
        id: 1,
        name: "Garde",
        code: "GARDE",
        description: "Présence sur place assurant la permanence des soins",
        icon: "Clock",
        color: "#EC4899",
        isActive: true,
        allowsMultiple: false,
        requiresLocation: true,
        properties: [
            {
                id: 101,
                name: "Type de garde",
                code: "type_garde",
                type: "select",
                required: true,
                options: ["Jour", "Nuit", "Weekend", "Férié"]
            },
            {
                id: 102,
                name: "Durée (heures)",
                code: "duree",
                type: "number",
                required: true
            }
        ],
        createdAt: new Date('2023-01-10'),
        updatedAt: new Date('2023-01-10')
    },
    {
        id: 2,
        name: "Astreinte",
        code: "ASTREINTE",
        description: "Disponibilité à distance avec possibilité d'intervention",
        icon: "Bell",
        color: "#3B82F6",
        isActive: true,
        allowsMultiple: false,
        requiresLocation: false,
        properties: [
            {
                id: 201,
                name: "Type d'astreinte",
                code: "type_astreinte",
                type: "select",
                required: true,
                options: ["Opérationnelle", "Sécurité", "Administrative"]
            }
        ],
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-03-20')
    },
    {
        id: 3,
        name: "Consultation",
        code: "CONSULTATION",
        description: "Rendez-vous programmé avec un patient",
        icon: "Calendar",
        color: "#10B981",
        isActive: true,
        allowsMultiple: true,
        requiresLocation: true,
        properties: [
            {
                id: 301,
                name: "Durée (minutes)",
                code: "duree_minutes",
                type: "number",
                required: true,
                defaultValue: 30
            },
            {
                id: 302,
                name: "Type de consultation",
                code: "type_consultation",
                type: "select",
                required: true,
                options: ["Première visite", "Suivi", "Pré-opératoire", "Post-opératoire"]
            }
        ],
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2023-01-20')
    }
];

const AssignmentsConfigPanel: React.FC = () => {
    const [assignmentTypes, setAssignmentTypes] = useState<AssignmentType[]>([]);
    const [currentAssignmentType, setCurrentAssignmentType] = useState<AssignmentType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [formData, setFormData] = useState<Partial<AssignmentType>>({
        name: '',
        code: '',
        description: '',
        icon: 'Calendar',
        color: '#3B82F6',
        isActive: true,
        allowsMultiple: false,
        requiresLocation: true,
        properties: []
    });

    // Fonction pour vérifier l'authentification et rafraîchir les données
    const checkAndRefreshAuth = useCallback(async () => {
        if (isAuthLoading) {
            console.log("Attente de la fin du chargement de l'authentification...");
            return; // Attendre que l'état d'authentification soit connu
        }

        if (!isAuthenticated) {
            console.log("Utilisateur non authentifié, redirection...");
            setError("Vous devez être connecté pour accéder à cette section.");
            setIsLoadingData(false);
            // Optionnel: rediriger vers la page de login
            // router.push('/login');
            return;
        }

        // Si authentifié, charger les données
        console.log("Utilisateur authentifié, chargement des données...");
        await fetchAssignmentTypes();

    }, [isAuthenticated, isAuthLoading]);

    useEffect(() => {
        checkAndRefreshAuth();
    }, [checkAndRefreshAuth]);

    // Fonction pour récupérer les types d'affectation
    const fetchAssignmentTypes = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            // Pas besoin d'appeler ensureAuthenticated ici, c'est géré dans checkAndRefreshAuth
            const response = await axios.get<{ assignmentTypes: AssignmentType[] }>('/api/assignment-types');
            setAssignmentTypes(response.data.assignmentTypes);
        } catch (err: any) {
            console.error("Erreur détaillée assignment-types:", err);
            setError(`Impossible de charger les types d'affectation: ${err.message}. Utilisation des données mockées.`);
            setAssignmentTypes(MOCK_ASSIGNMENT_TYPES); // Fallback aux données mockées
        } finally {
            setIsLoadingData(false);
        }
    };

    // Ouvrir le formulaire d'édition
    const openEditForm = (type: AssignmentType) => {
        setCurrentAssignmentType(type);
        setFormData({
            name: type.name,
            code: type.code,
            description: type.description,
            icon: type.icon,
            color: type.color,
            isActive: type.isActive,
            allowsMultiple: type.allowsMultiple,
            requiresLocation: type.requiresLocation,
            properties: [...type.properties]
        });
    };

    // Ouvrir le formulaire de création
    const openNewForm = () => {
        setCurrentAssignmentType(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            icon: 'Calendar',
            color: '#3B82F6',
            isActive: true,
            allowsMultiple: false,
            requiresLocation: true,
            properties: []
        });
    };

    // Gérer les changements de formulaire
    const handleFormChange = (field: keyof AssignmentType, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Soumission du formulaire (Ajout ou Modification)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (isAuthLoading) {
            toast.error("Vérification de l'authentification en cours...");
            return;
        }
        if (!isAuthenticated) {
            toast.error("Vous n'êtes pas authentifié.");
            return;
        }

        try {
            if (currentAssignmentType) {
                await axios.put(`/api/assignment-types/${currentAssignmentType.id}`, formData);
                toast.success('Type d\'affectation modifié avec succès');
            } else {
                await axios.post('/api/assignment-types', formData);
                toast.success('Type d\'affectation ajouté avec succès');
            }
            resetFormAndCloseModal();
            await fetchAssignmentTypes();
        } catch (err: any) {
            console.error("Erreur lors de la soumission:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue.';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);
        }
    };

    // Supprimer un type d'affectation
    const deleteAssignmentType = async (id: number) => {
        // Confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce type d\'affectation ?')) {
            return;
        }

        try {
            // Version avec mock au lieu d'appel API
            // Mise à jour du state local
            setAssignmentTypes(prev => prev.filter(type => type.id !== id));
            toast.success('Type d\'affectation supprimé');

            /* Version avec API réelle
            const response = await fetch(`/api/assignment-types/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            const result = await response.json();

            // Si le type a été désactivé au lieu d'être supprimé
            if (result.isActive === false && result.id) {
                setAssignmentTypes(prev => prev.map(type =>
                    type.id === id ? { ...type, isActive: false } : type
                ));
                toast.success(result.message || 'Type d\'affectation désactivé');
            } else {
                // Si le type a été supprimé
                setAssignmentTypes(prev => prev.filter(type => type.id !== id));
                toast.success('Type d\'affectation supprimé');
            }
            */
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
        }
    };

    // Ajouter une propriété
    const addProperty = () => {
        if (!formData.properties) {
            setFormData(prev => ({
                ...prev,
                properties: []
            }));
        }
        setFormData(prev => ({
            ...prev,
            properties: [...(prev.properties || []), {
                id: Date.now(),
                name: '',
                code: '',
                type: 'string',
                required: false
            }]
        }));
    };

    // Supprimer une propriété
    const removeProperty = (id: number) => {
        setFormData(prev => ({
            ...prev,
            properties: (prev.properties || []).filter(p => p.id !== id)
        }));
    };

    // Obtenir l'icône pour un type d'affectation
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Calendar': return <Calendar className="h-5 w-5" />;
            case 'Clock': return <Clock className="h-5 w-5" />;
            case 'Bell': return <Bell className="h-5 w-5" />;
            case 'Info': return <Info className="h-5 w-5" />;
            case 'User': return <User className="h-5 w-5" />;
            case 'Tag': return <Tag className="h-5 w-5" />;
            default: return <Calendar className="h-5 w-5" />;
        }
    };

    // Réinitialiser le formulaire et fermer la modale
    const resetFormAndCloseModal = () => {
        setCurrentAssignmentType(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            icon: 'Calendar',
            color: '#3B82F6',
            isActive: true,
            allowsMultiple: false,
            requiresLocation: true,
            properties: []
        });
        setIsModalOpen(false);
    };

    // Rendu conditionnel basé sur le chargement et l'erreur
    if (isAuthLoading || isLoadingData) {
        return <div>Chargement...</div>;
    }

    if (error && !assignmentTypes.length) { // Afficher l'erreur seulement si pas de données (même mockées)
        return <div className="text-red-500">Erreur: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestion des Types d'Affectations</h1>
                <button
                    onClick={openNewForm}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un type
                </button>
            </div>

            {assignmentTypes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Aucun type d'affectation configuré</p>
                    <p className="text-gray-500 text-sm mb-4">Commencez par créer un type d'affectation pour organiser le planning</p>
                    <button
                        onClick={openNewForm}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Créer mon premier type d'affectation
                    </button>
                </div>
            ) : (
                <>
                    {/* Liste des types d'affectations */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Options
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignmentTypes.map((type) => (
                                    <tr key={type.id} className={!type.isActive ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div
                                                    className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: type.color + '20' }}
                                                >
                                                    <div style={{ color: type.color }}>
                                                        {getIcon(type.icon)}
                                                    </div>
                                                </div>
                                                <div className="ml-3">
                                                    <div className={`text-sm font-medium ${type.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                                        {type.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{type.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">{type.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {type.isActive ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            <div className="flex space-x-2">
                                                {type.allowsMultiple && (
                                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                                        Multiple
                                                    </span>
                                                )}
                                                {type.requiresLocation && (
                                                    <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                                        Lieu requis
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditForm(type)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteAssignmentType(type.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Formulaire d'édition */}
            {(currentAssignmentType !== null || isModalOpen) && (
                <Dialog open={isModalOpen || currentAssignmentType !== null} onOpenChange={(isOpen) => {
                    if (!isOpen) resetFormAndCloseModal();
                    else if (!currentAssignmentType && !isModalOpen) setIsModalOpen(true);
                }}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {currentAssignmentType ? "Modifier le type d'affectation" : "Nouveau type d'affectation"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-4">
                                    {/* Informations de base */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFormChange('name', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md"
                                                placeholder="Ex: Garde"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Code
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                                                className="w-full px-3 py-2 border rounded-md uppercase"
                                                placeholder="Ex: GARDE"
                                                required
                                                disabled={!!currentAssignmentType}
                                            />
                                            {!!currentAssignmentType && (
                                                <p className="text-xs text-gray-500 mt-1">Le code ne peut pas être modifié après création</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleFormChange('description', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            rows={3}
                                            placeholder="Description détaillée de ce type d'affectation"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Icône
                                            </label>
                                            <select
                                                value={formData.icon}
                                                onChange={(e) => handleFormChange('icon', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md"
                                            >
                                                <option value="Calendar">Calendrier</option>
                                                <option value="Clock">Horloge</option>
                                                <option value="Bell">Cloche</option>
                                                <option value="Info">Information</option>
                                                <option value="User">Utilisateur</option>
                                                <option value="Tag">Étiquette</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Couleur
                                            </label>
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => handleFormChange('color', e.target.value)}
                                                className="w-full px-1 py-1 border rounded-md h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => handleFormChange('isActive', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                                Type actif
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="allowsMultiple"
                                                checked={formData.allowsMultiple}
                                                onChange={(e) => handleFormChange('allowsMultiple', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            <label htmlFor="allowsMultiple" className="ml-2 block text-sm text-gray-700">
                                                Permet plusieurs affectations simultanées
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="requiresLocation"
                                            checked={formData.requiresLocation}
                                            onChange={(e) => handleFormChange('requiresLocation', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 rounded"
                                        />
                                        <label htmlFor="requiresLocation" className="ml-2 block text-sm text-gray-700">
                                            Nécessite un lieu d'affectation
                                        </label>
                                    </div>

                                    {/* Propriétés */}
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-medium">Propriétés additionnelles</h3>
                                            <button
                                                onClick={addProperty}
                                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm flex items-center"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Ajouter
                                            </button>
                                        </div>

                                        {formData.properties && formData.properties.length > 0 ? (
                                            <div className="overflow-hidden border rounded-md">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Nom
                                                            </th>
                                                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Code
                                                            </th>
                                                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Type
                                                            </th>
                                                            <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Requis
                                                            </th>
                                                            <th scope="col" className="relative px-4 py-2">
                                                                <span className="sr-only">Actions</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {formData.properties.map((property) => (
                                                            <tr key={property.id}>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                    {property.name}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                    {property.code}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                    {property.type === 'string' && 'Texte'}
                                                                    {property.type === 'number' && 'Nombre'}
                                                                    {property.type === 'boolean' && 'Oui/Non'}
                                                                    {property.type === 'date' && 'Date'}
                                                                    {property.type === 'select' && 'Liste'}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                                    {property.required ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                                                    <button
                                                                        onClick={() => removeProperty(property.id)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 border rounded-md border-dashed text-gray-500">
                                                Aucune propriété additionnelle
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="px-6 py-4 border-t">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Annuler
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={isAuthLoading}>
                                    {isAuthLoading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
                                    ) : (
                                        <><Save className="h-4 w-4 mr-2" /> {currentAssignmentType ? "Enregistrer" : "Créer"}</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AssignmentsConfigPanel; 