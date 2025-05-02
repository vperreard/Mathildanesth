'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    MultiSelect,
    MultiSelectItem
} from '@/components/ui/multi-select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { LeaveType } from '../../types/leave';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import { useDepartments } from '@/hooks/useDepartments';
import { QuotaTransferReportOptions } from '../../types/quota';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { Filter, RotateCcw } from 'lucide-react';

interface ReportFilterPanelProps {
    currentFilters: QuotaTransferReportOptions;
    onApplyFilters: (filters: QuotaTransferReportOptions) => void;
    onResetFilters: () => void;
}

/**
 * Composant de filtrage pour les rapports de transferts de quotas
 */
export function ReportFilterPanel({ currentFilters, onApplyFilters, onResetFilters }: ReportFilterPanelProps) {
    // Récupérer les types de congés et les départements
    const { leaveTypes } = useLeaveTypes();
    const { departments } = useDepartments();

    // Initialiser les filtres locaux
    const [filters, setFilters] = useState<QuotaTransferReportOptions>({
        ...currentFilters
    });

    // Périodes prédéfinies
    const predefinedPeriods = [
        { id: 'last-month', label: 'Dernier mois', startDate: subMonths(new Date(), 1), endDate: new Date() },
        { id: 'last-3-months', label: 'Derniers 3 mois', startDate: subMonths(new Date(), 3), endDate: new Date() },
        { id: 'last-6-months', label: 'Derniers 6 mois', startDate: subMonths(new Date(), 6), endDate: new Date() },
        { id: 'last-year', label: 'Dernière année', startDate: subMonths(new Date(), 12), endDate: new Date() },
        { id: 'year-to-date', label: 'Année en cours', startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date() },
    ];

    // Options de statut
    const statusOptions = [
        { value: 'PENDING', label: 'En attente' },
        { value: 'APPROVED', label: 'Approuvé' },
        { value: 'REJECTED', label: 'Refusé' },
        { value: 'CANCELLED', label: 'Annulé' }
    ];

    // Options de groupement
    const groupByOptions = [
        { value: 'user', label: 'Utilisateur' },
        { value: 'department', label: 'Département' },
        { value: 'leaveType', label: 'Type de congé' },
        { value: 'month', label: 'Mois' }
    ];

    // Mettre à jour les filtres quand les filtres actuels changent
    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    /**
     * Met à jour un filtre
     */
    const updateFilter = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    /**
     * Applique une période prédéfinie
     */
    const applyPredefinedPeriod = (periodId: string) => {
        const period = predefinedPeriods.find(p => p.id === periodId);
        if (period) {
            setFilters(prev => ({
                ...prev,
                startDate: format(period.startDate, 'yyyy-MM-dd'),
                endDate: format(period.endDate, 'yyyy-MM-dd')
            }));
        }
    };

    /**
     * Réinitialise les filtres
     */
    const handleReset = () => {
        onResetFilters();
    };

    /**
     * Applique les filtres
     */
    const handleApply = () => {
        onApplyFilters(filters);
    };

    return (
        <div className="space-y-4">
            <Accordion type="single" collapsible defaultValue="period">
                <AccordionItem value="period">
                    <AccordionTrigger>Période</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Date de début</Label>
                                    <DatePicker
                                        id="startDate"
                                        value={filters.startDate ? new Date(filters.startDate) : undefined}
                                        onChange={(date) => updateFilter('startDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Date de fin</Label>
                                    <DatePicker
                                        id="endDate"
                                        value={filters.endDate ? new Date(filters.endDate) : undefined}
                                        onChange={(date) => updateFilter('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Périodes prédéfinies</Label>
                                <div className="flex flex-wrap gap-2">
                                    {predefinedPeriods.map(period => (
                                        <Button
                                            key={period.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPredefinedPeriod(period.id)}
                                        >
                                            {period.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="leaveTypes">
                    <AccordionTrigger>Types de congés</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="leaveTypes">Filtrer par types de congés</Label>
                            <MultiSelect
                                id="leaveTypes"
                                value={filters.leaveTypes || []}
                                onChange={(value) => updateFilter('leaveTypes', value)}
                                placeholder="Sélectionner les types de congés"
                            >
                                {leaveTypes.map(type => (
                                    <MultiSelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MultiSelectItem>
                                ))}
                            </MultiSelect>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="departments">
                    <AccordionTrigger>Départements</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="departments">Filtrer par départements</Label>
                            <MultiSelect
                                id="departments"
                                value={filters.departments || []}
                                onChange={(value) => updateFilter('departments', value)}
                                placeholder="Sélectionner les départements"
                            >
                                {departments.map(dept => (
                                    <MultiSelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </MultiSelectItem>
                                ))}
                            </MultiSelect>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="status">
                    <AccordionTrigger>Statut</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="status">Filtrer par statut</Label>
                            <MultiSelect
                                id="status"
                                value={filters.status || []}
                                onChange={(value) => updateFilter('status', value)}
                                placeholder="Sélectionner les statuts"
                            >
                                {statusOptions.map(status => (
                                    <MultiSelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </MultiSelectItem>
                                ))}
                            </MultiSelect>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="groupBy">
                    <AccordionTrigger>Regroupement</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="groupBy">Regrouper par</Label>
                            <Select
                                value={filters.groupBy}
                                onValueChange={(value) => updateFilter('groupBy', value)}
                            >
                                <SelectTrigger id="groupBy">
                                    <SelectValue placeholder="Sélectionner un regroupement" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groupByOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Separator className="my-4" />

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleReset}
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Réinitialiser
                </Button>

                <Button
                    variant="default"
                    onClick={handleApply}
                >
                    <Filter className="mr-2 h-4 w-4" />
                    Appliquer les filtres
                </Button>
            </div>
        </div>
    );
} 