'use client';

import React, { useState } from 'react';
import axios from 'axios';
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
    DialogTrigger,
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
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrameGridView, { TrameModele, WeekType } from './TrameGridView';

// Schéma de validation pour le formulaire
const formSchema = z.object({
    name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
    description: z.string().optional(),
    siteId: z.string().optional(),
    typeSemaine: z.enum(['TOUTES', 'PAIRES', 'IMPAIRES']),
    joursSemaineActifs: z.array(z.number().min(1).max(7)),
    dateDebutEffet: z.date({
        required_error: 'Une date de début est requise',
    }),
    dateFinEffet: z.date().optional(),
    recurrenceType: z.enum(['HEBDOMADAIRE', 'AUCUNE']),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTrameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTrameId: string) => void;
    sites: Array<{ id: string; name: string; }>;
}

const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 7, label: 'Dimanche' },
];

const NewTrameModal: React.FC<NewTrameModalProps> = ({ isOpen, onClose, onSuccess, sites }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState('informations');

    // Initialiser le formulaire avec des valeurs par défaut
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            siteId: '',
            typeSemaine: 'TOUTES',
            joursSemaineActifs: [1, 2, 3, 4, 5], // Lundi à vendredi par défaut
            dateDebutEffet: new Date(),
            recurrenceType: 'HEBDOMADAIRE',
        },
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/trame-modeles', data);
            console.log('Trame créée avec succès:', response.data);
            form.reset();
            onSuccess(response.data.id.toString());
            onClose();
        } catch (err: any) {
            console.error('Erreur lors de la création de la trame:', err);
            setError(err.response?.data?.error || 'Erreur lors de la création de la trame');
        } finally {
            setIsLoading(false);
        }
    };

    // Prévisualisation de la trame
    const previewTrame: TrameModele = {
        id: 'preview',
        name: form.watch('name') || 'Nouvelle Trame',
        description: form.watch('description'),
        siteId: form.watch('siteId') || 'site-default',
        weekType: form.watch('typeSemaine') === 'TOUTES' ? 'ALL' :
            form.watch('typeSemaine') === 'PAIRES' ? 'EVEN' : 'ODD',
        activeDays: form.watch('joursSemaineActifs') || [1, 2, 3, 4, 5],
        effectiveStartDate: form.watch('dateDebutEffet') || new Date(),
        effectiveEndDate: form.watch('dateFinEffet'),
        affectations: [],
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle>Créer une nouvelle trame</DialogTitle>
                    <DialogDescription>
                        Définissez les propriétés de base de la trame. Vous pourrez ajouter des affectations après sa création.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="informations" value={currentTab} onValueChange={setCurrentTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="informations">Informations générales</TabsTrigger>
                                <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
                            </TabsList>

                            <TabsContent value="informations" className="space-y-4 py-4 bg-white dark:bg-gray-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nom de la trame" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="siteId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Site</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value || ''}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un site (optionnel)" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-gray-800">
                                                            <SelectItem value="aucun">Aucun</SelectItem>
                                                            {sites.map(site => (
                                                                <SelectItem key={site.id} value={site.id}>
                                                                    {site.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Description (optionnelle)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="typeSemaine"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type de semaine*</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type de semaine" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-gray-800">
                                                            <SelectItem value="TOUTES">Toutes les semaines</SelectItem>
                                                            <SelectItem value="PAIRES">Semaines paires</SelectItem>
                                                            <SelectItem value="IMPAIRES">Semaines impaires</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="recurrenceType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type de récurrence*</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type de récurrence" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-gray-800">
                                                            <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                                                            <SelectItem value="AUCUNE">Aucune</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="dateDebutEffet"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date de début*</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full pl-3 text-left font-normal"
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, 'PPP', { locale: fr })
                                                                ) : (
                                                                    <span>Choisir une date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="dateFinEffet"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date de fin (optionnelle)</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full pl-3 text-left font-normal"
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, 'PPP', { locale: fr })
                                                                ) : (
                                                                    <span>Choisir une date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value || undefined}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < (form.watch('dateDebutEffet') || new Date())}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="joursSemaineActifs"
                                        render={() => (
                                            <FormItem className="col-span-2">
                                                <div className="mb-2">
                                                    <FormLabel>Jours actifs*</FormLabel>
                                                    <FormDescription>
                                                        Sélectionnez les jours de la semaine où cette trame est active
                                                    </FormDescription>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {daysOfWeek.map((day) => (
                                                        <FormField
                                                            key={day.value}
                                                            control={form.control}
                                                            name="joursSemaineActifs"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={day.value}
                                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(day.value)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const currentValues = field.value || [];
                                                                                    if (checked) {
                                                                                        field.onChange([...currentValues, day.value]);
                                                                                    } else {
                                                                                        field.onChange(
                                                                                            currentValues.filter(
                                                                                                (value) => value !== day.value
                                                                                            )
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="cursor-pointer font-normal">
                                                                            {day.label}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setCurrentTab('preview')}
                                    >
                                        Aperçu de la grille
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="space-y-4 py-4 bg-white dark:bg-gray-900">
                                <div className="border rounded p-4">
                                    <h3 className="text-lg font-medium mb-4">Aperçu de la grille</h3>
                                    <TrameGridView trame={previewTrame} readOnly={true} />
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setCurrentTab('informations')}
                                    >
                                        Retour aux informations
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Création en cours...' : 'Créer la trame'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewTrameModal; 