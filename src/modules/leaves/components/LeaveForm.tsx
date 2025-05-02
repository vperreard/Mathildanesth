'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { publicHolidayService } from '../services/publicHolidayService';
import { useLeaveCalculation } from '../hooks/useLeaveCalculation';

// Enregistrer la locale française pour le DatePicker
registerLocale('fr', fr);

// Interface pour les données des types de congés venant de l'API
interface SelectableLeaveType {
    id: string;
    code: string;
    label: string;
    description?: string;
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

// Définir le schéma Zod pour la validation
const leaveRequestSchema = z.object({
    startDate: z.date({ required_error: "La date de début est requise.", invalid_type_error: "La date de début est invalide." })
        .min(getStartOfDay(new Date()) || new Date(), { message: "La date de début ne peut pas être dans le passé." }),
    endDate: z.date({ required_error: "La date de fin est requise.", invalid_type_error: "La date de fin est invalide." }),
    leaveType: z.string().min(1, "Le type de congé est requis."),
    reason: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["endDate"],
});

interface LeaveFormProps {
    userId: number;
    onSuccess: (newLeave: any) => void;
}

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

    // Nouveaux états pour les jours fériés
    const [publicHolidays, setPublicHolidays] = useState<Array<{ date: string, name: string }>>([]);
    const [excludeDates, setExcludeDates] = useState<Date[]>([]);
    const [highlightDates, setHighlightDates] = useState<Date[]>([]);

    // Utiliser le hook de calcul des jours de congés
    const { calculateLeaveDays, isCalculating } = useLeaveCalculation();
    const [estimatedDays, setEstimatedDays] = useState<number | null>(null);

    // Charger les types de congés au montage
    useEffect(() => {
        const fetchTypes = async () => {
            setIsLoadingTypes(true);
            setLoadTypeError(null);
            try {
                const response = await fetch('/api/leaves/types');
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
                if (translatedData.length > 0) {
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
    }, []);

    // Fonction pour charger les jours fériés dans une plage de dates
    const loadHolidays = useCallback(async (start: Date | null, end: Date | null) => {
        if (!start) return;

        // Par défaut, si pas de date de fin, regarder sur les 3 prochains mois
        const endDate = end || addDaysToDate(start, 90);
        if (!endDate) return;

        try {
            const startStr = formatDate(start, ISO_DATE_FORMAT);
            const endStr = formatDate(endDate, ISO_DATE_FORMAT);

            const holidays = await publicHolidayService.getPublicHolidaysInRange(startStr, endStr);
            setPublicHolidays(holidays);

            // Créer un tableau de dates pour le DatePicker
            const holidayDates = holidays.map(h => parseDate(h.date));
            setHighlightDates(holidayDates.filter(Boolean) as Date[]);
        } catch (error) {
            console.error("Erreur lors du chargement des jours fériés:", error);
        }
    }, []);

    // Charger les jours fériés quand la date de début change
    useEffect(() => {
        loadHolidays(startDate, endDate);
    }, [startDate, endDate, loadHolidays]);

    // Calculer une estimation du nombre de jours ouvrés entre les dates
    useEffect(() => {
        const calculateDays = async () => {
            if (startDate && endDate && endDate >= startDate) {
                try {
                    const result = await calculateLeaveDays(startDate, endDate);
                    setEstimatedDays(result.businessDays);
                } catch (error) {
                    console.error("Erreur lors du calcul des jours de congés:", error);
                    setEstimatedDays(null);
                }
            } else {
                setEstimatedDays(null);
            }
        };

        calculateDays();
    }, [startDate, endDate, calculateLeaveDays]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const validationResult = leaveRequestSchema.safeParse({
            startDate,
            endDate,
            leaveType,
            reason,
        });

        if (!validationResult.success) {
            const formattedErrors: Record<string, string | undefined> = {};
            validationResult.error.errors.forEach(err => {
                if (err.path.length > 0) {
                    formattedErrors[err.path[0]] = err.message;
                }
            });
            setErrors(formattedErrors);
            setIsSubmitting(false);
            return;
        }
        const validData = validationResult.data;

        try {
            const response = await axios.post('/api/leaves', {
                userId,
                startDate: formatDate(validData.startDate, ISO_DATE_FORMAT),
                endDate: formatDate(validData.endDate, ISO_DATE_FORMAT),
                typeCode: validData.leaveType,
                reason: validData.reason,
            });
            toast.success("Demande de congé soumise avec succès.");
            onSuccess(response.data);
            setStartDate(null);
            setEndDate(null);
            setReason('');
            setEstimatedDays(null);
        } catch (err: any) {
            console.error("Erreur lors de la soumission de la demande:", err);
            const apiError = err.response?.data?.error || 'Une erreur est survenue lors de la soumission.';
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
        minDate?: Date
    ) => (
        <div className="relative">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <DatePicker
                    id={id}
                    selected={selected}
                    onChange={onChange}
                    selectsStart={id === "startDate"}
                    selectsEnd={id === "endDate"}
                    startDate={startDate}
                    endDate={endDate}
                    minDate={minDate || new Date()}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 pr-4 py-2"
                    placeholderText="Sélectionner une date"
                    autoComplete="off"
                    calendarClassName="shadow-lg rounded-md border border-gray-200"
                    popperClassName="z-50"
                    excludeDates={excludeDates}
                    highlightDates={highlightDates}
                    filterDate={(date) => {
                        // Exclure les weekends par défaut
                        if (isDateWeekend(date)) return false;
                        return true;
                    }}
                    dayClassName={(date) => {
                        // Ajouter une classe spéciale pour les jours fériés
                        const dateStr = formatDate(date, ISO_DATE_FORMAT);
                        if (publicHolidays.some(h => h.date === dateStr)) {
                            return "holiday-date";
                        }
                        return "";
                    }}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>

                {/* Tooltip pour afficher le nom du jour férié */}
                {selected && publicHolidays.some(h => h.date === formatDate(selected, ISO_DATE_FORMAT)) && (
                    <div className="absolute bottom-full left-0 mb-1">
                        <Tippy
                            content={
                                <div className="p-2 text-sm">
                                    <span className="font-bold">
                                        {publicHolidays.find(h => h.date === formatDate(selected, ISO_DATE_FORMAT))?.name}
                                    </span>
                                    <span className="ml-1">(Jour férié)</span>
                                </div>
                            }
                            theme="light"
                            placement="top"
                            visible={true}
                        >
                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                                Jour férié
                            </span>
                        </Tippy>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Nouvelle demande de congé</h3>
                <p className="text-sm text-gray-600">Complétez le formulaire ci-dessous pour soumettre votre demande.</p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                {errors.global && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                        <p className="text-sm text-red-700">{errors.global}</p>
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Type de congé</label>
                        <Tippy
                            content={<span>Sélectionnez le type de congé approprié à votre situation</span>}
                            theme="light"
                            placement="top"
                        >
                            <span className="text-gray-400 hover:text-gray-600 cursor-help">
                                <HelpCircle className="h-4 w-4" />
                            </span>
                        </Tippy>
                    </div>
                    <div className="mt-1 relative">
                        <select
                            id="leaveType"
                            name="leaveType"
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            required
                            disabled={isLoadingTypes || availableLeaveTypes.length === 0}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            {isLoadingTypes ? (
                                <option value="">Chargement...</option>
                            ) : loadTypeError ? (
                                <option value="">Erreur</option>
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderDateInput(startDate, setStartDate, "startDate", "Date de début")}
                    {renderDateInput(endDate, setEndDate, "endDate", "Date de fin", startDate || undefined)}
                </div>

                {/* Affigage des jours ouvrables estimés avec prise en compte des jours fériés */}
                {estimatedDays !== null && (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-700">
                                    <span className="font-medium">Jours ouvrables estimés : {estimatedDays}</span>
                                </p>
                                {publicHolidays.length > 0 && startDate && endDate && (
                                    <div className="mt-2">
                                        <p className="text-xs text-blue-600 font-medium">Jours fériés dans cette période :</p>
                                        <ul className="list-disc list-inside text-xs text-blue-600 mt-1">
                                            {publicHolidays
                                                .filter(h => {
                                                    const holidayDate = parseDate(h.date);
                                                    return holidayDate &&
                                                        holidayDate >= startDate &&
                                                        holidayDate <= endDate;
                                                })
                                                .map(h => (
                                                    <li key={h.date}>
                                                        {formatDate(parseDate(h.date), 'dd/MM/yyyy')} - {h.name}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting || isLoadingTypes}
                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
                    {isSubmitting && <span className="ml-2 h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></span>}
                </button>
            </div>

            <style jsx>{`
                :global(.holiday-date) {
                    background-color: #e9d5ff !important;
                    border-radius: 50%;
                    color: #6b21a8 !important;
                    font-weight: bold;
                }
            `}</style>
        </form>
    );
}; 