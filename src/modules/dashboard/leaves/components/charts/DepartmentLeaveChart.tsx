import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { DepartmentLeaveStats } from '../../services/leaveAnalyticsService';

// Couleurs pour les barres
const colors = [
    '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d',
    '#a4de6c', '#d0ed57', '#ffc658', '#ff8042'
];

interface DepartmentLeaveChartProps {
    data: DepartmentLeaveStats[];
}

const DepartmentLeaveChart: React.FC<DepartmentLeaveChartProps> = ({ data }) => {
    // Formatage des données pour le graphique
    const chartData = data.map((dept, index) => ({
        name: dept.departmentName,
        totalLeaves: dept.totalLeaves,
        totalDays: dept.totalDays,
        color: colors[index % colors.length]
    }));

    // Personnalisation du tooltip
    const CustomTooltip = ({ active, payload, label }: unknown) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
                    <p style={{ margin: 0, color: payload[0].color }}>
                        {`Demandes: ${payload[0].value}`}
                    </p>
                    <p style={{ margin: 0, color: payload[1].color }}>
                        {`Jours: ${payload[1].value}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                    yAxisId="left"
                    dataKey="totalLeaves"
                    name="Nombre de demandes"
                    fill="#8884d8"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
                <Bar
                    yAxisId="right"
                    dataKey="totalDays"
                    name="Nombre de jours"
                    fill="#82ca9d"
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default DepartmentLeaveChart; 