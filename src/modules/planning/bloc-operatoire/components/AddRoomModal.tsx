/*
 * d'incompatibilité de types entre Zod et React Hook Form.
 * 
 * PROBLÈME DÉTECTÉ:
 * 1. Incompatibilité entre le type de retour de zodResolver et ce qu'attend useForm
 * 2. Problèmes avec les valeurs initiales qui ne correspondent pas parfaitement au schema
 * 3. Types incompatibles pour les sectorId convertis de string à number
 * 
 * SOLUTION À LONG TERME:
 * 1. Créer des types explicites pour les données du formulaire et les distinguer des types du modèle
 * 2. Utiliser une interface utilisée à la fois par le schéma Zod et par useForm
 * 3. Ajouter des transformations appropriées dans le schéma Zod pour la conversion string/number
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OperatingRoom, OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { OperatingRoomSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import Button from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Type modifié pour le formulaire
type OperatingRoomFormData = {
    id?: number;
    name: string;
    number: string;
    sectorId?: number;
    sector?: string;
    colorCode: string;
    isActive: boolean;
    supervisionRules: Record<string, any>;
};

interface AddRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: z.infer<typeof OperatingRoomSchema>) => Promise<void>;
    sectors: OperatingSector[];
    initialData?: Partial<OperatingRoom>;
}

export function AddRoomModal({ isOpen, onClose, onSave, sectors, initialData }: AddRoomModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData?.id;

    // Initialiser le formulaire avec des valeurs par défaut appropriées
    const form = useForm<OperatingRoomFormData>({
        resolver: zodResolver(OperatingRoomSchema),
        defaultValues: {
            name: initialData?.name || '',
            number: initialData?.number || '',
            sectorId: initialData?.sectorId || undefined,
            sector: initialData?.sector || undefined,
            colorCode: initialData?.colorCode || '#000000',
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            supervisionRules: initialData?.supervisionRules || {}
        },
    });

    const onSubmit = async (data: OperatingRoomFormData) => {
        setIsLoading(true);
        try {
            await onSave(data);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Modifier la salle' : 'Ajouter une salle'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifiez les détails de la salle opératoire.' : 'Entrez les détails de la nouvelle salle opératoire.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nom de la salle" {...field} />
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
                                    <FormLabel>Numéro</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Numéro de la salle" {...field} />
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
                                    <Select
                                        onValueChange={(value) => {
                                            const numValue = Number(value);
                                            if (!isNaN(numValue)) {
                                                field.onChange(numValue);
                                            } else {
                                                // Si la conversion échoue, stocker comme chaîne dans 'sector'
                                                form.setValue('sector', value);
                                                field.onChange(undefined);
                                            }
                                        }}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un secteur" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sectors
                                                .filter(sector => sector.id !== undefined)
                                                .map((sector) => (
                                                    <SelectItem key={sector.id!} value={sector.id!.toString()}>
                                                        {sector.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
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
                                                value={field.value || '#000000'}
                                                onChange={field.onChange}
                                                className="w-10 h-10 rounded-md cursor-pointer"
                                            />
                                            <Input {...field} value={field.value || '#000000'} placeholder="#000000" />
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Actif</FormLabel>
                                        <FormDescription>
                                            Indique si la salle est actuellement utilisable.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Sauvegarde...' : (isEditing ? 'Sauvegarder' : 'Ajouter')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 