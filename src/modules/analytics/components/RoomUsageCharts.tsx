'use client';

import React from 'react';
import { RoomUtilizationReport, SectorCategoryUtilization, RoomTypeUtilization } from '@/modules/analytics/services/analyticsService'; // Ajustez le chemin
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from 'recharts';
// ACTION UTILISATEUR: Assurez-vous d'avoir installé Recharts: npm install recharts ou yarn add recharts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RoomUsageChartsProps {
    reportData: RoomUtilizationReport | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-300 shadow-lg rounded text-sm">
                <p className="font-bold">{`${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.fill }}>{`${pld.name}: ${pld.value.toFixed(1)}%`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const renderPercentLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0 || !value) return null;
    const radius = 10;
    const yOffset = value > 5 ? -5 : 15; // Ajuster la position du label si la barre est petite

    return (
        <text
            x={x + width / 2}
            y={y + yOffset}
            fill="#333"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10px"
        >
            {`${value.toFixed(0)}%`}
        </text>
    );
};

export function RoomUsageCharts({ reportData }: RoomUsageChartsProps) {
    if (!reportData || (reportData.bySectorCategory.length === 0 && reportData.byRoomType.length === 0)) {
        return null; // Ne rien afficher si pas de données ou si les deux listes sont vides
    }

    const { bySectorCategory, byRoomType } = reportData;

    const chartDataSector = bySectorCategory.map(item => ({
        name: item.category,
        'Taux d\'occupation': parseFloat((item.occupancyRate * 100).toFixed(1)),
        // Vous pouvez ajouter d'autres métriques ici, comme 'Heures Planifiées': item.totalPlannedHours
    }));

    const chartDataRoomType = byRoomType.map(item => ({
        name: item.type,
        'Taux d\'occupation': parseFloat((item.occupancyRate * 100).toFixed(1)),
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {bySectorCategory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Taux d'Occupation par Catégorie de Secteur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartDataSector} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} fontSize={10} height={50} />
                                <YAxis unit="%" domain={[0, 100]} allowDataOverflow={true} tickCount={6} fontSize={10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
                                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} iconSize={10} formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                                <Bar dataKey="Taux d'occupation" fill="#8884d8" barSize={30} radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Taux d'occupation" content={renderPercentLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {byRoomType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Taux d'Occupation par Type de Salle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartDataRoomType} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} fontSize={10} height={50} />
                                <YAxis unit="%" domain={[0, 100]} allowDataOverflow={true} tickCount={6} fontSize={10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
                                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} iconSize={10} formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                                <Bar dataKey="Taux d'occupation" fill="#82ca9d" barSize={30} radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Taux d'occupation" content={renderPercentLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 