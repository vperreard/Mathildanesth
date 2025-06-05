import { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Textarea,
    Label,
    Select,
    RadioGroup,
    RadioGroupItem
} from '@/components/ui';
import { useForm, Controller } from 'react-hook-form';
import {
    SupervisionRuleSchema,
    SupervisionRuleType,
    type SupervisionRule
} from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface AddSupervisionRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (rule: SupervisionRule) => void;
    sectorId?: string | number;
}

type FormValues = Omit<SupervisionRule, 'id' | 'createdAt' | 'updatedAt'>;

export default function AddSupervisionRuleModal({ isOpen, onClose, onAdd, sectorId }: AddSupervisionRuleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Array<{ id: string, number: string }>>([]);

    const form = useForm<FormValues>({
        defaultValues: {
            name: '',
            description: '',
            type: SupervisionRuleType.MAX_ROOMS_PER_SUPERVISOR,
            isActive: true,
            value: 2,
            parameters: {
                maxRooms: 2
            },
            sectorIds: sectorId ? [Number(sectorId)] : []
        }
    });

    const selectedType = form.watch('type');

    useEffect(() => {
        if (selectedType === SupervisionRuleType.ROOM_RESTRICTION) {
            fetchRooms();
        }
    }, [selectedType]);

    async function fetchRooms() {
        try {
            const response = await fetch('http://localhost:3000/api/operating-rooms');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des salles');
            }
            const data = await response.json();
            setRooms(data.map((room: unknown) => ({ id: room.id, number: room.number })));
        } catch (error: unknown) {
            logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    // Mettre à jour les paramètres en fonction du type sélectionné
    useEffect(() => {
        const type = form.getValues('type');
        let parameters: any = {};

        switch (type) {
            case SupervisionRuleType.MAX_ROOMS_PER_SUPERVISOR:
                parameters = { maxRooms: form.getValues('value') || 2 };
                break;
            case SupervisionRuleType.REQUIRED_SKILL:
                parameters = { skillName: '' };
                break;
            case SupervisionRuleType.ROOM_RESTRICTION:
                parameters = { roomNumber: '' };
                break;
        }

        form.setValue('parameters', parameters);
    }, [form.watch('type')]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        setError(null);

        // Mise à jour des paramètres avant envoi
        if (values.type === SupervisionRuleType.MAX_ROOMS_PER_SUPERVISOR) {
            values.parameters = { maxRooms: values.value || 2 };
        }

        try {
            const response = await fetch('http://localhost:3000/api/planning-rules/bloc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la règle');
            }

            const createdRule = await response.json();
            onAdd(createdRule);
            form.reset();
            onClose();
        } catch (error: unknown) {
            logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
            setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajouter une règle de supervision</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la règle</Label>
                        <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Nom de la règle"
                            className={form.formState.errors.name ? "border-red-500" : ""}
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
                            placeholder="Description de la règle"
                            rows={2}
                            className={form.formState.errors.description ? "border-red-500" : ""}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Type de règle</Label>
                        <Controller
                            name="type"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup
                                    onValueChange={(val) => field.onChange(Number(val))}
                                    defaultValue={field.value.toString()}
                                    className="space-y-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={SupervisionRuleType.MAX_ROOMS_PER_SUPERVISOR.toString()} id="type-max-rooms" />
                                        <Label htmlFor="type-max-rooms">Nombre max de salles par superviseur</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={SupervisionRuleType.REQUIRED_SKILL.toString()} id="type-skill" />
                                        <Label htmlFor="type-skill">Compétence requise</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={SupervisionRuleType.ROOM_RESTRICTION.toString()} id="type-room" />
                                        <Label htmlFor="type-room">Restriction de salle</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        />
                    </div>

                    {selectedType === SupervisionRuleType.MAX_ROOMS_PER_SUPERVISOR && (
                        <div className="space-y-2">
                            <Label htmlFor="value">Nombre maximum de salles</Label>
                            <Input
                                id="value"
                                type="number"
                                min={1}
                                max={10}
                                {...form.register('value', { valueAsNumber: true })}
                                className={form.formState.errors.value ? "border-red-500" : ""}
                            />
                            {form.formState.errors.value && (
                                <p className="text-sm text-red-500">{form.formState.errors.value.message}</p>
                            )}
                        </div>
                    )}

                    {selectedType === SupervisionRuleType.REQUIRED_SKILL && (
                        <div className="space-y-2">
                            <Label htmlFor="skillName">Compétence requise</Label>
                            <Input
                                id="skillName"
                                {...form.register('parameters.skillName')}
                                placeholder="Nom de la compétence"
                                className={form.formState.errors.parameters?.skillName ? "border-red-500" : ""}
                            />
                            {form.formState.errors.parameters?.skillName && (
                                <p className="text-sm text-red-500">{form.formState.errors.parameters.skillName.message}</p>
                            )}
                        </div>
                    )}

                    {selectedType === SupervisionRuleType.ROOM_RESTRICTION && (
                        <div className="space-y-2">
                            <Label htmlFor="roomNumber">Salle concernée</Label>
                            <Controller
                                name="parameters.roomNumber"
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <Select.Trigger id="roomNumber" className="w-full">
                                            <Select.Value placeholder="Sélectionner une salle" />
                                        </Select.Trigger>
                                        <Select.Content>
                                            {rooms.map((room) => (
                                                <Select.Item key={room.id} value={room.number}>
                                                    {room.number}
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.parameters?.roomNumber && (
                                <p className="text-sm text-red-500">{form.formState.errors.parameters.roomNumber.message}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            {...form.register('isActive')}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">Règle active</Label>
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