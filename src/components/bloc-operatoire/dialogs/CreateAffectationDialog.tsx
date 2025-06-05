'use client';

import React, { useState, useEffect } from 'react';
import { DayOfWeek, Period } from '@prisma/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Calendar, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface CreateAffectationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (affectation: NewAffectation) => void;
    defaultDay?: DayOfWeek;
    defaultPeriod?: Period;
    defaultRoomId?: number;
    trameModeleId: number;
}

interface NewAffectation {
    jourSemaine: DayOfWeek;
    periode: Period;
    operatingRoomId?: number;
    supervisorId: number;
    activityTypeId: number;
    roleType: 'ANESTHESIA' | 'SUPERVISION';
    applyToAllWeeks: boolean;
}

const DAYS_MAP = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche'
};

const PERIODS_MAP = {
    MORNING: 'Matin',
    AFTERNOON: 'Après-midi',
    NIGHT: 'Nuit'
};

export const CreateAffectationDialog: React.FC<CreateAffectationDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    defaultDay,
    defaultPeriod,
    defaultRoomId,
    trameModeleId
}) => {
    const [formData, setFormData] = useState<Partial<NewAffectation>>({
        jourSemaine: defaultDay,
        periode: defaultPeriod,
        operatingRoomId: defaultRoomId,
        applyToAllWeeks: false,
        roleType: 'ANESTHESIA'
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Charger les superviseurs disponibles
    const { data: supervisors } = useQuery({
        queryKey: ['supervisors', formData.jourSemaine, formData.periode],
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/utilisateurs', {
                params: {
                    role: 'SUPERVISOR',
                    available: true,
                    day: formData.jourSemaine,
                    period: formData.periode
                }
            });
            return response.data;
        },
        enabled: !!(formData.jourSemaine && formData.periode)
    });

    // Charger les salles disponibles
    const { data: rooms } = useQuery({
        queryKey: ['operating-rooms', formData.jourSemaine, formData.periode],
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-rooms', {
                params: {
                    available: true,
                    day: formData.jourSemaine,
                    period: formData.periode
                }
            });
            return response.data;
        },
        enabled: !!(formData.jourSemaine && formData.periode)
    });

    // Charger les types d'activité
    const { data: activityTypes } = useQuery({
        queryKey: ['activity-types'],
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/activity-types');
            return response.data;
        }
    });

    // Validation en temps réel
    useEffect(() => {
        const errors: string[] = [];
        
        if (!formData.jourSemaine) errors.push('Veuillez sélectionner un jour');
        if (!formData.periode) errors.push('Veuillez sélectionner une période');
        if (!formData.supervisorId) errors.push('Veuillez sélectionner un superviseur');
        if (!formData.activityTypeId) errors.push('Veuillez sélectionner un type d\'activité');
        
        if (formData.roleType === 'ANESTHESIA' && !formData.operatingRoomId) {
            errors.push('Veuillez sélectionner une salle pour l\'anesthésie');
        }
        
        setValidationErrors(errors);
    }, [formData]);

    const handleConfirm = () => {
        if (validationErrors.length === 0) {
            onConfirm(formData as NewAffectation);
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            jourSemaine: defaultDay,
            periode: defaultPeriod,
            operatingRoomId: defaultRoomId,
            applyToAllWeeks: false,
            roleType: 'ANESTHESIA'
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Créer une affectation
                    </DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle affectation pour la trameModele {trameModeleId}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Jour et période */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="day">
                                <Calendar className="h-4 w-4 inline mr-2" />
                                Jour
                            </Label>
                            <Select
                                value={formData.jourSemaine}
                                onValueChange={(value) => setFormData({ ...formData, jourSemaine: value as DayOfWeek })}
                            >
                                <SelectTrigger id="day">
                                    <SelectValue placeholder="Sélectionner un jour" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DAYS_MAP).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="period">
                                <Clock className="h-4 w-4 inline mr-2" />
                                Période
                            </Label>
                            <Select
                                value={formData.periode}
                                onValueChange={(value) => setFormData({ ...formData, periode: value as Period })}
                            >
                                <SelectTrigger id="period">
                                    <SelectValue placeholder="Sélectionner une période" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PERIODS_MAP).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Type de rôle */}
                    <div className="space-y-2">
                        <Label>Type d'affectation</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="roleType"
                                    value="ANESTHESIA"
                                    checked={formData.roleType === 'ANESTHESIA'}
                                    onChange={(e) => setFormData({ ...formData, roleType: 'ANESTHESIA' })}
                                />
                                Anesthésie
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="roleType"
                                    value="SUPERVISION"
                                    checked={formData.roleType === 'SUPERVISION'}
                                    onChange={(e) => setFormData({ ...formData, roleType: 'SUPERVISION' })}
                                />
                                Supervision
                            </label>
                        </div>
                    </div>

                    {/* Superviseur */}
                    <div className="space-y-2">
                        <Label htmlFor="supervisor">Superviseur</Label>
                        <Select
                            value={formData.supervisorId?.toString()}
                            onValueChange={(value) => setFormData({ ...formData, supervisorId: parseInt(value) })}
                            disabled={!supervisors || supervisors.length === 0}
                        >
                            <SelectTrigger id="supervisor">
                                <SelectValue placeholder="Sélectionner un superviseur" />
                            </SelectTrigger>
                            <SelectContent>
                                {supervisors?.map((supervisor: unknown) => (
                                    <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                        {supervisor.firstName} {supervisor.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Salle (seulement pour anesthésie) */}
                    {formData.roleType === 'ANESTHESIA' && (
                        <div className="space-y-2">
                            <Label htmlFor="room">Salle d'opération</Label>
                            <Select
                                value={formData.operatingRoomId?.toString()}
                                onValueChange={(value) => setFormData({ ...formData, operatingRoomId: parseInt(value) })}
                                disabled={!rooms || rooms.length === 0}
                            >
                                <SelectTrigger id="room">
                                    <SelectValue placeholder="Sélectionner une salle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms?.map((room: unknown) => (
                                        <SelectItem key={room.id} value={room.id.toString()}>
                                            {room.name} ({room.sector?.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Type d'activité */}
                    <div className="space-y-2">
                        <Label htmlFor="activity">Type d'activité</Label>
                        <Select
                            value={formData.activityTypeId?.toString()}
                            onValueChange={(value) => setFormData({ ...formData, activityTypeId: parseInt(value) })}
                            disabled={!activityTypes || activityTypes.length === 0}
                        >
                            <SelectTrigger id="activity">
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                {activityTypes?.map((type: unknown) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Appliquer à toutes les semaines */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="applyToAll"
                            checked={formData.applyToAllWeeks}
                            onCheckedChange={(checked) => 
                                setFormData({ ...formData, applyToAllWeeks: checked as boolean })
                            }
                        />
                        <Label htmlFor="applyToAll" className="text-sm font-normal">
                            Appliquer à toutes les semaines de la trameModele
                        </Label>
                    </div>

                    {/* Erreurs de validation */}
                    {validationErrors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <ul className="list-disc pl-4">
                                    {validationErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={validationErrors.length > 0}
                    >
                        Créer l'affectation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateAffectationDialog;