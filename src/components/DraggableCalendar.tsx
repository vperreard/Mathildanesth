import React, { useState, useRef, useEffect } from 'react';
import { Assignment, AssignmentStatus } from '../types/assignment';
import { ShiftType } from '../types/common';
import { User } from '../types/user';
import { useDragDropSync } from '../hooks/useDragDropSync';
import { RulesConfiguration } from '../types/rules';
import { Toaster } from 'react-hot-toast';
import { Doctor } from '../types/doctor';
import { isSameDay as dateFnsIsSameDay } from 'date-fns';
import Button from '@/components/ui/button';

interface DraggableCalendarProps {
    initialAssignments: Assignment[];
    users: User[];
    doctors?: Doctor[];
    rules: RulesConfiguration;
    onSave?: (assignments: Assignment[]) => void;
    onValidationError?: (violations: any[]) => void;
    onSyncComplete?: (success: boolean) => void;
}

const DraggableCalendar: React.FC<DraggableCalendarProps> = ({
    initialAssignments,
    users,
    doctors = [],
    rules,
    onSave,
    onValidationError,
    onSyncComplete
}) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [draggedAssignment, setDraggedAssignment] = useState<string | null>(null);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const {
        assignments,
        setAssignments,
        handleDragDrop,
        pendingChanges,
        isSaving,
        lastSaved,
        saveChanges,
        hasPendingChanges,
        validationErrors,
        triggerValidation,
        isValidating,
        revertChange,
        revertAllChanges
    } = useDragDropSync({
        rules,
        doctors,
        onValidationError,
        validateBeforeSave: true,
        onSyncComplete
    });

    useEffect(() => {
        setAssignments(initialAssignments);
    }, [initialAssignments, setAssignments]);

    useEffect(() => {
        if (lastSaved && onSave) {
            onSave(assignments);
        }
    }, [lastSaved, assignments, onSave]);

    useEffect(() => {
        setShowValidationErrors(validationErrors.length > 0);
    }, [validationErrors]);

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            const isToday = dateFnsIsSameDay(date, new Date());
            return {
                date,
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isToday,
                assignments: assignments.filter(a => {
                    const assignDate = new Date(a.startDate);
                    return assignDate.getDate() === date.getDate() &&
                        assignDate.getMonth() === date.getMonth() &&
                        assignDate.getFullYear() === date.getFullYear();
                })
            };
        });
    };

    const formatDay = (date: Date) => {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
    };

    const handleDragStart = (e: React.DragEvent, assignmentId: string) => {
        e.dataTransfer.setData("assignmentId", assignmentId);
        setDraggedAssignment(assignmentId);
    };

    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const assignmentId = e.dataTransfer.getData("assignmentId");
        if (!assignmentId) return;

        handleDragDrop(assignmentId, date);
        setDraggedAssignment(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    const getUserName = (userId: string) => {
        const user = users.find(u => u.id.toString() === userId);
        return user ? `${user.prenom} ${user.nom}` : `Utilisateur #${userId}`;
    };

    const getAssignmentClassName = (assignment: Assignment) => {
        let baseClass = 'p-1 rounded text-xs cursor-grab mb-1 ';
        if (pendingChanges[assignment.id]) {
            baseClass += 'bg-yellow-100 border border-yellow-300 hover:bg-yellow-200';
        } else {
            switch (assignment.shiftType) {
                case ShiftType.MATIN:
                case ShiftType.APRES_MIDI:
                    baseClass += 'bg-blue-100 border border-blue-300 hover:bg-blue-200'; break;
                case ShiftType.JOUR:
                    baseClass += 'bg-cyan-100 border border-cyan-300 hover:bg-cyan-200'; break;
                case ShiftType.NUIT:
                    baseClass += 'bg-indigo-100 border border-indigo-300 hover:bg-indigo-200'; break;
                case ShiftType.GARDE_24H:
                case ShiftType.GARDE_WEEKEND:
                    baseClass += 'bg-green-100 border border-green-300 hover:bg-green-200'; break;
                case ShiftType.ASTREINTE:
                case ShiftType.ASTREINTE_SEMAINE:
                case ShiftType.ASTREINTE_WEEKEND:
                    baseClass += 'bg-purple-100 border border-purple-300 hover:bg-purple-200'; break;
                case ShiftType.CONSULTATION:
                    baseClass += 'bg-pink-100 border border-pink-300 hover:bg-pink-200'; break;
                case ShiftType.URGENCE:
                    baseClass += 'bg-red-100 border border-red-300 hover:bg-red-200'; break;
                default:
                    baseClass += 'bg-gray-100 border border-gray-300 hover:bg-gray-200';
            }
        }
        return baseClass;
    };

    const getEmptyCellsCount = () => {
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    };

    const renderEmptyCells = (): JSX.Element[] => {
        const count = getEmptyCellsCount();
        return Array.from({ length: count }, (_, i) => (
            <div key={`empty-${i}`} className="h-24 border rounded bg-gray-50"></div>
        ));
    };

    const handleValidate = () => {
        triggerValidation();
    };

    const handleCloseValidationErrors = () => {
        setShowValidationErrors(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <Toaster position="top-right" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold">
                        {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h2>
                    {hasPendingChanges && (
                        <span className="ml-2 text-sm text-yellow-600">(Modifications non sauvegardées)</span>
                    )}
                    {!!isSaving && (
                        <span className="ml-2 text-sm text-blue-600">Sauvegarde...</span>
                    )}
                    {!!isValidating && (
                        <span className="ml-2 text-sm text-purple-600">Validation...</span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleValidate} disabled={isSaving || isValidating}>Valider</Button>
                    <Button onClick={() => revertAllChanges()} disabled={!hasPendingChanges || isSaving} variant="outline">Annuler tout</Button>
                    <Button onClick={saveChanges} disabled={!hasPendingChanges || isSaving || isValidating || validationErrors.length > 0}>Sauvegarder</Button>
                    <Button onClick={() => navigateMonth('prev')} variant="outline">Précédent</Button>
                    <Button onClick={() => navigateMonth('next')} variant="outline">Suivant</Button>
                </div>
            </div>

            {showValidationErrors && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative">
                    <button onClick={handleCloseValidationErrors} className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700">
                        &times;
                    </button>
                    <h3 className="font-bold">Erreurs de validation:</h3>
                    <ul className="mt-2 list-disc list-inside">
                        {validationErrors.map((err, index) => <li key={index}>{err.message}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-7 gap-1">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
                ))}

                {renderEmptyCells()}

                {getDaysInMonth().map(({ date, isWeekend, isToday, assignments: dayAssignments }) => (
                    <div
                        key={date.toISOString()}
                        className={`h-24 border rounded p-1 overflow-y-auto ${isWeekend ? 'bg-gray-100' : 'bg-white'} ${isToday ? 'border-2 border-blue-500' : 'border-gray-200'}`}
                        onDrop={(e) => handleDrop(e, date)}
                        onDragOver={handleDragOver}
                    >
                        <div className="text-sm font-medium text-right mb-1">{formatDay(date)}</div>
                        {dayAssignments.map(assignment => (
                            <div
                                key={assignment.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, assignment.id)}
                                className={getAssignmentClassName(assignment)}
                            >
                                {getUserName(assignment.userId)} ({assignment.shiftType})
                                {!!pendingChanges[assignment.id] && (
                                    <button onClick={() => revertChange(assignment.id)} className="ml-1 text-xs text-red-500 hover:text-red-700" title="Annuler ce changement">
                                        &#x2715;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DraggableCalendar; 