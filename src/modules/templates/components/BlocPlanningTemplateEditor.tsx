import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
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
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
    onSave: (template: PlanningTemplate) => Promise<void>;
    onCancel?: () => void;
    availableAffectationTypes: FullActivityType[];
    templates?: PlanningTemplate[];
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
    nom: 'Nouvelle Trame',
    description: '',
    affectations: [],
    variations: [],
    roles: [RoleType.TOUS],
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

const DraggableAffectation: React.FC<DraggableAffectationProps> = ({
    affectation,
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
                                onClick={() => {
                                    console.log(`[DraggableAffectation] Crayon cliqué pour affectation ID: ${affectation.id}, Type: ${affectation.type}, Jour: ${affectation.jour}`);
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
const BlocPlanningTemplateEditor = React.forwardRef<BlocPlanningTemplateEditorHandle, BlocPlanningTemplateEditorProps>((
    {
        initialTemplate,
        selectedTemplateId,
        onSave,
        onCancel,
        availableAffectationTypes,
        templates: templatesFromProps,
        isLoading: isLoadingProp = false,
        availablePostes = [],
        readOnly = false,
        onMuiModalOpenChange
    }, ref) => {
    // État pour la trame en cours d'édition
    const [template, setTemplate] = useState<PlanningTemplate>(() => {
        const initial = initialTemplate && initialTemplate.id && initialTemplate.id !== 'new'
            ? initialTemplate
            : (initialTemplate && initialTemplate.id === 'new'
                ? initialTemplate // Cas d'un nouveau template avec des valeurs pré-remplies (nom, rôles)
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
    const [activeTab, setActiveTab] = useState<'affectations' | 'variations'>('affectations');

    // État pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper pour mettre à jour le template et marquer comme modifié
    const updateTemplate = useCallback((updater: (prev: PlanningTemplate) => PlanningTemplate) => {
        setTemplate(updater);
        setIsModified(true);
    }, [setTemplate, setIsModified]);

    // Filtrer les affectations pour le jour sélectionné (pour l'affichage dans l'onglet)
    const filteredAffectations = Array.isArray(template.affectations)
        ? template.affectations
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
            const exists = template.affectations.some(
                a => a.jour === jour && a.type === newAffectationType
            );

            if (exists) {
                erreursMessages.push(`Le type d'affectation '${newAffectationType}' existe déjà pour ${DAYS_LABEL[jour]}.`);
                erreurCreation = true;
            } else {
                const affectationsCeJour = template.affectations.filter(a => a.jour === jour);
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

        // Mettre à jour le template
        updateTemplate(prev => ({
            ...prev,
            affectations: prev.affectations
                .filter(a => a.jour !== currentViewingDay) // Utiliser currentViewingDay ici car move se fait dans le contexte d'un seul jour
                .concat(updatedAffectations)
        }));
    }, [filteredAffectations, currentViewingDay, updateTemplate]);

    // Ouvrir le panel de configuration pour une affectation
    const handleEditAffectation = (affectation: TemplateAffectation) => {
        console.log(`[BlocPlanningTemplateEditor] DEBUT handleEditAffectation pour affectation ID: ${affectation.id}, Type: ${affectation.type}, Jour: ${affectation.jour}`);
        console.log('[BlocEditor DEBUG] handleEditAffectation - Affectation sélectionnée (avant setState):', JSON.parse(JSON.stringify(affectation)));
        console.log('[BlocEditor DEBUG] État actuel de configPanelOpen (avant setState):', configPanelOpen);
        setSelectedAffectation(affectation);
        setConfigPanelOpen(true);
        onMuiModalOpenChange?.(true); // Notifie le parent que le modal MUI est ouvert
        console.log('[BlocEditor DEBUG] État de configPanelOpen (après setState): true (attendu)');
        console.log('[BlocEditor DEBUG] selectedAffectation (après setState):', JSON.parse(JSON.stringify(affectation)));
    };

    // Fermer le panel de configuration
    const handleCloseConfigPanel = () => {
        console.log('[BlocPlanningTemplateEditor] handleCloseConfigPanel appelé. Call stack:', new Error().stack);
        setConfigPanelOpen(false);
        setSelectedAffectation(null);
        onMuiModalOpenChange?.(false);
    };

    // Gérer la modification de la configuration d'une affectation (appelé par AssignmentConfigPanel)
    const handleConfigurationChange = (updatedConfig: AffectationConfiguration) => {
        console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - updatedConfig reçue:', JSON.parse(JSON.stringify(updatedConfig)));

        if (!selectedAffectation) {
            console.error("[BlocPlanningTemplateEditor] handleConfigurationChange - selectedAffectation est null. Impossible de mettre à jour la configuration.");
            toast.error("Erreur: Aucune affectation sélectionnée pour la mise à jour de la configuration.");
            setConfigPanelOpen(false);
            onMuiModalOpenChange?.(false);
            return;
        }

        console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - selectedAffectation.configuration?.postes AVANT calcul:', selectedAffectation.configuration?.postes ? JSON.parse(JSON.stringify(selectedAffectation.configuration.postes)) : 'undefined ou null');
        console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - updatedConfig.postes:', updatedConfig.postes ? JSON.parse(JSON.stringify(updatedConfig.postes)) : 'undefined ou null');

        let finalPostesRequis = 0;
        if (updatedConfig.postes && Array.isArray(updatedConfig.postes)) {
            finalPostesRequis = updatedConfig.postes.reduce((sum, poste) => sum + (Number(poste.quantite) || 0), 0);
            console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - finalPostesRequis calculé à partir de updatedConfig.postes:', finalPostesRequis);
        } else {
            // Si pas de postes dans la config, on essaie de garder la valeur existante sur selectedAffectation
            finalPostesRequis = selectedAffectation.postesRequis || 0;
            console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - finalPostesRequis basé sur selectedAffectation.postesRequis car updatedConfig.postes est vide/nul:', finalPostesRequis);
        }

        // Créer une nouvelle affectation mise à jour
        const affectationToUpdate: TemplateAffectation = {
            ...selectedAffectation, // Garde les propriétés de base de l'affectation (id, type, jour, ouvert)
            configuration: updatedConfig, // Met à jour la configuration
            postesRequis: finalPostesRequis, // Met à jour le nombre de postes requis
        };

        console.log('[BlocPlanningTemplateEditor] handleConfigurationChange - affectationToUpdate avant handleUpdateAffectation:', JSON.parse(JSON.stringify(affectationToUpdate)));

        handleUpdateAffectation(affectationToUpdate); // Utilise la fonction existante pour mettre à jour la liste
        // setSelectedAffectation(null); // Déjà fait dans handleCloseConfigPanel
        // setConfigPanelOpen(false); // Déjà fait dans handleCloseConfigPanel
        // setIsModified(true); // handleUpdateAffectation appelle updateTemplate qui met isModified à true

        // La fermeture du panel est gérée par AssignmentConfigPanel lui-même ou par handleCloseConfigPanel.
        // Il faut s'assurer que handleCloseConfigPanel est appelé correctement.
        // Pour l'instant, on se concentre sur la mise à jour des données.
        // La ligne ci-dessous est commentée car la fermeture est gérée par handleCloseConfigPanel
        // console.log("[BlocPlanningTemplateEditor] handleConfigurationChange - Fermeture du panel commentée pour test de visibilité.");
        // On s'attend à ce que AssignmentConfigPanel appelle son propre `onClose` ou que l'utilisateur ferme manuellement,
        // ce qui déclenchera handleCloseConfigPanel.
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
        onMuiModalOpenChange?.(true);
    };

    // Ouvrir le panel pour éditer une variation existante
    const handleEditVariation = (variation: ConfigurationVariation) => {
        console.log(`[!!! BlocPlanningTemplateEditor] DEBUT handleEditVariation. Variation reçue:`, JSON.parse(JSON.stringify(variation)));
        console.log(`[!!! BlocPlanningTemplateEditor] Avant setVariationPanelOpen(true). variationPanelOpen était: ${variationPanelOpen}`);
        setSelectedVariation(variation);
        setSelectedAffectationId(variation.affectationId);
        setVariationPanelOpen(true);
        onMuiModalOpenChange?.(true);
        console.log(`[!!! BlocPlanningTemplateEditor] APRES setVariationPanelOpen(true). variationPanelOpen devrait être true.`);
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
        console.log(`[BlocPlanningTemplateEditor] handleSaveVariation appelée avec:`, JSON.parse(JSON.stringify(updatedVariation)));
        const variationIndex = (template.variations || []).findIndex(v => v.id === updatedVariation.id);

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
        console.log('[BlocEditor DEBUG] handleUpdateAffectation - Affectation reçue pour mise à jour:', JSON.stringify(updatedAffectation, null, 2));
        console.log('[BlocEditor DEBUG] handleUpdateAffectation - Postes dans updatedAffectation.configuration:', JSON.stringify(updatedAffectation.configuration?.postes, null, 2));
        updateTemplate(prev => ({
            ...prev,
            affectations: prev.affectations.map(a =>
                a.id === updatedAffectation.id ? updatedAffectation : a
            )
        }));
        // Ne pas fermer le panel ici, laisser AssignmentConfigPanel le faire via onSave/onClose
    };

    // Valider la trame avant sauvegarde
    const validateTemplate = (): boolean => {
        const newErrors: Record<string, string> = {};
        console.log("[validateTemplate] Validation en cours pour la trame:", JSON.parse(JSON.stringify(template)));

        if (!template.nom.trim()) {
            newErrors.nom = 'Le nom de la trame est requis';
            console.log("[validateTemplate] Erreur: Nom de trame vide.");
        }

        // Vérifier que les affectations ouvertes ont au moins un poste requis
        // const invalidAffectation = template.affectations.find(a => a.ouvert && a.postesRequis < 1);
        const invalidAffectation = template.affectations.find(a => a.ouvert && (!a.postesRequis || a.postesRequis < 1));
        if (invalidAffectation) {
            // newErrors.affectations = `L'affectation ${invalidAffectation.type} du ${DAYS_LABEL[invalidAffectation.jour]} doit avoir au moins un poste requis`;
            newErrors.affectations = `L'affectation ${invalidAffectation.type} du ${DAYS_LABEL[invalidAffectation.jour]} (ID: ${invalidAffectation.id}) doit avoir au moins un poste requis (actuel: ${invalidAffectation.postesRequis}, ouvert: ${invalidAffectation.ouvert})`;
            console.log("[validateTemplate] Erreur: Affectation invalide trouvée:", JSON.parse(JSON.stringify(invalidAffectation)));
        }

        // Vérifier que les variations ont un nom
        const invalidVariation = template.variations?.find(v => !v.nom.trim());
        if (invalidVariation) {
            newErrors.variations = `Toutes les variations doivent avoir un nom`;
            console.log("[validateTemplate] Erreur: Variation avec nom vide trouvée.");
        }

        setErrors(newErrors);
        // return Object.keys(newErrors).length === 0;
        const isValid = Object.keys(newErrors).length === 0;
        console.log("[validateTemplate] Résultat de la validation:", isValid, "Erreurs:", newErrors);
        return isValid;
    };

    // Sauvegarder la trame
    const handleSaveTemplate = async () => {
        if (!validateTemplate()) {
            toast.error("Veuillez corriger les erreurs dans la trame avant de sauvegarder.");
            return;
        }
        setIsLoading(true);
        try {
            // Assurer que le template final a les rôles corrects (ceux de initialTemplate, car cet éditeur ne les modifie pas)
            const templateToSave = {
                ...template,
                roles: initialTemplate?.roles || template.roles || [RoleType.TOUS]
            };
            // Log amélioré pour voir les affectations
            console.log(
                '[BlocPlanningTemplateEditor] Contenu de templateToSave AVANT appel à props.onSave:',
                JSON.parse(JSON.stringify(templateToSave)), // Pour un affichage propre de l'objet
                `Nombre d\'affectations: ${templateToSave.affectations?.length || 0}`,
                'Affectations:',
                JSON.stringify(templateToSave.affectations, null, 2) // Affiche les affectations en détail
            );
            await onSave(templateToSave);
            toast.success("Trame sauvegardée avec succès !");
            setIsModified(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la trame:', error);
            setErrors({ save: 'Erreur lors de la sauvegarde de la trame' });
        } finally {
            setIsLoading(false);
        }
    };

    // Exposer la méthode submit via la ref
    useImperativeHandle(ref, () => ({
        submit: handleSaveTemplate,
        isDirty: () => isModified
    }));

    // Chargement des types d'affectations disponibles
    useEffect(() => {
        if (!availableAffectationTypes || availableAffectationTypes.length === 0) {
            // Le chargement initial des types est maintenant géré par TemplateManager
            // templateService.getAvailableAffectationTypes() ne devrait plus être appelé ici directement
            // Si la liste est vide, cela signifie que le parent n'a rien fourni ou que rien n'est disponible.
            console.warn("[BlocPlanningTemplateEditor] availableAffectationTypes est vide ou non fourni.");
        }
    }, [availableAffectationTypes]);

    // Nettoyage des variations qui référencent des affectations inexistantes
    useEffect(() => {
        if (template && Array.isArray(template.variations) && template.variations.length > 0) {
            const validAffectationIds = new Set(template.affectations.map(a => a.id));
            const invalidVariations = template.variations.filter(v => !validAffectationIds.has(v.affectationId));

            if (invalidVariations.length > 0) {
                console.warn(`[BlocPlanningTemplateEditor] ${invalidVariations.length} variations référencent des affectations inexistantes et seront supprimées.`,
                    invalidVariations.map(v => ({ id: v.id, affectationId: v.affectationId })));

                updateTemplate(prev => ({
                    ...prev,
                    variations: prev.variations?.filter(v => validAffectationIds.has(v.affectationId)) || []
                }));
            }
        }
    }, [template.affectations, template.variations, updateTemplate]);

    // Sécurisation des données du template
    useEffect(() => {
        // LOGS AJOUTÉS ICI pour déboguer template.affectations
        if (template) {
            console.log(`[BlocEditor debug] ID trame: ${template.id}`);
            console.log('[BlocEditor debug] Template état: ', JSON.parse(JSON.stringify(template || {})));

            // Validation et correction du template
            if (!template.affectations) {
                console.warn('[BlocEditor debug] template.affectations est undefined, initialisation avec []');
                updateTemplate(prev => ({
                    ...prev,
                    affectations: []
                }));
            } else if (!Array.isArray(template.affectations)) {
                console.warn('[BlocEditor debug] template.affectations n\'est pas un array, conversion en []');
                updateTemplate(prev => ({
                    ...prev,
                    affectations: []
                }));
            }

            // Validation des variations
            if (!template.variations) {
                updateTemplate(prev => ({
                    ...prev,
                    variations: []
                }));
            }
        }
    }, [template, updateTemplate]);

    const loadTrames = useCallback(async (id: string) => {
        if (!id) return;

        setIsLoading(true);
        try {
            // console.log(`[BlocEditor loadTrames] ID reçu: ${id}`);

            // Recherche de la trame dans les templates fournis par les props
            const tramePourEdition = templatesFromProps?.find(t => String(t.id) === String(id));

            if (tramePourEdition) {
                // console.log(`[BlocEditor loadTrames] tramePourEdition (avant typeof check): `, tramePourEdition);

                // Vérification et normalisation des affectations et variations
                const affectations = Array.isArray(tramePourEdition.affectations) ? tramePourEdition.affectations : [];
                const variations = Array.isArray(tramePourEdition.variations) ? tramePourEdition.variations : [];

                // Vérifier si le template actuel est déjà identique à tramePourEdition (pour éviter les mises à jour inutiles)
                if (template.id !== tramePourEdition.id ||
                    template.nom !== tramePourEdition.nom ||
                    template.description !== tramePourEdition.description ||
                    JSON.stringify(template.affectations || []) !== JSON.stringify(affectations) ||
                    JSON.stringify(template.variations || []) !== JSON.stringify(variations)) {

                    // Mise à jour du template uniquement si différent
                    // console.log(`[BlocEditor loadTrames] Mise à jour du template avec la trame trouvée.`);
                    setTemplate({
                        ...tramePourEdition,
                        affectations,
                        variations,
                    });
                    setIsModified(false);
                } else {
                    // console.log(`[BlocEditor loadTrames] Template déjà à jour, pas de setTemplate.`);
                }
            } else {
                setError(`Trame avec id ${id} non trouvée.`);
            }
        } catch (err) {
            console.error(`[BlocEditor loadTrames] Erreur:`, err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, [templatesFromProps, setTemplate, setIsLoading, setError, setIsModified]);

    // useEffect principal pour gérer le chargement et l'initialisation du template
    // Dépendances : uniquement les props et les callbacks stables, pas template
    useEffect(() => {
        // console.log("[BlocEditor useEffect]", { initialTplId: initialTemplate?.id, selectedId: selectedTemplateId, currentTplId: template.id });

        // Si un ID est sélectionné et qu'il est différent du template actuel, charger la trame
        if (selectedTemplateId && selectedTemplateId !== template.id) {
            // console.log(`[BlocEditor useEffect] Chargement via selectedTemplateId: ${selectedTemplateId}`);
            loadTrames(selectedTemplateId);
            return; // Sortir pour éviter d'exécuter les autres branches
        }

        // Si pas d'ID sélectionné mais un initialTemplate fourni, l'utiliser si différent
        if (!selectedTemplateId && initialTemplate) {
            const currentAffectations = template.affectations || [];
            const initialAffectations = initialTemplate.affectations || [];
            const currentVariations = template.variations || [];
            const initialVariations = initialTemplate.variations || [];

            // Vérifier si le template actuel est déjà identique à initialTemplate
            if (template.id !== initialTemplate.id ||
                template.nom !== initialTemplate.nom ||
                JSON.stringify(currentAffectations) !== JSON.stringify(initialAffectations) ||
                JSON.stringify(currentVariations) !== JSON.stringify(initialVariations)) {

                // console.log("[BlocEditor useEffect] Application de initialTemplate");
                setTemplate({
                    ...initialTemplate,
                    affectations: initialAffectations,
                    variations: initialVariations,
                });
                setIsModified(false);
            }
            return; // Sortir pour éviter d'exécuter les autres branches
        }

        // Si ni ID sélectionné ni initialTemplate, et que le template n'est pas vide, le réinitialiser
        if (!selectedTemplateId && !initialTemplate && template.id !== EMPTY_TEMPLATE.id) {
            // console.log("[BlocEditor useEffect] Reset vers EMPTY_TEMPLATE");
            setTemplate(EMPTY_TEMPLATE);
            setIsModified(false);
            return;
        }

        // Cas où selectedTemplateId est égal à template.id mais initialTemplate a changé et a le même ID
        // (synchronisation avec initialTemplate si son contenu a changé)
        if (selectedTemplateId && selectedTemplateId === template.id &&
            initialTemplate && initialTemplate.id === selectedTemplateId) {

            const currentAffectations = template.affectations || [];
            const initialAffectations = initialTemplate.affectations || [];
            const currentVariations = template.variations || [];
            const initialVariations = initialTemplate.variations || [];

            if (template.nom !== initialTemplate.nom ||
                JSON.stringify(currentAffectations) !== JSON.stringify(initialAffectations) ||
                JSON.stringify(currentVariations) !== JSON.stringify(initialVariations)) {

                // console.log("[BlocEditor useEffect] Synchronisation avec initialTemplate (même ID)");
                setTemplate({
                    ...initialTemplate,
                    affectations: initialAffectations,
                    variations: initialVariations,
                });
                setIsModified(false);
            }
        }
    }, [initialTemplate, selectedTemplateId, loadTrames, template.id, setIsModified]);

    // Gestion du changement de `isLoadingProp` venant du parent
    useEffect(() => {
        setIsLoading(isLoadingProp);
    }, [isLoadingProp]);

    // Si initialTemplate est undefined et qu'on est en mode création (pas d'ID sélectionné)
    // s'assurer que le template local est EMPTY_TEMPLATE ou celui passé pour un nouveau template.
    // (Cette logique a été déplacée dans l'initialisation de useState et le useEffect principal)

    if (isLoading && !template) { // Afficher le chargement seulement si template n'est pas encore défini
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    // Rendu principal du composant
    return (
        <DndProvider backend={HTML5Backend}>
            <Box sx={{ p: 2, pt: 0 }}>
                {/* Section pour Nom, Description et Rôles avec Flexbox */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1, minWidth: { md: '300px' } }}>
                        <TextField
                            label="Nom de la trame"
                            value={template.nom}
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
                            value={template.description || ''}
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
                        {(template.roles && template.roles.length > 0) && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 0.5, color: 'text.secondary' }}>Rôles :</Typography>
                                {template.roles.map(role => (
                                    <Chip key={role} label={role} size="small" color="info" variant="filled" sx={{ borderRadius: '6px', fontWeight: 'medium' }} />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
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

                        {/* Zone d'affectations pour le jour sélectionné */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Affectations pour {DAYS_LABEL[currentViewingDay as DayOfWeek]}
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
                                            variations={template.variations || []}
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
                                                    console.log('[BlocPlanningTemplateEditor] ShadSelect onValueChange - new value (code):', value);
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
                                                                disabled={template.affectations.some(a => a.jour === currentViewingDay && a.type === activityTypeObj.code)}
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
                                            Ajouter Affectation(s)
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
                        // console.log("[BlocPlanningTemplateEditor] onClose du Dialog AssignmentConfigPanel (test avec IconButton). Reason:", reason);
                        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                            // console.log("[BlocPlanningTemplateEditor] Fermeture du Dialog AssignmentConfigPanel (test avec IconButton) via backdrop ou escape.");
                        }
                        handleCloseConfigPanel();
                    }}
                    fullWidth
                    maxWidth="md"
                    disablePortal
                    aria-labelledby="assignment-config-dialog-title"
                >
                    <DialogTitle id="assignment-config-dialog-title">
                        Configuration de l'affectation : {selectedAffectation.type} - {DAYS_LABEL[selectedAffectation.jour]}
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
                            // console.log('[BlocEditor DEBUG] Rendu Dialog pour AssignmentConfigPanel. configPanelOpen:', configPanelOpen);
                            // console.log('[BlocEditor DEBUG] selectedAffectation dans le rendu:', selectedAffectation ? JSON.parse(JSON.stringify(selectedAffectation)) : null);
                            if (isLoading) {
                                // console.log('[BlocEditor DEBUG] Affichage CircularProgress car isLoading est true.');
                                return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
                            }
                            if (!selectedAffectation) {
                                // console.error('[BlocEditor ERROR] selectedAffectation est null DANS LE RENDU du DialogContent. Ne devrait pas arriver si configPanelOpen est true ET selectedAffectation est la condition.');
                                return <Alert severity="error">Erreur: Aucune affectation sélectionnée pour la configuration.</Alert>;
                            }
                            // console.log('[BlocEditor DEBUG] Passage des props à AssignmentConfigPanel:', {
                            //     affectation: JSON.parse(JSON.stringify(selectedAffectation)),
                            //     availablePostes: availablePostes || [],
                            //     isLoading
                            // });
                            return (
                                <AssignmentConfigPanel
                                    affectation={selectedAffectation}
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
                        // console.log("[BlocPlanningTemplateEditor] onClose du Dialog VariationConfigPanel. Reason:", reason);
                        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                            // console.log("[BlocPlanningTemplateEditor] Fermeture du Dialog VariationConfigPanel via backdrop ou escape.");
                        }
                        handleCloseVariationPanel();
                    }}
                    fullWidth
                    maxWidth="lg"
                    disablePortal
                    PaperProps={{
                        sx: { /* Styles originaux à conserver si présents, sinon supprimer sx */ },
                        onClick: (e: React.MouseEvent) => {
                            // console.log('[MUI Dialog Paper] onClick event on VariationConfigPanel');
                            e.stopPropagation();
                        },
                        onPointerDown: (e: React.PointerEvent) => {
                            // console.log('[MUI Dialog Paper] onPointerDown event on VariationConfigPanel');
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
        </DndProvider>
    );
});

export default BlocPlanningTemplateEditor; 