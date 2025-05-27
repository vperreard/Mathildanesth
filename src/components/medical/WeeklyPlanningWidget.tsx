'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Calendar, 
    Clock, 
    AlertCircle, 
    CheckCircle, 
    Users,
    Stethoscope,
    Moon,
    Sun,
    Coffee
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Types pour le planning médical
interface ShiftType {
    id: string;
    type: 'GARDE_24H' | 'ASTREINTE' | 'VACATION' | 'BLOC' | 'CONSULTATION' | 'REPOS' | 'CONGE';
    label: string;
    startTime: string;
    endTime: string;
    location?: string;
    room?: string;
    supervisor?: string;
    status: 'CONFIRME' | 'EN_ATTENTE' | 'URGENT' | 'REMPLACE';
    replacementNeeded?: boolean;
}

interface DayPlanning {
    date: Date;
    shifts: ShiftType[];
    isToday: boolean;
    isTomorrow: boolean;
    dayName: string;
}

interface WeeklyPlanningWidgetProps {
    userId?: string;
    className?: string;
}

// Configuration des couleurs par type d'affectation
const shiftColors = {
    GARDE_24H: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: Moon },
    ASTREINTE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', icon: AlertCircle },
    VACATION: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: Clock },
    BLOC: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', icon: Stethoscope },
    CONSULTATION: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: Users },
    REPOS: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', icon: Coffee },
    CONGE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', icon: Sun }
};

// Labels médicaux en français
const shiftLabels = {
    GARDE_24H: 'Garde 24h',
    ASTREINTE: 'Astreinte',
    VACATION: 'Vacation',
    BLOC: 'Bloc opératoire',
    CONSULTATION: 'Consultation',
    REPOS: 'Repos',
    CONGE: 'Congé'
};

export default function WeeklyPlanningWidget({ userId, className }: WeeklyPlanningWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [weekData, setWeekData] = useState<DayPlanning[]>([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [nextShift, setNextShift] = useState<ShiftType | null>(null);

    useEffect(() => {
        loadWeeklyPlanning();
    }, [currentWeek, userId]);

    const loadWeeklyPlanning = async () => {
        try {
            setLoading(true);
            const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

            const response = await fetch('/api/mon-planning/semaine', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement du planning');
            }

            const data = await response.json();

            // Transformer les données pour l'affichage
            const formattedWeek = [];
            for (let i = 0; i < 7; i++) {
                const currentDate = addDays(weekStart, i);
                const dayShifts = data.shifts.filter((shift: any) => {
                    const shiftDate = new Date(shift.date);
                    return shiftDate.toDateString() === currentDate.toDateString();
                });

                formattedWeek.push({
                    date: currentDate,
                    shifts: dayShifts,
                    isToday: isToday(currentDate),
                    isTomorrow: isTomorrow(currentDate),
                    dayName: format(currentDate, 'EEEE', { locale: fr })
                });
            }

            setWeekData(formattedWeek);

            // Identifier la prochaine garde/vacation
            const upcoming = data.shifts
                .filter((shift: any) => new Date(shift.date) >= new Date())
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            
            setNextShift(upcoming);

        } catch (error) {
            console.error('Erreur lors du chargement du planning:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger votre planning",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = (action: string) => {
        switch(action) {
            case 'conge':
                window.location.href = '/conges/nouveau';
                break;
            case 'echange':
                window.location.href = '/requetes/echange-garde';
                break;
            case 'equipe':
                window.location.href = '/planning/equipe';
                break;
        }
    };

    const renderShift = (shift: ShiftType) => {
        const config = shiftColors[shift.type];
        const Icon = config.icon;

        return (
            <div
                key={shift.id}
                className={cn(
                    "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                    config.bg,
                    shift.status === 'URGENT' && "border-red-500 animate-pulse",
                    shift.replacementNeeded && "border-orange-500"
                )}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.text)} />
                        <div>
                            <p className={cn("font-medium text-sm", config.text)}>
                                {shiftLabels[shift.type]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {shift.startTime} - {shift.endTime}
                            </p>
                            {shift.location && (
                                <p className="text-xs text-muted-foreground">
                                    {shift.location} {shift.room && `- ${shift.room}`}
                                </p>
                            )}
                        </div>
                    </div>
                    {shift.status === 'URGENT' && (
                        <Badge variant="destructive" className="text-xs">
                            Urgent
                        </Badge>
                    )}
                    {shift.status === 'EN_ATTENTE' && (
                        <Badge variant="secondary" className="text-xs">
                            En attente
                        </Badge>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Ma Semaine du {format(weekData[0]?.date || new Date(), 'd MMMM', { locale: fr })}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                        >
                            Sem. préc.
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeek(new Date())}
                        >
                            Aujourd'hui
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                        >
                            Sem. suiv.
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Alerte prochaine garde */}
                {nextShift && (
                    <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <p className="font-medium">Prochaine affectation</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {shiftLabels[nextShift.type]} - {format(new Date(nextShift.startTime), 'EEEE d MMMM à HH:mm', { locale: fr })}
                        </p>
                    </div>
                )}

                {/* Planning de la semaine */}
                <div className="space-y-4">
                    {weekData.map((day) => (
                        <div
                            key={day.date.toISOString()}
                            className={cn(
                                "border rounded-lg p-4 transition-all",
                                day.isToday && "border-primary bg-primary/5",
                                day.isTomorrow && "border-blue-500"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium capitalize">
                                        {day.dayName} {format(day.date, 'd', { locale: fr })}
                                    </h3>
                                    {day.isToday && (
                                        <Badge variant="default" className="text-xs">
                                            Aujourd'hui
                                        </Badge>
                                    )}
                                    {day.isTomorrow && (
                                        <Badge variant="secondary" className="text-xs">
                                            Demain
                                        </Badge>
                                    )}
                                </div>
                                {day.shifts.length === 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        Libre
                                    </Badge>
                                )}
                            </div>
                            
                            {day.shifts.length > 0 ? (
                                <div className="space-y-2">
                                    {day.shifts.map(renderShift)}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Aucune affectation
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions rapides */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => handleQuickAction('conge')}
                        className="w-full"
                    >
                        <Sun className="h-4 w-4 mr-2" />
                        Demander congé
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handleQuickAction('echange')}
                        className="w-full"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Échanger garde
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handleQuickAction('equipe')}
                        className="w-full"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Voir équipe
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}