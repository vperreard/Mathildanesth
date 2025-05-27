'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus,
    Trash2,
    Save,
    User,
    CheckCircle,
    Calendar,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

// Utiliser le même type FullBlocDayPlanning que dans BlocDayPlanningView
// et le même enum BlocPlanningStatus
enum BlocPlanningStatus {
    DRAFT = 'DRAFT',
    CONFLICT = 'CONFLICT',
    WARNING = 'WARNING',
    VALIDATED = 'VALIDATED',
    PUBLISHED = 'PUBLISHED',
    LOCKED = 'LOCKED',
    ARCHIVED = 'ARCHIVED',
    VALIDATION_REQUESTED = 'VALIDATION_REQUESTED',
    MODIFIED_AFTER_VALIDATION = 'MODIFIED_AFTER_VALIDATION'
}

enum BlocStaffRole {
    MAR = 'MAR',
    IADE = 'IADE'
}

enum Period {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_ENTIERE = 'JOURNEE_ENTIERE'
}

// Type simplifié pour ce composant
type SimplifiedPlanning = {
    id: string;
    date: Date;
    siteId: string;
    status: BlocPlanningStatus;
    assignments: {
        id: string;
        operatingRoomId: number;
        period: Period;
        chirurgienId?: number | null;
        surgeon?: {
            id: number;
            firstName: string;
            lastName: string;
        } | null;
        operatingRoom: {
            id: number;
            name: string;
            sector?: {
                id: number;
                name: string;
            } | null;
        };
        staffAssignments: {
            id: string;
            userId: number;
            role: BlocStaffRole;
            isPrimaryAnesthetist: boolean;
            user?: {
                id: number;
                name: string;
            } | null;
        }[];
    }[];
    conflicts: {
        id: string;
        type: string;
        message: string;
        severity: string;
        isResolved: boolean;
    }[];
};

// Types pour les médecins, salles et secteurs
type Surgeon = {
    id: number;
    firstName: string;
    lastName: string;
    specialties?: string[];
};

type Staff = {
    id: number;
    name: string;
    role: string;
    skills?: string[];
};

type Room = {
    id: number;
    name: string;
    sectorId?: number;
    sector?: {
        id: number;
        name: string;
    } | null;
};

interface BlocDayPlanningEditorProps {
    planningId: string;
    onSave?: (planning: SimplifiedPlanning) => void;
    onCancel?: () => void;
}

const BlocDayPlanningEditor: React.FC<BlocDayPlanningEditorProps> = ({
    planningId,
    onSave,
    onCancel
}) => {
    const [planning, setPlanning] = useState<SimplifiedPlanning | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [saving, setSaving] = useState<boolean>(false);
    const [validating, setValidating] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('assignments');
    const [showAddStaffDialog, setShowAddStaffDialog] = useState<boolean>(false);
    const [selectedRoomAssignmentId, setSelectedRoomAssignmentId] = useState<string | null>(null);
    const [selectedStaffMember, setSelectedStaffMember] = useState<number | null>(null);
    const [selectedStaffRole, setSelectedStaffRole] = useState<BlocStaffRole>(BlocStaffRole.MAR);
    const [isPrimaryAnesthetist, setIsPrimaryAnesthetist] = useState<boolean>(false);

    // Charger le planning à éditer
    const loadPlanning = async () => {
        try {
            setLoading(true);
            setError(null);

            // Charger le planning complet
            const loadedPlanning = await blocPlanningService.getBlocDayPlanningById(planningId);

            if (loadedPlanning) {
                setPlanning(loadedPlanning as any as SimplifiedPlanning);
            } else {
                setError('Planning non trouvé');
            }

            // Charger les données additionnelles (chirurgiens, personnel, salles)
            await loadAdditionalData();
        } catch (err) {
            console.error('Erreur lors du chargement du planning:', err);
            setError('Impossible de charger le planning. Veuillez réessayer ultérieurement.');
        } finally {
            setLoading(false);
        }
    };

    // Charger les données additionnelles (chirurgiens, personnel, salles)
    const loadAdditionalData = async () => {
        try {
            // Ces endpoints devraient être implémentés dans votre API
            // Pour l'instant, on utilise des données fictives

            // Simuler le chargement des chirurgiens
            const mockSurgeons: Surgeon[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', specialties: ['Cardiologie'] },
                { id: 2, firstName: 'Marie', lastName: 'Martin', specialties: ['Orthopédie'] },
                { id: 3, firstName: 'Pierre', lastName: 'Bernard', specialties: ['Ophtalmologie'] }
            ];
            setSurgeons(mockSurgeons);

            // Simuler le chargement du personnel médical
            const mockStaff: Staff[] = [
                { id: 101, name: 'Sophie Lefebvre', role: 'MAR', skills: ['Pédiatrie'] },
                { id: 102, name: 'Thomas Petit', role: 'MAR', skills: ['Cardiologie'] },
                { id: 103, name: 'Émilie Robert', role: 'IADE', skills: ['Général'] },
                { id: 104, name: 'Paul Richard', role: 'IADE', skills: ['Ophtalmologie'] }
            ];
            setStaff(mockStaff);

            // Simuler le chargement des salles d'opération
            const mockRooms: Room[] = [
                { id: 201, name: 'Salle 1', sectorId: 301, sector: { id: 301, name: 'Cardiologie' } },
                { id: 202, name: 'Salle 2', sectorId: 301, sector: { id: 301, name: 'Cardiologie' } },
                { id: 203, name: 'Salle 3', sectorId: 302, sector: { id: 302, name: 'Orthopédie' } },
                { id: 204, name: 'Salle 4', sectorId: 303, sector: { id: 303, name: 'Ophtalmologie' } }
            ];
            setRooms(mockRooms);
        } catch (err) {
            console.error('Erreur lors du chargement des données additionnelles:', err);
        }
    };

    // Fonction pour mettre à jour le chirurgien d'une salle
    const updateSurgeonForRoom = (roomAssignmentId: string, surgeonId: number | null) => {
        if (!planning) return;

        setPlanning({
            ...planning,
            assignments: planning.assignments.map(assignment => {
                if (assignment.id === roomAssignmentId) {
                    const selectedSurgeon = surgeonId ? surgeons.find(s => s.id === surgeonId) : null;
                    return {
                        ...assignment,
                        chirurgienId: surgeonId,
                        surgeon: selectedSurgeon ? {
                            id: selectedSurgeon.id,
                            firstName: selectedSurgeon.firstName,
                            lastName: selectedSurgeon.lastName
                        } : null
                    };
                }
                return assignment;
            })
        });
    };

    // Fonction pour ajouter un membre du personnel à une salle
    const addStaffToRoom = async () => {
        if (!planning || !selectedRoomAssignmentId || !selectedStaffMember) return;

        try {
            // Dans une application réelle, cela appellerait votre API
            // Pour l'instant, on met à jour l'état local
            const selectedStaffData = staff.find(s => s.id === selectedStaffMember);

            if (selectedStaffData) {
                setPlanning({
                    ...planning,
                    assignments: planning.assignments.map(assignment => {
                        if (assignment.id === selectedRoomAssignmentId) {
                            const newStaffAssignment = {
                                id: `temp-${Date.now()}`, // ID temporaire
                                userId: selectedStaffMember,
                                role: selectedStaffRole,
                                isPrimaryAnesthetist: isPrimaryAnesthetist,
                                user: {
                                    id: selectedStaffData.id,
                                    name: selectedStaffData.name
                                }
                            };

                            return {
                                ...assignment,
                                staffAssignments: [...assignment.staffAssignments, newStaffAssignment]
                            };
                        }
                        return assignment;
                    })
                });

                // Réinitialiser le formulaire et fermer le dialogue
                setSelectedStaffMember(null);
                setSelectedStaffRole(BlocStaffRole.MAR);
                setIsPrimaryAnesthetist(false);
                setShowAddStaffDialog(false);
            }
        } catch (err) {
            console.error('Erreur lors de l\'ajout du personnel:', err);
            setError('Impossible d\'ajouter le membre du personnel. Veuillez réessayer.');
        }
    };

    // Fonction pour supprimer un membre du personnel d'une salle
    const removeStaffFromRoom = (roomAssignmentId: string, staffAssignmentId: string) => {
        if (!planning) return;

        setPlanning({
            ...planning,
            assignments: planning.assignments.map(assignment => {
                if (assignment.id === roomAssignmentId) {
                    return {
                        ...assignment,
                        staffAssignments: assignment.staffAssignments.filter(
                            staff => staff.id !== staffAssignmentId
                        )
                    };
                }
                return assignment;
            })
        });
    };

    // Fonction pour sauvegarder le planning
    const savePlanning = async () => {
        if (!planning) return;

        try {
            setSaving(true);

            // Dans une application réelle, cela appellerait votre API
            // Idéalement, un appel à updateBlocDayPlanning ou similaire

            // Simuler une sauvegarde
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (onSave) {
                onSave(planning);
            }

            // Revalider le planning
            await validatePlanning();
        } catch (err) {
            console.error('Erreur lors de la sauvegarde du planning:', err);
            setError('Impossible de sauvegarder le planning. Veuillez réessayer.');
        } finally {
            setSaving(false);
        }
    };

    // Fonction pour valider le planning
    const validatePlanning = async () => {
        if (!planning) return;

        try {
            setValidating(true);

            // Appeler le service pour valider le planning
            const validationResult = await blocPlanningService.validateEntireBlocDayPlanning(planning.id);

            // Mettre à jour le planning avec les nouveaux conflits
            setPlanning(prev => prev ? {
                ...prev,
                conflicts: validationResult.conflicts || [],
                status: validationResult.isValid ? BlocPlanningStatus.VALIDATED : BlocPlanningStatus.CONFLICT
            } : null);
        } catch (err) {
            console.error('Erreur lors de la validation du planning:', err);
            setError('Impossible de valider le planning. Veuillez réessayer.');
        } finally {
            setValidating(false);
        }
    };

    // Charger les données au montage du composant
    useEffect(() => {
        loadPlanning();
    }, [planningId]);

    // Affichage pendant le chargement
    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-pulse">Chargement du planning...</div>
            </div>
        );
    }

    // Affichage en cas d'erreur
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    // Affichage si pas de planning trouvé
    if (!planning) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Planning non trouvé</p>
                {onCancel && (
                    <Button variant="outline" className="mt-4" onClick={onCancel}>
                        Retour
                    </Button>
                )}
            </div>
        );
    }

    // Format de la date pour l'affichage
    const formattedDate = format(new Date(planning.date), 'EEEE d MMMM yyyy', { locale: fr });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <h2 className="text-xl font-semibold">
                        Edition du planning du {formattedDate}
                    </h2>
                    <Badge variant={
                        planning.status === BlocPlanningStatus.DRAFT ? 'outline' :
                            planning.status === BlocPlanningStatus.CONFLICT ? 'destructive' :
                                planning.status === BlocPlanningStatus.WARNING ? 'warning' : 'default'
                    }>
                        {planning.status === BlocPlanningStatus.DRAFT ? 'Brouillon' :
                            planning.status === BlocPlanningStatus.CONFLICT ? 'Conflits' :
                                planning.status === BlocPlanningStatus.WARNING ? 'Avertissements' :
                                    planning.status === BlocPlanningStatus.VALIDATED ? 'Validé' : planning.status}
                    </Badge>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={onCancel}>Annuler</Button>
                    <Button variant="outline" onClick={validatePlanning} disabled={validating}>
                        {validating ? 'Validation...' : 'Valider'}
                    </Button>
                    <Button onClick={savePlanning} disabled={saving}>
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="assignments">Affectations</TabsTrigger>
                    <TabsTrigger value="conflicts">
                        Conflits
                        {planning.conflicts.filter(c => !c.isResolved).length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {planning.conflicts.filter(c => !c.isResolved).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-4">
                    {/* Organisation par secteur */}
                    {rooms.reduce((sectors: Record<number, Room[]>, room) => {
                        const sectorId = room.sectorId || 0;
                        if (!sectors[sectorId]) {
                            sectors[sectorId] = [];
                        }
                        sectors[sectorId].push(room);
                        return sectors;
                    }, {} as Record<number, Room[]>)
                        .map((sectorRooms, sectorId) => {
                            const sectorName = sectorRooms[0]?.sector?.name || 'Sans secteur';
                            return (
                                <Card key={sectorId} className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 py-2">
                                        <CardTitle className="text-lg">{sectorName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y">
                                        {sectorRooms.map(room => {
                                            const assignment = planning.assignments.find(
                                                a => a.operatingRoomId === room.id
                                            );

                                            return (
                                                <div key={room.id} className="py-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-medium">{room.name}</div>
                                                        {!assignment && (
                                                            <Button variant="outline" size="sm">
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Ajouter affectation
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {assignment && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">Période:</span>
                                                                <Select value={assignment.period} onValueChange={(value) => {
                                                                    // Mettre à jour la période
                                                                }}>
                                                                    <SelectTrigger className="w-[180px]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value={Period.MATIN}>Matin</SelectItem>
                                                                        <SelectItem value={Period.APRES_MIDI}>Après-midi</SelectItem>
                                                                        <SelectItem value={Period.JOURNEE_ENTIERE}>Journée entière</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">Chirurgien:</span>
                                                                <Select
                                                                    value={assignment.chirurgienId?.toString() || ''}
                                                                    onValueChange={(value) => {
                                                                        updateSurgeonForRoom(
                                                                            assignment.id,
                                                                            value ? parseInt(value) : null
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-[180px]">
                                                                        <SelectValue placeholder="Sélectionner chirurgien" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="">-- Aucun --</SelectItem>
                                                                        {surgeons.map(surgeon => (
                                                                            <SelectItem key={surgeon.id} value={surgeon.id.toString()}>
                                                                                {surgeon.firstName} {surgeon.lastName}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium">Personnel:</span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedRoomAssignmentId(assignment.id);
                                                                            setShowAddStaffDialog(true);
                                                                        }}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        Ajouter personnel
                                                                    </Button>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    {assignment.staffAssignments.length === 0 && (
                                                                        <p className="text-sm text-muted-foreground italic">
                                                                            Aucun personnel affecté
                                                                        </p>
                                                                    )}

                                                                    {assignment.staffAssignments.map(staffAssignment => (
                                                                        <div
                                                                            key={staffAssignment.id}
                                                                            className="flex justify-between items-center p-2 bg-muted/30 rounded-sm"
                                                                        >
                                                                            <div className="flex items-center space-x-2">
                                                                                <User className="h-4 w-4" />
                                                                                <span>
                                                                                    {staffAssignment.user?.name || `ID ${staffAssignment.userId}`}
                                                                                    {staffAssignment.isPrimaryAnesthetist && (
                                                                                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                                                                            Principal
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                                <Badge variant="secondary">
                                                                                    {staffAssignment.role}
                                                                                </Badge>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => removeStaffFromRoom(assignment.id, staffAssignment.id)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3 text-red-500" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            );
                        })}
                </TabsContent>

                <TabsContent value="conflicts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conflits à résoudre</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {planning.conflicts.length === 0 ? (
                                <p className="text-center text-muted-foreground">
                                    Aucun conflit détecté.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {planning.conflicts.map(conflict => (
                                        <div
                                            key={conflict.id}
                                            className={`p-3 border rounded-md ${conflict.severity === 'ERROR' ? 'border-red-200 bg-red-50' :
                                                    conflict.severity === 'WARNING' ? 'border-amber-200 bg-amber-50' :
                                                        'border-gray-200'
                                                } ${conflict.isResolved ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <div className="flex justify-between">
                                                <div className="flex items-start space-x-2">
                                                    <AlertCircle className={`h-4 w-4 mt-0.5 ${conflict.severity === 'ERROR' ? 'text-red-600' :
                                                            'text-amber-600'
                                                        }`} />
                                                    <div>
                                                        <p>{conflict.message}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Type: {conflict.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!conflict.isResolved && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="ml-2"
                                                        onClick={() => {
                                                            // Marquer comme résolu
                                                            setPlanning(prev => prev ? {
                                                                ...prev,
                                                                conflicts: prev.conflicts.map(c =>
                                                                    c.id === conflict.id ? { ...c, isResolved: true } : c
                                                                )
                                                            } : null);
                                                        }}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Marquer résolu
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialog pour ajouter du personnel */}
            <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter du personnel</DialogTitle>
                        <DialogDescription>
                            Sélectionnez un membre du personnel à ajouter à cette salle.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="staff-member" className="text-sm font-medium">
                                Membre du personnel
                            </label>
                            <Select
                                value={selectedStaffMember?.toString() || ''}
                                onValueChange={value => setSelectedStaffMember(parseInt(value))}
                            >
                                <SelectTrigger id="staff-member">
                                    <SelectValue placeholder="Sélectionner un membre du personnel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} ({s.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="staff-role" className="text-sm font-medium">
                                Rôle
                            </label>
                            <Select
                                value={selectedStaffRole}
                                onValueChange={value => setSelectedStaffRole(value as BlocStaffRole)}
                            >
                                <SelectTrigger id="staff-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={BlocStaffRole.MAR}>MAR</SelectItem>
                                    <SelectItem value={BlocStaffRole.IADE}>IADE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-primary"
                                checked={isPrimaryAnesthetist}
                                onChange={e => setIsPrimaryAnesthetist(e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="is-primary" className="text-sm font-medium">
                                Anesthésiste principal
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                            Annuler
                        </Button>
                        <Button onClick={addStaffToRoom} disabled={!selectedStaffMember}>
                            Ajouter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlocDayPlanningEditor; 