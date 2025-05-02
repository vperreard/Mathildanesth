import React, { useState, useEffect } from 'react';
import {
    AnyRule,
    RuleType,
    RulePriority
} from '../types/rule';
import {
    getRuleTypeLabel,
    getRulePriorityLabel
} from '../services/ruleService';
import { formatDate, parseDate, isDateBefore, ISO_DATE_FORMAT } from '@/utils/dateUtils';

// Importation des formulaires spécifiques par type
import { DutyRuleForm } from './rule-forms/DutyRuleForm';
import { ConsultationRuleForm } from './rule-forms/ConsultationRuleForm';
import { PlanningRuleForm } from './rule-forms/PlanningRuleForm';
import { SupervisionRuleForm } from './rule-forms/SupervisionRuleForm';
import { LocationRuleForm } from './rule-forms/LocationRuleForm';

interface RuleFormProps {
    rule: Partial<AnyRule>;
    onSave: (rule: Partial<AnyRule>) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    conflicts?: {
        hasConflicts: boolean;
        conflicts: {
            ruleId: string;
            ruleName: string;
            conflictDescription: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH';
        }[];
    } | null;
}

export const RuleForm: React.FC<RuleFormProps> = ({
    rule,
    onSave,
    onCancel,
    loading,
    conflicts
}) => {
    // État pour stocker la règle en cours d'édition
    const [currentRule, setCurrentRule] = useState<Partial<AnyRule>>(rule);

    // État pour les erreurs de validation
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Mettre à jour la règle locale lorsque la règle passée en prop change
    useEffect(() => {
        // Convertir les dates string en objets Date lors de l'initialisation si nécessaire
        const initialRule = { ...rule };
        if (rule.validFrom && typeof rule.validFrom === 'string') {
            initialRule.validFrom = parseDate(rule.validFrom);
        }
        if (rule.validTo && typeof rule.validTo === 'string') {
            initialRule.validTo = parseDate(rule.validTo);
        }
        setCurrentRule(initialRule);
    }, [rule]);

    // Gérer les changements des champs de base
    const handleBaseFieldChange = (
        field: keyof AnyRule,
        // La valeur peut être null pour les dates optionnelles
        value: string | RulePriority | Date | boolean | null
    ) => {
        setCurrentRule((prev) => ({ ...prev, [field]: value }));
    };

    // Gérer les changements spécifiques au type de règle
    const handleSpecificFieldChange = (updatedRule: Partial<AnyRule>) => {
        setCurrentRule(updatedRule);
    };

    // Valider le formulaire
    const validateForm = (): boolean => {
        const errors: string[] = [];

        // Valider les champs de base
        if (!currentRule.name?.trim()) {
            errors.push('Le nom de la règle est requis');
        }

        if (!currentRule.validFrom) {
            errors.push('La date de début de validité est requise');
        } else if (!parseDate(currentRule.validFrom)) { // Vérifier aussi que la date est valide
            errors.push('La date de début de validité est invalide');
        }

        // Utiliser isDateBefore de dateUtils
        const validFromDate = parseDate(currentRule.validFrom);
        const validToDate = parseDate(currentRule.validTo);

        if (validToDate && !validFromDate) {
            // Si validTo est défini mais validFrom est invalide (cas déjà couvert ci-dessus, mais double check)
            errors.push('La date de début de validité est requise pour définir une date de fin');
        } else if (validToDate && validFromDate && isDateBefore(validToDate, validFromDate)) {
            errors.push('La date de fin doit être postérieure ou égale à la date de début');
        }

        // Valider les champs spécifiques au type (à compléter selon le type)
        // ...

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // Soumettre le formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Si le formulaire est valide, appeler onSave
        await onSave(currentRule);
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
                {rule.id ? 'Modifier une règle' : 'Créer une nouvelle règle'}
            </h2>

            {/* Afficher les erreurs de validation */}
            {validationErrors.length > 0 && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Veuillez corriger les erreurs suivantes:
                            </h3>
                            <ul className="mt-1 list-disc list-inside text-sm text-red-600">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Afficher les conflits détectés */}
            {conflicts && conflicts.hasConflicts && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Conflits détectés:
                            </h3>
                            <ul className="mt-1 list-disc list-inside text-sm text-yellow-600">
                                {conflicts.conflicts.map((conflict, index) => (
                                    <li key={index}>
                                        {conflict.conflictDescription}
                                        {conflict.ruleName && ` (conflit avec: ${conflict.ruleName})`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Champs communs à tous les types de règles */}
                <div className="space-y-6">
                    {/* Type de règle (en lecture seule si on modifie une règle existante) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de règle
                        </label>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                            {getRuleTypeLabel(currentRule.type as RuleType)}
                        </div>
                    </div>

                    {/* Nom de la règle */}
                    <div>
                        <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom *
                        </label>
                        <input
                            id="rule-name"
                            type="text"
                            value={currentRule.name || ''}
                            onChange={(e) => handleBaseFieldChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="rule-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="rule-description"
                            value={currentRule.description || ''}
                            onChange={(e) => handleBaseFieldChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Priorité */}
                    <div>
                        <label htmlFor="rule-priority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priorité *
                        </label>
                        <select
                            id="rule-priority"
                            value={currentRule.priority || ''}
                            onChange={(e) => handleBaseFieldChange('priority', e.target.value as RulePriority)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Sélectionner la priorité</option>
                            {Object.values(RulePriority).map(priority => (
                                <option key={priority} value={priority}>
                                    {getRulePriorityLabel(priority)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Période de validité */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="valid-from" className="block text-sm font-medium text-gray-700 mb-1">
                                Valide à partir du *
                            </label>
                            <input
                                id="valid-from"
                                type="date"
                                value={formatDate(currentRule.validFrom, ISO_DATE_FORMAT)}
                                onChange={(e) => handleBaseFieldChange('validFrom', parseDate(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="valid-to" className="block text-sm font-medium text-gray-700 mb-1">
                                Jusqu'au (optionnel)
                            </label>
                            <input
                                id="valid-to"
                                type="date"
                                value={formatDate(currentRule.validTo, ISO_DATE_FORMAT)}
                                onChange={(e) => handleBaseFieldChange(
                                    'validTo',
                                    e.target.value ? parseDate(e.target.value) : null
                                )}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                min={formatDate(currentRule.validFrom, ISO_DATE_FORMAT)}
                            />
                        </div>
                    </div>

                    {/* Statut */}
                    <div>
                        <div className="flex items-center">
                            <input
                                id="is-active"
                                type="checkbox"
                                checked={currentRule.isActive || false}
                                onChange={(e) => handleBaseFieldChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is-active" className="ml-2 block text-sm text-gray-700">
                                Règle active
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Les règles inactives sont enregistrées mais ne sont pas appliquées aux plannings
                        </p>
                    </div>
                </div>

                {/* Formulaire spécifique au type de règle */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Configuration spécifique
                    </h3>

                    {/* Charger le formulaire approprié selon le type de règle */}
                    {currentRule.type === RuleType.DUTY && (
                        <DutyRuleForm
                            rule={currentRule}
                            onChange={handleSpecificFieldChange}
                        />
                    )}

                    {currentRule.type === RuleType.CONSULTATION && (
                        <ConsultationRuleForm
                            rule={currentRule}
                            onChange={handleSpecificFieldChange}
                        />
                    )}

                    {currentRule.type === RuleType.PLANNING && (
                        <PlanningRuleForm
                            rule={currentRule}
                            onChange={handleSpecificFieldChange}
                        />
                    )}

                    {currentRule.type === RuleType.SUPERVISION && (
                        <SupervisionRuleForm
                            rule={currentRule}
                            onChange={handleSpecificFieldChange}
                        />
                    )}

                    {currentRule.type === RuleType.LOCATION && (
                        <LocationRuleForm
                            rule={currentRule}
                            onChange={handleSpecificFieldChange}
                        />
                    )}
                </div>

                {/* Boutons d'action */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Enregistrement...' : (rule.id ? 'Mettre à jour' : 'Créer')}
                    </button>
                </div>
            </form>
        </div>
    );
}; 