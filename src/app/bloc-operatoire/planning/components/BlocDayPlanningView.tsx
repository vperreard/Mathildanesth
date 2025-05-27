'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, UserCheck, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import {
    BlocDayPlanning,
    BlocRoomAssignment,
    BlocStaffAssignment,
    BlocStaffRole,
    ConflictSeverity,
    User as PrismaUser,
    Site as PrismaSite,
    OperatingRoom as PrismaOperatingRoom,
    OperatingSector as PrismaOperatingSector,
    Surgeon as PrismaSurgeon,
    BlocPlanningConflict as PrismaBlocPlanningConflict,
    BlocPlanningStatus as PrismaBlocPlanningStatus
} from '@prisma/client';

// Types étendus pour inclure les relations
type FullSite = Pick<PrismaSite, 'id' | 'name'>;

type FullOperatingRoom = Pick<PrismaOperatingRoom, 'id' | 'name'> & {
    sector?: Pick<PrismaOperatingSector, 'id' | 'name' | 'colorCode'> | null;
};

type FullSurgeon = Pick<PrismaSurgeon, 'id' | 'nom' | 'prenom'>;

type FullUser = Pick<PrismaUser, 'id' | 'nom' | 'prenom' | 'role'>;

type FullStaffAssignment = BlocStaffAssignment & {
    user?: FullUser | null;
};

type FullRoomAssignment = BlocRoomAssignment & {
    operatingRoom: FullOperatingRoom;
    surgeon?: FullSurgeon | null;
    staffAssignments: FullStaffAssignment[];
};

type FullBlocDayPlanning = BlocDayPlanning & {
    site: FullSite;
    assignments: FullRoomAssignment[];
    conflicts: PrismaBlocPlanningConflict[];
};

interface BlocDayPlanningViewProps {
    date: Date;
    siteId?: string;
    onPlanningChange?: (planning: FullBlocDayPlanning | null) => void;
}

const BlocDayPlanningView: React.FC<BlocDayPlanningViewProps> = ({
    date,
    siteId = '1', // ID du site par défaut
    onPlanningChange
}) => {
    const router = useRouter();
    const [planning, setPlanning] = useState<FullBlocDayPlanning | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const formattedDate = format(date, 'yyyy-MM-dd');

    // Fonction pour charger le planning du jour
    const loadPlanning = async () => {
        try {
            setLoading(true);
            setError(null);

            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            // Utiliser le service pour récupérer les plannings
            const plannings = await blocPlanningService.getBlocDayPlanningsBySiteAndDateRange(
                siteId,
                startDate,
                endDate
            );

            if (plannings && plannings.length > 0) {
                setPlanning(plannings[0] as unknown as FullBlocDayPlanning);
                if (onPlanningChange) {
                    onPlanningChange(plannings[0] as unknown as FullBlocDayPlanning);
                }
            } else {
                setPlanning(null);
                if (onPlanningChange) {
                    onPlanningChange(null);
                }
            }
        } catch (err) {
            console.error('Erreur lors du chargement du planning:', err);
            setError('Impossible de charger le planning. Veuillez réessayer ultérieurement.');
            setPlanning(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlanning();
    }, [date, siteId]);

    const handleCreatePlanning = () => {
        router.push(`/bloc-operatoire/create/${formattedDate}?siteId=${siteId}`);
    };

    const handleEditPlanning = () => {
        if (planning) {
            router.push(`/bloc-operatoire/edit/${planning.id}`);
        }
    };

    // Fonction pour afficher le statut du planning
    const renderStatus = () => {
        if (!planning) return null;

        const getVariant = (status: PrismaBlocPlanningStatus) => {
            switch (status) {
                case PrismaBlocPlanningStatus.VALIDATED:
                    return 'secondary';
                case PrismaBlocPlanningStatus.LOCKED:
                    return 'destructive';
                default: return 'outline';
            }
        };

        const getLabel = (status: PrismaBlocPlanningStatus) => {
            switch (status) {
                case PrismaBlocPlanningStatus.DRAFT:
                    return 'Brouillon';
                case PrismaBlocPlanningStatus.VALIDATED:
                    return 'Validé';
                case PrismaBlocPlanningStatus.LOCKED:
                    return 'Verrouillé';
                case PrismaBlocPlanningStatus.ARCHIVED:
                    return 'Archivé';
                case PrismaBlocPlanningStatus.MODIFIED_AFTER_VALIDATION:
                    return 'Modifié (Validé)';
                case PrismaBlocPlanningStatus.VALIDATION_REQUESTED:
                    return 'Validation demandée';
                default: return status;
            }
        };

        return (
            <Badge variant={getVariant(planning.status)}>
                {getLabel(planning.status)}
            </Badge>
        );
    };

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

    // Affichage quand il n'y a pas de planning
    if (!planning) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-6">
                <p className="text-muted-foreground text-sm">Aucun planning défini pour cette journée</p>
                <Button variant="outline" size="sm" onClick={handleCreatePlanning}>
                    <Plus className="h-4 w-4 mr-1" />
                    Créer planning
                </Button>
            </div>
        );
    }

    // Regrouper les assignments par secteur pour l'affichage
    const assignmentsBySector = planning.assignments.reduce((acc: Record<number, { sector: { id: number, name: string, colorCode?: string | null }, assignments: FullRoomAssignment[] }>, assignment: FullRoomAssignment) => {
        const sectorId = assignment.operatingRoom.sector?.id || 0;
        const sectorData = assignment.operatingRoom.sector || { id: sectorId, name: 'Sans secteur', colorCode: null };

        if (!acc[sectorId]) {
            acc[sectorId] = {
                sector: sectorData,
                assignments: []
            };
        }
        acc[sectorId].assignments.push(assignment);
        return acc;
    }, {} as Record<number, { sector: { id: number, name: string, colorCode?: string | null }, assignments: FullRoomAssignment[] }>);

    // Trier les secteurs par nom
    const sortedSectors: Array<{ sector: { id: number, name: string, colorCode?: string | null }, assignments: FullRoomAssignment[] }> = Object.values(assignmentsBySector).sort((a, b) =>
        a.sector.name.localeCompare(b.sector.name)
    );

    // Fonction pour afficher un membre du personnel
    const renderStaffMember = (staff: FullStaffAssignment) => {
        // Mappage des rôles
        let roleName = staff.role;
        if (staff.role === BlocStaffRole.MAR) roleName = 'MAR';
        if (staff.role === BlocStaffRole.IADE) roleName = 'IADE';
        // Autres rôles possibles à ajouter selon le schema

        const variant = staff.isPrimaryAnesthetist ? 'default' : 'secondary';

        return (
            <Badge key={staff.id} variant={variant} className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                <span>
                    {staff.user ? `${staff.user.prenom} ${staff.user.nom}` : 'Inconnu'}
                    {staff.isPrimaryAnesthetist ? ' (Principal)' : ''}
                    - {roleName}
                </span>
            </Badge>
        );
    };

    // Affichage du planning existant
    return (
        <div className="bloc-planning-day space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                        {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                    {renderStatus()}
                </div>
                <Button variant="outline" size="sm" onClick={handleEditPlanning}>
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                </Button>
            </div>

            {planning.conflicts && planning.conflicts.some((c: PrismaBlocPlanningConflict) => !c.isResolved) && (
                <Alert variant="warning" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Ce planning contient {planning.conflicts.filter((c: PrismaBlocPlanningConflict) => !c.isResolved).length} conflits non résolus.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                {sortedSectors.map(({ sector, assignments }) => (
                    <Card key={sector.id} className={`border-l-4 ${sector.colorCode ? `border-l-[${sector.colorCode}]` : 'border-l-transparent'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{sector.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {assignments
                                .sort((a: FullRoomAssignment, b: FullRoomAssignment) => a.operatingRoom.name.localeCompare(b.operatingRoom.name))
                                .map((assignment: FullRoomAssignment) => (
                                    <div key={assignment.id} className="p-3 border rounded-md">
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium">
                                                {assignment.operatingRoom.name}
                                                {assignment.period && (
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        ({assignment.period === 'MATIN' ? 'Matin' :
                                                            assignment.period === 'APRES_MIDI' ? 'Après-midi' :
                                                                'Journée entière'})
                                                    </span>
                                                )}
                                            </div>
                                            {assignment.surgeon && (
                                                <Badge variant="outline">
                                                    {assignment.surgeon.prenom} {assignment.surgeon.nom}
                                                </Badge>
                                            )}
                                        </div>

                                        {assignment.staffAssignments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {assignment.staffAssignments.map((staffMember: FullStaffAssignment) => renderStaffMember(staffMember))}
                                            </div>
                                        )}

                                        {/* Conflits spécifiques à cette salle */}
                                        {planning.conflicts.some((c: PrismaBlocPlanningConflict) => c.relatedRoomAssignmentId === assignment.id && !c.isResolved) && (
                                            <div className="mt-2 text-xs text-red-600">
                                                {planning.conflicts
                                                    .filter((c: PrismaBlocPlanningConflict) => c.relatedRoomAssignmentId === assignment.id && !c.isResolved)
                                                    .map((conflict: PrismaBlocPlanningConflict) => (
                                                        <div key={conflict.id} className="flex items-start gap-1">
                                                            <AlertCircle className="h-3 w-3 mt-0.5" />
                                                            <span>{conflict.message}</span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Conflits généraux */}
            {planning.conflicts.some((c: PrismaBlocPlanningConflict) => !c.relatedRoomAssignmentId && !c.isResolved) && (
                <Card className="mt-4 border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Conflits généraux</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {planning.conflicts
                                .filter((c: PrismaBlocPlanningConflict) => !c.relatedRoomAssignmentId && !c.isResolved)
                                .map((conflict: PrismaBlocPlanningConflict) => (
                                    <div key={conflict.id} className="flex items-start gap-1 text-sm">
                                        <AlertCircle className={`h-4 w-4 mt-0.5 ${conflict.severity === 'ERROR' ? 'text-red-600' : 'text-amber-600'}`} />
                                        <span>{conflict.message}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </CardContent>
                </Card>
            )}

            <CardFooter className="border-t p-4 mt-4">
                <div className="text-xs text-muted-foreground">
                    Planning {planning.id} créé le {format(new Date(planning.createdAt), 'dd/MM/yyyy HH:mm')}
                    {planning.validatedAt &&
                        ` - Validé le ${format(new Date(planning.validatedAt), 'dd/MM/yyyy HH:mm')}`
                    }
                </div>
            </CardFooter>
        </div>
    );
};

export default BlocDayPlanningView; 