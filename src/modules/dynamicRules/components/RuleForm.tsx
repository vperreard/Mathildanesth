'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    Rule,
    RuleCondition,
    RuleAction,
    ConditionOperator,
    ActionType,
    RuleType,
    RulePriority,
    LogicalOperator,
    RuleMetadata,
    ConditionGroup
} from '../types/rule';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

function validateSingleRule(rule: Partial<Rule>): string[] {
    const errors: string[] = [];
    if (!rule.name || rule.name.trim() === '') {
        errors.push('Le nom de la règle est obligatoire.');
    }
    if (rule.type === undefined || !Object.values(RuleType).includes(rule.type)) {
        errors.push(`Type de règle invalide ou non défini.`);
    }
    if (typeof rule.priority !== 'number') {
        errors.push(`Priorité invalide ou non définie.`);
    }
    const hasConditions = (rule.conditions && rule.conditions.length > 0) || (rule.conditionGroups && rule.conditionGroups.length > 0);
    if (!hasConditions) {
        errors.push('La règle doit contenir au moins une condition ou un groupe de conditions.');
    }
    if (!rule.actions || rule.actions.length === 0) {
        errors.push('La règle doit contenir au moins une action.');
    }
    rule.conditions?.forEach((condition, index) => {
        if (!condition.field) errors.push(`Condition #${index + 1}: Le champ est obligatoire.`);
        if (!condition.operator) errors.push(`Condition #${index + 1}: L'opérateur est obligatoire.`);
    });
    rule.conditionGroups?.forEach((group, gIndex) => {
        if (!group.conditions || group.conditions.length === 0) {
            errors.push(`Groupe de conditions #${gIndex + 1}: Le groupe est vide.`);
        }
        group.conditions.forEach((condition, cIndex) => {
            if (!condition.field) errors.push(`Groupe #${gIndex + 1}, Condition #${cIndex + 1}: Le champ est obligatoire.`);
            if (!condition.operator) errors.push(`Groupe #${gIndex + 1}, Condition #${cIndex + 1}: L'opérateur est obligatoire.`);
        });
    });
    rule.actions?.forEach((action, index) => {
        if (!action.type) errors.push(`Action #${index + 1}: Le type est obligatoire.`);
    });

    return errors;
}

interface RuleFormProps {
    rule?: Rule;
    allRules?: Rule[];
    onSave: (rule: Rule) => void;
    onCancel: () => void;
}

type RuleFormData = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;

const initialRuleData: RuleFormData = {
    name: '',
    description: '',
    type: RuleType.PLANNING,
    priority: RulePriority.MEDIUM,
    enabled: true,
    conditions: [],
    conditionGroups: [],
    actions: [],
    metadata: undefined,
    isSystem: false,
    contexts: [],
    exceptions: [],
    conflictResolution: undefined,
};

const RuleForm: React.FC<RuleFormProps> = ({ rule, allRules = [], onSave, onCancel }) => {
    const getInitialFormData = (): RuleFormData => {
        if (rule) {
            return {
                name: rule.name || '',
                description: rule.description || '',
                type: rule.type || RuleType.PLANNING,
                priority: rule.priority ?? RulePriority.MEDIUM,
                enabled: rule.enabled ?? true,
                conditions: rule.conditions || [],
                conditionGroups: rule.conditionGroups || [],
                actions: rule.actions || [],
                metadata: rule.metadata,
                isSystem: rule.isSystem ?? false,
                contexts: rule.contexts || [],
                exceptions: rule.exceptions || [],
                conflictResolution: rule.conflictResolution,
            };
        } else {
            return initialRuleData;
        }
    };

    const [formData, setFormData] = useState<RuleFormData>(getInitialFormData);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (formData.enabled && allRules.length > 0) {
            logger.warn("Détection de conflits non implémentée dans le formulaire.");
        }
    }, [formData, allRules, rule]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };

    const handleCheckboxChange = (name: keyof RuleFormData, checked: boolean | string) => {
        setFormData(prev => ({
            ...prev,
            [name]: Boolean(checked),
        }));
    };

    const handleSelectChange = (name: keyof RuleFormData, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const addCondition = () => {
        const newCondition: RuleCondition = {
            id: `cond-${Date.now()}`,
            field: '',
            operator: ConditionOperator.EQUALS,
            value: ''
        };
        setFormData(prev => ({ ...prev, conditions: [...prev.conditions, newCondition] }));
    };

    const updateCondition = (index: number, field: keyof RuleCondition, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map((cond, i) => i === index ? { ...cond, [field]: value } : cond)
        }));
    };

    const removeCondition = (index: number) => {
        setFormData(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }));
    };

    const addAction = () => {
        const newAction: RuleAction = {
            id: `action-${Date.now()}`,
            type: ActionType.LOG,
            parameters: {}
        };
        setFormData(prev => ({ ...prev, actions: [...prev.actions, newAction] }));
    };

    const updateAction = (index: number, field: keyof RuleAction | 'paramValue', value: unknown) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.map((act, i) => {
                if (i === index) {
                    if (field === 'parameters') {
                        try {
                            const parsedParams = JSON.parse(value || '{}');
                            return { ...act, parameters: parsedParams };
                        } catch (err: unknown) {
                            logger.error("Erreur parsing JSON pour les paramètres d'action:", err);
                            return act;
                        }
                    } else if (field === 'paramValue') {
                        logger.warn("Mise à jour de paramètre spécifique non implémentée");
                        return act;
                    } else {
                        return { ...act, [field]: value };
                    }
                }
                return act;
            })
        }));
    };

    const removeAction = (index: number) => {
        setFormData(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors([]);

        const errors = validateSingleRule(formData);
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        const finalRule: Rule = {
            id: rule?.id || `rule-${Date.now()}`,
            ...formData,
            type: formData.type || RuleType.PLANNING,
            priority: formData.priority ?? RulePriority.MEDIUM,
            enabled: formData.enabled ?? true,
            conditions: formData.conditions || [],
            actions: formData.actions || [],
        };

        logger.info('Sauvegarde de la règle:', finalRule);
        onSave(finalRule);
    };

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>{rule ? 'Modifier la règle' : 'Créer une règle'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {validationErrors.length > 0 && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Erreurs de validation:</strong>
                            <ul className="mt-2 list-disc list-inside">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {conflictWarnings.length > 0 && (
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Avertissements de conflit:</strong>
                            <ul className="mt-2 list-disc list-inside">
                                {conflictWarnings.map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" onValueChange={(value) => handleSelectChange('type', value as RuleType)} value={formData.type}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Sélectionner un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(RuleType).map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select name="priority" onValueChange={(value) => handleSelectChange('priority', Number(value))} value={String(formData.priority)}>
                                <SelectTrigger id="priority">
                                    <SelectValue placeholder="Sélectionner une priorité" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(RulePriority)
                                        .filter(([key, value]) => typeof value === 'number')
                                        .map(([key, value]) => (
                                            <SelectItem key={key} value={String(value)}>{key} ({value})</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 pt-8 flex items-center">
                            <Checkbox id="enabled" name="enabled" checked={formData.enabled} onCheckedChange={(checked) => handleCheckboxChange('enabled', !!checked)} />
                            <Label htmlFor="enabled" className="ml-2">Activée</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Conditions</h3>
                        {formData.conditions.map((condition, index) => (
                            <div key={condition.id} className="flex items-center space-x-2 p-2 border rounded">
                                <Input
                                    placeholder="Champ (ex: user.role)"
                                    value={condition.field}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(index, 'field', e.target.value)}
                                    className="flex-1"
                                />
                                <Select onValueChange={(value) => updateCondition(index, 'operator', value as ConditionOperator)} value={condition.operator}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Opérateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(ConditionOperator).map(op => (
                                            <SelectItem key={op} value={op}>{op}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Valeur"
                                    value={condition.value}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(index, 'value', e.target.value)}
                                    className="flex-1"
                                    disabled={condition.operator === ConditionOperator.IS_NULL || condition.operator === ConditionOperator.IS_NOT_NULL}
                                />
                                <Button type="button" variant="destructive" size="sm" onClick={() => removeCondition(index)}>Supprimer</Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addCondition}>Ajouter une condition</Button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Actions</h3>
                        {formData.actions.map((action, index) => (
                            <div key={action.id} className="flex items-center space-x-2 p-2 border rounded">
                                <Select onValueChange={(value) => updateAction(index, 'type', value as ActionType)} value={action.type}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Type d'action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(ActionType).map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {action.type === ActionType.MODIFY && (
                                    <Input
                                        placeholder="Cible (ex: attribution.status)"
                                        value={action.target || ''}
                                        onChange={(e) => updateAction(index, 'target', e.target.value)}
                                        className="w-[200px]"
                                    />
                                )}
                                {action.type === ActionType.NOTIFY && (
                                    <Input
                                        placeholder="Message"
                                        value={action.message || ''}
                                        onChange={(e) => updateAction(index, 'message', e.target.value)}
                                        className="flex-1"
                                    />
                                )}
                                <Textarea
                                    placeholder="Paramètres spécifiques (JSON)"
                                    value={JSON.stringify(action.parameters || {}, null, 2)}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAction(index, 'parameters', e.target.value)}
                                    className="flex-1 font-mono text-sm h-20"
                                />
                                <Button type="button" variant="destructive" size="sm" onClick={() => removeAction(index)}>Supprimer</Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addAction}>Ajouter une action</Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                    <Button type="submit">{rule ? 'Sauvegarder' : 'Créer'}</Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export { RuleForm };
export default RuleForm;