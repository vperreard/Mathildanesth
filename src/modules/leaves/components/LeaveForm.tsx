'use client';

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import axios from 'axios';
import {
    formatDate,
    addDaysToDate,
    isWeekend as isDateWeekend,
    areDatesSameDay,
    parseDate,
    isValidDateObject,
    getDifferenceInDays,
    ISO_DATE_FORMAT,
    getStartOfDay
} from '@/utils/dateUtils';
import { z } from 'zod';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check, Info, HelpCircle } from 'lucide-react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { useLeaveCalculation } from '../hooks/useLeaveCalculation';
import { PublicHolidayDetail, LeaveCalculationOptions } from '../types/leave';

// Enregistrer la locale française pour le DatePicker
registerLocale('fr', fr);

// Interface pour les données des types de congés venant de l'API
interface SelectableLeaveType {
    id: string;
    code: string;
    label: string;
    description?: string;
}

// Interface pour les jours fériés
interface PublicHoliday {
    date: string;
    name: string;
}

// Traductions françaises pour les types de congés
const leaveTypeTranslations: Record<string, string> = {
    'ANNUAL': 'Congé annuel',
    'RECOVERY': 'Récupération (IADE)',
    'TRAINING': 'Formation',
    'SICK': 'Maladie',
    'MATERNITY': 'Maternité',
    'SPECIAL': 'Congé spécial',
    'UNPAID': 'Sans solde',
    'OTHER': 'Autre'
};

// S'assurer que getStartOfDay retourne bien Date et non Date | null, ou ajuster ici.
const safeGetStartOfDay = (date: Date): Date => getStartOfDay(date) || date; // Fallback au cas où, mais getStartOfDay devrait être fiable.

// Définir le schéma Zod pour la validation
const leaveRequestSchema = z.object({
    startDate: z.date({ required_error: "La date de début est requise.", invalid_type_error: "La date de début est invalide." })
        .min(safeGetStartOfDay(new Date()), { message: "La date de début ne peut pas être dans le passé." }),
    endDate: z.date({ required_error: "La date de fin est requise.", invalid_type_error: "La date de fin est invalide." }),
    leaveType: z.string().min(1, "Le type de congé est requis."),
    reason: z.string().optional(),
    isHalfDay: z.boolean().optional(),
    halfDayPeriod: z.enum(['AM', 'PM']).optional(),
}).refine(data => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["endDate"],
}).refine(data => {
    if (data.isHalfDay) {
        if (!data.startDate || !data.endDate) return false;
        return areDatesSameDay(data.startDate, data.endDate);
    }
    return true;
}, {
    message: "Pour une demi-journée, la date de début et de fin doivent être identiques.",
    path: ["isHalfDay"],
});

export interface LeaveFormProps {
    userId: number;
    onSuccess: (newLeave: any) => void;
}

// Composant Tooltip personnalisé qui n'utilise pas element.ref de manière dépréciée
const Tooltip = forwardRef<HTMLDivElement, {
    children: React.ReactNode,
    content: React.ReactNode,
    placement?: string
} & React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { children, content, placement = 'top', ...otherProps } = props;
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            ref={ref}
            {...otherProps}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 p-2 bg-white rounded shadow-lg border text-sm ${placement.includes('top') ? 'bottom-full mb-2' :
                    placement.includes('bottom') ? 'top-full mt-2' :
                        placement.includes('left') ? 'right-full mr-2' :
                            'left-full ml-2'
                    }`}>
                    {content}
                </div>
            )}
        </div>
    );
});

Tooltip.displayName = 'Tooltip';

export const LeaveForm: React.FC<LeaveFormProps> = ({ userId, onSuccess }) => {
    // State pour les types de congés chargés depuis l'API
    const [availableLeaveTypes, setAvailableLeaveTypes] = useState<SelectableLeaveType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(true);
    const [loadTypeError, setLoadTypeError] = useState<string | null>(null);

    // Utiliser des objets Date plutôt que des strings pour les dates
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [leaveType, setLeaveType] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Options de calcul pour demi-journées
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDayPeriod, setHalfDayPeriod] = useState<'AM' | 'PM'>('AM');

    // Hook de calcul des jours de congés
    const {
        details: calculationDetails,
        isLoading: isCalculatingDays,
        error: calculationError,
        status: calculationStatus,
        recalculate,
        publicHolidays,
        workingDays,
        countedDays,
        hasValidDates
    } = useLeaveCalculation({
        startDate,
        endDate,
        options: {
            isHalfDay: isHalfDay,
            halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
        }
    });

    // Gérer les dates à exclure et à mettre en évidence
    const [excludeDates, setExcludeDates] = useState<Date[]>([]);
    const [highlightDates, setHighlightDates] = useState<PublicHolidayDetail[]>([]);

    // Mettre à jour les dates exclues et mises en évidence lorsque les jours fériés changent
    useEffect(() => {
        if (publicHolidays && publicHolidays.length > 0) {
            setHighlightDates(publicHolidays);
        } else {
            setHighlightDates([]);
        }
    }, [publicHolidays]);

    // Charger les types de congés au montage
    useEffect(() => {
        const fetchTypes = async () => {
            setIsLoadingTypes(true);
            setLoadTypeError(null);
            try {
                // Utilisation de l'API des types de congés settings pour avoir plus d'infos
                const response = await fetch('/api/conges/types');
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status}`);
                }
                const data: SelectableLeaveType[] = await response.json();

                // Appliquer les traductions aux données reçues
                const translatedData = data.map(type => ({
                    ...type,
                    label: leaveTypeTranslations[type.code] || type.label
                }));

                setAvailableLeaveTypes(translatedData);
                // Pré-sélectionner le premier type de la liste s'il y en a
                if (translatedData.length > 0 && !leaveType) {
                    setLeaveType(translatedData[0].code);
                }
            } catch (err: any) {
                console.error("Erreur lors du chargement des types de congés:", err);
                setLoadTypeError("Impossible de charger les types de congés.");
            } finally {
                setIsLoadingTypes(false);
            }
        };
        fetchTypes();
    }, []); // Dépendance leaveType retirée pour éviter rechargement si on préselectionne

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const validationResult = leaveRequestSchema.safeParse({
            startDate,
            endDate,
            leaveType,
            reason,
            isHalfDay,
            halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
        });

        if (!validationResult.success) {
            const formattedErrors: Record<string, string | undefined> = {};
            validationResult.error.errors.forEach(err => {
                if (err.path.length > 0) {
                    formattedErrors[err.path[0].toString()] = err.message;
                }
            });
            setErrors(formattedErrors);
            setIsSubmitting(false);
            toast.error("Veuillez corriger les erreurs dans le formulaire.");
            return;
        }
        const validData = validationResult.data;

        // La vérification de calculationStatus reste pertinente pour l'UX avant soumission
        if (calculationStatus !== 'success' || countedDays === null || countedDays === undefined) {
            toast.error("Le calcul des jours décomptés n'a pas pu être finalisé. Veuillez vérifier les dates ou les options.");
            setErrors({ global: "Le calcul des jours décomptés est en erreur ou incomplet." });
            setIsSubmitting(false);
            return;
        }

        // Construction du payload pour l'API batch
        // Inclure les informations de demi-journée
        const batchPayload = [{
            userId,
            startDate: formatDate(validData.startDate, ISO_DATE_FORMAT),
            endDate: formatDate(validData.endDate, ISO_DATE_FORMAT),
            typeCode: validData.leaveType,
            reason: validData.reason,
            isHalfDay: validData.isHalfDay || false,
            halfDayPeriod: validData.isHalfDay ? validData.halfDayPeriod : undefined,
            // Transmettre également le nombre de jours calculés pour validation côté serveur
            countedDays
        }];

        try {
            const response = await axios.post('/api/conges/batch', batchPayload);

            // L'API batch retourne un objet { results: BatchResult[] }
            const batchResults = response.data.results;

            if (batchResults && batchResults.length > 0) {
                const firstResult = batchResults[0];
                if (firstResult.success) {
                    toast.success(firstResult.message || "Demande de congé soumise avec succès.");
                    onSuccess(firstResult.createdLeave || firstResult); // Retourner le congé créé ou le résultat entier
                    // Réinitialiser le formulaire
                    setStartDate(null);
                    setEndDate(null);
                    setReason('');
                    setIsHalfDay(false);
                    setHalfDayPeriod('AM');
                    // setLeaveType(''); // On pourrait ne pas réinitialiser le type
                    setErrors({});
                } else {
                    const errorMessage = firstResult.message || 'Une erreur est survenue lors de la soumission.';
                    setErrors({ global: errorMessage });
                    toast.error(errorMessage);
                }
            } else {
                // Cas où la réponse n'a pas le format attendu
                throw new Error("Réponse invalide de l'API batch.");
            }
        } catch (err: any) {
            console.error("Erreur lors de la soumission de la demande batch:", err);
            const apiError = err.response?.data?.error || err.message || 'Une erreur est survenue lors de la soumission.';
            setErrors({ global: apiError });
            toast.error(apiError);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour rendre le calendrier d'une date
    const renderDateInput = (
        selected: Date | null,
        onChange: (date: Date | null) => void,
        id: string,
        label: string,
        minDateProp?: Date | null,
        disabled?: boolean
    ) => {
        let resolvedMinDate: Date | undefined = undefined;

        if (id === 'startDate') {
            resolvedMinDate = safeGetStartOfDay(new Date());
        } else if (id === 'endDate') {
            // Si startDate est défini, minDate d'endDate est startDate.
            // Sinon, minDate d'endDate est aussi aujourd'hui (pour éviter sélection passée si startDate est vide)
            resolvedMinDate = startDate ? safeGetStartOfDay(startDate) : safeGetStartOfDay(new Date());
        }
        // Si minDateProp est fourni (pourrait être pour endDate, par exemple), et que c'est une Date valide,
        // il peut surcharger la logique ci-dessus. Mais la logique actuelle est plus spécifique.
        // On pourrait faire: if (minDateProp instanceof Date) resolvedMinDate = safeGetStartOfDay(minDateProp); 
        // Cependant, la prop minDate est déjà utilisée pour passer startDate au DatePicker de endDate.

        return (
            <div className="relative">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                    <DatePicker
                        id={id}
                        selected={selected}
                        onChange={(date) => {
                            // S'assurer que la date est bien définie avant de l'assigner
                            if (date instanceof Date && !isNaN(date.getTime())) {
                                onChange(date);
                            } else {
                                onChange(null);
                            }
                        }}
                        selectsStart={id === "startDate"}
                        selectsEnd={id === "endDate"}
                        startDate={startDate} // DatePicker s'attend à Date | null
                        endDate={endDate}     // DatePicker s'attend à Date | null
                        minDate={resolvedMinDate} // DatePicker s'attend à Date | undefined
                        dateFormat="dd/MM/yyyy"
                        locale="fr"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 pr-4 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholderText="Sélectionner une date"
                        autoComplete="off"
                        calendarClassName="shadow-lg rounded-md border border-gray-200"
                        popperClassName="z-50"
                        highlightDates={highlightDates.map(h => h.date)}
                        filterDate={(date) => {
                            return true;
                        }}
                        dayClassName={(date) => {
                            const dateStr = formatDate(date, ISO_DATE_FORMAT);
                            if (publicHolidays.some(h => formatDate(h.date, ISO_DATE_FORMAT) === dateStr)) {
                                return "holiday-date";
                            }
                            return "";
                        }}
                        disabled={disabled}
                        strictParsing={true}
                        showYearDropdown={true}
                        showMonthDropdown={true}
                        dropdownMode="select"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>

                    {selected && publicHolidays.some(h => h.date && formatDate(h.date, ISO_DATE_FORMAT) === formatDate(selected, ISO_DATE_FORMAT)) && (
                        <div className="absolute bottom-full left-0 mb-1 z-10">
                            <Tooltip
                                content={
                                    <div className="p-2 text-sm bg-white rounded shadow-lg border">
                                        <span className="font-bold">
                                            {publicHolidays.find(h => h.date && formatDate(h.date, ISO_DATE_FORMAT) === formatDate(selected, ISO_DATE_FORMAT))?.name}
                                        </span>
                                        <span className="ml-1">(Jour férié)</span>
                                    </div>
                                }
                                placement="top-start"
                            >
                                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    Férié
                                </span>
                            </Tooltip>
                        </div>
                    )}
                </div>
                {errors[id] && <p className="text-xs text-red-600 mt-1">{errors[id]}</p>}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Nouvelle demande de congé</h3>
                <p className="text-sm text-gray-600">Complétez le formulaire ci-dessous pour soumettre votre demande.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                {errors.global && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                        <p className="text-sm text-red-700">{errors.global}</p>
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Type de congé</label>
                        <Tooltip content={<span>Sélectionnez le type de congé approprié à votre situation</span>} placement="top">
                            <span className="text-gray-400 hover:text-gray-600 cursor-help"><HelpCircle className="h-4 w-4" /></span>
                        </Tooltip>
                    </div>
                    <div className="mt-1 relative">
                        <select
                            id="leaveType"
                            name="leaveType"
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            required
                            disabled={isLoadingTypes || availableLeaveTypes.length === 0}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                        >
                            {isLoadingTypes ? (
                                <option value="">Chargement...</option>
                            ) : loadTypeError ? (
                                <option value="">Erreur de chargement</option>
                            ) : availableLeaveTypes.length === 0 ? (
                                <option value="">Aucun type disponible</option>
                            ) : (
                                <>
                                    <option value="">-- Sélectionner un type --</option>
                                    {availableLeaveTypes.map((type) => (
                                        <option key={type.code} value={type.code} title={type.description}>
                                            {type.label}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {errors.leaveType && <p className="text-xs text-red-500 mt-1">{errors.leaveType}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                    {renderDateInput(startDate, setStartDate, "startDate", "Date de début", null, isSubmitting)}
                    {renderDateInput(endDate, setEndDate, "endDate", "Date de fin", startDate, isSubmitting)}
                </div>

                {/* Section demi-journée améliorée */}
                <div className="mb-6">
                    <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isHalfDay"
                                name="isHalfDay"
                                checked={isHalfDay}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    setIsHalfDay(newValue);

                                    // Si on active demi-journée et que startDate != endDate, on force endDate = startDate
                                    if (newValue && startDate && endDate && !areDatesSameDay(startDate, endDate)) {
                                        setEndDate(startDate);
                                    }

                                    // Recalculer avec les nouvelles options
                                    if (hasValidDates) {
                                        recalculate({
                                            isHalfDay: newValue,
                                            halfDayPeriod: halfDayPeriod
                                        });
                                    }
                                }}
                                disabled={!startDate || isSubmitting}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isHalfDay" className="ml-2 block text-sm font-medium text-gray-700">
                                Demi-journée
                            </label>
                            <Tooltip content={<span>Activez cette option pour demander une demi-journée de congé (matin ou après-midi). Pour les demi-journées, la date de début et de fin doivent être identiques.</span>} placement="top">
                                <span className="text-gray-400 hover:text-gray-600 cursor-help ml-1"><HelpCircle className="h-4 w-4" /></span>
                            </Tooltip>
                        </div>

                        {isHalfDay && (
                            <div className="flex flex-col space-y-2 pl-6">
                                <p className="text-xs text-gray-500">Choisissez la période :</p>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="halfDayAM"
                                            name="halfDayPeriod"
                                            value="AM"
                                            checked={halfDayPeriod === 'AM'}
                                            onChange={() => {
                                                setHalfDayPeriod('AM');
                                                if (hasValidDates) {
                                                    recalculate({
                                                        isHalfDay: true,
                                                        halfDayPeriod: 'AM'
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <label htmlFor="halfDayAM" className="ml-2 block text-sm text-gray-700">
                                            Matin
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="halfDayPM"
                                            name="halfDayPeriod"
                                            value="PM"
                                            checked={halfDayPeriod === 'PM'}
                                            onChange={() => {
                                                setHalfDayPeriod('PM');
                                                if (hasValidDates) {
                                                    recalculate({
                                                        isHalfDay: true,
                                                        halfDayPeriod: 'PM'
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <label htmlFor="halfDayPM" className="ml-2 block text-sm text-gray-700">
                                            Après-midi
                                        </label>
                                    </div>
                                </div>

                                {startDate && endDate && !areDatesSameDay(startDate, endDate) && (
                                    <p className="text-xs text-amber-600">
                                        ⚠️ Pour une demi-journée, les dates de début et de fin doivent être identiques.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {errors.isHalfDay && <p className="text-xs text-red-500 mt-1">{errors.isHalfDay}</p>}
                </div>

                {/* Affichage des jours calculés et jours fériés */}
                <div className="space-y-3 mb-6">
                    {isCalculatingDays && (
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm text-gray-600 flex items-center">
                            <span className="animate-spin h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full mr-2"></span>
                            Calcul des jours en cours...
                        </div>
                    )}
                    {calculationStatus === 'error' && calculationError && (
                        <div className="bg-red-50 p-3 rounded-md border border-red-300 text-sm text-red-700">
                            Erreur calcul: {calculationError.message}
                        </div>
                    )}
                    {hasValidDates && calculationStatus === 'success' && countedDays !== null && countedDays !== undefined && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <div className="flex items-start">
                                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-blue-700">
                                        <span className="font-semibold">Jours décomptés : {countedDays}</span>
                                        {(workingDays !== null && workingDays !== undefined && workingDays !== countedDays) &&
                                            <span className="text-xs"> (sur {workingDays} jours ouvrables dans la période)</span>
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {publicHolidays.length > 0 && startDate && endDate && (
                        <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                            <p className="text-xs text-purple-700 font-medium mb-1">Jours fériés dans la période sélectionnée :</p>
                            <ul className="list-disc list-inside text-xs text-purple-600 space-y-0.5">
                                {publicHolidays
                                    .filter(h => {
                                        const holidayDate = h.date;
                                        if (!startDate || !endDate || !holidayDate) return false;
                                        return safeGetStartOfDay(holidayDate) >= safeGetStartOfDay(startDate) &&
                                            safeGetStartOfDay(holidayDate) <= safeGetStartOfDay(endDate);
                                    })
                                    .map(h => (
                                        <li key={h.name + h.date.toISOString()}>
                                            {formatDate(h.date, 'dd/MM/yyyy')} - {h.name}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motif (optionnel)</label>
                        <span className="text-xs text-gray-500">Max. 200 caractères</span>
                    </div>
                    <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        maxLength={200}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Précisez le motif de votre demande si nécessaire..."
                    />
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    type="submit"
                    disabled={isSubmitting || isLoadingTypes || isCalculatingDays || !hasValidDates || calculationStatus === 'error'}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                >
                    {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
                    {isSubmitting && <span className="ml-2 h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></span>}
                </button>
            </div>

            <style jsx global>{`
                .holiday-date {
                    background-color: #ede9fe !important;
                    border-radius: 0.375rem;
                }
                .react-datepicker__day--highlighted-custom {
                    background-color: #ede9fe;
                    border-radius: 50%;
                }
                 .tippy-box[data-theme~='light'] {
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    border: 1px solid #e5e7eb;
                }
            `}</style>
        </form>
    );
}; 