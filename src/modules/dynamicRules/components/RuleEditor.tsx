/*
 * et des problèmes de typage complexes qui sont apparus lors de modifications.
 * Une révision complète de la structure JSX et des types est recommandée.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Rule,
    RuleCondition,
    RuleAction,
    ComparisonOperator,
    LogicalOperator,
    ActionType,
    RuleType,
    RulePriority,
    ConditionOperator
} from '../types/rule';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';

interface RuleEditorProps {
    rule?: Rule;
    onSave: (rule: Rule) => void;
    onCancel: () => void;
}

/**
 * Composant d'édition des règles
 * Permet de créer/modifier une règle avec ses conditions et actions
 */
const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
    const [editedRule, setEditedRule] = useState<Rule>(
        rule || {
            id: uuidv4(),
            name: '',
            description: '',
            type: RuleType.CUSTOM,
            priority: RulePriority.MEDIUM,
            enabled: true,
            conditions: [],
            conditionLogic: 'AND',
            actions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: []
        }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Fonction pour gérer les changements dans les inputs
    const handleInputChange = (field: keyof Rule, value: any) => {
        setEditedRule(prev => ({
            ...prev,
            [field]: value
        }));
        setIsDirty(true);
    };

    // Fonctions pour les conditions
    const handleAddCondition = () => {
        setEditedRule(prev => ({
            ...prev,
            conditions: [...prev.conditions, { id: uuidv4(), field: '', operator: ConditionOperator.EQUALS, value: '' }]
        }));
        setIsDirty(true);
    };

    const handleConditionChange = (id: string, field: keyof RuleCondition, value: any) => {
        setEditedRule(prev => ({
            ...prev,
            conditions: prev.conditions.map(cond => (cond.id === id ? { ...cond, [field]: value } : cond))
        }));
        setIsDirty(true);
    };

    const handleRemoveCondition = (id: string) => {
        setEditedRule(prev => ({
            ...prev,
            conditions: prev.conditions.filter(cond => cond.id !== id)
        }));
        setIsDirty(true);
    };

    // Fonctions pour les actions
    const handleAddAction = () => {
        setEditedRule(prev => ({
            ...prev,
            actions: [...prev.actions, { id: uuidv4(), type: ActionType.NOTIFY, parameters: {} }]
        }));
        setIsDirty(true);
    };

    const handleActionChange = (id: string, field: keyof RuleAction, value: any) => {
        setEditedRule(prev => ({
            ...prev,
            actions: prev.actions.map(action => (action.id === id ? { ...action, [field]: value } : action))
        }));
        setIsDirty(true);
    };

    const handleRemoveAction = (id: string) => {
        setEditedRule(prev => ({
            ...prev,
            actions: prev.actions.filter(action => action.id !== id)
        }));
        setIsDirty(true);
    };

    // Gérer le changement des paramètres d'action
    const handleActionParameterChange = (actionId: string, paramKey: string, paramValue: any) => {
        setEditedRule(prev => ({
            ...prev,
            actions: prev.actions.map(a => {
                if (a.id === actionId) {
                    return {
                        ...a,
                        parameters: {
                            ...a.parameters,
                            [paramKey]: paramValue
                        }
                    };
                }
                return a;
            })
        }));
        setIsDirty(true);
    };

    // Validation du formulaire
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Vérifier les champs obligatoires
        if (!editedRule.name.trim()) {
            newErrors.name = 'Le nom de la règle est obligatoire';
        }

        if (editedRule.conditions.length === 0) {
            newErrors.conditions = 'Au moins une condition est requise';
        } else {
            // Vérifier que chaque condition est valide
            editedRule.conditions.forEach((condition, index) => {
                if (!condition.field) {
                    newErrors[`condition_${index}_field`] = 'Le champ est obligatoire';
                }
            });
        }

        if (editedRule.actions.length === 0) {
            newErrors.actions = 'Au moins une action est requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            // Ajouter les métadonnées avant de sauvegarder
            const finalRule: Rule = {
                ...editedRule,
                metadata: {
                    ...(editedRule.metadata || {}),
                    createdBy: editedRule.metadata?.createdBy || 'system', // Valeur par défaut pour createdBy
                    createdAt: editedRule.metadata?.createdAt || new Date(), // Valeur par défaut pour createdAt
                    updatedAt: new Date(),
                    version: (editedRule.metadata?.version || 0) + 1
                }
            };

            onSave(finalRule);
        }
    };

    // Rendu du formulaire
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{rule ? 'Modifier la règle' : 'Nouvelle règle'}</h2>

            <form onSubmit={handleSubmit}>
                {/* Informations générales */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom *
                            </label>
                            <input
                                type="text"
                                value={editedRule.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={editedRule.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                {Object.values(RuleType).map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priorité
                            </label>
                            <input
                                type="number"
                                value={editedRule.priority}
                                onChange={(e) => handleInputChange('priority', parseInt(e.target.value, 10))}
                                min="0"
                                max="100"
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Statut
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editedRule.enabled}
                                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                    className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2">Activée</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={editedRule.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Section Conditions */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Conditions</h3>
                        <button
                            type="button"
                            onClick={handleAddCondition}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                            Ajouter une condition
                        </button>
                    </div>

                    {errors.conditions && (
                        <p className="mt-1 mb-2 text-sm text-red-600">{errors.conditions}</p>
                    )}

                    {editedRule.conditions.length === 0 ? (
                        <p className="text-gray-500 italic">Aucune condition définie</p>
                    ) : (
                        <div className="space-y-4">
                            {editedRule.conditions.map((condition, index) => (
                                <div key={condition.id} className="p-3 border border-gray-300 rounded-md bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium">Condition {index + 1}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCondition(condition.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Supprimer
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Champ
                                            </label>
                                            <input
                                                type="text"
                                                value={condition.field}
                                                onChange={(e) => handleConditionChange(condition.id, 'field', e.target.value)}
                                                placeholder="ex: user.role"
                                                className={`w-full p-2 border rounded-md ${errors[`condition_${index}_field`] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {errors[`condition_${index}_field`] && (
                                                <p className="mt-1 text-sm text-red-600">{errors[`condition_${index}_field`]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opérateur
                                            </label>
                                            <select
                                                value={condition.operator}
                                                onChange={(e) => handleConditionChange(
                                                    condition.id,
                                                    'operator',
                                                    e.target.value as ComparisonOperator
                                                )}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            >
                                                {Object.values(ComparisonOperator).map((op) => (
                                                    <option key={op} value={op}>
                                                        {op}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valeur
                                            </label>
                                            <input
                                                type="text"
                                                value={typeof condition.value === 'string' ? condition.value : JSON.stringify(condition.value)}
                                                onChange={(e) => {
                                                    // Tenter de parser JSON si possible
                                                    let value;
                                                    try {
                                                        value = JSON.parse(e.target.value);
                                                    } catch {
                                                        value = e.target.value;
                                                    }
                                                    handleConditionChange(condition.id, 'value', value);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={!!condition.isNegated}
                                                onChange={(e) => handleConditionChange(condition.id, 'isNegated', e.target.checked)}
                                                className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm">Inverser la condition</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Actions */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Actions</h3>
                        <button
                            type="button"
                            onClick={handleAddAction}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                            Ajouter une action
                        </button>
                    </div>

                    {errors.actions && (
                        <p className="mt-1 mb-2 text-sm text-red-600">{errors.actions}</p>
                    )}

                    {editedRule.actions.length === 0 ? (
                        <p className="text-gray-500 italic">Aucune action définie</p>
                    ) : (
                        <div className="space-y-4">
                            {editedRule.actions.map((action, index) => (
                                <div key={action.id} className="p-3 border border-gray-300 rounded-md bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium">Action {index + 1}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAction(action.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Supprimer
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Type d'action
                                            </label>
                                            <select
                                                value={action.type}
                                                onChange={(e) => handleActionChange(
                                                    action.id,
                                                    'type',
                                                    e.target.value as ActionType
                                                )}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            >
                                                {Object.values(ActionType).map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {(action.type === ActionType.MODIFY ||
                                            action.type === ActionType.CALCULATE) && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Champ cible
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={action.target || ''}
                                                        onChange={(e) => handleActionChange(action.id, 'target', e.target.value)}
                                                        placeholder="ex: user.status"
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            )}
                                    </div>

                                    {/* Paramètres spécifiques selon le type d'action */}
                                    {action.type === ActionType.NOTIFY && (
                                        <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Paramètres de notification</h5>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Message
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={action.parameters?.message || ''}
                                                        onChange={(e) => handleActionParameterChange(action.id, 'message', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Niveau
                                                    </label>
                                                    <select
                                                        value={action.parameters?.level || 'info'}
                                                        onChange={(e) => handleActionParameterChange(action.id, 'level', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    >
                                                        <option value="info">Information</option>
                                                        <option value="warning">Avertissement</option>
                                                        <option value="error">Erreur</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {action.type === ActionType.MODIFY && (
                                        <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Paramètres de modification</h5>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Nouvelle valeur
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        action.parameters?.value !== undefined
                                                            ? (typeof action.parameters.value === 'string'
                                                                ? action.parameters.value
                                                                : JSON.stringify(action.parameters.value))
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        // Tenter de parser JSON si possible
                                                        let value;
                                                        try {
                                                            value = JSON.parse(e.target.value);
                                                        } catch {
                                                            value = e.target.value;
                                                        }
                                                        handleActionParameterChange(action.id, 'value', value);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {action.type === ActionType.CALCULATE && (
                                        <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Paramètres de calcul</h5>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Formule
                                                </label>
                                                <input
                                                    type="text"
                                                    value={action.parameters?.formula || ''}
                                                    onChange={(e) => handleActionParameterChange(action.id, 'formula', e.target.value)}
                                                    placeholder="ex: ${user.age} * 2"
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Utilisez ${"${champ}"} pour faire référence à des valeurs du contexte
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {action.type === ActionType.TRIGGER && (
                                        <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Paramètres d'événement</h5>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Type d'événement
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={action.parameters?.eventType || ''}
                                                        onChange={(e) => handleActionParameterChange(action.id, 'eventType', e.target.value)}
                                                        placeholder="ex: rule.action.executed"
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Inclure le contexte
                                                    </label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!action.parameters?.includeContext}
                                                            onChange={(e) => handleActionParameterChange(action.id, 'includeContext', e.target.checked)}
                                                            className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="ml-2 text-xs">Inclure le contexte dans l'événement</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        disabled={!isDirty}
                    >
                        {rule ? 'Mettre à jour' : 'Créer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RuleEditor; 