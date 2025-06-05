import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { Period } from '@prisma/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Composants UI standard
import {
    Button,
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
    Label,
} from '@/components/ui';

// Types et validations
const consultationSchema = z.object({
    date: z.date({ required_error: 'La date est requise' }),
    userId: z.number().int().positive({ message: 'Le médecin est requis' }),
    period: z.enum(['MATIN', 'APRES_MIDI', 'JOURNEE_ENTIERE'], {
        required_error: 'La période est requise',
    }),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    notes: z.string().optional(),
    specialtyId: z.number().int().positive().optional(),
    siteId: z.string().optional(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

type ConsultationFormProps = {
    initialData?: Partial<ConsultationFormValues>;
    onSubmit: (data: ConsultationFormValues) => Promise<void>;
    onCancel: () => void;
    isEditing?: boolean;
    users: { id: number; nom: string; prenom: string }[];
    specialties?: { id: number; name: string }[];
    sites?: { id: string; name: string }[];
};

const ConsultationForm: React.FC<ConsultationFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
    users,
    specialties = [],
    sites = [],
}) => {
    const [loading, setLoading] = useState(false);

    // Configuration du formulaire avec React Hook Form
    const form = useForm<ConsultationFormValues>({
        resolver: zodResolver(consultationSchema),
        defaultValues: {
            date: initialData?.date || new Date(),
            userId: initialData?.userId || undefined,
            period: initialData?.period || 'MATIN',
            heureDebut: initialData?.heureDebut || '',
            heureFin: initialData?.heureFin || '',
            notes: initialData?.notes || '',
            specialtyId: initialData?.specialtyId || undefined,
            siteId: initialData?.siteId || undefined,
        },
    });

    // Mise à jour automatique des heures de début/fin selon la période choisie
    useEffect(() => {
        const period = form.watch('period');

        // Définir les heures par défaut si vides ou si on change de période
        if (period === 'MATIN' && !form.getValues('heureDebut')) {
            form.setValue('heureDebut', '08:30');
            form.setValue('heureFin', '12:30');
        } else if (period === 'APRES_MIDI' && !form.getValues('heureDebut')) {
            form.setValue('heureDebut', '13:30');
            form.setValue('heureFin', '17:30');
        } else if (period === 'JOURNEE_ENTIERE' && !form.getValues('heureDebut')) {
            form.setValue('heureDebut', '08:30');
            form.setValue('heureFin', '17:30');
        }
    }, [form.watch('period')]);

    // Gestion de la soumission du formulaire
    const handleSubmit = async (values: ConsultationFormValues) => {
        try {
            setLoading(true);
            await onSubmit(values);
            toast.success(isEditing ? 'Consultation mise à jour' : 'Consultation créée');
        } catch (error: unknown) {
            logger.error('Erreur lors de la soumission :', error instanceof Error ? error : new Error(String(error)));
            toast.error('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {isEditing ? 'Modifier la consultation' : 'Nouvelle consultation'}
                </CardTitle>
            </CardHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <CardContent className="space-y-4">
                    {/* Date (utilisation d'un input standard au lieu de DatePicker) */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={form.watch('date') ? new Date(form.watch('date')).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const dateValue = e.target.value ? new Date(e.target.value) : null;
                                if (dateValue) {
                                    form.setValue('date', dateValue);
                                }
                            }}
                            className="w-full"
                        />
                        {form.formState.errors.date && (
                            <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
                        )}
                    </div>

                    {/* Médecin */}
                    <div className="space-y-2">
                        <Label htmlFor="userId">Médecin</Label>
                        <Select
                            value={form.watch('userId')?.toString() || ''}
                            onValueChange={(value) => form.setValue('userId', parseInt(value, 10))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un médecin" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.prenom} {user.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.userId && (
                            <p className="text-sm text-red-500">{form.formState.errors.userId.message}</p>
                        )}
                    </div>

                    {/* Période */}
                    <div className="space-y-2">
                        <Label htmlFor="period">Période</Label>
                        <Select
                            value={form.watch('period') || ''}
                            onValueChange={(value) => form.setValue('period', value as Period)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une période" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MATIN">Matin</SelectItem>
                                <SelectItem value="APRES_MIDI">Après-midi</SelectItem>
                                <SelectItem value="JOURNEE_ENTIERE">Journée entière</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.period && (
                            <p className="text-sm text-red-500">{form.formState.errors.period.message}</p>
                        )}
                    </div>

                    {/* Horaires */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="heureDebut">Heure de début</Label>
                            <Input
                                id="heureDebut"
                                type="time"
                                value={form.watch('heureDebut') || ''}
                                onChange={(e) => form.setValue('heureDebut', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="heureFin">Heure de fin</Label>
                            <Input
                                id="heureFin"
                                type="time"
                                value={form.watch('heureFin') || ''}
                                onChange={(e) => form.setValue('heureFin', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Spécialité (optionnel) */}
                    {specialties.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="specialtyId">Spécialité</Label>
                            <Select
                                value={form.watch('specialtyId')?.toString() || ''}
                                onValueChange={(value) => form.setValue('specialtyId', parseInt(value, 10))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une spécialité" />
                                </SelectTrigger>
                                <SelectContent>
                                    {specialties.map((specialty) => (
                                        <SelectItem key={specialty.id} value={specialty.id.toString()}>
                                            {specialty.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Site (optionnel) */}
                    {sites.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="siteId">Site</Label>
                            <Select
                                value={form.watch('siteId') || ''}
                                onValueChange={(value) => form.setValue('siteId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sites.map((site) => (
                                        <SelectItem key={site.id} value={site.id}>
                                            {site.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={form.watch('notes') || ''}
                            onChange={(e) => form.setValue('notes', e.target.value)}
                            placeholder="Notes ou informations complémentaires"
                            rows={3}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Chargement...' : isEditing ? 'Mettre à jour' : 'Créer'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default ConsultationForm; 