import React, { useState, useCallback } from 'react';
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
    MenuItem,
    Select,
    TextField,
    IconButton,
    Divider,
    Paper,
    Tooltip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    FilterAlt as FilterIcon,
    Settings as SettingsIcon,
    Send as SendIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { format, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useLeaveStatistics } from '../hooks/useLeaveStatistics';
import { Department } from '@/modules/organization/types';
import { LeaveType, LeaveStatus } from '@/modules/conges/types/leave';
import LeaveTrendsChart from './charts/LeaveTrendsChart';
import TeamAvailabilityChart from './charts/TeamAvailabilityChart';
import { useEventPublisher } from '@/core/events/useEvents';
import { EventType } from '@/core/events/EventTypes';

const exportFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
];

// Données fictives de départements (à remplacer par des données réelles)
const mockDepartments: Department[] = [
    { id: 'd1', name: 'Urgences' },
    { id: 'd2', name: 'Chirurgie' },
    { id: 'd3', name: 'Pédiatrie' },
    { id: 'd4', name: 'Cardiologie' },
    { id: 'd5', name: 'Neurologie' }
];

interface AnalyticalDashboardProps {
    departments?: Department[];
}

/**
 * Composant de tableau de bord analytique des congés
 */
const AnalyticalDashboard: React.FC<AnalyticalDashboardProps> = ({
    departments = mockDepartments
}) => {
    // Configuration des dates par défaut (6 derniers mois jusqu'à aujourd'hui)
    const defaultStartDate = startOfMonth(addMonths(new Date(), -6));
    const defaultEndDate = endOfMonth(new Date());

    // Hooks et états
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
    const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
    const [emailRecipient, setEmailRecipient] = useState<string>('');

    // État des filtres
    const [startDate, setStartDate] = useState<Date>(defaultStartDate);
    const [endDate, setEndDate] = useState<Date>(defaultEndDate);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | ''>('');
    const [selectedAggregation, setSelectedAggregation] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

    // Hook d'événements
    const publishEvent = useEventPublisher();

    // Hook de statistiques
    const {
        statistics,
        isLoadingStats,
        statsError,

        teamAvailability,
        isLoadingAvailability,
        availabilityError,

        trends,
        isLoadingTrends,
        trendsError,
        loadTrends,

        peakPeriods,
        isLoadingPeaks,
        peaksError,

        generateReport,
        updateFilters,
        refreshAll,
        isLoading
    } = useLeaveStatistics({
        initialFilters: {
            startDate: format(defaultStartDate, 'yyyy-MM-dd'),
            endDate: format(defaultEndDate, 'yyyy-MM-dd')
        },
        departmentId: selectedDepartment || undefined
    });

    // Handlers
    const handleTabChange = (_event: unknown, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleApplyFilters = () => {
        const filters = {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            department: selectedDepartment || undefined,
            leaveType: selectedLeaveType || undefined
        };

        updateFilters(filters);
        loadTrends(selectedAggregation, filters);
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setSelectedDepartment('');
        setSelectedLeaveType('');
        setSelectedAggregation('monthly');
    };

    const handleExport = () => {
        setShowExportDialog(true);
    };

    const handleExportConfirm = async () => {
        const success = await generateReport(undefined, exportFormat);

        if (success && emailRecipient) {
            // Simuler l'envoi par email (dans un vrai cas, appelez une API)
            publishEvent(EventType.REPORT_GENERATED, {
                format: exportFormat,
                recipient: emailRecipient,
                timestamp: new Date().toISOString()
            });

            // Notification de succès
            alert(`Rapport exporté et envoyé à ${emailRecipient}`);
        }

        setShowExportDialog(false);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                {/* En-tête et contrôles */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1">
                        Tableau de bord analytique des congés
                    </Typography>

                    <Box>
                        <Tooltip title="Filtres">
                            <IconButton
                                onClick={() => setShowFilters(!showFilters)}
                                color={showFilters ? 'primary' : 'default'}
                            >
                                <FilterIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Actualiser">
                            <IconButton
                                onClick={refreshAll}
                                disabled={isLoading}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Exporter">
                            <IconButton onClick={handleExport}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Panneau de filtres */}
                {showFilters && (
                    <Paper
                        elevation={3}
                        sx={{ p: 3, mb: 4 }}
                    >
                        <Typography variant="h6" gutterBottom>Filtres d'analyse</Typography>

                        <Grid container spacing={3}>
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
                                    <InputLabel>Département</InputLabel>
                                    <Select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        label="Département"
                                    >
                                        <MenuItem value="">
                                            <em>Tous les départements</em>
                                        </MenuItem>
                                        {departments.map((dept) => (
                                            <MenuItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Type de congé</InputLabel>
                                    <Select
                                        value={selectedLeaveType}
                                        onChange={(e) => setSelectedLeaveType(e.target.value as LeaveType | '')}
                                        label="Type de congé"
                                    >
                                        <MenuItem value="">
                                            <em>Tous les types</em>
                                        </MenuItem>
                                        <MenuItem value={LeaveType.ANNUAL}>Annuel</MenuItem>
                                        <MenuItem value={LeaveType.SICK}>Maladie</MenuItem>
                                        <MenuItem value={LeaveType.TRAINING}>Formation</MenuItem>
                                        <MenuItem value={LeaveType.MATERNITY}>Maternité</MenuItem>
                                        <MenuItem value={LeaveType.UNPAID}>Sans solde</MenuItem>
                                        <MenuItem value={LeaveType.SPECIAL}>Spécial</MenuItem>
                                        <MenuItem value={LeaveType.OTHER}>Autre</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Agrégation</InputLabel>
                                    <Select
                                        value={selectedAggregation}
                                        onChange={(e) => setSelectedAggregation(e.target.value as 'daily' | 'weekly' | 'monthly')}
                                        label="Agrégation"
                                    >
                                        <MenuItem value="daily">Quotidienne</MenuItem>
                                        <MenuItem value="weekly">Hebdomadaire</MenuItem>
                                        <MenuItem value="monthly">Mensuelle</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleResetFilters}
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleApplyFilters}
                                        disabled={isLoading}
                                    >
                                        Appliquer
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Onglets du tableau de bord */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={selectedTab}
                        onChange={handleTabChange}
                        aria-label="Onglets du tableau de bord"
                    >
                        <Tab label="Vue d'ensemble" />
                        <Tab label="Tendances" />
                        <Tab label="Disponibilité d'équipe" />
                        <Tab label="Alertes" />
                    </Tabs>
                </Box>

                {/* Contenu des onglets */}
                <Box sx={{ mt: 2 }}>
                    {/* Vue d'ensemble */}
                    {selectedTab === 0 && (
                        <Grid container spacing={3}>
                            {/* Statistiques globales */}
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Statistiques globales</Typography>

                                        {isLoadingStats ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                                <Typography>Chargement des statistiques...</Typography>
                                            </Box>
                                        ) : statsError ? (
                                            <Alert severity="error">{statsError}</Alert>
                                        ) : !statistics ? (
                                            <Typography color="textSecondary">Aucune donnée disponible</Typography>
                                        ) : (
                                            <Box>
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="textSecondary">Nombre total de congés</Typography>
                                                    <Typography variant="h4">{statistics.totalCount}</Typography>
                                                </Box>

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="textSecondary">Jours totaux</Typography>
                                                    <Typography variant="h4">{statistics.totalDays}</Typography>
                                                </Box>

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="textSecondary">Durée moyenne</Typography>
                                                    <Typography variant="h4">{statistics.averageDuration.toFixed(1)} jours</Typography>
                                                </Box>

                                                <Divider sx={{ my: 2 }} />

                                                <Typography variant="subtitle2" gutterBottom>Par statut:</Typography>
                                                {Object.entries(statistics.byStatus).map(([status, count]) => (
                                                    <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography>{status}</Typography>
                                                        <Typography>{count}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Tendances des congés (aperçu) */}
                            <Grid item xs={12} md={8}>
                                <LeaveTrendsChart
                                    data={trends || []}
                                    isLoading={isLoadingTrends}
                                    error={trendsError || undefined}
                                    aggregation={selectedAggregation}
                                    title="Tendances des congés"
                                />
                            </Grid>

                            {/* Disponibilité d'équipe (aperçu) */}
                            <Grid item xs={12}>
                                <TeamAvailabilityChart
                                    data={teamAvailability || []}
                                    isLoading={isLoadingAvailability}
                                    error={availabilityError || undefined}
                                    departmentName={
                                        selectedDepartment
                                            ? departments.find(d => d.id === selectedDepartment)?.name
                                            : undefined
                                    }
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* Tendances */}
                    {selectedTab === 1 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <LeaveTrendsChart
                                    data={trends || []}
                                    isLoading={isLoadingTrends}
                                    error={trendsError || undefined}
                                    aggregation={selectedAggregation}
                                    title={`Tendances des congés (${selectedAggregation === 'daily'
                                            ? 'Quotidien'
                                            : selectedAggregation === 'weekly'
                                                ? 'Hebdomadaire'
                                                : 'Mensuel'
                                        })`}
                                />
                            </Grid>

                            {/* Détails par type de congé */}
                            {!isLoadingStats && statistics && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Répartition par type de congé</Typography>

                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                {Object.entries(statistics.byType).map(([type, count]) => (
                                                    <Grid item xs={6} sm={4} md={3} key={type}>
                                                        <Box
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: 1,
                                                                bgcolor: 'background.paper',
                                                                border: 1,
                                                                borderColor: 'divider',
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            <Typography variant="h5">{count}</Typography>
                                                            <Typography variant="body2" color="textSecondary">{type}</Typography>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {/* Disponibilité d'équipe */}
                    {selectedTab === 2 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TeamAvailabilityChart
                                    data={teamAvailability || []}
                                    isLoading={isLoadingAvailability}
                                    error={availabilityError || undefined}
                                    departmentName={
                                        selectedDepartment
                                            ? departments.find(d => d.id === selectedDepartment)?.name
                                            : "Tous les départements"
                                    }
                                />
                            </Grid>

                            {/* Information sur l'impact */}
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body1">
                                        Ces visualisations vous aident à planifier les ressources en anticipant les périodes de faible disponibilité.
                                        Utilisez ces données pour répartir les congés de manière optimale et maintenir les niveaux de service.
                                    </Typography>
                                </Alert>
                            </Grid>
                        </Grid>
                    )}

                    {/* Alertes */}
                    {selectedTab === 3 && (
                        <Grid container spacing={3}>
                            {/* Alertes de périodes critiques */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Périodes de pointe détectées
                                        </Typography>

                                        {isLoadingPeaks ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                                <Typography>Chargement des alertes...</Typography>
                                            </Box>
                                        ) : peaksError ? (
                                            <Alert severity="error">{peaksError}</Alert>
                                        ) : !peakPeriods || peakPeriods.length === 0 ? (
                                            <Alert severity="success">
                                                Aucune période critique détectée dans l'intervalle de temps sélectionné.
                                            </Alert>
                                        ) : (
                                            <Box>
                                                {peakPeriods.map((period, index) => (
                                                    <Paper
                                                        key={index}
                                                        sx={{
                                                            p: 2,
                                                            mb: 2,
                                                            border: '1px solid',
                                                            borderColor:
                                                                period.impactScore > 7
                                                                    ? 'error.main'
                                                                    : period.impactScore > 5
                                                                        ? 'warning.main'
                                                                        : 'info.main',
                                                            bgcolor:
                                                                period.impactScore > 7
                                                                    ? 'error.light'
                                                                    : period.impactScore > 5
                                                                        ? 'warning.light'
                                                                        : 'info.light',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <WarningIcon color="error" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                Alerte de congestion:
                                                                {period.impactScore > 7
                                                                    ? ' Critique'
                                                                    : period.impactScore > 5
                                                                        ? ' Importante'
                                                                        : ' Modérée'}
                                                            </Typography>
                                                        </Box>

                                                        <Typography variant="body1">
                                                            <strong>Période:</strong> {format(parseISO(period.startDate), 'dd/MM/yyyy', { locale: fr })}
                                                            {' '}&mdash;{' '}
                                                            {format(parseISO(period.endDate), 'dd/MM/yyyy', { locale: fr })}
                                                        </Typography>

                                                        <Typography variant="body1">
                                                            <strong>Nombre de congés:</strong> {period.count}
                                                        </Typography>

                                                        <Typography variant="body1">
                                                            <strong>Score d'impact:</strong> {period.impactScore}/10
                                                        </Typography>

                                                        <Typography variant="body1">
                                                            <strong>Départements affectés:</strong> {' '}
                                                            {period.affectedDepartments.map(dept => dept.name).join(', ')}
                                                        </Typography>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Box>

            {/* Dialogue d'exportation */}
            <Dialog
                open={showExportDialog}
                onClose={() => setShowExportDialog(false)}
            >
                <DialogTitle>Exporter le rapport</DialogTitle>
                <DialogContent>
                    <Box sx={{ width: 400, mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Format</InputLabel>
                            <Select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'excel')}
                                label="Format"
                            >
                                {exportFormats.map(format => (
                                    <MenuItem key={format.value} value={format.value}>
                                        {format.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Envoyer par email (optionnel)"
                            value={emailRecipient}
                            onChange={(e) => setEmailRecipient(e.target.value)}
                            placeholder="exemple@hopital.fr"
                            variant="outlined"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExportDialog(false)}>Annuler</Button>
                    <Button
                        variant="contained"
                        onClick={handleExportConfirm}
                        startIcon={emailRecipient ? <SendIcon /> : <DownloadIcon />}
                    >
                        {emailRecipient ? 'Exporter et envoyer' : 'Exporter'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AnalyticalDashboard; 