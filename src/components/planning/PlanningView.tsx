'use client';

import { DragDropContext } from '@hello-pangea/dnd';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { logger } from "../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { PlanningService } from '@/services/planningService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
interface PlanningViewProps {
    userId?: number;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ userId }) => {
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [planning, setPlanning] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadPlanning = async () => {
        if (!startDate || !endDate) {
            toast.error('Veuillez sélectionner une période');
            return;
        }

        setLoading(true);
        try {
            const data = userId
                ? await PlanningService.getPlanningForUser(userId, startDate, endDate)
                : await PlanningService.generatePlanning(startDate, endDate);
            setPlanning(data);
        } catch (error: unknown) {
            toast.error('Erreur lors du chargement du planning');
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            loadPlanning();
        }
    }, [startDate, endDate, userId]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Planning des affectations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DatePickerComponent
                            selected={startDate}
                            onSelect={setStartDate}
                            placeholder="Date de début"
                        />
                        <DatePickerComponent
                            selected={endDate}
                            onSelect={setEndDate}
                            placeholder="Date de fin"
                        />
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Affectations</h3>
                        <div className="space-y-2">
                            {planning.map((slot, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-gray-100 rounded-lg flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {format(new Date(slot.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {slot.user ? `${slot.user.firstName} ${slot.user.lastName}` : `Utilisateur ${slot.userId}`}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Période: {slot.periodeType} - Motif: {slot.motif}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={loadPlanning} disabled={loading}>
                            {loading ? 'Chargement...' : 'Actualiser'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 