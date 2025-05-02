'use client';

import React, { useState, useEffect } from 'react';
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
    Card,
    CardContent
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import {
    PlusCircle,
    PencilLine,
    Trash2,
    AlertCircle,
    Palette,
    Layers
} from 'lucide-react';

import { BlocSector, OperatingRoom } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';

// Interface pour le formulaire de secteur
interface SecteurFormData {
    id?: string;
    nom: string;
    description: string;
    couleur: string;
    specialites: string[];
    estActif: boolean;
    requiresSpecificSkills: boolean;
    supervisionSpeciale: boolean;
}

// Palettes de couleurs prédéfinies pour les secteurs
const COLOR_PRESETS = [
    '#3B82F6', // Bleu
    '#10B981', // Vert
    '#EF4444', // Rouge
    '#F59E0B', // Orange
    '#8B5CF6', // Violet
    '#EC4899', // Rose
    '#6366F1', // Indigo
    '#D946EF', // Fuchsia
    '#0EA5E9', // Bleu ciel
    '#14B8A6', // Turquoise
    '#F97316', // Orange foncé
    '#8B5CF6', // Violet
];

/**
 * Composant d'administration des secteurs du bloc opératoire
 */
export default function SecteursAdmin() {
    // États
    const [secteurs, setSecteurs] = useState<BlocSector[]>([]);
    const [salles, setSalles] = useState<OperatingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [currentSecteur, setCurrentSecteur] = useState<SecteurFormData | null>(null);
    const [specialiteInput, setSpecialiteInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Charger les données initiales
    useEffect(() => {
        loadData();
    }, []);

    // Fonction pour charger les données
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [secteursData, sallesData] = await Promise.all([
                blocPlanningService.getAllSectors(),
                blocPlanningService.getAllOperatingRooms()
            ]);
            setSecteurs(secteursData);
            setSalles(sallesData);
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error('Erreur de chargement:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Ouvrir le dialogue pour ajouter un nouveau secteur
    const handleAddSecteur = () => {
        setCurrentSecteur({
            nom: '',
            description: '',
            couleur: COLOR_PRESETS[0],
            specialites: [],
            estActif: true,
            requiresSpecificSkills: false,
            supervisionSpeciale: false
        });
        setShowDialog(true);
    };

    // Ouvrir le dialogue pour modifier un secteur existant
    const handleEditSecteur = (secteur: BlocSector) => {
        setCurrentSecteur({
            id: secteur.id,
            nom: secteur.nom,
            description: secteur.description || '',
            couleur: secteur.couleur || COLOR_PRESETS[0],
            specialites: secteur.specialites || [],
            estActif: secteur.estActif,
            requiresSpecificSkills: secteur.requiresSpecificSkills || false,
            supervisionSpeciale: secteur.supervisionSpeciale || false
        });
        setShowDialog(true);
    };

    // Ouvrir le dialogue de confirmation de suppression
    const handleDeleteClick = (secteur: BlocSector) => {
        setCurrentSecteur({
            id: secteur.id,
            nom: secteur.nom,
            description: secteur.description || '',
            couleur: secteur.couleur || '',
            specialites: secteur.specialites || [],
            estActif: secteur.estActif,
            requiresSpecificSkills: secteur.requiresSpecificSkills || false,
            supervisionSpeciale: secteur.supervisionSpeciale || false
        });
        setShowDeleteDialog(true);
    };

    // Confirmer la suppression d'un secteur
    const handleDeleteConfirm = async () => {
        if (!currentSecteur?.id) return;

        setIsSubmitting(true);
        try {
            await blocPlanningService.deleteSector(currentSecteur.id);
            setSecteurs(prev => prev.filter(s => s.id !== currentSecteur.id));
            toast({
                title: "Secteur supprimé",
                description: `Le secteur ${currentSecteur.nom} a été supprimé avec succès.`,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setShowDeleteDialog(false);
        }
    };

    // Gérer les changements du formulaire
    const handleInputChange = (field: keyof SecteurFormData, value: any) => {
        if (!currentSecteur) return;
        setCurrentSecteur({
            ...currentSecteur,
            [field]: value
        });
    };

    // Ajouter une spécialité à la liste
    const handleAddSpecialite = () => {
        if (!specialiteInput.trim() || !currentSecteur) return;

        if (!currentSecteur.specialites.includes(specialiteInput.trim())) {
            setCurrentSecteur({
                ...currentSecteur,
                specialites: [...currentSecteur.specialites, specialiteInput.trim()]
            });
        }
        setSpecialiteInput('');
    };

    // Supprimer une spécialité de la liste
    const handleRemoveSpecialite = (specialite: string) => {
        if (!currentSecteur) return;
        setCurrentSecteur({
            ...currentSecteur,
            specialites: currentSecteur.specialites.filter(s => s !== specialite)
        });
    };

    // Soumettre le formulaire
    const handleSubmit = async () => {
        if (!currentSecteur) return;

        // Validation
        if (!currentSecteur.nom.trim()) {
            toast({
                title: "Erreur de validation",
                description: "Le nom du secteur est obligatoire.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const secteurData: Omit<BlocSector, 'id' | 'salles'> = {
                nom: currentSecteur.nom.trim(),
                description: currentSecteur.description.trim() || undefined,
                couleur: currentSecteur.couleur,
                specialites: currentSecteur.specialites,
                estActif: currentSecteur.estActif,
                requiresSpecificSkills: currentSecteur.requiresSpecificSkills,
                supervisionSpeciale: currentSecteur.supervisionSpeciale
            };

            let updatedSecteur: BlocSector;

            if (currentSecteur.id) {
                // Mise à jour
                const existingSecteur = secteurs.find(s => s.id === currentSecteur.id);
                if (!existingSecteur) throw new Error("Secteur introuvable");

                // On conserve la liste des salles
                updatedSecteur = await blocPlanningService.updateSector(
                    currentSecteur.id,
                    {
                        ...secteurData,
                        salles: existingSecteur.salles
                    }
                );
                setSecteurs(prev => prev.map(s => s.id === currentSecteur.id ? updatedSecteur : s));
                toast({
                    title: "Secteur mis à jour",
                    description: `Le secteur ${updatedSecteur.nom} a été mis à jour avec succès.`
                });
            } else {
                // Création
                updatedSecteur = await blocPlanningService.createSector({
                    ...secteurData,
                    salles: [] // Nouvelle section sans salles
                });
                setSecteurs(prev => [...prev, updatedSecteur]);
                toast({
                    title: "Secteur ajouté",
                    description: `Le secteur ${updatedSecteur.nom} a été ajouté avec succès.`
                });
            }

            setShowDialog(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Compter le nombre de salles dans un secteur
    const countRoomsInSector = (secteurId: string) => {
        return salles.filter(salle => salle.secteurId === secteurId).length;
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Secteurs du bloc opératoire</h2>
                <Button onClick={handleAddSecteur}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter un secteur
                </Button>
            </div>

            {isLoading ? (
                <p className="text-center py-4">Chargement des secteurs...</p>
            ) : secteurs.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        Aucun secteur n'a été configuré.
                        <div className="mt-4">
                            <Button variant="outline" onClick={handleAddSecteur}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Ajouter votre premier secteur
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Table>
                    <TableCaption>Liste des secteurs configurés</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/6">Couleur</TableHead>
                            <TableHead className="w-1/4">Nom</TableHead>
                            <TableHead className="w-1/4">Description</TableHead>
                            <TableHead className="w-1/6">Salles</TableHead>
                            <TableHead className="w-1/6">Statut</TableHead>
                            <TableHead className="w-1/6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {secteurs.map(secteur => (
                            <TableRow key={secteur.id}>
                                <TableCell>
                                    <div
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: secteur.couleur || '#CBD5E1' }}
                                        title={secteur.couleur}
                                    />
                                </TableCell>
                                <TableCell><strong>{secteur.nom}</strong></TableCell>
                                <TableCell>{secteur.description || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Layers className="h-3 w-3" />
                                        {countRoomsInSector(secteur.id)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {secteur.estActif ? (
                                        <Badge variant="success">Actif</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactif</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditSecteur(secteur)}
                                        title="Modifier"
                                    >
                                        <PencilLine className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClick(secteur)}
                                        title="Supprimer"
                                        disabled={countRoomsInSector(secteur.id) > 0}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Dialogue d'ajout/modification */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>
                            {currentSecteur?.id ? 'Modifier le secteur' : 'Ajouter un secteur'}
                        </DialogTitle>
                        <DialogDescription>
                            {currentSecteur?.id
                                ? 'Modifiez les informations du secteur du bloc opératoire.'
                                : 'Créez un nouveau secteur en remplissant le formulaire ci-dessous.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nom" className="text-right">
                                Nom <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nom"
                                value={currentSecteur?.nom || ''}
                                onChange={(e) => handleInputChange('nom', e.target.value)}
                                placeholder="Ex: Orthopédie"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={currentSecteur?.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Description du secteur (optionnel)"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="couleur">
                                Couleur <Palette className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                            </Label>
                            <div className="flex gap-2 flex-wrap">
                                <Input
                                    id="couleur"
                                    type="color"
                                    value={currentSecteur?.couleur || '#3B82F6'}
                                    onChange={(e) => handleInputChange('couleur', e.target.value)}
                                    className="w-20 h-10 p-1"
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {COLOR_PRESETS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border ${currentSecteur?.couleur === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleInputChange('couleur', color)}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Spécialités associées</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={specialiteInput}
                                    onChange={(e) => setSpecialiteInput(e.target.value)}
                                    placeholder="Ajouter une spécialité"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSpecialite();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddSpecialite}
                                >
                                    <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
                                </Button>
                            </div>

                            {currentSecteur?.specialites && currentSecteur.specialites.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {currentSecteur.specialites.map((specialite, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                            {specialite}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 ml-1"
                                                onClick={() => handleRemoveSpecialite(specialite)}
                                            >
                                                <span className="sr-only">Supprimer</span>
                                                ×
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Aucune spécialité ajoutée
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="estActif"
                                    checked={currentSecteur?.estActif || false}
                                    onCheckedChange={(checked) =>
                                        handleInputChange('estActif', checked === true)
                                    }
                                />
                                <Label htmlFor="estActif">
                                    Secteur actif et disponible pour la planification
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="requiresSpecificSkills"
                                    checked={currentSecteur?.requiresSpecificSkills || false}
                                    onCheckedChange={(checked) =>
                                        handleInputChange('requiresSpecificSkills', checked === true)
                                    }
                                />
                                <Label htmlFor="requiresSpecificSkills">
                                    Requiert des compétences spécifiques
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="supervisionSpeciale"
                                    checked={currentSecteur?.supervisionSpeciale || false}
                                    onCheckedChange={(checked) =>
                                        handleInputChange('supervisionSpeciale', checked === true)
                                    }
                                />
                                <Label htmlFor="supervisionSpeciale">
                                    Nécessite une supervision particulière
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDialog(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Enregistrement...'
                                : currentSecteur?.id
                                    ? 'Enregistrer les modifications'
                                    : 'Ajouter le secteur'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogue de confirmation de suppression */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le secteur {currentSecteur?.nom} ?
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
                        <p className="text-yellow-800 text-sm">
                            <AlertCircle className="h-4 w-4 inline-block mr-2 text-yellow-500" />
                            Vous ne pouvez pas supprimer un secteur contenant des salles.
                            Veuillez d'abord réaffecter toutes les salles de ce secteur.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isSubmitting || countRoomsInSector(currentSecteur?.id || '') > 0}
                        >
                            {isSubmitting ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 