'use client';

import React from 'react';
import { RuleAction, ActionType } from '../types/rule';
import { PlusCircle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionEditorProps {
    actions: RuleAction[];
    onChange: (actions: RuleAction[]) => void;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
    actions = [],
    onChange
}) => {
    // Générer un ID unique pour une nouvelle action
    const generateActionId = () => `action-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Ajouter une nouvelle action vide
    const handleAddAction = () => {
        const newAction: RuleAction = {
            id: generateActionId(),
            type: ActionType.NOTIFY,
            // Paramètres par défaut selon le type
            message: 'Notification de règle',
            severity: 'info'
        };
        onChange([...actions, newAction]);
    };

    // Supprimer une action par son index
    const handleRemoveAction = (index: number) => {
        if (actions.length > 1 || actions.length === 0) {
            const updatedActions = [...actions];
            updatedActions.splice(index, 1);
            onChange(updatedActions);
        }
    };

    // Mettre à jour une action
    const handleUpdateAction = (index: number, field: keyof RuleAction, value: unknown) => {
        const updatedActions = [...actions];
        updatedActions[index] = {
            ...updatedActions[index],
            [field]: value
        };
        onChange(updatedActions);
    };

    // Mettre à jour un paramètre d'une action
    const handleUpdateParameter = (index: number, paramName: string, value: unknown) => {
        const updatedActions = [...actions];
        // Assurer que parameters existe
        if (!updatedActions[index].parameters) {
            updatedActions[index].parameters = {};
        }
        // Mettre à jour le paramètre spécifique
        updatedActions[index].parameters = {
            ...updatedActions[index].parameters,
            [paramName]: value
        };
        onChange(updatedActions);
    };

    // Rendu des champs spécifiques selon le type d'action
    const renderActionFields = (action: RuleAction, index: number) => {
        switch (action.type) {
            case ActionType.NOTIFY:
                return (
                    <>
                        <div>
                            <Label htmlFor={`message-${index}`}>Message</Label>
                            <Textarea
                                id={`message-${index}`}
                                value={action.message || ''}
                                onChange={(e) => handleUpdateAction(index, 'message', e.target.value)}
                                placeholder="Message de notification"
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`severity-${index}`}>Sévérité</Label>
                            <Select
                                value={action.severity || 'info'}
                                onValueChange={(value) => handleUpdateAction(index, 'severity', value)}
                            >
                                <SelectTrigger id={`severity-${index}`}>
                                    <SelectValue placeholder="Sévérité" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Information</SelectItem>
                                    <SelectItem value="warning">Avertissement</SelectItem>
                                    <SelectItem value="error">Erreur</SelectItem>
                                    <SelectItem value="success">Succès</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );
            case ActionType.PREVENT:
            case ActionType.ALLOW:
                return (
                    <div>
                        <Label htmlFor={`message-${index}`}>Message</Label>
                        <Textarea
                            id={`message-${index}`}
                            value={action.message || ''}
                            onChange={(e) => handleUpdateAction(index, 'message', e.target.value)}
                            placeholder={`Message pour ${action.type === ActionType.PREVENT ? 'empêcher' : 'autoriser'} l'action`}
                            rows={2}
                        />
                    </div>
                );
            case ActionType.MODIFY:
                return (
                    <>
                        <div>
                            <Label htmlFor={`target-${index}`}>Cible</Label>
                            <Input
                                id={`target-${index}`}
                                value={action.target || ''}
                                onChange={(e) => handleUpdateAction(index, 'target', e.target.value)}
                                placeholder="Champ à modifier"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`value-${index}`}>Nouvelle valeur</Label>
                            <Input
                                id={`value-${index}`}
                                value={action.value !== undefined ? String(action.value) : ''}
                                onChange={(e) => handleUpdateAction(index, 'value', e.target.value)}
                                placeholder="Valeur à appliquer"
                            />
                        </div>
                    </>
                );
            case ActionType.EXECUTE_FUNCTION:
                return (
                    <>
                        <div>
                            <Label htmlFor={`functionName-${index}`}>Nom de la fonction</Label>
                            <Input
                                id={`functionName-${index}`}
                                value={action.functionName || ''}
                                onChange={(e) => handleUpdateAction(index, 'functionName', e.target.value)}
                                placeholder="Nom de la fonction à exécuter"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`parameters-${index}`}>Paramètres (JSON)</Label>
                            <Textarea
                                id={`parameters-${index}`}
                                value={action.parameters ? JSON.stringify(action.parameters, null, 2) : '{}'}
                                onChange={(e) => {
                                    try {
                                        const params = JSON.parse(e.target.value);
                                        handleUpdateAction(index, 'parameters', params);
                                    } catch (err: unknown) {
                                        // Ignorer les erreurs de parsing JSON
                                    }
                                }}
                                placeholder="{}"
                                rows={3}
                            />
                        </div>
                    </>
                );
            default:
                return (
                    <div>
                        <Label htmlFor={`message-${index}`}>Description</Label>
                        <Textarea
                            id={`message-${index}`}
                            value={action.message || ''}
                            onChange={(e) => handleUpdateAction(index, 'message', e.target.value)}
                            placeholder="Description de l'action"
                            rows={2}
                        />
                    </div>
                );
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Liste des actions */}
                <div className="space-y-4">
                    {actions.map((action, index) => (
                        <div key={action.id} className="p-4 border rounded-md space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium">Action {index + 1}</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAction(index)}
                                    disabled={actions.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Supprimer l'action</span>
                                </Button>
                            </div>

                            {/* Type d'action */}
                            <div>
                                <Label htmlFor={`type-${index}`}>Type d'action</Label>
                                <Select
                                    value={action.type}
                                    onValueChange={(value) => handleUpdateAction(index, 'type', value)}
                                >
                                    <SelectTrigger id={`type-${index}`}>
                                        <SelectValue placeholder="Type d'action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ActionType.NOTIFY}>Notification</SelectItem>
                                        <SelectItem value={ActionType.PREVENT}>Empêcher</SelectItem>
                                        <SelectItem value={ActionType.ALLOW}>Autoriser</SelectItem>
                                        <SelectItem value={ActionType.MODIFY}>Modifier</SelectItem>
                                        <SelectItem value={ActionType.SUGGEST}>Suggérer</SelectItem>
                                        <SelectItem value={ActionType.LOG}>Journaliser</SelectItem>
                                        <SelectItem value={ActionType.ESCALATE}>Escalader</SelectItem>
                                        <SelectItem value={ActionType.EXECUTE_FUNCTION}>Exécuter une fonction</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Champs spécifiques au type d'action */}
                            {renderActionFields(action, index)}
                        </div>
                    ))}

                    {/* Bouton pour ajouter une action */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAction}
                        className="w-full mt-2"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter une action
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}; 