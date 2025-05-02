'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Input, Checkbox } from '@/components/ui';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Filter, X, Check, ChevronDown, Search, Plus, Save, RefreshCw } from 'lucide-react';

export type FilterCondition = {
    id: string;
    field: string;
    operator: string;
    value: string | number | boolean | Date | string[];
    active: boolean;
};

export type FilterConfig = {
    id: string;
    label: string;
    field: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
    operators?: string[];
    options?: { value: string; label: string }[];
    defaultOperator?: string;
    placeholder?: string;
};

export type SavedFilter = {
    id: string;
    name: string;
    conditions: FilterCondition[];
};

type AdvancedFilterProps = {
    configs: FilterConfig[];
    onFilterChange: (conditions: FilterCondition[]) => void;
    savedFilters?: SavedFilter[];
    onSaveFilter?: (name: string, conditions: FilterCondition[]) => Promise<void>;
    onDeleteSavedFilter?: (id: string) => Promise<void>;
    className?: string;
    maxShownFilters?: number;
    showQuickSearch?: boolean;
    quickSearchPlaceholder?: string;
    defaultConditions?: FilterCondition[];
};

export default function AdvancedFilter({
    configs,
    onFilterChange,
    savedFilters = [],
    onSaveFilter,
    onDeleteSavedFilter,
    className = '',
    maxShownFilters = 3,
    showQuickSearch = true,
    quickSearchPlaceholder = 'Recherche rapide...',
    defaultConditions = []
}: AdvancedFilterProps) {
    const [conditions, setConditions] = useState<FilterCondition[]>(defaultConditions);
    const [quickSearch, setQuickSearch] = useState('');
    const [filterName, setFilterName] = useState('');
    const [selectedSavedFilter, setSelectedSavedFilter] = useState<string | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        // Déclencher le changement de filtre lors de la modification des conditions
        const activeConditions = conditions.filter(c => c.active);
        onFilterChange(activeConditions);
    }, [conditions, onFilterChange]);

    useEffect(() => {
        // Appliquer la recherche rapide si elle est activée
        if (showQuickSearch && quickSearch.trim() !== '') {
            const quickSearchCondition: FilterCondition = {
                id: 'quickSearch',
                field: '_all',
                operator: 'contains',
                value: quickSearch,
                active: true
            };

            // Filtrer les autres conditions "quickSearch" existantes
            const filteredConditions = conditions.filter(c => c.id !== 'quickSearch');
            setConditions([...filteredConditions, quickSearchCondition]);
        } else if (conditions.some(c => c.id === 'quickSearch')) {
            // Supprimer la condition de recherche rapide si elle existe et que la recherche est vide
            setConditions(conditions.filter(c => c.id !== 'quickSearch'));
        }
    }, [quickSearch, showQuickSearch]);

    const getOperatorLabel = (operator: string): string => {
        switch (operator) {
            case 'equals': return 'Est égal à';
            case 'notEquals': return 'Est différent de';
            case 'contains': return 'Contient';
            case 'startsWith': return 'Commence par';
            case 'endsWith': return 'Se termine par';
            case 'greaterThan': return 'Plus grand que';
            case 'lessThan': return 'Plus petit que';
            case 'greaterThanOrEquals': return 'Supérieur ou égal à';
            case 'lessThanOrEquals': return 'Inférieur ou égal à';
            case 'in': return 'Est dans';
            case 'between': return 'Entre';
            case 'isTrue': return 'Est vrai';
            case 'isFalse': return 'Est faux';
            default: return operator;
        }
    };

    const getDefaultOperators = (type: string): string[] => {
        switch (type) {
            case 'text':
                return ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith'];
            case 'number':
                return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals', 'between'];
            case 'date':
                return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between'];
            case 'boolean':
                return ['isTrue', 'isFalse'];
            case 'select':
                return ['equals', 'notEquals'];
            case 'multiselect':
                return ['in'];
            default:
                return ['equals', 'notEquals', 'contains'];
        }
    };

    const addCondition = useCallback(() => {
        if (configs.length === 0) return;

        const config = configs[0];
        const operators = config.operators || getDefaultOperators(config.type);
        const defaultOperator = config.defaultOperator || operators[0];

        const newCondition: FilterCondition = {
            id: `condition-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            field: config.field,
            operator: defaultOperator,
            value: config.type === 'boolean' ? false : config.type === 'multiselect' ? [] : '',
            active: true
        };

        setConditions([...conditions, newCondition]);
    }, [configs, conditions]);

    const updateCondition = useCallback((id: string, field: string, value: any) => {
        setConditions(prevConditions =>
            prevConditions.map(c =>
                c.id === id ? { ...c, [field]: value } : c
            )
        );
    }, []);

    const updateConditionField = useCallback((id: string, fieldName: string) => {
        // Trouver la config correspondant au champ sélectionné
        const config = configs.find(c => c.field === fieldName);
        if (!config) return;

        // Obtenir les opérateurs pour ce type et définir un opérateur par défaut
        const operators = config.operators || getDefaultOperators(config.type);
        const defaultOperator = config.defaultOperator || operators[0];

        // Définir une valeur par défaut en fonction du type
        let defaultValue: any = '';
        if (config.type === 'boolean') defaultValue = false;
        else if (config.type === 'multiselect') defaultValue = [];

        // Mettre à jour la condition
        setConditions(prevConditions =>
            prevConditions.map(c =>
                c.id === id ? { ...c, field: fieldName, operator: defaultOperator, value: defaultValue } : c
            )
        );
    }, [configs]);

    const removeCondition = useCallback((id: string) => {
        setConditions(conditions.filter(c => c.id !== id));
    }, [conditions]);

    const toggleCondition = useCallback((id: string) => {
        setConditions(prevConditions =>
            prevConditions.map(c =>
                c.id === id ? { ...c, active: !c.active } : c
            )
        );
    }, []);

    const clearAllFilters = useCallback(() => {
        setConditions([]);
        setQuickSearch('');
        setSelectedSavedFilter(null);
    }, []);

    const loadSavedFilter = useCallback((filterId: string) => {
        const savedFilter = savedFilters.find(f => f.id === filterId);
        if (savedFilter) {
            setConditions(savedFilter.conditions);
            setSelectedSavedFilter(filterId);
        }
    }, [savedFilters]);

    const handleSaveFilter = async () => {
        if (onSaveFilter && filterName.trim()) {
            try {
                await onSaveFilter(filterName, conditions);
                setFilterName('');
                setShowSaveDialog(false);
                // Après la sauvegarde, on présume que le filtre sera ajouté à savedFilters via les props
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du filtre:', error);
            }
        }
    };

    const renderFieldInput = (condition: FilterCondition) => {
        const config = configs.find(c => c.field === condition.field);
        if (!config) return null;

        switch (config.type) {
            case 'text':
                return (
                    <Input
                        placeholder={config.placeholder || 'Saisir une valeur...'}
                        value={condition.value as string}
                        onChange={e => updateCondition(condition.id, 'value', e.target.value)}
                        className="w-full"
                    />
                );

            case 'number':
                return (
                    <Input
                        type="number"
                        placeholder={config.placeholder || 'Saisir un nombre...'}
                        value={condition.value as number}
                        onChange={e => updateCondition(condition.id, 'value', parseFloat(e.target.value))}
                        className="w-full"
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={condition.value as string}
                        onChange={e => updateCondition(condition.id, 'value', e.target.value)}
                        className="w-full"
                    />
                );

            case 'boolean':
                return (
                    <Checkbox
                        checked={condition.value as boolean}
                        onCheckedChange={checked => updateCondition(condition.id, 'value', checked)}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={condition.value as string}
                        onValueChange={value => updateCondition(condition.id, 'value', value)}
                    >
                        <Select.Trigger className="w-full">
                            <Select.Value placeholder={config.placeholder || 'Sélectionner...'} />
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                {config.options?.map(option => (
                                    <Select.Item key={option.value} value={option.value}>
                                        {option.label}
                                    </Select.Item>
                                ))}
                            </Select.Group>
                        </Select.Content>
                    </Select>
                );

            case 'multiselect':
                return (
                    <div className="flex flex-wrap gap-1 border p-2 rounded-md min-h-[38px]">
                        {(condition.value as string[]).map(val => {
                            const option = config.options?.find(o => o.value === val);
                            return (
                                <Badge key={val} className="flex items-center gap-1">
                                    {option?.label || val}
                                    <X
                                        size={14}
                                        className="cursor-pointer"
                                        onClick={() => updateCondition(
                                            condition.id,
                                            'value',
                                            (condition.value as string[]).filter(v => v !== val)
                                        )}
                                    />
                                </Badge>
                            );
                        })}
                        <Select
                            value=""
                            onValueChange={value => {
                                if (value && !(condition.value as string[]).includes(value)) {
                                    updateCondition(
                                        condition.id,
                                        'value',
                                        [...(condition.value as string[]), value]
                                    );
                                }
                            }}
                        >
                            <Select.Trigger className="h-8 px-2 min-w-[120px] border-0">
                                <Select.Value placeholder="Ajouter..." />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    {config.options?.filter(
                                        option => !(condition.value as string[]).includes(option.value)
                                    ).map(option => (
                                        <Select.Item key={option.value} value={option.value}>
                                            {option.label}
                                        </Select.Item>
                                    ))}
                                </Select.Group>
                            </Select.Content>
                        </Select>
                    </div>
                );

            default:
                return null;
        }
    };

    // Calculer les conditions actives à afficher dans la barre de filtres
    const activeConditions = conditions.filter(c => c.active);
    const visibleConditions = activeConditions.slice(0, maxShownFilters);
    const hiddenConditionsCount = Math.max(0, activeConditions.length - maxShownFilters);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Barre de filtres principale */}
            <div className="flex flex-wrap items-center gap-2">
                {showQuickSearch && (
                    <div className="relative flex-grow max-w-xs">
                        <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                        <Input
                            placeholder={quickSearchPlaceholder}
                            value={quickSearch}
                            onChange={e => setQuickSearch(e.target.value)}
                            className="pl-8"
                        />
                        {quickSearch && (
                            <button
                                onClick={() => setQuickSearch('')}
                                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Badges des filtres actifs */}
                {visibleConditions.map(condition => {
                    const config = configs.find(c => c.field === condition.field);
                    if (!config) return null;

                    let valueDisplay = String(condition.value);

                    // Formater l'affichage de la valeur selon le type
                    if (config.type === 'select') {
                        const option = config.options?.find(o => o.value === condition.value);
                        valueDisplay = option?.label || valueDisplay;
                    } else if (config.type === 'multiselect') {
                        const values = condition.value as string[];
                        valueDisplay = values.map(v => {
                            const option = config.options?.find(o => o.value === v);
                            return option?.label || v;
                        }).join(', ');
                    } else if (config.type === 'boolean') {
                        valueDisplay = condition.value ? 'Oui' : 'Non';
                    }

                    return (
                        <Badge key={condition.id} variant="outline" className="px-2 py-1.5 gap-1">
                            <span className="font-medium">{config.label}</span>
                            <span className="text-xs opacity-70">{getOperatorLabel(condition.operator)}</span>
                            <span>{valueDisplay}</span>
                            <X
                                size={14}
                                className="cursor-pointer opacity-70 hover:opacity-100"
                                onClick={() => removeCondition(condition.id)}
                            />
                        </Badge>
                    );
                })}

                {/* Badge pour les filtres cachés */}
                {hiddenConditionsCount > 0 && (
                    <Badge variant="outline">
                        +{hiddenConditionsCount} {hiddenConditionsCount === 1 ? 'filtre' : 'filtres'}
                    </Badge>
                )}

                <div className="flex gap-2 ml-auto">
                    {activeConditions.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-gray-500"
                        >
                            Effacer
                        </Button>
                    )}

                    {savedFilters.length > 0 && (
                        <Select
                            value={selectedSavedFilter || ''}
                            onValueChange={loadSavedFilter}
                        >
                            <Select.Trigger className="h-9">
                                <Select.Value placeholder="Filtres enregistrés" />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    {savedFilters.map(filter => (
                                        <Select.Item key={filter.id} value={filter.id}>
                                            {filter.name}
                                        </Select.Item>
                                    ))}
                                </Select.Group>
                            </Select.Content>
                        </Select>
                    )}

                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                                <Filter size={16} />
                                Filtres avancés
                                <ChevronDown size={14} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[380px] p-0" align="end">
                            <Card className="border-0 shadow-none">
                                <div className="p-3 border-b">
                                    <h3 className="font-medium">Filtres avancés</h3>
                                </div>

                                <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                                    {conditions.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            <p>Aucun filtre défini</p>
                                            <p className="text-sm">Cliquez sur le bouton + pour ajouter un filtre</p>
                                        </div>
                                    ) : (
                                        conditions.map(condition => {
                                            const config = configs.find(c => c.field === condition.field);
                                            return (
                                                <div key={condition.id} className="border rounded-md p-2 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`p-1 h-auto ${condition.active ? 'text-green-500' : 'text-gray-400'}`}
                                                            onClick={() => toggleCondition(condition.id)}
                                                        >
                                                            <Check size={18} />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-1 h-auto text-red-500 hover:bg-red-50"
                                                            onClick={() => removeCondition(condition.id)}
                                                        >
                                                            <X size={18} />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2">
                                                        <Select
                                                            value={condition.field}
                                                            onValueChange={(value) => updateConditionField(condition.id, value)}
                                                        >
                                                            <Select.Trigger>
                                                                <Select.Value placeholder="Champ" />
                                                            </Select.Trigger>
                                                            <Select.Content>
                                                                <Select.Group>
                                                                    {configs.map(config => (
                                                                        <Select.Item key={config.field} value={config.field}>
                                                                            {config.label}
                                                                        </Select.Item>
                                                                    ))}
                                                                </Select.Group>
                                                            </Select.Content>
                                                        </Select>

                                                        {/* Sélection de l'opérateur */}
                                                        <Select
                                                            value={condition.operator}
                                                            onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                                                        >
                                                            <Select.Trigger>
                                                                <Select.Value placeholder="Opérateur" />
                                                            </Select.Trigger>
                                                            <Select.Content>
                                                                <Select.Group>
                                                                    {config?.operators || getDefaultOperators(config?.type || 'text').map(op => (
                                                                        <Select.Item key={op} value={op}>
                                                                            {getOperatorLabel(op)}
                                                                        </Select.Item>
                                                                    ))}
                                                                </Select.Group>
                                                            </Select.Content>
                                                        </Select>

                                                        {/* Champ de saisie de la valeur selon le type */}
                                                        {renderFieldInput(condition)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-3 border-t flex justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={addCondition}
                                    >
                                        <Plus size={14} />
                                        Ajouter un filtre
                                    </Button>

                                    {onSaveFilter && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => setShowSaveDialog(true)}
                                            disabled={conditions.length === 0}
                                        >
                                            <Save size={14} />
                                            Enregistrer
                                        </Button>
                                    )}
                                </div>

                                {/* Dialogue de sauvegarde */}
                                {showSaveDialog && (
                                    <div className="p-3 border-t space-y-3">
                                        <h4 className="font-medium text-sm">Enregistrer ce filtre</h4>
                                        <Input
                                            placeholder="Nom du filtre"
                                            value={filterName}
                                            onChange={e => setFilterName(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setShowSaveDialog(false);
                                                    setFilterName('');
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveFilter}
                                                disabled={!filterName.trim()}
                                            >
                                                Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
} 