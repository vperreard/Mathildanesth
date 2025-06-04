import { useState, useCallback } from 'react';

// Simplified date validation hook for leaves module
export interface DateValidationOptions {
    required?: boolean;
    allowPastDates?: boolean;
    minDuration?: number;
    businessDaysOnly?: boolean;
}

export interface DateValidationError {
    field: string;
    message: string;
    type: string;
}

export interface DateValidationResult {
    isValid: boolean;
    errors: DateValidationError[];
    workingDays: number;
}

/**
 * Simple date validation hook for the leaves module
 * Provides basic date validation functionality for other hooks
 */
export const useDateValidation = () => {
    const [errors, setErrors] = useState<DateValidationError[]>([]);

    /**
     * Reset all validation errors
     */
    const resetErrors = useCallback(() => {
        setErrors([]);
    }, []);

    /**
     * Validate a single date
     */
    const validateDate = useCallback((
        date: Date | null,
        fieldName: string,
        options: DateValidationOptions = {}
    ): boolean => {
        const newErrors: DateValidationError[] = [];

        // Check if date is required
        if (options.required && !date) {
            newErrors.push({
                field: fieldName,
                message: 'Cette date est requise',
                type: 'required'
            });
            setErrors(prev => [...prev.filter(e => e.field !== fieldName), ...newErrors]);
            return false;
        }

        if (!date) {
            // If not required and null, it's valid
            setErrors(prev => prev.filter(e => e.field !== fieldName));
            return true;
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            newErrors.push({
                field: fieldName,
                message: 'Date invalide',
                type: 'invalid'
            });
            setErrors(prev => [...prev.filter(e => e.field !== fieldName), ...newErrors]);
            return false;
        }

        // Check past dates if not allowed
        if (!options.allowPastDates) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setHours(0, 0, 0, 0);

            if (dateToCheck < today) {
                newErrors.push({
                    field: fieldName,
                    message: 'Les dates passées ne sont pas autorisées',
                    type: 'past_date'
                });
                setErrors(prev => [...prev.filter(e => e.field !== fieldName), ...newErrors]);
                return false;
            }
        }

        // If all checks pass, remove any existing errors for this field
        setErrors(prev => prev.filter(e => e.field !== fieldName));
        return true;
    }, []);

    /**
     * Validate a date range
     */
    const validateDateRange = useCallback((
        startDate: Date | null,
        endDate: Date | null,
        startFieldName: string,
        endFieldName: string,
        options: DateValidationOptions = {}
    ): boolean => {
        let isValid = true;

        // Validate individual dates first
        const startValid = validateDate(startDate, startFieldName, options);
        const endValid = validateDate(endDate, endFieldName, options);

        if (!startValid || !endValid) {
            return false;
        }

        // If both dates are null and not required, it's valid
        if (!startDate && !endDate && !options.required) {
            return true;
        }

        // If we have both dates, validate the range
        if (startDate && endDate) {
            if (startDate > endDate) {
                const rangeError: DateValidationError = {
                    field: startFieldName,
                    message: 'La date de début doit être antérieure à la date de fin',
                    type: 'range_invalid'
                };
                setErrors(prev => [...prev.filter(e => e.field !== startFieldName || e.type !== 'range_invalid'), rangeError]);
                isValid = false;
            } else {
                // Remove any existing range errors
                setErrors(prev => prev.filter(e => !(e.field === startFieldName && e.type === 'range_invalid')));
            }

            // Check minimum duration if specified
            if (options.minDuration && isValid) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (diffDays < options.minDuration) {
                    const durationError: DateValidationError = {
                        field: endFieldName,
                        message: `La période doit durer au moins ${options.minDuration} jour(s)`,
                        type: 'min_duration'
                    };
                    setErrors(prev => [...prev.filter(e => e.field !== endFieldName || e.type !== 'min_duration'), durationError]);
                    isValid = false;
                } else {
                    // Remove any existing duration errors
                    setErrors(prev => prev.filter(e => !(e.field === endFieldName && e.type === 'min_duration')));
                }
            }
        }

        return isValid;
    }, [validateDate]);

    /**
     * Get all current errors
     */
    const getAllErrors = useCallback(() => {
        return errors;
    }, [errors]);

    /**
     * Check if there are any errors
     */
    const hasErrors = useCallback(() => {
        return errors.length > 0;
    }, [errors]);

    /**
     * Get errors for a specific field
     */
    const getFieldErrors = useCallback((fieldName: string) => {
        return errors.filter(error => error.field === fieldName);
    }, [errors]);

    return {
        validateDate,
        validateDateRange,
        resetErrors,
        getAllErrors,
        hasErrors,
        getFieldErrors,
        errors
    };
};