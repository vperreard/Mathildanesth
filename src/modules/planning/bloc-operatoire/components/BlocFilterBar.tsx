'use client';

import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { SECTOR_CATEGORY_TYPES, SECTOR_CATEGORY_LABELS } from '../constants/sectorCategoryTypes';
import { ROOM_TYPES, ROOM_TYPE_LABELS } from '../constants/roomTypes';

export interface BlocFilters {
    sectorCategory?: string | null;
    roomType?: string | null;
    isActive?: boolean | null;
}

interface BlocFilterBarProps {
    onFilterChange: (filters: BlocFilters) => void;
    initialFilters?: BlocFilters;
    className?: string;
}

export function BlocFilterBar({
    onFilterChange,
    initialFilters = {},
    className = ''
}: BlocFilterBarProps) {
    const [filters, setFilters] = useState<BlocFilters>(initialFilters);
    const [expanded, setExpanded] = useState(false);

    const handleFilterChange = (key: keyof BlocFilters, value: string | null) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const resetFilters = () => {
        const emptyFilters: BlocFilters = {
            sectorCategory: null,
            roomType: null,
            isActive: null
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    // Calculer le nombre de filtres actifs pour l'afficher
    const activeFiltersCount = Object.values(filters).filter(val => val !== null && val !== undefined).length;

    return (
        <Card className={`p-3 mb-4 ${className}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-semibold">Filtres</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    {activeFiltersCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-xs"
                        >
                            <X className="h-3 w-3 mr-1" /> Réinitialiser
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs"
                    >
                        {expanded ? 'Masquer' : 'Afficher'}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {/* Filtre par catégorie de secteur */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Catégorie de secteur
                        </label>
                        <Select
                            value={filters.sectorCategory || ''}
                            onValueChange={(value) => handleFilterChange('sectorCategory', value || null)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Toutes les catégories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Toutes les catégories</SelectItem>
                                {Object.entries(SECTOR_CATEGORY_TYPES).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>
                                        {SECTOR_CATEGORY_LABELS[key as keyof typeof SECTOR_CATEGORY_LABELS]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre par type de salle */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Type de salle
                        </label>
                        <Select
                            value={filters.roomType || ''}
                            onValueChange={(value) => handleFilterChange('roomType', value || null)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Tous les types</SelectItem>
                                {Object.entries(ROOM_TYPES).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>
                                        {ROOM_TYPE_LABELS[key as keyof typeof ROOM_TYPE_LABELS]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre par statut */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Statut
                        </label>
                        <Select
                            value={filters.isActive === null ? '' : String(filters.isActive)}
                            onValueChange={(value) => {
                                const isActive = value === '' ? null : value === 'true';
                                handleFilterChange('isActive', isActive as any);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Tous les statuts</SelectItem>
                                <SelectItem value="true">Actif</SelectItem>
                                <SelectItem value="false">Inactif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </Card>
    );
} 