import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import {
    Calendar,
    Users,
    AlertTriangle,
    AlertCircle,
    Info,
    Filter,
    ChevronLeft,
    ChevronRight,
    Filter as FilterIcon,
    MoreHorizontal
} from 'lucide-react';
import { ConflictType, ConflictSeverity, LeaveConflict } from '../../types/conflict';
import { LeaveRequest } from '../../types/leave';
import { User } from '../../../types/user';
import { formatDate } from '@/utils/dateUtils';
import { RiskPeriod, RiskLevel } from '../../services/riskPeriodDetectionService';

// Types pour les props du composant
interface TeamCalendarConflictViewProps {
    month?: Date;
    team?: string;
    department?: string;
    onDateClick?: (date: Date) => void;
    onUserClick?: (userId: string) => void;
    onConflictClick?: (conflict: LeaveConflict) => void;
    leaves?: LeaveRequest[];
    conflicts?: LeaveConflict[];
    users?: User[];
    riskPeriods?: RiskPeriod[];
    loading?: boolean;
}

/**
 * Composant de calendrier d'équipe avec visualisation améliorée des conflits
 */
export const TeamCalendarConflictView: React.FC<TeamCalendarConflictViewProps> = ({
    month = new Date(),
    team,
    department,
    onDateClick,
    onUserClick,
    onConflictClick,
    leaves = [],
    conflicts = [],
    users = [],
    riskPeriods = [],
    loading = false
}) => {
    const { t } = useTranslation('leaves');
    const [currentMonth, setCurrentMonth] = useState<Date>(month);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
    const [filterSeverity, setFilterSeverity] = useState<ConflictSeverity | 'ALL'>('ALL');
    const [filterConflictType, setFilterConflictType] = useState<ConflictType | 'ALL'>('ALL');

    // Initialiser les utilisateurs visibles
    useEffect(() => {
        if (users.length > 0 && visibleUsers.length === 0) {
            setVisibleUsers(users.map(user => user.id));
        }
    }, [users, visibleUsers]);

    // Générer les jours du mois
    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Filtrer les congés pour le mois en cours
    const filteredLeaves = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        return leaves.filter(leave => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            return (leaveStart <= monthEnd && leaveEnd >= monthStart);
        });
    }, [leaves, currentMonth]);

    // Filtrer les conflits selon les critères
    const filteredConflicts = useMemo(() => {
        return conflicts.filter(conflict => {
            // Filtrer par sévérité
            if (filterSeverity !== 'ALL' && conflict.severity !== filterSeverity) {
                return false;
            }

            // Filtrer par type de conflit
            if (filterConflictType !== 'ALL' && conflict.type !== filterConflictType) {
                return false;
            }

            // Filtrer par utilisateurs visibles
            if (conflict.affectedUsers && conflict.affectedUsers.length > 0) {
                const hasVisibleUser = conflict.affectedUsers.some(user =>
                    visibleUsers.includes(user.id)
                );
                if (!hasVisibleUser) return false;
            }

            return true;
        });
    }, [conflicts, filterSeverity, filterConflictType, visibleUsers]);

    // Récupérer les congés pour une date spécifique
    const getLeavesForDate = (date: Date) => {
        return filteredLeaves.filter(leave => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            return date >= leaveStart && date <= leaveEnd;
        });
    };

    // Récupérer les conflits pour une date spécifique
    const getConflictsForDate = (date: Date) => {
        return filteredConflicts.filter(conflict => {
            const conflictStart = new Date(conflict.startDate);
            const conflictEnd = new Date(conflict.endDate);
            return date >= conflictStart && date <= conflictEnd;
        });
    };

    // Récupérer les périodes à risque pour une date spécifique
    const getRiskPeriodForDate = (date: Date) => {
        return riskPeriods.find(period => {
            const periodStart = new Date(period.startDate);
            const periodEnd = new Date(period.endDate);
            return date >= periodStart && date <= periodEnd;
        });
    };

    // Calculer la couleur de fond pour une cellule de date
    const getDateCellBackground = (date: Date) => {
        // Vérifier les périodes à risque
        const riskPeriod = getRiskPeriodForDate(date);

        if (riskPeriod) {
            switch (riskPeriod.riskLevel) {
                case RiskLevel.CRITICAL:
                    return 'bg-destructive/10';
                case RiskLevel.HIGH:
                    return 'bg-warning/10';
                case RiskLevel.MEDIUM:
                    return 'bg-amber-500/10';
                case RiskLevel.LOW:
                    return 'bg-secondary/5';
            }
        }

        // Vérifier si le jour est un weekend
        if (isWeekend(date)) {
            return 'bg-muted/50';
        }

        // Si c'est le jour sélectionné
        if (selectedDate && isSameDay(date, selectedDate)) {
            return 'bg-primary/5';
        }

        return '';
    };

    // Calculer le nombre de conflits par sévérité pour une date
    const getConflictCountsBySeverity = (date: Date) => {
        const conflictsForDate = getConflictsForDate(date);
        return {
            total: conflictsForDate.length,
            bloquant: conflictsForDate.filter(c => c.severity === ConflictSeverity.BLOQUANT).length,
            avertissement: conflictsForDate.filter(c => c.severity === ConflictSeverity.AVERTISSEMENT).length,
            information: conflictsForDate.filter(c => c.severity === ConflictSeverity.INFORMATION).length
        };
    };

    // Obtenir l'icône selon la sévérité du conflit
    const getConflictSeverityIcon = (severity: ConflictSeverity) => {
        switch (severity) {
            case ConflictSeverity.BLOQUANT:
                return <AlertCircle className="h-4 w-4 text-destructive" />;
            case ConflictSeverity.AVERTISSEMENT:
                return <AlertTriangle className="h-4 w-4 text-warning" />;
            case ConflictSeverity.INFORMATION:
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return null;
        }
    };

    // Obtenir la couleur d'un badge selon la sévérité du conflit
    const getConflictSeverityColor = (severity: ConflictSeverity) => {
        switch (severity) {
            case ConflictSeverity.BLOQUANT:
                return 'bg-destructive text-destructive-foreground';
            case ConflictSeverity.AVERTISSEMENT:
                return 'bg-warning text-warning-foreground';
            case ConflictSeverity.INFORMATION:
                return 'bg-blue-500 text-white';
            default:
                return 'bg-secondary text-secondary-foreground';
        }
    };

    // Changer le mois affiché
    const changeMonth = (increment: number) => {
        setCurrentMonth(prevMonth => {
            const newMonth = new Date(prevMonth);
            newMonth.setMonth(newMonth.getMonth() + increment);
            return newMonth;
        });
    };

    // Gérer le clic sur une date
    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        if (onDateClick) onDateClick(date);
    };

    // Rendre l'en-tête du calendrier
    const renderCalendarHeader = () => (
        <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
                <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-medium">
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </h3>
                <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FilterIcon className="h-4 w-4" />
                            {t('calendrier.conflits.filtres')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-4">
                            <h4 className="font-medium">{t('calendrier.conflits.filtrer_par')}</h4>

                            <div className="space-y-2">
                                <label className="text-sm">{t('conflit.severite.label')}</label>
                                <Select
                                    value={filterSeverity}
                                    onValueChange={(value) => setFilterSeverity(value as ConflictSeverity | 'ALL')}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('calendrier.conflits.toutes_severites')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">{t('calendrier.conflits.toutes_severites')}</SelectItem>
                                        <SelectItem value={ConflictSeverity.BLOQUANT}>{t('conflit.severite.bloquant')}</SelectItem>
                                        <SelectItem value={ConflictSeverity.AVERTISSEMENT}>{t('conflit.severite.avertissement')}</SelectItem>
                                        <SelectItem value={ConflictSeverity.INFORMATION}>{t('conflit.severite.information')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm">{t('conflit.type.label')}</label>
                                <Select
                                    value={filterConflictType}
                                    onValueChange={(value) => setFilterConflictType(value as ConflictType | 'ALL')}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('calendrier.conflits.tous_types')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">{t('calendrier.conflits.tous_types')}</SelectItem>
                                        <SelectItem value={ConflictType.USER_LEAVE_OVERLAP}>{t('conflit.type.user_leave_overlap')}</SelectItem>
                                        <SelectItem value={ConflictType.TEAM_ABSENCE}>{t('conflit.type.team_absence')}</SelectItem>
                                        <SelectItem value={ConflictType.TEAM_CAPACITY}>{t('conflit.type.team_capacity')}</SelectItem>
                                        <SelectItem value={ConflictType.CRITICAL_ROLE}>{t('conflit.type.critical_role')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm">{t('calendrier.conflits.utilisateurs')}</label>
                                <div className="flex flex-wrap gap-1 border rounded-md p-2 max-h-32 overflow-y-auto">
                                    {users.map(user => (
                                        <label key={user.id} className="flex items-center gap-1 text-xs p-1 hover:bg-muted rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={visibleUsers.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setVisibleUsers(prev => [...prev, user.id]);
                                                    } else {
                                                        setVisibleUsers(prev => prev.filter(id => id !== user.id));
                                                    }
                                                }}
                                            />
                                            {user.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFilterSeverity('ALL');
                                        setFilterConflictType('ALL');
                                        setVisibleUsers(users.map(user => user.id));
                                    }}
                                >
                                    {t('calendrier.conflits.reinitialiser')}
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                >
                                    {t('calendrier.conflits.appliquer')}
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );

    // Rendre l'en-tête des jours de la semaine
    const renderWeekdayHeader = () => (
        <div className="grid grid-cols-7 gap-1 mb-1">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                <div key={`weekday-${index}`} className="text-center text-xs font-medium py-1">
                    {day}
                </div>
            ))}
        </div>
    );

    // Rendre le corps du calendrier
    const renderCalendarBody = () => {
        // Déterminer le jour de la semaine du premier jour (0 = dimanche, 1 = lundi, ...)
        const firstDayOfMonth = startOfMonth(currentMonth);
        const dayOfWeek = firstDayOfMonth.getDay();

        // Ajuster pour que la semaine commence le lundi (1) au lieu du dimanche (0)
        const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Calculer les jours du mois précédent à afficher
        const prevMonthDays = Array.from({ length: startOffset }).map((_, i) => {
            return addDays(firstDayOfMonth, -(startOffset - i));
        });

        // Combiner les jours du mois précédent, actuel et suivant
        const daysToDisplay = [
            ...prevMonthDays,
            ...daysInMonth,
        ];

        // Compléter avec les jours du mois suivant pour avoir un nombre de jours multiple de 7
        const remainingDays = 7 - (daysToDisplay.length % 7);
        if (remainingDays < 7) {
            const nextMonthDays = Array.from({ length: remainingDays }).map((_, i) => {
                return addDays(endOfMonth(currentMonth), i + 1);
            });
            daysToDisplay.push(...nextMonthDays);
        }

        // Grouper les jours par semaines
        const weeks: Date[][] = [];
        for (let i = 0; i < daysToDisplay.length; i += 7) {
            weeks.push(daysToDisplay.slice(i, i + 7));
        }

        return (
            <div className="border rounded-md overflow-hidden">
                {weeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="grid grid-cols-7 divide-x divide-y">
                        {week.map((day, dayIndex) => {
                            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                            const conflictCounts = getConflictCountsBySeverity(day);
                            const leaves = getLeavesForDate(day);
                            const riskPeriod = getRiskPeriodForDate(day);

                            return (
                                <div
                                    key={`day-${day.getTime()}`}
                                    className={`
                    min-h-24 p-1 
                    ${getDateCellBackground(day)} 
                    ${!isCurrentMonth ? 'opacity-40' : ''} 
                    hover:bg-primary/5 cursor-pointer
                  `}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`
                      text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center
                      ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}
                    `}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Indicateurs de conflits */}
                                        {conflictCounts.total > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex flex-col gap-0.5">
                                                            {conflictCounts.bloquant > 0 && (
                                                                <Badge className="h-1.5 w-3 bg-destructive" />
                                                            )}
                                                            {conflictCounts.avertissement > 0 && (
                                                                <Badge className="h-1.5 w-3 bg-warning" />
                                                            )}
                                                            {conflictCounts.information > 0 && (
                                                                <Badge className="h-1.5 w-3 bg-blue-500" />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs space-y-1">
                                                            {conflictCounts.bloquant > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                                                    {conflictCounts.bloquant} {t('conflit.severite.bloquant')}
                                                                </div>
                                                            )}
                                                            {conflictCounts.avertissement > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <AlertTriangle className="h-3 w-3 text-warning" />
                                                                    {conflictCounts.avertissement} {t('conflit.severite.avertissement')}
                                                                </div>
                                                            )}
                                                            {conflictCounts.information > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <Info className="h-3 w-3 text-blue-500" />
                                                                    {conflictCounts.information} {t('conflit.severite.information')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>

                                    {/* Liste des congés pour cette date */}
                                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                                        {leaves.slice(0, 3).map(leave => {
                                            const user = users.find(u => u.id === leave.userId);
                                            if (!user) return null;

                                            // Récupérer les conflits associés à ce congé
                                            const leaveConflicts = filteredConflicts.filter(c =>
                                                c.leaveId === leave.id &&
                                                new Date(c.startDate) <= day &&
                                                new Date(c.endDate) >= day
                                            );

                                            // Déterminer la couleur de fond selon les conflits
                                            let bgColor = 'bg-green-100';
                                            if (leaveConflicts.some(c => c.severity === ConflictSeverity.BLOQUANT)) {
                                                bgColor = 'bg-red-100';
                                            } else if (leaveConflicts.some(c => c.severity === ConflictSeverity.AVERTISSEMENT)) {
                                                bgColor = 'bg-amber-100';
                                            }

                                            return (
                                                <div
                                                    key={`leave-${leave.id}`}
                                                    className={`px-1 py-0.5 rounded-sm text-xs flex items-center gap-1 ${bgColor}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUserClick && onUserClick(user.id);
                                                    }}
                                                >
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={user.avatar} alt={user.name} />
                                                        <AvatarFallback className="text-[8px]">
                                                            {user.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate">{user.name}</span>

                                                    {leaveConflicts.length > 0 && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="ml-auto">
                                                                        {leaveConflicts.some(c => c.severity === ConflictSeverity.BLOQUANT) && (
                                                                            <AlertCircle className="h-3 w-3 text-destructive" />
                                                                        )}
                                                                        {!leaveConflicts.some(c => c.severity === ConflictSeverity.BLOQUANT) &&
                                                                            leaveConflicts.some(c => c.severity === ConflictSeverity.AVERTISSEMENT) && (
                                                                                <AlertTriangle className="h-3 w-3 text-warning" />
                                                                            )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="text-xs space-y-1">
                                                                        {leaveConflicts.map(conflict => (
                                                                            <div
                                                                                key={conflict.id}
                                                                                className="flex items-center gap-1"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onConflictClick && onConflictClick(conflict);
                                                                                }}
                                                                            >
                                                                                {getConflictSeverityIcon(conflict.severity)}
                                                                                <span>{conflict.description}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {leaves.length > 3 && (
                                            <div className="text-xs text-muted-foreground">
                                                +{leaves.length - 3} {t('calendrier.conflits.autres')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Indicateur de période à risque */}
                                    {riskPeriod && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={`
                            mt-auto text-[10px] px-1 rounded-sm 
                            ${riskPeriod.riskLevel === RiskLevel.CRITICAL ? 'bg-destructive/20 text-destructive' : ''}
                            ${riskPeriod.riskLevel === RiskLevel.HIGH ? 'bg-warning/20 text-warning' : ''}
                            ${riskPeriod.riskLevel === RiskLevel.MEDIUM ? 'bg-amber-500/20 text-amber-700' : ''}
                            ${riskPeriod.riskLevel === RiskLevel.LOW ? 'bg-secondary/20 text-muted-foreground' : ''}
                          `}>
                                                        {t('calendrier.periode_risque')}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-xs space-y-1">
                                                        <div className="font-medium">
                                                            {t(`alerte.risque.niveau.${riskPeriod.riskLevel.toLowerCase()}`)}
                                                        </div>
                                                        <div>{riskPeriod.reason}</div>
                                                        <div className="text-muted-foreground">
                                                            {formatDateRange(riskPeriod.startDate, riskPeriod.endDate)}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    // Formater une plage de dates
    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${format(startDate, 'dd MMM', { locale: fr })} - ${format(endDate, 'dd MMM yyyy', { locale: fr })}`;
    };

    // Rendre le pied de page avec les légendes
    const renderLegend = () => (
        <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span className="text-xs">{t('conflit.severite.bloquant')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-xs">{t('conflit.severite.avertissement')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs">{t('conflit.severite.information')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">{t('calendrier.conge_sans_conflit')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive/30"></div>
                <span className="text-xs">{t('calendrier.periode_risque_critique')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-warning/30"></div>
                <span className="text-xs">{t('calendrier.periode_risque_elevee')}</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500/30"></div>
                <span className="text-xs">{t('calendrier.periode_risque_moyenne')}</span>
            </div>
        </div>
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{t('calendrier.conflits.titre')}</CardTitle>
                        <CardDescription>
                            {team && `${t('calendrier.conflits.equipe')}: ${team}`}
                            {department && !team && `${t('calendrier.conflits.departement')}: ${department}`}
                            {!team && !department && t('calendrier.conflits.tous_collaborateurs')}
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className="gap-1">
                            <Users className="h-3 w-3" />
                            {users.length} {t('calendrier.conflits.utilisateurs')}
                        </Badge>

                        <Badge className="gap-1" variant="destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {conflicts.length} {t('calendrier.conflits.conflits')}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {renderCalendarHeader()}
                {renderWeekdayHeader()}
                {renderCalendarBody()}
            </CardContent>

            <CardFooter className="flex-col items-start">
                {renderLegend()}
            </CardFooter>
        </Card>
    );
}; 