import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern
} from '../types/leave';
import { formatRecurrencePattern } from '../utils/recurringLeavesUtils';

interface RecurrenceFormProps {
    value: RecurrencePattern;
    onChange: (pattern: RecurrencePattern) => void;
    onCancel?: () => void;
    initialStartDate?: Date;
    hasError?: (fieldName: string) => boolean;
    getErrorMessage?: (fieldName: string) => string | null;
    fieldPrefix?: string;
}

const WEEKDAYS = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
];

/**
 * Composant pour configurer un template de récurrence de congés
 */
export const RecurrenceForm: React.FC<RecurrenceFormProps> = ({
    value,
    onChange,
    onCancel,
    initialStartDate,
    hasError = () => false,
    getErrorMessage = () => null,
    fieldPrefix = 'recurring_pattern'
}) => {
    // État local pour gérer les modifications
    const [pattern, setPattern] = useState<RecurrencePattern>(value);

    // Mettre à jour l'état local quand la valeur change
    useEffect(() => {
        setPattern(value);
    }, [value]);

    // Gérer les modifications de champs
    const handleChange = (field: keyof RecurrencePattern, newValue: any) => {
        const updatedPattern = { ...pattern, [field]: newValue };
        setPattern(updatedPattern);
        onChange(updatedPattern);
    };

    // Gérer le changement de fréquence
    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const frequency = e.target.value as RecurrenceFrequency;
        const updatedPattern = { ...pattern, frequency };

        // Réinitialiser les champs spécifiques à certaines fréquences
        if (frequency !== RecurrenceFrequency.WEEKLY) {
            updatedPattern.weekdays = undefined;
        } else if (!updatedPattern.weekdays || updatedPattern.weekdays.length === 0) {
            // Par défaut, sélectionner le jour de initialStartDate ou le jour actuel
            const dayOfWeek = initialStartDate?.getDay() ?? new Date().getDay();
            updatedPattern.weekdays = [dayOfWeek];
        }

        if (frequency !== RecurrenceFrequency.MONTHLY) {
            updatedPattern.dayOfMonth = undefined;
            updatedPattern.weekOfMonth = undefined;
        } else if (!updatedPattern.dayOfMonth) {
            // Par défaut, utiliser le jour du mois de initialStartDate ou le jour actuel
            updatedPattern.dayOfMonth = initialStartDate?.getDate() ?? new Date().getDate();
        }

        setPattern(updatedPattern);
        onChange(updatedPattern);
    };

    // Gérer le changement de type de fin
    const handleEndTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const endType = e.target.value as RecurrenceEndType;
        const updatedPattern = { ...pattern, endType };

        // Réinitialiser les champs spécifiques au type de fin
        if (endType !== RecurrenceEndType.UNTIL_DATE) {
            updatedPattern.endDate = undefined;
        } else if (!updatedPattern.endDate) {
            // Par défaut, endDate est 1 an après initialStartDate
            const oneYearFromStart = new Date();
            if (initialStartDate) {
                oneYearFromStart.setFullYear(initialStartDate.getFullYear() + 1);
                oneYearFromStart.setMonth(initialStartDate.getMonth());
                oneYearFromStart.setDate(initialStartDate.getDate());
            }
            updatedPattern.endDate = oneYearFromStart;
        }

        if (endType !== RecurrenceEndType.COUNT) {
            updatedPattern.endCount = undefined;
        } else if (!updatedPattern.endCount) {
            updatedPattern.endCount = 10; // Valeur par défaut
        }

        setPattern(updatedPattern);
        onChange(updatedPattern);
    };

    // Gérer le changement de jour de la semaine
    const handleWeekdayToggle = (day: number) => {
        let weekdays = [...(pattern.weekdays || [])];

        if (weekdays.includes(day)) {
            weekdays = weekdays.filter(d => d !== day);
        } else {
            weekdays.push(day);
        }

        // S'assurer qu'il y a toujours au moins un jour sélectionné
        if (weekdays.length === 0) {
            return;
        }

        handleChange('weekdays', weekdays);
    };

    return (
        <div className="recurrence-form">
            <h3>Configuration de la récurrence</h3>

            {/* Prévisualisation du template */}
            <div className="recurrence-preview">
                <p>
                    <strong>Résumé :</strong> {formatRecurrencePattern(pattern)}
                </p>
            </div>

            {/* Fréquence de récurrence */}
            <div className="form-group">
                <label htmlFor={`${fieldPrefix}_frequency`}>Fréquence</label>
                <select
                    id={`${fieldPrefix}_frequency`}
                    value={pattern.frequency}
                    onChange={handleFrequencyChange}
                    className={hasError(`${fieldPrefix}_frequency`) ? 'error' : ''}
                >
                    <option value={RecurrenceFrequency.DAILY}>Quotidienne</option>
                    <option value={RecurrenceFrequency.WEEKLY}>Hebdomadaire</option>
                    <option value={RecurrenceFrequency.MONTHLY}>Mensuelle</option>
                    <option value={RecurrenceFrequency.YEARLY}>Annuelle</option>
                </select>
                {hasError(`${fieldPrefix}_frequency`) && (
                    <div className="error-message">{getErrorMessage(`${fieldPrefix}_frequency`)}</div>
                )}
            </div>

            {/* Intervalle */}
            <div className="form-group">
                <label htmlFor={`${fieldPrefix}_interval`}>Répéter tous les</label>
                <div className="interval-input">
                    <input
                        id={`${fieldPrefix}_interval`}
                        type="number"
                        min="1"
                        max="99"
                        value={pattern.interval}
                        onChange={e => handleChange('interval', parseInt(e.target.value, 10) || 1)}
                        className={hasError(`${fieldPrefix}_interval`) ? 'error' : ''}
                    />
                    <span className="interval-label">
                        {pattern.frequency === RecurrenceFrequency.DAILY && ' jour(s)'}
                        {pattern.frequency === RecurrenceFrequency.WEEKLY && ' semaine(s)'}
                        {pattern.frequency === RecurrenceFrequency.MONTHLY && ' mois'}
                        {pattern.frequency === RecurrenceFrequency.YEARLY && ' année(s)'}
                    </span>
                </div>
                {hasError(`${fieldPrefix}_interval`) && (
                    <div className="error-message">{getErrorMessage(`${fieldPrefix}_interval`)}</div>
                )}
            </div>

            {/* Jours de la semaine (pour récurrence hebdomadaire) */}
            {pattern.frequency === RecurrenceFrequency.WEEKLY && (
                <div className="form-group">
                    <label>Jours de la semaine</label>
                    <div className="weekdays-selector">
                        {WEEKDAYS.map(day => (
                            <button
                                key={day.value}
                                type="button"
                                className={`weekday-button ${pattern.weekdays?.includes(day.value) ? 'selected' : ''}`}
                                onClick={() => handleWeekdayToggle(day.value)}
                            >
                                {day.label.substring(0, 2)}
                            </button>
                        ))}
                    </div>
                    {hasError(`${fieldPrefix}_weekdays`) && (
                        <div className="error-message">{getErrorMessage(`${fieldPrefix}_weekdays`)}</div>
                    )}
                </div>
            )}

            {/* Jour du mois (pour récurrence mensuelle) */}
            {pattern.frequency === RecurrenceFrequency.MONTHLY && (
                <div className="form-group">
                    <label htmlFor={`${fieldPrefix}_dayOfMonth`}>Jour du mois</label>
                    <input
                        id={`${fieldPrefix}_dayOfMonth`}
                        type="number"
                        min="1"
                        max="31"
                        value={pattern.dayOfMonth || 1}
                        onChange={e => handleChange('dayOfMonth', parseInt(e.target.value, 10) || 1)}
                        className={hasError(`${fieldPrefix}_dayOfMonth`) ? 'error' : ''}
                    />
                    {hasError(`${fieldPrefix}_dayOfMonth`) && (
                        <div className="error-message">{getErrorMessage(`${fieldPrefix}_dayOfMonth`)}</div>
                    )}
                </div>
            )}

            {/* Type de fin */}
            <div className="form-group">
                <label htmlFor={`${fieldPrefix}_endType`}>Fin de récurrence</label>
                <select
                    id={`${fieldPrefix}_endType`}
                    value={pattern.endType}
                    onChange={handleEndTypeChange}
                    className={hasError(`${fieldPrefix}_endType`) ? 'error' : ''}
                >
                    <option value={RecurrenceEndType.NEVER}>Jamais</option>
                    <option value={RecurrenceEndType.COUNT}>Après un certain nombre d'occurrences</option>
                    <option value={RecurrenceEndType.UNTIL_DATE}>À une date spécifique</option>
                </select>
                {hasError(`${fieldPrefix}_endType`) && (
                    <div className="error-message">{getErrorMessage(`${fieldPrefix}_endType`)}</div>
                )}
            </div>

            {/* Nombre d'occurrences (pour fin COUNT) */}
            {pattern.endType === RecurrenceEndType.COUNT && (
                <div className="form-group">
                    <label htmlFor={`${fieldPrefix}_endCount`}>Nombre d'occurrences</label>
                    <input
                        id={`${fieldPrefix}_endCount`}
                        type="number"
                        min="1"
                        max="50"
                        value={pattern.endCount || 10}
                        onChange={e => handleChange('endCount', parseInt(e.target.value, 10) || 1)}
                        className={hasError(`${fieldPrefix}_endCount`) ? 'error' : ''}
                    />
                    {hasError(`${fieldPrefix}_endCount`) && (
                        <div className="error-message">{getErrorMessage(`${fieldPrefix}_endCount`)}</div>
                    )}
                </div>
            )}

            {/* Date de fin (pour fin UNTIL_DATE) */}
            {pattern.endType === RecurrenceEndType.UNTIL_DATE && (
                <div className="form-group">
                    <label htmlFor={`${fieldPrefix}_endDate`}>Date de fin</label>
                    <input
                        id={`${fieldPrefix}_endDate`}
                        type="date"
                        value={pattern.endDate ? format(pattern.endDate, 'yyyy-MM-dd') : ''}
                        onChange={e => handleChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                        className={hasError(`${fieldPrefix}_endDate`) ? 'error' : ''}
                    />
                    {hasError(`${fieldPrefix}_endDate`) && (
                        <div className="error-message">{getErrorMessage(`${fieldPrefix}_endDate`)}</div>
                    )}
                </div>
            )}

            {/* Options supplémentaires */}
            <div className="form-group options">
                <label>Options</label>
                <div className="checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={pattern.skipWeekends || false}
                            onChange={e => handleChange('skipWeekends', e.target.checked)}
                        />
                        Ignorer les weekends
                    </label>
                </div>
                <div className="checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={pattern.skipHolidays || false}
                            onChange={e => handleChange('skipHolidays', e.target.checked)}
                        />
                        Ignorer les jours fériés
                    </label>
                </div>
            </div>

            {/* Boutons d'action */}
            {onCancel && (
                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        Annuler
                    </button>
                </div>
            )}
        </div>
    );
}; 