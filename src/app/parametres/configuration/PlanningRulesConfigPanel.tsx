"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import {
    Plus, Trash2, Edit, AlertCircle, CheckCircle, Settings, Save, X,
    Info, ArrowRight, Loader2, MenuSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

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

// Données mockées pour contourner les problèmes d'authentification
const MOCK_ASSIGNMENT_TYPES: AssignmentType[] = [
    { id: 1, code: 'GARDE', name: 'Garde', isActive: true },
    { id: 2, code: 'ASTREINTE', name: 'Astreinte', isActive: true },
    { id: 3, code: 'CONSULTATION', name: 'Consultation', isActive: true },
    { id: 4, code: 'BLOC', name: 'Bloc opératoire', isActive: true }
];

const MOCK_PLANNING_RULES: PlanningRule[] = [
    {
        id: 1,
        name: "Limite de gardes mensuelle",
        description: "Maximum 5 gardes par mois",
        type: 'GARDE',
        isActive: true,
        priority: 2,
        configuration: {
            maxLimit: 5,
            periodType: 'MONTH',
            applyToAllUsers: true
        },
        createdBy: "system",
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-15')
    },
    {
        id: 2,
        name: "Repos obligatoire après garde",
        description: "Minimum 24h de repos après une garde de nuit",
        type: 'GARDE',
        isActive: true,
        priority: 3,
        configuration: {
            minRestHours: 24,
            enforceStrictly: true
        },
        createdBy: "system",
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date('2023-03-15')
    },
    {
        id: 3,
        name: "Équilibre des weekends",
        description: "Maximum 1 weekend par mois",
        type: 'ASTREINTE',
        isActive: false,
        priority: 1,
        configuration: {
            maxWeekends: 1,
            periodType: 'MONTH',
            balancedDistribution: true
        },
        createdBy: "system",
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2023-01-20')
    }
];

const PlanningRulesConfigPanel: React.FC = () => {
    // États
    const [activeTab, setActiveTab] = useState<string>('all');
    const [rules, setRules] = useState<PlanningRule[]>([]);
    const [assignmentTypes, setAssignmentTypes] = useState<AssignmentType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [editingRule, setEditingRule] = useState<PlanningRule | null>(null);
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Formulaire pour l'édition ou la création
    const [formData, setFormData] = useState<Partial<PlanningRule>>({
        name: '',
        description: '',
        type: '',
        isActive: true,
        priority: 1,
        configuration: { rules: [] }
    });

    // Fonction pour vérifier l'authentification et rafraîchir les données
    const checkAndRefreshAuth = useCallback(async () => {
        if (isAuthLoading) {
            logger.info("Attente auth...");
            return;
        }
        if (!isAuthenticated) {
            logger.info("Non authentifié.");
            setError("Authentification requise.");
            setIsLoadingData(false);
            // Optionnel: fallback ou redirection
            setRules(MOCK_PLANNING_RULES);
            setAssignmentTypes(MOCK_ASSIGNMENT_TYPES);
            return;
        }
        // Charger les données si authentifié
        logger.info("Authentifié, chargement des données...");
        await Promise.all([fetchRules(), fetchAssignmentTypes()]);

    }, [isAuthenticated, isAuthLoading]);

    useEffect(() => {
        checkAndRefreshAuth();
    }, [checkAndRefreshAuth]);

    // Récupérer les règles de planning depuis l'API
    const fetchRules = async () => {
        setError(null);
        setIsLoadingData(true);
        try {
            const response = await axios.get<{ rules: PlanningRule[] }>('/api/planning-rules');
            setRules(response.data.rules);
        } catch (err: any) {
            logger.error("Erreur détaillée rules:", err);
            setError(`Impossible de charger les règles: ${err.message}. Utilisation des données mockées.`);
            setRules(MOCK_PLANNING_RULES);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Récupérer les types d'affectations depuis l'API
    const fetchAssignmentTypes = async () => {
        try {
            const response = await axios.get<{ assignmentTypes: AssignmentType[] }>('/api/attribution-types');
            setAssignmentTypes(response.data.assignmentTypes);
        } catch (err: any) {
            logger.error("Erreur détaillée attribution-types:", err);
            setError(prevError => prevError ? `${prevError}\nImpossible de charger les types d'affectation: ${err.message}.` : `Impossible de charger les types d'affectation: ${err.message}.`);
            setAssignmentTypes(MOCK_ASSIGNMENT_TYPES);
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
        if (isAuthLoading || !isAuthenticated) {
            toast.error("Vérification de l'authentification en cours ou échouée.");
            return;
        }
        if (!formData.name || !formData.type) return;

        try {
            setIsSaving(true);

            // Version avec mock au lieu d'appel API
            setTimeout(() => {
                // Simuler un délai pour l'API
                if (editingRule) {
                    // Mise à jour dans le state local
                    const updatedRule = {
                        ...editingRule,
                        ...formData,
                        updatedAt: new Date()
                    } as PlanningRule;

                    setRules(prev => prev.map(rule =>
                        rule.id === editingRule.id ? updatedRule : rule
                    ));
                    toast.success('Règle mise à jour');
                } else {
                    // Ajout dans le state local avec un ID généré
                    const newRule = {
                        ...formData,
                        id: Math.max(0, ...rules.map(r => r.id)) + 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: "current_user"
                    } as PlanningRule;

                    setRules(prev => [...prev, newRule]);
                    toast.success('Règle créée');
                }

                // Fermer le formulaire
                setEditingRule(null);
                setIsSaving(false);
            }, 800);

            /*
            // Partie commentée: Appel API réel
            const apiUrl = editingRule
                ? `/api/planning-rules/${editingRule.id}`
                : '/api/planning-rules';

            const method = editingRule ? 'PUT' : 'POST';

            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                credentials: 'include',
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
            */
        } catch (error) {
            logger.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
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
            // Version avec mock au lieu d'appel API
            // Mise à jour du state local
            setRules(prev => prev.filter(rule => rule.id !== id));
            toast.success('Règle supprimée');

            /*
            // Version avec API réelle
            const response = await fetch(`http://localhost:3000/api/planning-rules/${id}`, {
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

            // Mise à jour du state local
            setRules(prev => prev.filter(rule => rule.id !== id));
            toast.success('Règle supprimée');
            */
        } catch (error) {
            logger.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
        }
    };

    // Obtenir les détails d'un type d'affectation
    const getAssignmentType = (code: string) => {
        return assignmentTypes.find(type => type.code === code);
    };

    // Rendu de l'interface
    if (isAuthLoading || isLoadingData) {
        return <div>Chargement...</div>; // Rendu pendant le chargement
    }

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

            {error && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 mb-2">{error}</p>
                </div>
            )}

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
        </div>
    );
};

export default PlanningRulesConfigPanel; 