import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { logger } from "../../../lib/logger";
import {
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button as MuiButton,
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
    Paper,
    CircularProgress,
    FormGroup,
    Checkbox
} from '@mui/material';
import {
    PlanningTemplate,
    TemplateAffectation,
    AffectationType,
    DayOfWeek,
    ConfigurationVariation,
    PeriodeVariation,
    RoleType,
    AffectationConfiguration
} from '../types/template';
import { FullActivityType } from '../services/templateService';
import AssignmentConfigPanel from './AssignmentConfigPanel';
import VariationConfigPanel from './VariationConfigPanel';
import { templateService } from '../services/templateService';
import {
    PlusCircleIcon as PlusIcon,
    Trash2Icon as TrashIcon,
    Edit3Icon as EditIcon,
    CalendarDaysIcon as CalendarIcon,
    ChevronDownIcon as ExpandIcon,
    UploadCloudIcon as ExportIcon,
    XIcon,
    AlertTriangleIcon,
    CopyIcon,
    SettingsIcon,
    GripVerticalIcon,
    InfoIcon,
    UsersIcon,
    CalendarPlusIcon,
    RotateCcwIcon
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import {
    Select as ShadSelect,
    SelectContent as ShadSelectContent,
    SelectGroup as ShadSelectGroup,
    SelectItem as ShadSelectItem,
    SelectLabel as ShadSelectLabel,
    SelectTrigger as ShadSelectTrigger,
    SelectValue as ShadSelectValue,
} from "@/components/ui/select";

// Mise à jour des props pour inclure modalContentRef
export interface BlocPlanningTemplateEditorProps {
    initialTemplate?: PlanningTemplate;
    selectedTemplateId?: string;
    onSave: (modèle: PlanningTemplate) => Promise<void>;
    onCancel?: () => void;
    availableAffectationTypes: FullActivityType[];
    modèles?: PlanningTemplate[];
    isLoading?: boolean;
    availablePostes?: string[];
    readOnly?: boolean;
    onMuiModalOpenChange?: (isOpen: boolean) => void;
}

// Interface pour les méthodes exposées par la ref
export interface BlocPlanningTemplateEditorHandle {
    submit: () => Promise<void>;
    isDirty: () => boolean;
}

// Définition de EMPTY_TEMPLATE
const EMPTY_TEMPLATE: PlanningTemplate = {
    id: '', // ou un ID temporaire comme `temp_${Date.now()}` si nécessaire avant sauvegarde
    nom: 'Nouvelle Tableau de service',
    description: '',
    affectations: [],
    variations: [],
    roles: [RoleType.TOUS],
    joursSemaineActifs: [1, 2, 3, 4, 5], // Lundi à vendredi par défaut
    typeSemaine: 'TOUTES', // Toutes les semaines par défaut
    dateDebutEffet: new Date(), // Date d'aujourd'hui par défaut
    // Initialiser les autres champs obligatoires ou optionnels de PlanningTemplate au besoin
    // Par exemple, createdAt, updatedAt, etc., pourraient être initialisés à null ou undefined
    // ou laissés pour être gérés par le backend/service lors de la création.
};

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
    onEditVariation: (variation: ConfigurationVariation) => void;
    onDeleteVariation: (variationId: string) => void;
}

const DraggableAffectation: React.FC<DraggableAffectationProps> = ({ affectation,
    onToggle,
    onPostesChange,
    onEdit,
    onDelete,
    onAddVariation,
    variations,
    index,
    moveAffectation,
    onEditVariation,
    onDeleteVariation
}) => {
    // Configuration du drag and drop (migré vers @hello-pangea/dnd)
    // Note: Le drag-and-drop sera géré au niveau parent avec DragDropContext

    // Filtrer les variations pour cette affectation
    const affectationVariations = variations.filter(v => v.affectationId === affectation.id);

    return (
        <div
            style={{
                opacity: 1,
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
                                onClick={() => {
                                    logger.info(`[DraggableAffectation] Crayon cliqué pour affectation ID: ${affectation.id}, Type: ${affectation.type}, Jour: ${affectation.jour}`);
                                    onEdit(affectation);
                                }}
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
                                <TrashIcon size={16} />
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
                            {Array.isArray(affectation.configuration.postes) ? affectation.configuration.postes.length : 0} poste(s) configuré(s)
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

// Ajout d'un composant de résumé des gardes/vacations
const TemplateAffectationsSummary = ({ modèle }: { modèle: PlanningTemplate }) => {
    const days = Object.keys(DAYS_LABEL) as DayOfWeek[];
    const types = Array.from(new Set(modèle.affectations.map(a => a.type)));

    const countVariationsForDay = (day: DayOfWeek) => {
        const affectationIdsForDay = modèle.affectations
            .filter(a => a.jour === day)
            .map(a => a.id);

        return modèle.variations
            ? modèle.variations.filter(v =>
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
                                const affectation = modèle.affectations.find(
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
 * Composant d'éditeur principal pour les trameModeles de planning
 */
const BlocPlanningTemplateEditor = React.forwardRef<BlocPlanningTemplateEditorHandle, BlocPlanningTemplateEditorProps>((
    {
        initialTemplate,
        selectedTemplateId,
        onSave,
        onCancel,
        availableAffectationTypes,
        modèles: templatesFromProps,
        isLoading: isLoadingProp = false,
        availablePostes = [],
        readOnly = false,
        onMuiModalOpenChange
    }, ref) => {
    // État pour la trameModele en cours d'édition
    const [modèle, setTemplate] = useState<PlanningTemplate>(() => {
        const initial = initialTemplate && initialTemplate.id && initialTemplate.id !== 'new'
            ? initialTemplate
            : (initialTemplate && initialTemplate.id === 'new'
                ? initialTemplate // Cas d'un nouveau modèle avec des valeurs pré-remplies (nom, rôles)
                : EMPTY_TEMPLATE);
        return {
            ...initial,
            affectations: initial.affectations || [],
            variations: initial.variations || [],
            roles: initial.roles || [RoleType.TOUS] // S'assurer que les rôles sont initialisés
        };
    });
    const [isLoading, setIsLoading] = useState<boolean>(isLoadingProp);
    const [error, setError] = useState<string | null>(null);
    const [isModified, setIsModified] = useState<boolean>(false);

    // État pour le jour sélectionné dans les onglets (pour l'affichage)
    const [currentViewingDay, setCurrentViewingDay] = useState<DayOfWeek>('LUNDI');

    // Nouvel état pour les jours sélectionnés lors de l'ajout d'une affectation
    const [joursSelectionnesPourAjout, setJoursSelectionnesPourAjout] = useState<DayOfWeek[]>(['LUNDI']);

    // État pour la nouvelle affectation à ajouter
    const [newAffectationType, setNewAffectationType] = useState<string>('');

    // États pour les dialogues
    const [configPanelOpen, setConfigPanelOpen] = useState(false);
    const [selectedAffectation, setSelectedAffectation] = useState<TemplateAffectation | null>(null);

    const [variationPanelOpen, setVariationPanelOpen] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState<ConfigurationVariation | null>(null);
    const [selectedAffectationId, setSelectedAffectationId] = useState<string | null>(null);

    // État pour les variations
    const [activeTab, setActiveTab] = useState<'gardes/vacations' | 'variations'>('gardes/vacations');

    // État pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper pour mettre à jour le modèle et marquer comme modifié
    const updateTemplate = useCallback((updater: (prev: PlanningTemplate) => PlanningTemplate) => {
        setTemplate(updater);
        setIsModified(true);
    }, [setTemplate, setIsModified]);

    // Filtrer les gardes/vacations pour le jour sélectionné (pour l'affichage dans l'onglet)
    const filteredAffectations = Array.isArray(modèle.affectations)
        ? modèle.affectations
            .filter(a => a.jour === currentViewingDay)
            .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
        : [];

    // Ajouter une nouvelle affectation (modifié pour multi-jours)
    const handleAddAffectation = () => {
        if (!newAffectationType || newAffectationType === 'no-options') {
            setErrors(prev => ({ ...prev, newAffectation: 'Veuillez sélectionner un type d\'affectation valide' }));
            return;
        }
        if (joursSelectionnesPourAjout.length === 0) {
            setErrors(prev => ({ ...prev, joursSelectionnesPourAjout: 'Veuillez sélectionner au moins un jour' }));
            return;
        }

        const nouvellesAffectations: TemplateAffectation[] = [];
        let erreurCreation = false;
        const erreursMessages: string[] = [];

        joursSelectionnesPourAjout.forEach(jour => {
            const exists = modèle.affectations.some(
                a => a.jour === jour && a.type === newAffectationType
            );

            if (exists) {
                erreursMessages.push(`Le type d'affectation '${newAffectationType}' existe déjà pour ${DAYS_LABEL[jour]}.`);
                erreurCreation = true;
            } else {
                const affectationsCeJour = modèle.affectations.filter(a => a.jour === jour);
                nouvellesAffectations.push({
                    id: `affect_${Date.now()}_${jour}_${Math.random().toString(36).substring(2, 9)}`,
                    jour: jour,
                    type: newAffectationType as AffectationType,
                    ouvert: true,
                    postesRequis: 1,
                    ordre: affectationsCeJour.length
                });
            }
        });

        if (erreurCreation) {
            setErrors(prev => ({ ...prev, newAffectation: erreursMessages.join(' ') }));
            return;
        }

        if (nouvellesAffectations.length > 0) {
            updateTemplate(prev => ({
                ...prev,
                affectations: [...prev.affectations, ...nouvellesAffectations]
            }));
        }

        // Réinitialiser le formulaire
        setNewAffectationType('');
        setErrors(prev => ({ ...prev, newAffectation: '', joursSelectionnesPourAjout: '' }));
    };

    // Supprimer une affectation
    const handleDeleteAffectation = (id: string) => {
        updateTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.filter(a => a.id !== id),
            // Supprimer aussi toutes les variations associées
            variations: prev.variations?.filter(v => v.affectationId !== id) || []
        }));
    };

    // Activer/désactiver une affectation
    const handleToggleAffectation = (id: string, isOpen: boolean) => {
        updateTemplate(prev => ({
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
        updateTemplate(prev => ({
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

        // Mettre à jour le modèle
        updateTemplate(prev => ({
            ...prev,
            affectations: prev.affectations
                .filter(a => a.jour !== currentViewingDay) // Utiliser currentViewingDay ici car move se fait dans le contexte d'un seul jour
                .concat(updatedAffectations)
        }));
    }, [filteredAffectations, currentViewingDay, updateTemplate]);

    // Ouvrir le panel de configuration pour une affectation
    const handleEditAffectation = (affectation: TemplateAffectation) => {
        logger.info(`[BlocPlanningTemplateEditor] DEBUT handleEditAffectation pour affectation ID: ${affectation.id}, Type: ${affectation.type}, Jour: ${affectation.jour}`);
        logger.info('[BlocEditor DEBUG] handleEditAffectation - Garde/Vacation sélectionnée (avant setState):', JSON.parse(JSON.stringify(affectation)));
        logger.info('[BlocEditor DEBUG] État actuel de configPanelOpen (avant setState):', configPanelOpen);
        setSelectedAffectation(affectation);
        setConfigPanelOpen(true);
        onMuiModalOpenChange?.(true); // Notifie le parent que le modal MUI est ouvert
        logger.info('[BlocEditor DEBUG] État de configPanelOpen (après setState): true (attendu)');
        logger.info('[BlocEditor DEBUG] selectedAffectation (après setState):', JSON.parse(JSON.stringify(affectation)));
    };

    // Fermer le panel de configuration
    const handleCloseConfigPanel = () => {
        logger.info('[BlocPlanningTemplateEditor] handleCloseConfigPanel appelé. Call stack:', new Error().stack);
        setConfigPanelOpen(false);
        setSelectedAffectation(null);
        onMuiModalOpenChange?.(false);
    };

    // Gérer la modification de la configuration d'une affectation (appelé par AssignmentConfigPanel)
    const handleConfigurationChange = (updatedConfig: AffectationConfiguration) => {
        logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - updatedConfig reçue:', JSON.parse(JSON.stringify(updatedConfig)));

        if (!selectedAffectation) {
            logger.error("[BlocPlanningTemplateEditor] handleConfigurationChange - selectedAffectation est null. Impossible de mettre à jour la configuration.");
            toast.error("Erreur: Aucune affectation sélectionnée pour la mise à jour de la configuration.");
            setConfigPanelOpen(false);
            onMuiModalOpenChange?.(false);
            return;
        }

        logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - selectedAffectation.configuration?.postes AVANT calcul:', selectedAffectation.configuration?.postes ? JSON.parse(JSON.stringify(selectedAffectation.configuration.postes)) : 'undefined ou null');
        logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - updatedConfig.postes:', updatedConfig.postes ? JSON.parse(JSON.stringify(updatedConfig.postes)) : 'undefined ou null');

        let finalPostesRequis = 0;
        if (updatedConfig.postes && Array.isArray(updatedConfig.postes)) {
            finalPostesRequis = updatedConfig.postes.reduce((sum, poste) => sum + (Number(poste.quantite) || 0), 0);
            logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - finalPostesRequis calculé à partir de updatedConfig.postes:', finalPostesRequis);
        } else {
            // Si pas de postes dans la config, on essaie de garder la valeur existante sur selectedAffectation
            finalPostesRequis = selectedAffectation.postesRequis || 0;
            logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - finalPostesRequis basé sur selectedAffectation.postesRequis car updatedConfig.postes est vide/nul:', finalPostesRequis);
        }

        // Créer une nouvelle affectation mise à jour
        const affectationToUpdate: TemplateAffectation = {
            ...selectedAffectation, // Garde les propriétés de base de l'affectation (id, type, jour, ouvert)
            configuration: updatedConfig, // Met à jour la configuration
            postesRequis: finalPostesRequis, // Met à jour le nombre de postes requis
        };

        logger.info('[BlocPlanningTemplateEditor] handleConfigurationChange - affectationToUpdate avant handleUpdateAffectation:', JSON.parse(JSON.stringify(affectationToUpdate)));

        handleUpdateAffectation(affectationToUpdate); // Utilise la fonction existante pour mettre à jour la liste
        // setSelectedAffectation(null); // Déjà fait dans handleCloseConfigPanel
        // setConfigPanelOpen(false); // Déjà fait dans handleCloseConfigPanel
        // setIsModified(true); // handleUpdateAffectation appelle updateTemplate qui met isModified à true

        // La fermeture du panel est gérée par AssignmentConfigPanel lui-même ou par handleCloseConfigPanel.
        // Il faut s'assurer que handleCloseConfigPanel est appelé correctement.
        // Pour l'instant, on se concentre sur la mise à jour des données.
        // La ligne ci-dessous est commentée car la fermeture est gérée par handleCloseConfigPanel
        // logger.info("[BlocPlanningTemplateEditor] handleConfigurationChange - Fermeture du panel commentée pour test de visibilité.");
        // On s'attend à ce que AssignmentConfigPanel appelle son propre `onClose` ou que l'utilisateur ferme manuellement,
        // ce qui déclenchera handleCloseConfigPanel.
    };

    // Ouvrir le panel pour ajouter une variation
    const handleAddVariation = (affectationId: string) => {
        const affectation = modèle.affectations.find(a => a.id === affectationId);
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
        onMuiModalOpenChange?.(true);
    };

    // Ouvrir le panel pour éditer une variation existante
    const handleEditVariation = (variation: ConfigurationVariation) => {
        logger.info(`[!!! BlocPlanningTemplateEditor] DEBUT handleEditVariation. Variation reçue:`, JSON.parse(JSON.stringify(variation)));
        logger.info(`[!!! BlocPlanningTemplateEditor] Avant setVariationPanelOpen(true). variationPanelOpen était: ${variationPanelOpen}`);
        setSelectedVariation(variation);
        setSelectedAffectationId(variation.affectationId);
        setVariationPanelOpen(true);
        onMuiModalOpenChange?.(true);
        logger.info(`[!!! BlocPlanningTemplateEditor] APRES setVariationPanelOpen(true). variationPanelOpen devrait être true.`);
    };

    // Fermer le panel de variation
    const handleCloseVariationPanel = () => {
        setVariationPanelOpen(false);
        setSelectedVariation(null);
        setSelectedAffectationId(null);
        onMuiModalOpenChange?.(false);
    };

    // Sauvegarder une variation
    const handleSaveVariation = (updatedVariation: ConfigurationVariation) => {
        logger.info(`[BlocPlanningTemplateEditor] handleSaveVariation appelée avec:`, JSON.parse(JSON.stringify(updatedVariation)));
        const variationIndex = (modèle.variations || []).findIndex(v => v.id === updatedVariation.id);

        if (variationIndex >= 0) {
            updateTemplate(prev => ({
                ...prev,
                variations: (prev.variations || []).map(v =>
                    v.id === updatedVariation.id ? updatedVariation : v
                )
            }));
        } else {
            updateTemplate(prev => ({
                ...prev,
                variations: [...(prev.variations || []), updatedVariation]
            }));
        }
        toast.success("Variation sauvegardée localement.");
        setIsModified(true); // Marquer comme modifié
        handleCloseVariationPanel(); // Fermer le panel après sauvegarde
    };

    // Supprimer une variation
    const handleDeleteVariation = (variationId: string) => {
        updateTemplate(prev => ({
            ...prev,
            variations: prev.variations?.filter(v => v.id !== variationId) || []
        }));
        // Si c'est la variation en cours d'édition, fermer le panneau
        if (selectedVariation?.id === variationId) {
            handleCloseVariationPanel();
        }
    };

    // Mettre à jour une affectation après configuration
    const handleUpdateAffectation = (updatedAffectation: TemplateAffectation) => {
        logger.info('[BlocEditor DEBUG] handleUpdateAffectation - Garde/Vacation reçue pour mise à jour:', JSON.stringify(updatedAffectation, null, 2));
        logger.info('[BlocEditor DEBUG] handleUpdateAffectation - Postes dans updatedAffectation.configuration:', JSON.stringify(updatedAffectation.configuration?.postes, null, 2));
        updateTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.map(a =>
                a.id === updatedAffectation.id ? updatedAffectation : a
            )
        }));
        // Ne pas fermer le panel ici, laisser AssignmentConfigPanel le faire via onSave/onClose
    };

    // Valider la trameModele avant sauvegarde
    const validateTemplate = (): boolean => {
        const newErrors: Record<string, string> = {};
        logger.info("[validateTemplate] Validation en cours pour la tableau de service:", JSON.parse(JSON.stringify(modèle)));

        if (!modèle.nom.trim()) {
            newErrors.nom = 'Le nom de la trameModele est requis';
            logger.info("[validateTemplate] Erreur: Nom de trameModele vide.");
        }

        // Vérifier que les gardes/vacations ouvertes ont au moins un poste requis
        // const invalidAffectation = modèle.affectations.find(a => a.ouvert && a.postesRequis < 1);
        const invalidAffectation = modèle.affectations.find(a => a.ouvert && (!a.postesRequis || a.postesRequis < 1));
        if (invalidAffectation) {
            // newErrors.affectations = `L'affectation ${invalidAffectation.type} du ${DAYS_LABEL[invalidAffectation.jour]} doit avoir au moins un poste requis`;
            newErrors.affectations = `L'affectation ${invalidAffectation.type} du ${DAYS_LABEL[invalidAffectation.jour]} (ID: ${invalidAffectation.id}) doit avoir au moins un poste requis (actuel: ${invalidAffectation.postesRequis}, ouvert: ${invalidAffectation.ouvert})`;
            logger.info("[validateTemplate] Erreur: Garde/Vacation invalide trouvée:", JSON.parse(JSON.stringify(invalidAffectation)));
        }

        // Vérifier que les variations ont un nom
        const invalidVariation = modèle.variations?.find(v => !v.nom.trim());
        if (invalidVariation) {
            newErrors.variations = `Toutes les variations doivent avoir un nom`;
            logger.info("[validateTemplate] Erreur: Variation avec nom vide trouvée.");
        }

        setErrors(newErrors);
        // return Object.keys(newErrors).length === 0;
        const isValid = Object.keys(newErrors).length === 0;
        logger.info("[validateTemplate] Résultat de la validation:", isValid, "Erreurs:", newErrors);
        return isValid;
    };

    // Sauvegarder la trameModele
    const handleSaveTemplate = async () => {
        if (!validateTemplate()) {
            toast.error("Veuillez corriger les erreurs dans la trameModele avant de sauvegarder.");
            return;
        }
        setIsLoading(true);
        try {
            // Assurer que le modèle final a les rôles corrects (ceux de initialTemplate, car cet éditeur ne les modifie pas)
            const templateToSave = {
                ...modèle,
                roles: initialTemplate?.roles || modèle.roles || [RoleType.TOUS]
            };
            // Log amélioré pour voir les gardes/vacations
            logger.info(
                '[BlocPlanningTemplateEditor] Contenu de templateToSave AVANT appel à props.onSave:',
                JSON.parse(JSON.stringify(templateToSave)), // Pour un affichage propre de l'objet
                `Nombre d\'affectations: ${templateToSave.affectations?.length || 0}`,
                'Gardes/Vacations:',
                JSON.stringify(templateToSave.affectations, null, 2) // Affiche les gardes/vacations en détail
            );
            await onSave(templateToSave);
            toast.success("Tableau de service sauvegardée avec succès !");
            setIsModified(false);
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde de la tableau de service:', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            setErrors({ save: 'Erreur lors de la sauvegarde de la trameModele' });
        } finally {
            setIsLoading(false);
        }
    };

    // Exposer la méthode submit via la ref
    useImperativeHandle(ref, () => ({
        submit: handleSaveTemplate,
        isDirty: () => isModified
    }));

    // Chargement des types d'gardes/vacations disponibles
    useEffect(() => {
        if (!availableAffectationTypes || availableAffectationTypes.length === 0) {
            // Le chargement initial des types est maintenant géré par TemplateManager
            // templateService.getAvailableAffectationTypes() ne devrait plus être appelé ici directement
            // Si la liste est vide, cela signifie que le parent n'a rien fourni ou que rien n'est disponible.
            logger.warn("[BlocPlanningTemplateEditor] availableAffectationTypes est vide ou non fourni.");
        }
    }, [availableAffectationTypes]);

    // Nettoyage des variations qui référencent des gardes/vacations inexistantes
    useEffect(() => {
        if (modèle && Array.isArray(modèle.variations) && modèle.variations.length > 0) {
            const validAffectationIds = new Set(modèle.affectations.map(a => a.id));
            const invalidVariations = modèle.variations.filter(v => !validAffectationIds.has(v.affectationId));

            if (invalidVariations.length > 0) {
                logger.warn(`[BlocPlanningTemplateEditor] ${invalidVariations.length} variations référencent des gardes/vacations inexistantes et seront supprimées.`,
                    invalidVariations.map(v => ({ id: v.id, affectationId: v.affectationId })));

                updateTemplate(prev => ({
                    ...prev,
                    variations: prev.variations?.filter(v => validAffectationIds.has(v.affectationId)) || []
                }));
            }
        }
    }, [modèle.affectations, modèle.variations, updateTemplate]);

    // Sécurisation des données du modèle
    useEffect(() => {
        // LOGS AJOUTÉS ICI pour déboguer modèle.affectations
        if (modèle) {
            logger.info(`[BlocEditor debug] ID tableau de service: ${modèle.id}`);
            logger.info('[BlocEditor debug] Modèle état: ', JSON.parse(JSON.stringify(modèle || {})));

            // Validation et correction du modèle
            if (!modèle.affectations) {
                logger.warn('[BlocEditor debug] modèle.affectations est undefined, initialisation avec []');
                updateTemplate(prev => ({
                    ...prev,
                    affectations: []
                }));
            } else if (!Array.isArray(modèle.affectations)) {
                logger.warn('[BlocEditor debug] modèle.affectations n\'est pas un array, conversion en []');
                updateTemplate(prev => ({
                    ...prev,
                    affectations: []
                }));
            }

            // Validation des variations
            if (!modèle.variations) {
                updateTemplate(prev => ({
                    ...prev,
                    variations: []
                }));
            }
        }
    }, [modèle, updateTemplate]);

    const loadTrames = useCallback(async (id: string) => {
        if (!id) return;

        setIsLoading(true);
        try {
            // logger.info(`[BlocEditor loadTrames] ID reçu: ${id}`);

            // Recherche de la trameModele dans les modèles fournis par les props
            const tramePourEdition = templatesFromProps?.find(t => String(t.id) === String(id));

            if (tramePourEdition) {
                // logger.info(`[BlocEditor loadTrames] tramePourEdition (avant typeof check): `, tramePourEdition);

                // Vérification et normalisation des gardes/vacations et variations
                const affectations = Array.isArray(tramePourEdition.affectations) ? tramePourEdition.affectations: [];
                const variations = Array.isArray(tramePourEdition.variations) ? tramePourEdition.variations : [];

                // Vérifier si le modèle actuel est déjà identique à tramePourEdition (pour éviter les mises à jour inutiles)
                if (modèle.id !== tramePourEdition.id ||
                    modèle.nom !== tramePourEdition.nom ||
                    modèle.description !== tramePourEdition.description ||
                    JSON.stringify(modèle.affectations || []) !== JSON.stringify(gardes/vacations) ||
                    JSON.stringify(modèle.variations || []) !== JSON.stringify(variations)) {

                    // Mise à jour du modèle uniquement si différent
                    // logger.info(`[BlocEditor loadTrames] Mise à jour du modèle avec la trameModele trouvée.`);
                    setTemplate({
                        ...tramePourEdition,
                        affectations: gardesVacations,
                        variations,
                    });
                    setIsModified(false);
                } else {
                    // logger.info(`[BlocEditor loadTrames] Modèle déjà à jour, pas de setTemplate.`);
                }
            } else {
                setError(`Tableau de service avec id ${id} non trouvée.`);
            }
        } catch (err: unknown) {
            logger.error(`[BlocEditor loadTrames] Erreur:`, { error: err });
            setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, [templatesFromProps, setTemplate, setIsLoading, setError, setIsModified]);

    // useEffect principal pour gérer le chargement et l'initialisation du modèle
    // Dépendances : uniquement les props et les callbacks stables, pas modèle
    useEffect(() => {
        // logger.info("[BlocEditor useEffect]", { initialTplId: initialTemplate?.id, selectedId: selectedTemplateId, currentTplId: modèle.id });

        // Si un ID est sélectionné et qu'il est différent du modèle actuel, charger la trameModele
        if (selectedTemplateId && selectedTemplateId !== modèle.id) {
            // logger.info(`[BlocEditor useEffect] Chargement via selectedTemplateId: ${selectedTemplateId}`);
            loadTrames(selectedTemplateId);
            return; // Sortir pour éviter d'exécuter les autres branches
        }

        // Si pas d'ID sélectionné mais un initialTemplate fourni, l'utiliser si différent
        if (!selectedTemplateId && initialTemplate) {
            const currentAffectations = modèle.affectations || [];
            const initialAffectations = initialTemplate.affectations || [];
            const currentVariations = modèle.variations || [];
            const initialVariations = initialTemplate.variations || [];

            // Vérifier si le modèle actuel est déjà identique à initialTemplate
            if (modèle.id !== initialTemplate.id ||
                modèle.nom !== initialTemplate.nom ||
                JSON.stringify(currentAffectations) !== JSON.stringify(initialAffectations) ||
                JSON.stringify(currentVariations) !== JSON.stringify(initialVariations)) {

                // logger.info("[BlocEditor useEffect] Application de initialTemplate");
                setTemplate({
                    ...initialTemplate,
                    affectations: initialAffectations,
                    variations: initialVariations,
                });
                setIsModified(false);
            }
            return; // Sortir pour éviter d'exécuter les autres branches
        }

        // Si ni ID sélectionné ni initialTemplate, et que le modèle n'est pas vide, le réinitialiser
        if (!selectedTemplateId && !initialTemplate && modèle.id !== EMPTY_TEMPLATE.id) {
            // logger.info("[BlocEditor useEffect] Reset vers EMPTY_TEMPLATE");
            setTemplate(EMPTY_TEMPLATE);
            setIsModified(false);
            return;
        }

        // Cas où selectedTemplateId est égal à modèle.id mais initialTemplate a changé et a le même ID
        // (synchronisation avec initialTemplate si son contenu a changé)
        if (selectedTemplateId && selectedTemplateId === modèle.id &&
            initialTemplate && initialTemplate.id === selectedTemplateId) {

            const currentAffectations = modèle.affectations || [];
            const initialAffectations = initialTemplate.affectations || [];
            const currentVariations = modèle.variations || [];
            const initialVariations = initialTemplate.variations || [];

            if (modèle.nom !== initialTemplate.nom ||
                JSON.stringify(currentAffectations) !== JSON.stringify(initialAffectations) ||
                JSON.stringify(currentVariations) !== JSON.stringify(initialVariations)) {

                // logger.info("[BlocEditor useEffect] Synchronisation avec initialTemplate (même ID)");
                setTemplate({
                    ...initialTemplate,
                    affectations: initialAffectations,
                    variations: initialVariations,
                });
                setIsModified(false);
            }
        }
    }, [initialTemplate, selectedTemplateId, loadTrames, modèle.id, setIsModified]);

    // Gestion du changement de `isLoadingProp` venant du parent
    useEffect(() => {
        setIsLoading(isLoadingProp);
    }, [isLoadingProp]);

    // Si initialTemplate est undefined et qu'on est en mode création (pas d'ID sélectionné)
    // s'assurer que le modèle local est EMPTY_TEMPLATE ou celui passé pour un nouveau modèle.
    // (Cette logique a été déplacée dans l'initialisation de useState et le useEffect principal)

    if (isLoading && !modèle) { // Afficher le chargement seulement si modèle n'est pas encore défini
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    // Rendu principal du composant
    return (
        <DragDropContext onDragEnd={() => {}}>
            <Box sx={{ p: 2, pt: 0 }}>
                {/* Section pour Nom, Description et Rôles avec Flexbox */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1, minWidth: { md: '300px' } }}>
                        <TextField
                            label="Nom de la trameModele"
                            value={modèle.nom}
                            onChange={(e) => {
                                updateTemplate(prev => ({ ...prev, nom: e.target.value }));
                                if (errors.nom) setErrors(prev => ({ ...prev, nom: '' }));
                            }}
                            fullWidth
                            variant="outlined"
                            required
                            error={!!errors.nom}
                            helperText={errors.nom}
                            disabled={readOnly || isLoading}
                            size="small"
                            InputProps={{ sx: { fontWeight: 'bold', fontSize: '1.1rem' } }}
                        />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: { md: '250px' } }}>
                        <TextField
                            label="Description"
                            value={modèle.description || ''}
                            onChange={(e) => updateTemplate(prev => ({ ...prev, description: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={3}
                            variant="outlined"
                            size="small"
                            disabled={readOnly || isLoading}
                        />
                    </Box>
                    <Box sx={{ flexShrink: 0, pt: { xs: 0, md: '6px' }, minWidth: { xs: '100%', md: 'auto' } }}> {/* Ajustement pour rôles */}
                        {(modèle.roles && modèle.roles.length > 0) && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 0.5, color: 'text.secondary' }}>Rôles :</Typography>
                                {modèle.roles.map(role => (
                                    <Chip key={role} label={role} size="small" color="info" variant="filled" sx={{ borderRadius: '6px', fontWeight: 'medium' }} />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Nouvelle section pour sélectionner les jours actifs de la trameModele */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Jours actifs de la trameModele
                    </Typography>
                    <Typography variant="caption" color="text.secondary" paragraph>
                        Sélectionnez les jours de la semaine où cette trameModele est active.
                    </Typography>
                    <FormGroup row>
                        {(Object.keys(DAYS_LABEL) as DayOfWeek[]).map((day) => {
                            // Conversion des jours de type DayOfWeek (LUNDI, etc.) vers valeurs numériques (1 pour lundi, etc.)
                            const dayNumber = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'].indexOf(day) + 1;
                            return (
                                <FormControlLabel
                                    key={day}
                                    control={
                                        <Checkbox
                                            checked={modèle.joursSemaineActifs?.includes(dayNumber) ?? false}
                                            onChange={(event) => {
                                                const checked = event.target.checked;
                                                const currentJours = modèle.joursSemaineActifs || [];
                                                const newJours = checked
                                                    ? [...currentJours, dayNumber].sort()
                                                    : currentJours.filter(d => d !== dayNumber);

                                                updateTemplate(prev => ({ ...prev, joursSemaineActifs: newJours }));
                                            }}
                                            size="small"
                                        />
                                    }
                                    label={DAYS_LABEL[day]}
                                />
                            );
                        })}
                    </FormGroup>
                </Box>

                {/* Nouvelle section pour sélectionner le type de semaine */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'rgba(0, 0, 0, 0.01)' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Type de semaine
                            </Typography>
                            <ShadSelect
                                onValueChange={(value: 'TOUTES' | 'PAIRES' | 'IMPAIRES') => {
                                    updateTemplate(prev => ({ ...prev, typeSemaine: value }));
                                }}
                                value={modèle.typeSemaine || 'TOUTES'}
                            >
                                <ShadSelectTrigger className="w-full">
                                    <ShadSelectValue placeholder="Sélectionner un type" />
                                </ShadSelectTrigger>
                                <ShadSelectContent>
                                    <ShadSelectGroup>
                                        <ShadSelectItem value="TOUTES">Toutes les semaines</ShadSelectItem>
                                        <ShadSelectItem value="PAIRES">Semaines paires</ShadSelectItem>
                                        <ShadSelectItem value="IMPAIRES">Semaines impaires</ShadSelectItem>
                                    </ShadSelectGroup>
                                </ShadSelectContent>
                            </ShadSelect>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Détermine à quelles semaines cette trameModele s'applique.
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Date de début d'effet
                            </Typography>
                            <TextField
                                type="date"
                                value={modèle.dateDebutEffet ? new Date(modèle.dateDebutEffet).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateTemplate(prev => ({
                                    ...prev,
                                    dateDebutEffet: e.target.value ? new Date(e.target.value) : new Date()
                                }))}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Date à partir de laquelle cette trameModele est effective.
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Gardes/Vacations" value="gardes/vacations" />
                    <Tab
                        label={
                            <Badge
                                badgeContent={modèle.variations?.length || 0}
                                color="secondary"
                                showZero={false}
                            >
                                Variations
                            </Badge>
                        }
                        value="variations"
                    />
                </Tabs>

                {/* Contenu de l'onglet gardes/vacations */}
                {activeTab === "gardes/vacations" && (
                    <>
                        {/* Onglets pour les jours de la semaine */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs
                                value={currentViewingDay}
                                onChange={(_, newValue) => setCurrentViewingDay(newValue)}
                                variant="scrollable"
                                scrollButtons="auto"
                                aria-label="Jours de la semaine"
                            >
                                {Object.entries(DAYS_LABEL).map(([day, label]) => (
                                    <Tab key={day} label={label} value={day} />
                                ))}
                            </Tabs>
                        </Box>

                        {/* Zone d'gardes/vacations pour le jour sélectionné */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Gardes/Vacations pour {DAYS_LABEL[currentViewingDay as DayOfWeek]}
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
                                            affectation ={ affectation }
                                            variations={modèle.variations || []}
                                            index={index}
                                            moveAffectation={moveAffectation}
                                            onToggle={handleToggleAffectation}
                                            onPostesChange={handlePostesChange}
                                            onEdit={handleEditAffectation}
                                            onDelete={handleDeleteAffectation}
                                            onAddVariation={handleAddVariation}
                                            onEditVariation={handleEditVariation}
                                            onDeleteVariation={handleDeleteVariation}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Formulaire d'ajout d'affectation */}
                            {!readOnly && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3, gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <ShadSelect
                                                onValueChange={(value: string) => {
                                                    logger.info('[BlocPlanningTemplateEditor] ShadSelect onValueChange - new value (code):', value);
                                                    setNewAffectationType(value);
                                                    if (errors.newAffectation) setErrors(prev => ({ ...prev, newAffectation: '' }));
                                                }}
                                                value={newAffectationType}
                                            >
                                                <ShadSelectTrigger className="w-[220px]">
                                                    <ShadSelectValue placeholder="Sélectionner un type" />
                                                </ShadSelectTrigger>
                                                <ShadSelectContent>
                                                    <ShadSelectGroup>
                                                        {availableAffectationTypes.length === 0 && (
                                                            <ShadSelectItem value="no-options" disabled>Aucun type disponible</ShadSelectItem>
                                                        )}
                                                        {availableAffectationTypes.map((activityTypeObj) => (
                                                            <ShadSelectItem
                                                                key={activityTypeObj.code}
                                                                value={activityTypeObj.code}
                                                                disabled={modèle.affectations.some(a => a.jour === currentViewingDay && a.type === activityTypeObj.code)}
                                                            >
                                                                {activityTypeObj.name}
                                                            </ShadSelectItem>
                                                        ))}
                                                    </ShadSelectGroup>
                                                </ShadSelectContent>
                                            </ShadSelect>
                                            {errors.newAffectation && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                                                    {errors.newAffectation}
                                                </Typography>
                                            )}
                                        </Box>

                                        <MuiButton
                                            variant="contained"
                                            color="primary"
                                            onClick={handleAddAffectation}
                                            disabled={!newAffectationType || newAffectationType === 'no-options' || joursSelectionnesPourAjout.length === 0 || isLoading}
                                            startIcon={<PlusIcon size={16} />}
                                            sx={{ alignSelf: 'flex-start' }}
                                        >
                                            Ajouter Garde/Vacation(s)
                                        </MuiButton>
                                    </Box>

                                    {/* Sélection des jours pour l'ajout */}
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>Sélectionner le(s) jour(s) :</Typography>
                                        <FormGroup row>
                                            {(Object.keys(DAYS_LABEL) as DayOfWeek[]).map((day) => (
                                                <FormControlLabel
                                                    key={day}
                                                    control={
                                                        <Checkbox
                                                            checked={joursSelectionnesPourAjout.includes(day)}
                                                            onChange={(event) => {
                                                                const checked = event.target.checked;
                                                                setJoursSelectionnesPourAjout(prev =>
                                                                    checked
                                                                        ? [...prev, day]
                                                                        : prev.filter(d => d !== day)
                                                                );
                                                                if (errors.joursSelectionnesPourAjout) setErrors(prev => ({ ...prev, joursSelectionnesPourAjout: '' }));
                                                            }}
                                                            size="small"
                                                        />
                                                    }
                                                    label={DAYS_LABEL[day]}
                                                />
                                            ))}
                                        </FormGroup>
                                        {errors.joursSelectionnesPourAjout && (
                                            <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                                                {errors.joursSelectionnesPourAjout}
                                            </Typography>
                                        )}
                                    </Box>
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

                        {modèle.variations?.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Aucune variation configurée. Les variations permettent d'adapter les configurations d'affectation pour des périodes spécifiques.
                            </Alert>
                        ) : (
                            <Box sx={{ mb: 2 }}>
                                {modèle.variations?.map((variation) => {
                                    // Trouver l'affectation associée
                                    const affectation = modèle.affectations.find(a => a.id === variation.affectationId);
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
                                                            color="info"
                                                            onClick={() => handleEditVariation(variation)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <EditIcon size={14} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Supprimer la variation">
                                                        <IconButton
                                                            size="small"
                                                            color="warning"
                                                            onClick={() => handleDeleteVariation(variation.id)}
                                                        >
                                                            <TrashIcon size={14} />
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
            </Box>

            {/* MODALES MUI EN DESSOUS (leur position dans le JSX n'affecte pas leur affichage superposé) */}
            {selectedAffectation && (
                <Dialog
                    open={configPanelOpen}
                    onClose={(event, reason) => {
                        // logger.info("[BlocPlanningTemplateEditor] onClose du Dialog AssignmentConfigPanel (test avec IconButton). Reason:", reason);
                        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                            // logger.info("[BlocPlanningTemplateEditor] Fermeture du Dialog AssignmentConfigPanel (test avec IconButton) via backdrop ou escape.");
                        }
                        handleCloseConfigPanel();
                    }}
                    fullWidth
                    maxWidth="md"
                    disablePortal
                    aria-labelledby="attribution-config-dialog-title"
                >
                    <DialogTitle id="attribution-config-dialog-title">
                        Configuration de l'affectation: {selectedAffectation.type} - {DAYS_LABEL[selectedAffectation.jour]}
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseConfigPanel}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <XIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 2 }}>
                        {(() => {
                            // logger.info('[BlocEditor DEBUG] Rendu Dialog pour AssignmentConfigPanel. configPanelOpen:', configPanelOpen);
                            // logger.info('[BlocEditor DEBUG] selectedAffectation dans le rendu:', selectedAffectation ? JSON.parse(JSON.stringify(selectedAffectation)) : null);
                            if (isLoading) {
                                // logger.info('[BlocEditor DEBUG] Affichage CircularProgress car isLoading est true.');
                                return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
                            }
                            if (!selectedAffectation) {
                                // logger.error('[BlocEditor ERROR] selectedAffectation est null DANS LE RENDU du DialogContent. Ne devrait pas arriver si configPanelOpen est true ET selectedAffectation est la condition.');
                                return <Alert severity="error">Erreur: Aucune affectation sélectionnée pour la configuration.</Alert>;
                            }
                            // logger.info('[BlocEditor DEBUG] Passage des props à AssignmentConfigPanel:', {
                            //     affectation: JSON.parse(JSON.stringify(selectedAffectation)),
                            //     availablePostes: availablePostes || [],
                            //     isLoading
                            // });
                            return (
                                <AssignmentConfigPanel
                                    affectation ={selectedAffectation}
                                    onChange={handleConfigurationChange}
                                    availablePostes={availablePostes || []}
                                    isLoading={isLoading}
                                />
                            );
                        })()}
                    </DialogContent>
                </Dialog>
            )}

            {selectedVariation && (
                <Dialog
                    open={variationPanelOpen}
                    onClose={(event, reason) => {
                        // logger.info("[BlocPlanningTemplateEditor] onClose du Dialog VariationConfigPanel. Reason:", reason);
                        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                            // logger.info("[BlocPlanningTemplateEditor] Fermeture du Dialog VariationConfigPanel via backdrop ou escape.");
                        }
                        handleCloseVariationPanel();
                    }}
                    fullWidth
                    maxWidth="lg"
                    disablePortal
                    PaperProps={{
                        sx: { /* Styles originaux à conserver si présents, sinon supprimer sx */ },
                        onClick: (e: React.MouseEvent) => {
                            // logger.info('[MUI Dialog Paper] onClick event on VariationConfigPanel');
                            e.stopPropagation();
                        },
                        onPointerDown: (e: React.PointerEvent) => {
                            // logger.info('[MUI Dialog Paper] onPointerDown event on VariationConfigPanel');
                            e.stopPropagation();
                        }
                    }}
                >
                    <DialogTitle sx={{ m: 0, p: 2 }}>
                        Configuration de la Variation
                        <IconButton aria-label="close" onClick={handleCloseVariationPanel} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                            <XIcon size={20} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ overflowY: 'auto' }}>
                        <VariationConfigPanel
                            variation={selectedVariation}
                            onChange={handleSaveVariation}
                            onDelete={() => handleDeleteVariation(selectedVariation.id)}
                            availablePostes={availablePostes}
                            isLoading={isLoading}
                        />
                    </DialogContent>
                    <DialogActions>
                        <MuiButton onClick={handleCloseVariationPanel}>Annuler</MuiButton>
                    </DialogActions>
                </Dialog>
            )}
        </DragDropContext>
    );
});

export default BlocPlanningTemplateEditor; 