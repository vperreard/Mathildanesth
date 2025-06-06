'use client';

import React, { useCallback, useMemo, memo } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
// TODO: Install react-virtualized-auto-sizer or use alternative
// // TODO: Install react-virtualized-auto-sizer or use alternative
// import AutoSizer from 'react-virtualized-auto-sizer';
import { Attribution } from '@/types/attribution';
import { User } from '@/types/user';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VirtualizedPlanningGridProps {
    attributions: Attribution[];
    users: User[];
    startDate: Date;
    endDate: Date;
    onCellClick?: (userId: string, date: Date) => void;
    onAssignmentDrop?: (assignmentId: string, newUserId: string, newDate: Date) => void;
}

interface CellData {
    attributions: Attribution[];
    users: User[];
    startDate: Date;
    onCellClick?: (userId: string, date: Date) => void;
}

// Composant de cellule mémorisé pour éviter les re-renders inutiles
const PlanningCell = memo(({ 
    columnIndex, 
    rowIndex, 
    style, 
    data 
}: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: CellData;
}) => {
    const { attributions, users, startDate, onCellClick } = data;
    
    // Header row
    if (rowIndex === 0) {
        if (columnIndex === 0) {
            return (
                <div style={style} className="border-b border-r bg-muted p-2 font-semibold">
                    Utilisateurs
                </div>
            );
        }
        
        const date = addDays(startDate, columnIndex - 1);
        return (
            <div style={style} className="border-b border-r bg-muted p-2 text-center text-sm">
                <div className="font-semibold">{format(date, 'EEE', { locale: fr })}</div>
                <div className="text-muted-foreground">{format(date, 'dd/MM')}</div>
            </div>
        );
    }
    
    // User column
    if (columnIndex === 0) {
        const user = users[rowIndex - 1];
        if (!user) return null;
        
        return (
            <div style={style} className="border-b border-r bg-muted p-2 font-medium truncate">
                {user.firstName || user.prenom} {user.lastName || user.nom}
            </div>
        );
    }
    
    // Attribution cells
    const user = users[rowIndex - 1];
    const date = addDays(startDate, columnIndex - 1);
    
    if (!user) return null;
    
    const cellAssignments = attributions.filter(a => 
        a.userId === user.id && 
        isSameDay(new Date(a.startDate), date)
    );
    
    const handleClick = () => {
        if (onCellClick) {
            onCellClick(user.id, date);
        }
    };
    
    return (
        <div 
            style={style} 
            className={cn(
                "border-b border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                cellAssignments.length > 0 && "bg-primary/10"
            )}
            onClick={handleClick}
        >
            <div className="h-full w-full flex flex-col gap-1">
                {cellAssignments.map(attribution => (
                    <div
                        key={attribution.id}
                        className={cn(
                            "text-xs px-2 py-1 rounded truncate",
                            getAssignmentColor(attribution.shiftType)
                        )}
                        title={`${attribution.shiftType} - ${format(new Date(attribution.startDate), 'HH:mm')}`}
                    >
                        {getShiftAbbreviation(attribution.shiftType)}
                    </div>
                ))}
            </div>
        </div>
    );
});

PlanningCell.displayName = 'PlanningCell';

// Fonction pour obtenir la couleur selon le type de shift
function getAssignmentColor(shiftType: string): string {
    const colors: Record<string, string> = {
        'GARDE_24H': 'bg-red-200 text-red-800',
        'ASTREINTE': 'bg-yellow-200 text-yellow-800',
        'CONSULTATION': 'bg-blue-200 text-blue-800',
        'BLOC': 'bg-green-200 text-green-800',
        'MATIN': 'bg-purple-200 text-purple-800',
        'APRES_MIDI': 'bg-orange-200 text-orange-800',
    };
    return colors[shiftType] || 'bg-gray-200 text-gray-800';
}

// Fonction pour obtenir l'abréviation du shift
function getShiftAbbreviation(shiftType: string): string {
    const abbreviations: Record<string, string> = {
        'GARDE_24H': 'G24',
        'ASTREINTE': 'AST',
        'ASTREINTE_SEMAINE': 'AST-S',
        'ASTREINTE_WEEKEND': 'AST-WE',
        'CONSULTATION': 'CONS',
        'BLOC': 'BLOC',
        'MATIN': 'MAT',
        'APRES_MIDI': 'APM',
        'JOURNEE': 'JOUR',
    };
    return abbreviations[shiftType] || shiftType;
}

export function VirtualizedPlanningGrid({
    attributions,
    users,
    startDate,
    endDate,
    onCellClick,
    onAssignmentDrop
}: VirtualizedPlanningGridProps) {
    // Calculer le nombre de colonnes (jours + 1 pour la colonne des utilisateurs)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const columnCount = totalDays + 1;
    const rowCount = users.length + 1; // +1 pour la ligne d'en-tête

    // Tailles des colonnes et lignes
    const getColumnWidth = useCallback((index: number) => {
        return index === 0 ? 150 : 100; // Première colonne plus large pour les noms
    }, []);

    const getRowHeight = useCallback((index: number) => {
        return index === 0 ? 60 : 80; // En-tête plus petit
    }, []);

    // Données pour les cellules
    const itemData = useMemo(() => ({
        attributions,
        users,
        startDate,
        onCellClick
    }), [attributions, users, startDate, onCellClick]);

    return (
        <div className="w-full h-full border rounded-lg overflow-hidden bg-background">
            <AutoSizer>
                {({ height, width }) => (
                    <Grid
                        columnCount={columnCount}
                        columnWidth={getColumnWidth}
                        height={height}
                        rowCount={rowCount}
                        rowHeight={getRowHeight}
                        width={width}
                        itemData={itemData}
                        overscanColumnCount={5}
                        overscanRowCount={3}
                    >
                        {PlanningCell}
                    </Grid>
                )}
            </AutoSizer>
        </div>
    );
}

export default VirtualizedPlanningGrid;