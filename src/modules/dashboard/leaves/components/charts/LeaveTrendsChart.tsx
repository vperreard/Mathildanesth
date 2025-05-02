import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { LeaveType } from '@/modules/leaves/types/leave';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

// Enregistrer les composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// Mappage des types de congés à des couleurs spécifiques
const leaveTypeColors: Record<string, string> = {
    [LeaveType.ANNUAL]: '#4CAF50',
    [LeaveType.SICK]: '#F44336',
    [LeaveType.TRAINING]: '#2196F3',
    [LeaveType.MATERNITY]: '#9C27B0',
    [LeaveType.UNPAID]: '#FF9800',
    [LeaveType.SPECIAL]: '#795548',
    [LeaveType.RECOVERY]: '#607D8B',
    [LeaveType.OTHER]: '#9E9E9E'
};

interface LeaveTrendsChartProps {
    data?: Array<{
        date: string;
        count: number;
        byType: Record<LeaveType, number>;
    }>;
    isLoading?: boolean;
    error?: string;
    aggregation: 'daily' | 'weekly' | 'monthly';
    title?: string;
}

const LeaveTrendsChart: React.FC<LeaveTrendsChartProps> = ({
    data = [],
    isLoading = false,
    error,
    aggregation,
    title = 'Tendance des congés'
}) => {
    const theme = useTheme();

    // Formater les dates selon l'agrégation
    const formatDate = (dateStr: string): string => {
        const date = parseISO(dateStr);

        switch (aggregation) {
            case 'daily':
                return format(date, 'dd MMM', { locale: fr });
            case 'weekly':
                return format(date, "'Sem' w yyyy", { locale: fr });
            case 'monthly':
            default:
                return format(date, 'MMM yyyy', { locale: fr });
        }
    };

    // Préparer les données pour Chart.js
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };

        const labels = data.map(item => formatDate(item.date));

        // Collecter tous les types de congés présents dans les données
        const leaveTypes = Array.from(
            new Set(
                data.flatMap(item => Object.keys(item.byType))
            )
        ) as LeaveType[];

        // Créer un dataset pour chaque type de congé
        const datasets = leaveTypes.map(leaveType => {
            const typeData = data.map(item => item.byType[leaveType] || 0);

            return {
                label: leaveType.charAt(0).toUpperCase() + leaveType.slice(1).toLowerCase(),
                data: typeData,
                backgroundColor: leaveTypeColors[leaveType] || '#9E9E9E',
                borderColor: leaveTypeColors[leaveType] || '#9E9E9E',
                tension: 0.2,
                fill: false
            };
        });

        // Ajouter un dataset pour le total
        datasets.unshift({
            label: 'Total',
            data: data.map(item => item.count),
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            tension: 0.2,
            fill: false,
            borderWidth: 2
        } as any);  // Utiliser 'as any' pour éviter les erreurs TypeScript avec les propriétés spécifiques à Chart.js

        return { labels, datasets };
    }, [data, theme.palette.primary.main, aggregation]);

    // Options du graphique
    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>{title}</Typography>

                <Box sx={{ height: 300, position: 'relative' }}>
                    {isLoading && (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Box sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}

                    {!isLoading && !error && data.length === 0 && (
                        <Box sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <Typography color="textSecondary">Aucune donnée disponible</Typography>
                        </Box>
                    )}

                    {!isLoading && !error && data.length > 0 && (
                        <Line data={chartData} options={options} />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default LeaveTrendsChart; 