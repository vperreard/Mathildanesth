import React, { useEffect, useState } from 'react';
import {
    WorkSchedule,
    WorkFrequency,
    Weekday,
    WeekType,
    MonthType
} from '../types/workSchedule';
import { useWorkSchedule } from '../hooks/useWorkSchedule';
import { calculateAnnualLeaveAllowance } from '../services/workScheduleService';

interface WorkScheduleFormProps {
    userId: string;
    initialSchedule?: Partial<WorkSchedule>;
    onSave?: (planning médical: WorkSchedule) => void;
    onCancel?: () => void;
}

export const WorkScheduleForm: React.FC<WorkScheduleFormProps> = ({
    userId,
    initialSchedule,
    onSave,
    onCancel
}) => {
    const {
        currentSchedule,
        loading,
        error,
        updateScheduleField,
        saveSchedule
    } = useWorkSchedule({ userId, initialSchedule });

    const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
    const [selectedEvenWeekdays, setSelectedEvenWeekdays] = useState<Weekday[]>([]);
    const [selectedOddWeekdays, setSelectedOddWeekdays] = useState<Weekday[]>([]);

    // Initialiser les jours sélectionnés à partir du planning médical actuel
    useEffect(() => {
        if (currentSchedule?.workingDays) {
            setSelectedWeekdays(currentSchedule.workingDays);
        } else {
            // Par défaut: jours de semaine (lundi-vendredi)
            setSelectedWeekdays([1, 2, 3, 4, 5] as Weekday[]);
        }

        if (currentSchedule?.customSchedule) {
            setSelectedEvenWeekdays(currentSchedule.customSchedule.evenWeeks || []);
            setSelectedOddWeekdays(currentSchedule.customSchedule.oddWeeks || []);
        }
    }, [currentSchedule]);

    // Gérer le changement de type de fréquence
    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const frequency = e.target.value as WorkFrequency;
        updateScheduleField('frequency', frequency);

        // Réinitialiser les champs spécifiques à certains types de fréquence
        if (frequency !== WorkFrequency.PART_TIME) {
            updateScheduleField('workingTimePercentage', undefined);
        }
        if (frequency !== WorkFrequency.ALTERNATE_WEEKS) {
            updateScheduleField('weekType', undefined);
        }
        if (frequency !== WorkFrequency.ALTERNATE_MONTHS) {
            updateScheduleField('monthType', undefined);
        }
        if (frequency !== WorkFrequency.CUSTOM) {
            updateScheduleField('customSchedule', undefined);
        }
    };

    // Gérer la sélection/désélection des jours de la semaine
    const handleWeekdayToggle = (day: Weekday) => {
        const newSelectedDays = selectedWeekdays.includes(day)
            ? selectedWeekdays.filter(d => d !== day)
            : [...selectedWeekdays, day];

        setSelectedWeekdays(newSelectedDays);
        updateScheduleField('workingDays', newSelectedDays);

        // Mettre à jour également le pourcentage de temps de travail
        if (currentSchedule?.frequency === WorkFrequency.PART_TIME) {
            const percentage = Math.round((newSelectedDays.length / 5) * 100);
            updateScheduleField('workingTimePercentage', percentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(percentage));
        }
    };

    // Gérer la sélection/désélection des jours pour semaines paires
    const handleEvenWeekdayToggle = (day: Weekday) => {
        const newSelectedDays = selectedEvenWeekdays.includes(day)
            ? selectedEvenWeekdays.filter(d => d !== day)
            : [...selectedEvenWeekdays, day];

        setSelectedEvenWeekdays(newSelectedDays);
        updateScheduleField('customSchedule', {
            ...currentSchedule?.customSchedule,
            evenWeeks: newSelectedDays
        });

        // Mettre à jour le pourcentage de temps de travail pour la configuration personnalisée
        if (currentSchedule?.frequency === WorkFrequency.CUSTOM) {
            const totalPercentage = Math.round(
                ((newSelectedDays.length + (selectedOddWeekdays?.length || 0)) / 10) * 100
            );
            updateScheduleField('workingTimePercentage', totalPercentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(totalPercentage));
        }
    };

    // Gérer la sélection/désélection des jours pour semaines impaires
    const handleOddWeekdayToggle = (day: Weekday) => {
        const newSelectedDays = selectedOddWeekdays.includes(day)
            ? selectedOddWeekdays.filter(d => d !== day)
            : [...selectedOddWeekdays, day];

        setSelectedOddWeekdays(newSelectedDays);
        updateScheduleField('customSchedule', {
            ...currentSchedule?.customSchedule,
            oddWeeks: newSelectedDays
        });

        // Mettre à jour le pourcentage de temps de travail pour la configuration personnalisée
        if (currentSchedule?.frequency === WorkFrequency.CUSTOM) {
            const totalPercentage = Math.round(
                (((selectedEvenWeekdays?.length || 0) + newSelectedDays.length) / 10) * 100
            );
            updateScheduleField('workingTimePercentage', totalPercentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(totalPercentage));
        }
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Vérifier si les champs requis sont remplis
            if (!currentSchedule?.frequency) {
                throw new Error('Le type de planning est requis');
            }

            // Si pas déjà défini, mettre à jour l'ID utilisateur
            if (!currentSchedule.userId) {
                updateScheduleField('userId', userId);
            }

            // Si c'est un nouveau planning, définir les dates de création/modification
            if (!currentSchedule.id) {
                updateScheduleField('createdAt', new Date());
                updateScheduleField('isActive', true);
            }

            updateScheduleField('updatedAt', new Date());

            // Enregistrer le planning
            const savedSchedule = await saveSchedule();

            if (onSave) {
                onSave(savedSchedule);
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement du planning:', err);
            // On laisse l'hook gérer l'erreur
        }
    };

    // Obtenir les libellés des jours de la semaine
    const getWeekdayLabel = (day: Weekday): string => {
        switch (day) {
            case 1: return 'Lundi';
            case 2: return 'Mardi';
            case 3: return 'Mercredi';
            case 4: return 'Jeudi';
            case 5: return 'Vendredi';
            case 6: return 'Samedi';
            case 0: return 'Dimanche';
            default: return '';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
                {currentSchedule?.id ? 'Modifier le planning de travail' : 'Nouveau planning de travail'}
            </h2>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-red-700">{error.message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Type de fréquence */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de planning
                    </label>
                    <select
                        value={currentSchedule?.frequency || ''}
                        onChange={handleFrequencyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Sélectionner...</option>
                        <option value={WorkFrequency.FULL_TIME}>Temps plein</option>
                        <option value={WorkFrequency.PART_TIME}>Temps partiel</option>
                        <option value={WorkFrequency.ALTERNATE_WEEKS}>Alternance semaines paires/impaires</option>
                        <option value={WorkFrequency.ALTERNATE_MONTHS}>Alternance mois pairs/impairs</option>
                        <option value={WorkFrequency.CUSTOM}>Configuration personnalisée</option>
                    </select>
                </div>

                {/* Champs spécifiques en fonction de la fréquence */}
                {currentSchedule?.frequency === WorkFrequency.PART_TIME && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pourcentage de temps de travail
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={currentSchedule?.workingTimePercentage || 0}
                                    onChange={(e) => updateScheduleField('workingTimePercentage', parseInt(e.target.value))}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleWeekdayToggle(day)}
                                        className={`px-3 py-1 rounded-md ${selectedWeekdays.includes(day)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {currentSchedule?.frequency === WorkFrequency.ALTERNATE_WEEKS && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de semaine
                            </label>
                            <select
                                value={currentSchedule?.weekType || ''}
                                onChange={(e) => updateScheduleField('weekType', e.target.value as WeekType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Sélectionner...</option>
                                <option value={WeekType.BOTH}>Toutes les semaines</option>
                                <option value={WeekType.EVEN}>Semaines paires uniquement</option>
                                <option value={WeekType.ODD}>Semaines impaires uniquement</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleWeekdayToggle(day)}
                                        className={`px-3 py-1 rounded-md ${selectedWeekdays.includes(day)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {currentSchedule?.frequency === WorkFrequency.ALTERNATE_MONTHS && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de mois
                            </label>
                            <select
                                value={currentSchedule?.monthType || ''}
                                onChange={(e) => updateScheduleField('monthType', e.target.value as MonthType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Sélectionner...</option>
                                <option value={MonthType.BOTH}>Tous les mois</option>
                                <option value={MonthType.EVEN}>Mois pairs uniquement</option>
                                <option value={MonthType.ODD}>Mois impairs uniquement</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleWeekdayToggle(day)}
                                        className={`px-3 py-1 rounded-md ${selectedWeekdays.includes(day)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {currentSchedule?.frequency === WorkFrequency.CUSTOM && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés (semaines paires)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleEvenWeekdayToggle(day)}
                                        className={`px-3 py-1 rounded-md ${selectedEvenWeekdays.includes(day)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés (semaines impaires)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleOddWeekdayToggle(day)}
                                        className={`px-3 py-1 rounded-md ${selectedOddWeekdays.includes(day)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Dates de validité */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début de validité
                    </label>
                    <input
                        type="date"
                        value={currentSchedule?.validFrom ? new Date(currentSchedule.validFrom).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateScheduleField('validFrom', new Date(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin de validité (optionnel)
                    </label>
                    <input
                        type="date"
                        value={currentSchedule?.validTo ? new Date(currentSchedule.validTo).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateScheduleField('validTo', e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Nombre de jours de congés annuels */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jours de congés annuels
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentSchedule?.annualLeaveAllowance || 0}
                        onChange={(e) => updateScheduleField('annualLeaveAllowance', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Pour un temps plein: 50 jours
                    </p>
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
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
}; 