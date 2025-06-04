'use client';

import React, { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Settings, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useOptimizedPlanning } from '@/hooks/useOptimizedPlanning';
import { VirtualizedPlanningWeekView } from '@/components/optimized/VirtualizedPlanningWeekView';

// Dynamic imports for better code splitting
const TrameEditor = dynamic(
    () => import('@/components/bloc-operatoire/TrameEditor/TrameEditor').then(mod => ({ default: mod.TrameEditor })),
    {
        loading: () => <Skeleton className="h-96 w-full" />,
        ssr: false
    }
);

const RoomAssignmentPanel = dynamic(
    () => import('@/components/bloc-operatoire/RoomAssignmentPanel/RoomAssignmentPanel').then(mod => ({ default: mod.RoomAssignmentPanel })),
    {
        loading: () => <Skeleton className="h-64 w-full" />,
        ssr: false
    }
);

// Loading skeleton component
const LoadingFallback = () => (
    <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-3/4" />
    </div>
);

export default function OptimizedBlocPlanning() {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [view, setView] = useState<string>('week');
    const [activeTab, setActiveTab] = useState<string>('planning');
    const [selectedTrameId, setSelectedTrameId] = useState<number | undefined>();

    // Use optimized planning hook with caching and prefetching
    const {
        data: planningData,
        isLoading,
        error,
        updateFilters,
        prefetchAdjacentWeeks,
        optimisticUpdate,
        updatePlanning,
        isUpdating
    } = useOptimizedPlanning({
        week: currentWeek,
        viewType: 'week',
        enablePrefetch: true
    });

    // Memoized event transformation
    const events = useMemo(() => {
        if (!planningData?.attributions) return [];
        
        return planningData.attributions.map((attribution: any) => ({
            id: attribution.id,
            title: attribution.user ? `${attribution.user.firstName} ${attribution.user.lastName}` : 'Non assigné',
            startTime: attribution.period === 'MORNING' ? '08:00' : attribution.period === 'AFTERNOON' ? '14:00' : '20:00',
            endTime: attribution.period === 'MORNING' ? '14:00' : attribution.period === 'AFTERNOON' ? '20:00' : '08:00',
            roomId: attribution.roomId,
            roomName: attribution.room?.name || '',
            supervisorId: attribution.userId,
            supervisorName: attribution.user ? `${attribution.user.firstName} ${attribution.user.lastName}` : '',
            activityType: attribution.type,
            color: attribution.room?.sector?.color || '#3b82f6'
        }));
    }, [planningData?.attributions]);

    // Handle week changes with prefetching
    const handleWeekChange = useCallback((newWeek: Date) => {
        setCurrentWeek(newWeek);
        updateFilters({ week: newWeek });
        // Trigger prefetch for smooth navigation
        setTimeout(() => prefetchAdjacentWeeks(), 0);
    }, [updateFilters, prefetchAdjacentWeeks]);

    // Handle event click
    const handleEventClick = useCallback((event: any) => {
        console.log('Event clicked:', event);
        // Open edit modal or navigate to detail view
    }, []);

    // Handle time slot click for new attribution
    const handleTimeSlotClick = useCallback((date: Date, period: any, roomId: number) => {
        console.log('Time slot clicked:', { date, period, roomId });
        // Open attribution creation modal
    }, []);

    // Handle trameModele selection
    const handleTrameSelect = useCallback((trameId: number) => {
        setSelectedTrameId(trameId);
        setActiveTab('editor');
    }, []);

    // Handle trameModele save with optimistic update
    const handleTrameSave = useCallback((affectations: any[]) => {
        // Optimistic update
        optimisticUpdate((data) => ({
            ...data,
            attributions: [...data.attributions, ...affectations]
        }));

        // Actual save
        updatePlanning(affectations);
        setActiveTab('planning');
    }, [optimisticUpdate, updatePlanning]);

    return (
        <div className="space-y-6">
            {/* Toolbar */}
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
                        disabled={isUpdating}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle trameModele
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

            {/* Tabs */}
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
                    <TabsTrigger value="attributions">
                        Affectations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="planning" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planning du Bloc Opératoire</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <LoadingFallback />
                            ) : error ? (
                                <div className="text-red-500">Erreur lors du chargement du planning</div>
                            ) : (
                                <VirtualizedPlanningWeekView
                                    currentWeek={currentWeek}
                                    events={events}
                                    rooms={planningData?.rooms || []}
                                    onEventClick={handleEventClick}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onWeekChange={handleWeekChange}
                                    readOnly={false}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="editor" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Éditeur de TrameModele</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <TrameEditor
                                    trameId={selectedTrameId}
                                    onSave={handleTrameSave}
                                    onCancel={() => setActiveTab('planning')}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attributions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Affectations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<LoadingFallback />}>
                                <RoomAssignmentPanel
                                    rooms={planningData?.rooms || []}
                                    attributions={planningData?.attributions || []}
                                    onAssignmentChange={updatePlanning}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}