import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { LeavePeakAnalysisResponse, LeavePeakAggregationUnit, SpecialPeriod } from '@/modules/analytics/services/analyticsService'; // Ajuster si besoin
import { LeaveType } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent as DatePicker } from '@/components/ui/date-picker';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeavePeakAnalysisWidgetProps {
    defaultSiteId?: string;
}

const AGGREGATION_UNITS: { value: LeavePeakAggregationUnit; label: string }[] = [
    { value: 'DAY', label: 'Par Jour' },
    { value: 'WEEK', label: 'Par Semaine' },
    { value: 'MONTH', label: 'Par Mois' },
];

export const LeavePeakAnalysisWidget: React.FC<LeavePeakAnalysisWidgetProps> = ({ defaultSiteId }) => {
    const [data, setData] = useState<LeavePeakAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 3))); // 3 mois par défaut
    const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
    const [aggregationUnit, setAggregationUnit] = useState<LeavePeakAggregationUnit>('WEEK');
    const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<LeaveType[]>([]); // TODO: Ajouter sélecteur multi-options
    const [siteId, setSiteId] = useState<string | undefined>(defaultSiteId);

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
            params.append('aggregationUnit', aggregationUnit);
            if (siteId) params.append('siteId', siteId);
            if (selectedLeaveTypes.length > 0) params.append('leaveTypes', selectedLeaveTypes.join(','));

            const response = await fetch(`/api/analytics/leave-peak-analysis?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            }
            const result: LeavePeakAnalysisResponse = await response.json();
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
    }, [startDate, endDate, aggregationUnit, selectedLeaveTypes, siteId]);

    const chartData = useMemo(() => {
        if (!data?.leaveTrends) return [];
        // TODO: Recharts pourrait avoir besoin de dates JS pour l'axe X si on veut une échelle de temps continue.
        // Pour l'instant, on traite les dates comme des catégories.
        return data.leaveTrends.map(item => ({
            date: item.date, // Garder le format YYYY-MM-DD, YYYY-WW, YYYY-MM
            Congés: item.leaveCount,
        }));
    }, [data]);

    const renderSpecialPeriods = () => {
        if (!data || !chartData || chartData.length === 0) return null;

        return data.specialPeriods.map((period, index) => {
            // Trouver les index correspondants dans chartData pour x1, x2 peut être complexe
            // si les dates ne correspondent pas exactement. Pour une V1 on peut styliser les tooltips
            // ou ajouter des éléments externes au graphique. 
            // Pour ReferenceArea, il faut mapper les dates de period aux index ou valeurs de l'axe X.
            // Ceci est une implémentation simplifiée et nécessitera un ajustement fin.

            // Pour l'instant, on ne dessine pas de ReferenceArea car le mapping est complexe
            // avec des dates agrégées (semaine/mois) vs dates exactes des périodes spéciales.
            // On pourrait plutôt les lister sous le graphique.
            return null;
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Analyse des Pics de Demandes de Congés</CardTitle>
                <CardDescription>
                    Visualisation des tendances de demandes de congés et corrélation avec les périodes spéciales.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                        <DatePicker selected={startDate} onSelect={setStartDate} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                        <DatePicker selected={endDate} onSelect={setEndDate} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agréger par</label>
                        <Select value={aggregationUnit} onValueChange={(value) => setAggregationUnit(value as LeavePeakAggregationUnit)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Agréger par..." />
                            </SelectTrigger>
                            <SelectContent>
                                {AGGREGATION_UNITS.map(unit => (
                                    <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* TODO: Ajouter sélecteur Site et Types de Congés */}
                    <Button onClick={fetchData} disabled={isLoading || !startDate || !endDate} className="self-end">
                        {isLoading ? 'Chargement...' : 'Rafraîchir'}
                    </Button>
                </div>

                {error && <p className="text-red-500">Erreur: {error}</p>}
                {isLoading && !data && <p>Chargement des données...</p>}

                {data && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Tendances des Demandes de Congés</h3>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis label={{ value: 'Nb. Demandes', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Congés" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                                        {/* {renderSpecialPeriods()} Placeholder pour ReferenceArea si on l'implémente */}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <p>Aucune demande de congé pour la période et les filtres sélectionnés.</p>}
                        </div>

                        {data.specialPeriods.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Périodes Spéciales Correspondantes</h3>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    {data.specialPeriods.map(period => (
                                        <li key={`${period.type}-${period.name}-${period.startDate}`}>
                                            <strong>{period.name}</strong> ({period.type === 'PUBLIC_HOLIDAY' ? 'Jour Férié' : 'Vacances Scolaires'}):
                                            du {format(parseISO(period.startDate), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(period.endDate), 'dd/MM/yyyy', { locale: fr })}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="text-sm text-gray-500 mt-4">
                            {startDate && endDate && <p>Période du {format(startDate, 'dd/MM/yyyy')} au {format(endDate, 'dd/MM/yyyy')}. Agrégation: {AGGREGATION_UNITS.find(u => u.value === aggregationUnit)?.label}.</p>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 