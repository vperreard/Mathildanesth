import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { LeaveType } from '../../../conges/types/leave';

// Enregistrement des éléments ChartJS nécessaires
ChartJS.register(ArcElement, Tooltip, Legend);

// Mapping des couleurs par type de congé
const leaveTypeColors: Record<LeaveType, string> = {
    [LeaveType.ANNUAL]: '#4CAF50', // Vert
    [LeaveType.SICK]: '#F44336',   // Rouge
    [LeaveType.UNPAID]: '#9E9E9E', // Gris
    [LeaveType.PARENTAL]: '#2196F3', // Bleu
    [LeaveType.TRAINING]: '#FF9800', // Orange
    [LeaveType.OTHER]: '#673AB7',  // Violet
    [LeaveType.FAMILY]: '#E91E63', // Rose
    [LeaveType.REMOTE]: '#00BCD4', // Cyan
};

// Type des statistiques par type de congé
interface TypeDistribution {
    type: LeaveType;
    count: number;
    days: number;
}

interface LeaveDistributionChartProps {
    data: TypeDistribution[];
    mode: 'count' | 'days';
    title?: string;
}

const LeaveDistributionChart = ({ data, mode, title }: LeaveDistributionChartProps) => {
    // Préparation des données pour le graphique
    const chartData: ChartData<'pie'> = {
        labels: data.map(item => LeaveType[item.type]),
        datasets: [
            {
                data: data.map(item => mode === 'count' ? item.count : item.days),
                backgroundColor: data.map(item => leaveTypeColors[item.type]),
                borderColor: data.map(item => leaveTypeColors[item.type].replace(')', ', 0.8)')),
                borderWidth: 1,
            },
        ],
    };

    // Options du graphique
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            title: {
                display: !!title,
                text: title || '',
                font: {
                    size: 16,
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} ${mode === 'count' ? 'demandes' : 'jours'}`;
                    }
                }
            }
        },
    };

    return (
        <div className="leave-chart-container">
            <Pie data={chartData} options={options} />
        </div>
    );
};

export default LeaveDistributionChart; 