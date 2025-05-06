'use client';

import React from 'react';
import { RuleCondition, ConditionOperator, LogicalOperator } from '../types/rule';
import { PlusCircle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConditionEditorProps {
    conditions: RuleCondition[];
    logicalOperator?: LogicalOperator;
    onChange: (conditions: RuleCondition[], logicalOperator?: LogicalOperator) => void;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
    conditions = [],
    logicalOperator = LogicalOperator.AND,
    onChange
}) => {
    // Générer un ID unique pour une nouvelle condition
    const generateConditionId = () => `condition-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Ajouter une nouvelle condition vide
    const handleAddCondition = () => {
        const newCondition: RuleCondition = {
            id: generateConditionId(),
            field: '',
            operator: ConditionOperator.EQUALS,
            value: ''
        };
        onChange([...conditions, newCondition], logicalOperator);
    };

    // Supprimer une condition par son index
    const handleRemoveCondition = (index: number) => {
        if (conditions.length > 1 || conditions.length === 0) {
            const updatedConditions = [...conditions];
            updatedConditions.splice(index, 1);
            onChange(updatedConditions, logicalOperator);
        }
    };

    // Mettre à jour une condition
    const handleUpdateCondition = (index: number, field: keyof RuleCondition, value: any) => {
        const updatedConditions = [...conditions];
        updatedConditions[index] = {
            ...updatedConditions[index],
            [field]: value
        };
        onChange(updatedConditions, logicalOperator);
    };

    // Changer l'opérateur logique entre les conditions (AND, OR)
    const handleLogicalOperatorChange = (value: LogicalOperator) => {
        onChange(conditions, value);
    };

    // Déterminer si le champ de fin de plage doit être affiché
    const shouldShowRangeEnd = (operator: ConditionOperator): boolean => {
        return operator === ConditionOperator.BETWEEN;
    };

    // Obtenir la valeur de fin de plage depuis parameters (si operator === BETWEEN)
    const getRangeEndValue = (condition: RuleCondition): string => {
        if (condition.parameters && condition.parameters.valueEnd) {
            return condition.parameters.valueEnd.toString();
        }
        return '';
    };

    // Mettre à jour la valeur de fin de plage dans parameters
    const updateRangeEndValue = (index: number, value: string): void => {
        const updatedConditions = [...conditions];
        // Vérifier si parameters existe, sinon l'initialiser
        if (!updatedConditions[index].parameters) {
            updatedConditions[index].parameters = {};
        }
        // Mettre à jour valueEnd dans parameters
        updatedConditions[index].parameters = {
            ...updatedConditions[index].parameters,
            valueEnd: value
        };
        onChange(updatedConditions, logicalOperator);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sélecteur d'opérateur logique AND/OR */}
                <div className="mb-4">
                    <Label htmlFor="logicalOperator">Opérateur logique</Label>
                    <Select
                        value={logicalOperator}
                        onValueChange={(value) => handleLogicalOperatorChange(value as LogicalOperator)}
                    >
                        <SelectTrigger id="logicalOperator">
                            <SelectValue placeholder="Opérateur" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={LogicalOperator.AND}>ET (toutes les conditions doivent être vraies)</SelectItem>
                            <SelectItem value={LogicalOperator.OR}>OU (au moins une condition doit être vraie)</SelectItem>
                            <SelectItem value={LogicalOperator.XOR}>XOR (exactement une condition doit être vraie)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Liste des conditions */}
                <div className="space-y-4">
                    {conditions.map((condition, index) => (
                        <div key={condition.id} className="p-4 border rounded-md space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium">Condition {index + 1}</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCondition(index)}
                                    disabled={conditions.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Supprimer la condition</span>
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Champ concerné par la condition */}
                                <div>
                                    <Label htmlFor={`field-${index}`}>Champ</Label>
                                    <Input
                                        id={`field-${index}`}
                                        value={condition.field}
                                        onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                                        placeholder="Ex: userId, specialty, shiftType"
                                    />
                                </div>

                                {/* Opérateur de comparaison */}
                                <div>
                                    <Label htmlFor={`operator-${index}`}>Opérateur</Label>
                                    <Select
                                        value={condition.operator}
                                        onValueChange={(value) => handleUpdateCondition(index, 'operator', value)}
                                    >
                                        <SelectTrigger id={`operator-${index}`}>
                                            <SelectValue placeholder="Opérateur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ConditionOperator.EQUALS}>Égal à</SelectItem>
                                            <SelectItem value={ConditionOperator.NOT_EQUALS}>Différent de</SelectItem>
                                            <SelectItem value={ConditionOperator.GREATER_THAN}>Supérieur à</SelectItem>
                                            <SelectItem value={ConditionOperator.LESS_THAN}>Inférieur à</SelectItem>
                                            <SelectItem value={ConditionOperator.GREATER_THAN_OR_EQUALS}>Supérieur ou égal à</SelectItem>
                                            <SelectItem value={ConditionOperator.LESS_THAN_OR_EQUALS}>Inférieur ou égal à</SelectItem>
                                            <SelectItem value={ConditionOperator.CONTAINS}>Contient</SelectItem>
                                            <SelectItem value={ConditionOperator.NOT_CONTAINS}>Ne contient pas</SelectItem>
                                            <SelectItem value={ConditionOperator.STARTS_WITH}>Commence par</SelectItem>
                                            <SelectItem value={ConditionOperator.ENDS_WITH}>Termine par</SelectItem>
                                            <SelectItem value={ConditionOperator.IN}>Dans la liste</SelectItem>
                                            <SelectItem value={ConditionOperator.NOT_IN}>Pas dans la liste</SelectItem>
                                            <SelectItem value={ConditionOperator.BETWEEN}>Entre (plage)</SelectItem>
                                            <SelectItem value={ConditionOperator.IS_NULL}>Est nul</SelectItem>
                                            <SelectItem value={ConditionOperator.IS_NOT_NULL}>N'est pas nul</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Valeur de la condition */}
                            {condition.operator !== ConditionOperator.IS_NULL &&
                                condition.operator !== ConditionOperator.IS_NOT_NULL && (
                                    <div>
                                        <Label htmlFor={`value-${index}`}>
                                            {shouldShowRangeEnd(condition.operator) ? 'Valeur minimum' : 'Valeur'}
                                        </Label>
                                        <Input
                                            id={`value-${index}`}
                                            value={condition.value || ''}
                                            onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                                            placeholder={
                                                condition.operator === ConditionOperator.IN ||
                                                    condition.operator === ConditionOperator.NOT_IN
                                                    ? 'Valeurs séparées par des virgules'
                                                    : 'Valeur'
                                            }
                                        />
                                    </div>
                                )}

                            {/* Valeur de fin pour BETWEEN */}
                            {shouldShowRangeEnd(condition.operator) && (
                                <div>
                                    <Label htmlFor={`valueEnd-${index}`}>Valeur maximum</Label>
                                    <Input
                                        id={`valueEnd-${index}`}
                                        value={getRangeEndValue(condition)}
                                        onChange={(e) => updateRangeEndValue(index, e.target.value)}
                                        placeholder="Valeur maximum"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Bouton pour ajouter une condition */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCondition}
                        className="w-full mt-2"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter une condition
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}; 