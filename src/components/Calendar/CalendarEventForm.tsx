import React, { useState, useEffect } from 'react';
import { useDateValidation } from '@/hooks/useDateValidation';
// TODO: These components need to be created or imported from a UI library
// // TODO: These components need to be created or imported from a UI library
// import DatePicker from '@/components/common/DatePicker';
// // TODO: These components need to be created or imported from a UI library
// import TimePicker from '@/components/common/TimePicker';
// // TODO: These components need to be created or imported from a UI library
// import Select from '@/components/common/Select';
// // TODO: These components need to be created or imported from a UI library
// import Button from '@/components/common/Button';
import { fr } from 'date-fns/locale';
import { format, addDays, addHours, startOfDay, setHours, setMinutes } from 'date-fns';

// Types d'événements de calendrier
export enum CalendarEventType {
    GARDE = 'garde',
    ASTREINTE = 'astreinte',
    REUNION = 'reunion',
    CONSULTATION = 'consultation',
    BLOC = 'bloc',
    AUTRE = 'autre'
}

// Interface pour un événement de calendrier
export interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    type: CalendarEventType;
    startDateTime: Date;
    endDateTime: Date;
    allDay: boolean;
    departmentId?: string;
    location?: string;
    userId?: string;
    attendees?: string[];
    color?: string;
}

// Props du composant
interface CalendarEventFormProps {
    event?: Partial<CalendarEvent>;
    existingEvents?: { id: string; start: Date; end: Date; title?: string }[];
    holidays?: Date[];
    blackoutPeriods?: { start: Date; end: Date; label?: string }[];
    departments?: { id: string; name: string }[];
    users?: { id: string; name: string }[];
    minAdvanceNotice?: number;
    onSubmit: (event: CalendarEvent) => Promise<void> | void;
    onCancel: () => void;
}

/**
 * Formulaire de création/édition d'événements calendrier
 * Utilise le hook useDateValidation pour valider les dates
 */
const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
    event,
    existingEvents = [],
    holidays = [],
    blackoutPeriods = [],
    departments = [],
    users = [],
    minAdvanceNotice = 0,
    onSubmit,
    onCancel
}) => {
    // État initial pour l'événement
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        title: '',
        description: '',
        type: CalendarEventType.AUTRE,
        startDateTime: addHours(startOfDay(new Date()), 9), // 9h00 aujourd'hui
        endDateTime: addHours(startOfDay(new Date()), 10), // 10h00 aujourd'hui
        allDay: false,
        departmentId: '',
        location: '',
        userId: '',
        attendees: [],
        color: '#4f46e5', // Indigo par défaut
        ...event // Écrase les valeurs par défaut si un événement est fourni
    });

    // Utilisations du hook de validation de dates
    const {
        validateDate,
        validateDateRange,
        hasError,
        getErrorMessage,
        resetErrors,
        setContext
    } = useDateValidation();

    // Mise à jour du contexte de validation
    useEffect(() => {
        setContext({
            userId: formData.userId,
            departmentId: formData.departmentId,
            eventType: formData.type
        });
    }, [formData.userId, formData.departmentId, formData.type, setContext]);

    // Gestionnaire de changement pour les champs de texte et select
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Gestionnaire pour le changement de type d'événement
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as CalendarEventType;

        // Réinitialiser les erreurs car les règles peuvent changer
        resetErrors();

        setFormData(prev => {
            // Ajuster la durée en fonction du type d'événement
            let endDateTime = prev.endDateTime;
            if (prev.startDateTime) {
                switch (newType) {
                    case CalendarEventType.GARDE:
                        // Une garde dure 24h
                        endDateTime = addDays(prev.startDateTime, 1);
                        break;
                    case CalendarEventType.ASTREINTE:
                        // Une astreinte dure 24h
                        endDateTime = addDays(prev.startDateTime, 1);
                        break;
                    case CalendarEventType.REUNION:
                        // Une réunion dure 1h par défaut
                        endDateTime = addHours(prev.startDateTime, 1);
                        break;
                    case CalendarEventType.CONSULTATION:
                        // Une consultation dure 4h par défaut
                        endDateTime = addHours(prev.startDateTime, 4);
                        break;
                    case CalendarEventType.BLOC:
                        // Un bloc dure 4h par défaut
                        endDateTime = addHours(prev.startDateTime, 4);
                        break;
                    default:
                        // Type autre, on laisse la durée actuelle
                        break;
                }
            }

            return {
                ...prev,
                type: newType,
                endDateTime,
                allDay: newType === CalendarEventType.GARDE || newType === CalendarEventType.ASTREINTE
            };
        });
    };

    // Gestionnaire pour le changement de la date de début
    const handleStartDateChange = (date: Date | null) => {
        if (!date) return;

        resetErrors();

        // Valider la date de début
        const dateValidationOptions = {
            required: true,
            allowPastDates: false,
            minAdvanceNotice,
            holidays,
            blackoutPeriods,
            // Pour certains types d'événements, les weekends sont autorisés
            disallowWeekends: ![CalendarEventType.GARDE, CalendarEventType.ASTREINTE].includes(formData.type as CalendarEventType)
        };

        validateDate(date, 'startDateTime', dateValidationOptions);

        // Ajuster la date de fin en fonction du type d'événement
        let endDateTime: Date;
        switch (formData.type) {
            case CalendarEventType.GARDE:
            case CalendarEventType.ASTREINTE:
                endDateTime = addDays(date, 1);
                break;
            default:
                // Conserver la même durée
                const currentDuration = formData.endDateTime ?
                    (formData.endDateTime.getTime() - (formData.startDateTime?.getTime() || 0)) / (1000 * 60 * 60) :
                    1;
                endDateTime = addHours(date, currentDuration);
        }

        setFormData(prev => ({
            ...prev,
            startDateTime: date,
            endDateTime
        }));

        // Valider également la plage de dates si la date de fin existe
        if (endDateTime) {
            validateDateRange(
                date,
                endDateTime,
                'startDateTime',
                'endDateTime',
                {
                    existingEvents: event?.id ?
                        existingEvents.filter(e => e.id !== event.id) :
                        existingEvents
                }
            );
        }
    };

    // Gestionnaire pour le changement de l'heure de début
    const handleStartTimeChange = (time: Date | null) => {
        if (!time || !formData.startDateTime) return;

        resetErrors();

        const newStartDateTime = new Date(formData.startDateTime);
        newStartDateTime.setHours(time.getHours(), time.getMinutes());

        // Ajuster la date de fin pour maintenir la même durée
        let newEndDateTime: Date;
        if (formData.endDateTime) {
            const durationMs = formData.endDateTime.getTime() - formData.startDateTime.getTime();
            newEndDateTime = new Date(newStartDateTime.getTime() + durationMs);
        } else {
            newEndDateTime = addHours(newStartDateTime, 1);
        }

        setFormData(prev => ({
            ...prev,
            startDateTime: newStartDateTime,
            endDateTime: newEndDateTime
        }));

        // Valider la plage de dates
        validateDateRange(
            newStartDateTime,
            newEndDateTime,
            'startDateTime',
            'endDateTime',
            {
                existingEvents: event?.id ?
                    existingEvents.filter(e => e.id !== event.id) :
                    existingEvents
            }
        );
    };

    // Gestionnaire pour le changement de la date de fin
    const handleEndDateChange = (date: Date | null) => {
        if (!date || !formData.startDateTime) return;

        resetErrors();

        // Si la date de fin est avant la date de début, on la corrige
        let correctedDate = date;
        if (date < formData.startDateTime) {
            correctedDate = new Date(formData.startDateTime);
        }

        // Conserver l'heure de fin existante
        const newEndDateTime = formData.endDateTime ?
            setHours(
                setMinutes(correctedDate, formData.endDateTime.getMinutes()),
                formData.endDateTime.getHours()
            ) :
            addHours(correctedDate, 1);

        setFormData(prev => ({ ...prev, endDateTime: newEndDateTime }));

        // Valider la plage de dates
        validateDateRange(
            formData.startDateTime,
            newEndDateTime,
            'startDateTime',
            'endDateTime',
            {
                minDuration: getMinDurationForType(formData.type as CalendarEventType),
                maxDuration: getMaxDurationForType(formData.type as CalendarEventType),
                existingEvents: event?.id ?
                    existingEvents.filter(e => e.id !== event.id) :
                    existingEvents
            }
        );
    };

    // Gestionnaire pour le changement de l'heure de fin
    const handleEndTimeChange = (time: Date | null) => {
        if (!time || !formData.endDateTime) return;

        resetErrors();

        const newEndDateTime = new Date(formData.endDateTime);
        newEndDateTime.setHours(time.getHours(), time.getMinutes());

        // Vérifier que l'heure de fin est après l'heure de début
        if (formData.startDateTime && newEndDateTime <= formData.startDateTime) {
            // Si non, ajouter une heure à l'heure de début
            newEndDateTime.setTime(formData.startDateTime.getTime() + 60 * 60 * 1000);
        }

        setFormData(prev => ({ ...prev, endDateTime: newEndDateTime }));

        // Valider la plage de dates
        if (formData.startDateTime) {
            validateDateRange(
                formData.startDateTime,
                newEndDateTime,
                'startDateTime',
                'endDateTime',
                {
                    existingEvents: event?.id ?
                        existingEvents.filter(e => e.id !== event.id) :
                        existingEvents
                }
            );
        }
    };

    // Gestionnaire pour le changement du mode "Toute la journée"
    const handleAllDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isAllDay = e.target.checked;

        resetErrors();

        setFormData(prev => {
            let startDateTime = prev.startDateTime;
            let endDateTime = prev.endDateTime;

            if (isAllDay && startDateTime) {
                // Si on passe en mode "toute la journée", on met 00:00 pour le début
                // et 23:59 pour la fin
                startDateTime = startOfDay(startDateTime);
                endDateTime = startDateTime ? addDays(startOfDay(startDateTime), 1) : undefined;
            }

            return { ...prev, allDay: isAllDay, startDateTime, endDateTime };
        });
    };

    // Obtenir la durée minimale en fonction du type d'événement
    const getMinDurationForType = (type: CalendarEventType): number => {
        switch (type) {
            case CalendarEventType.GARDE:
            case CalendarEventType.ASTREINTE:
                return 24; // 24h minimum
            case CalendarEventType.BLOC:
                return 2; // 2h minimum
            case CalendarEventType.CONSULTATION:
                return 1; // 1h minimum
            case CalendarEventType.REUNION:
                return 0.5; // 30min minimum
            default:
                return 0.25; // 15min minimum
        }
    };

    // Obtenir la durée maximale en fonction du type d'événement
    const getMaxDurationForType = (type: CalendarEventType): number => {
        switch (type) {
            case CalendarEventType.GARDE:
            case CalendarEventType.ASTREINTE:
                return 48; // 48h maximum
            case CalendarEventType.BLOC:
                return 12; // 12h maximum
            case CalendarEventType.CONSULTATION:
                return 8; // 8h maximum
            case CalendarEventType.REUNION:
                return 4; // 4h maximum
            default:
                return 24; // 24h maximum
        }
    };

    // Gestionnaire de soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetErrors();

        // Valider les champs requis
        let isValid = true;

        if (!formData.title?.trim()) {
            isValid = false;
            // Ajouter une erreur pour le titre
        }

        // Valider la date de début
        if (formData.startDateTime) {
            const startDateOptions = {
                required: true,
                allowPastDates: Boolean(event?.id), // Autoriser les dates passées en édition
                minAdvanceNotice: event?.id ? 0 : minAdvanceNotice, // Pas de préavis minimum en édition
                holidays,
                blackoutPeriods,
                disallowWeekends: ![CalendarEventType.GARDE, CalendarEventType.ASTREINTE].includes(formData.type as CalendarEventType)
            };

            isValid = validateDate(formData.startDateTime, 'startDateTime', startDateOptions) && isValid;
        } else {
            isValid = false;
            // Ajouter une erreur pour la date de début manquante
        }

        // Valider la plage de dates
        if (formData.startDateTime && formData.endDateTime) {
            const dateRangeOptions = {
                minDuration: getMinDurationForType(formData.type as CalendarEventType),
                maxDuration: getMaxDurationForType(formData.type as CalendarEventType),
                existingEvents: event?.id ?
                    existingEvents.filter(e => e.id !== event.id) :
                    existingEvents
            };

            isValid = validateDateRange(
                formData.startDateTime,
                formData.endDateTime,
                'startDateTime',
                'endDateTime',
                dateRangeOptions
            ) && isValid;
        }

        // Si tout est valide, soumettre l'événement
        if (isValid && formData.title && formData.startDateTime && formData.endDateTime && formData.type) {
            await onSubmit({
                title: formData.title,
                description: formData.description || '',
                type: formData.type as CalendarEventType,
                startDateTime: formData.startDateTime,
                endDateTime: formData.endDateTime,
                allDay: formData.allDay || false,
                departmentId: formData.departmentId,
                location: formData.location,
                userId: formData.userId,
                attendees: formData.attendees || [],
                color: formData.color,
                ...(event?.id ? { id: event.id } : {})
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Type d'événement */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type d'événement <span className="text-red-500">*</span>
                    </label>
                    <Select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleTypeChange}
                        className={`mt-1 block w-full ${hasError('type') ? 'border-red-500' : ''}`}
                    >
                        <option value={CalendarEventType.AUTRE}>Autre</option>
                        <option value={CalendarEventType.GARDE}>Garde</option>
                        <option value={CalendarEventType.ASTREINTE}>Astreinte</option>
                        <option value={CalendarEventType.REUNION}>Réunion</option>
                        <option value={CalendarEventType.CONSULTATION}>Consultation</option>
                        <option value={CalendarEventType.BLOC}>Bloc opératoire</option>
                    </Select>
                    {hasError('type') && (
                        <p className="mt-1 text-sm text-red-600">{getErrorMessage('type')}</p>
                    )}
                </div>

                {/* Titre */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Titre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${!formData.title ? 'border-red-500' : ''
                            }`}
                        required
                    />
                    {!formData.title && (
                        <p className="mt-1 text-sm text-red-600">Le titre est requis</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                {/* Mode "Toute la journée" */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="allDay"
                        name="allDay"
                        checked={formData.allDay}
                        onChange={handleAllDayChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        disabled={[CalendarEventType.GARDE, CalendarEventType.ASTREINTE].includes(formData.type as CalendarEventType)}
                    />
                    <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">
                        Toute la journée
                    </label>
                </div>

                {/* Date et heure de début */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Date de début <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={formData.startDateTime}
                            onChange={handleStartDateChange}
                            dateFormat="dd/MM/yyyy"
                            className={`mt-1 block w-full ${hasError('startDateTime') ? 'border-red-500' : ''}`}
                            locale={fr}
                        />
                        {hasError('startDateTime') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('startDateTime')}</p>
                        )}
                    </div>

                    {!formData.allDay && (
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                                Heure de début <span className="text-red-500">*</span>
                            </label>
                            <TimePicker
                                selected={formData.startDateTime}
                                onChange={handleStartTimeChange}
                                timeFormat="HH:mm"
                                className={`mt-1 block w-full ${hasError('startDateTime') ? 'border-red-500' : ''}`}
                            />
                        </div>
                    )}
                </div>

                {/* Date et heure de fin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            Date de fin <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={formData.endDateTime}
                            onChange={handleEndDateChange}
                            dateFormat="dd/MM/yyyy"
                            className={`mt-1 block w-full ${hasError('endDateTime') || hasError('dateRange') ? 'border-red-500' : ''}`}
                            locale={fr}
                            minDate={formData.startDateTime || undefined}
                        />
                        {hasError('endDateTime') && (
                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('endDateTime')}</p>
                        )}
                    </div>

                    {!formData.allDay && (
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                                Heure de fin <span className="text-red-500">*</span>
                            </label>
                            <TimePicker
                                selected={formData.endDateTime}
                                onChange={handleEndTimeChange}
                                timeFormat="HH:mm"
                                className={`mt-1 block w-full ${hasError('endDateTime') || hasError('dateRange') ? 'border-red-500' : ''}`}
                            />
                        </div>
                    )}
                </div>

                {/* Erreurs de plage de dates */}
                {hasError('dateRange') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('dateRange')}</p>
                )}

                {/* Service */}
                <div>
                    <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                        Service
                    </label>
                    <Select
                        id="departmentId"
                        name="departmentId"
                        value={formData.departmentId || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full"
                    >
                        <option value="">Sélectionner un service</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Lieu */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Lieu
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                {/* Utilisateur assigné */}
                <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                        Personne assignée
                    </label>
                    <Select
                        id="userId"
                        name="userId"
                        value={formData.userId || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full"
                    >
                        <option value="">Sélectionner une personne</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit" variant="primary">
                    {event?.id ? 'Mettre à jour' : 'Créer'}
                </Button>
            </div>
        </form>
    );
};

export default CalendarEventForm; 