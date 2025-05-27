'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayOfWeek, Period } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Save,
    Undo,
    Redo,
    Plus,
    Filter,
    Calendar,
    Settings,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';

import { useTrameEditor } from './hooks/useTrameEditor';
import { useUndoRedo } from './hooks/useUndoRedo';
import { WeeklyGrid } from './WeeklyGrid';
import { CreateAffectationDialog } from '../dialogs/CreateAffectationDialog';
import {
    TrameEditorConfig,
    EditorAffectation,
    TrameEditorFilters,
    UseTrameEditorOptions
} from './types';

interface TrameEditorProps {
    trameModeleId?: number;
    config?: Partial<TrameEditorConfig>;
    onSave?: (affectations: EditorAffectation[]) => void;
    onCancel?: () => void;
    readOnly?: boolean;
    className?: string;
}

// Composant pour la barre d'outils
const ToolBar: React.FC<{
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onAddAffectation: () => void;
    onToggleFilters: () => void;
    onToggleConflicts: () => void;
    showConflicts: boolean;
    readOnly?: boolean;
}> = ({
    hasUnsavedChanges,
    isSaving,
    onSave,
    onUndo,
    onRedo,
    onAddAffectation,
    onToggleFilters,
    onToggleConflicts,
    showConflicts,
    readOnly = false
}) => (
        <motion.div
            className="flex items-center justify-between p-4 bg-white border-b border-gray-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">
                    Éditeur de Trames
                </h2>
                {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Non sauvegardé
                    </Badge>
                )}
            </div>

            <div className="flex items-center space-x-2">
                {!readOnly && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onUndo}
                            disabled={isSaving || !canUndo}
                            title={canUndo ? 'Annuler' : 'Aucune action à annuler'}
                        >
                            <Undo className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRedo}
                            disabled={isSaving || !canRedo}
                            title={canRedo ? 'Rétablir' : 'Aucune action à rétablir'}
                        >
                            <Redo className="w-4 h-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAddAffectation}
                            disabled={isSaving}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Ajouter
                        </Button>
                    </>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleFilters}
                >
                    <Filter className="w-4 h-4 mr-1" />
                    Filtres
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleConflicts}
                    className={showConflicts ? 'bg-yellow-50 text-yellow-700' : ''}
                >
                    {showConflicts ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    Conflits
                </Button>

                {!readOnly && (
                    <>
                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            onClick={onSave}
                            disabled={!hasUnsavedChanges || isSaving}
                            size="sm"
                        >
                            <Save className="w-4 h-4 mr-1" />
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );

// Composant pour le panel d'informations
const InfoPanel: React.FC<{
    trameModele: any;
    selectedAffectations: EditorAffectation[];
    conflicts: any[];
    totalAffectations: number;
}> = ({ trameModele, selectedAffectations, conflicts, totalAffectations }) => (
    <motion.div
        className="p-4 bg-gray-50 border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
    >
        <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
                <div className="text-gray-600">Trame</div>
                <div className="font-medium">
                    {trameModele?.name || 'Nouvelle trame'}
                </div>
            </div>

            <div>
                <div className="text-gray-600">Affectations</div>
                <div className="font-medium">{totalAffectations}</div>
            </div>

            <div>
                <div className="text-gray-600">Sélectionnées</div>
                <div className="font-medium">{selectedAffectations.length}</div>
            </div>

            <div>
                <div className="text-gray-600">Conflits</div>
                <div className={`font-medium ${conflicts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {conflicts.length}
                    {conflicts.length > 0 && (
                        <AlertTriangle className="w-4 h-4 inline ml-1" />
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);

// Composant principal
export const TrameEditor: React.FC<TrameEditorProps> = ({
    trameModeleId,
    config,
    onSave,
    onCancel,
    readOnly = false,
    className = ""
}) => {
    // État local
    const [showFilters, setShowFilters] = useState(false);
    const [showConflicts, setShowConflicts] = useState(true);
    const [selectedAffectations, setSelectedAffectations] = useState<number[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createDialogDefaults, setCreateDialogDefaults] = useState<{
        day?: DayOfWeek;
        period?: Period;
        roomId?: number;
    }>({});

    // Hook principal de l'éditeur
    const editorOptions: UseTrameEditorOptions = {
        trameModeleId,
        autoSave: !readOnly && (config?.autoSave ?? true),
        enableValidation: true
    };

    const {
        state,
        trameModele,
        operatingRooms,
        activityTypes,
        actions,
        isLoading,
        isSaving,
        hasUnsavedChanges
    } = useTrameEditor(editorOptions);

    // Hook undo/redo
    const {
        state: undoState,
        setState: pushToHistory,
        undo,
        redo,
        canUndo,
        canRedo
    } = useUndoRedo(state.affectations, {
        maxHistorySize: 30,
        onUndo: (affectations) => actions.setAffectations(affectations),
        onRedo: (affectations) => actions.setAffectations(affectations)
    });

    // Gestionnaires d'événements
    const handleAffectationMove = useCallback((affectationId: number, target: any) => {
        // Sauvegarder l'état actuel pour l'undo
        pushToHistory(state.affectations);
        actions.moveAffectation(affectationId, target);
        toast.success('Affectation déplacée');
    }, [actions, pushToHistory, state.affectations]);

    const handleAffectationSelect = useCallback((affectationId: number) => {
        setSelectedAffectations(prev => {
            if (prev.includes(affectationId)) {
                return prev.filter(id => id !== affectationId);
            } else {
                return [...prev, affectationId];
            }
        });
    }, []);

    const handleCellClick = useCallback((jourSemaine: DayOfWeek, periode: Period, roomId?: number) => {
        if (readOnly) return;

        setCreateDialogDefaults({ day: jourSemaine, period: periode, roomId });
        setShowCreateDialog(true);
    }, [readOnly]);

    const handleSave = useCallback(async () => {
        if (readOnly) return;

        try {
            await actions.saveChanges();
            onSave?.(state.affectations);
            toast.success('Modifications sauvegardées');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde');
        }
    }, [readOnly, actions, onSave, state.affectations]);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            undo();
            toast.success('Action annulée');
        }
    }, [canUndo, undo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            redo();
            toast.success('Action rétablie');
        }
    }, [canRedo, redo]);

    const handleAddAffectation = useCallback(() => {
        if (readOnly) return;
        setCreateDialogDefaults({});
        setShowCreateDialog(true);
    }, [readOnly]);

    // Filtrer les affectations selon les conflits
    const filteredAffectations = useMemo(() => {
        if (!showConflicts) {
            return state.affectations.filter(aff => !aff.hasConflict);
        }
        return state.affectations;
    }, [state.affectations, showConflicts]);

    // Calculer les conflits visibles
    const visibleConflicts = useMemo(() => {
        return state.conflicts.filter(conflict =>
            conflict.affectedIds.some(id =>
                filteredAffectations.some(aff => aff.id === id)
            )
        );
    }, [state.conflicts, filteredAffectations]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de l'éditeur...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col bg-white ${className}`}>
            {/* Barre d'outils */}
            <ToolBar
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onSave={handleSave}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onAddAffectation={handleAddAffectation}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onToggleConflicts={() => setShowConflicts(!showConflicts)}
                showConflicts={showConflicts}
                readOnly={readOnly}
            />

            {/* Panel d'informations */}
            <InfoPanel
                trameModele={trameModele}
                selectedAffectations={filteredAffectations.filter(aff =>
                    selectedAffectations.includes(aff.id!)
                )}
                conflicts={visibleConflicts}
                totalAffectations={filteredAffectations.length}
            />

            {/* Zone principale avec grille */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {state.gridData && (
                        <motion.div
                            key="grid"
                            className="h-full p-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <WeeklyGrid
                                gridData={state.gridData}
                                affectations={filteredAffectations}
                                onAffectationMove={handleAffectationMove}
                                onAffectationSelect={handleAffectationSelect}
                                onCellClick={handleCellClick}
                                selectedAffectations={selectedAffectations}
                                readOnly={readOnly}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Dialog de création d'affectation */}
            {trameModeleId && (
                <CreateAffectationDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    onConfirm={(newAffectation) => {
                        pushToHistory(state.affectations);
                        actions.addAffectation(newAffectation);
                        toast.success('Affectation créée');
                        setShowCreateDialog(false);
                    }}
                    defaultDay={createDialogDefaults.day}
                    defaultPeriod={createDialogDefaults.period}
                    defaultRoomId={createDialogDefaults.roomId}
                    trameModeleId={trameModeleId}
                />
            )}

            {/* Panel de filtres (conditionnel) */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        className="border-t border-gray-200 p-4 bg-gray-50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-sm text-gray-600">
                            Panel de filtres (à implémenter)
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrameEditor; 