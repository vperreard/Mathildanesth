'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import {
    BlocDayPlanning,
    OperatingRoom,
    BlocSector,
    SupervisionRule,
    BlocRoomAssignment,
    BlocSupervisor
} from '@/types/bloc-planning-types';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Plus,
    Trash2,
    Clock,
    User,
    Users,
    AlertCircle,
    Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { User as UserType } from '@/types/user';

interface BlocPlanningEditorProps {
    date: Date;
    planning: BlocDayPlanning | null;
    salles: OperatingRoom[];
    secteurs: BlocSector[];
    rules: SupervisionRule[];
    onPlanningChange: (planning: BlocDayPlanning) => void;
}

const BlocPlanningEditor: React.FC<BlocPlanningEditorProps> = ({
    date,
    planning,
    salles,
    secteurs,
    rules,
    onPlanningChange
}) => {
    const [availableSupervisors, setAvailableSupervisors] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [validation, setValidation] = useState<{
        isValid: boolean;
        errors: unknown[];
        warnings: unknown[];
        infos: unknown[];
    }>({ isValid: true, errors: [], warnings: [], infos: [] });
    const [workingPlanning, setWorkingPlanning] = useState<BlocDayPlanning | null>(null);
    const [activeSalleId, setActiveSalleId] = useState<string | null>(null);

    // Initialiser le planning de travail
    useEffect(() => {
        if (planning) {
            setWorkingPlanning(planning);
        } else if (date) {
            // Créer un nouveau planning si aucun n'existe
            const newPlanning: BlocDayPlanning = {
                id: uuidv4(),
                date: format(date, 'yyyy-MM-dd'),
                salles: [],
                validationStatus: 'BROUILLON'
            };
            setWorkingPlanning(newPlanning);
        }
    }, [planning, date]);

    // Charger les superviseurs disponibles
    useEffect(() => {
        const loadSupervisors = async () => {
            setLoading(true);
            try {
                const supervisors = await blocPlanningService.getAvailableSupervisors(format(date, 'yyyy-MM-dd'));
                setAvailableSupervisors(supervisors);
            } catch (error: unknown) {
                logger.error("Erreur lors du chargement des superviseurs:", { error: error });
            } finally {
                setLoading(false);
            }
        };

        if (date) {
            loadSupervisors();
        }
    }, [date]);

    // Propager les changements vers le composant parent
    useEffect(() => {
        if (workingPlanning) {
            onPlanningChange(workingPlanning);
        }
    }, [workingPlanning, onPlanningChange]);

    // Ajouter une salle au planning
    const handleAddSalle = (salleId: string) => {
        if (!workingPlanning) return;

        // Vérifier si la salle existe déjà dans le planning
        const salleExistante = workingPlanning.salles.find(s => s.salleId === salleId);
        if (salleExistante) return;

        const nouvelleSalle: BlocRoomAssignment = {
            id: uuidv4(),
            salleId,
            superviseurs: [],
            notes: ""
        };

        setWorkingPlanning({
            ...workingPlanning,
            salles: [...workingPlanning.salles, nouvelleSalle]
        });

        // Définir la salle nouvellement ajoutée comme active
        setActiveSalleId(nouvelleSalle.id);
    };

    // Supprimer une salle du planning
    const handleRemoveSalle = (assignmentId: string) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.filter(s => s.id !== assignmentId);

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });

        // Si la salle active est supprimée, réinitialiser
        if (activeSalleId === assignmentId) {
            setActiveSalleId(newSalles.length > 0 ? newSalles[0].id : null);
        }
    };

    // Ajouter un superviseur à une salle
    const handleAddSupervisor = (assignmentId: string) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: [
                        ...salle.superviseurs,
                        {
                            id: uuidv4(),
                            userId: "",
                            role: 'PRINCIPAL',
                            periodes: [{ debut: "08:00", fin: "12:00" }]
                        }
                    ]
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Supprimer un superviseur d'une salle
    const handleRemoveSupervisor = (assignmentId: string, supervisorId: string) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: salle.superviseurs.filter(s => s.id !== supervisorId)
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Mettre à jour un superviseur
    const handleUpdateSupervisor = (assignmentId: string, supervisorId: string, updates: Partial<BlocSupervisor>) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: salle.superviseurs.map(s => {
                        if (s.id === supervisorId) {
                            return { ...s, ...updates };
                        }
                        return s;
                    })
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Ajouter une période pour un superviseur
    const handleAddPeriode = (assignmentId: string, supervisorId: string) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: salle.superviseurs.map(s => {
                        if (s.id === supervisorId) {
                            return {
                                ...s,
                                periodes: [...s.periodes, { debut: "14:00", fin: "18:00" }]
                            };
                        }
                        return s;
                    })
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Supprimer une période d'un superviseur
    const handleRemovePeriode = (assignmentId: string, supervisorId: string, index: number) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: salle.superviseurs.map(s => {
                        if (s.id === supervisorId) {
                            const newPeriodes = [...s.periodes];
                            newPeriodes.splice(index, 1);
                            return {
                                ...s,
                                periodes: newPeriodes
                            };
                        }
                        return s;
                    })
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Mettre à jour une période
    const handleUpdatePeriode = (
        assignmentId: string,
        supervisorId: string,
        index: number,
        field: 'debut' | 'fin',
        value: string
    ) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return {
                    ...salle,
                    superviseurs: salle.superviseurs.map(s => {
                        if (s.id === supervisorId) {
                            const newPeriodes = [...s.periodes];
                            newPeriodes[index] = {
                                ...newPeriodes[index],
                                [field]: value
                            };
                            return {
                                ...s,
                                periodes: newPeriodes
                            };
                        }
                        return s;
                    })
                };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Mettre à jour les notes d'une salle
    const handleUpdateSalleNotes = (assignmentId: string, notes: string) => {
        if (!workingPlanning) return;

        const newSalles = workingPlanning.salles.map(salle => {
            if (salle.id === assignmentId) {
                return { ...salle, notes };
            }
            return salle;
        });

        setWorkingPlanning({
            ...workingPlanning,
            salles: newSalles
        });
    };

    // Mettre à jour les notes du planning
    const handleUpdatePlanningNotes = (notes: string) => {
        if (!workingPlanning) return;

        setWorkingPlanning({
            ...workingPlanning,
            notes
        });
    };

    // Mettre à jour le statut de validation
    const handleUpdateValidationStatus = (status: 'BROUILLON' | 'PROPOSE' | 'VALIDE' | 'PUBLIE') => {
        if (!workingPlanning) return;

        setWorkingPlanning({
            ...workingPlanning,
            validationStatus: status
        });
    };

    // Obtenir le nom de la salle
    const getSalleName = (salleId: string): string => {
        const salle = salles.find(s => s.id === salleId);
        return salle ? `Salle ${salle.numero}${salle.nom ? ` - ${salle.nom}` : ''}` : 'Salle inconnue';
    };

    // Obtenir le secteur d'une salle
    const getSecteurForSalle = (salleId: string): BlocSector | undefined => {
        const salle = salles.find(s => s.id === salleId);
        if (!salle) return undefined;
        return secteurs.find(s => s.id === salle.secteurId);
    };

    // Filtrer les salles qui ne sont pas encore dans le planning
    const getSallesDisponibles = (): OperatingRoom[] => {
        if (!workingPlanning) return salles;
        const sallesUtilisees = new Set(workingPlanning.salles.map(s => s.salleId));
        return salles.filter(salle => !sallesUtilisees.has(salle.id));
    };

    // Affichage du panneau d'édition d'une salle
    const renderSalleEditionPanel = (assignmentId: string) => {
        if (!workingPlanning) return null;

        const salleAssignment = workingPlanning.salles.find(s => s.id === assignmentId);
        if (!salleAssignment) return null;

        const salle = salles.find(s => s.id === salleAssignment.salleId);
        const secteur = salle ? getSecteurForSalle(salle.id) : undefined;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{getSalleName(salleAssignment.salleId)}</h3>
                        {secteur && (
                            <p className="text-sm text-muted-foreground">
                                Secteur: {secteur.nom}
                            </p>
                        )}
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSalle(assignmentId)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer la salle
                    </Button>
                </div>

                <Separator />

                <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Superviseurs
                    </h4>

                    {salleAssignment.superviseurs.length === 0 ? (
                        <p className="text-sm text-muted-foreground mb-4">Aucun superviseur assigné à cette salle</p>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {salleAssignment.superviseurs.map((superviseur, index) => (
                                <Card key={superviseur.id} className="border-l-4 border-l-blue-500">
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Superviseur {index + 1}
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveSupervisor(assignmentId, superviseur.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="py-2 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`superviseur-${superviseur.id}`}>Médecin</Label>
                                                <Select
                                                    value={superviseur.userId || ""}
                                                    onValueChange={(value) => handleUpdateSupervisor(assignmentId, superviseur.id, { userId: value })}
                                                >
                                                    <SelectTrigger id={`superviseur-${superviseur.id}`}>
                                                        <SelectValue placeholder="Sélectionner un médecin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSupervisors.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.firstName} {user.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`role-${superviseur.id}`}>Rôle</Label>
                                                <Select
                                                    value={superviseur.role}
                                                    onValueChange={(value: 'PRINCIPAL' | 'SECONDAIRE' | 'REMPLACANT') =>
                                                        handleUpdateSupervisor(assignmentId, superviseur.id, { role: value })
                                                    }
                                                >
                                                    <SelectTrigger id={`role-${superviseur.id}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PRINCIPAL">Principal</SelectItem>
                                                        <SelectItem value="SECONDAIRE">Secondaire</SelectItem>
                                                        <SelectItem value="REMPLACANT">Remplaçant</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label>Périodes de supervision</Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddPeriode(assignmentId, superviseur.id)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Ajouter période
                                                </Button>
                                            </div>

                                            {superviseur.periodes.map((periode, periodeIndex) => (
                                                <div key={periodeIndex} className="flex items-center gap-2 mb-2">
                                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="time"
                                                                value={periode.debut}
                                                                onChange={(e) => handleUpdatePeriode(
                                                                    assignmentId,
                                                                    superviseur.id,
                                                                    periodeIndex,
                                                                    'debut',
                                                                    e.target.value
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="time"
                                                                value={periode.fin}
                                                                onChange={(e) => handleUpdatePeriode(
                                                                    assignmentId,
                                                                    superviseur.id,
                                                                    periodeIndex,
                                                                    'fin',
                                                                    e.target.value
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                    {superviseur.periodes.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemovePeriode(assignmentId, superviseur.id, periodeIndex)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => handleAddSupervisor(assignmentId)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un superviseur
                    </Button>
                </div>

                <Separator />

                <div>
                    <Label htmlFor={`notes-${assignmentId}`} className="mb-2 block">Notes pour cette salle</Label>
                    <Textarea
                        id={`notes-${assignmentId}`}
                        placeholder="Notes spécifiques à cette salle..."
                        value={salleAssignment.notes || ""}
                        onChange={(e) => handleUpdateSalleNotes(assignmentId, e.target.value)}
                        className="h-24"
                    />
                </div>
            </div>
        );
    };

    if (!workingPlanning) {
        return <div>Chargement du planning...</div>;
    }

    return (
        <div className="bloc-planning-editor">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Select
                        value={workingPlanning.validationStatus}
                        onValueChange={(value: 'BROUILLON' | 'PROPOSE' | 'VALIDE' | 'PUBLIE') =>
                            handleUpdateValidationStatus(value)
                        }
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BROUILLON">Brouillon</SelectItem>
                            <SelectItem value="PROPOSE">Proposé</SelectItem>
                            <SelectItem value="VALIDE">Validé</SelectItem>
                            <SelectItem value="PUBLIE">Publié</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Valider le planning
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Vérifie la conformité du planning avec les règles de supervision</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panneau de gauche - Liste des salles */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Salles assignées</CardTitle>
                            <CardDescription>
                                {workingPlanning.salles.length} salle(s) pour cette journée
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-2">
                            {workingPlanning.salles.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Aucune salle assignée
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {workingPlanning.salles.map(salleAssignment => {
                                        const secteur = getSecteurForSalle(salleAssignment.salleId);

                                        return (
                                            <div
                                                key={salleAssignment.id}
                                                className={`p-3 border rounded-md cursor-pointer ${activeSalleId === salleAssignment.id ? 'border-primary bg-primary/5' : ''
                                                    }`}
                                                onClick={() => setActiveSalleId(salleAssignment.id)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium">
                                                            {getSalleName(salleAssignment.salleId)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {salleAssignment.superviseurs.length} superviseur(s)
                                                        </div>
                                                    </div>
                                                    {secteur && (
                                                        <Badge variant="outline" style={{
                                                            backgroundColor: secteur.couleur || undefined
                                                        }}>
                                                            {secteur.nom}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="py-4 border-t">
                            <Select
                                onValueChange={handleAddSalle}
                                disabled={getSallesDisponibles().length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ajouter une salle..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {getSallesDisponibles().map(salle => {
                                        const secteur = secteurs.find(s => s.id === salle.secteurId);

                                        return (
                                            <SelectItem key={salle.id} value={salle.id}>
                                                Salle {salle.numero} - {secteur?.nom || 'Secteur inconnu'}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Notes du planning</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Notes générales pour le planning de la journée..."
                                className="min-h-[120px]"
                                value={workingPlanning.notes || ""}
                                onChange={(e) => handleUpdatePlanningNotes(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Panneau de droite - Édition de la salle sélectionnée */}
                <div className="md:col-span-2">
                    {activeSalleId ? (
                        <Card>
                            <CardContent className="pt-6">
                                {renderSalleEditionPanel(activeSalleId)}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    {workingPlanning.salles.length > 0
                                        ? "Sélectionnez une salle pour l'éditer"
                                        : "Ajoutez des salles à votre planning pour commencer"
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlocPlanningEditor; 