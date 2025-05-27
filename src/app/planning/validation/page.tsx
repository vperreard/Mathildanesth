'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendrier';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
    Calendar as CalendarIcon, 
    CheckCircle, 
    AlertCircle, 
    RefreshCw, 
    Download,
    ChevronRight,
    Users,
    Clock,
    AlertTriangle,
    FileCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import PlanningValidator from '@/components/PlanningValidator';
import { OptimizedCalendarCell } from '@/components/optimized/OptimizedCalendarCell';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Types
import { Assignment, ValidationResult, RuleViolation } from '@/types/assignment';
import { User } from '@/types/user';

/**
 * Page de validation du planning avec interface drag & drop
 * Permet de visualiser, modifier et valider le planning généré
 */
export default function PlanningValidationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [view, setView] = useState<'calendar' | 'list' | 'conflicts'>('calendar');
    
    // État du planning
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [modifiedAssignments, setModifiedAssignments] = useState<Set<string>>(new Set());

    // Charger le planning généré
    useEffect(() => {
        loadGeneratedPlanning();
    }, []);

    const loadGeneratedPlanning = async () => {
        try {
            setIsLoading(true);
            // TODO: Charger depuis l'API
            const response = await fetch('http://localhost:3000/api/planning/current');
            const data = await response.json();
            
            setAssignments(data.assignments || []);
            setValidationResult(data.validation || null);
            setUsers(data.users || []);
        } catch (error) {
            console.error('Erreur lors du chargement du planning:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger le planning",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Gérer le drag & drop
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { draggableId, source, destination } = result;
        
        // Mettre à jour l'affectation
        const updatedAssignments = [...assignments];
        const assignmentIndex = updatedAssignments.findIndex(a => a.id === draggableId);
        
        if (assignmentIndex !== -1) {
            // Logique de mise à jour selon le type de déplacement
            // TODO: Implémenter la logique complète
            updatedAssignments[assignmentIndex] = {
                ...updatedAssignments[assignmentIndex],
                // Mettre à jour selon destination
            };
            
            setAssignments(updatedAssignments);
            setModifiedAssignments(prev => new Set([...prev, draggableId]));
            
            // Revalider
            validatePlanning(updatedAssignments);
        }
    };

    // Valider le planning
    const validatePlanning = async (planningData: Assignment[] = assignments) => {
        try {
            const response = await fetch('http://localhost:3000/api/planning/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: planningData })
            });
            
            const result = await response.json();
            setValidationResult(result);
        } catch (error) {
            console.error('Erreur de validation:', error);
        }
    };

    // Résoudre une violation
    const handleResolveViolation = (violation: RuleViolation, assignmentIds?: string[]) => {
        // TODO: Implémenter la résolution automatique
        toast({
            title: "Résolution en cours",
            description: "La violation sera résolue automatiquement",
        });
    };

    // Approuver le planning
    const handleApprove = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('http://localhost:3000/api/planning/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assignments,
                    month: format(selectedMonth, 'yyyy-MM')
                })
            });

            if (response.ok) {
                toast({
                    title: "Planning approuvé",
                    description: "Le planning a été enregistré avec succès",
                });
                router.push('/planning');
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'approuver le planning",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Régénérer le planning
    const handleRegenerate = () => {
        router.push('/planning/generation');
    };

    // Exporter en PDF
    const handleExportPDF = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/planning/export/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments, month: format(selectedMonth, 'yyyy-MM') })
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planning-${format(selectedMonth, 'yyyy-MM')}.pdf`;
            a.click();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'exporter le planning",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="flex items-center justify-center h-96">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Validation du Planning</h1>
                    <p className="text-muted-foreground">
                        Vérifiez et ajustez le planning avant approbation finale
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={!validationResult?.valid}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter PDF
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleApprove}
                        disabled={!validationResult?.valid || isSaving}
                    >
                        {isSaving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <FileCheck className="h-4 w-4 mr-2" />
                        )}
                        Approuver
                    </Button>
                </div>
            </div>

            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Couverture</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {validationResult?.metrics.equiteScore || 0}%
                        </div>
                        <Progress 
                            value={validationResult?.metrics.equiteScore || 0} 
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Équité</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(validationResult?.metrics.equiteScore || 0)}%
                        </div>
                        <Progress 
                            value={validationResult?.metrics.equiteScore || 0} 
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Fatigue moyenne</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(validationResult?.metrics.fatigueScore || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Score moyen
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Conflits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center">
                            {validationResult?.violations.length || 0}
                            {validationResult?.violations.length === 0 && (
                                <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {modifiedAssignments.size > 0 && (
                                <Badge variant="secondary">
                                    {modifiedAssignments.size} modifications
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Interface principale */}
            <Tabs value={view} onValueChange={setView} className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="calendar">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Calendrier
                    </TabsTrigger>
                    <TabsTrigger value="list">
                        <Users className="h-4 w-4 mr-2" />
                        Liste
                    </TabsTrigger>
                    <TabsTrigger value="conflicts">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Conflits
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Vue Calendrier</CardTitle>
                                <Select
                                    value={format(selectedMonth, 'yyyy-MM')}
                                    onValueChange={(value) => setSelectedMonth(new Date(value))}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const date = addMonths(startOfMonth(new Date()), i - 6);
                                            return (
                                                <SelectItem 
                                                    key={i} 
                                                    value={format(date, 'yyyy-MM')}
                                                >
                                                    {format(date, 'MMMM yyyy', { locale: fr })}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DragDropContext onDragEnd={handleDragEnd}>
                                {/* TODO: Implémenter le calendrier drag & drop */}
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Vue calendrier avec drag & drop en cours d'implémentation
                                    </AlertDescription>
                                </Alert>
                            </DragDropContext>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vue Liste</CardTitle>
                            <CardDescription>
                                Affectations par utilisateur avec possibilité de modification
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* TODO: Implémenter la vue liste */}
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Vue liste en cours d'implémentation
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="conflicts" className="mt-6">
                    {validationResult && (
                        <PlanningValidator
                            validationResult={validationResult}
                            assignments={assignments}
                            users={users}
                            onResolveViolation={handleResolveViolation}
                            onApprove={handleApprove}
                            onRegenerate={handleRegenerate}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}