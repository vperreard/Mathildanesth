'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayOfWeek, Period } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
    MapPin
} from 'lucide-react';

import { SupervisorSelector } from './SupervisorSelector';
import { ConflictIndicator } from './ConflictIndicator';
import { ValidationPanel } from './ValidationPanel';

// Types
interface Supervisor {
    id: number;
    name: string;
    specialties: string[];
    availability: {
        day: DayOfWeek;
        period: Period;
        available: boolean;
        conflicts?: string[];
    }[];
    workload: number; // Pourcentage de charge
}

interface Room {
    id: number;
    name: string;
    sectorId: number;
    sectorName: string;
    capacity: number;
    equipment: string[];
    isAvailable: boolean;
}

interface Assignment {
    id?: number;
    roomId: number;
    supervisorId: number;
    day: DayOfWeek;
    period: Period;
    activityType: string;
    conflicts: string[];
    isValid: boolean;
}

interface RoomAssignmentPanelProps {
    rooms?: Room[];
    supervisors?: Supervisor[];
    currentAssignments?: Assignment[];
    selectedDay?: DayOfWeek;
    selectedPeriod?: Period;
    onAssignmentChange?: (assignment: Assignment) => void;
    onAssignmentDelete?: (assignmentId: number) => void;
    onValidate?: (assignments: Assignment[]) => void;
    readOnly?: boolean;
    className?: string;
}

// Composant pour afficher une affectation
const AssignmentCard: React.FC<{
    assignment: Assignment;
    room: Room;
    supervisor: Supervisor;
    onEdit?: () => void;
    onDelete?: () => void;
    readOnly?: boolean;
}> = ({ assignment, room, supervisor, onEdit, onDelete, readOnly = false }) => (
    <motion.div
        className={`
      p-4 rounded-lg border-2 transition-all duration-200
      ${assignment.isValid
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
      hover:shadow-md
    `}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
    >
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{room.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {room.sectorName}
                    </Badge>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{supervisor.name}</span>
                    <Badge
                        variant={supervisor.workload > 80 ? 'destructive' : 'secondary'}
                        className="text-xs"
                    >
                        {supervisor.workload}%
                    </Badge>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                        {assignment.day} - {assignment.period}
                    </span>
                </div>

                {assignment.conflicts.length > 0 && (
                    <ConflictIndicator conflicts={assignment.conflicts} />
                )}
            </div>

            <div className="flex items-center space-x-2">
                {assignment.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                )}

                {!readOnly && (
                    <div className="flex space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            className="p-1"
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="p-1 text-red-600 hover:text-red-700"
                        >
                            Supprimer
                        </Button>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

// Composant principal
export const RoomAssignmentPanel: React.FC<RoomAssignmentPanelProps> = ({
    rooms = [],
    supervisors = [],
    currentAssignments = [],
    selectedDay = DayOfWeek.MONDAY,
    selectedPeriod = Period.MATIN,
    onAssignmentChange,
    onAssignmentDelete,
    onValidate,
    readOnly = false,
    className = ''
}) => {
    // État local
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [activityType, setActivityType] = useState('bloc-supervision');

    // Filtrer les affectations pour la période sélectionnée
    const filteredAssignments = useMemo(() => {
        return currentAssignments.filter(
            assignment => assignment.day === selectedDay && assignment.period === selectedPeriod
        );
    }, [currentAssignments, selectedDay, selectedPeriod]);

    // Calculer les salles disponibles
    const availableRooms = useMemo(() => {
        const assignedRoomIds = filteredAssignments.map(a => a.roomId);
        return rooms.filter(room =>
            room.isAvailable && !assignedRoomIds.includes(room.id)
        );
    }, [rooms, filteredAssignments]);

    // Calculer les superviseurs disponibles
    const availableSupervisors = useMemo(() => {
        return supervisors.filter(supervisor => {
            const availability = supervisor.availability.find(
                a => a.day === selectedDay && a.period === selectedPeriod
            );
            return availability?.available && supervisor.workload < 100;
        });
    }, [supervisors, selectedDay, selectedPeriod]);

    // Validation globale
    const validationSummary = useMemo(() => {
        const totalConflicts = filteredAssignments.reduce(
            (sum, assignment) => sum + assignment.conflicts.length, 0
        );
        const validAssignments = filteredAssignments.filter(a => a.isValid).length;

        return {
            totalAssignments: filteredAssignments.length,
            validAssignments,
            totalConflicts,
            isValid: totalConflicts === 0 && validAssignments === filteredAssignments.length
        };
    }, [filteredAssignments]);

    // Gestionnaires d'événements
    const handleCreateAssignment = useCallback(() => {
        if (!selectedRoomId || !selectedSupervisorId) return;

        const room = rooms.find(r => r.id === selectedRoomId);
        const supervisor = supervisors.find(s => s.id === selectedSupervisorId);

        if (!room || !supervisor) return;

        // Détecter les conflits
        const conflicts: string[] = [];

        // Vérifier la disponibilité du superviseur
        const supervisorAvailability = supervisor.availability.find(
            a => a.day === selectedDay && a.period === selectedPeriod
        );

        if (!supervisorAvailability?.available) {
            conflicts.push('Superviseur non disponible');
        }

        if (supervisorAvailability?.conflicts) {
            conflicts.push(...supervisorAvailability.conflicts);
        }

        // Vérifier la charge de travail
        if (supervisor.workload > 90) {
            conflicts.push('Charge de travail élevée');
        }

        const newAssignment: Assignment = {
            roomId: selectedRoomId,
            supervisorId: selectedSupervisorId,
            day: selectedDay,
            period: selectedPeriod,
            activityType,
            conflicts,
            isValid: conflicts.length === 0
        };

        onAssignmentChange?.(newAssignment);

        // Reset selection
        setSelectedRoomId(null);
        setSelectedSupervisorId(null);
    }, [
        selectedRoomId,
        selectedSupervisorId,
        selectedDay,
        selectedPeriod,
        activityType,
        rooms,
        supervisors,
        onAssignmentChange
    ]);

    const handleDeleteAssignment = useCallback((assignmentId: number) => {
        onAssignmentDelete?.(assignmentId);
    }, [onAssignmentDelete]);

    const handleValidateAll = useCallback(() => {
        if (validationSummary.isValid) {
            onValidate?.(filteredAssignments);
        }
    }, [validationSummary.isValid, filteredAssignments, onValidate]);

    return (
        <div className={`h-full flex flex-col bg-white ${className}`}>
            {/* En-tête */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Affectation des Salles
                        </h2>
                        <p className="text-sm text-gray-600">
                            {selectedDay} - {selectedPeriod}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge
                            variant={validationSummary.isValid ? 'default' : 'destructive'}
                            className="px-3 py-1"
                        >
                            {validationSummary.validAssignments}/{validationSummary.totalAssignments} valides
                        </Badge>

                        {!readOnly && (
                            <Button
                                onClick={() => setShowValidation(!showValidation)}
                                variant="outline"
                                size="sm"
                            >
                                Validation
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel de validation */}
            <AnimatePresence>
                {showValidation && (
                    <ValidationPanel
                        summary={validationSummary}
                        assignments={filteredAssignments}
                        onValidate={handleValidateAll}
                        onClose={() => setShowValidation(false)}
                    />
                )}
            </AnimatePresence>

            <div className="flex-1 flex overflow-hidden">
                {/* Panel de création d'affectation */}
                {!readOnly && (
                    <div className="w-80 border-r border-gray-200 p-4 overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Nouvelle Affectation
                        </h3>

                        <div className="space-y-4">
                            {/* Sélection de salle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Salle ({availableRooms.length} disponibles)
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {availableRooms.map(room => (
                                        <div
                                            key={room.id}
                                            className={`
                        p-3 rounded-md border cursor-pointer transition-colors
                        ${selectedRoomId === room.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                      `}
                                            onClick={() => setSelectedRoomId(room.id)}
                                        >
                                            <div className="font-medium">{room.name}</div>
                                            <div className="text-sm text-gray-600">{room.sectorName}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sélection de superviseur */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Superviseur
                                </label>
                                <SupervisorSelector
                                    supervisors={availableSupervisors}
                                    selectedSupervisorId={selectedSupervisorId}
                                    onSupervisorSelect={setSelectedSupervisorId}
                                    day={selectedDay}
                                    period={selectedPeriod}
                                />
                            </div>

                            {/* Type d'activité */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type d'activité
                                </label>
                                <select
                                    value={activityType}
                                    onChange={(e) => setActivityType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="bloc-supervision">Bloc Supervision</option>
                                    <option value="bloc-anesthesie">Bloc Anesthésie</option>
                                    <option value="consultation">Consultation</option>
                                </select>
                            </div>

                            <Separator />

                            <Button
                                onClick={handleCreateAssignment}
                                disabled={!selectedRoomId || !selectedSupervisorId}
                                className="w-full"
                            >
                                Créer l'affectation
                            </Button>
                        </div>
                    </div>
                )}

                {/* Liste des affectations */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Affectations actuelles ({filteredAssignments.length})
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredAssignments.map(assignment => {
                                const room = rooms.find(r => r.id === assignment.roomId);
                                const supervisor = supervisors.find(s => s.id === assignment.supervisorId);

                                if (!room || !supervisor) return null;

                                return (
                                    <AssignmentCard
                                        key={assignment.id || `${assignment.roomId}-${assignment.supervisorId}`}
                                        assignment={assignment}
                                        room={room}
                                        supervisor={supervisor}
                                        onEdit={() => {/* TODO: Implémenter l'édition */ }}
                                        onDelete={() => assignment.id && handleDeleteAssignment(assignment.id)}
                                        readOnly={readOnly}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {filteredAssignments.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Aucune affectation pour cette période</p>
                                {!readOnly && (
                                    <p className="text-sm">Utilisez le panel de gauche pour créer une affectation</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomAssignmentPanel; 