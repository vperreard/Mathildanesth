import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button,
    Grid,
    Box,
    Tabs,
    Tab,
    Typography,
    Divider,
    IconButton,
    FormControlLabel,
    Switch,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import {
    PlanningTemplate,
    TemplateAffectation,
    AffectationType,
    DayOfWeek,
    BlocPlanningTemplateEditorProps,
    ConfigurationVariation,
    PeriodeVariation
} from '../types/template';
import AssignmentConfigPanel from './AssignmentConfigPanel';
import VariationConfigPanel from './VariationConfigPanel';
import { templateService } from '../services/templateService';
import {
    Save as SaveIcon,
    Plus as PlusIcon,
    X as DeleteIcon,
    Edit as EditIcon,
    MoreHorizontal as MoreIcon,
    Calendar as CalendarIcon,
    ChevronDown as ExpandIcon,
    FileUp as ExportIcon
} from 'lucide-react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

// Type d'élément pour le drag and drop
const AFFECTATION_TYPE = 'affectation';

/**
 * Composant d'élément déplaçable pour une affectation
 */
interface DraggableAffectationProps {
    affectation: TemplateAffectation;
    onToggle: (id: string, isOpen: boolean) => void;
    onPostesChange: (id: string, count: number) => void;
    onEdit: (affectation: TemplateAffectation) => void;
    onDelete: (id: string) => void;
    onAddVariation: (affectationId: string) => void;
    variations: ConfigurationVariation[];
    index: number;
    moveAffectation: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableAffectation: React.FC<DraggableAffectationProps> = ({
    affectation,
    onToggle,
    onPostesChange,
    onEdit,
    onDelete,
    onAddVariation,
    variations,
    index,
    moveAffectation
}) => {
    // Configuration du drag and drop
    const [{ isDragging }, dragRef] = useDrag({
        type: AFFECTATION_TYPE,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    const [, dropRef] = useDrop({
        accept: AFFECTATION_TYPE,
        hover: (item: { index: number }) => {
            if (item.index !== index) {
                moveAffectation(item.index, index);
                item.index = index;
            }
        }
    });

    // Combine drag and drop refs
    const ref = (node: HTMLDivElement | null) => {
        dragRef(node);
        dropRef(node);
    };

    // Filtrer les variations pour cette affectation
    const affectationVariations = variations.filter(v => v.affectationId === affectation.id);

    return (
        <div
            ref={ref}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                marginBottom: '8px'
            }}
        >
            <Card variant="outlined" sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {affectation.type}
                            {affectation.configuration?.nom && ` - ${affectation.configuration.nom}`}
                        </Typography>
                        {affectationVariations.length > 0 && (
                            <Chip
                                size="small"
                                label={`${affectationVariations.length} variation(s)`}
                                color="secondary"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>
                    <Box>
                        <Tooltip title="Ajouter une variation">
                            <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => onAddVariation(affectation.id)}
                                sx={{ mr: 1 }}
                            >
                                <CalendarIcon size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Éditer la configuration">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onEdit(affectation)}
                                sx={{ mr: 1 }}
                            >
                                <EditIcon size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(affectation.id)}
                            >
                                <DeleteIcon size={16} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={affectation.ouvert}
                                onChange={(e) => onToggle(affectation.id, e.target.checked)}
                                size="small"
                            />
                        }
                        label={affectation.ouvert ? "Ouvert" : "Fermé"}
                    />
                    {affectation.ouvert && (
                        <TextField
                            label="Postes"
                            type="number"
                            size="small"
                            value={affectation.postesRequis}
                            onChange={(e) => onPostesChange(affectation.id, parseInt(e.target.value, 10) || 0)}
                            inputProps={{ min: 0, style: { width: '60px' } }}
                            sx={{ ml: 2 }}
                        />
                    )}
                </Box>
                {affectation.configuration && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {affectation.configuration.postes.length} poste(s) configuré(s)
                            {affectation.configuration.heureDebut && affectation.configuration.heureFin &&
                                ` • ${affectation.configuration.heureDebut} - ${affectation.configuration.heureFin}`}
                        </Typography>
                    </Box>
                )}

                {/* Afficher la liste des variations pour cette affectation */}
                {affectationVariations.length > 0 && (
                    <Accordion sx={{ mt: 1, boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary
                            expandIcon={<ExpandIcon size={16} />}
                            sx={{ p: 0, m: 0, minHeight: 'auto' }}
                        >
                            <Typography variant="caption" color="primary">
                                Voir les variations
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pt: 1 }}>
                            {affectationVariations.map((variation) => (
                                <Chip
                                    key={variation.id}
                                    label={variation.nom}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mr: 1, mb: 1 }}
                                />
                            ))}
                        </AccordionDetails>
                    </Accordion>
                )}
            </Card>
        </div>
    );
};

// Ajout d'un composant de résumé des affectations
const TemplateAffectationsSummary = ({ template }: { template: PlanningTemplate }) => {
    const days = Object.keys(DAYS_LABEL) as DayOfWeek[];
    const types = Array.from(new Set(template.affectations.map(a => a.type)));

    const countVariationsForDay = (day: DayOfWeek) => {
        const affectationIdsForDay = template.affectations
            .filter(a => a.jour === day)
            .map(a => a.id);

        return template.variations
            ? template.variations.filter(v =>
                affectationIdsForDay.includes(v.affectationId)).length
            : 0;
    };

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Jour</TableCell>
                        {types.map(type => (
                            <TableCell key={type} align="center" sx={{ fontWeight: 'bold' }}>
                                {type}
                            </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Variations</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {days.map((day) => (
                        <TableRow key={day}>
                            <TableCell component="th" scope="row">
                                {DAYS_LABEL[day]}
                            </TableCell>
                            {types.map(type => {
                                const affectation = template.affectations.find(
                                    a => a.jour === day && a.type === type
                                );
                                return (
                                    <TableCell key={`${day}_${type}`} align="center">
                                        {affectation ? (
                                            <Chip
                                                label={affectation.ouvert ? `${affectation.postesRequis} poste(s)` : 'Fermé'}
                                                color={affectation.ouvert ? "success" : "default"}
                                                size="small"
                                            />
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                );
                            })}
                            <TableCell align="center">
                                {countVariationsForDay(day) > 0 ? (
                                    <Chip
                                        label={countVariationsForDay(day)}
                                        color="secondary"
                                        size="small"
                                    />
                                ) : "—"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

/**
 * Composant d'éditeur principal pour les trames de planning
 */
const BlocPlanningTemplateEditor: React.FC<BlocPlanningTemplateEditorProps> = ({
    initialTemplate,
    onSave,
    availableAffectationTypes,
    isLoading = false,
    availablePostes = [],
    readOnly = false
}) => {
    // État pour la trame en cours d'édition
    const [template, setTemplate] = useState<PlanningTemplate>(
        initialTemplate || {
            id: `temp_${Date.now()}`,
            nom: 'Nouvelle trame',
            affectations: [],
            variations: []
        }
    );

    // État pour le jour sélectionné dans les onglets
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>('LUNDI');

    // État pour la nouvelle affectation à ajouter
    const [newAffectationType, setNewAffectationType] = useState<AffectationType | ''>('');

    // États pour les dialogues
    const [configPanelOpen, setConfigPanelOpen] = useState(false);
    const [selectedAffectation, setSelectedAffectation] = useState<TemplateAffectation | null>(null);

    const [variationPanelOpen, setVariationPanelOpen] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState<ConfigurationVariation | null>(null);
    const [selectedAffectationId, setSelectedAffectationId] = useState<string | null>(null);

    // État pour les variations
    const [activeTab, setActiveTab] = useState<'affectations' | 'variations'>('affectations');

    // État pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filtrer les affectations pour le jour sélectionné
    const filteredAffectations = template.affectations
        .filter(a => a.jour === selectedDay)
        .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    // Ajouter une nouvelle affectation
    const handleAddAffectation = () => {
        if (!newAffectationType) {
            setErrors({ ...errors, newAffectation: 'Veuillez sélectionner un type d\'affectation' });
            return;
        }

        // Vérifier si ce type d'affectation existe déjà pour ce jour
        const exists = template.affectations.some(
            a => a.jour === selectedDay && a.type === newAffectationType
        );

        if (exists) {
            setErrors({ ...errors, newAffectation: 'Ce type d\'affectation existe déjà pour ce jour' });
            return;
        }

        const newAffectation: TemplateAffectation = {
            id: `affect_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            jour: selectedDay,
            type: newAffectationType,
            ouvert: true,
            postesRequis: 1,
            ordre: filteredAffectations.length
        };

        setTemplate(prev => ({
            ...prev,
            affectations: [...prev.affectations, newAffectation]
        }));

        // Réinitialiser le formulaire
        setNewAffectationType('');
        setErrors({ ...errors, newAffectation: '' });
    };

    // Supprimer une affectation
    const handleDeleteAffectation = (id: string) => {
        setTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.filter(a => a.id !== id),
            // Supprimer aussi toutes les variations associées
            variations: prev.variations?.filter(v => v.affectationId !== id) || []
        }));
    };

    // Activer/désactiver une affectation
    const handleToggleAffectation = (id: string, isOpen: boolean) => {
        setTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.map(a =>
                a.id === id
                    ? { ...a, ouvert: isOpen, postesRequis: isOpen ? a.postesRequis || 1 : 0 }
                    : a
            )
        }));
    };

    // Modifier le nombre de postes
    const handlePostesChange = (id: string, count: number) => {
        setTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.map(a =>
                a.id === id ? { ...a, postesRequis: count } : a
            )
        }));
    };

    // Déplacer une affectation (drag and drop)
    const moveAffectation = useCallback((dragIndex: number, hoverIndex: number) => {
        const draggedAffectations = [...filteredAffectations];
        const draggedItem = draggedAffectations[dragIndex];

        // Réorganiser le tableau
        draggedAffectations.splice(dragIndex, 1);
        draggedAffectations.splice(hoverIndex, 0, draggedItem);

        // Mettre à jour les ordres
        const updatedAffectations = draggedAffectations.map((a, index) => ({
            ...a,
            ordre: index
        }));

        // Mettre à jour le template
        setTemplate(prev => ({
            ...prev,
            affectations: prev.affectations
                .filter(a => a.jour !== selectedDay)
                .concat(updatedAffectations)
        }));
    }, [filteredAffectations, selectedDay]);

    // Ouvrir le panel de configuration pour une affectation
    const handleEditAffectation = (affectation: TemplateAffectation) => {
        setSelectedAffectation(affectation);
        setConfigPanelOpen(true);
    };

    // Fermer le panel de configuration
    const handleCloseConfigPanel = () => {
        setConfigPanelOpen(false);
        setSelectedAffectation(null);
    };

    // Ouvrir le panel pour ajouter une variation
    const handleAddVariation = (affectationId: string) => {
        const affectation = template.affectations.find(a => a.id === affectationId);
        if (!affectation) return;

        // Créer une nouvelle variation
        const newVariation: ConfigurationVariation = {
            id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            affectationId: affectationId,
            nom: `Variation de ${affectation.type}`,
            priorite: 5,
            configuration: {
                id: `conf_var_${Date.now()}`,
                postes: affectation.configuration?.postes.map(p => ({ ...p, id: `poste_var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` })) || [],
                heureDebut: affectation.configuration?.heureDebut,
                heureFin: affectation.configuration?.heureFin
            },
            typeVariation: 'PERSONNALISEE',
            actif: true
        };

        setSelectedVariation(newVariation);
        setSelectedAffectationId(affectationId);
        setVariationPanelOpen(true);
    };

    // Ouvrir le panel pour éditer une variation existante
    const handleEditVariation = (variation: ConfigurationVariation) => {
        setSelectedVariation(variation);
        setSelectedAffectationId(variation.affectationId);
        setVariationPanelOpen(true);
    };

    // Fermer le panel de variation
    const handleCloseVariationPanel = () => {
        setVariationPanelOpen(false);
        setSelectedVariation(null);
        setSelectedAffectationId(null);
    };

    // Sauvegarder une variation
    const handleSaveVariation = (updatedVariation: ConfigurationVariation) => {
        const variations = template.variations || [];
        const variationIndex = variations.findIndex(v => v.id === updatedVariation.id);

        if (variationIndex >= 0) {
            // Mise à jour d'une variation existante
            setTemplate(prev => ({
                ...prev,
                variations: variations.map(v =>
                    v.id === updatedVariation.id ? updatedVariation : v
                )
            }));
        } else {
            // Ajout d'une nouvelle variation
            setTemplate(prev => ({
                ...prev,
                variations: [...variations, updatedVariation]
            }));
        }
    };

    // Supprimer une variation
    const handleDeleteVariation = (variationId: string) => {
        setTemplate(prev => ({
            ...prev,
            variations: prev.variations?.filter(v => v.id !== variationId) || []
        }));
        // Si c'est la variation en cours d'édition, fermer le panneau
        if (selectedVariation?.id === variationId) {
            handleCloseVariationPanel();
        }
    };

    // Mettre à jour une affectation depuis le panel de configuration
    const handleUpdateAffectation = (updatedAffectation: TemplateAffectation) => {
        setTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.map(a =>
                a.id === updatedAffectation.id ? updatedAffectation : a
            )
        }));
    };

    // Valider la trame avant sauvegarde
    const validateTemplate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!template.nom.trim()) {
            newErrors.nom = 'Le nom de la trame est requis';
        }

        // Vérifier que les affectations ouvertes ont au moins un poste requis
        const invalidAffectation = template.affectations.find(a => a.ouvert && a.postesRequis < 1);
        if (invalidAffectation) {
            newErrors.affectations = `L'affectation ${invalidAffectation.type} du ${DAYS_LABEL[invalidAffectation.jour]} doit avoir au moins un poste requis`;
        }

        // Vérifier que les variations ont un nom
        const invalidVariation = template.variations?.find(v => !v.nom.trim());
        if (invalidVariation) {
            newErrors.variations = `Toutes les variations doivent avoir un nom`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Sauvegarder la trame
    const handleSaveTemplate = async () => {
        if (!validateTemplate() || readOnly) return;

        try {
            await onSave(template);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la trame:', error);
            setErrors({ save: 'Erreur lors de la sauvegarde de la trame' });
        }
    };

    // Chargement des types d'affectations disponibles
    useEffect(() => {
        if (!availableAffectationTypes || availableAffectationTypes.length === 0) {
            const loadAffectationTypes = async () => {
                try {
                    await templateService.getAvailableAffectationTypes();
                } catch (error) {
                    console.error('Erreur lors du chargement des types d\'affectation:', error);
                }
            };

            loadAffectationTypes();
        }
    }, [availableAffectationTypes]);

    return (
        <DndProvider backend={HTML5Backend}>
            <Card>
                <CardHeader
                    title={
                        <TextField
                            fullWidth
                            label="Nom de la trame"
                            value={template.nom}
                            onChange={(e) => setTemplate({ ...template, nom: e.target.value })}
                            margin="normal"
                            disabled={readOnly || isLoading}
                            error={!!errors.nom}
                            helperText={errors.nom}
                        />
                    }
                    subheader={
                        <TextField
                            fullWidth
                            label="Description (optionnelle)"
                            value={template.description || ''}
                            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                            margin="normal"
                            multiline
                            rows={2}
                            disabled={readOnly || isLoading}
                        />
                    }
                    action={
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                            {errors.save && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {errors.save}
                                </Alert>
                            )}
                            <Tooltip title="Exporter la trame">
                                <IconButton disabled={isLoading}>
                                    <ExportIcon size={20} />
                                </IconButton>
                            </Tooltip>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveTemplate}
                                disabled={!!errors.save || isLoading || readOnly}
                            >
                                Enregistrer
                            </Button>
                        </Box>
                    }
                />
                <Divider />
                <CardContent>
                    {/* Ajout du tableau récapitulatif */}
                    {template.affectations.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Résumé de la trame
                            </Typography>
                            <TemplateAffectationsSummary template={template} />
                        </Box>
                    )}

                    {/* Onglets pour basculer entre affectations et variations */}
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{ mb: 3 }}
                    >
                        <Tab label="Affectations" value="affectations" />
                        <Tab
                            label={
                                <Badge
                                    badgeContent={template.variations?.length || 0}
                                    color="secondary"
                                    showZero={false}
                                >
                                    Variations
                                </Badge>
                            }
                            value="variations"
                        />
                    </Tabs>

                    {/* Contenu de l'onglet affectations */}
                    {activeTab === "affectations" && (
                        <>
                            {/* Onglets pour les jours de la semaine */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs
                                    value={selectedDay}
                                    onChange={(_, newValue) => setSelectedDay(newValue)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    aria-label="Jours de la semaine"
                                >
                                    {Object.entries(DAYS_LABEL).map(([day, label]) => (
                                        <Tab key={day} label={label} value={day} />
                                    ))}
                                </Tabs>
                            </Box>

                            {/* Zone d'affectations pour le jour sélectionné */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Affectations pour {DAYS_LABEL[selectedDay]}
                                </Typography>

                                {filteredAffectations.length === 0 ? (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Aucune affectation définie pour ce jour. Utilisez le formulaire ci-dessous pour en ajouter.
                                    </Alert>
                                ) : (
                                    <Box sx={{ mb: 2 }}>
                                        {filteredAffectations.map((affectation, index) => (
                                            <DraggableAffectation
                                                key={affectation.id}
                                                affectation={affectation}
                                                onToggle={handleToggleAffectation}
                                                onPostesChange={handlePostesChange}
                                                onEdit={handleEditAffectation}
                                                onDelete={handleDeleteAffectation}
                                                onAddVariation={handleAddVariation}
                                                variations={template.variations || []}
                                                index={index}
                                                moveAffectation={moveAffectation}
                                            />
                                        ))}
                                    </Box>
                                )}

                                {/* Formulaire d'ajout d'affectation */}
                                {!readOnly && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                                        <FormControl sx={{ minWidth: 200, mr: 2 }} error={!!errors.newAffectation}>
                                            <InputLabel>Type d'affectation</InputLabel>
                                            <Select
                                                value={newAffectationType}
                                                label="Type d'affectation"
                                                onChange={(e) => setNewAffectationType(e.target.value as AffectationType | '')}
                                            >
                                                <MenuItem value="">Sélectionner un type</MenuItem>
                                                {availableAffectationTypes.map((type) => (
                                                    <MenuItem
                                                        key={type}
                                                        value={type}
                                                        disabled={filteredAffectations.some(a => a.type === type)}
                                                    >
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.newAffectation && (
                                                <Typography variant="caption" color="error">
                                                    {errors.newAffectation}
                                                </Typography>
                                            )}
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleAddAffectation}
                                            disabled={!newAffectationType || isLoading}
                                            startIcon={<PlusIcon size={16} />}
                                        >
                                            Ajouter
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Contenu de l'onglet variations */}
                    {activeTab === "variations" && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Variations de configuration
                            </Typography>

                            {template.variations?.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Aucune variation configurée. Les variations permettent d'adapter les configurations d'affectation pour des périodes spécifiques.
                                </Alert>
                            ) : (
                                <Box sx={{ mb: 2 }}>
                                    {template.variations?.map((variation) => {
                                        // Trouver l'affectation associée
                                        const affectation = template.affectations.find(a => a.id === variation.affectationId);
                                        if (!affectation) return null; // Skip si l'affectation n'existe plus

                                        return (
                                            <Card key={variation.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="subtitle1">{variation.nom}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {affectation.type} - {DAYS_LABEL[affectation.jour]}
                                                            {variation.typeVariation && ` • ${PERIOD_LABEL[variation.typeVariation]}`}
                                                        </Typography>
                                                        {variation.dateDebut && variation.dateFin && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Du {new Date(variation.dateDebut).toLocaleDateString()} au {new Date(variation.dateFin).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Box>
                                                        <Tooltip title="Éditer la variation">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleEditVariation(variation)}
                                                                sx={{ mr: 1 }}
                                                            >
                                                                <EditIcon size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Supprimer">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteVariation(variation.id)}
                                                            >
                                                                <DeleteIcon size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de configuration d'affectation */}
            <Dialog
                open={configPanelOpen}
                onClose={handleCloseConfigPanel}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Configuration avancée de l'affectation
                </DialogTitle>
                <DialogContent>
                    {selectedAffectation && (
                        <AssignmentConfigPanel
                            affectation={selectedAffectation}
                            onChange={handleUpdateAffectation}
                            availablePostes={availablePostes}
                            isLoading={isLoading}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfigPanel}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de configuration de variation */}
            <Dialog
                open={variationPanelOpen}
                onClose={handleCloseVariationPanel}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Configuration de variation
                </DialogTitle>
                <DialogContent>
                    {selectedVariation && (
                        <VariationConfigPanel
                            variation={selectedVariation}
                            onChange={handleSaveVariation}
                            onDelete={() => handleDeleteVariation(selectedVariation.id)}
                            availablePostes={availablePostes}
                            isLoading={isLoading}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseVariationPanel}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </DndProvider>
    );
};

export default BlocPlanningTemplateEditor; 