import React, { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box,
    Typography,
    Divider,
    IconButton,
    Alert,
    Switch,
    FormControlLabel,
    Chip,
    Stack
} from '@mui/material';
import {
    Trash as DeleteIcon,
    Plus,
    Clock as ClockIcon,
    Save as SaveIcon
} from 'lucide-react';
import {
    ConfigurationVariation,
    VariationConfigPanelProps,
    DayOfWeek,
    PeriodeVariation
} from '../types/template';
import AssignmentConfigPanel from './AssignmentConfigPanel';

// Mapping des jours de la semaine pour l'affichage
const DAYS_LABEL: Record<DayOfWeek, string> = {
    'LUNDI': 'Lundi',
    'MARDI': 'Mardi',
    'MERCREDI': 'Mercredi',
    'JEUDI': 'Jeudi',
    'VENDREDI': 'Vendredi',
    'SAMEDI': 'Samedi',
    'DIMANCHE': 'Dimanche'
};

// Mapping des types de période pour l'affichage
const PERIOD_LABEL: Record<PeriodeVariation, string> = {
    'STANDARD': 'Standard',
    'VACANCES': 'Vacances scolaires',
    'HIVER': 'Période hivernale',
    'ETE': 'Période estivale',
    'JOURS_FERIES': 'Jours fériés',
    'PERSONNALISEE': 'Période personnalisée'
};

/**
 * Composant pour configurer une variation d'affectation
 */
const VariationConfigPanel: React.FC<VariationConfigPanelProps> = ({
    variation,
    onChange,
    onDelete,
    availablePostes,
    isLoading = false
}) => {
    // State local pour la variation en cours d'édition
    const [variationData, setVariationData] = useState<ConfigurationVariation>(variation);

    // State pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Gestion des changements de la variation
    const handleChange = (field: keyof ConfigurationVariation, value: any) => {
        setVariationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Gestion des changements dans la configuration
    const handleConfigChange = (field: string, value: any) => {
        setVariationData(prev => ({
            ...prev,
            configuration: {
                ...prev.configuration,
                [field]: value
            }
        }));
    };

    // Ajouter ou retirer un jour spécifique
    const handleToggleJour = (jour: DayOfWeek) => {
        const joursSpecifiques = variationData.joursSpecifiques || [];
        const newJours = joursSpecifiques.includes(jour)
            ? joursSpecifiques.filter(j => j !== jour)
            : [...joursSpecifiques, jour];

        handleChange('joursSpecifiques', newJours);
    };

    // Valider la configuration avant de soumettre
    const validateConfiguration = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!variationData.nom) {
            newErrors.nom = 'Le nom de la variation est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumettre la configuration
    const handleSubmit = () => {
        if (!validateConfiguration()) return;
        onChange(variationData);
    };

    return (
        <Card variant="outlined">
            <CardHeader
                title="Configuration de la variation"
                subheader="Définissez les paramètres spécifiques à cette période"
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon size={16} />}
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            size="small"
                        >
                            Enregistrer
                        </Button>
                        <IconButton
                            color="error"
                            onClick={onDelete}
                            disabled={isLoading}
                            aria-label="Supprimer la variation"
                        >
                            <DeleteIcon size={20} />
                        </IconButton>
                    </Box>
                }
            />
            <Divider />
            <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '2 1 66%' } }}>
                        <TextField
                            fullWidth
                            label="Nom de la variation"
                            value={variationData.nom}
                            onChange={(e) => handleChange('nom', e.target.value)}
                            error={!!errors.nom}
                            helperText={errors.nom || "Ex: Configuration été, période de fêtes..."}
                            required
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33%' } }}>
                        <FormControl fullWidth>
                            <InputLabel>Type de période</InputLabel>
                            <Select
                                value={variationData.typeVariation || 'PERSONNALISEE'}
                                label="Type de période"
                                onChange={(e) => handleChange('typeVariation', e.target.value)}
                            >
                                {Object.entries(PERIOD_LABEL).map(([type, label]) => (
                                    <MenuItem key={type} value={type}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Période d'application
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33%' } }}>
                            <TextField
                                fullWidth
                                label="Date de début"
                                type="date"
                                value={variationData.dateDebut || ''}
                                onChange={(e) => handleChange('dateDebut', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33%' } }}>
                            <TextField
                                fullWidth
                                label="Date de fin"
                                type="date"
                                value={variationData.dateFin || ''}
                                onChange={(e) => handleChange('dateFin', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33%' } }}>
                            <TextField
                                fullWidth
                                label="Priorité"
                                type="number"
                                value={variationData.priorite}
                                onChange={(e) => handleChange('priorite', parseInt(e.target.value, 10) || 0)}
                                helperText="Ordre de priorité (plus élevé = plus prioritaire)"
                                inputProps={{ min: 0 }}
                            />
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Jours d'application
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(DAYS_LABEL).map(([day, label]) => (
                            <Chip
                                key={day}
                                label={label}
                                onClick={() => handleToggleJour(day as DayOfWeek)}
                                color={variationData.joursSpecifiques?.includes(day as DayOfWeek) ? "primary" : "default"}
                                variant={variationData.joursSpecifiques?.includes(day as DayOfWeek) ? "filled" : "outlined"}
                            />
                        ))}
                    </Stack>
                    <FormHelperText>
                        Sélectionnez les jours auxquels s'applique cette variation. Si aucun jour n'est sélectionné, la variation s'applique à tous les jours durant la période.
                    </FormHelperText>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={variationData.estRecurrent || false}
                                onChange={(e) => handleChange('estRecurrent', e.target.checked)}
                            />
                        }
                        label="Récurrent (se répète chaque année)"
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={variationData.actif !== false}
                                onChange={(e) => handleChange('actif', e.target.checked)}
                            />
                        }
                        label="Variation active"
                    />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Raison de la variation
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={variationData.raisonVariation || ''}
                        onChange={(e) => handleChange('raisonVariation', e.target.value)}
                        placeholder="Expliquez pourquoi cette variation est nécessaire (ex: effectif réduit, forte demande...)"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Configuration spécifique
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        La configuration spécifique de cette variation remplacera la configuration standard de l'affectation pendant la période définie.
                    </Alert>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                            <TextField
                                fullWidth
                                label="Nom de la configuration"
                                value={variationData.configuration?.nom || ''}
                                onChange={(e) => handleConfigChange('nom', e.target.value)}
                                placeholder="Ex: Configuration spéciale été"
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                            <TextField
                                label="Heure de début"
                                type="time"
                                fullWidth
                                value={variationData.configuration?.heureDebut || ''}
                                onChange={(e) => handleConfigChange('heureDebut', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                            <TextField
                                label="Heure de fin"
                                type="time"
                                fullWidth
                                value={variationData.configuration?.heureFin || ''}
                                onChange={(e) => handleConfigChange('heureFin', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon size={16} />}
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        Enregistrer la variation
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default VariationConfigPanel; 