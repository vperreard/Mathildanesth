"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, Edit, Calendar, MapPin, Tag, User, Save, X,
    Clock, Info, ArrowRight, CheckCircle2, XCircle, Bell, AlertTriangle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const AssignmentsConfigPanel: React.FC = () => {
    // États
    const [assignmentTypes, setAssignmentTypes] = useState<AssignmentType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [editingType, setEditingType] = useState<AssignmentType | null>(null);
    const [showPropertyForm, setShowPropertyForm] = useState<boolean>(false);
    const [newProperty, setNewProperty] = useState<Partial<Property>>({
        name: '',
        code: '',
        type: 'string',
        required: false
    });

    // Formulaire pour l'édition ou la création
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

    // Chargement initial des données
    useEffect(() => {
        fetchAssignmentTypes();
    }, []);

    // Récupérer les types d'affectations depuis l'API
    const fetchAssignmentTypes = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/assignment-types');

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des types d\'affectations');
            }

            const data = await response.json();

            // Conversion des dates
            const formattedData = data.map((type: any) => ({
                ...type,
                createdAt: new Date(type.createdAt),
                updatedAt: new Date(type.updatedAt),
                properties: Array.isArray(type.properties) ? type.properties : JSON.parse(type.properties || '[]')
            }));

            setAssignmentTypes(formattedData);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Impossible de charger les types d\'affectations');
        } finally {
            setIsLoading(false);
        }
    };

    // Ouvrir le formulaire d'édition
    const openEditForm = (type: AssignmentType) => {
        setEditingType(type);
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
        setEditingType(null);
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
    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Ajouter ou mettre à jour un type d'affectation
    const saveAssignmentType = async () => {
        if (!formData.name || !formData.code) return;

        try {
            setIsSaving(true);

            const apiUrl = editingType
                ? `/api/assignment-types/${editingType.id}`
                : '/api/assignment-types';

            const method = editingType ? 'PUT' : 'POST';

            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
            }

            const savedType = await response.json();

            if (editingType) {
                // Mise à jour dans le state local
                setAssignmentTypes(prev => prev.map(type =>
                    type.id === editingType.id ?
                        {
                            ...savedType,
                            createdAt: new Date(savedType.createdAt),
                            updatedAt: new Date(savedType.updatedAt),
                            properties: Array.isArray(savedType.properties)
                                ? savedType.properties
                                : JSON.parse(savedType.properties || '[]')
                        } :
                        type
                ));
                toast.success('Type d\'affectation mis à jour');
            } else {
                // Ajout dans le state local
                setAssignmentTypes(prev => [
                    ...prev,
                    {
                        ...savedType,
                        createdAt: new Date(savedType.createdAt),
                        updatedAt: new Date(savedType.updatedAt),
                        properties: Array.isArray(savedType.properties)
                            ? savedType.properties
                            : JSON.parse(savedType.properties || '[]')
                    }
                ]);
                toast.success('Type d\'affectation créé');
            }

            // Fermer le formulaire
            setEditingType(null);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    // Supprimer un type d'affectation
    const deleteAssignmentType = async (id: number) => {
        // Confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce type d\'affectation ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/assignment-types/${id}`, {
                method: 'DELETE',
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
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
        }
    };

    // Ajouter une propriété
    const addProperty = () => {
        if (!newProperty.name || !newProperty.code) return;

        const property: Property = {
            id: Date.now(),
            name: newProperty.name,
            code: newProperty.code,
            type: newProperty.type || 'string',
            required: newProperty.required || false,
            options: newProperty.type === 'select' ? newProperty.options || [] : undefined,
            defaultValue: newProperty.defaultValue
        };

        setFormData(prev => ({
            ...prev,
            properties: [...(prev.properties || []), property]
        }));

        setNewProperty({
            name: '',
            code: '',
            type: 'string',
            required: false
        });

        setShowPropertyForm(false);
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

    // Rendu du composant
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

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement des types d'affectations...</span>
                </div>
            ) : (
                <>
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
                    {(editingType !== null || formData.name !== '') && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
                                <div className="px-6 py-4 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold">
                                        {editingType ? "Modifier le type d'affectation" : "Nouveau type d'affectation"}
                                    </h2>
                                    <button
                                        onClick={() => setEditingType(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={isSaving}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

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
                                                    disabled={isSaving}
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
                                                    disabled={isSaving || (editingType !== null)}
                                                />
                                                {editingType && (
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
                                                disabled={isSaving}
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
                                                    disabled={isSaving}
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
                                                    disabled={isSaving}
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
                                                    disabled={isSaving}
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
                                                    disabled={isSaving}
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
                                                disabled={isSaving}
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
                                                    onClick={() => setShowPropertyForm(true)}
                                                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm flex items-center"
                                                    disabled={isSaving}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Ajouter
                                                </button>
                                            </div>

                                            {showPropertyForm && (
                                                <div className="p-4 border rounded-md bg-gray-50 mb-4">
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Nom
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newProperty.name}
                                                                onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                                placeholder="Ex: Type de garde"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Code
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newProperty.code}
                                                                onChange={(e) => setNewProperty({ ...newProperty, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                                placeholder="Ex: guard_type"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Type
                                                            </label>
                                                            <select
                                                                value={newProperty.type}
                                                                onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
                                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                            >
                                                                <option value="string">Texte</option>
                                                                <option value="number">Nombre</option>
                                                                <option value="boolean">Oui/Non</option>
                                                                <option value="date">Date</option>
                                                                <option value="select">Liste déroulante</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="propertyRequired"
                                                                checked={newProperty.required}
                                                                onChange={(e) => setNewProperty({ ...newProperty, required: e.target.checked })}
                                                                className="h-4 w-4 text-indigo-600 rounded"
                                                            />
                                                            <label htmlFor="propertyRequired" className="ml-2 block text-sm text-gray-700">
                                                                Champ obligatoire
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {newProperty.type === 'select' && (
                                                        <div className="mb-3">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Options (séparées par des virgules)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newProperty.options?.join(', ') || ''}
                                                                onChange={(e) => setNewProperty({ ...newProperty, options: e.target.value.split(',').map(o => o.trim()) })}
                                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                                placeholder="Ex: Nuit, Weekend, Jour férié"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex justify-end space-x-2 mt-3">
                                                        <button
                                                            onClick={() => setShowPropertyForm(false)}
                                                            className="px-3 py-1 border text-gray-700 rounded-md hover:bg-gray-100 text-sm"
                                                        >
                                                            Annuler
                                                        </button>
                                                        <button
                                                            onClick={addProperty}
                                                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                                                            disabled={!newProperty.name || !newProperty.code}
                                                        >
                                                            Ajouter la propriété
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

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
                                                                            disabled={isSaving}
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

                                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                                    <button
                                        onClick={() => setEditingType(null)}
                                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={saveAssignmentType}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                        disabled={!formData.name || !formData.code || isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {editingType ? "Enregistrer" : "Créer"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AssignmentsConfigPanel; 