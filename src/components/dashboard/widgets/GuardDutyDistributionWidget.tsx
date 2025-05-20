import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GuardDutyStatsResponse, DutyDistributionStat, UserDutyDistribution } from '@/modules/analytics/services/analyticsService'; // Ajuster le chemin si nécessaire
import { ProfessionalRole } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent as DatePicker } from '@/components/ui/date-picker';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FF6B6B'];

interface GuardDutyDistributionWidgetProps {
    defaultSiteId?: string;
    // Autres props de configuration si nécessaire
}

export const GuardDutyDistributionWidget: React.FC<GuardDutyDistributionWidgetProps> = ({ defaultSiteId }) => {
    const [data, setData] = useState<GuardDutyStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 1)));
    const [endDate, setEndDate] = useState<Date | null>(endOfMonth(subMonths(new Date(), 1)));
    const [siteId, setSiteId] = useState<string | undefined>(defaultSiteId);
    // TODO: Ajouter un sélecteur pour les rôles si nécessaire
    const [selectedRoles, setSelectedRoles] = useState<ProfessionalRole[]>([]);

    const fetchData = async () => {
        if (!startDate || !endDate) {
            setError("Les dates de début et de fin sont requises.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('startDate', format(startDate, 'yyyy-MM-dd'));
            params.append('endDate', format(endDate, 'yyyy-MM-dd'));
            if (siteId) params.append('siteId', siteId);
            if (selectedRoles.length > 0) params.append('roles', selectedRoles.join(','));

            const response = await fetch(`/api/analytics/duty-distribution?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            }
            const result: GuardDutyStatsResponse = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchData();
        }
    }, [startDate, endDate, siteId, selectedRoles]);

    const chartDataByActivityType = useMemo(() => {
        if (!data?.byActivityType) return [];
        return data.byActivityType.map(item => ({
            name: item.activityTypeCodeOrName,
            total: item.totalAssignments,
            average: parseFloat(item.averageAssignmentsPerUser.toFixed(2)),
        }));
    }, [data]);

    // TODO: Ajouter un composant Table plus sophistiqué avec pagination/tri si nécessaire
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Répartition Gardes/Astreintes</CardTitle>
                <CardDescription>
                    Analyse de la distribution des gardes et astreintes par type et par utilisateur.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6 items-end">
                    <div>
                        <label htmlFor="startDate-duty" className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                        <DatePicker selected={startDate} onSelect={setStartDate} />
                    </div>
                    <div>
                        <label htmlFor="endDate-duty" className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                        <DatePicker selected={endDate} onSelect={setEndDate} />
                    </div>
                    {/* TODO: Ajouter sélecteur de site et de rôles ici */}
                    <Button onClick={fetchData} disabled={isLoading || !startDate || !endDate} className="self-end">
                        {isLoading ? 'Chargement...' : 'Rafraîchir'}
                    </Button>
                </div>

                {error && <p className="text-red-500">Erreur: {error}</p>}

                {isLoading && !data && <p>Chargement des données...</p>}

                {data && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Distribution par Type d'Activité</h3>
                            {chartDataByActivityType.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartDataByActivityType}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Total Affectations', angle: -90, position: 'insideLeft' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Moyenne par Utilisateur', angle: -90, position: 'insideRight' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="total" fill="#8884d8" name="Total Affectations" />
                                        <Bar yAxisId="right" dataKey="average" fill="#82ca9d" name="Moyenne par Utilisateur" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p>Aucune donnée de répartition par type d'activité pour la période sélectionnée.</p>}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Distribution par Utilisateur</h3>
                            {data.byUser.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead className="text-right">Total Gardes/Astreintes</TableHead>
                                            <TableHead>Détail (Type: Nombre)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.byUser.map(userStat => (
                                            <TableRow key={userStat.userId}>
                                                <TableCell>{userStat.userName}</TableCell>
                                                <TableCell className="text-right">{userStat.totalDuties}</TableCell>
                                                <TableCell>
                                                    {userStat.distribution.map((dist, index) => (
                                                        <span key={dist.activityTypeCodeOrName} className="mr-2 whitespace-nowrap">
                                                            {dist.activityTypeCodeOrName}: {dist.count}
                                                            {index < userStat.distribution.length - 1 ? ';' : ''}
                                                        </span>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p>Aucune donnée de répartition par utilisateur pour la période sélectionnée.</p>}
                        </div>
                        {startDate && endDate && (
                            <div className="text-sm text-gray-500 mt-4">
                                <p>Période du {format(startDate, 'dd/MM/yyyy')} au {format(endDate, 'dd/MM/yyyy')}.</p>
                                <p>Types d'affectation ciblés: {data.summary.targetAssignmentTypes.join(', ') || 'N/A'}.</p>
                                <p>Total affectations analysées: {data.summary.totalAssignments}. Utilisateurs concernés: {data.summary.totalUsersWithAssignments}.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 