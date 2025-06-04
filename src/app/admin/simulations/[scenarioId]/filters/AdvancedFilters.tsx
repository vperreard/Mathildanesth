"use client";

import React, { useState } from 'react';
import { Filter, Calendar, Users, Building2, RotateCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendrier';

export interface FilterOptions {
    dateRange: DateRange | undefined;
    serviceIds: string[];
    userIds: string[];
    resourceIds: string[];
    scoreThreshold: number | null;
    statuses: string[];
    savedFilterId?: string;
}

interface AdvancedFiltersProps {
    onApplyFilters: (filters: FilterOptions) => void;
    initialFilters?: Partial<FilterOptions>;
    scenarioId: string;
    isLoading?: boolean;
}

interface Service {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
}

interface Resource {
    id: string;
    name: string;
    type: string;
}

interface SavedFilter {
    id: string;
    name: string;
    filters: FilterOptions;
}

const mockServices: Service[] = [
    { id: '1', name: 'Anesthésie' },
    { id: '2', name: 'Chirurgie' },
    { id: '3', name: 'Urgences' },
    { id: '4', name: 'Bloc Opératoire' },
    { id: '5', name: 'Consultations' }
];

const mockUsers: User[] = [
    { id: '1', name: 'Dr. Dupont' },
    { id: '2', name: 'Dr. Martin' },
    { id: '3', name: 'Dr. Bernard' },
    { id: '4', name: 'Mme. Laurent' },
    { id: '5', name: 'M. Simon' }
];

const mockResources: Resource[] = [
    { id: '1', name: 'Salle A', type: 'OperatingRoom' },
    { id: '2', name: 'Salle B', type: 'OperatingRoom' },
    { id: '3', name: 'Bloc 1', type: 'OperatingRoom' },
    { id: '4', name: 'Unité de soins', type: 'Ward' },
    { id: '5', name: 'Consultation 3', type: 'ConsultationRoom' }
];

const mockSavedFilters: SavedFilter[] = [
    {
        id: '1',
        name: 'Période de vacances d\'été',
        filters: {
            dateRange: {
                from: new Date(2025, 6, 1),
                to: new Date(2025, 7, 31)
            },
            serviceIds: ['4'],
            userIds: [],
            resourceIds: [],
            scoreThreshold: null,
            statuses: ['COMPLETED']
        }
    },
    {
        id: '2',
        name: 'Équipe Anesthésie',
        filters: {
            dateRange: undefined,
            serviceIds: ['1'],
            userIds: ['1', '2'],
            resourceIds: [],
            scoreThreshold: 75,
            statuses: ['COMPLETED']
        }
    }
];

const defaultFilters: FilterOptions = {
    dateRange: undefined,
    serviceIds: [],
    userIds: [],
    resourceIds: [],
    scoreThreshold: null,
    statuses: ['COMPLETED']
};

export default function AdvancedFilters({
    onApplyFilters,
    initialFilters = {},
    isLoading = false
}: AdvancedFiltersProps) {
    const [filters, setFilters] = useState<FilterOptions>({
        ...defaultFilters,
        ...initialFilters
    });
    const [saveFilterName, setSaveFilterName] = useState('');
    const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false);
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(mockSavedFilters);

    // Gestionnaire de changement de période
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setFilters(prev => ({
            ...prev,
            dateRange: range
        }));
    };

    // Gestionnaire de changement de services
    const handleServiceChange = (serviceId: string) => {
        setFilters(prev => {
            const newServiceIds = prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId];

            return {
                ...prev,
                serviceIds: newServiceIds
            };
        });
    };

    // Gestionnaire de changement d'utilisateurs
    const handleUserChange = (userId: string) => {
        setFilters(prev => {
            const newUserIds = prev.userIds.includes(userId)
                ? prev.userIds.filter(id => id !== userId)
                : [...prev.userIds, userId];

            return {
                ...prev,
                userIds: newUserIds
            };
        });
    };

    // Gestionnaire de changement de ressources
    const handleResourceChange = (resourceId: string) => {
        setFilters(prev => {
            const newResourceIds = prev.resourceIds.includes(resourceId)
                ? prev.resourceIds.filter(id => id !== resourceId)
                : [...prev.resourceIds, resourceId];

            return {
                ...prev,
                resourceIds: newResourceIds
            };
        });
    };

    // Gestionnaire de changement de seuil de score
    const handleScoreThresholdChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            scoreThreshold: value ? parseInt(value) : null
        }));
    };

    // Gestionnaire de changement de statut
    const handleStatusChange = (status: string) => {
        setFilters(prev => {
            const newStatuses = prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status];

            return {
                ...prev,
                statuses: newStatuses
            };
        });
    };

    // Gestionnaire d'application des filtres
    const handleApplyFilters = () => {
        onApplyFilters(filters);
        toast.success('Filtres appliqués');
    };

    // Gestionnaire de réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters(defaultFilters);
        toast.info('Filtres réinitialisés');
    };

    // Gestionnaire de sauvegarde des filtres
    const handleSaveFilter = () => {
        if (!saveFilterName.trim()) {
            toast.error('Veuillez saisir un nom pour le filtre');
            return;
        }

        const newFilter: SavedFilter = {
            id: `saved-${Date.now()}`,
            name: saveFilterName.trim(),
            filters: { ...filters }
        };

        setSavedFilters([...savedFilters, newFilter]);
        setSaveFilterName('');
        setIsSaveFilterOpen(false);
        toast.success('Filtre sauvegardé');
    };

    // Gestionnaire de chargement d'un filtre enregistré
    const handleLoadSavedFilter = (filterId: string) => {
        const filter = savedFilters.find(f => f.id === filterId);
        if (filter) {
            setFilters(filter.filters);
            toast.success(`Filtre "${filter.name}" chargé`);
        }
    };

    // Formater la date pour l'affichage
    const formatDate = (date: Date): string => {
        return format(date, 'dd/MM/yyyy', { locale: fr });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtres avancés
                </CardTitle>
                <CardDescription>
                    Affinez les résultats de simulation selon vos critères
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Filtres sauvegardés */}
                    <div>
                        <Label>Filtres enregistrés</Label>
                        <div className="flex items-start gap-2 mt-2">
                            <Select onValueChange={handleLoadSavedFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionnez un filtre enregistré" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedFilters.map(filter => (
                                        <SelectItem key={filter.id} value={filter.id}>
                                            {filter.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Popover open={isSaveFilterOpen} onOpenChange={setIsSaveFilterOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                                        <Save className="h-4 w-4 mr-2" />
                                        Enregistrer
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Enregistrer le filtre</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="filter-name">Nom du filtre</Label>
                                            <Input
                                                id="filter-name"
                                                placeholder="ex: Période d'été 2025"
                                                value={saveFilterName}
                                                onChange={(e) => setSaveFilterName(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsSaveFilterOpen(false)}
                                            >
                                                Annuler
                                            </Button>
                                            <Button size="sm" onClick={handleSaveFilter}>
                                                Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Separator />

                    {/* Période */}
                    <Accordion type="single" collapsible defaultValue="period">
                        <AccordionItem value="period">
                            <AccordionTrigger className="hover:no-underline">
                                <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Période
                                    {filters.dateRange && filters.dateRange.from && filters.dateRange.to && (
                                        <Badge variant="outline" className="ml-2">
                                            {formatDate(filters.dateRange.from)} - {formatDate(filters.dateRange.to)}
                                        </Badge>
                                    )}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="border rounded-md p-3">
                                    <CalendarComponent
                                        initialFocus
                                        mode="range"
                                        defaultMonth={new Date()}
                                        selected={filters.dateRange}
                                        onSelect={handleDateRangeChange}
                                        numberOfMonths={2}
                                        locale={fr}
                                    />
                                </div>
                                {filters.dateRange && filters.dateRange.from && filters.dateRange.to && (
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        Période sélectionnée: {formatDate(filters.dateRange.from)} - {formatDate(filters.dateRange.to)}
                                    </div>
                                )}
                                <div className="mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDateRangeChange(undefined)}
                                    >
                                        Réinitialiser la période
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Services */}
                    <Accordion type="single" collapsible>
                        <AccordionItem value="services">
                            <AccordionTrigger className="hover:no-underline">
                                <span className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Services
                                    {filters.serviceIds.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {filters.serviceIds.length} sélectionné(s)
                                        </Badge>
                                    )}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                    {mockServices.map(service => (
                                        <div key={service.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`service-${service.id}`}
                                                checked={filters.serviceIds.includes(service.id)}
                                                onCheckedChange={() => handleServiceChange(service.id)}
                                            />
                                            <label
                                                htmlFor={`service-${service.id}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {service.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Personnel */}
                    <Accordion type="single" collapsible>
                        <AccordionItem value="users">
                            <AccordionTrigger className="hover:no-underline">
                                <span className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Personnel
                                    {filters.userIds.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {filters.userIds.length} sélectionné(s)
                                        </Badge>
                                    )}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                    {mockUsers.map(user => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={filters.userIds.includes(user.id)}
                                                onCheckedChange={() => handleUserChange(user.id)}
                                            />
                                            <label
                                                htmlFor={`user-${user.id}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {user.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Ressources */}
                    <Accordion type="single" collapsible>
                        <AccordionItem value="resources">
                            <AccordionTrigger className="hover:no-underline">
                                <span className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Ressources
                                    {filters.resourceIds.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {filters.resourceIds.length} sélectionné(s)
                                        </Badge>
                                    )}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                    {mockResources.map(resource => (
                                        <div key={resource.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`resource-${resource.id}`}
                                                checked={filters.resourceIds.includes(resource.id)}
                                                onCheckedChange={() => handleResourceChange(resource.id)}
                                            />
                                            <label
                                                htmlFor={`resource-${resource.id}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {resource.name} <span className="text-xs text-muted-foreground">({resource.type})</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Seuil de score */}
                    <div className="space-y-2">
                        <Label htmlFor="score-threshold">Score minimum (%)</Label>
                        <Input
                            id="score-threshold"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Ex: 75"
                            value={filters.scoreThreshold || ''}
                            onChange={(e) => handleScoreThresholdChange(e.target.value)}
                        />
                    </div>

                    {/* Statuts */}
                    <div className="space-y-2">
                        <Label>Statut</Label>
                        <div className="flex flex-wrap gap-2">
                            {['COMPLETED', 'RUNNING', 'PENDING', 'FAILED'].map(status => (
                                <div key={status} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`status-${status}`}
                                        checked={filters.statuses.includes(status)}
                                        onCheckedChange={() => handleStatusChange(status)}
                                    />
                                    <label
                                        htmlFor={`status-${status}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {status === 'COMPLETED' ? 'Terminé' :
                                            status === 'RUNNING' ? 'En cours' :
                                                status === 'PENDING' ? 'En attente' :
                                                    'Échoué'}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleResetFilters}
                >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                </Button>
                <Button
                    onClick={handleApplyFilters}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                            Chargement...
                        </>
                    ) : (
                        <>
                            <Filter className="h-4 w-4 mr-2" />
                            Appliquer
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
} 