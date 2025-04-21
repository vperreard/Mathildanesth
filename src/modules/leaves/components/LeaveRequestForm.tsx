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

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showConflictWarning, setShowConflictWarning] = useState<boolean>(false);

    // Gérer le changement de type de congé
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateLeaveField('type', e.target.value as LeaveType);
    };

    // Gérer le changement de dates
    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        updateLeaveField(field, new Date(value));

        // Vérifier les conflits automatiquement lorsque les deux dates sont définies
        if (leave?.startDate && leave.endDate) {
            const start = field === 'startDate' ? new Date(value) : new Date(leave.startDate);
            const end = field === 'endDate' ? new Date(value) : new Date(leave.endDate);

            if (start <= end) {
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

    // Vérifier le formulaire
    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!leave?.type) {
            errors.push('Le type de congé est requis');
        }

        if (!leave?.startDate) {
            errors.push('La date de début est requise');
        }

        if (!leave?.endDate) {
            errors.push('La date de fin est requise');
        }

        if (leave?.startDate && leave.endDate && new Date(leave.startDate) > new Date(leave.endDate)) {
            errors.push('La date de début doit être antérieure ou égale à la date de fin');
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
                            value={leave?.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : ''}
                            onChange={e => handleDateChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin *
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={leave?.endDate ? format(new Date(leave.endDate), 'yyyy-MM-dd') : ''}
                            onChange={e => handleDateChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                {/* Récapitulatif de la durée */}
                {leave?.startDate && leave?.endDate && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Récapitulatif</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-gray-500">Jours calendaires</p>
                                <p className="text-lg font-semibold text-gray-900">{durationInfo.totalDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Dont weekends/fériés</p>
                                <p className="text-lg font-semibold text-gray-900">{durationInfo.weekendDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Jours décomptés</p>
                                <p className="text-lg font-semibold text-blue-600">{durationInfo.countedDays}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Afficher les conflits */}
                {conflicts.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Conflits détectés</h3>
                        <div className="space-y-2">
                            {getBlockingConflicts().map(conflict => (
                                <div key={conflict.id} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                    <p className="text-red-700">
                                        <span className="font-semibold">Conflit bloquant: </span>
                                        {conflict.description}
                                    </p>
                                </div>
                            ))}
                            {getWarningConflicts().map(conflict => (
                                <div key={conflict.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                                    <p className="text-yellow-700">
                                        <span className="font-semibold">Avertissement: </span>
                                        {conflict.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Motif */}
                <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Motif
                    </label>
                    <textarea
                        id="reason"
                        value={leave?.reason || ''}
                        onChange={handleReasonChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={leaveLoading || conflictLoading}
                        className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(leaveLoading || conflictLoading) ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        Enregistrer comme brouillon
                    </button>
                    <button
                        type="submit"
                        disabled={leaveLoading || conflictLoading}
                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(leaveLoading || conflictLoading) ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {showConflictWarning && getWarningConflicts().length > 0
                            ? 'Confirmer malgré les avertissements'
                            : 'Soumettre la demande'}
                    </button>
                </div>
            </form>
        </div>
    );
}; 