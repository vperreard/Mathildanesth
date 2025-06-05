'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Calendar, 
    Users, 
    ArrowLeft,
    Filter,
    Download,
    Clock,
    Moon,
    Stethoscope
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface TeamMember {
    id: string;
    name: string;
    role: 'MAR' | 'IADE';
    avatar?: string;
    specialty?: string;
}

interface TeamShift {
    userId: string;
    date: Date;
    type: 'GARDE_24H' | 'ASTREINTE' | 'VACATION' | 'BLOC' | 'CONSULTATION' | 'REPOS' | 'CONGE';
    period?: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    location?: string;
}

// Configuration des couleurs par type
const shiftColors = {
    GARDE_24H: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    ASTREINTE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    VACATION: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    BLOC: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    CONSULTATION: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    REPOS: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
    CONGE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
};

const shiftIcons = {
    GARDE_24H: Moon,
    ASTREINTE: Clock,
    BLOC: Stethoscope,
    VACATION: Clock,
    CONSULTATION: Users,
    REPOS: null,
    CONGE: null
};

export default function TeamPlanningPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamShifts, setTeamShifts] = useState<TeamShift[]>([]);
    const [selectedRole, setSelectedRole] = useState<'ALL' | 'MAR' | 'IADE'>('ALL');

    useEffect(() => {
        loadTeamPlanning();
    }, [currentWeek, selectedRole]);

    const loadTeamPlanning = async () => {
        try {
            setLoading(true);
            // Simuler le chargement des données
            // TODO: Remplacer par un appel API réel
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Données simulées
            const mockTeamMembers: TeamMember[] = [
                { id: '1', name: 'Dr. Martin', role: 'MAR', specialty: 'Pédiatrie' },
                { id: '2', name: 'Dr. Dubois', role: 'MAR' },
                { id: '3', name: 'Sophie L.', role: 'IADE' },
                { id: '4', name: 'Pierre M.', role: 'IADE' },
                { id: '5', name: 'Dr. Bernard', role: 'MAR', specialty: 'Cardiologie' },
            ];

            const mockShifts: TeamShift[] = [
                { userId: '1', date: new Date(), type: 'BLOC', period: 'MORNING', location: 'Salle 3' },
                { userId: '2', date: new Date(), type: 'GARDE_24H' },
                { userId: '3', date: new Date(), type: 'BLOC', period: 'AFTERNOON', location: 'Salle 5' },
                { userId: '4', date: addDays(new Date(), 1), type: 'ASTREINTE' },
                { userId: '5', date: addDays(new Date(), 2), type: 'CONSULTATION' },
            ];

            setTeamMembers(mockTeamMembers);
            setTeamShifts(mockShifts);

        } catch (error) {
            logger.error('Erreur lors du chargement du planning équipe:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger le planning de l'équipe",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getShiftsForUserAndDate = (userId: string, date: Date) => {
        return teamShifts.filter(shift => 
            shift.userId === userId && 
            shift.date.toDateString() === date.toDateString()
        );
    };

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const filteredMembers = selectedRole === 'ALL' 
        ? teamMembers 
        : teamMembers.filter(member => member.role === selectedRole);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Planning de l'équipe
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                    >
                        Semaine préc.
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentWeek(new Date())}
                    >
                        Cette semaine
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                    >
                        Semaine suiv.
                    </Button>
                </div>
            </div>

            {/* Filtres */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filtrer par rôle :</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={selectedRole === 'ALL' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedRole('ALL')}
                                >
                                    Tous
                                </Button>
                                <Button
                                    variant={selectedRole === 'MAR' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedRole('MAR')}
                                >
                                    MAR
                                </Button>
                                <Button
                                    variant={selectedRole === 'IADE' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedRole('IADE')}
                                >
                                    IADE
                                </Button>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Planning grid */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-4 font-medium">Équipe</th>
                                    {weekDays.map(day => (
                                        <th key={day.toISOString()} className="text-center p-4 font-medium min-w-[120px]">
                                            <div>
                                                <div className="text-sm">
                                                    {format(day, 'EEEE', { locale: fr })}
                                                </div>
                                                <div className={cn(
                                                    "text-xs text-muted-foreground",
                                                    day.toDateString() === new Date().toDateString() && "text-primary font-bold"
                                                )}>
                                                    {format(day, 'd MMM', { locale: fr })}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(member => (
                                    <tr key={member.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback>
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{member.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {member.role}
                                                        </Badge>
                                                        {member.specialty && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {member.specialty}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map(day => {
                                            const shifts = getShiftsForUserAndDate(member.id, day);
                                            return (
                                                <td key={day.toISOString()} className="p-2 text-center">
                                                    {shifts.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {shifts.map((shift, idx) => {
                                                                const Icon = shiftIcons[shift.type];
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded text-xs font-medium",
                                                                            shiftColors[shift.type]
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            {Icon && <Icon className="h-3 w-3" />}
                                                                            <span>
                                                                                {shift.type === 'GARDE_24H' ? '24h' :
                                                                                 shift.type === 'ASTREINTE' ? 'Astr.' :
                                                                                 shift.type === 'BLOC' ? 'Bloc' :
                                                                                 shift.type === 'CONSULTATION' ? 'Cons.' :
                                                                                 shift.type === 'VACATION' ? 'Vac.' :
                                                                                 shift.type}
                                                                            </span>
                                                                        </div>
                                                                        {shift.location && (
                                                                            <div className="text-[10px] opacity-80">
                                                                                {shift.location}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Légende */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-sm">Légende</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {Object.entries(shiftColors).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded", color.split(' ')[0])} />
                                <span className="text-xs">
                                    {type === 'GARDE_24H' ? 'Garde 24h' :
                                     type === 'ASTREINTE' ? 'Astreinte' :
                                     type === 'VACATION' ? 'Vacation' :
                                     type === 'BLOC' ? 'Bloc' :
                                     type === 'CONSULTATION' ? 'Consultation' :
                                     type === 'REPOS' ? 'Repos' :
                                     type === 'CONGE' ? 'Congé' :
                                     type}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}