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
import { Calendar } from '@/components/ui/calendrier';
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
    initialTrame?: TrameModele;
    isEditMode?: boolean;
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

const NewTrameModal: React.FC<NewTrameModalProps> = ({ isOpen, onClose, onSuccess, sites, initialTrame, isEditMode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState('informations');

    // Initialiser le formulaire avec des valeurs par défaut
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialTrame?.name || '',
            description: initialTrame?.description || '',
            siteId: initialTrame?.siteId || '',
            typeSemaine: initialTrame?.weekType === 'ALL' ? 'TOUTES' :
                initialTrame?.weekType === 'EVEN' ? 'PAIRES' : 'IMPAIRES',
            joursSemaineActifs: initialTrame?.activeDays || [1, 2, 3, 4, 5],
            dateDebutEffet: initialTrame?.effectiveStartDate || new Date(),
            dateFinEffet: initialTrame?.effectiveEndDate,
            recurrenceType: 'HEBDOMADAIRE',
        },
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            // Convertir le format grille vers le format API Prisma
            const apiData = {
                ...data,
                typeSemaine: data.typeSemaine === 'TOUTES' ? 'TOUTES' :
                    data.typeSemaine === 'PAIRES' ? 'PAIRES' : 'IMPAIRES',
                // Gérer le siteId : null si vide ou 'aucun'
                siteId: (data.siteId && data.siteId !== 'aucun' && data.siteId !== '') ? data.siteId : null
            };

            let response;
            if (isEditMode && initialTrame) {
                // Mode modification - PUT
                response = await axios.put(`http://localhost:3000/api/tableau de service-modeles/${initialTrame.id}`, apiData);
                console.log('Tableau de service modifiée avec succès:', response.data);
            } else {
                // Mode création - POST
                response = await axios.post('http://localhost:3000/api/tableau de service-modeles', apiData);
                console.log('Tableau de service créée avec succès:', response.data);
            }
            form.reset();
            onSuccess(response.data.id.toString());
            onClose();
        } catch (err: any) {
            console.error(`Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la tableau de service:`, err);
            setError(err.response?.data?.error || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la tableau de service`);
        } finally {
            setIsLoading(false);
        }
    };

    // Prévisualisation de la tableau de service
    const previewTrame: TrameModele = {
        id: 'preview',
        name: form.watch('name') || 'Nouvelle Tableau de service',
        description: form.watch('description'),
        siteId: form.watch('siteId') || 'site-default',
        weekType: form.watch('typeSemaine') === 'TOUTES' ? 'ALL' :
            form.watch('typeSemaine') === 'PAIRES' ? 'EVEN' : 'ODD',
        activeDays: form.watch('joursSemaineActifs') || [1, 2, 3, 4, 5],
        effectiveStartDate: form.watch('dateDebutEffet') || new Date(),
        effectiveEndDate: form.watch('dateFinEffet'),
        gardes/vacations: [],
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[55vw] max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg">
                        {isEditMode ? 'Modifier la tableau de service' : 'Créer une nouvelle tableau de service'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {isEditMode
                            ? 'Modifiez les propriétés de la tableau de service. Les gardes/vacations existantes seront conservées.'
                            : 'Définissez les propriétés de base de la tableau de service. Vous pourrez ajouter des gardes/vacations après sa création.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <Tabs defaultValue="informations" value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full">
                            <TabsList className="grid w-full grid-cols-2 mb-3">
                                <TabsTrigger value="informations" className="text-sm">Informations générales</TabsTrigger>
                                <TabsTrigger value="preview" className="text-sm">Prévisualisation</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                <TabsContent value="informations" className="space-y-3 mt-0 px-1">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Nom*</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nom de la tableau de service" {...field} className="h-9" />
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
                                                    <FormLabel className="text-sm font-medium">Site</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value || ''}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="h-9">
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
                                                <FormItem className="lg:col-span-2">
                                                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Description (optionnelle)" {...field} className="h-9" />
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
                                                    <FormLabel className="text-sm font-medium">Type de semaine*</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="h-9">
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
                                                    <FormLabel className="text-sm font-medium">Type de récurrence*</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="h-9">
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
                                            render={({ field: fieldDebut }) => (
                                                <FormField
                                                    control={form.control}
                                                    name="dateFinEffet"
                                                    render={({ field: fieldFin }) => (
                                                        <FormItem className="lg:col-span-2">
                                                            <FormLabel className="text-sm font-medium">Période d'effet*</FormLabel>
                                                            <FormDescription className="text-xs">
                                                                Date de début (obligatoire) et optionnellement date de fin
                                                            </FormDescription>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full h-auto p-3 text-left font-normal hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-dashed hover:border-solid"
                                                                        >
                                                                            <div className="flex flex-col space-y-1 w-full">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                                        Période d'application
                                                                                    </span>
                                                                                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                                                                                </div>

                                                                                {fieldDebut.value ? (
                                                                                    <div className="space-y-1">
                                                                                        <div className="flex items-center text-xs">
                                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                                                            <span>
                                                                                                <strong>Début:</strong> {format(fieldDebut.value, 'dd/MM/yyyy')}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center text-xs">
                                                                                            <div className={`w-2 h-2 rounded-full mr-2 ${fieldFin.value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                                            <span>
                                                                                                <strong>Fin:</strong> {fieldFin.value
                                                                                                    ? format(fieldFin.value, 'dd/MM/yyyy')
                                                                                                    : 'Permanente'
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-muted-foreground text-xs">
                                                                                        Cliquez pour définir la période
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    className="w-auto p-0 bg-white dark:bg-gray-800 shadow-xl border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                                                                    align="center"
                                                                    side="bottom"
                                                                    sideOffset={8}
                                                                    avoidCollisions={true}
                                                                    collisionPadding={20}
                                                                >
                                                                    {/* En-tête du calendrier */}
                                                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900">
                                                                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                                                            Période d'effet de la tableau de service
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            1. Sélectionnez la date de début (obligatoire)
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            2. Optionnel: sélectionnez la date de fin
                                                                        </p>
                                                                    </div>

                                                                    {/* Calendrier principal */}
                                                                    <div className="p-4">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={fieldDebut.value}
                                                                            onSelect={(date) => {
                                                                                if (date) {
                                                                                    fieldDebut.onChange(date);
                                                                                    // Si la date de fin est antérieure à la nouvelle date de début, la réinitialiser
                                                                                    if (fieldFin.value && fieldFin.value < date) {
                                                                                        fieldFin.onChange(undefined);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            disabled={(date) => date < new Date()}
                                                                            initialFocus
                                                                            locale={fr}
                                                                            className="rounded-lg"
                                                                            classNames={{
                                                                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                                                                month: "space-y-4",
                                                                                caption: "flex justify-center pt-1 relative items-center",
                                                                                caption_label: "text-lg font-semibold",
                                                                                nav: "space-x-1 flex items-center",
                                                                                nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700",
                                                                                nav_button_previous: "absolute left-1",
                                                                                nav_button_next: "absolute right-1",
                                                                                table: "w-full border-collapse space-y-1",
                                                                                head_row: "flex",
                                                                                head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] text-center",
                                                                                row: "flex w-full mt-2",
                                                                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                                                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                                                                day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
                                                                                day_today: "bg-accent text-accent-foreground font-semibold",
                                                                                day_outside: "text-muted-foreground opacity-50",
                                                                                day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                                                                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                                                day_hidden: "invisible",
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Section date de fin */}
                                                                    {fieldDebut.value && (
                                                                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                                                                            <div className="mb-3">
                                                                                <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                                                                    Date de fin (optionnelle)
                                                                                </h5>
                                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                    Laissez vide pour une tableau de service permanente
                                                                                </p>
                                                                            </div>

                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={fieldFin.value || undefined}
                                                                                onSelect={(date) => {
                                                                                    fieldFin.onChange(date);
                                                                                }}
                                                                                disabled={(date) => date < fieldDebut.value}
                                                                                locale={fr}
                                                                                className="rounded-lg"
                                                                                classNames={{
                                                                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                                                                    month: "space-y-4",
                                                                                    caption: "flex justify-center pt-1 relative items-center",
                                                                                    caption_label: "text-base font-medium",
                                                                                    nav: "space-x-1 flex items-center",
                                                                                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700",
                                                                                    nav_button_previous: "absolute left-1",
                                                                                    nav_button_next: "absolute right-1",
                                                                                    table: "w-full border-collapse space-y-1",
                                                                                    head_row: "flex",
                                                                                    head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.75rem] text-center",
                                                                                    row: "flex w-full mt-1",
                                                                                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                                                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs",
                                                                                    day_selected: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600",
                                                                                    day_today: "bg-accent text-accent-foreground font-semibold",
                                                                                    day_outside: "text-muted-foreground opacity-50",
                                                                                    day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                                                                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                                                    day_hidden: "invisible",
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Footer avec résumé et actions */}
                                                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                                {fieldDebut.value ? (
                                                                                    <div className="space-y-1">
                                                                                        <div>✅ Début: {format(fieldDebut.value, 'dd/MM/yyyy')}</div>
                                                                                        <div>{fieldFin.value ? `✅ Fin: ${format(fieldFin.value, 'dd/MM/yyyy')}` : '⏳ Fin: Non définie (permanente)'}</div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div>❌ Sélectionnez d'abord la date de début</div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex space-x-2">
                                                                                {fieldFin.value && (
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 px-3 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                                        onClick={() => {
                                                                                            fieldFin.onChange(undefined);
                                                                                        }}
                                                                                    >
                                                                                        Effacer fin
                                                                                    </Button>
                                                                                )}
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="default"
                                                                                    size="sm"
                                                                                    className="h-7 px-3 text-xs"
                                                                                    onClick={() => {
                                                                                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                                                                    }}
                                                                                    disabled={!fieldDebut.value}
                                                                                >
                                                                                    Valider
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="joursSemaineActifs"
                                            render={() => (
                                                <FormItem className="lg:col-span-2">
                                                    <div className="mb-2">
                                                        <FormLabel className="text-sm font-medium">Jours actifs*</FormLabel>
                                                        <FormDescription className="text-xs">
                                                            Sélectionnez les jours de la semaine où cette tableau de service est active
                                                        </FormDescription>
                                                    </div>
                                                    <div className="grid grid-cols-3 lg:grid-cols-7 gap-2">
                                                        {daysOfWeek.map((day) => (
                                                            <FormField
                                                                key={day.value}
                                                                control={form.control}
                                                                name="joursSemaineActifs"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem
                                                                            key={day.value}
                                                                            className="flex flex-row items-center space-x-2 space-y-0"
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
                                                                            <FormLabel className="cursor-pointer font-normal text-sm">
                                                                                {day.label.slice(0, 3)}
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

                                    <div className="flex justify-end space-x-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentTab('preview')}
                                        >
                                            Aperçu de la grille
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="preview" className="space-y-3 mt-0 px-1">
                                    <div className="border rounded p-3">
                                        <h3 className="text-base font-medium mb-3">Aperçu de la grille</h3>
                                        <TrameGridView tableau de service={previewTrame} readOnly={true} />
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentTab('informations')}
                                        >
                                            Retour aux informations
                                        </Button>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        {error && <div className="text-red-500 text-sm mt-3">{error}</div>}

                        <DialogFooter className="pt-3 border-t mt-3">
                            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading} size="sm">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading} size="sm">
                                {isLoading ?
                                    (isEditMode ? 'Modification...' : 'Création...') :
                                    (isEditMode ? 'Modifier' : 'Créer')
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewTrameModal; 