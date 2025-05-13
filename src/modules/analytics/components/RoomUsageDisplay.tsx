'use client';

import React from 'react';
import { RoomUtilizationReport } from '@/modules/analytics/services/analyticsService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface RoomUsageDisplayProps {
    reportData: RoomUtilizationReport | null;
    isLoading: boolean;
    error: string | null;
    siteName?: string;
}

const formatPercent = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
};

const formatDuration = (minutes: number) => {
    if (isNaN(minutes) || !isFinite(minutes) || minutes === 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h > 0 ? `${h}h` : ''} ${m > 0 ? `${m}min` : ''}`.trim() || '0min';
};

interface ReportableItem {
    numberOfRooms: number;
    totalPlannedHours: number;
    totalAvailableHours: number;
    numberOfProcedures: number;
}

interface ReportTotals extends ReportableItem {
    occupancyRate: number;
    averageProcedureDurationMinutes: number;
}

const calculateTotals = (items: ReportableItem[]): ReportTotals => {
    const aggregatedBase = items.reduce((acc, item) => {
        acc.numberOfRooms += item.numberOfRooms;
        acc.totalPlannedHours += item.totalPlannedHours;
        acc.totalAvailableHours += item.totalAvailableHours;
        acc.numberOfProcedures += item.numberOfProcedures;
        return acc;
    }, {
        numberOfRooms: 0,
        totalPlannedHours: 0,
        totalAvailableHours: 0,
        numberOfProcedures: 0,
    } as ReportableItem); // L'accumulateur est de type ReportableItem initialement

    const occupancyRate = aggregatedBase.totalAvailableHours > 0 ? aggregatedBase.totalPlannedHours / aggregatedBase.totalAvailableHours : 0;
    const averageProcedureDurationMinutes = aggregatedBase.numberOfProcedures > 0 ? (aggregatedBase.totalPlannedHours * 60) / aggregatedBase.numberOfProcedures : 0;

    return {
        ...aggregatedBase,
        occupancyRate,
        averageProcedureDurationMinutes,
    };
};

export function RoomUsageDisplay({ reportData, isLoading, error, siteName }: RoomUsageDisplayProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 space-x-2 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Chargement des données du rapport...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Erreur lors du chargement du rapport</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!reportData) {
        return (
            <div className="text-center p-8 text-gray-500 mt-4">
                Veuillez sélectionner des filtres et cliquer sur "Appliquer" pour afficher le rapport.
            </div>
        );
    }

    const { summary, bySectorCategory, byRoomType } = reportData;
    const hasSectorData = bySectorCategory.length > 0;
    const hasRoomTypeData = byRoomType.length > 0;

    if (!hasSectorData && !hasRoomTypeData) {
        return (
            <div className="text-center p-8 text-gray-500 mt-4">
                Aucune donnée d'utilisation à afficher pour la période et le site sélectionnés.
            </div>
        );
    }

    // Assurer que les items passés à calculateTotals sont conformes à ReportableItem
    const sectorTotals = hasSectorData ? calculateTotals(bySectorCategory.map(item => ({ ...item }))) : null;
    const roomTypeTotals = hasRoomTypeData ? calculateTotals(byRoomType.map(item => ({ ...item }))) : null;


    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Rapport d'Utilisation des Salles</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                        Site : <strong>{siteName || summary.siteId}</strong><br />
                        Période : du <strong>{new Date(summary.startDate + 'T00:00:00').toLocaleDateString()}</strong> au <strong>{new Date(summary.endDate + 'T00:00:00').toLocaleDateString()}</strong>
                    </CardDescription>
                </CardHeader>
            </Card>

            {hasSectorData && sectorTotals && (
                <Card>
                    <CardHeader>
                        <CardTitle>Par Catégorie de Secteur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right">Salles</TableHead>
                                    <TableHead className="text-right">H. Planif.</TableHead>
                                    <TableHead className="text-right">H. Dispo.</TableHead>
                                    <TableHead className="text-right">Occup.</TableHead>
                                    <TableHead className="text-right">Nb Proc.</TableHead>
                                    <TableHead className="text-right">Durée Moy.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bySectorCategory.map((item) => (
                                    <TableRow key={item.category}>
                                        <TableCell className="font-medium">{item.category}</TableCell>
                                        <TableCell className="text-right">{item.numberOfRooms}</TableCell>
                                        <TableCell className="text-right">{item.totalPlannedHours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">{item.totalAvailableHours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">{formatPercent(item.occupancyRate)}</TableCell>
                                        <TableCell className="text-right">{item.numberOfProcedures}</TableCell>
                                        <TableCell className="text-right">{formatDuration(item.averageProcedureDurationMinutes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-semibold bg-gray-50 dark:bg-gray-700">
                                    <TableCell>Total (Secteurs)</TableCell>
                                    <TableCell className="text-right">{sectorTotals.numberOfRooms}</TableCell>
                                    <TableCell className="text-right">{sectorTotals.totalPlannedHours.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{sectorTotals.totalAvailableHours.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{formatPercent(sectorTotals.occupancyRate)}</TableCell>
                                    <TableCell className="text-right">{sectorTotals.numberOfProcedures}</TableCell>
                                    <TableCell className="text-right">{formatDuration(sectorTotals.averageProcedureDurationMinutes)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {hasRoomTypeData && roomTypeTotals && (
                <Card>
                    <CardHeader>
                        <CardTitle>Par Type de Salle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Salles</TableHead>
                                    <TableHead className="text-right">H. Planif.</TableHead>
                                    <TableHead className="text-right">H. Dispo.</TableHead>
                                    <TableHead className="text-right">Occup.</TableHead>
                                    <TableHead className="text-right">Nb Proc.</TableHead>
                                    <TableHead className="text-right">Durée Moy.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {byRoomType.map((item) => (
                                    <TableRow key={item.type}>
                                        <TableCell className="font-medium">{item.type}</TableCell>
                                        <TableCell className="text-right">{item.numberOfRooms}</TableCell>
                                        <TableCell className="text-right">{item.totalPlannedHours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">{item.totalAvailableHours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">{formatPercent(item.occupancyRate)}</TableCell>
                                        <TableCell className="text-right">{item.numberOfProcedures}</TableCell>
                                        <TableCell className="text-right">{formatDuration(item.averageProcedureDurationMinutes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-semibold bg-gray-50 dark:bg-gray-700">
                                    <TableCell>Total (Types)</TableCell>
                                    <TableCell className="text-right">{roomTypeTotals.numberOfRooms}</TableCell>
                                    <TableCell className="text-right">{roomTypeTotals.totalPlannedHours.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{roomTypeTotals.totalAvailableHours.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{formatPercent(roomTypeTotals.occupancyRate)}</TableCell>
                                    <TableCell className="text-right">{roomTypeTotals.numberOfProcedures}</TableCell>
                                    <TableCell className="text-right">{formatDuration(roomTypeTotals.averageProcedureDurationMinutes)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 