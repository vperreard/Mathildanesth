'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, X, Filter, Calendar, User, PieChart, ArrowUpDown, Check } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Slider } from '@/components/ui/slider';
import { DateRange } from 'react-day-picker';

export interface FilterOption {
    id: string;
    label: string;
    value: string;
    group?: string;
}

export interface AdvancedFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    initialFilters?: Partial<FilterState>;
    dateRangeOptions?: {
        label: string;
        enabled: boolean;
        initialRange?: DateRange;
    };
    userOptions?: {
        label: string;
        enabled: boolean;
        options: FilterOption[];
    };
    metricsOptions?: {
        label: string;
        enabled: boolean;
        options: FilterOption[];
    };
    categoryOptions?: {
        label: string;
        enabled: boolean;
        options: FilterOption[];
    };
    thresholdOptions?: {
        label: string;
        enabled: boolean;
        min: number;
        max: number;
        step: number;
        initialValue?: number;
    };
    saveFiltersEnabled?: boolean;
    savedFiltersOptions?: FilterPreset[];
    onSaveFilters?: (name: string, filters: FilterState) => void;
}

export interface FilterState {
    searchQuery: string;
    dateRange: DateRange | undefined;
    selectedUsers: string[];
    selectedMetrics: string[];
    selectedCategories: string[];
    threshold: number;
    savedPreset?: string;
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: FilterState;
}

// Composant mémorisé pour le contenu du popover des utilisateurs
const UserPopoverContent = memo(({
    options,
    selectedUsers,
    onUserSelection
}: {
    options: FilterOption[],
    selectedUsers: string[],
    onUserSelection: (userId: string) => void
}) => (
    <CommandList className="max-h-[300px] overflow-auto">
        <CommandEmpty>Aucun utilisateur trouvé</CommandEmpty>
        <CommandGroup>
            {options.map(user => (
                <CommandItem
                    key={user.id}
                    onSelect={() => onUserSelection(user.id)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        id={`user-${user.id}`}
                        className="mr-2"
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-grow cursor-pointer">
                        {user.label}
                    </Label>
                    {selectedUsers.includes(user.id) && <Check className="h-4 w-4" />}
                </CommandItem>
            ))}
        </CommandGroup>
    </CommandList>
));

UserPopoverContent.displayName = 'UserPopoverContent';

// Composant mémorisé pour le contenu du popover des métriques
const MetricsPopoverContent = memo(({
    options,
    selectedMetrics,
    onMetricSelection
}: {
    options: FilterOption[],
    selectedMetrics: string[],
    onMetricSelection: (metricId: string) => void
}) => (
    <CommandList className="max-h-[300px] overflow-auto">
        <CommandEmpty>Aucune métrique trouvée</CommandEmpty>
        <CommandGroup>
            {options.map(metric => (
                <CommandItem
                    key={metric.id}
                    onSelect={() => onMetricSelection(metric.id)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Checkbox
                        checked={selectedMetrics.includes(metric.id)}
                        id={`metric-${metric.id}`}
                        className="mr-2"
                    />
                    <Label htmlFor={`metric-${metric.id}`} className="flex-grow cursor-pointer">
                        {metric.label}
                    </Label>
                    {selectedMetrics.includes(metric.id) && <Check className="h-4 w-4" />}
                </CommandItem>
            ))}
        </CommandGroup>
    </CommandList>
));

MetricsPopoverContent.displayName = 'MetricsPopoverContent';

// Composant mémorisé pour le contenu du popover des catégories
const CategoryPopoverContent = memo(({
    options,
    selectedCategories,
    onCategorySelection
}: {
    options: FilterOption[],
    selectedCategories: string[],
    onCategorySelection: (categoryId: string) => void
}) => (
    <CommandList className="max-h-[300px] overflow-auto">
        <CommandEmpty>Aucune catégorie trouvée</CommandEmpty>
        <CommandGroup>
            {options.map(category => (
                <CommandItem
                    key={category.id}
                    onSelect={() => onCategorySelection(category.id)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        id={`category-${category.id}`}
                        className="mr-2"
                    />
                    <Label htmlFor={`category-${category.id}`} className="flex-grow cursor-pointer">
                        {category.label}
                    </Label>
                    {selectedCategories.includes(category.id) && <Check className="h-4 w-4" />}
                </CommandItem>
            ))}
        </CommandGroup>
    </CommandList>
));

CategoryPopoverContent.displayName = 'CategoryPopoverContent';

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    onFilterChange,
    initialFilters = {},
    dateRangeOptions,
    userOptions,
    metricsOptions,
    categoryOptions,
    thresholdOptions,
    saveFiltersEnabled = false,
    savedFiltersOptions = [],
    onSaveFilters
}) => {
    // State pour les filtres
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: initialFilters.searchQuery || '',
        dateRange: initialFilters.dateRange,
        selectedUsers: initialFilters.selectedUsers || [],
        selectedMetrics: initialFilters.selectedMetrics || [],
        selectedCategories: initialFilters.selectedCategories || [],
        threshold: initialFilters.threshold !== undefined ? initialFilters.threshold : (thresholdOptions?.initialValue || 0),
        savedPreset: initialFilters.savedPreset
    });

    // State pour l'UI
    const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
    const [isMetricsPopoverOpen, setIsMetricsPopoverOpen] = useState(false);
    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
    const [isThresholdPopoverOpen, setIsThresholdPopoverOpen] = useState(false);
    const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
    const [isPresetsPopoverOpen, setIsPresetsPopoverOpen] = useState(false);
    const [saveFilterName, setSaveFilterName] = useState('');

    // Effet pour propager les changements au parent avec debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onFilterChange(filters);
        }, 300); // 300ms de debounce pour éviter trop d'appels rapprochés

        return () => clearTimeout(timeoutId);
    }, [filters, onFilterChange]);

    // Handler pour le changement de recherche
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({
            ...prev,
            searchQuery: e.target.value,
        }));
    }, []);

    // Handler pour le changement de plage de dates
    const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
        setFilters(prev => ({
            ...prev,
            dateRange: range,
        }));
    }, []);

    // Handler pour le changement de sélection d'utilisateurs
    const handleUserSelection = useCallback((userId: string) => {
        setFilters(prev => {
            const newSelectedUsers = prev.selectedUsers.includes(userId)
                ? prev.selectedUsers.filter(id => id !== userId)
                : [...prev.selectedUsers, userId];

            return {
                ...prev,
                selectedUsers: newSelectedUsers,
            };
        });
    }, []);

    // Handler pour le changement de sélection de métriques
    const handleMetricSelection = useCallback((metricId: string) => {
        setFilters(prev => {
            const newSelectedMetrics = prev.selectedMetrics.includes(metricId)
                ? prev.selectedMetrics.filter(id => id !== metricId)
                : [...prev.selectedMetrics, metricId];

            return {
                ...prev,
                selectedMetrics: newSelectedMetrics,
            };
        });
    }, []);

    // Handler pour le changement de sélection de catégories
    const handleCategorySelection = useCallback((categoryId: string) => {
        setFilters(prev => {
            const newSelectedCategories = prev.selectedCategories.includes(categoryId)
                ? prev.selectedCategories.filter(id => id !== categoryId)
                : [...prev.selectedCategories, categoryId];

            return {
                ...prev,
                selectedCategories: newSelectedCategories,
            };
        });
    }, []);

    // Handler pour le changement de seuil
    const handleThresholdChange = useCallback((value: number[]) => {
        setFilters(prev => ({
            ...prev,
            threshold: value[0] || thresholdOptions?.initialValue || 0,
        }));
    }, [thresholdOptions]);

    // Handler pour sauvegarder les filtres
    const handleSaveFilters = useCallback(() => {
        if (saveFilterName.trim() && onSaveFilters) {
            onSaveFilters(saveFilterName.trim(), filters);
            setSaveFilterName('');
            setIsSavePopoverOpen(false);
        }
    }, [saveFilterName, filters, onSaveFilters]);

    // Handler pour le changement du nom de filtre à sauvegarder
    const handleSaveFilterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSaveFilterName(e.target.value);
    }, []);

    // Handler pour charger un preset
    const handleLoadPreset = useCallback((presetId: string) => {
        const preset = savedFiltersOptions.find(p => p.id === presetId);
        if (preset) {
            setFilters({
                ...preset.filters,
                savedPreset: presetId
            });
            setIsPresetsPopoverOpen(false);
        }
    }, [savedFiltersOptions]);

    // Reset des filtres
    const resetFilters = useCallback(() => {
        setFilters({
            searchQuery: '',
            dateRange: undefined,
            selectedUsers: [],
            selectedMetrics: [],
            selectedCategories: [],
            threshold: thresholdOptions?.initialValue || 0,
            savedPreset: undefined
        });
    }, [thresholdOptions]);

    // Mémoization des badges de filtre actifs
    const activeFilterLabels = useMemo(() => {
        const labels = [];

        if (filters.searchQuery) {
            labels.push({
                id: 'search',
                label: `Recherche: ${filters.searchQuery}`,
            });
        }

        if (filters.dateRange?.from) {
            const fromDate = filters.dateRange.from.toLocaleDateString();
            const toDate = filters.dateRange.to ? filters.dateRange.to.toLocaleDateString() : 'N/A';
            labels.push({
                id: 'date',
                label: `Période: ${fromDate} - ${toDate}`,
            });
        }

        if (filters.selectedUsers.length > 0) {
            const userLabels = userOptions?.options
                .filter(u => filters.selectedUsers.includes(u.id))
                .map(u => u.label)
                .join(', ');
            labels.push({
                id: 'users',
                label: `Personnel: ${userLabels}`,
            });
        }

        if (filters.selectedMetrics.length > 0) {
            const metricLabels = metricsOptions?.options
                .filter(m => filters.selectedMetrics.includes(m.id))
                .map(m => m.label)
                .join(', ');
            labels.push({
                id: 'metrics',
                label: `Métriques: ${metricLabels}`,
            });
        }

        if (filters.selectedCategories.length > 0) {
            const categoryLabels = categoryOptions?.options
                .filter(c => filters.selectedCategories.includes(c.id))
                .map(c => c.label)
                .join(', ');
            labels.push({
                id: 'categories',
                label: `Catégories: ${categoryLabels}`,
            });
        }

        if (filters.threshold > 0) {
            labels.push({
                id: 'threshold',
                label: `Seuil: ${filters.threshold}${thresholdOptions?.step && thresholdOptions.step < 1 ? '%' : ''}`,
            });
        }

        if (filters.savedPreset) {
            const presetName = savedFiltersOptions.find(p => p.id === filters.savedPreset)?.name || 'N/A';
            labels.push({
                id: 'preset',
                label: `Préréglage: ${presetName}`,
            });
        }

        return labels;
    }, [
        filters,
        userOptions,
        metricsOptions,
        categoryOptions,
        thresholdOptions,
        savedFiltersOptions
    ]);

    // Mémoization du contenu des différents popovers
    const userPopoverContent = useMemo(() =>
        userOptions?.options ? (
            <UserPopoverContent
                options={userOptions.options}
                selectedUsers={filters.selectedUsers}
                onUserSelection={handleUserSelection}
            />
        ) : null,
        [userOptions?.options, filters.selectedUsers, handleUserSelection]);

    const metricsPopoverContent = useMemo(() =>
        metricsOptions?.options ? (
            <MetricsPopoverContent
                options={metricsOptions.options}
                selectedMetrics={filters.selectedMetrics}
                onMetricSelection={handleMetricSelection}
            />
        ) : null,
        [metricsOptions?.options, filters.selectedMetrics, handleMetricSelection]);

    const categoryPopoverContent = useMemo(() =>
        categoryOptions?.options ? (
            <CategoryPopoverContent
                options={categoryOptions.options}
                selectedCategories={filters.selectedCategories}
                onCategorySelection={handleCategorySelection}
            />
        ) : null,
        [categoryOptions?.options, filters.selectedCategories, handleCategorySelection]);

    // Récupérer le nombre de filtres actifs
    const activeFiltersCount = activeFilterLabels.length;

    return (
        <div className="space-y-4">
            {/* Barre de recherche avec filtres */}
            <div className="flex flex-wrap gap-2">
                {/* Recherche */}
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                    {filters.searchQuery && (
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filtres de date */}
                {dateRangeOptions?.enabled && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className="hidden sm:inline">Période</span>
                                {filters.dateRange?.from && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal lg:hidden"
                                    >
                                        {filters.dateRange.from.getDate()}/{filters.dateRange.from.getMonth() + 1}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3">
                                <h4 className="font-medium mb-2">{dateRangeOptions.label || 'Sélectionner une période'}</h4>
                                <DateRangePicker
                                    value={filters.dateRange}
                                    onChange={handleDateRangeChange}
                                />
                            </div>
                            <Separator />
                            <div className="p-2 flex justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters(prev => ({ ...prev, dateRange: undefined }))}
                                >
                                    Réinitialiser
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => document.body.click()} // Ferme le popover
                                >
                                    Appliquer
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Filtre utilisateurs */}
                {userOptions?.enabled && (
                    <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">{userOptions.label || 'Utilisateurs'}</span>
                                {filters.selectedUsers.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {filters.selectedUsers.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                            {userPopoverContent}
                        </PopoverContent>
                    </Popover>
                )}

                {/* Filtre métriques */}
                {metricsOptions?.enabled && (
                    <Popover open={isMetricsPopoverOpen} onOpenChange={setIsMetricsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                <PieChart className="h-4 w-4" />
                                <span className="hidden sm:inline">{metricsOptions.label || 'Métriques'}</span>
                                {filters.selectedMetrics.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {filters.selectedMetrics.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                            {metricsPopoverContent}
                        </PopoverContent>
                    </Popover>
                )}

                {/* Filtre catégories */}
                {categoryOptions?.enabled && (
                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">{categoryOptions.label || 'Catégories'}</span>
                                {filters.selectedCategories.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {filters.selectedCategories.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                            {categoryPopoverContent}
                        </PopoverContent>
                    </Popover>
                )}

                {/* Filtre seuil */}
                {thresholdOptions?.enabled && (
                    <Popover open={isThresholdPopoverOpen} onOpenChange={setIsThresholdPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                <ArrowUpDown className="h-4 w-4" />
                                <span className="hidden sm:inline">{thresholdOptions.label || 'Seuil'}</span>
                                {filters.threshold !== thresholdOptions.initialValue && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {filters.threshold}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-4" align="start">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">{thresholdOptions.label || 'Définir un seuil'}</h4>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">{thresholdOptions.min}</span>
                                        <span className="text-sm font-medium">{filters.threshold}</span>
                                        <span className="text-sm">{thresholdOptions.max}</span>
                                    </div>
                                    <Slider
                                        value={[filters.threshold]}
                                        onValueChange={handleThresholdChange}
                                        min={thresholdOptions.min}
                                        max={thresholdOptions.max}
                                        step={thresholdOptions.step}
                                    />
                                </div>

                                <div className="flex justify-between pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFilters(prev => ({ ...prev, threshold: thresholdOptions.initialValue || 0 }))}
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsThresholdPopoverOpen(false)}
                                    >
                                        Appliquer
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Presets sauvegardés */}
                {saveFiltersEnabled && savedFiltersOptions.length > 0 && (
                    <Popover open={isPresetsPopoverOpen} onOpenChange={setIsPresetsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="secondary" size="sm" className="ml-auto">
                                Charger un preset
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px]" align="end">
                            <Command>
                                <CommandInput placeholder="Rechercher un preset..." />
                                <CommandList>
                                    <CommandEmpty>Aucun preset trouvé.</CommandEmpty>
                                    <CommandGroup>
                                        {savedFiltersOptions.map(preset => (
                                            <CommandItem
                                                key={preset.id}
                                                onSelect={() => handleLoadPreset(preset.id)}
                                                className="flex items-center gap-2"
                                            >
                                                {filters.savedPreset === preset.id && (
                                                    <Check className="h-4 w-4 text-primary" />
                                                )}
                                                <span className={filters.savedPreset === preset.id ? "font-medium" : ""}>
                                                    {preset.name}
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Sauvegarder les filtres */}
                {saveFiltersEnabled && onSaveFilters && (
                    <Popover open={isSavePopoverOpen} onOpenChange={setIsSavePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                Sauvegarder
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px]" align="end">
                            <div className="space-y-4 p-2">
                                <h4 className="font-medium">Sauvegarder les filtres</h4>
                                <Input
                                    placeholder="Nom du preset..."
                                    value={saveFilterName}
                                    onChange={handleSaveFilterNameChange}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        disabled={!saveFilterName.trim()}
                                        onClick={handleSaveFilters}
                                    >
                                        Sauvegarder
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Réinitialiser les filtres */}
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="ml-auto"
                    >
                        Réinitialiser
                    </Button>
                )}
            </div>

            {/* Affichage des filtres actifs */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                    {activeFilterLabels.map((label, index) => (
                        <Badge key={index} variant="outline" className="rounded-sm font-normal">
                            {label.label}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdvancedFilters; 