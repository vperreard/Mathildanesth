'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BlocDayPlanning, OperatingRoom, BlocSector, BlocSupervisor } from '@/types/bloc-planning-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

interface BlocPlanningDayProps {
    planning: BlocDayPlanning | null;
    salles: OperatingRoom[];
    secteurs: BlocSector[];
    date: Date;
    getSecteurForSalle: (salleId: string) => BlocSector | undefined;
}

const BlocPlanningDay: React.FC<BlocPlanningDayProps> = ({
    planning,
    salles,
    secteurs,
    date,
    getSecteurForSalle
}) => {
    const router = useRouter();
    const formattedDate = format(date, 'yyyy-MM-dd');

    // Fonction pour obtenir le nom de la salle
    const getSalleName = (salleId: string): string => {
        const salle = salles.find(s => s.id === salleId);
        return salle ? `Salle ${salle.numero}${salle.nom ? ` - ${salle.nom}` : ''}` : 'Salle inconnue';
    };

    // Fonction pour afficher les superviseurs
    const renderSuperviseurs = (superviseurs: BlocSupervisor[]): React.ReactNode => {
        if (superviseurs.length === 0) {
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Non supervisé
                </Badge>
            );
        }

        return (
            <div className="flex flex-wrap gap-1">
                {superviseurs.map(superviseur => (
                    <Badge
                        key={superviseur.id}
                        variant={superviseur.role === 'PRINCIPAL' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                    >
                        <UserCheck className="h-3 w-3" />
                        <span>{superviseur.user?.nom || 'Superviseur'}</span>
                    </Badge>
                ))}
            </div>
        );
    };

    const handleEditPlanning = () => {
        router.push(`/bloc-operatoire/edit/${formattedDate}`);
    };

    const handleCreatePlanning = () => {
        router.push(`/bloc-operatoire/create/${formattedDate}`);
    };

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

    // Affichage du planning existant
    return (
        <div className="bloc-planning-day space-y-3">
            <div className="flex justify-between items-center">
                <div>
                    <Badge variant={planning.validationStatus === 'PUBLIE' ? 'default' : 'outline'}>
                        {planning.validationStatus === 'BROUILLON' && 'Brouillon'}
                        {planning.validationStatus === 'PROPOSE' && 'Proposé'}
                        {planning.validationStatus === 'VALIDE' && 'Validé'}
                        {planning.validationStatus === 'PUBLIE' && 'Publié'}
                    </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditPlanning}>
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                </Button>
            </div>

            <div className="space-y-2">
                {planning.salles.map(salleAssignment => {
                    const secteur = getSecteurForSalle(salleAssignment.salleId);

                    return (
                        <div
                            key={salleAssignment.id}
                            className={cn(
                                "p-2 border rounded-md",
                                secteur?.couleur ? `border-l-4 border-l-[${secteur.couleur}]` : ""
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-medium">
                                    {getSalleName(salleAssignment.salleId)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {secteur?.nom || 'Secteur inconnu'}
                                </div>
                            </div>

                            <div className="mt-1">
                                {renderSuperviseurs(salleAssignment.superviseurs)}
                            </div>

                            {salleAssignment.notes && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {salleAssignment.notes}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {planning.notes && (
                <div className="text-xs text-muted-foreground mt-4 p-2 border rounded-md bg-muted/20">
                    <strong>Notes:</strong> {planning.notes}
                </div>
            )}
        </div>
    );
};

export default BlocPlanningDay; 