'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePicker } from '@/components/ui/date-picker'; // ACTION UTILISATEUR: Décommentez et vérifiez ce chemin/nom
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/input'; // Correction: import par défaut pour Input

interface Site {
    id: string;
    name: string;
    // Ajoutez d'autres propriétés de site si nécessaire
}

export interface RoomUsageFiltersState {
    siteId?: string;
    startDate?: Date;
    endDate?: Date;
}

interface RoomUsageFiltersProps {
    initialFilters?: RoomUsageFiltersState;
    onFiltersChange: (filters: RoomUsageFiltersState) => void;
    sites: Site[];
    isLoadingSites: boolean;
}

export function RoomUsageFilters({ initialFilters = {}, onFiltersChange, sites, isLoadingSites }: RoomUsageFiltersProps) {
    const [siteId, setSiteId] = useState<string | undefined>(initialFilters.siteId);
    const [startDateStr, setStartDateStr] = useState<string>(
        initialFilters.startDate ? initialFilters.startDate.toISOString().split('T')[0] : ''
    );
    const [endDateStr, setEndDateStr] = useState<string>(
        initialFilters.endDate ? initialFilters.endDate.toISOString().split('T')[0] : ''
    );

    useEffect(() => {
        const currentInitialSiteId = initialFilters.siteId;
        if (currentInitialSiteId && sites.some(s => s.id === currentInitialSiteId)) {
            if (siteId !== currentInitialSiteId) {
                setSiteId(currentInitialSiteId);
            }
        } else if (siteId && !sites.some(s => s.id === siteId)) {
            setSiteId(undefined);
        }
        // Ne pas sélectionner automatiquement le premier site pour forcer un choix utilisateur.
        // Si aucun site n'est initialement défini et qu'aucun n'est sélectionné,
        // et que la liste des sites est disponible, l'utilisateur devra choisir.
    }, [initialFilters.siteId, sites, siteId]);

    const handleApplyFilters = () => {
        if (!siteId) {
            alert("Veuillez sélectionner un site.");
            return;
        }
        if (!startDateStr || !endDateStr) {
            alert("Veuillez sélectionner une date de début et une date de fin.");
            return;
        }
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            alert("Les dates sélectionnées ne sont pas valides. Utilisez le format AAAA-MM-JJ.");
            return;
        }

        if (endDate < startDate) {
            alert("La date de fin ne peut pas être antérieure à la date de début.");
            return;
        }
        onFiltersChange({ siteId, startDate, endDate });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filtres du Rapport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label htmlFor="site-select">Site</Label>
                        <Select value={siteId} onValueChange={setSiteId} disabled={isLoadingSites || sites.length === 0}>
                            <SelectTrigger id="site-select">
                                <SelectValue placeholder="Sélectionner un site" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingSites && <SelectItem value="loading" disabled>Chargement des sites...</SelectItem>}
                                {!isLoadingSites && sites.length === 0 && <SelectItem value="no-sites" disabled>Aucun site disponible.</SelectItem>}
                                {sites.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="start-date">Date de début</Label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDateStr}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDateStr(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="end-date">Date de fin</Label>
                        <Input
                            type="date"
                            id="end-date"
                            value={endDateStr}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDateStr(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handleApplyFilters} className="w-full md:w-auto" disabled={isLoadingSites}>Appliquer les filtres</Button>
            </CardContent>
        </Card>
    );
} 