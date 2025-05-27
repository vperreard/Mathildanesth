import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Chip,
    Stack,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Trash as DeleteIcon,
    Plus,
    Clock as ClockIcon,
    GripVertical as DragIcon
} from 'lucide-react';
import {
    TemplateAffectation,
    AssignmentConfigPanelProps,
    AffectationConfiguration,
    PosteConfiguration,
    PosteStatus,
    SkillLevel
} from '../types/modèle';
import { useDrag, useDrop } from 'react-dnd';

// Type d'élément pour le drag and drop
const POSTE_TYPE = 'poste';

interface DraggablePosteProps {
    poste: PosteConfiguration;
    index: number;
    onUpdate: (posteId: string, field: keyof PosteConfiguration, value: any) => void;
    onDelete: (posteId: string) => void;
    movePoste: (dragIndex: number, hoverIndex: number) => void;
}

/**
 * Composant pour un poste déplaçable
 */
const DraggablePoste: React.FC<DraggablePosteProps> = ({
    poste,
    index,
    onUpdate,
    onDelete,
    movePoste
}) => {
    // Configuration du drag and drop
    const [{ isDragging }, dragRef] = useDrag({
        type: POSTE_TYPE,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    const [, dropRef] = useDrop({
        accept: POSTE_TYPE,
        hover: (item: { index: number }) => {
            if (item.index !== index) {
                movePoste(item.index, index);
                item.index = index;
            }
        }
    });

    // Combine drag and drop refs
    const ref = (node: HTMLDivElement | null) => {
        dragRef(node);
        dropRef(node);
    };

    return (
        <Paper
            ref={ref}
            variant="outlined"
            sx={{
                mb: 2,
                p: 2,
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: 1 }
            }}
        >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '30px' }}>
                    <DragIcon size={20} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Nom du poste"
                        value={poste.nom}
                        onChange={(e) => onUpdate(poste.id, 'nom', e.target.value)}
                    />
                </Box>
                <Box sx={{ flex: { xs: '1 1 45%', md: '0 1 15%' } }}>
                    <TextField
                        label="Quantité"
                        type="number"
                        size="small"
                        fullWidth
                        value={poste.quantite}
                        onChange={(e) => onUpdate(poste.id, 'quantite', parseInt(e.target.value, 10) || 0)}
                        inputProps={{ min: 0 }}
                    />
                </Box>
                <Box sx={{ flex: { xs: '1 1 45%', md: '1 1 25%' } }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={poste.status}
                            label="Statut"
                            onChange={(e) => onUpdate(poste.id, 'status', e.target.value)}
                        >
                            <MenuItem value="REQUIS">Requis</MenuItem>
                            <MenuItem value="OPTIONNEL">Optionnel</MenuItem>
                            <MenuItem value="INDISPONIBLE">Indisponible</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 85%', md: '1 1 20%' } }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Niveau</InputLabel>
                        <Select
                            value={poste.competencesRequises || ''}
                            label="Niveau"
                            onChange={(e) => onUpdate(poste.id, 'competencesRequises', e.target.value)}
                        >
                            <MenuItem value="">Non spécifié</MenuItem>
                            <MenuItem value="JUNIOR">Junior</MenuItem>
                            <MenuItem value="INTERMEDIAIRE">Intermédiaire</MenuItem>
                            <MenuItem value="SENIOR">Senior</MenuItem>
                            <MenuItem value="EXPERT">Expert</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '0 1 auto', md: '0 1 auto' }, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                        edge="end"
                        color="error"
                        onClick={() => onDelete(poste.id)}
                    >
                        <DeleteIcon size={18} />
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};

/**
 * Composant pour configurer une garde/vacation spécifique
 */
const AssignmentConfigPanel: React.FC<AssignmentConfigPanelProps> = ({
    garde/vacation,
    onChange: onChangeProp,
    availablePostes,
    isLoading = false
}) => {
    console.log('[AssignmentConfigPanel DEBUG] Composant monté/rendu. Props reçues - garde/vacation:', JSON.parse(JSON.stringify(garde/vacation)), 'isLoading:', isLoading);

    // Typer explicitement la callback pour clarifier l'intention
    const onChange = onChangeProp as (config: AffectationConfiguration) => void;

    // Ref pour suivre le montage initial
    const isInitialMount = useRef(true);

    // Utiliser une ref pour la fonction onChange pour éviter de redéclencher l'effet si seule sa référence change
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // State local pour la configuration en cours d'édition
    const [config, setConfig] = useState<AffectationConfiguration>(() => {
        const initialConfig = garde/vacation.configuration;
        const affectationEstOuverte = garde/vacation.ouvert; // Lire l'état 'ouvert' de l'garde/vacation parente

        if (initialConfig && initialConfig.postes && initialConfig.postes.length > 0 && initialConfig.postes.every(p => p.quantite > 0)) {
            // Si une config avec des postes valides (quantité > 0) existe, l'utiliser
            return initialConfig;
        } else if (affectationEstOuverte) {
            // Si l'garde/vacation est ouverte mais n'a pas de postes valides dans sa config
            // initialiser avec un poste par défaut.
            // Conserver le nom et les heures de la config si existants
            return {
                id: initialConfig?.id || `conf_${Date.now()}`,
                nom: initialConfig?.nom || '',
                postes: [{
                    id: `poste_${Date.now()}_default_${Math.random().toString(36).substring(2, 7)}`,
                    nom: 'Personnel requis', // Nom par défaut
                    quantite: 1,
                    status: 'REQUIS' as PosteStatus,
                    competencesRequises: undefined
                }],
                heureDebut: initialConfig?.heureDebut || '',
                heureFin: initialConfig?.heureFin || '',
            };
        } else {
            // Si l'garde/vacation est fermée ou n'a pas de config / postes valides, initialiser avec postes vides
            return {
                id: initialConfig?.id || `conf_${Date.now()}`,
                nom: initialConfig?.nom || '',
                postes: [],
                heureDebut: initialConfig?.heureDebut || '',
                heureFin: initialConfig?.heureFin || '',
            };
        }
    });

    // State pour le nouveau poste en cours d'ajout
    const [newPoste, setNewPoste] = useState<Partial<PosteConfiguration>>({
        nom: '',
        quantite: 1,
        status: 'REQUIS' as PosteStatus
    });

    // States pour les heures
    const [heureDebut, setHeureDebut] = useState(config.heureDebut || '');
    const [heureFin, setHeureFin] = useState(config.heureFin || '');

    // State pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Met à jour la configuration parent lors des changements
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            // console.log('[AssignmentConfigPanel DEBUG] useEffect config change - Premier rendu, onChange non appelé.');
        } else {
            // console.log('[AssignmentConfigPanel DEBUG] useEffect config change - Changement détecté, appel de onChangeRef.current avec:', config);
            onChangeRef.current(config); // Utiliser la réf
        }
    }, [config]); // Ne dépendre que de config

    // Mettre à jour les heures lors du chargement initial
    useEffect(() => {
        if (config.heureDebut) setHeureDebut(config.heureDebut);
        if (config.heureFin) setHeureFin(config.heureFin);
    }, [config.heureDebut, config.heureFin]);

    // Gestion des changements de la configuration globale
    const handleConfigChange = (field: keyof AffectationConfiguration, value: any) => {
        console.log('[AssignmentConfigPanel DEBUG] handleConfigChange - Field:', field, 'Value:', value);
        console.log('[AssignmentConfigPanel DEBUG] État actuel de config avant mise à jour:', JSON.stringify(config, null, 2));

        setConfig(prev => {
            const newConfig = { ...prev, [field]: value };
            console.log('[AssignmentConfigPanel DEBUG] Nouveau config après mise à jour:', JSON.stringify(newConfig, null, 2));
            return newConfig;
        });
    };

    // Gestion des changements d'heure de début
    const handleHeureDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHeureDebut(value);
        handleConfigChange('heureDebut', value);
    };

    // Gestion des changements d'heure de fin
    const handleHeureFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHeureFin(value);
        handleConfigChange('heureFin', value);
    };

    // Gestion des changements pour le nouveau poste
    const handleNewPosteChange = (field: keyof PosteConfiguration, value: any) => {
        setNewPoste(prev => {
            const updatedNewPoste = { ...prev, [field]: value };
            console.log('[AssignmentConfigPanel DEBUG] handleNewPosteChange - Field:', field, 'Value:', value, 'New newPoste state:', updatedNewPoste);
            return updatedNewPoste;
        });
    };

    // Validation du nouveau poste
    const validateNewPoste = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!newPoste.nom) {
            newErrors.newPoste = 'Le nom du poste est requis';
        } else if (config.postes.some(p => p.nom === newPoste.nom)) {
            newErrors.newPoste = 'Ce poste existe déjà dans cette configuration';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Ajout d'un nouveau poste
    const handleAddPoste = () => {
        if (!validateNewPoste()) return;

        setConfig(prev => {
            if (!prev) return prev;
            const newPosteToAdd: PosteConfiguration = {
                id: `poste_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                // S'assurer que les champs requis de PosteConfiguration sont fournis
                // et que les types correspondent.
                nom: newPoste.nom || 'Poste par défaut', // Fournir un fallback si newPoste.nom est undefined ou vide
                quantite: newPoste.quantite !== undefined ? newPoste.quantite : 1, // Fallback pour quantite
                status: newPoste.status || 'REQUIS', // Fallback pour status
                competencesRequises: newPoste.competencesRequises, // Est optionnel, donc newPoste.competencesRequises (qui peut être undefined) est OK
                // Les autres champs de newPoste (s'il y en a) qui sont aussi dans PosteConfiguration 
                // et optionnels peuvent être spreadés ou assignés individuellement si nécessaire.
                // Pour l'instant, on se concentre sur les champs directement gérés par le formulaire d'ajout.
            };
            const updatedPostes = [...prev.postes, newPosteToAdd];
            const newConfig = { ...prev, postes: updatedPostes };
            console.log('[AssignmentConfigPanel DEBUG] handleAddPoste - newConfig après ajout poste:', JSON.stringify(newConfig, null, 2));
            return newConfig;
        });

        // Réinitialiser le formulaire pour le nouveau poste
        setNewPoste({
            nom: '',
            quantite: 1,
            status: 'REQUIS',
            competencesRequises: undefined
        });
        setErrors({});
    };

    // Supprimer un poste
    const handleDeletePoste = (posteId: string) => {
        setConfig(prev => {
            if (!prev) return prev;
            const updatedPostes = prev.postes.filter(p => p.id !== posteId);
            const newConfig = { ...prev, postes: updatedPostes };
            console.log('[AssignmentConfigPanel DEBUG] handleDeletePoste - newConfig après suppression poste:', JSON.stringify(newConfig, null, 2));
            // Si onChangeProp doit être appelé ici, ce serait :
            // onChangeProp(newConfig);
            return newConfig;
        });
    };

    // Mettre à jour un poste existant
    const handleUpdatePoste = (posteId: string, field: keyof PosteConfiguration, value: any) => {
        console.log('[AssignmentConfigPanel DEBUG] handleUpdatePoste - Poste ID:', posteId, 'Field:', field, 'Value:', value);
        setConfig(prev => {
            if (!prev) return prev;
            const updatedPostes = prev.postes.map(p =>
                p.id === posteId ? { ...p, [field]: value } : p
            );
            const newConfig = { ...prev, postes: updatedPostes };
            console.log('[AssignmentConfigPanel DEBUG] handleUpdatePoste - newConfig après mise à jour poste:', JSON.stringify(newConfig, null, 2));
            // Si onChangeProp doit être appelé ici, ce serait :
            // onChangeProp(newConfig);
            return newConfig;
        });
    };

    // Déplacer un poste (drag-and-drop)
    const movePoste = useCallback((dragIndex: number, hoverIndex: number) => {
        setConfig(prev => {
            const newPostes = [...prev.postes];
            const draggedPoste = newPostes[dragIndex];

            newPostes.splice(dragIndex, 1);
            newPostes.splice(hoverIndex, 0, draggedPoste);

            return {
                ...prev,
                postes: newPostes
            };
        });
    }, []);

    // Suggérer un poste depuis la liste disponible
    const handleSuggestionSelect = (nom: string) => {
        console.log('[AssignmentConfigPanel DEBUG] handleSuggestionSelect - Suggestion cliquée:', nom);
        setNewPoste(prev => ({
            ...prev,
            nom
        }));
    };

    return (
        <Card>
            <CardHeader
                title={`Configuration: ${garde/vacation.type} - ${garde/vacation.jour}`}
                subheader="Configurez les détails de cette garde/vacation"
            />
            <Divider />
            <CardContent>
                {/* Information de base de la configuration */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                        <TextField
                            fullWidth
                            label="Nom de la configuration"
                            value={config.nom || ''}
                            onChange={(e) => handleConfigChange('nom', e.target.value)}
                            placeholder={`${garde/vacation.type} ${garde/vacation.jour}`}
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                        <TextField
                            label="Heure de début"
                            type="time"
                            fullWidth
                            value={heureDebut}
                            onChange={handleHeureDebutChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                        <TextField
                            label="Heure de fin"
                            type="time"
                            fullWidth
                            value={heureFin}
                            onChange={handleHeureFinChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Section des postes requis */}
                <Typography variant="h6" gutterBottom>
                    Postes requis
                </Typography>

                {config.postes.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Aucun poste configuré pour cette garde/vacation. Ajoutez des postes ci-dessous.
                    </Alert>
                ) : (
                    <Box sx={{ mb: 3 }}>
                        {config.postes.map((poste, index) => (
                            <DraggablePoste
                                key={poste.id}
                                poste={poste}
                                index={index}
                                onUpdate={handleUpdatePoste}
                                onDelete={handleDeletePoste}
                                movePoste={movePoste}
                            />
                        ))}
                    </Box>
                )}

                {/* Formulaire d'ajout de poste */}
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Ajouter un nouveau poste
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                            <TextField
                                fullWidth
                                label="Nom du poste"
                                value={newPoste.nom}
                                onChange={(e) => handleNewPosteChange('nom', e.target.value)}
                                error={!!errors.newPoste}
                                helperText={errors.newPoste}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                            <TextField
                                fullWidth
                                label="Quantité"
                                type="number"
                                size="small"
                                value={newPoste.quantite}
                                onChange={(e) => handleNewPosteChange('quantite', parseInt(e.target.value, 10) || 0)}
                                inputProps={{ min: 0 }}
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 50%', md: '1 1 25%' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={newPoste.status}
                                    label="Statut"
                                    onChange={(e) => handleNewPosteChange('status', e.target.value)}
                                >
                                    <MenuItem value="REQUIS">Requis</MenuItem>
                                    <MenuItem value="OPTIONNEL">Optionnel</MenuItem>
                                    <MenuItem value="INDISPONIBLE">Indisponible</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={<Plus size={16} />}
                                onClick={handleAddPoste}
                                disabled={isLoading || !newPoste.nom}
                            >
                                Ajouter
                            </Button>
                        </Box>
                    </Box>

                    {/* Suggestions de postes */}
                    {availablePostes.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" gutterBottom>
                                Suggestions de postes:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {availablePostes
                                    .filter(p => !config.postes.some(cp => cp.nom === p))
                                    .map(poste => (
                                        <Chip
                                            key={poste}
                                            label={poste}
                                            size="small"
                                            onClick={() => handleSuggestionSelect(poste)}
                                            clickable
                                        />
                                    ))
                                }
                            </Stack>
                        </Box>
                    )}
                </Card>

                <Divider sx={{ my: 3 }} />

                {/* Options supplémentaires */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                        <TextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={2}
                            value={config.notes || ''}
                            onChange={(e) => handleConfigChange('notes', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                        <TextField
                            fullWidth
                            label="Emplacement physique"
                            value={config.emplacementPhysique || ''}
                            onChange={(e) => handleConfigChange('emplacementPhysique', e.target.value)}
                            placeholder="Salle, bloc, étage..."
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default AssignmentConfigPanel; 