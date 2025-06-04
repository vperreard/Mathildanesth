import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Textarea,
    Label
} from '@/components/ui';
import { useForm } from 'react-hook-form';
import { OperatingSectorSchema, type OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type FormValues = z.infer<typeof OperatingSectorSchema>;

interface AddSectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (sector: OperatingSector) => void;
}

export default function AddSectorModal({ isOpen, onClose, onAdd }: AddSectorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(OperatingSectorSchema),
        defaultValues: {
            name: '',
            description: '',
            colorCode: '#3b82f6',
            isActive: true,
            maxRoomsPerSupervisor: 2 // Valeur par défaut
        }
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/operating-sectors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création du secteur');
            }

            const createdSector = await response.json();
            onAdd(createdSector);
            form.reset();
            onClose();
        } catch (error) {
            console.error('Erreur:', error);
            setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un secteur opératoire</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du secteur</Label>
                        <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Nom du secteur"
                            error={form.formState.errors.name?.message}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optionnelle)</Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Description du secteur"
                            rows={3}
                            error={form.formState.errors.description?.message}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="colorCode">Couleur</Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                id="colorPicker"
                                value={form.watch('colorCode')}
                                onChange={(e) => form.setValue('colorCode', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                                id="colorCode"
                                {...form.register('colorCode')}
                                placeholder="#000000"
                                error={form.formState.errors.colorCode?.message}
                            />
                        </div>
                        {form.formState.errors.colorCode && (
                            <p className="text-sm text-red-500">{form.formState.errors.colorCode.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxRoomsPerSupervisor">Nombre maximum de salles par superviseur</Label>
                        <Input
                            id="maxRoomsPerSupervisor"
                            type="number"
                            min={1}
                            max={10}
                            {...form.register('maxRoomsPerSupervisor', { valueAsNumber: true })}
                            error={form.formState.errors.maxRoomsPerSupervisor?.message}
                        />
                        {form.formState.errors.maxRoomsPerSupervisor && (
                            <p className="text-sm text-red-500">{form.formState.errors.maxRoomsPerSupervisor.message}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            {...form.register('isActive')}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">Secteur actif</Label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Chargement...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 