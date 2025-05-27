'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Users,
    Clock,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    UserCheck,
    Zap,
    Star,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuickReplacementModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: {
        id: string;
        userId: string;
        userName: string;
        shiftType: string;
        startDate: Date;
        endDate: Date;
        location?: string;
    };
    onReplace: (newUserId: string) => void;
}

interface ReplacementCandidate {
    id: string;
    name: string;
    avatar?: string;
    score: number;
    availability: 'available' | 'partial' | 'busy';
    workload: {
        current: number;
        average: number;
    };
    competencies: string[];
    lastReplacement?: Date;
    fatigueScore: number;
    metrics: {
        replacementsThisMonth: number;
        averageResponseTime: number;
        reliability: number;
    };
}

export function QuickReplacementModal({
    isOpen,
    onClose,
    assignment,
    onReplace
}: QuickReplacementModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'available' | 'recommended'>('recommended');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && assignment) {
            findReplacementCandidates();
        }
    }, [isOpen, assignment]);

    const findReplacementCandidates = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/planning/quick-replacement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignment.id,
                    shiftType: assignment.shiftType,
                    startDate: assignment.startDate,
                    endDate: assignment.endDate,
                    currentUserId: assignment.userId
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCandidates(data.candidates || []);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de remplaçants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmReplacement = async () => {
        if (!selectedCandidate) return;

        setIsProcessing(true);
        try {
            await onReplace(selectedCandidate);
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    const getAvailabilityIcon = (availability: string) => {
        switch (availability) {
            case 'available':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'partial':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'busy':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getAvailabilityLabel = (availability: string) => {
        switch (availability) {
            case 'available':
                return 'Disponible';
            case 'partial':
                return 'Partiellement disponible';
            case 'busy':
                return 'Occupé';
            default:
                return 'Inconnu';
        }
    };

    const filteredCandidates = candidates.filter(candidate => {
        if (filter === 'all') return true;
        if (filter === 'available') return candidate.availability === 'available';
        if (filter === 'recommended') return candidate.score >= 70;
        return true;
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Remplacement Rapide
                    </DialogTitle>
                    <DialogDescription>
                        Trouvez rapidement un remplaçant pour {assignment.userName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Détails de l'affectation */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Affectation à remplacer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {format(new Date(assignment.startDate), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{assignment.shiftType}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filtres */}
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                        <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="recommended">
                                <Star className="h-4 w-4 mr-2" />
                                Recommandés
                            </TabsTrigger>
                            <TabsTrigger value="available">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Disponibles
                            </TabsTrigger>
                            <TabsTrigger value="all">
                                <Users className="h-4 w-4 mr-2" />
                                Tous
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Liste des candidats */}
                    <ScrollArea className="h-[400px] pr-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : filteredCandidates.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Aucun remplaçant disponible pour cette période
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-3">
                                {filteredCandidates.map((candidate) => (
                                    <Card
                                        key={candidate.id}
                                        className={`cursor-pointer transition-all ${
                                            selectedCandidate === candidate.id
                                                ? 'ring-2 ring-primary'
                                                : 'hover:shadow-md'
                                        }`}
                                        onClick={() => setSelectedCandidate(candidate.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={candidate.avatar} />
                                                        <AvatarFallback>
                                                            {candidate.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">{candidate.name}</div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            {getAvailabilityIcon(candidate.availability)}
                                                            <span>{getAvailabilityLabel(candidate.availability)}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {candidate.competencies.slice(0, 3).map((comp) => (
                                                                <Badge key={comp} variant="secondary" className="text-xs">
                                                                    {comp}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <div className="text-2xl font-bold">
                                                        {candidate.score}%
                                                    </div>
                                                    <Progress value={candidate.score} className="w-20" />
                                                </div>
                                            </div>

                                            {/* Métriques détaillées */}
                                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Charge</div>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Activity className="h-3 w-3" />
                                                        <span className="text-sm font-medium">
                                                            {candidate.workload.current}/{candidate.workload.average}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Fatigue</div>
                                                    <div className="text-sm font-medium">
                                                        {candidate.fatigueScore}/100
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Fiabilité</div>
                                                    <div className="text-sm font-medium">
                                                        {candidate.metrics.reliability}%
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmReplacement}
                        disabled={!selectedCandidate || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Traitement...
                            </>
                        ) : (
                            'Confirmer le remplacement'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}