import React, { useState, useEffect } from 'react';
import { useDateValidation, DateValidationErrorType, BlackoutPeriod } from '@/hooks/useDateValidation';
import DatePicker from '@/components/common/DatePicker';
import { addDays, format, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '@/components/common/Button';
import Alert from '@/components/common/Alert';

// Jours fériés français pour l'exemple
const HOLIDAYS_2023 = [
    new Date('2023-01-01'), // Jour de l'an
    new Date('2023-04-10'), // Lundi de Pâques
    new Date('2023-05-01'), // Fête du Travail
    new Date('2023-05-08'), // Victoire 1945
    new Date('2023-05-18'), // Ascension
    new Date('2023-05-29'), // Lundi de Pentecôte
    new Date('2023-07-14'), // Fête nationale
    new Date('2023-08-15'), // Assomption
    new Date('2023-11-01'), // Toussaint
    new Date('2023-11-11'), // Armistice
    new Date('2023-12-25')  // Noël
];

// Périodes d'interdiction pour l'exemple
const BLACKOUT_PERIODS: BlackoutPeriod[] = [
    {
        start: new Date('2023-07-15'),
        end: new Date('2023-08-15'),
        label: 'Période estivale réservée'
    },
    {
        start: new Date('2023-12-20'),
        end: new Date('2023-12-31'),
        label: 'Période des fêtes réservée'
    }
];

/**
 * Composant d'exemple montrant l'utilisation du hook useDateValidation
 * dans un formulaire de demande de congés
 */
const DateValidationExample: React.FC = () => {
    // États pour les dates
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Utilisation du hook de validation
    const {
        validateDate,
        validateDateRange,
        hasError,
        getErrorMessage,
        resetErrors,
        setContext
    } = useDateValidation();

    // Configuration du contexte (jours utilisés/restants)
    useEffect(() => {
        // Simulation de jours déjà utilisés
        setContext({
            usedDays: 15,
            remainingDays: 10
        });
    }, [setContext]);

    // Options de validation pour les dates
    const dateValidationOptions = {
        required: true,
        allowPastDates: false,
        disallowWeekends: true,
        minAdvanceNotice: 7, // Préavis minimum de 7 jours
        maxAdvanceNotice: 180, // Maximum 6 mois à l'avance
        holidays: HOLIDAYS_2023,
        blackoutPeriods: BLACKOUT_PERIODS,
        onlyBusinessDays: true
    };

    // Options de validation pour la plage de dates
    const rangeValidationOptions = {
        minDuration: 1,
        maxDuration: 30,
        availableDaysPerYear: 25
    };

    // Gestionnaire de changement de date de début
    const handleStartDateChange = (date: Date | null) => {
        setStartDate(date);
        resetErrors();

        if (date) {
            validateDate(date, 'startDate', dateValidationOptions);

            // Si la date de fin existe, valider aussi la plage
            if (endDate) {
                validateDateRange(date, endDate, 'startDate', 'endDate', rangeValidationOptions);
            }
        }
    };

    // Gestionnaire de changement de date de fin
    const handleEndDateChange = (date: Date | null) => {
        setEndDate(date);
        resetErrors();

        if (date) {
            validateDate(date, 'endDate', dateValidationOptions);

            // Si la date de début existe, valider aussi la plage
            if (startDate) {
                validateDateRange(startDate, date, 'startDate', 'endDate', rangeValidationOptions);
            }
        }
    };

    // Gestionnaire de soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        resetErrors();
        setShowSuccess(false);

        // Valider les deux dates individuellement
        const isStartDateValid = validateDate(startDate, 'startDate', dateValidationOptions);
        const isEndDateValid = validateDate(endDate, 'endDate', dateValidationOptions);

        // Valider la plage de dates si les deux dates sont présentes
        let isRangeValid = true;
        if (startDate && endDate) {
            isRangeValid = validateDateRange(startDate, endDate, 'startDate', 'endDate', rangeValidationOptions);
        }

        // Si tout est valide, soumettre la demande
        if (isStartDateValid && isEndDateValid && isRangeValid) {
            // Simuler une soumission réussie
            console.log('Demande de congé soumise:', {
                startDate,
                endDate,
                durationDays: startDate && endDate ? (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1 : 0
            });

            setShowSuccess(true);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Demande de congé</h2>

            {showSuccess && (
                <Alert
                    type="success"
                    title="Demande envoyée"
                    message="Votre demande de congé a été soumise avec succès."
                    className="mb-4"
                />
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Date de début */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date de début <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={startDate}
                            onChange={handleStartDateChange}
                            minDate={addDays(startOfToday(), dateValidationOptions.minAdvanceNotice)}
                            maxDate={addDays(startOfToday(), dateValidationOptions.maxAdvanceNotice)}
                            placeholderText="Sélectionner une date"
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                            excludeDates={HOLIDAYS_2023}
                            filterDate={(date) => {
                                // Exclure les weekends
                                const day = date.getDay();
                                return day !== 0 && day !== 6;
                            }}
                            className={`block w-full p-2 border rounded-md ${hasError('startDate') ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {hasError('startDate') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('startDate')}</p>
                        )}
                    </div>

                    {/* Date de fin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date de fin <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={endDate}
                            onChange={handleEndDateChange}
                            minDate={startDate || addDays(startOfToday(), dateValidationOptions.minAdvanceNotice)}
                            maxDate={addDays(startOfToday(), dateValidationOptions.maxAdvanceNotice)}
                            placeholderText="Sélectionner une date"
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                            excludeDates={HOLIDAYS_2023}
                            filterDate={(date) => {
                                // Exclure les weekends
                                const day = date.getDay();
                                return day !== 0 && day !== 6;
                            }}
                            className={`block w-full p-2 border rounded-md ${hasError('endDate') ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {hasError('endDate') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('endDate')}</p>
                        )}
                    </div>
                </div>

                {/* Infos sur les périodes d'interdiction */}
                <div className="mb-6 text-sm text-gray-600">
                    <h3 className="font-medium mb-2">Périodes non disponibles :</h3>
                    <ul className="list-disc pl-5">
                        {BLACKOUT_PERIODS.map((period, index) => (
                            <li key={index}>
                                {period.label} ({format(period.start, 'dd/MM/yyyy')} au {format(period.end, 'dd/MM/yyyy')})
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Infos sur les jours disponibles */}
                <div className="mb-6 p-3 bg-blue-50 rounded-md text-blue-800">
                    <p>Jours restants : <strong>10</strong> / 25</p>
                    {startDate && endDate && (
                        <p className="mt-1">
                            Durée sélectionnée : <strong>{Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}</strong> jour(s)
                        </p>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button type="submit" variant="primary">
                        Soumettre la demande
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DateValidationExample; 