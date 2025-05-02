import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import {
    ScheduleRule,
    ScheduleRuleSchema,
    ScheduleRulePriority,
    ScheduleRuleAction,
    ScheduleRuleField,
    ConditionOperator,
    ScheduleRuleCondition,
    ScheduleRuleConditionGroup
} from '../models/ScheduleRule';

// Schéma de validation pour le formulaire (version simplifiée du schéma complet)
const formSchema = ScheduleRuleSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true
});

type FormValues = z.infer<typeof formSchema>;

interface RuleFormProps {
    initialData?: Partial<ScheduleRule>;
    onSubmit: (data: FormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
    currentUserId: number;
}

export function RuleForm({ initialData, onSubmit, onCancel, isLoading = false, currentUserId }: RuleFormProps) {
    // État pour gérer l'interface utilisateur des groupes de conditions
    const [showConditionBuilder, setShowConditionBuilder] = useState(true);

    // Préparation des données initiales pour le formulaire
    const defaultValues: Partial<FormValues> = {
        name: initialData?.name || '',
        description: initialData?.description || '',
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        priority: initialData?.priority || ScheduleRulePriority.MEDIUM,
        validFrom: initialData?.validFrom || new Date(),
        validTo: initialData?.validTo,
        conditionGroup: initialData?.conditionGroup || {
            logicOperator: 'AND',
            conditions: [
                {
                    field: ScheduleRuleField.USER_ID,
                    operator: ConditionOperator.EQUALS,
                    value: ''
                }
            ]
        },
        actions: initialData?.actions || [
            {
                type: ScheduleRuleAction.WARN_ASSIGNMENT,
                parameters: {
                    message: 'Attention: cette règle a été déclenchée.'
                }
            }
        ]
    };

    // Configuration du formulaire
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues
    });

    // Fonction de soumission personnalisée
    const handleSubmit = (values: FormValues) => {
        // Ajouter l'ID utilisateur courant comme créateur/modificateur
        const finalValues = {
            ...values,
            createdBy: initialData?.id ? undefined : currentUserId,
            updatedBy: initialData?.id ? currentUserId : undefined
        };

        onSubmit(finalValues as FormValues);
    };

    // Gestion de l'ajout et de la suppression de conditions
    const addCondition = (groupIndex: number = 0) => {
        const currentGroup = form.getValues().conditionGroup;
        const newCondition: ScheduleRuleCondition = {
            field: ScheduleRuleField.USER_ID,
            operator: ConditionOperator.EQUALS,
            value: ''
        };

        // Ajouter la condition au groupe approprié
        const updatedGroup = { ...currentGroup };
        updatedGroup.conditions = [...updatedGroup.conditions, newCondition];

        form.setValue('conditionGroup', updatedGroup);
    };

    const removeCondition = (conditionIndex: number, groupIndex: number = 0) => {
        const currentGroup = form.getValues().conditionGroup;

        if (currentGroup.conditions.length <= 1) {
            // Ne pas supprimer la dernière condition
            return;
        }

        // Supprimer la condition du groupe approprié
        const updatedGroup = { ...currentGroup };
        updatedGroup.conditions = updatedGroup.conditions.filter((_, index) => index !== conditionIndex);

        form.setValue('conditionGroup', updatedGroup);
    };

    // Gestion de l'ajout et de la suppression d'actions
    const addAction = () => {
        const currentActions = form.getValues().actions || [];
        const newAction = {
            type: ScheduleRuleAction.WARN_ASSIGNMENT,
            parameters: {
                message: ''
            }
        };

        form.setValue('actions', [...currentActions, newAction]);
    };

    const removeAction = (actionIndex: number) => {
        const currentActions = form.getValues().actions;

        if (currentActions.length <= 1) {
            // Ne pas supprimer la dernière action
            return;
        }

        form.setValue(
            'actions',
            currentActions.filter((_, index) => index !== actionIndex)
        );
    };

    // Fonction pour rendre les champs d'entrée appropriés en fonction du type de champ et d'opérateur
    const renderFieldInput = (condition: ScheduleRuleCondition, index: number) => {
        const { field, operator } = condition;

        // Opérateurs qui n'ont pas besoin de valeur d'entrée
        if (operator === ConditionOperator.IS_NULL || operator === ConditionOperator.IS_NOT_NULL) {
            return null;
        }

        // Opérateurs qui nécessitent deux valeurs (plage)
        if (operator === ConditionOperator.BETWEEN || operator === ConditionOperator.NOT_BETWEEN) {
            return (
                <div className="flex gap-2 items-center">
                    <Controller
                        name={`conditionGroup.conditions.${index}.value`}
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                placeholder="Valeur de début"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                            />
                        )}
                    />
                    <span>et</span>
                    <Controller
                        name={`conditionGroup.conditions.${index}.valueEnd`}
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                placeholder="Valeur de fin"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                            />
                        )}
                    />
                </div>
            );
        }

        // Opérateurs qui acceptent des listes de valeurs
        if (operator === ConditionOperator.IN || operator === ConditionOperator.NOT_IN) {
            return (
                <Controller
                    name={`conditionGroup.conditions.${index}.value`}
                    control={form.control}
                    render={({ field }) => (
                        <Input
                            placeholder="Valeurs séparées par des virgules"
                            {...field}
                            value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value.split(',').map(v => v.trim()))}
                        />
                    )}
                />
            );
        }

        // Rendu par défaut pour les autres opérateurs
        return (
            <Controller
                name={`conditionGroup.conditions.${index}.value`}
                control={form.control}
                render={({ field }) => (
                    <Input
                        placeholder="Valeur"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                    />
                )}
            />
        );
    };

    // Fonction pour rendre les paramètres d'action appropriés
    const renderActionParameters = (action: any, index: number) => {
        switch (action.type) {
            case ScheduleRuleAction.WARN_ASSIGNMENT:
                return (
                    <Controller
                        name={`actions.${index}.parameters.message`}
                        control={form.control}
                        render={({ field }) => (
                            <Textarea
                                placeholder="Message d'avertissement"
                                {...field}
                                value={field.value || ''}
                            />
                        )}
                    />
                );

            case ScheduleRuleAction.FORBID_ASSIGNMENT:
            case ScheduleRuleAction.REQUIRE_ASSIGNMENT:
            case ScheduleRuleAction.SUGGEST_ASSIGNMENT:
                return (
                    <Controller
                        name={`actions.${index}.parameters.assignmentType`}
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                placeholder="Type d'affectation"
                                {...field}
                                value={field.value || ''}
                            />
                        )}
                    />
                );

            case ScheduleRuleAction.PRIORITIZE_USER:
            case ScheduleRuleAction.DEPRIORITIZE_USER:
                return (
                    <div className="flex flex-col gap-2">
                        <Controller
                            name={`actions.${index}.parameters.userId`}
                            control={form.control}
                            render={({ field }) => (
                                <Input
                                    placeholder="ID utilisateur"
                                    {...field}
                                    value={field.value || ''}
                                />
                            )}
                        />
                        <Controller
                            name={`actions.${index}.parameters.priorityValue`}
                            control={form.control}
                            render={({ field }) => (
                                <Input
                                    placeholder="Valeur de priorité"
                                    type="number"
                                    {...field}
                                    value={field.value || ''}
                                />
                            )}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section informations de base */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de base</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de la règle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nom de la règle" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Description de la règle" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priorité</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une priorité" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={ScheduleRulePriority.LOW}>Basse</SelectItem>
                                                <SelectItem value={ScheduleRulePriority.MEDIUM}>Moyenne</SelectItem>
                                                <SelectItem value={ScheduleRulePriority.HIGH}>Haute</SelectItem>
                                                <SelectItem value={ScheduleRulePriority.CRITICAL}>Critique</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>Activer la règle</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Section période de validité */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Période de validité</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="validFrom"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de début</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, "dd MMMM yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="validTo"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de fin (optionnelle)</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, "dd MMMM yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Section conditions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="conditionGroup.logicOperator"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Opérateur logique</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un opérateur" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="AND">ET (toutes les conditions doivent être vraies)</SelectItem>
                                                <SelectItem value="OR">OU (au moins une condition doit être vraie)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                {form.watch('conditionGroup.conditions').map((condition, index) => (
                                    <div key={index} className="p-4 border rounded-md space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium">Condition {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeCondition(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`conditionGroup.conditions.${index}.field`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Champ</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Sélectionner un champ" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {Object.values(ScheduleRuleField).map((fieldValue) => (
                                                                    <SelectItem key={fieldValue} value={fieldValue}>
                                                                        {fieldValue.replace(/_/g, ' ')}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`conditionGroup.conditions.${index}.operator`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Opérateur</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Sélectionner un opérateur" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {Object.values(ConditionOperator).map((opValue) => (
                                                                    <SelectItem key={opValue} value={opValue}>
                                                                        {opValue.replace(/_/g, ' ')}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormItem>
                                            <FormLabel>Valeur</FormLabel>
                                            <FormControl>
                                                {renderFieldInput(condition, index)}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCondition()}
                                    className="mt-2"
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Ajouter une condition
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {form.watch('actions').map((action, index) => (
                                <div key={index} className="p-4 border rounded-md space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-medium">Action {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAction(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={`actions.${index}.type`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type d'action</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un type d'action" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.values(ScheduleRuleAction).map((actionValue) => (
                                                            <SelectItem key={actionValue} value={actionValue}>
                                                                {actionValue.replace(/_/g, ' ')}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormItem>
                                        <FormLabel>Paramètres</FormLabel>
                                        <FormControl>
                                            {renderActionParameters(action, index)}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addAction}
                                className="mt-2"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Ajouter une action
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Boutons de soumission */}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Enregistrement...' : initialData?.id ? 'Mettre à jour' : 'Créer la règle'}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 