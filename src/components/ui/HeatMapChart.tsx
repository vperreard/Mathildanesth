'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CellData {
    x: string;
    y: string;
    value: number;
    label?: string;
    description?: string;
}

interface HeatMapProps {
    title?: string;
    description?: string;
    data: CellData[];
    xAxisLabel?: string;
    yAxisLabel?: string;
    colorRanges?: ColorRange[];
    isLoading?: boolean;
    width?: number | string;
    height?: number | string;
    showLegend?: boolean;
    onCellClick?: (cell: CellData) => void;
}

interface ColorRange {
    min: number;
    max: number;
    color: string;
}

// Palette de couleurs par défaut
const DEFAULT_COLOR_RANGES: ColorRange[] = [
    { min: 0, max: 20, color: '#f3f4f6' },      // Gris très clair
    { min: 20, max: 40, color: '#dcfce7' },     // Vert très clair
    { min: 40, max: 60, color: '#86efac' },     // Vert clair
    { min: 60, max: 80, color: '#22c55e' },     // Vert
    { min: 80, max: 90, color: '#15803d' },     // Vert foncé
    { min: 90, max: 100, color: '#166534' },    // Vert très foncé
];

// Palette pour les surcharges
const OVERLOAD_COLOR_RANGES: ColorRange[] = [
    { min: 0, max: 60, color: '#f3f4f6' },      // Gris très clair
    { min: 60, max: 80, color: '#fef9c3' },     // Jaune très clair
    { min: 80, max: 90, color: '#fde047' },     // Jaune
    { min: 90, max: 100, color: '#facc15' },    // Jaune foncé
    { min: 100, max: 110, color: '#f97316' },   // Orange
    { min: 110, max: 500, color: '#dc2626' },   // Rouge
];

const PALETTE_OPTIONS = [
    { id: 'default', name: 'Standard', ranges: DEFAULT_COLOR_RANGES },
    { id: 'overload', name: 'Surcharge', ranges: OVERLOAD_COLOR_RANGES },
];

const HeatMapChart = ({
    title = 'Carte de chaleur',
    description = 'Visualisation de la charge de travail',
    data,
    xAxisLabel = 'Période',
    yAxisLabel = 'Ressource',
    colorRanges = DEFAULT_COLOR_RANGES,
    isLoading = false,
    width = '100%',
    height = 400,
    showLegend = true,
    onCellClick
}: HeatMapProps) => {
    const [hoverCell, setHoverCell] = useState<CellData | null>(null);
    const [selectedPalette, setSelectedPalette] = useState<string>('default');

    // Extraire les valeurs uniques des axes X et Y
    const xValues = useMemo(() => {
        return [...new Set(data.map(item => item.x))].sort();
    }, [data]);

    const yValues = useMemo(() => {
        return [...new Set(data.map(item => item.y))].sort();
    }, [data]);

    // Déterminer la couleur de la cellule en fonction de sa valeur
    const getCellColor = (value: number, ranges: ColorRange[]) => {
        const range = ranges.find(r => value >= r.min && value < r.max);
        return range ? range.color : ranges[ranges.length - 1].color;
    };

    // Obtenir le texte de la cellule
    const getCellText = (value: number) => {
        if (value === 0) return '-';
        return `${value}%`;
    };

    // Calculer la largeur et la hauteur des cellules
    const cellWidth = `calc(${100 / (xValues.length || 1)}%)`;
    const cellHeight = 40;  // hauteur fixe, en pixels

    // Utilisez la palette sélectionnée
    const activePalette = useMemo(() => {
        const palette = PALETTE_OPTIONS.find(p => p.id === selectedPalette);
        return palette ? palette.ranges : DEFAULT_COLOR_RANGES;
    }, [selectedPalette]);

    // Préparation des données pour l'affichage sous forme de grille
    const gridData = useMemo(() => {
        const grid: (CellData | null)[][] = [];

        // Initialiser la grille avec des valeurs nulles
        for (let i = 0; i < yValues.length; i++) {
            grid[i] = [];
            for (let j = 0; j < xValues.length; j++) {
                grid[i][j] = null;
            }
        }

        // Remplir la grille avec les données
        data.forEach(item => {
            const rowIndex = yValues.indexOf(item.y);
            const colIndex = xValues.indexOf(item.x);
            if (rowIndex >= 0 && colIndex >= 0) {
                grid[rowIndex][colIndex] = item;
            }
        });

        return grid;
    }, [data, xValues, yValues]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-8 w-1/3" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-2/3" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <div style={{ height: height, width: width }} className="relative">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={selectedPalette} onValueChange={setSelectedPalette}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Palette de couleurs" />
                            </SelectTrigger>
                            <SelectContent>
                                {PALETTE_OPTIONS.map((palette) => (
                                    <SelectItem key={palette.id} value={palette.id}>
                                        {palette.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle size={18} className="text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>Palette "Standard" : Mesure la couverture à partir de 0% (vide) à 100% (couverture complète).</p>
                                    <p className="mt-1">Palette "Surcharge" : Inclut les valeurs au-delà de 100% pour identifier les surcharges.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col" style={{ height, width, overflow: 'auto' }}>
                    {/* En-têtes des colonnes (axe X) */}
                    <div className="flex pl-24">
                        {xValues.map((value, index) => (
                            <div
                                key={`header-${index}`}
                                className="flex-shrink-0 text-center text-xs font-medium text-gray-600 pb-1"
                                style={{ width: cellWidth }}
                            >
                                {value}
                            </div>
                        ))}
                    </div>

                    {/* Grille principale avec les noms des lignes (axe Y) */}
                    <div className="flex-grow overflow-auto">
                        {gridData.map((row, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="flex items-center h-10 mb-px">
                                <div className="flex-shrink-0 w-24 pr-2 text-xs font-medium text-gray-600 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                                    {yValues[rowIndex]}
                                </div>
                                <div className="flex flex-grow">
                                    {row.map((cell, colIndex) => {
                                        // Valeur par défaut si la cellule est null
                                        const value = cell ? cell.value : 0;
                                        const cellColor = getCellColor(value, activePalette);
                                        const cellText = getCellText(value);

                                        return (
                                            <div
                                                key={`cell-${rowIndex}-${colIndex}`}
                                                className="flex-shrink-0 flex items-center justify-center border border-gray-200 text-xs font-medium relative cursor-pointer transition-all duration-100"
                                                style={{
                                                    width: cellWidth,
                                                    height: `${cellHeight}px`,
                                                    backgroundColor: cellColor,
                                                }}
                                                onMouseEnter={() => cell && setHoverCell(cell)}
                                                onMouseLeave={() => setHoverCell(null)}
                                                onClick={() => cell && onCellClick && onCellClick(cell)}
                                            >
                                                {cellText}

                                                {/* Tooltip informatif au survol */}
                                                {hoverCell === cell && cell && (
                                                    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
                                                        <div><strong>{cell.x} - {cell.y}</strong></div>
                                                        <div>Valeur: {cell.value}%</div>
                                                        {cell.description && <div>{cell.description}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showLegend && (
                    <div className="mt-4 flex items-center">
                        <span className="text-xs text-gray-600 mr-2">Légende:</span>
                        <div className="flex items-center">
                            {activePalette.map((range, index) => (
                                <div key={`legend-${index}`} className="flex items-center mx-1">
                                    <div
                                        className="w-4 h-4 mr-1 border border-gray-300"
                                        style={{ backgroundColor: range.color }}
                                    ></div>
                                    <span className="text-xs text-gray-600">{range.min}-{range.max}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HeatMapChart; 