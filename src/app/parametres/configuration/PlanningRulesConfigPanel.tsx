"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, Edit, AlertCircle, CheckCircle, Settings, Save, X,
    Info, ArrowRight, Loader2, MenuSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
type PlanningRule = {
    id: number;
    name: string;
    description: string;
    type: string;
    isActive: boolean;
    priority: number;
    configuration: any;
    createdBy: string;
    createdByUser?: {
        name: string;
        email: string;
    };
    createdAt: Date;
    updatedAt: Date;
};

type AssignmentType = {
    id: number;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
};

const PlanningRulesConfigPanel: React.FC = () => {
    // États
    const [activeTab, setActiveTab] = useState<string>('all');
    const [rules, setRules] = useState<PlanningRule[]>([]);
    const [assignmentTypes, setAssignmentTypes] = useState<AssignmentType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [editingRule, setEditingRule] = useState<PlanningRule | null>(null);

    // Formulaire pour l'édition ou la création
    const [formData, setFormData] = useState<Partial<PlanningRule>>({
        name: '',
        description: '',
        type: '',
        isActive: true,
        priority: 1,
        configuration: { rules: [] }
    });

    // Chargement initial des données
    useEffect(() => {
        Promise.all([
            fetchRules(),
            fetchAssignmentTypes()
        ]).finally(() => setIsLoading(false));
    }, []);

    // Récupérer les règles de planning depuis l'API
    const fetchRules = async () => {
        try {
            const response = await fetch('/api/planning-rules');

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des règles de planning');
            }

            const data = await response.json();

            // Conversion des dates
            const formattedData = data.map((rule: any) => ({
                ...rule,
                createdAt: new Date(rule.createdAt),
                updatedAt: new Date(rule.updatedAt),
                configuration: typeof rule.configuration === 'string'
                    ? JSON.parse(rule.configuration)
                    : rule.configuration
            }));

            setRules(formattedData);
            return formattedData;
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Impossible de charger les règles de planning');
            return [];
        }
    };

    // Récupérer les types d'affectations depuis l'API
    const fetchAssignmentTypes = async () => {
        try {
            const response = await fetch('/api/assignment-types?active=true');

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des types d\'affectations');
            }

            const data = await response.json();
            setAssignmentTypes(data);
            return data;
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Impossible de charger les types d\'affectations');
            return [];
        }
    };

    // Filtrer les règles selon l'onglet actif
    const filteredRules = activeTab === 'all'
        ? rules
        : rules.filter(rule => rule.type === activeTab);

    // Ouvrir le formulaire d'édition
    const openEditForm = (rule: PlanningRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description,
            type: rule.type,
            isActive: rule.isActive,
            priority: rule.priority,
            configuration: rule.configuration
        });
    };

    // Ouvrir le formulaire de création
    const openNewForm = (typeCode?: string) => {
        setEditingRule(null);
        setFormData({
            name: '',
            description: '',
            type: typeCode || '',
            isActive: true,
            priority: 1,
            configuration: { rules: [] }
        });
    };

    // Gérer les changements de formulaire
    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Ajouter ou mettre à jour une règle
    const saveRule = async () => {
        if (!formData.name || !formData.type) return;

        try {
            setIsSaving(true);

            const apiUrl = editingRule
                ? `/api/planning-rules/${editingRule.id}`
                : '/api/planning-rules';

            const method = editingRule ? 'PUT' : 'POST';

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

            const savedRule = await response.json();

            if (editingRule) {
                // Mise à jour dans le state local
                setRules(prev => prev.map(rule =>
                    rule.id === editingRule.id ?
                        {
                            ...savedRule,
                            createdAt: new Date(savedRule.createdAt),
                            updatedAt: new Date(savedRule.updatedAt),
                            configuration: typeof savedRule.configuration === 'string'
                                ? JSON.parse(savedRule.configuration)
                                : savedRule.configuration
                        } :
                        rule
                ));
                toast.success('Règle mise à jour');
            } else {
                // Ajout dans le state local
                setRules(prev => [
                    ...prev,
                    {
                        ...savedRule,
                        createdAt: new Date(savedRule.createdAt),
                        updatedAt: new Date(savedRule.updatedAt),
                        configuration: typeof savedRule.configuration === 'string'
                            ? JSON.parse(savedRule.configuration)
                            : savedRule.configuration
                    }
                ]);
                toast.success('Règle créée');
            }

            // Fermer le formulaire
            setEditingRule(null);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    // Supprimer une règle
    const deleteRule = async (id: number) => {
        // Confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/planning-rules/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            // Mise à jour du state local
            setRules(prev => prev.filter(rule => rule.id !== id));
            toast.success('Règle supprimée');
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
        }
    };

    // Obtenir les détails d'un type d'affectation
    const getAssignmentType = (code: string) => {
        return assignmentTypes.find(type => type.code === code);
    };

    // Rendu de l'interface
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Règles de Planning</h1>
                <button
                    onClick={() => openNewForm()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une règle
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement des règles de planning...</span>
                </div>
            ) : (
                <>
                    {/* Onglets de filtrage */}
                    <div className="flex border-b">
                        <button
                            className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Toutes les règles
                        </button>
                        {assignmentTypes.map(type => (
                            <button
                                key={type.code}
                                className={`px-4 py-2 ${activeTab === type.code ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                                onClick={() => setActiveTab(type.code)}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>

                    {filteredRules.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <MenuSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-2">Aucune règle définie pour cette catégorie</p>
                            <button
                                onClick={() => openNewForm(activeTab !== 'all' ? activeTab : undefined)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
                            >
                                {activeTab !== 'all'
                                    ? `Créer une règle pour ${getAssignmentType(activeTab)?.name || activeTab}`
                                    : 'Créer une nouvelle règle'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {filteredRules.map(rule => (
                                <div key={rule.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-block w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            <h2 className="font-medium text-gray-800">{rule.name}</h2>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => openEditForm(rule)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="text-red-600 hover:text-red-900 p-1 ml-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Settings className="h-4 w-4 mr-1" />
                                            <span>Type: {getAssignmentType(rule.type)?.name || rule.type}</span>
                                            <span className="mx-2">•</span>
                                            <span>Priorité: {rule.priority}</span>
                                        </div>
                                        {rule.description && (
                                            <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                                        )}
                                        <div className="mt-2 text-xs text-gray-500">
                                            Créée par {rule.createdByUser?.name || 'un utilisateur'} • Mise à jour {new Date(rule.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Formulaire d'édition */}
                    {(editingRule !== null || formData.name !== '') && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
                                <div className="px-6 py-4 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold">
                                        {editingRule ? "Modifier la règle" : "Nouvelle règle"}
                                    </h2>
                                    <button
                                        onClick={() => setEditingRule(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={isSaving}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom de la règle
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFormChange('name', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md"
                                                placeholder="Ex: Limite de gardes par mois"
                                                disabled={isSaving}
                                            />
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
                                                placeholder="Description détaillée de cette règle"
                                                disabled={isSaving}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Type d'affectation
                                                </label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    disabled={isSaving || (editingRule !== null)}
                                                >
                                                    <option value="">-- Sélectionner --</option>
                                                    {assignmentTypes.map(type => (
                                                        <option key={type.code} value={type.code}>
                                                            {type.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {editingRule && (
                                                    <p className="text-xs text-gray-500 mt-1">Le type ne peut pas être modifié après création</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Priorité
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={formData.priority}
                                                    onChange={(e) => handleFormChange('priority', parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    disabled={isSaving}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Les règles de priorité plus élevée sont appliquées en premier</p>
                                            </div>
                                        </div>

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
                                                Règle active
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Configuration JSON
                                            </label>
                                            <div className="relative">
                                                <div className="absolute top-0 right-0 p-2 text-xs text-gray-500">
                                                    Structure JSON
                                                </div>
                                                <textarea
                                                    value={JSON.stringify(formData.configuration, null, 2)}
                                                    onChange={(e) => {
                                                        try {
                                                            const config = JSON.parse(e.target.value);
                                                            handleFormChange('configuration', config);
                                                        } catch (error) {
                                                            // Ne rien faire si le JSON est invalide
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                                                    rows={8}
                                                    disabled={isSaving}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Configuration de la règle au format JSON. Consultez la documentation pour les formats disponibles.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                                    <button
                                        onClick={() => setEditingRule(null)}
                                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={saveRule}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                        disabled={!formData.name || !formData.type || isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {editingRule ? "Enregistrer" : "Créer"}
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

export default PlanningRulesConfigPanel; 