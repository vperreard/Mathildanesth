"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OperatingSector } from '@/modules/planning/bloc-operatoire/types';
import { z } from 'zod';
// Assumer des exports par défaut pour les composants UI
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
import { Label } from '@/components/ui/label'; // Import nommé
import Textarea from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";

// Redéfinir le FormSchema explicitement pour éviter les problèmes avec pick et les types optionnels
const FormSchema = z.object({
    nom: z.string().min(1, { message: "Le nom est requis." }),
    description: z.string().optional(),
    // Assurer que couleur est une string valide (format hex)
    couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Format de couleur invalide (#RRGGBB)." }).default('#000000'),
    estActif: z.boolean().default(true),
});
type FormData = z.infer<typeof FormSchema>;

// Valeurs par défaut basées sur le schéma
const defaultFormValues: FormData = FormSchema.parse({});

interface OperatingSectorFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData, id?: string) => Promise<void>;
    initialData?: OperatingSector | null;
    isLoading?: boolean;
}

export function OperatingSectorForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false
}: OperatingSectorFormProps) {
    const isEditing = !!initialData;

    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        // Les defaultValues sont utilisés à l'initialisation
        defaultValues: initialData ?? defaultFormValues,
    });

    // Réinitialiser le formulaire quand les données initiales changent OU quand on ouvre la modale
    useEffect(() => {
        if (isOpen) {
            form.reset(initialData ?? defaultFormValues);
        }
    }, [isOpen, initialData, form]); // form est une dépendance stable

    const handleFormSubmit = form.handleSubmit(async (data) => {
        await onSubmit(data, initialData?.id);
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Modifier le secteur' : 'Créer un secteur'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifiez les informations du secteur opératoire."
                            : "Entrez les informations pour créer un nouveau secteur opératoire."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
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

                    {/* Champ Couleur */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="couleur" className="text-right">
                            Couleur
                        </Label>
                        <Input
                            id="couleur"
                            type="color"
                            {...form.register('couleur')}
                            className={cn("col-span-1 h-10 w-16 p-1 border-none", form.formState.errors.couleur && "border-red-500 ring-2 ring-red-500")}
                            disabled={isLoading}
                        />
                        <span className="col-span-2 text-sm text-gray-500 dark:text-gray-400">{form.watch('couleur')}</span>
                        {form.formState.errors.couleur && (
                            <p className="col-span-4 text-red-500 text-sm text-right -mt-2">{form.formState.errors.couleur.message}</p>
                        )}
                    </div>

                    {/* Champ Actif */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        {/* Utiliser le label comme ID implicite pour le switch */}
                        <Label htmlFor="estActif" className="text-right">
                            Actif
                        </Label>
                        <div className="col-span-3 flex items-center">
                            <Switch
                                id="estActif" // L'id est nécessaire pour le htmlFor du Label
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
                        {/* Désactiver le bouton si le formulaire n'est pas valide ou n'a pas changé */}
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}>
                            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Sauvegarder' : 'Créer')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 