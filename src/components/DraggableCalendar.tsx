import React, { useState, useRef, useEffect } from 'react';
import { Assignment, ShiftType, AssignmentStatus } from '../types/assignment';
import { User } from '../types/user';
import { useDragDropSync } from '../hooks/useDragDropSync';
import { RulesConfiguration } from '../types/rules';
import { Toaster } from 'react-hot-toast';
import { Doctor } from '../types/doctor';

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

    // Utiliser notre hook personnalisé
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

    // Initialiser les affectations
    useEffect(() => {
        setAssignments(initialAssignments);
    }, [initialAssignments, setAssignments]);

    // Appeler le callback onSave après une sauvegarde réussie
    useEffect(() => {
        if (lastSaved && onSave) {
            onSave(assignments);
        }
    }, [lastSaved, assignments, onSave]);

    // Gérer les erreurs de validation
    useEffect(() => {
        setShowValidationErrors(validationErrors.length > 0);
    }, [validationErrors]);

    // Générer les jours du mois en cours
    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            return {
                date,
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isToday: isSameDay(date, new Date()),
                assignments: assignments.filter(a => {
                    const assignDate = new Date(a.date);
                    return assignDate.getDate() === date.getDate() &&
                        assignDate.getMonth() === date.getMonth() &&
                        assignDate.getFullYear() === date.getFullYear();
                })
            };
        });
    };

    // Vérifier si deux dates sont le même jour
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Formater une date au format jour/mois
    const formatDay = (date: Date) => {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
    };

    // Gérer le début du drag
    const handleDragStart = (assignmentId: string) => {
        setDraggedAssignment(assignmentId);
    };

    // Gérer le drop sur une case du calendrier
    const handleDrop = (date: Date) => {
        if (!draggedAssignment) return;

        // Appliquer le changement
        handleDragDrop(draggedAssignment, date);

        // Réinitialiser
        setDraggedAssignment(null);
    };

    // Empêcher le comportement par défaut pour permettre le drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Navigation entre les mois
    const navigateMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    // Obtenir le nom du médecin
    const getUserName = (userId: string) => {
        const user = users.find(u => u.id.toString() === userId);
        return user ? `${user.prenom} ${user.nom}` : `Médecin #${userId}`;
    };

    // Obtenir la classe CSS pour une affectation
    const getAssignmentClassName = (assignment: Assignment) => {
        if (pendingChanges[assignment.id]) {
            return 'bg-yellow-100 border border-yellow-300';
        }

        if (assignment.shiftType === ShiftType.DAY || assignment.shiftType === ShiftType.NIGHT) {
            return 'bg-blue-100 border border-blue-300';
        } else if (assignment.shiftType === ShiftType.WEEKEND || assignment.shiftType === ShiftType.HOLIDAY) {
            return 'bg-green-100 border border-green-300';
        } else {
            return 'bg-purple-100 border border-purple-300';
        }
    };

    // Calculer le nombre de cellules vides à ajouter avant le premier jour du mois
    const getEmptyCellsCount = () => {
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        return firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Convertir 0 (dimanche) à 6
    };

    // Générer les cellules vides
    const renderEmptyCells = (): JSX.Element[] => {
        const count = getEmptyCellsCount();
        const cells: JSX.Element[] = [];

        for (let i = 0; i < count; i++) {
            cells.push(
                <div key={`empty-${i}`} className="h-24 border rounded bg-gray-50"></div>
            );
        }

        return cells;
    };

    // Lancer une validation manuelle
    const handleValidate = () => {
        triggerValidation();
    };

    // Fermer l'alerte d'erreurs de validation
    const handleCloseValidationErrors = () => {
        setShowValidationErrors(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <Toaster position="top-right" />

            {/* En-tête avec contrôles et statut */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold">
                        {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Indicateur de sauvegarde */}
                    {isSaving && (
                        <div className="flex items-center text-blue-600">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Sauvegarde en cours...</span>
                        </div>
                    )}

                    {/* Indicateur de validation */}
                    {isValidating && (
                        <div className="flex items-center text-blue-600">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Validation en cours...</span>
                        </div>
                    )}

                    {/* Badge de modifications en attente */}
                    {hasPendingChanges && !isSaving && !isValidating && (
                        <div className="text-amber-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{Object.keys(pendingChanges).length} modification(s) non sauvegardée(s)</span>
                        </div>
                    )}

                    {/* Dernière sauvegarde */}
                    {lastSaved && !isSaving && !isValidating && !hasPendingChanges && (
                        <div className="text-green-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR')}</span>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        {/* Bouton de navigation */}
                        <div className="flex">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="p-2 rounded-l border border-gray-300 hover:bg-gray-100"
                                aria-label="Mois précédent"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigateMonth('next')}
                                className="p-2 rounded-r border border-gray-300 border-l-0 hover:bg-gray-100"
                                aria-label="Mois suivant"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Bouton de validation */}
                        <button
                            onClick={handleValidate}
                            disabled={isValidating || !hasPendingChanges}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isValidating || !hasPendingChanges
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                }`}
                        >
                            Valider
                        </button>

                        {/* Bouton d'annulation des modifications */}
                        <button
                            onClick={revertAllChanges}
                            disabled={!hasPendingChanges || isSaving}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${!hasPendingChanges || isSaving
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                        >
                            Annuler
                        </button>

                        {/* Bouton de sauvegarde */}
                        <button
                            onClick={() => saveChanges()}
                            disabled={!hasPendingChanges || isSaving}
                            className={`px-4 py-2 rounded ${hasPendingChanges && !isSaving
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>

            {/* Alertes d'erreurs de validation */}
            {showValidationErrors && validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold">Erreurs de validation ({validationErrors.length})</h3>
                            <ul className="mt-2 list-disc list-inside">
                                {validationErrors.slice(0, 3).map((error, index) => (
                                    <li key={index}>{error.message || 'Erreur non identifiée'}</li>
                                ))}
                                {validationErrors.length > 3 && (
                                    <li>... et {validationErrors.length - 3} autre(s) erreur(s)</li>
                                )}
                            </ul>
                        </div>
                        <button
                            onClick={handleCloseValidationErrors}
                            className="text-red-700 hover:text-red-900"
                            aria-label="Fermer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Grille du calendrier */}
            <div ref={calendarRef} className="grid grid-cols-7 gap-2">
                {/* En-têtes des jours de la semaine */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center font-semibold pb-2">
                        {day}
                    </div>
                ))}

                {renderEmptyCells()}

                {getDaysInMonth().map((dayData) => (
                    <div
                        key={dayData.date.toISOString()}
                        className={`h-28 border rounded p-1 ${dayData.isToday
                                ? 'border-blue-400 bg-blue-50'
                                : dayData.isWeekend
                                    ? 'bg-gray-50'
                                    : 'bg-white'
                            }`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(dayData.date)}
                    >
                        <div className="text-right text-sm font-medium">
                            {formatDay(dayData.date)}
                        </div>

                        <div className="mt-1 space-y-1 overflow-y-auto max-h-24">
                            {dayData.assignments.map(assignment => (
                                <div
                                    key={assignment.id}
                                    draggable
                                    onDragStart={() => handleDragStart(assignment.id)}
                                    className={`text-xs p-1 rounded ${getAssignmentClassName(assignment)}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium truncate">{getUserName(assignment.doctorId)}</div>
                                        {pendingChanges[assignment.id] && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    revertChange(assignment.id);
                                                }}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Annuler la modification"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="truncate">{assignment.shiftType}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Légende */}
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-1"></div>
                    <span>Garde</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-1"></div>
                    <span>Astreinte</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-1"></div>
                    <span>Consultation/Bloc</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
                    <span>Modification en attente</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-400 rounded mr-1"></div>
                    <span>Aujourd'hui</span>
                </div>
            </div>
        </div>
    );
};

export default DraggableCalendar; 