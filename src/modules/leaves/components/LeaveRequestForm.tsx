import React, { useState, useEffect } from 'react';
import {
    Leave,
    LeaveType,
    LeaveStatus
} from '../types/leave';
import {
    ConflictSeverity
} from '../types/conflict';
import { useLeave } from '../hooks/useLeave';
import { useConflictDetection } from '../hooks/useConflictDetection';
import {
    getLeaveTypeLabel,
    formatLeavePeriod
} from '../services/leaveService';
import { WorkSchedule } from '../../profiles/types/workSchedule';
import { format, differenceInDays, addDays } from 'date-fns';
import { useDateValidation, DateValidationErrorType } from '../../../hooks/useDateValidation';

interface LeaveRequestFormProps {
    userId: string;
    userSchedule: WorkSchedule;
    initialLeave?: Partial<Leave>;
    onSubmit?: (leave: Leave) => void;
    onSaveDraft?: (leave: Leave) => void;
    onCancel?: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
    userId,
    userSchedule,
    initialLeave,
    onSubmit,
    onSaveDraft,
    onCancel
}) => {
    const {
        leave,
        loading: leaveLoading,
        error: leaveError,
        updateLeaveField,
        saveLeaveAsDraft,
        submitLeave,
        calculateLeaveDuration
    } = useLeave({
        userId,
        initialLeave,
        userSchedule
    });

    const {
        conflicts,
        hasBlockingConflicts,
        loading: conflictLoading,
        error: conflictError,
        checkConflicts,
        getBlockingConflicts,
        getWarningConflicts
    } = useConflictDetection({ userId });

    // Intégration du hook de validation de dates
    const {
        validateDate,
        validateDateRange,
        getErrorMessage,
        hasError,
        resetErrors: resetDateErrors
    } = useDateValidation();

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showConflictWarning, setShowConflictWarning] = useState<boolean>(false);

    // Gérer le changement de type de congé
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateLeaveField('type', e.target.value as LeaveType);
    };

    // Gérer le changement de dates avec validation améliorée
    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        const dateValue = new Date(value);

        // Valider la date individuelle
        validateDate(dateValue, field, {
            required: true,
            allowPastDates: false,
            disallowWeekends: false, // Permettre la sélection des weekends
            minAdvanceNotice: 1 // Au moins 1 jour à l'avance
        });

        updateLeaveField(field, dateValue);

        // Valider la plage de dates si les deux dates sont définies
        if (field === 'startDate' && leave?.endDate) {
            validateDateRange(
                dateValue,
                new Date(leave.endDate),
                'startDate',
                'endDate',
                {
                    required: true,
                    minDuration: 1 // Au moins 1 jour
                }
            );
        } else if (field === 'endDate' && leave?.startDate) {
            validateDateRange(
                new Date(leave.startDate),
                dateValue,
                'startDate',
                'endDate',
                {
                    required: true,
                    minDuration: 1 // Au moins 1 jour
                }
            );
        }

        // Vérifier les conflits automatiquement lorsque les deux dates sont définies
        if (leave?.startDate && (field === 'endDate' ? dateValue : leave.endDate)) {
            const start = field === 'startDate' ? dateValue : new Date(leave.startDate);
            const end = field === 'endDate' ? dateValue : (leave.endDate ? new Date(leave.endDate) : null);

            if (start && end && start <= end) {
                checkConflicts(start, end, leave.id).catch(error => {
                    console.error('Erreur lors de la vérification des conflits:', error);
                });
            }
        }
    };

    // Gérer le changement de motif
    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateLeaveField('reason', e.target.value);
    };

    // Vérifier le formulaire avec validation améliorée
    const validateForm = (): boolean => {
        resetDateErrors(); // Réinitialiser les erreurs de dates
        const errors: string[] = [];

        if (!leave?.type) {
            errors.push('Le type de congé est requis');
        }

        if (!leave?.startDate) {
            errors.push('La date de début est requise');
        } else {
            // Valider la date de début
            validateDate(new Date(leave.startDate), 'startDate', {
                required: true,
                allowPastDates: false,
                disallowWeekends: false
            });

            if (hasError('startDate')) {
                errors.push(getErrorMessage('startDate') || 'Date de début invalide');
            }
        }

        if (!leave?.endDate) {
            errors.push('La date de fin est requise');
        } else {
            // Valider la date de fin
            validateDate(new Date(leave.endDate), 'endDate', {
                required: true,
                allowPastDates: false,
                disallowWeekends: false
            });

            if (hasError('endDate')) {
                errors.push(getErrorMessage('endDate') || 'Date de fin invalide');
            }
        }

        // Valider la plage de dates si les deux dates sont définies
        if (leave?.startDate && leave.endDate) {
            validateDateRange(
                new Date(leave.startDate),
                new Date(leave.endDate),
                'startDate',
                'endDate',
                {
                    required: true,
                    minDuration: 1
                }
            );

            if (hasError('startDate') || hasError('endDate')) {
                // Ajouter l'erreur la plus pertinente
                if (hasError('endDate')) {
                    const errorMsg = getErrorMessage('endDate');
                    if (errorMsg) errors.push(errorMsg);
                } else {
                    const errorMsg = getErrorMessage('startDate');
                    if (errorMsg) errors.push(errorMsg);
                }
            }
        }

        if (hasBlockingConflicts) {
            errors.push('Il y a des conflits bloquants qui doivent être résolus');
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    // Soumettre la demande
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const warningConflicts = getWarningConflicts();
        if (warningConflicts.length > 0 && !showConflictWarning) {
            setShowConflictWarning(true);
            return;
        }

        try {
            const submittedLeave = await submitLeave();
            if (onSubmit) {
                onSubmit(submittedLeave);
            }
        } catch (error) {
            console.error('Erreur lors de la soumission de la demande:', error);
        }
    };

    // Enregistrer comme brouillon
    const handleSaveDraft = async () => {
        try {
            const savedLeave = await saveLeaveAsDraft();
            if (onSaveDraft) {
                onSaveDraft(savedLeave);
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du brouillon:', error);
        }
    };

    // Calculer des informations supplémentaires sur la demande
    const getDurationInfo = (): {
        totalDays: number,
        weekendDays: number,
        countedDays: number
    } => {
        if (!leave?.startDate || !leave?.endDate) {
            return { totalDays: 0, weekendDays: 0, countedDays: 0 };
        }

        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const totalDays = differenceInDays(endDate, startDate) + 1;

        // Calculer le nombre de jours de weekend
        let weekendDays = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = dimanche, 6 = samedi
                weekendDays++;
            }
            currentDate = addDays(currentDate, 1);
        }

        const countedDays = leave.countedDays || calculateLeaveDuration();

        return { totalDays, weekendDays, countedDays };
    };

    // Récupérer les informations sur la durée
    const durationInfo = getDurationInfo();

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
                {leave?.id ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}
            </h2>

            {/* Afficher les erreurs de formulaire */}
            {formErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Veuillez corriger les erreurs suivantes:
                            </h3>
                            <ul className="mt-1 list-disc list-inside text-sm text-red-600">
                                {formErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Afficher les erreurs d'API */}
            {(leaveError || conflictError) && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-red-700">
                        {leaveError?.message || conflictError?.message}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Type de congé */}
                <div className="mb-4">
                    <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type de congé *
                    </label>
                    <select
                        id="leaveType"
                        value={leave?.type || ''}
                        onChange={handleTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Sélectionner...</option>
                        {Object.values(LeaveType).map(type => (
                            <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
                        ))}
                    </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date de début *
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={leave?.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className={`w-full px-3 py-2 border ${hasError('startDate') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            required
                        />
                        {hasError('startDate') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('startDate')}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin *
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={leave?.endDate ? format(new Date(leave.endDate), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                            className={`w-full px-3 py-2 border ${hasError('endDate') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            min={leave?.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : ''}
                            required
                        />
                        {hasError('endDate') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('endDate')}</p>
                        )}
                    </div>
                </div>

                {/* Information sur la durée */}
                {leave?.startDate && leave?.endDate && (
                    <div className="mb-4 bg-blue-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Informations sur la durée</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Durée totale</p>
                                <p className="font-medium">{durationInfo.totalDays} jour(s)</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Weekend</p>
                                <p className="font-medium">{durationInfo.weekendDays} jour(s)</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Jours décomptés</p>
                                <p className="font-medium">{durationInfo.countedDays} jour(s)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Affichage des conflits détectés */}
                {conflicts.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Conflits détectés</h3>
                        <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                            <ul className="space-y-2">
                                {conflicts.map(conflict => (
                                    <li key={conflict.id} className={`flex items-start ${conflict.severity === ConflictSeverity.ERROR ? 'text-red-700' : 'text-yellow-700'}`}>
                                        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full mr-2 ${conflict.severity === ConflictSeverity.ERROR ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-500'}`}>
                                            !
                                        </span>
                                        <div>
                                            <p className="font-medium">{conflict.description}</p>
                                            <p className="text-sm">
                                                {format(new Date(conflict.startDate), 'dd/MM/yyyy')}
                                                {conflict.startDate !== conflict.endDate && ` au ${format(new Date(conflict.endDate), 'dd/MM/yyyy')}`}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Motif */}
                <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Motif (facultatif)
                    </label>
                    <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        value={leave?.reason || ''}
                        onChange={handleReasonChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Précisez le motif de votre demande si nécessaire"
                    ></textarea>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={leaveLoading}
                    >
                        Enregistrer comme brouillon
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={leaveLoading || conflictLoading || hasBlockingConflicts}
                    >
                        {leave?.id ? 'Mettre à jour' : 'Soumettre la demande'}
                    </button>
                </div>
            </form>

            {/* Modal de confirmation pour les conflits d'avertissement */}
            {showConflictWarning && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Attention</h3>
                        <p className="text-gray-600 mb-4">
                            Des conflits potentiels ont été détectés. Souhaitez-vous quand même soumettre la demande ?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowConflictWarning(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setShowConflictWarning(false);
                                    try {
                                        const submittedLeave = await submitLeave();
                                        if (onSubmit) {
                                            onSubmit(submittedLeave);
                                        }
                                    } catch (error) {
                                        console.error('Erreur lors de la soumission de la demande:', error);
                                    }
                                }}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Confirmer la demande
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 