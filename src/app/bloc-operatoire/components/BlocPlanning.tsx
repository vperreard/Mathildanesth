'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedBlocOperatoire } from '@/hooks/useOptimizedBlocOperatoire';

// Imports des composants modernes
import { TrameEditor } from '@/components/bloc-operatoire/TrameEditor/TrameEditor';
import { PlanningWeekView } from '@/components/bloc-operatoire/PlanningWeekView/PlanningWeekView';
import { RoomAssignmentPanel } from '@/components/bloc-operatoire/RoomAssignmentPanel/RoomAssignmentPanel';

// Composant de fallback pour le chargement
const LoadingFallback = () => (
    <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-3/4" />
    </div>
);

/**
 * Composant de planning du bloc opératoire optimisé
 * 
 * Ce composant intègre les vrais composants d'édition et de visualisation
 * des plannings avec drag & drop, validation temps réel et UX moderne.
 * Optimisations: préchargement, cache, lazy loading
 */
export default function BlocPlanning() {
    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<string>('week');
    const [activeTab, setActiveTab] = useState<string>('planning');
    const [selectedTrameId, setSelectedTrameId] = useState<number | undefined>();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Hook optimisé avec préchargement et cache
    const {
        useOperatingRooms,
        useOperatingSectors,
        useBlocPlanning,
        prefetchCriticalData,
        batchFetchPlanningWeek,
        getCacheMetrics
    } = useOptimizedBlocOperatoire({
        enablePrefetch: true,
        staleTime: 1000 * 60 * 5 // 5 minutes pour les données dynamiques
    });

    // Charger les données avec le hook optimisé
    const { data: rooms, isLoading: roomsLoading } = useOperatingRooms();
    const { data: sectors, isLoading: sectorsLoading } = useOperatingSectors();
    const { data: planning, isLoading: planningLoading } = useBlocPlanning(date);

    // Précharger les données critiques au montage
    useEffect(() => {
        const loadInitialData = async () => {
            const startTime = Date.now();
            
            try {
                // Précharger en parallèle
                await Promise.all([
                    prefetchCriticalData(),
                    batchFetchPlanningWeek(date)
                ]);
                
                const loadTime = Date.now() - startTime;
                console.log(`Chargement initial du bloc opératoire: ${loadTime}ms`);
                
                // Objectif: < 2 secondes
                if (loadTime > 2000) {
                    console.warn('⚠️ Chargement initial > 2s, optimisation nécessaire');
                }
            } finally {
                setIsInitialLoad(false);
            }
        };

        loadInitialData();
    }, []);

    // Précharger la semaine lors du changement de date
    useEffect(() => {
        if (!isInitialLoad && view === 'week') {
            batchFetchPlanningWeek(date);
        }
    }, [date, view, isInitialLoad, batchFetchPlanningWeek]);

    const handleTrameSelect = (trameId: number) => {
        setSelectedTrameId(trameId);
        setActiveTab('editor');
    };

    const handleTrameSave = (affectations: any[]) => {
        console.log('Trame sauvegardée:', affectations);
        setActiveTab('planning');
    };

    return (
        <div className="space-y-6">
            {/* Barre d'outils principale */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <Select value={view} onValueChange={setView}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Vue" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Vue journalière</SelectItem>
                            <SelectItem value="week">Vue hebdomadaire</SelectItem>
                            <SelectItem value="month">Vue mensuelle</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActiveTab('editor')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle trame
                    </Button>
                </div>

                <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/bloc-operatoire">
                            <Settings className="h-4 w-4 mr-2" />
                            Administration
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Interface à onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 w-full max-w-lg">
                    <TabsTrigger value="planning">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Planning
                    </TabsTrigger>
                    <TabsTrigger value="editor">
                        <Settings className="h-4 w-4 mr-2" />
                        Éditeur
                    </TabsTrigger>
                    <TabsTrigger value="assignment">
                        <Plus className="h-4 w-4 mr-2" />
                        Affectation
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Planning - Vue calendrier moderne */}
                <TabsContent value="planning" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Planning du Bloc Opératoire</span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                                        Aujourd'hui
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <PlanningWeekView
                                    currentWeek={date}
                                    onWeekChange={setDate}
                                    onEventClick={(event) => handleTrameSelect(event.id)}
                                    planning={planning}
                                    isLoading={planningLoading}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Éditeur - TrameEditor moderne */}
                <TabsContent value="editor" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Éditeur de Trames</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Suspense fallback={<LoadingFallback />}>
                                <TrameEditor
                                    trameModeleId={selectedTrameId}
                                    onSave={handleTrameSave}
                                    onCancel={() => setActiveTab('planning')}
                                    className="border-0"
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Affectation - Panel intelligent */}
                <TabsContent value="assignment" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Panel d'Affectation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <RoomAssignmentPanel
                                    selectedDay={date.getDay() as any}
                                    onValidate={() => setActiveTab('planning')}
                                    rooms={rooms}
                                    supervisors={sectors}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Mini calendrier latéral (optionnel pour navigation rapide) */}
            <div className="fixed right-4 bottom-4 z-50">
                <Card className="w-80 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Navigation rapide</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            className="rounded-md border-0"
                        />
                    </CardContent>
                </Card>
            </div>
            {/* Indicateur de performance en dev */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 text-xs text-muted-foreground">
                    {!planningLoading && planning && (
                        <span>Données chargées en cache</span>
                    )}
                </div>
            )}
        </div>
    );

    // Affichage pendant le chargement initial
    if (isInitialLoad || (roomsLoading && sectorsLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement du bloc opératoire...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Barre d'outils principale */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <Select value={view} onValueChange={setView}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Vue" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Vue journalière</SelectItem>
                            <SelectItem value="week">Vue hebdomadaire</SelectItem>
                            <SelectItem value="month">Vue mensuelle</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActiveTab('editor')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle trame
                    </Button>
                </div>

                <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/bloc-operatoire">
                            <Settings className="h-4 w-4 mr-2" />
                            Administration
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Interface à onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 w-full max-w-lg">
                    <TabsTrigger value="planning">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Planning
                    </TabsTrigger>
                    <TabsTrigger value="editor">
                        <Settings className="h-4 w-4 mr-2" />
                        Éditeur
                    </TabsTrigger>
                    <TabsTrigger value="assignment">
                        <Plus className="h-4 w-4 mr-2" />
                        Affectation
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Planning - Vue calendrier moderne */}
                <TabsContent value="planning" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Planning du Bloc Opératoire</span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                                        Aujourd'hui
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <PlanningWeekView
                                    currentWeek={date}
                                    onWeekChange={setDate}
                                    onEventClick={(event) => handleTrameSelect(event.id)}
                                    planning={planning}
                                    isLoading={planningLoading}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Éditeur - TrameEditor moderne */}
                <TabsContent value="editor" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Éditeur de Trames</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Suspense fallback={<LoadingFallback />}>
                                <TrameEditor
                                    trameModeleId={selectedTrameId}
                                    onSave={handleTrameSave}
                                    onCancel={() => setActiveTab('planning')}
                                    className="border-0"
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Affectation - Panel intelligent */}
                <TabsContent value="assignment" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Panel d'Affectation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <RoomAssignmentPanel
                                    selectedDay={date.getDay() as any}
                                    onValidate={() => setActiveTab('planning')}
                                    rooms={rooms}
                                    supervisors={sectors}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Mini calendrier latéral (optionnel pour navigation rapide) */}
            <div className="fixed right-4 bottom-4 z-50">
                <Card className="w-80 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Navigation rapide</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            className="rounded-md border-0"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Indicateur de performance en dev */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 text-xs text-muted-foreground">
                    {!planningLoading && planning && (
                        <span>Données chargées en cache</span>
                    )}
                </div>
            )}
        </div>
    );
}