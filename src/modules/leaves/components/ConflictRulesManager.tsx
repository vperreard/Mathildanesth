'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Typography,
    FormControlLabel,
    Switch,
    TextField,
    Button,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Chip,
    Alert,
    Snackbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import InfoIcon from '@mui/icons-material/Info';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import { useConflictRules } from '../hooks/useConflictRules';
import { ConflictRules, ConflictType, ConflictSeverity } from '../types/conflict';

/**
 * Composant de gestion des règles de détection de conflits de congés
 * Permet aux administrateurs de configurer, activer/désactiver et personnaliser les règles
 */
const ConflictRulesManager: React.FC = () => {
    const {
        rules,
        loading,
        error,
        fetchRules,
        updateRule,
        updateRules,
        toggleRuleActive,
        resetToDefaults,
        validateRules
    } = useConflictRules();

    const [editedRules, setEditedRules] = useState<ConflictRules | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Synchroniser les règles éditées avec les règles récupérées
    useEffect(() => {
        if (rules) {
            setEditedRules(JSON.parse(JSON.stringify(rules)));
        }
    }, [rules]);

    // Handler pour modifier une règle simple (boolean, number, string)
    const handleRuleChange = (key: keyof ConflictRules, value: unknown) => {
        if (!editedRules) return;

        setEditedRules(prev => ({
            ...prev!,
            [key]: value
        }));
    };

    // Handler pour basculer un boolean
    const handleToggle = (key: keyof ConflictRules) => {
        if (!editedRules) return;

        const currentValue = editedRules[key];
        if (typeof currentValue === 'boolean') {
            handleRuleChange(key, !currentValue);
        }
    };

    // Handler pour modifier une valeur numérique
    const handleNumberChange = (key: keyof ConflictRules, value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        handleRuleChange(key, numValue);
    };

    // Handler pour ajouter une période spéciale
    const handleAddSpecialPeriod = () => {
        if (!editedRules || !editedRules.specialPeriods) return;

        const newPeriod = {
            id: `sp-${Date.now()}`,
            name: 'Nouvelle période',
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            restrictionLevel: 'LOW' as 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
        };

        setEditedRules(prev => ({
            ...prev!,
            specialPeriods: [...prev!.specialPeriods!, newPeriod]
        }));
    };

    // Handler pour supprimer une période spéciale
    const handleDeleteSpecialPeriod = (id: string) => {
        if (!editedRules || !editedRules.specialPeriods) return;

        setEditedRules(prev => ({
            ...prev!,
            specialPeriods: prev!.specialPeriods!.filter(period => period.id !== id)
        }));
    };

    // Handler pour modifier une période spéciale
    const handleSpecialPeriodChange = (id: string, field: string, value: unknown) => {
        if (!editedRules || !editedRules.specialPeriods) return;

        setEditedRules(prev => ({
            ...prev!,
            specialPeriods: prev!.specialPeriods!.map(period =>
                period.id === id ? { ...period, [field]: value } : period
            )
        }));
    };

    // Handler pour ajouter une période de haute charge
    const handleAddHighWorkloadPeriod = () => {
        if (!editedRules) {
            return;
        }

        const newPeriod = {
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            description: 'Nouvelle période de haute charge'
        };

        setEditedRules(prev => ({
            ...prev!,
            highWorkloadPeriods: prev?.highWorkloadPeriods ? [...prev.highWorkloadPeriods, newPeriod] : [newPeriod]
        }));
    };

    // Handler pour supprimer une période de haute charge
    const handleDeleteHighWorkloadPeriod = (index: number) => {
        if (!editedRules || !editedRules.highWorkloadPeriods) return;

        setEditedRules(prev => ({
            ...prev!,
            highWorkloadPeriods: prev!.highWorkloadPeriods!.filter((_, i) => i !== index)
        }));
    };

    // Handler pour modifier une période de haute charge
    const handleHighWorkloadPeriodChange = (index: number, field: string, value: unknown) => {
        if (!editedRules || !editedRules.highWorkloadPeriods) return;

        setEditedRules(prev => ({
            ...prev!,
            highWorkloadPeriods: prev!.highWorkloadPeriods!.map((period, i) =>
                i === index ? { ...period, [field]: value } : period
            )
        }));
    };

    // Handler pour sauvegarder les modifications
    const handleSave = async () => {
        if (!editedRules) return;

        setSaving(true);
        const validation = validateRules(editedRules);

        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            setSaving(false);
            return;
        }

        try {
            await updateRules(editedRules);
            setSaveSuccess(true);
            setEditMode(false);
            setValidationErrors([]);
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde des règles:', error instanceof Error ? error : new Error(String(error)));
            if (error instanceof Error) {
                setValidationErrors([error.message]);
            }
        } finally {
            setSaving(false);
        }
    };

    // Handler pour réinitialiser les règles
    const handleReset = async () => {
        setResetDialogOpen(false);
        setSaving(true);

        try {
            await resetToDefaults();
            setSaveSuccess(true);
            setEditMode(false);
            setValidationErrors([]);
        } catch (error: unknown) {
            logger.error('Erreur lors de la réinitialisation des règles:', error instanceof Error ? error : new Error(String(error)));
            if (error instanceof Error) {
                setValidationErrors([error.message]);
            }
        } finally {
            setSaving(false);
        }
    };

    // Si les règles n'ont pas encore été chargées
    if (loading && !editedRules) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
            </Box>
        );
    }

    // Si une erreur s'est produite
    if (error && !editedRules) {
        return (
            <Alert severity="error">
                Une erreur s'est produite lors du chargement des règles de conflit: {error.message}
            </Alert>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box>
                <Card>
                    <CardHeader
                        title="Gestion des règles de détection de conflits"
                        action={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {editMode ? (
                                    <>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<SaveIcon />}
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            Enregistrer
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditedRules(rules ? JSON.parse(JSON.stringify(rules)) : null);
                                            }}
                                            disabled={saving}
                                        >
                                            Annuler
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditMode(true)}
                                        >
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={<RestoreIcon />}
                                            onClick={() => setResetDialogOpen(true)}
                                        >
                                            Réinitialiser
                                        </Button>
                                    </>
                                )}
                            </Box>
                        }
                    />
                    <Divider />
                    <CardContent>
                        {validationErrors.length > 0 && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Des erreurs de validation ont été détectées:</Typography>
                                <ul>
                                    {validationErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}

                        {editedRules && (
                            <>
                                {/* Section des règles relatives à l'équipe */}
                                <Accordion defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6">Règles liées à l'équipe</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Pourcentage maximum d'absences dans l'équipe"
                                                    type="number"
                                                    value={editedRules.maxTeamAbsencePercentage ?? ''}
                                                    onChange={(e) => handleNumberChange('maxTeamAbsencePercentage', e.target.value)}
                                                    InputProps={{
                                                        endAdornment: '%',
                                                        readOnly: !editMode
                                                    }}
                                                    fullWidth
                                                    margin="normal"
                                                    helperText="Pourcentage maximum de membres d'une équipe pouvant être absents simultanément"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={!!editedRules.criticalRolesRequireBackup}
                                                            onChange={() => handleToggle('criticalRolesRequireBackup')}
                                                            disabled={!editMode}
                                                        />
                                                    }
                                                    label="Exiger un remplaçant pour les rôles critiques"
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Section des règles liées au planning */}
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6">Règles liées au planning</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Nombre minimum de jours avant une deadline"
                                                    type="number"
                                                    value={editedRules.minDaysBeforeDeadline ?? ''}
                                                    onChange={(e) => handleNumberChange('minDaysBeforeDeadline', e.target.value)}
                                                    InputProps={{ readOnly: !editMode }}
                                                    fullWidth
                                                    margin="normal"
                                                    helperText="Nombre minimum de jours entre un congé et une deadline importante"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Nombre minimum de jours entre deux congés"
                                                    type="number"
                                                    value={editedRules.minDaysBetweenLeaves ?? ''}
                                                    onChange={(e) => handleNumberChange('minDaysBetweenLeaves', e.target.value)}
                                                    InputProps={{ readOnly: !editMode }}
                                                    fullWidth
                                                    margin="normal"
                                                    helperText="Nombre minimum de jours entre deux périodes de congés"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={!!editedRules.blockHolidayBridging}
                                                            onChange={() => handleToggle('blockHolidayBridging')}
                                                            disabled={!editMode}
                                                        />
                                                    }
                                                    label="Bloquer les ponts autour des jours fériés"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={!!editedRules.allowLeavesDuringDuty}
                                                            onChange={() => handleToggle('allowLeavesDuringDuty')}
                                                            disabled={!editMode}
                                                        />
                                                    }
                                                    label="Autoriser les congés pendant les gardes"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={!!editedRules.allowLeavesDuringOnCall}
                                                            onChange={() => handleToggle('allowLeavesDuringOnCall')}
                                                            disabled={!editMode}
                                                        />
                                                    }
                                                    label="Autoriser les congés pendant les astreintes"
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Section des périodes spéciales */}
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6">Périodes spéciales</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={!!editedRules.blockHighWorkloadPeriods}
                                                            onChange={() => handleToggle('blockHighWorkloadPeriods')}
                                                            disabled={!editMode}
                                                        />
                                                    }
                                                    label="Bloquer les congés pendant les périodes de haute charge"
                                                />
                                            </Grid>

                                            {/* Périodes de haute charge */}
                                            <Grid item xs={12}>
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        Périodes de haute charge
                                                    </Typography>

                                                    {editMode && (
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={handleAddHighWorkloadPeriod}
                                                            sx={{ mb: 2 }}
                                                        >
                                                            Ajouter une période
                                                        </Button>
                                                    )}

                                                    {editedRules.highWorkloadPeriods?.map((period, index) => (
                                                        <Card key={index} sx={{ mb: 2 }}>
                                                            <CardContent>
                                                                <Grid container spacing={2}>
                                                                    <Grid item xs={12} md={4}>
                                                                        <DatePicker
                                                                            label="Date de début"
                                                                            value={new Date(period.startDate)}
                                                                            onChange={(date) => date && handleHighWorkloadPeriodChange(
                                                                                index,
                                                                                'startDate',
                                                                                date.toISOString()
                                                                            )}
                                                                            readOnly={!editMode}
                                                                            slotProps={{ textField: { fullWidth: true } }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={4}>
                                                                        <DatePicker
                                                                            label="Date de fin"
                                                                            value={new Date(period.endDate)}
                                                                            onChange={(date) => date && handleHighWorkloadPeriodChange(
                                                                                index,
                                                                                'endDate',
                                                                                date.toISOString()
                                                                            )}
                                                                            readOnly={!editMode}
                                                                            slotProps={{ textField: { fullWidth: true } }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={3}>
                                                                        <TextField
                                                                            label="Description"
                                                                            value={period.description}
                                                                            onChange={(e) => handleHighWorkloadPeriodChange(
                                                                                index,
                                                                                'description',
                                                                                e.target.value
                                                                            )}
                                                                            InputProps={{ readOnly: !editMode }}
                                                                            fullWidth
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={1}>
                                                                        {editMode && (
                                                                            <IconButton
                                                                                color="error"
                                                                                onClick={() => handleDeleteHighWorkloadPeriod(index)}
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        )}
                                                                    </Grid>
                                                                </Grid>
                                                            </CardContent>
                                                        </Card>
                                                    ))}

                                                    {(!editedRules.highWorkloadPeriods || editedRules.highWorkloadPeriods.length === 0) && (
                                                        <Alert severity="info">
                                                            Aucune période de haute charge définie
                                                        </Alert>
                                                    )}
                                                </Box>
                                            </Grid>

                                            {/* Périodes spéciales */}
                                            <Grid item xs={12}>
                                                <Box>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        Périodes spéciales (ex: vacances scolaires)
                                                    </Typography>

                                                    {editMode && (
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={handleAddSpecialPeriod}
                                                            sx={{ mb: 2 }}
                                                        >
                                                            Ajouter une période spéciale
                                                        </Button>
                                                    )}

                                                    {editedRules.specialPeriods?.map((period) => (
                                                        <Card key={period.id} sx={{ mb: 2 }}>
                                                            <CardContent>
                                                                <Grid container spacing={2}>
                                                                    <Grid item xs={12} md={3}>
                                                                        <TextField
                                                                            label="Nom"
                                                                            value={period.name}
                                                                            onChange={(e) => handleSpecialPeriodChange(
                                                                                period.id,
                                                                                'name',
                                                                                e.target.value
                                                                            )}
                                                                            InputProps={{ readOnly: !editMode }}
                                                                            fullWidth
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={3}>
                                                                        <DatePicker
                                                                            label="Date de début"
                                                                            value={new Date(period.startDate)}
                                                                            onChange={(date) => date && handleSpecialPeriodChange(
                                                                                period.id,
                                                                                'startDate',
                                                                                date.toISOString()
                                                                            )}
                                                                            readOnly={!editMode}
                                                                            slotProps={{ textField: { fullWidth: true } }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={3}>
                                                                        <DatePicker
                                                                            label="Date de fin"
                                                                            value={new Date(period.endDate)}
                                                                            onChange={(date) => date && handleSpecialPeriodChange(
                                                                                period.id,
                                                                                'endDate',
                                                                                date.toISOString()
                                                                            )}
                                                                            readOnly={!editMode}
                                                                            slotProps={{ textField: { fullWidth: true } }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={2}>
                                                                        <TextField
                                                                            select
                                                                            SelectProps={{ native: true }}
                                                                            label="Niveau restriction"
                                                                            value={period.restrictionLevel}
                                                                            onChange={(e) => handleSpecialPeriodChange(
                                                                                period.id,
                                                                                'restrictionLevel',
                                                                                e.target.value
                                                                            )}
                                                                            InputProps={{ readOnly: !editMode }}
                                                                            fullWidth
                                                                        >
                                                                            <option value="NONE">Aucune</option>
                                                                            <option value="LOW">Faible</option>
                                                                            <option value="MEDIUM">Moyenne</option>
                                                                            <option value="HIGH">Haute</option>
                                                                        </TextField>
                                                                    </Grid>
                                                                    <Grid item xs={12} md={1}>
                                                                        {editMode && (
                                                                            <IconButton
                                                                                color="error"
                                                                                onClick={() => handleDeleteSpecialPeriod(period.id)}
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        )}
                                                                    </Grid>
                                                                </Grid>
                                                            </CardContent>
                                                        </Card>
                                                    ))}

                                                    {(!editedRules.specialPeriods || editedRules.specialPeriods.length === 0) && (
                                                        <Alert severity="info">
                                                            Aucune période spéciale définie
                                                        </Alert>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogues et notifications */}
                <Dialog
                    open={resetDialogOpen}
                    onClose={() => setResetDialogOpen(false)}
                >
                    <DialogTitle>Réinitialiser les règles?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Cette action va réinitialiser toutes les règles à leurs valeurs par défaut.
                            Cette opération ne peut pas être annulée.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResetDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleReset} color="error" autoFocus>
                            Réinitialiser
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={saveSuccess}
                    autoHideDuration={5000}
                    onClose={() => setSaveSuccess(false)}
                >
                    <Alert onClose={() => setSaveSuccess(false)} severity="success">
                        Les règles ont été enregistrées avec succès.
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ConflictRulesManager; 