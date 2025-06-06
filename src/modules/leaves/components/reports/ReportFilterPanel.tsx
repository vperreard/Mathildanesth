'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePickerComponent as DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
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

    /**
     * Met à jour un filtre
     */
    const updateFilter = (key: string, value: unknown) => {
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
                                        selected={filters.startDate ? new Date(filters.startDate) : null}
                                        onSelect={(date: Date | null) => updateFilter('startDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Date de fin</Label>
                                    <DatePicker
                                        selected={filters.endDate ? new Date(filters.endDate) : null}
                                        onSelect={(date: Date | null) => updateFilter('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
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

                {/* Types de congés (Commenté temporairement) */}
                {/*
                <AccordionItem value="leaveTypes">
                    <AccordionTrigger>Types de congés</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="leaveTypes">Types de congés</Label>
                            <MultiSelect
                                id="leaveTypes"
                                value={filters.leaveTypes || []}
                                onChange={(value) => updateFilter('leaveTypes', value)}
                                placeholder="Tous les types"
                            >
                                {Object.values(LeaveType).map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {getLeaveTypeLabel(type)}
                                    </SelectItem>
                                ))}
                            </MultiSelect>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                */}

                <AccordionItem value="departments">
                    <AccordionTrigger>Départements</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="departments">Filtrer par départements</Label>
                            <MultiSelect
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                                selected={filters.departments || []}
                                onChange={(value: string[]) => updateFilter('departments', value)}
                                placeholder="Filtrer par départements"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="status">
                    <AccordionTrigger>Statut</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <Label htmlFor="status">Filtrer par statut</Label>
                            <MultiSelect
                                options={statusOptions}
                                selected={filters.status || []}
                                onChange={(value: string[]) => updateFilter('status', value)}
                                placeholder="Filtrer par statut"
                            />
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