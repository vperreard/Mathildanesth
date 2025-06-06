import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RuleViolation, Attribution, ResolutionOption, RuleSeverity, ValidationResult } from '@/types/attribution';
import { Medecin } from '@/modules/rules/engine/fatigue-system';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RuleEngine } from '@/modules/rules/engine/rule-engine';
import { X, AlertTriangle, CheckCircle, AlertCircle, PlusCircle, Clock } from 'lucide-react';

interface DragDropAssignmentEditorProps {
    attributions: Attribution[];
    medecins: Medecin[];
    startDate: Date;
    endDate: Date;
    ruleEngine: RuleEngine;
    onAssignmentsChange: (attributions: Attribution[]) => void;
}

type DayColumn = {
    id: string;
    title: string;
    date: Date;
    attributions: Attribution[];
};

type MedecinRow = {
    id: string;
    medecin: Medecin;
    attributions: Attribution[];
};

const DragDropAssignmentEditor: React.FC<DragDropAssignmentEditorProps> = ({
    attributions,
    medecins,
    startDate,
    endDate,
    ruleEngine,
    onAssignmentsChange
}) => {
    const [columns, setColumns] = useState<DayColumn[]>([]);
    const [rows, setRows] = useState<MedecinRow[]>([]);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [selectedViolation, setSelectedViolation] = useState<RuleViolation | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    // Générer les colonnes en fonction des dates
    useEffect(() => {
        const dayColumns: DayColumn[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateId = currentDate.toISOString().split('T')[0];
            const title = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(currentDate);

            dayColumns.push({
                id: dateId,
                title,
                date: new Date(currentDate),
                attributions: attributions.filter(a =>
                    new Date(a.date).toISOString().split('T')[0] === dateId
                )
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        setColumns(dayColumns);
    }, [startDate, endDate, attributions]);

    // Générer les lignes par médecin
    useEffect(() => {
        const medecinRows: MedecinRow[] = medecins.map(medecin => ({
            id: medecin.id,
            medecin,
            attributions: attributions.filter(a => a.userId === parseInt(medecin.id))
        }));

        setRows(medecinRows);
    }, [medecins, attributions]);

    // Valider les affectations
    const validateAssignments = useCallback(async () => {
        // Construire le contexte pour l'évaluation des règles
        const context = {
            attributions,
            startDate,
            endDate,
            medecins
        };

        const result = await ruleEngine.evaluate(context);

        setValidationResult({
            valid: result.isValid,
            violations: result.violations.map(v => ({
                id: v.ruleId,
                type: v.ruleType,
                severity: v.severity === 'ERROR' ? RuleSeverity.CRITICAL :
                    v.severity === 'WARNING' ? RuleSeverity.MINOR :
                        RuleSeverity.MAJOR,
                message: v.message,
                affectedAssignments: v.affectedAssignmentIds || []
            })),
            metrics: {
                equiteScore: result.score,
                fatigueScore: 0,
                satisfactionScore: 0
            }
        });
    }, [attributions, startDate, endDate, medecins, ruleEngine]);

    useEffect(() => {
        validateAssignments();
    }, [validateAssignments]);

    // Gérer le drag and drop
    const handleDragEnd = (result: unknown) => {
        const { source, destination } = result;

        // Abandon si pas de destination ou si même source/destination
        if (!destination ||
            (source.droppableId === destination.droppableId &&
                source.index === destination.index)) {
            return;
        }

        // Récupérer l'affectation déplacée
        const sourceColumnId = source.droppableId;
        const sourceIndex = source.index;
        let draggedAssignment: Attribution | null = null;

        columns.forEach(column => {
            if (column.id === sourceColumnId) {
                draggedAssignment = { ...column.attributions[sourceIndex] };
            }
        });

        if (!draggedAssignment) return;

        // Copier toutes les affectations
        const newAssignments = [...attributions];

        // Mettre à jour la date de l'affectation déplacée
        const destinationDate = columns.find(c => c.id === destination.droppableId)?.date;
        if (destinationDate) {
            // Trouver l'index de l'affectation dans la liste complète
            const assignmentIndex = newAssignments.findIndex(a => a.id === draggedAssignment?.id);

            if (assignmentIndex !== -1) {
                // Mettre à jour la date
                newAssignments[assignmentIndex] = {
                    ...newAssignments[assignmentIndex],
                    date: destinationDate
                };

                // Notifier le parent du changement
                onAssignmentsChange(newAssignments);
            }
        }
    };

    // Gérer la résolution d'une violation
    const handleResolveViolation = (option: ResolutionOption) => {
        // Appliquer l'action de résolution
        if (option.action) {
            option.action();
        }

        setSelectedViolation(null);
        setIsDialogOpen(false);

        // Revalider les affectations
        validateAssignments();
    };

    // Ouvrir le dialogue de violation
    const openViolationDialog = (violation: RuleViolation) => {
        setSelectedViolation(violation);
        setIsDialogOpen(true);
    };

    // Générer des suggestions de résolution pour une violation
    const generateResolutionOptions = (violation: RuleViolation): ResolutionOption[] => {
        const options: ResolutionOption[] = [];

        // Pour chaque affectation concernée, suggérer de la supprimer
        violation.affectedAssignments.forEach(assignmentId => {
            const attribution = attributions.find(a => a.id === assignmentId);

            if (attribution) {
                const medecinId = attribution.userId;
                const medecin = medecins.find(m => parseInt(m.id) === medecinId);

                options.push({
                    description: `Supprimer l'affectation de ${medecin?.prenom} ${medecin?.nom} le ${new Intl.DateTimeFormat('fr-FR').format(attribution.date)}`,
                    impact: 50,
                    action: () => {
                        const newAssignments = attributions.filter(a => a.id !== assignmentId);
                        onAssignmentsChange(newAssignments);
                    }
                });
            }
        });

        // Suggérer d'échanger les affectations si possible
        if (violation.affectedAssignments.length >= 2) {
            const assignment1 = attributions.find(a => a.id === violation.affectedAssignments[0]);
            const assignment2 = attributions.find(a => a.id === violation.affectedAssignments[1]);

            if (assignment1 && assignment2) {
                const medecin1 = medecins.find(m => parseInt(m.id) === assignment1.userId);
                const medecin2 = medecins.find(m => parseInt(m.id) === assignment2.userId);

                options.push({
                    description: `Échanger les affectations entre ${medecin1?.prenom} ${medecin1?.nom} et ${medecin2?.prenom} ${medecin2?.nom}`,
                    impact: 30,
                    action: () => {
                        const newAssignments = attributions.map(a => {
                            if (a.id === assignment1.id) {
                                return { ...a, userId: assignment2.userId };
                            } else if (a.id === assignment2.id) {
                                return { ...a, userId: assignment1.userId };
                            }
                            return a;
                        });

                        onAssignmentsChange(newAssignments);
                    }
                });
            }
        }

        return options;
    };

    // Obtenir la couleur du badge en fonction de la sévérité
    const getSeverityColor = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.CRITICAL:
                return 'bg-red-100 text-red-800 border-red-300';
            case RuleSeverity.MAJOR:
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case RuleSeverity.MINOR:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Obtenir l'icône en fonction de la sévérité
    const getSeverityIcon = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.CRITICAL:
                return <AlertCircle className="w-4 h-4 mr-1" />;
            case RuleSeverity.MAJOR:
                return <AlertTriangle className="w-4 h-4 mr-1" />;
            case RuleSeverity.MINOR:
                return <Clock className="w-4 h-4 mr-1" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Éditeur d'affectations</h2>
                <div className="flex gap-2">
                    {validationResult && (
                        validationResult.valid
                            ? <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Planning valide
                            </Badge>
                            : <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {validationResult.violations.length} violation(s)
                            </Badge>
                    )}
                    <Button variant="outline" onClick={validateAssignments}>
                        Vérifier les règles
                    </Button>
                </div>
            </div>

            {validationResult && validationResult.violations.length > 0 && (
                <Card className="p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">Violations de règles</h3>
                    <div className="space-y-2">
                        {validationResult.violations.map(violation => (
                            <div
                                key={violation.id}
                                className={`p-2 rounded-md border flex justify-between items-center cursor-pointer ${getSeverityColor(violation.severity)}`}
                                onClick={() => openViolationDialog(violation)}
                            >
                                <div className="flex items-center">
                                    {getSeverityIcon(violation.severity)}
                                    <span>{violation.message}</span>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-white">
                                    {violation.affectedAssignments.length} affectation(s)
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border p-2 bg-gray-50 min-w-[150px]">Médecin</th>
                                {columns.map(column => (
                                    <th key={column.id} className="border p-2 bg-gray-50 min-w-[150px]">
                                        {column.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.id}>
                                    <td className="border p-2 font-medium">
                                        {row.medecin.prenom} {row.medecin.nom}
                                        <div className="text-xs text-gray-500 mt-1">
                                            Fatigue: {row.medecin.fatigue.score}/100
                                        </div>
                                    </td>

                                    {columns.map(column => {
                                        const cellAssignments = attributions.filter(
                                            a => a.userId === parseInt(row.id) &&
                                                new Date(a.date).toISOString().split('T')[0] === column.id
                                        );

                                        return (
                                            <td key={`${row.id}-${column.id}`} className="border p-2 relative">
                                                <Droppable droppableId={column.id} direction="vertical">
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className="min-h-[60px]"
                                                        >
                                                            {cellAssignments.map((attribution, index) => {
                                                                // Vérifier si cette affectation est en violation
                                                                const hasViolation = validationResult?.violations.some(
                                                                    v => v.affectedAssignments.includes(attribution.id)
                                                                );

                                                                // Trouver la violation la plus sévère pour cette affectation
                                                                const mostSevereViolation = validationResult?.violations
                                                                    .filter(v => v.affectedAssignments.includes(attribution.id))
                                                                    .sort((a, b) => {
                                                                        const severityOrder = {
                                                                            [RuleSeverity.CRITICAL]: 0,
                                                                            [RuleSeverity.MAJOR]: 1,
                                                                            [RuleSeverity.MINOR]: 2
                                                                        };
                                                                        return severityOrder[a.severity] - severityOrder[b.severity];
                                                                    })[0];

                                                                return (
                                                                    <Draggable
                                                                        key={attribution.id}
                                                                        draggableId={attribution.id}
                                                                        index={index}
                                                                    >
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className={`p-2 mb-2 rounded border ${hasViolation
                                                                                        ? getSeverityColor(mostSevereViolation?.severity || RuleSeverity.MINOR)
                                                                                        : 'bg-white border-gray-200'
                                                                                    }`}
                                                                            >
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="font-medium">
                                                                                        {attribution.type}
                                                                                    </span>
                                                                                    {hasViolation && (
                                                                                        <AlertTriangle
                                                                                            className="h-4 w-4 text-red-500 cursor-pointer"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                if (mostSevereViolation) {
                                                                                                    openViolationDialog(mostSevereViolation);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                {attribution.shift && (
                                                                                    <span className="text-xs block mt-1">
                                                                                        {attribution.shift === 'matin' ? 'Matin' :
                                                                                            attribution.shift === 'apresmidi' ? 'Après-midi' :
                                                                                                attribution.shift === 'nuit' ? 'Nuit' : 'Journée complète'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DragDropContext>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Résoudre la violation</DialogTitle>
                    </DialogHeader>
                    {selectedViolation && (
                        <div className="space-y-4">
                            <div className={`p-3 rounded-md ${getSeverityColor(selectedViolation.severity)}`}>
                                <div className="flex items-center">
                                    {getSeverityIcon(selectedViolation.severity)}
                                    <span className="font-medium">{selectedViolation.message}</span>
                                </div>
                            </div>

                            <h4 className="font-semibold">Affectations concernées :</h4>
                            <div className="space-y-2">
                                {selectedViolation.affectedAssignments.map(assignmentId => {
                                    const attribution = attributions.find(a => a.id === assignmentId);
                                    const medecin = attribution
                                        ? medecins.find(m => parseInt(m.id) === attribution.userId)
                                        : null;

                                    return attribution && medecin ? (
                                        <div key={assignmentId} className="p-2 border rounded bg-gray-50">
                                            <div className="font-medium">
                                                {medecin.prenom} {medecin.nom}
                                            </div>
                                            <div className="text-sm">
                                                {new Intl.DateTimeFormat('fr-FR').format(attribution.date)} - {attribution.type}
                                                {attribution.shift && ` (${attribution.shift})`}
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>

                            <h4 className="font-semibold mt-4">Suggestions de résolution :</h4>
                            <div className="space-y-2">
                                {generateResolutionOptions(selectedViolation).map((option, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className="w-full justify-between"
                                        onClick={() => handleResolveViolation(option)}
                                    >
                                        <span>{option.description}</span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                            Impact: {option.impact}/100
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DragDropAssignmentEditor; 