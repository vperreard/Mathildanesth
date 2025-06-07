'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogPortal,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, MinusIcon } from 'lucide-react';
import type { DayPeriod, StaffRole, AffectationModele } from './TrameGridView';

// Schéma de validation pour le formulaire
const formSchema = z.object({
    activityTypeId: z.string().min(1, 'Un type d\'activité est requis'),
    period: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']),
    isActive: z.boolean(),
    requiredStaff: z.array(z.object({
        role: z.enum(['MAR', 'SURGEON', 'IADE', 'IBODE']),
        count: z.number().min(1).max(10),
    })).min(1, 'Au moins un membre du personnel est requis'),
});

type FormValues = z.infer<typeof formSchema>;

interface AffectationConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (affectation: Partial<AffectationModele>) => void;
    roomId: string;
    dayCode: number;
    period: DayPeriod;
    roomName?: string;
    dayName?: string;
    availableActivityTypes?: Array<{ id: string; name: string; code: string; }>;
}

const staffRoles = [
    { value: 'MAR', label: 'MAR', color: 'bg-blue-100 text-blue-800' },
    { value: 'SURGEON', label: 'Chirurgien', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'IADE', label: 'IADE', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'IBODE', label: 'IBODE', color: 'bg-amber-100 text-amber-800' },
] as const;

const defaultActivityTypes = [
    { id: 'activity1', name: 'Bloc Opératoire', code: 'BLOC' },
    { id: 'activity2', name: 'Consultation', code: 'CONSULT' },
    { id: 'activity3', name: 'Garde', code: 'GARDE' },
    { id: 'activity4', name: 'Astreinte', code: 'ASTREINTE' },
];

const AffectationConfigModal: React.FC<AffectationConfigModalProps> = ({
    isOpen,
    onClose,
    onSave,
    roomId,
    dayCode,
    period,
    roomName = "Salle",
    dayName = "Jour",
    availableActivityTypes = defaultActivityTypes
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // Initialiser le formulaire avec des valeurs par défaut
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            activityTypeId: '',
            period: period,
            isActive: true,
            requiredStaff: [
                { role: 'MAR', count: 1 }
            ],
        },
    });

    const watchedActivityType = form.watch('activityTypeId');
    const watchedStaff = form.watch('requiredStaff');

    // Déterminer si l'activité sélectionnée est 24h
    const selectedActivity = availableActivityTypes.find(a => a.id === watchedActivityType);
    const isFullDayActivity = selectedActivity && (selectedActivity.code === 'GARDE' || selectedActivity.code === 'ASTREINTE');

    // Mettre à jour automatiquement la période si c'est une activité 24h
    useEffect(() => {
        if (isFullDayActivity) {
            form.setValue('period', 'FULL_DAY');
        }
    }, [isFullDayActivity, form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            // Créer l'objet affectation
            const newAffectation: Partial<AffectationModele> = {
                id: `new-${Date.now()}`,
                roomId: roomId,
                activityTypeId: data.activityTypeId,
                period: data.period,
                dayOverride: dayCode,
                isActive: data.isActive,
                requiredStaff: data.requiredStaff.map((staff, index) => ({
                    id: `staff-${Date.now()}-${index}`,
                    affectationId: `new-${Date.now()}`,
                    role: staff.role as StaffRole,
                    count: staff.count,
                })),
            };

            logger.info('Nouvelle affectation créée:', newAffectation);
            onSave(newAffectation);
            onClose();
            form.reset();
        } catch (error) {
            logger.error('Erreur lors de la création de l\'affectation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStaff = () => {
        const currentStaff = form.getValues('requiredStaff');
        form.setValue('requiredStaff', [...currentStaff, { role: 'MAR', count: 1 }]);
    };

    const handleRemoveStaff = (index: number) => {
        const currentStaff = form.getValues('requiredStaff');
        if (currentStaff.length > 1) {
            form.setValue('requiredStaff', currentStaff.filter((_, i) => i !== index));
        }
    };

    const getPeriodLabel = (period: DayPeriod) => {
        switch (period) {
            case 'MORNING': return 'Matin';
            case 'AFTERNOON': return 'Après-midi';
            case 'FULL_DAY': return '24 heures';
            default: return period;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogPortal>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Nouvelle affectation
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{roomName}</Badge>
                                <Badge variant="outline">{dayName}</Badge>
                                <Badge variant="secondary">{getPeriodLabel(form.watch('period'))}</Badge>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Type d'activité */}
                            <FormField
                                control={form.control}
                                name="activityTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Type d'activité*</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un type d'activité" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                                                    {availableActivityTypes.map(activity => (
                                                        <SelectItem key={activity.id} value={activity.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{activity.name}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {activity.code}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Période (lecture seule si 24h automatique) */}
                            <FormField
                                control={form.control}
                                name="period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Période</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isFullDayActivity}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                                                    <SelectItem value="MORNING">Matin</SelectItem>
                                                    <SelectItem value="AFTERNOON">Après-midi</SelectItem>
                                                    <SelectItem value="FULL_DAY">24 heures</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        {isFullDayActivity && (
                                            <FormDescription className="text-xs text-blue-600">
                                                Les gardes et astreintes sont automatiquement configurées en 24h
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Personnel requis */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-medium">Personnel requis*</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddStaff}
                                        className="h-8 w-8 p-0"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                </div>

                                {watchedStaff.map((staff, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                        <FormField
                                            control={form.control}
                                            name={`requiredStaff.${index}.role`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                                                                {staffRoles.map(role => (
                                                                    <SelectItem key={role.value} value={role.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`w-3 h-3 rounded ${role.color.split(' ')[0]}`}></div>
                                                                            {role.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`requiredStaff.${index}.count`}
                                            render={({ field }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                            className="text-center"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {watchedStaff.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveStaff(index)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                            >
                                                <MinusIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="pt-4">
                                <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Création...' : 'Créer l\'affectation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default AffectationConfigModal;