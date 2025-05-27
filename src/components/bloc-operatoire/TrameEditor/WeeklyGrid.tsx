'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DayOfWeek, Period } from '@prisma/client';
import {
    WeeklyGridData,
    EditorAffectation,
    GridCell,
    ThemeColors,
    ActivityTypeColor
} from './types';
import useDragDrop from './hooks/useDragDrop';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, User, Settings } from 'lucide-react';

interface WeeklyGridProps {
    gridData: WeeklyGridData;
    affectations: EditorAffectation[];
    onAffectationMove: (affectationId: number, target: any) => void;
    onAffectationSelect: (affectationId: number) => void;
    onCellClick: (jourSemaine: DayOfWeek, periode: Period, roomId?: number) => void;
    selectedAffectations: number[];
    themeColors?: ThemeColors;
    readOnly?: boolean;
}

// Couleurs par défaut pour les types d'activité
const defaultActivityColors: Record<string, ActivityTypeColor> = {
    'bloc-anesthesie': {
        activityTypeId: 'bloc-anesthesie',
        backgroundColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        hoverColor: 'hover:bg-blue-200'
    },
    'bloc-supervision': {
        activityTypeId: 'bloc-supervision',
        backgroundColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-300',
        hoverColor: 'hover:bg-purple-200'
    },
    'consultation': {
        activityTypeId: 'consultation',
        backgroundColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        hoverColor: 'hover:bg-green-200'
    },
    'garde': {
        activityTypeId: 'garde',
        backgroundColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        hoverColor: 'hover:bg-red-200'
    }
};

// Traduction des jours de la semaine
const dayLabels: Record<DayOfWeek, string> = {
    [DayOfWeek.MONDAY]: 'Lundi',
    [DayOfWeek.TUESDAY]: 'Mardi',
    [DayOfWeek.WEDNESDAY]: 'Mercredi',
    [DayOfWeek.THURSDAY]: 'Jeudi',
    [DayOfWeek.FRIDAY]: 'Vendredi',
    [DayOfWeek.SATURDAY]: 'Samedi',
    [DayOfWeek.SUNDAY]: 'Dimanche'
};

// Traduction des périodes
const periodLabels: Record<Period, string> = {
    [Period.MATIN]: 'Matin',
    [Period.APRES_MIDI]: 'Après-midi',
    [Period.JOURNEE_ENTIERE]: 'Journée entière'
};

// Composant pour une affectation individuelle
const AffectationCard: React.FC<{
    affectation: EditorAffectation;
    index: number;
    isSelected: boolean;
    isDragging: boolean;
    colors: ActivityTypeColor;
    onSelect: () => void;
    readOnly?: boolean;
}> = ({ affectation, index, isSelected, isDragging, colors, onSelect, readOnly = false }) => {
    const dragId = `affectation-${affectation.id}`;

    return (
        <Draggable
            draggableId={dragId}
            index={index}
            isDragDisabled={readOnly}
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
            ${colors.backgroundColor} ${colors.textColor} ${colors.borderColor}
            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            ${snapshot.isDragging ? 'shadow-lg z-50 scale-105 rotate-2' : 'shadow-sm'}
            ${readOnly ? 'cursor-default' : 'cursor-grab'}
            ${snapshot.isDragging ? 'cursor-grabbing' : ''}
            border rounded-lg p-2 mb-2 transition-all duration-200
            ${!readOnly ? colors.hoverColor : ''}
          `}
                    onClick={onSelect}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                            {affectation.activityType?.name && (
                                <Badge variant="secondary" className="text-xs">
                                    {affectation.activityType.name}
                                </Badge>
                            )}
                            {affectation.hasConflict && (
                                <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs opacity-70">
                            <Clock className="w-3 h-3" />
                            <span>{periodLabels[affectation.periode]}</span>
                        </div>
                    </div>

                    {affectation.operatingRoom && (
                        <div className="text-xs font-medium mb-1">
                            Salle {affectation.operatingRoom.name}
                        </div>
                    )}

                    {affectation.personnelRequis && affectation.personnelRequis.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                            <User className="w-3 h-3" />
                            <span>{affectation.personnelRequis.length} pers.</span>
                        </div>
                    )}

                    {affectation.conflictDetails && affectation.conflictDetails.length > 0 && (
                        <div className="mt-1 text-xs text-yellow-700">
                            {affectation.conflictDetails.length} conflit(s)
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

// Composant pour une cellule de la grille
const GridCellComponent: React.FC<{
    cell: GridCell;
    affectations: EditorAffectation[];
    onCellClick: () => void;
    onAffectationSelect: (id: number) => void;
    selectedAffectations: number[];
    themeColors: Record<string, ActivityTypeColor>;
    readOnly?: boolean;
}> = ({
    cell,
    affectations,
    onCellClick,
    onAffectationSelect,
    selectedAffectations,
    themeColors,
    readOnly = false
}) => {
        const droppableId = `cell-${cell.jourSemaine}-${cell.periode}${cell.roomId ? `-${cell.roomId}` : ''}`;

        return (
            <Droppable droppableId={droppableId} isDropDisabled={readOnly}>
                {(provided, snapshot) => (
                    <motion.div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
            min-h-[120px] p-2 border rounded-lg transition-all duration-200
            ${snapshot.isDraggingOver
                                ? cell.conflictLevel === 'error'
                                    ? 'bg-red-50 border-red-300 border-2 border-dashed'
                                    : 'bg-green-50 border-green-300 border-2 border-dashed'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }
            ${cell.isHighlighted ? 'ring-2 ring-blue-300' : ''}
            ${!readOnly ? 'cursor-pointer' : ''}
          `}
                        onClick={onCellClick}
                        whileHover={!readOnly ? { scale: 1.01 } : {}}
                    >
                        <AnimatePresence mode="popLayout">
                            {affectations.map((affectation, index) => {
                                const colors = themeColors[affectation.activityTypeId] || defaultActivityColors['bloc-anesthesie'];
                                const isSelected = selectedAffectations.includes(affectation.id!);

                                return (
                                    <AffectationCard
                                        key={affectation.id}
                                        affectation ={ affectation }
                                        index={index}
                                        isSelected={isSelected}
                                        isDragging={false}
                                        colors={colors}
                                        onSelect={() => onAffectationSelect(affectation.id!)}
                                        readOnly={readOnly}
                                    />
                                );
                            })}
                        </AnimatePresence>
                        {provided.placeholder}

                        {affectations.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                <div className="text-center">
                                    <Settings className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                    <div>Déposer ici</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </Droppable>
        );
    };

// Composant principal de la grille
export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
    gridData,
    affectations,
    onAffectationMove,
    onAffectationSelect,
    onCellClick,
    selectedAffectations,
    themeColors,
    readOnly = false
}) => {
    const { handleDragStart, handleDragUpdate, handleDragEnd } = useDragDrop({
        onDrop: (dragItem, dropTarget) => {
            const affectationId = parseInt(dragItem.id.split('-')[1]);
            onAffectationMove(affectationId, dropTarget);
        }
    });

    // Grouper les affectations par cellule
    const cellAffectations = useMemo(() => {
        const grouped: Record<string, EditorAffectation[]> = {};

        affectations.forEach(affectation => {
            const key = `${affectation.jourSemaine}-${affectation.periode}${affectation.operatingRoomId ? `-${affectation.operatingRoomId}` : ''}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(affectation);
        });

        return grouped;
    }, [affectations]);

    // Créer les couleurs de thème
    const colors = useMemo(() => {
        const activityColors: Record<string, ActivityTypeColor> = {};

        if (themeColors?.activityTypes) {
            themeColors.activityTypes.forEach(color => {
                activityColors[color.activityTypeId] = color;
            });
        }

        return { ...defaultActivityColors, ...activityColors };
    }, [themeColors]);

    return (
        <div className="w-full overflow-auto">
            <DragDropContext
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
                onDragEnd={handleDragEnd}
            >
                {/* En-têtes des jours */}
                <div className="grid grid-cols-6 gap-2 mb-4">
                    <div className="p-3 text-center font-medium bg-gray-100 rounded-lg">
                        Période
                    </div>
                    {gridData.days.map(day => (
                        <motion.div
                            key={day}
                            className="p-3 text-center font-medium bg-blue-50 rounded-lg"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="text-sm text-blue-800">
                                {dayLabels[day]}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                {format(
                                    new Date(gridData.weekStart.getTime() +
                                        Object.values(DayOfWeek).indexOf(day) * 24 * 60 * 60 * 1000
                                    ),
                                    'dd/MM',
                                    { locale: fr }
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Grille des périodes */}
                {gridData.periods.map(periode => (
                    <motion.div
                        key={periode}
                        className="grid grid-cols-6 gap-2 mb-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Label de la période */}
                        <div className="p-3 text-center font-medium bg-gray-100 rounded-lg flex items-center justify-center">
                            <div>
                                <div className="text-sm">{periodLabels[periode]}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {periode === Period.MATIN ? '08:00-12:00' : '13:00-17:00'}
                                </div>
                            </div>
                        </div>

                        {/* Cellules pour chaque jour */}
                        {gridData.days.map(day => {
                            const cellKey = `${day}-${periode}`;
                            const cellAffectationsForDay = cellAffectations[cellKey] || [];

                            const cell: GridCell = {
                                jourSemaine: day,
                                periode,
                                affectations: cellAffectationsForDay,
                                isDropTarget: false,
                                isHighlighted: false,
                                conflictLevel: cellAffectationsForDay.some(aff => aff.hasConflict) ? 'warning' : 'none'
                            };

                            return (
                                <GridCellComponent
                                    key={cellKey}
                                    cell={cell}
                                    affectations={cellAffectationsForDay}
                                    onCellClick={() => onCellClick(day, periode)}
                                    onAffectationSelect={onAffectationSelect}
                                    selectedAffectations={selectedAffectations}
                                    themeColors={colors}
                                    readOnly={readOnly}
                                />
                            );
                        })}
                    </motion.div>
                ))}
            </DragDropContext>
        </div>
    );
};

export default WeeklyGrid; 