'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotaTransferReport } from '../../hooks/useQuotaTransferReport';
import { LeaveType } from '../../types/leave';
import { QuotaTransferReportData } from '../../types/quota';
import { Loader2, Download, Filter, RefreshCw, Table as TableIcon, ChevronDown, ChevronUp, FileSpreadsheet, FileType } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { format, parse, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportFilterPanel } from './ReportFilterPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';

interface QuotaTransferReportPanelProps {
    userId?: string;
    departmentId?: string;
    className?: string;
}

/**
 * Composant d'affichage des rapports de transferts de quotas
 */
export function QuotaTransferReportPanel({ userId, departmentId, className = '' }: QuotaTransferReportPanelProps) {
    const [activeTab, setActiveTab] = useState<string>('tableau');
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const { toast } = useToast();

    // Initialisations des filtres en fonction des props
    const initialFilters: any = {};
    if (userId) initialFilters.userIds = [userId];
    if (departmentId) initialFilters.departments = [departmentId];

    const {
        loading,
        exportLoading,
        error,
        report,
        filters,
        setFilters,
        generateReport,
        exportReport,
        resetFilters
    } = useQuotaTransferReport({
        initialFilters,
        autoLoad: true
    });

    /**
     * Gère l'exportation au format spécifié
     */
    const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
        const success = await exportReport(format);

        if (success) {
            toast({
                title: 'Export réussi',
                description: `Le rapport a été exporté au format ${format.toUpperCase()}.`,
                duration: 3000
            });
        } else {
            toast({
                title: 'Échec de l\'export',
                description: 'Une erreur est survenue lors de l\'exportation du rapport.',
                variant: 'destructive',
                duration: 5000
            });
        }
    };

    /**
     * Préparation des données pour les graphiques
     */
    const prepareChartData = () => {
        if (!report) return null;

        // Couleurs pour les graphiques
        const colors = [
            '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
            '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090',
            '#58508d', '#003f5c'
        ];

        // Données pour les graphiques par type de congé
        const leaveTypeData = report.summary.byLeaveType.map((item, index) => ({
            name: getLeaveTypeLabel(item.leaveType as LeaveType),
            value: item.days,
            count: item.count,
            color: colors[index % colors.length]
        }));

        // Données pour les graphiques par département
        const departmentData = report.summary.byDepartment?.map((item, index) => ({
            name: item.departmentName || 'Département non défini',
            value: item.days,
            count: item.count,
            color: colors[index % colors.length]
        })) || [];

        // Données pour les graphiques par mois
        const monthData = report.summary.byMonth?.map((item, index) => ({
            name: item.month,
            value: item.days,
            count: item.count
        })).sort((a, b) => {
            const dateA = parse(a.name, 'MMMM yyyy', new Date(), { locale: fr });
            const dateB = parse(b.name, 'MMMM yyyy', new Date(), { locale: fr });
            return dateA.getTime() - dateB.getTime();
        }) || [];

        // Données pour les graphiques par statut
        const statusData = report.summary.byStatus.map((item, index) => ({
            name: getStatusLabel(item.status),
            value: item.days,
            count: item.count,
            color: getStatusColor(item.status)
        }));

        return {
            leaveTypeData,
            departmentData,
            monthData,
            statusData
        };
    };

    /**
     * Obtient le label pour un type de congé
     */
    const getLeaveTypeLabel = (type: LeaveType): string => {
        const labels: Record<LeaveType, string> = {
            ANNUAL: 'Congés annuels',
            RECOVERY: 'Récupération',
            TRAINING: 'Formation',
            SICK: 'Maladie',
            MATERNITY: 'Maternité',
            SPECIAL: 'Congés spéciaux',
            UNPAID: 'Sans solde',
            OTHER: 'Autre'
        };

        return labels[type] || type;
    };

    /**
     * Obtient le label pour un statut
     */
    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            PENDING: 'En attente',
            APPROVED: 'Approuvé',
            REJECTED: 'Refusé',
            CANCELLED: 'Annulé'
        };

        return labels[status] || status;
    };

    /**
     * Obtient la couleur pour un statut
     */
    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            PENDING: '#ffc658',
            APPROVED: '#82ca9d',
            REJECTED: '#ff6361',
            CANCELLED: '#8884d8'
        };

        return colors[status] || '#8884d8';
    };

    /**
     * Gère l'application des filtres
     */
    const handleApplyFilters = (newFilters: unknown) => {
        setFilters(newFilters);
        setIsFilterOpen(false);
        generateReport();
    };

    const chartData = prepareChartData();

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Rapport des transferts de quotas</CardTitle>
                        <CardDescription>
                            Analyse des transferts de quotas entre types de congés
                        </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtres
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Filtrer le rapport</SheetTitle>
                                    <SheetDescription>
                                        Ajustez les filtres pour personnaliser votre rapport
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-4">
                                    <ReportFilterPanel
                                        currentFilters={filters}
                                        onApplyFilters={handleApplyFilters}
                                        onResetFilters={resetFilters}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateReport()}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Actualiser
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={exportLoading || !report}>
                                    {exportLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Exporter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <FilePdf className="mr-2 h-4 w-4" />
                                    PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileType className="mr-2 h-4 w-4" />
                                    CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                            {error.message || 'Une erreur est survenue lors du chargement du rapport.'}
                        </AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="tableau" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="tableau">
                            <TableIcon className="mr-2 h-4 w-4" />
                            Tableau
                        </TabsTrigger>
                        <TabsTrigger value="synthese">
                            <ChartIcon className="mr-2 h-4 w-4" />
                            Synthèse
                        </TabsTrigger>
                        <TabsTrigger value="evolution">
                            <LineChartIcon className="mr-2 h-4 w-4" />
                            Évolution
                        </TabsTrigger>
                    </TabsList>

                    {/* Tableau des données */}
                    <TabsContent value="tableau">
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : report && report.data.length > 0 ? (
                            <ScrollArea className="h-[500px]">
                                <Table>
                                    <TableCaption>
                                        {report.data.length} transferts affichés
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead>Département</TableHead>
                                            <TableHead>Type source</TableHead>
                                            <TableHead>Type dest.</TableHead>
                                            <TableHead className="text-right">Jours</TableHead>
                                            <TableHead className="text-right">Jours convertis</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Approuvé par</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.data.map((transfer: QuotaTransferReportData) => (
                                            <TableRow key={transfer.id}>
                                                <TableCell>{transfer.userName}</TableCell>
                                                <TableCell>{transfer.departmentName || '-'}</TableCell>
                                                <TableCell>{getLeaveTypeLabel(transfer.fromType)}</TableCell>
                                                <TableCell>{getLeaveTypeLabel(transfer.toType)}</TableCell>
                                                <TableCell className="text-right">{transfer.amount.toFixed(1)}</TableCell>
                                                <TableCell className="text-right">{transfer.convertedAmount.toFixed(1)}</TableCell>
                                                <TableCell>{transfer.transferDate}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            transfer.status === 'APPROVED' ? 'success' :
                                                                transfer.status === 'PENDING' ? 'outline' :
                                                                    transfer.status === 'REJECTED' ? 'destructive' : 'secondary'
                                                        }
                                                    >
                                                        {getStatusLabel(transfer.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{transfer.approvedByName || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                                <p>Aucun transfert trouvé pour les critères sélectionnés.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFilterOpen(true)}
                                    className="mt-4"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Modifier les filtres
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphiques de synthèse */}
                    <TabsContent value="synthese">
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : report && chartData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Répartition par type de congé */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Répartition par type de congé</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.leaveTypeData}
                                                        nameKey="name"
                                                        dataKey="value"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {chartData.leaveTypeData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [`${value} jours`, '']} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Répartition par statut */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Répartition par statut</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.statusData}
                                                        nameKey="name"
                                                        dataKey="value"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {chartData.statusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [`${value} jours`, '']} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Répartition par département */}
                                {chartData.departmentData.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">Répartition par département</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={chartData.departmentData}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip formatter={(value) => [`${value} jours`, '']} />
                                                        <Legend />
                                                        <Bar dataKey="value" name="Jours" fill="#8884d8" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Métrique globale */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Résumé</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                                                <span className="text-xl font-semibold">{report.summary.totalTransfers}</span>
                                                <span className="text-sm text-muted-foreground">Transferts</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                                                <span className="text-xl font-semibold">{report.summary.totalDays.toFixed(1)}</span>
                                                <span className="text-sm text-muted-foreground">Jours transférés</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                                                <span className="text-xl font-semibold">
                                                    {(report.summary.byStatus.find(s => s.status === 'APPROVED')?.days || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">Jours approuvés</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                                                <span className="text-xl font-semibold">
                                                    {(report.summary.byStatus.find(s => s.status === 'PENDING')?.days || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">Jours en attente</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                                <p>Aucune donnée disponible pour les critères sélectionnés.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFilterOpen(true)}
                                    className="mt-4"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Modifier les filtres
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphique d'évolution temporelle */}
                    <TabsContent value="evolution">
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : report && chartData && chartData.monthData.length > 0 ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Évolution mensuelle des transferts</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={chartData.monthData}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis yAxisId="left" />
                                                    <YAxis yAxisId="right" orientation="right" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="value"
                                                        name="Jours transférés"
                                                        stroke="#8884d8"
                                                        activeDot={{ r: 8 }}
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="count"
                                                        name="Nombre de transferts"
                                                        stroke="#82ca9d"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                                <p>Aucune donnée d'évolution disponible pour la période sélectionnée.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFilterOpen(true)}
                                    className="mt-4"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Modifier les filtres
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                    {report ? `${report.data.length} transferts trouvés` : 'Aucune donnée'}
                </div>
                <div className="text-sm text-muted-foreground">
                    Période: {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : 'Non spécifiée'} - {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : 'Non spécifiée'}
                </div>
            </CardFooter>
        </Card>
    );
}

// Icônes pour les onglets
const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

const LineChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"></path>
        <path d="m19 9-5 5-4-4-3 3"></path>
    </svg>
); 