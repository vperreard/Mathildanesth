import React, { useState, useEffect } from 'react';
import {
    AnyRule,
    RuleType,
    Rule
    // RulePriority // Commented out - not found
} from '../types/rule';
// import {
//     getRuleTypeLabel, // Commented out - not found
//     getRulePriorityLabel // Commented out - not found
// } from '../services/ruleService';
import { formatDate, parseDate, isDateBefore, ISO_DATE_FORMAT } from '@/utils/dateUtils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RuleService } from '../services/ruleService';
import { Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Card, CardHeader, CardTitle, CardContent, Switch } from '@/components/ui';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// Importation des formulaires spécifiques par type
import { DutyRuleForm } from './rule-forms/DutyRuleForm';
import { ConsultationRuleForm } from './rule-forms/ConsultationRuleForm';
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
    // Initialize react-hook-form
    const { control, handleSubmit: handleRHFSubmit, watch, formState: { errors: formErrors } } = useForm<Partial<AnyRule>>({
        defaultValues: rule,
        // Consider adding a Zod schema here for better validation
    });

    // État pour stocker la règle en cours d'édition
    const [currentRule, setCurrentRule] = useState<Partial<AnyRule>>(rule);

    // État pour les erreurs de validation
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Mettre à jour la règle locale lorsque la règle passée en prop change
    useEffect(() => {
        // Mettre à jour la règle locale lorsque la règle passée en prop change
        setCurrentRule({ ...rule });
        // Removed conversion logic for validFrom/validTo as they don't exist
    }, [rule]);

    // Gérer les changements des champs de base
    const handleBaseFieldChange = (
        field: keyof AnyRule,
        // La valeur peut être null pour les dates optionnelles ou un nombre pour la priorité
        value: string | boolean | Date | number | null
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

        // Valider les champs spécifiques au type (à compléter selon le type)
        // ...

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // Soumettre le formulaire
    const handleSubmit = async (data: Partial<AnyRule>) => {
        // e.preventDefault(); // Not needed with RHF

        // Validation custom (si nécessaire, en plus de Zod/RHF)
        // if (!validateForm()) {
        //     return;
        // }

        // Utiliser les données validées par RHF
        await onSave(data);
    };

    const getRuleTypeLabel = (type: RuleType) => type;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{rule.id ? 'Modifier la règle' : 'Nouvelle règle'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRHFSubmit(handleSubmit)} className="space-y-4">
                    {/* Afficher les erreurs de validation */}
                    {(validationErrors.length > 0 || Object.keys(formErrors).length > 0) && (
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

                    {/* Champs communs à tous les types de règles */}
                    <div className="space-y-6">
                        {/* Type de règle (en lecture seule si on modifie une règle existante) */}
                        <FormField
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(RuleType).map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {getRuleTypeLabel(type as RuleType)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                            <input
                                id="rule-priority"
                                type="number"
                                value={currentRule.priority || 1}
                                onChange={(e) => handleBaseFieldChange('priority', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Statut */}
                        <div>
                            <div className="flex items-center">
                                <input
                                    id="is-active"
                                    type="checkbox"
                                    checked={currentRule.enabled}
                                    onChange={(e) => handleBaseFieldChange('enabled', e.target.checked)}
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
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enregistrement...' : (rule.id ? 'Mettre à jour' : 'Créer')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}; 