import React from 'react';
import {
    WorkSchedule,
    WorkFrequency,
    Weekday,
    WeekType,
    MonthType
} from '../types/workSchedule';
import { calculateWeeklyWorkingDays } from '../services/workScheduleService';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import workScheduleService functions here for CalendarMonth
import { isEvenWeek, isEvenMonth, isWorkingDay } from '../services/workScheduleService';

interface WorkScheduleDisplayProps {
    planningMedical: WorkSchedule;
    onEdit?: () => void;
}

export const WorkScheduleDisplay: React.FC<WorkScheduleDisplayProps> = ({
    planningMedical,
    onEdit
}) => {
    // Calculer les jours travaillés par semaine
    const weeklyWorkingDays = calculateWeeklyWorkingDays(planningMedical);

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

    // Obtenir l'étiquette pour le type de fréquence
    const getFrequencyLabel = (frequency: WorkFrequency): string => {
        switch (frequency) {
            case WorkFrequency.FULL_TIME:
                return 'Temps plein';
            case WorkFrequency.PART_TIME:
                return 'Temps partiel';
            case WorkFrequency.ALTERNATE_WEEKS:
                return 'Alternance semaines paires/impaires';
            case WorkFrequency.ALTERNATE_MONTHS:
                return 'Alternance mois pairs/impairs';
            case WorkFrequency.CUSTOM:
                return 'Configuration personnalisée';
            default:
                return '';
        }
    };

    // Obtenir l'étiquette pour le type de semaine (pour alternance)
    const getWeekTypeLabel = (weekType?: WeekType): string => {
        if (!weekType) return '';
        switch (weekType) {
            case WeekType.BOTH:
                return 'Toutes les semaines';
            case WeekType.EVEN:
                return 'Semaines paires uniquement';
            case WeekType.ODD:
                return 'Semaines impaires uniquement';
            default:
                return '';
        }
    };

    // Obtenir l'étiquette pour le type de mois (pour alternance)
    const getMonthTypeLabel = (monthType?: MonthType): string => {
        if (!monthType) return '';
        switch (monthType) {
            case MonthType.BOTH:
                return 'Tous les mois';
            case MonthType.EVEN:
                return 'Mois pairs uniquement';
            case MonthType.ODD:
                return 'Mois impairs uniquement';
            default:
                return '';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium text-gray-900">Planning de travail actuel</h2>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Modifier
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Type de planning */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Type de planning</h3>
                    <p className="mt-1 text-sm text-gray-900">{getFrequencyLabel(planningMedical.frequency)}</p>
                </div>

                {/* Informations spécifiques au type de planning */}
                {planningMedical.frequency === WorkFrequency.PART_TIME && planningMedical.workingTimePercentage && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Temps de travail</h3>
                        <p className="mt-1 text-sm text-gray-900">{planningMedical.workingTimePercentage}%</p>
                    </div>
                )}

                {planningMedical.frequency === WorkFrequency.ALTERNATE_WEEKS && planningMedical.weekType && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Semaines travaillées</h3>
                        <p className="mt-1 text-sm text-gray-900">{getWeekTypeLabel(planningMedical.weekType)}</p>
                    </div>
                )}

                {planningMedical.frequency === WorkFrequency.ALTERNATE_MONTHS && planningMedical.monthType && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Mois travaillés</h3>
                        <p className="mt-1 text-sm text-gray-900">{getMonthTypeLabel(planningMedical.monthType)}</p>
                    </div>
                )}

                {/* Jours travaillés */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Jours travaillés</h3>

                    {planningMedical.frequency !== WorkFrequency.CUSTOM && planningMedical.workingDays && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                <div
                                    key={day}
                                    className={`px-3 py-1 rounded-md text-sm ${planningMedical.workingDays?.includes(day)
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {getWeekdayLabel(day)}
                                </div>
                            ))}
                        </div>
                    )}

                    {planningMedical.frequency === WorkFrequency.CUSTOM && planningMedical.customSchedule && (
                        <div className="mt-2">
                            <div className="mb-2">
                                <span className="text-sm font-medium text-gray-500">Semaines paires:</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                        <div
                                            key={day}
                                            className={`px-3 py-1 rounded-md text-sm ${planningMedical.customSchedule?.evenWeeks?.includes(day)
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {getWeekdayLabel(day)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-sm font-medium text-gray-500">Semaines impaires:</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {([1, 2, 3, 4, 5] as Weekday[]).map(day => (
                                        <div
                                            key={day}
                                            className={`px-3 py-1 rounded-md text-sm ${planningMedical.customSchedule?.oddWeeks?.includes(day)
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {getWeekdayLabel(day)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Récapitulatif jours travaillés */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Récapitulatif</h3>
                    <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">Jours travaillés par semaine:</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {weeklyWorkingDays.totalDays.toFixed(1)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">Jours de congés annuels:</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {planningMedical.annualLeaveAllowance}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Période de validité */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Période de validité</h3>
                    <p className="mt-1 text-sm text-gray-900">
                        Du {format(new Date(planningMedical.validFrom), 'dd MMMM yyyy', { locale: fr })}
                        {planningMedical.validTo && ` au ${format(new Date(planningMedical.validTo), 'dd MMMM yyyy', { locale: fr })}`}
                    </p>
                </div>

                {/* Visualisation du planning sur un calendrier simplifié */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Calendrier sur 2 mois</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Mois actuel */}
                        <CalendarMonth
                            planningMedical={planningMedical}
                            monthOffset={0}
                        />

                        {/* Mois suivant */}
                        <CalendarMonth
                            planningMedical={planningMedical}
                            monthOffset={1}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CalendarMonthProps {
    planningMedical: WorkSchedule;
    monthOffset: number;
}

const CalendarMonth: React.FC<CalendarMonthProps> = ({ planningMedical, monthOffset }) => {
    // Calculer le premier jour du mois
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

    // Nombre de jours dans le mois
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0).getDate();

    // Calculer le jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Ajuster pour commencer la semaine le lundi (lundi = 0, dimanche = 6)
    const adjustedFirstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Créer tableau pour les semaines du mois
    const weeks = [];
    let days = [];

    // Ajouter des cases vides pour les jours avant le début du mois
    for (let i = 0; i < adjustedFirstDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), day);
        const isCurrentDay = (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );

        // Vérifier si c'est un jour travaillé
        const isWorking = isWorkingDay(planningMedical, date);

        days.push(
            <div
                key={day}
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm ${isCurrentDay
                    ? 'bg-blue-600 text-white'
                    : isWorking
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-500'
                    }`}
            >
                {day}
            </div>
        );

        // Si c'est la fin de la semaine (samedi) ou le dernier jour du mois, ajouter la semaine
        if ((days.length) % 7 === 0 || day === daysInMonth) {
            // Si la dernière semaine n'est pas complète, ajouter des cases vides
            while ((days.length) % 7 !== 0) {
                days.push(<div key={`empty-end-${days.length}`} className="h-8 w-8"></div>);
            }

            weeks.push(
                <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            );
            days = [];
        }
    }

    return (
        <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
                {format(firstDayOfMonth, 'MMMM yyyy', { locale: fr })}
            </h4>

            {/* En-têtes des jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                    <div key={index} className="flex items-center justify-center h-6 w-8 text-xs font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Semaines */}
            <div className="space-y-1">
                {weeks}
            </div>
        </div>
    );
}; 