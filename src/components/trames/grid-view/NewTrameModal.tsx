'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { logger } from '../../../lib/logger';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  selectedSectors: z.array(z.string()).optional(),
  selectedRooms: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTrameId: string) => void;
  sites: Array<{ id: string; name: string }>;
  initialTrame?: TrameModele;
  isEditMode?: boolean;
  rooms?: unknown[]; // Ajout des salles d'opération
  sectors?: unknown[]; // Ajout des secteurs d'opération
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

const NewTrameModal: React.FC<NewTrameModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sites,
  initialTrame,
  isEditMode,
  rooms,
  sectors,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('informations');

  logger.info('[DEBUG NewTrameModal] Component rendered with props:', {
    isOpen,
    sitesCount: sites?.length || 0,
    roomsCount: rooms?.length || 0,
    sectorsCount: sectors?.length || 0,
    isEditMode,
    hasInitialTrame: !!initialTrame,
    initialTrameDetailsJson: initialTrame?.detailsJson,
    selectedSectorsFromDetailsJson: initialTrame?.detailsJson?.selectedSectors,
    selectedRoomsFromDetailsJson: initialTrame?.detailsJson?.selectedRooms,
  });

  // Initialiser le formulaire avec des valeurs par défaut
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialTrame?.name || '',
      description: initialTrame?.description || '',
      siteId: initialTrame?.siteId || '',
      typeSemaine:
        initialTrame?.weekType === 'ALL'
          ? 'TOUTES'
          : initialTrame?.weekType === 'EVEN'
            ? 'PAIRES'
            : 'IMPAIRES',
      joursSemaineActifs: initialTrame?.activeDays || [1, 2, 3, 4, 5],
      dateDebutEffet: initialTrame?.effectiveStartDate || new Date(),
      dateFinEffet: initialTrame?.effectiveEndDate,
      recurrenceType: 'HEBDOMADAIRE',
      // Charger les secteurs et salles depuis detailsJson si disponible
      selectedSectors: initialTrame?.detailsJson?.selectedSectors || [],
      selectedRooms: initialTrame?.detailsJson?.selectedRooms || [],
    },
  });

  // Watch du siteId pour filtrer les secteurs et salles
  const selectedSiteId = form.watch('siteId');

  // Filtrer les secteurs et salles selon le site sélectionné
  const filteredSectors = useMemo(() => {
    if (!selectedSiteId || selectedSiteId === 'aucun') {
      logger.info(
        '[DEBUG NewTrameModal] No site selected, showing all sectors:',
        sectors?.length || 0
      );
      return sectors || [];
    }
    const filtered = (sectors || []).filter(
      (sector: any) =>
        sector.siteId === selectedSiteId || sector.siteId === parseInt(selectedSiteId)
    );
    logger.info(
      '[DEBUG NewTrameModal] Filtered sectors for site',
      selectedSiteId,
      ':',
      filtered.length,
      'out of',
      sectors?.length || 0
    );
    return filtered;
  }, [sectors, selectedSiteId]);

  const filteredRooms = useMemo(() => {
    if (!selectedSiteId || selectedSiteId === 'aucun') {
      logger.info('[DEBUG NewTrameModal] No site selected, showing all rooms:', rooms?.length || 0);
      return rooms || [];
    }
    const filtered = (rooms || []).filter(
      (room: any) => room.siteId === selectedSiteId || room.siteId === parseInt(selectedSiteId)
    );
    logger.info(
      '[DEBUG NewTrameModal] Filtered rooms for site',
      selectedSiteId,
      ':',
      filtered.length,
      'out of',
      rooms?.length || 0
    );
    return filtered;
  }, [rooms, selectedSiteId]);

  // Grouper les salles filtrées par secteur
  const roomsBySector = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    filteredRooms.forEach((room: any) => {
      const sectorId = room.operatingSectorId || room.sectorId || 'no-sector';
      if (!grouped[sectorId]) {
        grouped[sectorId] = [];
      }
      grouped[sectorId].push(room);
    });

    // Trier les salles dans chaque secteur
    Object.keys(grouped).forEach(sectorId => {
      grouped[sectorId].sort((a: any, b: any) => {
        // Trier par numéro si disponible, sinon par nom
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [filteredRooms]);

  // Réinitialiser les sélections de secteurs/salles quand le site change (sauf en mode édition initial)
  useEffect(() => {
    // Ne pas réinitialiser si on est en mode édition et que c'est le premier rendu
    const isInitialEditLoad = isEditMode && initialTrame && !form.formState.isDirty;
    if (!isInitialEditLoad) {
      form.setValue('selectedSectors', []);
      form.setValue('selectedRooms', []);
      logger.info(
        '[DEBUG NewTrameModal] Site changed, reset sectors/rooms selection. New site:',
        selectedSiteId
      );
    }
  }, [selectedSiteId, form, isEditMode, initialTrame]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // Préparer les données pour detailsJson
      const detailsJson = {
        selectedSectors: data.selectedSectors || [],
        selectedRooms: data.selectedRooms || [],
      };

      // Convertir le format grille vers le format API Prisma
      const apiData = {
        ...data,
        typeSemaine:
          data.typeSemaine === 'TOUTES'
            ? 'TOUTES'
            : data.typeSemaine === 'PAIRES'
              ? 'PAIRES'
              : 'IMPAIRES',
        // Gérer le siteId : null si vide ou 'aucun'
        siteId: data.siteId && data.siteId !== 'aucun' && data.siteId !== '' ? data.siteId : null,
        // Stocker les secteurs et salles dans detailsJson
        detailsJson: detailsJson,
      };

      // Retirer les champs qui ne doivent pas être envoyés directement
      delete apiData.selectedSectors;
      delete apiData.selectedRooms;

      logger.info('Données de trame avec périmètre sélectionné:', {
        name: data.name,
        sectorsCount: detailsJson.selectedSectors.length,
        roomsCount: detailsJson.selectedRooms.length,
        detailsJson: detailsJson,
      });

      let response;
      if (isEditMode && initialTrame) {
        // Mode modification - PUT
        response = await axios.put(`/api/trame-modeles/${initialTrame.id}`, apiData);
        logger.info('TrameModele modifiée avec succès:', response.data);
      } else {
        // Mode création - POST
        response = await axios.post('/api/trame-modeles', apiData);
        logger.info('TrameModele créée avec succès:', response.data);
      }
      form.reset();
      onSuccess(response.data.id.toString());
      onClose();
    } catch (err: unknown) {
      logger.error(
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la trameModele:`,
        err
      );
      setError(
        err.response?.data?.error ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la trameModele`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Prévisualisation de la trameModele
  const previewTrame: TrameModele = {
    id: 'preview',
    name: form.watch('name') || 'Nouvelle TrameModele',
    description: form.watch('description'),
    siteId: form.watch('siteId') || 'site-default',
    weekType:
      form.watch('typeSemaine') === 'TOUTES'
        ? 'ALL'
        : form.watch('typeSemaine') === 'PAIRES'
          ? 'EVEN'
          : 'ODD',
    activeDays: form.watch('joursSemaineActifs') || [1, 2, 3, 4, 5],
    effectiveStartDate: form.watch('dateDebutEffet') || new Date(),
    effectiveEndDate: form.watch('dateFinEffet'),
    affectations: [],
    // Inclure les secteurs et salles sélectionnés pour le filtrage de la prévisualisation
    detailsJson: {
      selectedSectors: form.watch('selectedSectors') || [],
      selectedRooms: form.watch('selectedRooms') || [],
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        logger.info('[DEBUG NewTrameModal] Dialog onOpenChange called with:', open);
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogContent className="sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[55vw] h-[85vh] max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 z-[100] overflow-hidden">
          <DialogHeader className="pb-2 flex-shrink-0">
            <DialogTitle className="text-lg">
              {isEditMode ? 'Modifier la trameModele' : 'Créer une nouvelle trameModele'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditMode
                ? 'Modifiez les propriétés de la trameModele. Les affectations existantes seront conservées.'
                : 'Définissez les propriétés de base de la trameModele. Vous pourrez ajouter des affectations après sa création.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full overflow-hidden"
            >
              <Tabs
                defaultValue="informations"
                value={currentTab}
                onValueChange={setCurrentTab}
                className="flex flex-col h-full overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-2 mb-3 flex-shrink-0 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <TabsTrigger
                    value="informations"
                    className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold rounded transition-all"
                  >
                    Informations générales
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold rounded transition-all"
                  >
                    Prévisualisation
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto px-1 pb-4 min-h-0">
                  <TabsContent value="informations" className="space-y-3 mt-0 px-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Nom*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nom de la trameModele"
                                {...field}
                                className="h-9"
                              />
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
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Sélectionner un site (optionnel)" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-[200] border border-gray-200 dark:border-gray-700">
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
                              <Input
                                placeholder="Description (optionnelle)"
                                {...field}
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Section Configuration temporelle - AVANT le périmètre */}
                      <div className="lg:col-span-2 space-y-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Configuration temporelle
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="typeSemaine"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Type de semaine*
                                </FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Type de semaine" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 z-[200] border border-gray-200 dark:border-gray-700">
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
                                <FormLabel className="text-sm font-medium">
                                  Type de récurrence*
                                </FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Type de récurrence" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 z-[200] border border-gray-200 dark:border-gray-700">
                                      <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                                      <SelectItem value="AUCUNE">Aucune</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="dateDebutEffet"
                          render={({ field: fieldDebut }) => (
                            <FormField
                              control={form.control}
                              name="dateFinEffet"
                              render={({ field: fieldFin }) => (
                                <FormItem className="lg:col-span-2">
                                  <FormLabel className="text-sm font-medium">
                                    Période d'effet*
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Date de début (obligatoire) et optionnellement date de fin
                                  </FormDescription>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className="w-full h-9 text-left font-normal"
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fieldDebut.value ? (
                                              format(fieldDebut.value, 'dd/MM/yyyy')
                                            ) : (
                                              <span>Date de début</span>
                                            )}
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 z-[200]">
                                        <Calendar
                                          mode="single"
                                          selected={fieldDebut.value}
                                          onSelect={fieldDebut.onChange}
                                          disabled={date => date < new Date()}
                                          initialFocus
                                          locale={fr}
                                        />
                                      </PopoverContent>
                                    </Popover>

                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className="w-full h-9 text-left font-normal"
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fieldFin.value ? (
                                              format(fieldFin.value, 'dd/MM/yyyy')
                                            ) : (
                                              <span>Date de fin (optionnelle)</span>
                                            )}
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 z-[200]">
                                        <Calendar
                                          mode="single"
                                          selected={fieldFin.value}
                                          onSelect={fieldFin.onChange}
                                          disabled={date =>
                                            date < new Date() ||
                                            (fieldDebut.value && date < fieldDebut.value)
                                          }
                                          initialFocus
                                          locale={fr}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
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
                                  Sélectionnez les jours de la semaine où cette trame est active
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-7 gap-2">
                                {daysOfWeek.map(day => (
                                  <FormField
                                    key={day.value}
                                    control={form.control}
                                    name="joursSemaineActifs"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={day.value}
                                          className="flex flex-col items-center space-y-1"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(day.value)}
                                              onCheckedChange={checked => {
                                                const currentValues = field.value || [];
                                                if (checked) {
                                                  field.onChange([...currentValues, day.value]);
                                                } else {
                                                  field.onChange(
                                                    currentValues.filter(
                                                      value => value !== day.value
                                                    )
                                                  );
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="cursor-pointer font-normal text-xs">
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

                      {/* Section Périmètre de la trame - APRÈS la configuration temporelle */}
                      <div className="lg:col-span-2 space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Périmètre de la trame (optionnel)
                          </h4>
                          <div className="text-xs text-gray-500">
                            Laisser vide = toutes les salles
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Sélectionnez les secteurs et/ou salles spécifiques pour cette trame. Si
                          rien n'est sélectionné, la trame s'appliquera à toutes les salles
                          {selectedSiteId && selectedSiteId !== 'aucun'
                            ? ' du site sélectionné'
                            : ''}
                          .
                        </p>

                        {selectedSiteId && selectedSiteId !== 'aucun' && (
                          <div className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 p-2 rounded">
                            <strong>Filtrage actif :</strong> Seuls les secteurs et salles du site
                            sélectionné sont affichés.
                            {filteredSectors.length === 0 && filteredRooms.length === 0 && (
                              <span className="block mt-1 text-orange-600 dark:text-orange-400">
                                ⚠️ Aucun secteur ou salle trouvé pour ce site.
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sélection des secteurs */}
                        {filteredSectors && filteredSectors.length > 0 && (
                          <FormField
                            control={form.control}
                            name="selectedSectors"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Secteurs</FormLabel>
                                <FormDescription className="text-xs">
                                  Choisir les secteurs d'activité concernés
                                </FormDescription>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                                  {filteredSectors.map((sector: any) => (
                                    <FormField
                                      key={sector.id}
                                      control={form.control}
                                      name="selectedSectors"
                                      render={({ field }) => {
                                        return (
                                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(
                                                  sector.id.toString()
                                                )}
                                                onCheckedChange={checked => {
                                                  const currentValues = field.value || [];
                                                  if (checked) {
                                                    field.onChange([
                                                      ...currentValues,
                                                      sector.id.toString(),
                                                    ]);
                                                  } else {
                                                    field.onChange(
                                                      currentValues.filter(
                                                        value => value !== sector.id.toString()
                                                      )
                                                    );
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer font-normal text-xs">
                                              {sector.name}
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
                        )}

                        {/* Sélection des salles */}
                        {filteredRooms && filteredRooms.length > 0 && (
                          <FormField
                            control={form.control}
                            name="selectedRooms"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-1">
                                  <FormLabel className="text-sm font-medium">
                                    Salles spécifiques
                                  </FormLabel>
                                  {field.value && field.value.length > 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {field.value.length} salle{field.value.length > 1 ? 's' : ''}{' '}
                                      sélectionnée{field.value.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <FormDescription className="text-xs">
                                  Choisir des salles individuelles (optionnel) - organisées par
                                  secteur
                                </FormDescription>
                                <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-3">
                                  {Object.entries(roomsBySector).map(([sectorId, sectorRooms]) => {
                                    // Trouver le nom du secteur - vérifier avec et sans conversion toString
                                    const sector =
                                      filteredSectors.find(
                                        (s: any) =>
                                          s.id.toString() === sectorId ||
                                          s.id === sectorId ||
                                          s.id === parseInt(sectorId)
                                      ) ||
                                      sectors?.find(
                                        (s: any) =>
                                          s.id.toString() === sectorId ||
                                          s.id === sectorId ||
                                          s.id === parseInt(sectorId)
                                      );

                                    const sectorName =
                                      sector?.name ||
                                      (sectorId === 'no-sector'
                                        ? 'Sans secteur'
                                        : `Secteur non trouvé`);
                                    const sectorColor = sector?.colorCode || '#e5e7eb';

                                    logger.info(
                                      `[DEBUG NewTrameModal] Secteur ${sectorId}: trouvé=${!!sector}, nom=${sectorName}`
                                    );

                                    return (
                                      <div key={sectorId} className="space-y-2">
                                        <div
                                          className="text-xs font-medium px-2 py-1 rounded flex items-center justify-between"
                                          style={{
                                            backgroundColor: `${sectorColor}20`,
                                            borderLeft: `3px solid ${sectorColor}`,
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{sectorName}</span>
                                            <span className="text-gray-500">
                                              ({sectorRooms.length} salles)
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            onClick={() => {
                                              const currentValues = field.value || [];
                                              const sectorRoomIds = sectorRooms.map((r: any) =>
                                                r.id.toString()
                                              );
                                              const allSelected = sectorRoomIds.every(id =>
                                                currentValues.includes(id)
                                              );

                                              if (allSelected) {
                                                // Désélectionner toutes les salles du secteur
                                                field.onChange(
                                                  currentValues.filter(
                                                    id => !sectorRoomIds.includes(id)
                                                  )
                                                );
                                              } else {
                                                // Sélectionner toutes les salles du secteur
                                                const newValues = [
                                                  ...new Set([...currentValues, ...sectorRoomIds]),
                                                ];
                                                field.onChange(newValues);
                                              }
                                            }}
                                          >
                                            {(() => {
                                              const currentValues = field.value || [];
                                              const sectorRoomIds = sectorRooms.map((r: any) =>
                                                r.id.toString()
                                              );
                                              const allSelected = sectorRoomIds.every(id =>
                                                currentValues.includes(id)
                                              );
                                              return allSelected
                                                ? 'Tout désélectionner'
                                                : 'Tout sélectionner';
                                            })()}
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                                          {sectorRooms.map((room: any) => (
                                            <FormField
                                              key={room.id}
                                              control={form.control}
                                              name="selectedRooms"
                                              render={({ field }) => {
                                                return (
                                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                      <Checkbox
                                                        checked={field.value?.includes(
                                                          room.id.toString()
                                                        )}
                                                        onCheckedChange={checked => {
                                                          const currentValues = field.value || [];
                                                          if (checked) {
                                                            field.onChange([
                                                              ...currentValues,
                                                              room.id.toString(),
                                                            ]);
                                                          } else {
                                                            field.onChange(
                                                              currentValues.filter(
                                                                value =>
                                                                  value !== room.id.toString()
                                                              )
                                                            );
                                                          }
                                                        }}
                                                      />
                                                    </FormControl>
                                                    <FormLabel className="cursor-pointer font-normal text-xs">
                                                      {room.name}
                                                    </FormLabel>
                                                  </FormItem>
                                                );
                                              }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
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
                      <TrameGridView
                        trameModele={previewTrame}
                        readOnly={true}
                        rooms={filteredRooms}
                        sectors={filteredSectors}
                      />
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

              {error && (
                <div className="flex-shrink-0 text-red-500 text-sm px-4 py-2 border-t">{error}</div>
              )}

              <DialogFooter className="flex-shrink-0 pt-3 px-4 pb-3 border-t bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  size="sm"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} size="sm">
                  {isLoading
                    ? isEditMode
                      ? 'Modification...'
                      : 'Création...'
                    : isEditMode
                      ? 'Modifier'
                      : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default NewTrameModal;
