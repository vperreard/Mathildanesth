import React, { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDateValidation, ValidationOptions as DateValidationOptions } from '../../hooks/useDateValidation';
import ErrorBoundary from '../../components/ErrorBoundary';
import ErrorRetry from '../../components/ErrorRetry';

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    label?: string;
    startLabel?: string;
    endLabel?: string;
    minDate?: Date;
    maxDate?: Date;
    validationOptions?: DateValidationOptions;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    className?: string;
    onValidationChange?: (isValid: boolean) => void;
    existingRanges?: Array<{ start: Date; end: Date; label?: string }>;
}

/**
 * Composant de sélection de plage de dates avec validation intégrée
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    label = 'Période',
    startLabel = 'Date de début',
    endLabel = 'Date de fin',
    minDate,
    maxDate,
    validationOptions = {},
    required = false,
    disabled = false,
    name = 'dateRange',
    className = '',
    onValidationChange,
    existingRanges = []
}) => {
    const [startInputValue, setStartInputValue] = useState<string>(
        startDate ? format(startDate, 'yyyy-MM-dd') : ''
    );
    const [endInputValue, setEndInputValue] = useState<string>(
        endDate ? format(endDate, 'yyyy-MM-dd') : ''
    );
    const [isValidated, setIsValidated] = useState<boolean>(false);

    // Fusionner les options de validation fournies avec les options par défaut
    const options: DateValidationOptions = {
        required,
        minDate,
        maxDate,
        ...validationOptions
    };

    // Utiliser le hook de validation des dates
    const {
        validateDateRange,
        validateOverlap,
        hasError,
        getErrorMessage,
        resetErrors
    } = useDateValidation();

    // Effectuer la validation lorsque les dates changent
    useEffect(() => {
        if (isValidated || (startDate && endDate)) {
            const isValid = validateDateRange(
                startDate,
                endDate,
                `${name}_start`,
                `${name}_end`,
                options
            );

            // Si des plages existantes sont fournies, vérifier également les chevauchements
            if (isValid && existingRanges.length > 0 && startDate && endDate) {
                validateOverlap(
                    { start: startDate, end: endDate },
                    existingRanges,
                    name
                );
            }

            if (onValidationChange) {
                onValidationChange(isValid);
            }
        }
    }, [startDate, endDate, options, name, validateDateRange, validateOverlap, existingRanges, onValidationChange, isValidated]);

    // Réinitialiser les erreurs lorsque le composant est monté ou démonté
    useEffect(() => {
        return () => {
            resetErrors();
        };
    }, [resetErrors]);

    // Gérer le changement de la date de début
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setStartInputValue(value);
        setIsValidated(true);

        if (value && isValid(parseISO(value))) {
            onStartDateChange(parseISO(value));
        } else {
            onStartDateChange(null);
        }
    };

    // Gérer le changement de la date de fin
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setEndInputValue(value);
        setIsValidated(true);

        if (value && isValid(parseISO(value))) {
            onEndDateChange(parseISO(value));
        } else {
            onEndDateChange(null);
        }
    };

    // Formater l'affichage de la date pour l'utilisateur
    const formatDateForDisplay = (date: Date | null): string => {
        if (!date) return '';
        return format(date, 'dd MMMM yyyy', { locale: fr });
    };

    return (
        <ErrorBoundary>
            <div className={`date-range-picker ${className}`}>
                {label && <label className="date-range-label">{label}</label>}

                <div className="date-range-inputs">
                    <div className="date-input-group">
                        <label htmlFor={`${name}_start`}>{startLabel}</label>
                        <input
                            type="date"
                            id={`${name}_start`}
                            name={`${name}_start`}
                            value={startInputValue}
                            onChange={handleStartDateChange}
                            min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                            max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                            required={required}
                            disabled={disabled}
                            className={hasError(`${name}_start`) ? 'input-error' : ''}
                        />
                        {hasError(`${name}_start`) && (
                            <p className="error-message">{getErrorMessage(`${name}_start`)}</p>
                        )}
                    </div>

                    <div className="date-input-group">
                        <label htmlFor={`${name}_end`}>{endLabel}</label>
                        <input
                            type="date"
                            id={`${name}_end`}
                            name={`${name}_end`}
                            value={endInputValue}
                            onChange={handleEndDateChange}
                            min={startDate ? format(startDate, 'yyyy-MM-dd') : minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                            max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                            required={required}
                            disabled={disabled}
                            className={hasError(`${name}_end`) ? 'input-error' : ''}
                        />
                        {hasError(`${name}_end`) && (
                            <p className="error-message">{getErrorMessage(`${name}_end`)}</p>
                        )}
                    </div>
                </div>

                {hasError(name) && (
                    <p className="error-message">{getErrorMessage(name)}</p>
                )}

                {startDate && endDate && !hasError(`${name}_start`) && !hasError(`${name}_end`) && !hasError(name) && (
                    <div className="date-range-summary">
                        <p>
                            Période sélectionnée: du <strong>{formatDateForDisplay(startDate)}</strong> au{' '}
                            <strong>{formatDateForDisplay(endDate)}</strong>
                        </p>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

/**
 * Version du DateRangePicker avec gestion automatique des erreurs d'API
 */
export const DateRangePickerWithErrorHandling: React.FC<DateRangePickerProps & {
    loadExistingRanges?: () => Promise<Array<{ start: Date; end: Date; label?: string }>>;
}> = ({ loadExistingRanges, ...props }) => {
    if (!loadExistingRanges) {
        return <DateRangePicker {...props} />;
    }

    return (
        <ErrorRetry
            action={loadExistingRanges}
            maxRetries={2}
            onSuccess={(ranges) => {
                // Les plages existantes sont chargées avec succès
                console.log(`${ranges.length} plages existantes chargées`);
            }}
        >
            {(loadedRanges) => (
                <DateRangePicker
                    {...props}
                    existingRanges={loadedRanges || []}
                />
            )}
        </ErrorRetry>
    );
};

export default DateRangePicker; 