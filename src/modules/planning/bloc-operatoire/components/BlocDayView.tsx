'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BlocVacation from './BlocVacation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types pour l'affichage simplifié
interface StaffMember {
    id: string;
    name: string;
}

interface Vacation {
    id: string;
    status: 'OPEN' | 'CLOSED';
    surgeon?: StaffMember;
    mar?: StaffMember;
    iade?: StaffMember;
    notes?: string;
}

interface RoomAssignment {
    roomId: string;
    roomName: string;
    roomNumber: string;
    sectorName: string;
    sectorColor: string;
    morningVacation?: Vacation;
    afternoonVacation?: Vacation;
}

interface BlocDayViewProps {
    date: Date;
    assignments: RoomAssignment[];
    onVacationClick?: (
        roomId: string,
        period: 'morning' | 'afternoon',
        vacationId?: string
    ) => void;
    isLoading?: boolean;
}

/**
 * Composant pour afficher le planning du bloc pour une journée
 * Utilise le modèle de vacations par demi-journées
 */
export default function BlocDayView({
    date,
    assignments,
    onVacationClick,
    isLoading = false
}: BlocDayViewProps) {
    const formattedDate = format(date, 'EEEE d MMMM yyyy', { locale: fr });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold capitalize">
                    {formattedDate}
                </h2>
            </div>

            {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Chargement du planning...</p>
                    </div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Aucune salle programmée pour cette journée</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {assignments.map((assignment) => (
                        <Card key={assignment.roomId} className="overflow-hidden border">
                            <CardHeader
                                className="py-3 px-4"
                                style={{ backgroundColor: assignment.sectorColor + '20' }}
                            >
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-md font-semibold flex items-center">
                                        <span className="mr-2">{assignment.roomNumber}</span>
                                        <span>{assignment.roomName}</span>
                                    </CardTitle>
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: assignment.sectorColor }}
                                    ></span>
                                </div>
                                <div className="text-xs text-muted-foreground">{assignment.sectorName}</div>
                            </CardHeader>

                            <CardContent className="p-4 grid grid-cols-1 gap-3">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Matin</div>
                                    {assignment.morningVacation ? (
                                        <BlocVacation
                                            title="Vacation matin"
                                            status={assignment.morningVacation.status}
                                            surgeon={assignment.morningVacation.surgeon}
                                            mar={assignment.morningVacation.mar}
                                            iade={assignment.morningVacation.iade}
                                            notes={assignment.morningVacation.notes}
                                            onClick={() => onVacationClick?.(
                                                assignment.roomId,
                                                'morning',
                                                assignment.morningVacation?.id
                                            )}
                                        />
                                    ) : (
                                        <div
                                            className="h-24 border rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50"
                                            onClick={() => onVacationClick?.(assignment.roomId, 'morning')}
                                        >
                                            <span className="text-xs text-muted-foreground">+ Ajouter vacation</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Après-midi</div>
                                    {assignment.afternoonVacation ? (
                                        <BlocVacation
                                            title="Vacation après-midi"
                                            status={assignment.afternoonVacation.status}
                                            surgeon={assignment.afternoonVacation.surgeon}
                                            mar={assignment.afternoonVacation.mar}
                                            iade={assignment.afternoonVacation.iade}
                                            notes={assignment.afternoonVacation.notes}
                                            onClick={() => onVacationClick?.(
                                                assignment.roomId,
                                                'afternoon',
                                                assignment.afternoonVacation?.id
                                            )}
                                        />
                                    ) : (
                                        <div
                                            className="h-24 border rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50"
                                            onClick={() => onVacationClick?.(assignment.roomId, 'afternoon')}
                                        >
                                            <span className="text-xs text-muted-foreground">+ Ajouter vacation</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}