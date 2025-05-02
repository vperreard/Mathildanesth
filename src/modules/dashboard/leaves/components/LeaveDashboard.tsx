import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Tabs,
    Tab,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
    Alert,
    Tooltip,
    IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    FilterAlt as FilterIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

import { LeaveType, LeaveStatus } from '../../../leaves/types/leave';
import { useLeaveAnalytics, AggregationType } from '../hooks/useLeaveAnalytics';
import DepartmentLeaveChart from './charts/DepartmentLeaveChart';
import MonthlyLeaveChart from './charts/MonthlyLeaveChart';
import LeaveTypePieChart from './charts/LeaveTypePieChart';
import TeamAbsenceBarChart from './charts/TeamAbsenceBarChart';
import LeaveTypeTrendChart from './charts/LeaveTypeTrendChart';
import PeakPredictionChart from './charts/PeakPredictionChart';

/**
 * Composant principal du tableau de bord des congés
 */
const LeaveDashboard: React.FC = () => {
    // État pour les filtres
    const [startDate, setStartDate] = useState<Date>(startOfMonth(addMonths(new Date(), -6)));
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<LeaveType[]>([]);
    const [aggregationType, setAggregationType] = useState<AggregationType>(AggregationType.MONTH);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [showFilters, setShowFilters] = useState<boolean>(false);

    // Configurer le hook d'analyse
    const analytics = useLeaveAnalytics({
        filter: {
            startDate,
            endDate,
            departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
            types: selectedLeaveTypes.length > 0 ? selectedLeaveTypes : undefined
        },
        aggregation: aggregationType,
        autoLoad: ['department', 'period', 'team', 'trend', 'prediction']
    });

    // Gérer le changement d'onglet
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    // Appliquer les filtres
    const applyFilters = () => {
        analytics.refreshAll();
        setShowFilters(false);
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setStartDate(startOfMonth(addMonths(new Date(), -6)));
        setEndDate(endOfMonth(new Date()));
        setSelectedDepartments([]);
        setSelectedLeaveTypes([]);
        setAggregationType(AggregationType.MONTH);
    };

    // Exporter les données au format CSV
    const handleExport = async () => {
        try {
            const dataTypes = ['department', 'period', 'team', 'user'] as const;
            const dataType = dataTypes[currentTab] || 'department';
            const csvData = await analytics.exportToCSV(dataType);

            // Créer un lien de téléchargement
            const link = document.createElement('a');
            link.href = csvData;
            link.download = `conges_${dataType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Tableau de bord des congés
                    </Typography>

                    <Box>
                        <Tooltip title="Rafraîchir les données">
                            <IconButton
                                onClick={() => analytics.refreshAll()}
                                disabled={analytics.isAnyLoading}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Filtres">
                            <IconButton onClick={() => setShowFilters(!showFilters)}>
                                <FilterIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Exporter les données">
                            <IconButton
                                onClick={handleExport}
                                disabled={analytics.isAnyLoading}
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Filtres */}
                {showFilters && (
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Filtres</Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <DatePicker
                                        label="Date de début"
                                        value={startDate}
                                        onChange={(newValue) => newValue && setStartDate(newValue)}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: { fullWidth: true, variant: 'outlined' }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <DatePicker
                                        label="Date de fin"
                                        value={endDate}
                                        onChange={(newValue) => newValue && setEndDate(newValue)}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: { fullWidth: true, variant: 'outlined' }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Type d'agrégation</InputLabel>
                                        <Select
                                            value={aggregationType}
                                            onChange={(e) => setAggregationType(e.target.value as AggregationType)}
                                            label="Type d'agrégation"
                                        >
                                            <MenuItem value={AggregationType.DAY}>Jour</MenuItem>
                                            <MenuItem value={AggregationType.WEEK}>Semaine</MenuItem>
                                            <MenuItem value={AggregationType.MONTH}>Mois</MenuItem>
                                            <MenuItem value={AggregationType.QUARTER}>Trimestre</MenuItem>
                                            <MenuItem value={AggregationType.YEAR}>Année</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Types de congé</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedLeaveTypes}
                                            onChange={(e) => setSelectedLeaveTypes(e.target.value as LeaveType[])}
                                            label="Types de congé"
                                        >
                                            <MenuItem value={LeaveType.ANNUAL}>Annuel</MenuItem>
                                            <MenuItem value={LeaveType.SICK}>Maladie</MenuItem>
                                            <MenuItem value={LeaveType.TRAINING}>Formation</MenuItem>
                                            <MenuItem value={LeaveType.RECOVERY}>Récupération</MenuItem>
                                            <MenuItem value={LeaveType.SPECIAL}>Spécial</MenuItem>
                                            <MenuItem value={LeaveType.MATERNITY}>Maternité</MenuItem>
                                            <MenuItem value={LeaveType.UNPAID}>Sans solde</MenuItem>
                                            <MenuItem value={LeaveType.OTHER}>Autre</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={resetFilters}
                                        sx={{ mr: 2 }}
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={applyFilters}
                                        disabled={analytics.isAnyLoading}
                                    >
                                        Appliquer
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Onglets */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="analytics tabs">
                        <Tab label="Par département" />
                        <Tab label="Par période" />
                        <Tab label="Par équipe" />
                        <Tab label="Par utilisateur" />
                        <Tab label="Tendances" />
                        <Tab label="Prévisions" icon={<TrendingUpIcon />} iconPosition="end" />
                    </Tabs>
                </Box>

                {/* Contenu de l'onglet Département */}
                {currentTab === 0 && (
                    <Box>
                        {analytics.loading.department ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : analytics.errors.department ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Erreur lors du chargement des données par département: {analytics.errors.department.message}
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Répartition des congés par département</Typography>
                                            <Box sx={{ height: 400 }}>
                                                <DepartmentLeaveChart data={analytics.departmentStats} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Types de congés</Typography>
                                            <Box sx={{ height: 400 }}>
                                                <LeaveTypePieChart data={analytics.departmentStats} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Statistiques détaillées par département</Typography>
                                            <Box sx={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Département</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Total congés</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Total jours</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Durée moyenne</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Taux d'approbation</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Congés annuels</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Congés maladie</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analytics.departmentStats.map((dept) => (
                                                            <tr key={dept.departmentId}>
                                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.departmentName}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.totalLeaves}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.totalDays}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.averageDuration.toFixed(1)}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{(dept.approvalRate * 100).toFixed(1)}%</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.byType[LeaveType.ANNUAL]?.count || 0}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{dept.byType[LeaveType.SICK]?.count || 0}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Contenu de l'onglet Période */}
                {currentTab === 1 && (
                    <Box>
                        {analytics.loading.period ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : analytics.errors.period ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Erreur lors du chargement des données par période: {analytics.errors.period.message}
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Évolution des congés par période</Typography>
                                            <Box sx={{ height: 400 }}>
                                                <MonthlyLeaveChart data={analytics.periodStats} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Contenu de l'onglet Équipe */}
                {currentTab === 2 && (
                    <Box>
                        {analytics.loading.team ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : analytics.errors.team ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Erreur lors du chargement des données par équipe: {analytics.errors.team.message}
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Taux d'absence par équipe</Typography>
                                            <Box sx={{ height: 400 }}>
                                                <TeamAbsenceBarChart data={analytics.teamAbsenceRates} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Périodes de pointe d'absence
                                                <Tooltip title="Périodes où le taux d'absence est le plus élevé">
                                                    <IconButton size="small">
                                                        <WarningIcon fontSize="small" color="warning" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Typography>

                                            <Box sx={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Équipe</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Taux moyen</th>
                                                            <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Pic d'absence</th>
                                                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Taux max</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analytics.teamAbsenceRates.map((team) => (
                                                            <tr key={team.teamId}>
                                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{team.teamName}</td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{(team.overallRate * 100).toFixed(1)}%</td>
                                                                <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                    {team.peakDate ? format(team.peakDate, 'dd MMMM yyyy', { locale: fr }) : '-'}
                                                                </td>
                                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                    {team.peakRate ? (team.peakRate * 100).toFixed(1) + '%' : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Contenu de l'onglet Utilisateur */}
                {currentTab === 3 && (
                    <Box>
                        {analytics.loading.user ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Statistiques par utilisateur</Typography>
                                            <Button
                                                variant="outlined"
                                                onClick={() => analytics.loadUserStats()}
                                                sx={{ mb: 2 }}
                                            >
                                                Charger les données utilisateurs
                                            </Button>

                                            {analytics.userStats.length > 0 ? (
                                                <Box sx={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Utilisateur</th>
                                                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Congés pris</th>
                                                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Jours pris</th>
                                                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Jours restants</th>
                                                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Congés annuels</th>
                                                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Congés maladie</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {analytics.userStats.map((user) => (
                                                                <tr key={user.userId}>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{user.userName}</td>
                                                                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{user.totalLeavesTaken}</td>
                                                                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{user.totalDaysTaken}</td>
                                                                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{user.remainingDays}</td>
                                                                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{user.byType[LeaveType.ANNUAL]?.count || 0}</td>
                                                                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{user.byType[LeaveType.SICK]?.count || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </Box>
                                            ) : (
                                                <Typography>Aucune donnée disponible</Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Contenu de l'onglet Tendances */}
                {currentTab === 4 && (
                    <Box>
                        {analytics.loading.trend ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : analytics.errors.trend ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Erreur lors du chargement des tendances: {analytics.errors.trend.message}
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Tendances par type de congé</Typography>
                                            <Box sx={{ height: 500 }}>
                                                <LeaveTypeTrendChart data={analytics.leaveTypeTrends} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Contenu de l'onglet Prévisions */}
                {currentTab === 5 && (
                    <Box>
                        {analytics.loading.prediction ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : analytics.errors.prediction ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Erreur lors du chargement des prévisions: {analytics.errors.prediction.message}
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Prévision des périodes de pointe
                                                <Tooltip title="Prévisions basées sur les données historiques">
                                                    <IconButton size="small">
                                                        <TrendingUpIcon fontSize="small" color="primary" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Typography>
                                            <Box sx={{ height: 400 }}>
                                                <PeakPredictionChart data={analytics.peakPredictions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Recommandations</Typography>
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                Basé sur les prévisions, préparez-vous à une augmentation des demandes de congés pendant les périodes estivales (Juillet-Août) et les fêtes de fin d'année (Décembre).
                                            </Alert>
                                            <Alert severity="warning">
                                                Pour assurer une continuité de service, il est recommandé de planifier des ressources supplémentaires pendant ces périodes.
                                            </Alert>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default LeaveDashboard; 