import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Input,
    Select,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OperatingRoomSchema, type OperatingRoom, type OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { z } from 'zod';

type FormValues = z.infer<typeof OperatingRoomSchema>;

interface AddRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (room: OperatingRoom) => void;
}

export default function AddRoomModal({ isOpen, onClose, onAdd }: AddRoomModalProps) {
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(OperatingRoomSchema),
        defaultValues: {
            name: '',
            number: '',
            sectorId: '',
            isActive: true,
            colorCode: '#1e88e5'
        }
    });

    useEffect(() => {
        async function fetchSectors() {
            try {
                const response = await fetch('/api/operating-sectors');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des secteurs');
                }

                const data = await response.json();
                setSectors(data);
            } catch (error) {
                console.error('Erreur:', error);
                setSubmitError('Impossible de charger les secteurs opératoires');
            }
        }

        fetchSectors();
    }, []);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/operating-rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la salle');
            }

            const createdRoom = await response.json();
            onAdd(createdRoom);
            form.reset();
        } catch (error) {
            console.error('Erreur:', error);
            setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une salle d'opération">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom de la salle</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Nom de la salle" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Numéro de la salle</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Exemple: A-101" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sectorId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Secteur</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <Select.Trigger>
                                            <Select.Value placeholder="Sélectionner un secteur" />
                                        </Select.Trigger>
                                        <Select.Content>
                                            {sectors.map((sector) => (
                                                <Select.Item key={sector.id} value={sector.id}>
                                                    {sector.name}
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="colorCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Couleur</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="w-10 h-10 rounded-md cursor-pointer"
                                        />
                                        <Input {...field} placeholder="#000000" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4"
                                    />
                                </FormControl>
                                <FormLabel className="cursor-pointer">Salle active</FormLabel>
                            </FormItem>
                        )}
                    />

                    {submitError && (
                        <div className="text-red-500 text-sm">{submitError}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            Ajouter
                        </Button>
                    </div>
                </form>
            </Form>
        </Modal>
    );
} 