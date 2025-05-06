"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// Importer seulement les types, pas le schéma Zod complet avec effects
import { OperatingRoom, OperatingSector } from '@/modules/planning/bloc-operatoire/types';
import { useOperatingSectorsQuery } from '@/modules/planning/bloc-operatoire/hooks/useOperatingResourceQueries';
import { z } from 'zod';
import Button from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea'; // Export par défaut
import Switch from '@/components/ui/switch'; // Export par défaut
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Redéfinir explicitement le schéma Zod pour le formulaire de la salle
// car OperatingRoomSchema de models a des .refine/.transform
const ClientFormSchema = z.object({
    numero: z.string().min(1, { message: "Le numéro est requis." }),
    nom: z.string().min(1, { message: "Le nom est requis." }),
    secteurId: z.string().min(1, { message: "Le secteur est requis." }), // Garder en string pour le Select
    description: z.string().optional(),
    estActif: z.boolean().default(true),
    // Ajouter d'autres champs simples si besoin (capacite, equipements)
});
type FormData = z.infer<typeof ClientFormSchema>;

// Valeurs par défaut
const defaultFormValues: FormData = {
    numero: '',
    nom: '',
    secteurId: '', // Utiliser une string vide pour le Select
    description: '',
    estActif: true,
};

interface OperatingRoomFormProps {
    isOpen: boolean;
    onClose: () => void;
    // Le type soumis doit correspondre à ce qu'attend la mutation (Omit<OperatingRoom, 'id'>)
    onSubmit: (data: Omit<OperatingRoom, 'id'>, id?: string) => Promise<void>;
    initialData?: OperatingRoom | null;
    isLoading?: boolean;
}

export function OperatingRoomForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false
}: OperatingRoomFormProps) {
    const isEditing = !!initialData;

    const { data: sectors = [], isLoading: isLoadingSectors } = useOperatingSectorsQuery({}, { enabled: isOpen });

    // Initialiser le formulaire avec des strings pour secteurId
    const form = useForm<FormData>({
        resolver: zodResolver(ClientFormSchema),
        defaultValues: initialData
            ? { ...initialData, secteurId: String(initialData.secteurId) }
            : defaultFormValues,
    });

    useEffect(() => {
        if (isOpen) {
            const resetValues = initialData
                ? { ...initialData, secteurId: String(initialData.secteurId) }
                : defaultFormValues;
            form.reset(resetValues);
        }
    }, [isOpen, initialData, form]);

    const handleFormSubmit = form.handleSubmit(async (formData) => {
        // Convertir secteurId en string si nécessaire par l'API (ici on le garde en string)
        const apiData: Omit<OperatingRoom, 'id'> = {
            ...formData,
            // Assurer la cohérence avec le type OperatingRoom qui attend secteurId: string
            secteurId: formData.secteurId,
            // Ajouter les autres champs non présents dans le formulaire si besoin (ex: capacite, equipements)
            // qui pourraient avoir des valeurs par défaut ou être optionnels dans le type OperatingRoom
            capacite: initialData?.capacite, // Exemple: garder la valeur initiale si non modifiée
            equipements: initialData?.equipements, // Exemple
        };
        await onSubmit(apiData, initialData?.id);
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Modifier la salle' : 'Créer une salle'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifiez les informations de la salle opératoire."
                            : "Entrez les informations pour créer une nouvelle salle opératoire."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
                    {/* Champ Numéro */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numero" className="text-right">
                            Numéro
                        </Label>
                        <Input
                            id="numero"
                            {...form.register('numero')}
                            className={cn("col-span-3", form.formState.errors.numero && "border-red-500")}
                            disabled={isLoading}
                        />
                        {form.formState.errors.numero && (
                            <p className="col-span-4 text-red-500 text-sm text-right -mt-2">{form.formState.errors.numero.message}</p>
                        )}
                    </div>

                    {/* Champ Nom */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nom" className="text-right">
                            Nom
                        </Label>
                        <Input
                            id="nom"
                            {...form.register('nom')}
                            className={cn("col-span-3", form.formState.errors.nom && "border-red-500")}
                            disabled={isLoading}
                        />
                        {form.formState.errors.nom && (
                            <p className="col-span-4 text-red-500 text-sm text-right -mt-2">{form.formState.errors.nom.message}</p>
                        )}
                    </div>

                    {/* Champ Secteur */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="secteurId" className="text-right">
                            Secteur
                        </Label>
                        <Select
                            value={form.watch('secteurId') || ''} // S'assurer que value n'est jamais undefined pour Select
                            onValueChange={(value) => form.setValue('secteurId', value, { shouldValidate: true })}
                            disabled={isLoading || isLoadingSectors}
                        >
                            <SelectTrigger className={cn("col-span-3", form.formState.errors.secteurId && "border-red-500")}>
                                <SelectValue placeholder="Sélectionnez un secteur..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingSectors ? (
                                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                ) : sectors.length > 0 ? (
                                    sectors.map((sector: OperatingSector) => (
                                        <SelectItem key={sector.id} value={String(sector.id)}>
                                            {sector.nom}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-sectors" disabled>Aucun secteur trouvé</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.secteurId && (
                            <p className="col-span-4 text-red-500 text-sm text-right -mt-2">{form.formState.errors.secteurId.message}</p>
                        )}
                    </div>

                    {/* Champ Description */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            className="col-span-3"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Champ Actif */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="estActif" className="text-right">
                            Actif
                        </Label>
                        <div className="col-span-3 flex items-center">
                            <Switch
                                id="estActif"
                                checked={form.watch('estActif')}
                                onCheckedChange={(checked: boolean) => form.setValue('estActif', checked, { shouldValidate: true })}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}>
                            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Sauvegarder' : 'Créer')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 