'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '../../../lib/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUsers } from '@/hooks/useUsers';
import { useSurgeons } from '@/hooks/useSurgeons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, MinusIcon, ChevronRight } from 'lucide-react';
import type { DayPeriod, StaffRole, AffectationModele } from './TrameGridView';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

// Schéma de validation pour le formulaire
const formSchema = z.object({
  activityTypeId: z.string().min(1, "Un type d'activité est requis"),
  period: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY', 'MORNING_AND_AFTERNOON']),
  isActive: z.boolean(),
  requiredStaff: z
    .array(
      z.object({
        role: z.enum(['MAR', 'SURGEON', 'IADE', 'IBODE']),
        count: z.number().min(1).max(10),
        userId: z.string().optional(), // ID de l'utilisateur spécifique (optionnel)
      })
    )
    .min(1, 'Au moins un membre du personnel est requis'),
});

type FormValues = z.infer<typeof formSchema>;

interface AffectationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (affectation: Partial<AffectationModele>) => void;
  onDelete?: () => void;
  roomId: string;
  dayCode: number;
  period: DayPeriod;
  roomName?: string;
  dayName?: string;
  availableActivityTypes?: Array<{ id: string; name: string; code: string }>;
  existingAffectation?: AffectationModele;
  isEditing?: boolean;
  availableUsers?: Array<{
    id: string;
    name: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }>;
}

const staffRoles = [
  { value: 'MAR', label: 'MAR', color: 'bg-blue-100 text-blue-800' },
  { value: 'SURGEON', label: 'Chirurgien', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'IADE', label: 'IADE', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'IBODE', label: 'IBODE', color: 'bg-amber-100 text-amber-800' },
] as const;

const defaultActivityTypes = [
  { id: 'activity1', name: 'Bloc Opératoire', code: 'BLOC' },
  { id: 'activity2', name: 'Consultation', code: 'CONSULT' },
  { id: 'activity3', name: 'Garde', code: 'GARDE' },
  { id: 'activity4', name: 'Astreinte', code: 'ASTREINTE' },
];

const AffectationConfigModal: React.FC<AffectationConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  roomId,
  dayCode,
  period,
  roomName = 'Salle',
  dayName = 'Jour',
  availableActivityTypes = defaultActivityTypes,
  existingAffectation,
  isEditing = false,
  availableUsers = [],
}) => {
  // Récupérer les utilisateurs réels
  const { users: realUsers, isLoading: usersLoading, error: usersError } = useUsers();
  // Récupérer les chirurgiens et spécialités
  const { surgeons, specialties, isLoading: surgeonsLoading, error: surgeonsError } = useSurgeons();
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser le formulaire avec des valeurs par défaut ou existantes
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityTypeId: existingAffectation?.activityTypeId || '',
      period: existingAffectation?.period || period,
      isActive: existingAffectation?.isActive !== undefined ? existingAffectation.isActive : true,
      requiredStaff: existingAffectation?.requiredStaff?.map(staff => ({
        role: staff.role,
        count: staff.count,
        userId: staff.userId || 'none',
      })) || [{ role: 'MAR', count: 1, userId: 'none' }],
    },
  });

  // Réinitialiser le formulaire quand l'affectation existante change
  useEffect(() => {
    if (existingAffectation) {
      form.reset({
        activityTypeId: existingAffectation.activityTypeId || '',
        period: existingAffectation.period || period,
        isActive: existingAffectation.isActive !== undefined ? existingAffectation.isActive : true,
        requiredStaff: existingAffectation.requiredStaff?.map(staff => ({
          role: staff.role,
          count: staff.count,
          userId: staff.userId || 'none',
        })) || [{ role: 'MAR', count: 1, userId: 'none' }],
      });
    }
  }, [existingAffectation, form, period]);

  const watchedActivityType = form.watch('activityTypeId');
  const watchedStaff = form.watch('requiredStaff');

  // Déterminer si l'activité sélectionnée est 24h
  const selectedActivity = availableActivityTypes.find(a => a.id === watchedActivityType);
  const isFullDayActivity =
    selectedActivity &&
    (selectedActivity.code === 'GARDE' || selectedActivity.code === 'ASTREINTE');

  // Mettre à jour automatiquement la période si c'est une activité 24h
  useEffect(() => {
    if (isFullDayActivity) {
      form.setValue('period', 'FULL_DAY');
    }
  }, [isFullDayActivity, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Si la période est "MORNING_AND_AFTERNOON", créer deux affectations
      if (data.period === 'MORNING_AND_AFTERNOON') {
        // Générer des timestamps uniques pour éviter les conflits
        const morningTimestamp = Date.now();
        const afternoonTimestamp = morningTimestamp + 1000; // S'assurer que les IDs sont différents

        // Créer l'affectation du matin
        const morningAffectation: Partial<AffectationModele> = {
          id: `new-morning-${morningTimestamp}`,
          roomId: roomId,
          activityTypeId: data.activityTypeId,
          period: 'MORNING' as DayPeriod,
          dayOverride: dayCode,
          isActive: data.isActive,
          requiredStaff: data.requiredStaff.map((staff, index) => ({
            id: `staff-morning-${morningTimestamp}-${index}`,
            affectationId: `new-morning-${morningTimestamp}`,
            role: staff.role as StaffRole,
            count: staff.count,
            userId: staff.userId && staff.userId !== 'none' ? staff.userId : undefined,
          })),
        };

        // Créer l'affectation de l'après-midi
        const afternoonAffectation: Partial<AffectationModele> = {
          id: `new-afternoon-${afternoonTimestamp}`,
          roomId: roomId,
          activityTypeId: data.activityTypeId,
          period: 'AFTERNOON' as DayPeriod,
          dayOverride: dayCode,
          isActive: data.isActive,
          requiredStaff: data.requiredStaff.map((staff, index) => ({
            id: `staff-afternoon-${afternoonTimestamp}-${index}`,
            affectationId: `new-afternoon-${afternoonTimestamp}`,
            role: staff.role as StaffRole,
            count: staff.count,
            userId: staff.userId && staff.userId !== 'none' ? staff.userId : undefined,
          })),
        };

        logger.info('Création de deux affectations (matin + après-midi):', {
          morningAffectation,
          afternoonAffectation,
        });

        // Sauvegarder les deux affectations séquentiellement
        // D'abord le matin
        await onSave(morningAffectation);
        // Attendre plus longtemps pour permettre la mise à jour du state React
        await new Promise(resolve => setTimeout(resolve, 500));
        // Puis l'après-midi
        await onSave(afternoonAffectation);
      } else {
        // Comportement normal pour une seule période
        const newAffectation: Partial<AffectationModele> = {
          id: `new-${Date.now()}`,
          roomId: roomId,
          activityTypeId: data.activityTypeId,
          period: data.period as DayPeriod,
          dayOverride: dayCode,
          isActive: data.isActive,
          requiredStaff: data.requiredStaff.map((staff, index) => ({
            id: `staff-${Date.now()}-${index}`,
            affectationId: `new-${Date.now()}`,
            role: staff.role as StaffRole,
            count: staff.count,
            userId: staff.userId && staff.userId !== 'none' ? staff.userId : undefined,
          })),
        };

        logger.info('Nouvelle affectation créée:', newAffectation);
        await onSave(newAffectation);
      }

      onClose();
      form.reset();
    } catch (error) {
      logger.error("Erreur lors de la création de l'affectation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = () => {
    const currentStaff = form.getValues('requiredStaff');
    form.setValue('requiredStaff', [...currentStaff, { role: 'MAR', count: 1, userId: 'none' }]);
  };

  const handleRemoveStaff = (index: number) => {
    const currentStaff = form.getValues('requiredStaff');
    if (currentStaff.length > 1) {
      form.setValue(
        'requiredStaff',
        currentStaff.filter((_, i) => i !== index)
      );
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'MORNING':
        return 'Matin';
      case 'AFTERNOON':
        return 'Après-midi';
      case 'FULL_DAY':
        return '24 heures';
      case 'MORNING_AND_AFTERNOON':
        return 'Matin + Après-midi';
      default:
        return period;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isEditing ? "Modifier l'affectation" : 'Nouvelle affectation'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configurer l'affectation pour {roomName} - {dayName} -{' '}
              {getPeriodLabel(form.watch('period'))}
            </DialogDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{roomName}</Badge>
              <Badge variant="outline">{dayName}</Badge>
              <Badge variant="secondary">{getPeriodLabel(form.watch('period'))}</Badge>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Type d'activité */}
              <FormField
                control={form.control}
                name="activityTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Type d'activité*</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type d'activité" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                          {availableActivityTypes.map(activity => (
                            <SelectItem key={activity.id} value={activity.id}>
                              <div className="flex items-center gap-2">
                                <span>{activity.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.code}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Période (lecture seule si 24h automatique) */}
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Période</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isFullDayActivity}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                          <SelectItem value="MORNING">Matin</SelectItem>
                          <SelectItem value="AFTERNOON">Après-midi</SelectItem>
                          <SelectItem value="MORNING_AND_AFTERNOON">Matin + Après-midi</SelectItem>
                          <SelectItem value="FULL_DAY">24 heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isFullDayActivity && (
                      <FormDescription className="text-xs text-blue-600">
                        Les gardes et astreintes sont automatiquement configurées en 24h
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personnel requis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Personnel requis*</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStaff}
                    className="h-8 w-8 p-0"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>

                {watchedStaff.map((staff, index) => (
                  <div key={index} className="flex flex-col gap-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`requiredStaff.${index}.role`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                                  {staffRoles.map(role => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-3 h-3 rounded ${role.color.split(' ')[0]}`}
                                        ></div>
                                        {role.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`requiredStaff.${index}.count`}
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                className="text-center"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchedStaff.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStaff(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Sélecteur d'utilisateur spécifique */}
                    {watchedStaff[index]?.role === 'SURGEON' ? (
                      // Pour les chirurgiens : menu en cascade avec spécialités
                      <FormField
                        control={form.control}
                        name={`requiredStaff.${index}.userId`}
                        render={({ field }) => {
                          // Trouver le chirurgien sélectionné pour afficher son nom
                          const selectedSurgeon =
                            field.value &&
                            field.value !== 'none' &&
                            field.value.startsWith('surgeon-')
                              ? surgeons.find(
                                  s => s.id === parseInt(field.value.replace('surgeon-', ''))
                                )
                              : null;

                          return (
                            <FormItem>
                              <FormLabel className="text-xs">Chirurgien</FormLabel>
                              <FormControl>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-between text-sm font-normal"
                                      type="button"
                                    >
                                      {selectedSurgeon ? (
                                        `Dr ${selectedSurgeon.prenom} ${selectedSurgeon.nom}`
                                      ) : (
                                        <span className="text-gray-500">
                                          Sélectionner un chirurgien...
                                        </span>
                                      )}
                                      <ChevronRight className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    className="w-[280px] bg-white dark:bg-gray-800"
                                    style={{ zIndex: 300 }}
                                  >
                                    {/* Option pour désélectionner */}
                                    <DropdownMenuItem
                                      onSelect={() => field.onChange('none')}
                                      className="text-gray-500 italic"
                                    >
                                      Aucun chirurgien spécifique
                                    </DropdownMenuItem>

                                    {/* Spécialités avec sous-menus */}
                                    {specialties.map(specialty => {
                                      // Filtrer les chirurgiens de cette spécialité
                                      const specialtySurgeons = surgeons.filter(surgeon =>
                                        surgeon.specialties.some(s => s.id === specialty.id)
                                      );

                                      if (specialtySurgeons.length === 0) return null;

                                      return (
                                        <DropdownMenuSub key={specialty.id}>
                                          <DropdownMenuSubTrigger className="data-[state=open]:bg-gray-100">
                                            <span className="flex-1">{specialty.name}</span>
                                            <Badge variant="secondary" className="ml-2">
                                              {specialtySurgeons.length}
                                            </Badge>
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuPortal>
                                            <DropdownMenuSubContent
                                              className="bg-white dark:bg-gray-800 max-h-[400px] overflow-y-auto"
                                              style={{ zIndex: 301 }}
                                            >
                                              {specialtySurgeons.map(surgeon => (
                                                <DropdownMenuItem
                                                  key={surgeon.id}
                                                  onSelect={() =>
                                                    field.onChange(`surgeon-${surgeon.id}`)
                                                  }
                                                  className="cursor-pointer hover:bg-gray-100"
                                                >
                                                  <div className="flex flex-col">
                                                    <span className="font-medium">
                                                      Dr {surgeon.prenom} {surgeon.nom}
                                                    </span>
                                                    {surgeon.specialties.length > 1 && (
                                                      <span className="text-xs text-gray-500">
                                                        {surgeon.specialties
                                                          .map(s => s.name)
                                                          .join(', ')}
                                                      </span>
                                                    )}
                                                  </div>
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuSubContent>
                                          </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                      );
                                    })}

                                    {/* Option pour voir tous les chirurgiens sans filtre */}
                                    {surgeons.length > 0 && (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="data-[state=open]:bg-gray-100">
                                          <span className="flex-1 text-gray-600">
                                            Tous les chirurgiens
                                          </span>
                                          <Badge variant="outline" className="ml-2">
                                            {surgeons.length}
                                          </Badge>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                          <DropdownMenuSubContent
                                            className="bg-white dark:bg-gray-800 max-h-[400px] overflow-y-auto"
                                            style={{ zIndex: 301 }}
                                          >
                                            {surgeons.map(surgeon => (
                                              <DropdownMenuItem
                                                key={surgeon.id}
                                                onSelect={() =>
                                                  field.onChange(`surgeon-${surgeon.id}`)
                                                }
                                                className="cursor-pointer hover:bg-gray-100"
                                              >
                                                <div className="flex flex-col">
                                                  <span className="font-medium">
                                                    Dr {surgeon.prenom} {surgeon.nom}
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {surgeon.specialties
                                                      .map(s => s.name)
                                                      .join(', ')}
                                                  </span>
                                                </div>
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                      </DropdownMenuSub>
                                    )}

                                    {/* Messages de chargement/erreur */}
                                    {surgeonsLoading && (
                                      <DropdownMenuItem disabled>
                                        <span className="text-gray-500 italic">
                                          Chargement des chirurgiens...
                                        </span>
                                      </DropdownMenuItem>
                                    )}
                                    {surgeonsError && (
                                      <DropdownMenuItem disabled>
                                        <span className="text-red-500 italic">
                                          Erreur: {surgeonsError}
                                        </span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Optionnel : assignez un chirurgien spécifique
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    ) : (
                      // Pour les autres rôles : sélection directe
                      <FormField
                        control={form.control}
                        name={`requiredStaff.${index}.userId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value || 'none'} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Aucun utilisateur spécifique" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-[200]">
                                  <SelectItem value="none">
                                    <span className="text-gray-500 italic">
                                      Aucun utilisateur spécifique
                                    </span>
                                  </SelectItem>
                                  {/* Utilisateurs réels de la base de données, filtrés par rôle */}
                                  {(() => {
                                    const filteredUsers = realUsers.filter(user => {
                                      const staffRole = watchedStaff[index]?.role;
                                      if (!staffRole) return true;

                                      // Correspondance entre les rôles du formulaire et les rôles de la base
                                      const roleMapping: Record<string, string[]> = {
                                        MAR: ['MAR'],
                                        IADE: ['IADE'],
                                        SURGEON: ['SECRETAIRE'], // Temporaire : pas de chirurgien dans l'enum
                                        IBODE: ['SECRETAIRE'], // Temporaire : pas d'IBODE dans l'enum
                                      };

                                      const acceptedRoles = roleMapping[staffRole] || [staffRole];
                                      return acceptedRoles.includes(user.professionalRole);
                                    });

                                    if (filteredUsers.length === 0 && !usersLoading) {
                                      return (
                                        <SelectItem value="no-users" disabled>
                                          <span className="text-gray-500 italic">
                                            Aucun utilisateur {watchedStaff[index]?.role} disponible
                                          </span>
                                        </SelectItem>
                                      );
                                    }

                                    return filteredUsers.map(user => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.prenom} {user.nom} ({user.professionalRole})
                                      </SelectItem>
                                    ));
                                  })()}
                                  {usersLoading && (
                                    <SelectItem value="loading" disabled>
                                      <span className="text-gray-500 italic">
                                        Chargement des utilisateurs...
                                      </span>
                                    </SelectItem>
                                  )}
                                  {usersError && (
                                    <SelectItem value="error" disabled>
                                      <span className="text-red-500 italic">
                                        Erreur: {usersError}
                                      </span>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Optionnel : assignez un utilisateur spécifique à ce poste
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-4">
                <div className="flex justify-between w-full">
                  <div>
                    {onDelete && isEditing && (
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={onDelete}
                        disabled={isLoading}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? 'Création...'
                        : isEditing
                          ? "Modifier l'affectation"
                          : "Créer l'affectation"}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default AffectationConfigModal;
