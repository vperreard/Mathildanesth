import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
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
import { DateValidationErrorType, DateRange } from '../../../hooks/useDateValidation';
import { useLeaveValidation } from '../hooks/useLeaveValidation';
import { useLeaveQuota } from '../hooks/useLeaveQuota';
import { LeaveQuotaDisplay } from './LeaveQuotaDisplay';
import { RecurrenceForm } from './RecurrenceForm';
import { useRecurringLeaveValidation } from '../hooks/useRecurringLeaveValidation';
import {
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern,
    RecurringLeaveRequest
} from '../types/leave';
import { generateRecurringDates } from '../utils/recurrentsLeavesUtils';

interface LeaveRequestFormProps {
    userId: string;
    userSchedule: WorkSchedule;
    initialLeave?: Partial<Leave>;
    onSubmit?: (leave: Leave | RecurringLeaveRequest) => void;
    onSaveDraft?: (leave: Leave | RecurringLeaveRequest) => void;
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

    // Utilisation du hook de validation spécifique aux congés
    const {
        validateLeaveRequest,
        getErrorMessage,
        getErrorType,
        hasError,
        resetErrors: resetDateErrors,
        context: validationContext
    } = useLeaveValidation();

    // Utilisation du hook de gestion des quotas
    const {
        loading: quotaLoading,
        error: quotaError,
        quotasByType,
        totalBalance,
        checkQuota,
        refreshQuotas,
        getQuotaForType
    } = useLeaveQuota({
        userSchedule
    });

    // État pour la récurrence
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 1,
        weekdays: [new Date().getDay()],
        endType: RecurrenceEndType.COUNT,
        endCount: 10,
        skipWeekends: false,
        skipHolidays: false
    });

    // Utiliser le hook de validation récurrente
    const {
        validateRecurringLeaveRequest,
        hasError: hasRecurringError,
        getErrorMessage: getRecurringErrorMessage,
        generationResult
    } = useRecurringLeaveValidation();

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showConflictWarning, setShowConflictWarning] = useState<boolean>(false);
    const [quotaCheckResult, setQuotaCheckResult] = useState<any>(null);

    // Charger les quotas au chargement du composant
    useEffect(() => {
        if (userId) {
            refreshQuotas(userId).catch(err => {
                logger.error('Erreur lors du chargement des quotas:', err);
            });
        }
    }, [userId, refreshQuotas]);

    // Gérer le changement de type de congé
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateLeaveField('type', e.target.value as LeaveType);
    };

    // Gérer le changement de dates
    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        updateLeaveField(field, new Date(value));

        // Vérifier les quotas automatiquement lorsque les deux dates sont définies
        const updatedLeave = {
            ...leave,
            [field]: new Date(value)
        };

        if (updatedLeave.startDate && updatedLeave.endDate && updatedLeave.type) {
            checkLeaveQuota(
                updatedLeave.startDate,
                updatedLeave.endDate,
                updatedLeave.type as LeaveType
            );

            // Vérifier les conflits également
            if (field === 'startDate' || field === 'endDate') {
                const start = field === 'startDate' ? new Date(value) : new Date(updatedLeave.startDate);
                const end = field === 'endDate' ? new Date(value) : new Date(updatedLeave.endDate);

                if (start <= end) {
                    checkConflicts(start, end, leave?.id).catch((error) => {
                        logger.error('Erreur lors de la vérification des conflits:', error instanceof Error ? error : new Error(String(error)));
                    });
                }
            }
        }
    };

    // Gérer le changement de motif
    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateLeaveField('reason', e.target.value);
    };

    // Vérifier les quotas de congés
    const checkLeaveQuota = async (startDate: Date, endDate: Date, leaveType: LeaveType) => {
        try {
            const result = await checkQuota({
                startDate,
                endDate,
                leaveType,
                userId
            });

            setQuotaCheckResult(result);

            // Si on dépasse le quota, ajouter une erreur
            if (!result.isValid) {
                setFormErrors(prev => {
                    // Éviter les doublons
                    if (!prev.includes(result.message)) {
                        return [...prev, result.message];
                    }
                    return prev;
                });
            } else {
                // Retirer l'erreur liée au quota si elle existait
                setFormErrors(prev => prev.filter(err => !err.includes('Quota insuffisant')));
            }
        } catch (err: unknown) {
            logger.error('Erreur lors de la vérification des quotas:', err);
        }
    };

    // Vérifier le formulaire avec validation améliorée
    const validateForm = (): boolean => {
        resetDateErrors(); // Réinitialiser les erreurs de dates
        const errors: string[] = [];

        if (!leave?.type) {
            errors.push('Le type de congé est requis');
        }

        // Utiliser validateLeaveRequest pour une validation complète
        if (leave?.startDate && leave?.endDate) {
            const isValid = validateLeaveRequest(
                new Date(leave.startDate),
                new Date(leave.endDate),
                userId,
                {
                    required: true,
                    allowPastDates: false,
                    minAdvanceNotice: 1,
                    disallowWeekends: false
                }
            );

            if (!isValid) {
                // Ajouter les erreurs de validation des dates
                if (hasError(`leave_start_${userId}`)) {
                    errors.push(getErrorMessage(`leave_start_${userId}`) || 'Date de début invalide');
                }
                if (hasError(`leave_end_${userId}`)) {
                    errors.push(getErrorMessage(`leave_end_${userId}`) || 'Date de fin invalide');
                }
            }
        } else {
            // Vérification individuelle si une date est manquante
            if (!leave?.startDate) {
                errors.push('La date de début est requise');
            }
            if (!leave?.endDate) {
                errors.push('La date de fin est requise');
            }
        }

        if (hasBlockingConflicts) {
            errors.push('Il y a des conflits bloquants qui doivent être résolus');
        }

        // Ajouter la validation des quotas
        if (quotaCheckResult && !quotaCheckResult.isValid) {
            errors.push(quotaCheckResult.message);
        }

        // Validation récurrence si activée
        if (isRecurring) {
            const recurringValidation = validateRecurringLeaveRequest(
                leave as Leave,
                recurrencePattern
            );
            if (!recurringValidation.isValid) {
                errors.push(recurringValidation.message);
            }
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    // Soumettre le formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setFormErrors([]); // Clear previous errors

        // Validate form data
        const isValid = validateForm();

        if (!isValid) {
            return; // Ne pas continuer si la validation de base échoue
        }

        // Check for conflicts
        try {
            const conflictResult = await checkConflicts(
                new Date(leave.startDate!),
                new Date(leave.endDate!),
                leave.id ?? undefined
            );

            if (conflictResult.hasBlockingConflicts) {
                setFormErrors(prev => [...prev, 'Il y a des conflits bloquants avec cette demande.']);
                setShowConflictWarning(true);
                return;
            }

            if (conflictResult.conflicts.length > 0) {
                setShowConflictWarning(true);
            }

            await submitLeave(leave as Leave); // Assurer que l'objet est complet

            if (onSubmit) {
                onSubmit(leave as Leave);
            }

        } catch (error: unknown) {
            setFormErrors(prev => [...prev, `Erreur lors de la soumission: ${error instanceof Error ? error.message : String(error)}`]);
        }
    };

    // Enregistrer comme brouillon
    const handleSaveDraft = async () => {
        try {
            const savedLeave = await saveLeaveAsDraft();
            if (onSaveDraft) {
                onSaveDraft(savedLeave);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'enregistrement du brouillon:', error instanceof Error ? error : new Error(String(error)));
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

        // Utiliser les informations du contexte de validation si disponibles
        const countedDays = leave.countedDays ||
            (validationContext.totalDaysCount !== undefined ?
                validationContext.totalDaysCount :
                calculateLeaveDuration());

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

            {/* Afficher les quotas disponibles */}
            <LeaveQuotaDisplay
                quotasByType={quotasByType}
                totalBalance={totalBalance}
                selectedType={leave?.type as LeaveType}
                loading={quotaLoading}
            />

            <form onSubmit={handleSubmit} data-testid="leave-request-form">
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
                            className={`w-full px-3 py-2 border ${hasError(`leave_start_${userId}`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            required
                        />
                        {hasError(`leave_start_${userId}`) && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage(`leave_start_${userId}`)}</p>
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
                            className={`w-full px-3 py-2 border ${hasError(`leave_end_${userId}`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            min={leave?.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : ''}
                            required
                        />
                        {hasError(`leave_end_${userId}`) && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage(`leave_end_${userId}`)}</p>
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

                {/* Afficher le résultat de la vérification des quotas */}
                {quotaCheckResult && (
                    <div className={`mb-4 p-4 rounded-md ${quotaCheckResult.isValid ? 'bg-green-50 border-l-4 border-green-400' : 'bg-yellow-50 border-l-4 border-yellow-400'}`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {quotaCheckResult.isValid ? (
                                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className={`text-sm ${quotaCheckResult.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                                    {quotaCheckResult.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Option de récurrence */}
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={e => setIsRecurring(e.target.checked)}
                        />
                        Congé récurrent
                    </label>
                </div>

                {/* Formulaire de récurrence */}
                {isRecurring && (
                    <RecurrenceForm
                        value={recurrencePattern}
                        onChange={setRecurrencePattern}
                        initialStartDate={leave.startDate instanceof Date ? leave.startDate : undefined}
                        hasError={hasRecurringError}
                        getErrorMessage={getRecurringErrorMessage}
                    />
                )}

                {/* Prévisualisation des occurrences */}
                {isRecurring && generationResult && generationResult.occurrences.length > 0 && (
                    <div className="occurrences-preview">
                        <h3>Aperçu des occurrences ({generationResult.occurrences.length})</h3>
                        <p>Total: {generationResult.totalDays} jours demandés</p>
                        <ul className="occurrences-list">
                            {generationResult.occurrences.slice(0, 5).map((occurrence, index) => (
                                <li key={index}>
                                    {format(occurrence.startDate, 'dd/MM/yyyy')} - {format(occurrence.endDate, 'dd/MM/yyyy')}
                                </li>
                            ))}
                            {generationResult.occurrences.length > 5 && (
                                <li>... et {generationResult.occurrences.length - 5} autres occurrences</li>
                            )}
                        </ul>
                    </div>
                )}

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
                                    } catch (error: unknown) {
                                        logger.error('Erreur lors de la soumission de la demande:', error instanceof Error ? error : new Error(String(error)));
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