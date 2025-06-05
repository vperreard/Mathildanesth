import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import Textarea from '@/components/ui/textarea';
import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OperatingRoom, OperatingSector, OperatingRoomStatus } from '../types';
import { OperatingRoomService } from '../services/OperatingRoomService';

// Définition du schéma de validation avec Zod
const roomFormSchema = z.object({
  numero: z.string().min(1, 'Le numéro est obligatoire'),
  nom: z.string().min(1, 'Le nom est obligatoire'),
  secteurId: z.string().min(1, 'Le secteur est obligatoire'),
  description: z.string().optional(),
  equipements: z.array(z.string()).optional(),
  status: z.enum(['DISPONIBLE', 'OCCUPE', 'MAINTENANCE', 'HORS_SERVICE']).optional(),
  estActif: z.boolean(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface OperatingRoomFormProps {
  room?: OperatingRoom; // Si défini, mode édition, sinon mode création
  onSubmit: (room: Omit<OperatingRoom, 'id'> | OperatingRoom) => void;
  onCancel: () => void;
}

export const OperatingRoomForm: React.FC<OperatingRoomFormProps> = ({
  room,
  onSubmit,
  onCancel,
}) => {
  const [sectors, setSectors] = useState<OperatingSector[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Équipements communs prédéfinis (pourrait venir d'une API)
  const commonEquipments = [
    { value: 'Table orthopédique', label: 'Table orthopédique' },
    { value: 'Arthroscope', label: 'Arthroscope' },
    { value: 'Microscope', label: 'Microscope' },
    { value: 'Moniteur cardiaque', label: 'Moniteur cardiaque' },
    { value: 'Défibrillateur', label: 'Défibrillateur' },
    { value: 'Robot chirurgical', label: 'Robot chirurgical' },
    { value: 'Échographe', label: 'Échographe' },
    { value: 'Amplificateur de brillance', label: 'Amplificateur de brillance' },
    { value: "Colonne d'endoscopie", label: "Colonne d'endoscopie" },
    { value: "Équipement d'anesthésie", label: "Équipement d'anesthésie" },
  ];

  // Statuts disponibles pour les salles
  const roomStatuses: { value: OperatingRoomStatus; label: string }[] = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'OCCUPE', label: 'Occupé' },
    { value: 'MAINTENANCE', label: 'En maintenance' },
    { value: 'HORS_SERVICE', label: 'Hors service' },
  ];

  // Service instance
  const roomService = new OperatingRoomService();

  // Configuration du formulaire avec react-hook-form et zod
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      numero: room?.numero || '',
      nom: room?.nom || '',
      secteurId: room?.secteurId || '',
      description: room?.description || '',
      equipements: room?.equipements || [],
      status: room?.status || 'DISPONIBLE',
      estActif: typeof room?.estActif === 'boolean' ? room.estActif : true,
    },
  });

  // Charger les secteurs au montage du composant
  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setIsLoading(true);
      const allSectors = roomService.getAllSectors();
      setSectors(allSectors);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des secteurs');
      logger.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (values: RoomFormValues) => {
    try {
      setIsLoading(true);

      // Si on est en mode édition, on inclut l'ID
      if (room?.id) {
        onSubmit({
          id: room.id,
          ...values,
        });
      } else {
        // Mode création
        onSubmit(values);
      }

      setError(null);
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la salle");
      logger.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom component pour MultiSelect qui utilise les options et pas le fonctionnement standard
  const CustomMultiSelect = ({ field }: { field: any }) => {
    const options = commonEquipments.map(item => ({
      label: item.label,
      value: item.value,
    }));

    return (
      <MultiSelect
        options={options}
        selected={field.value || []}
        onChange={field.onChange}
        placeholder="Sélectionner les équipements"
      />
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {room ? `Modifier la salle ${room.nom}` : 'Ajouter une nouvelle salle'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de salle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la salle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Salle Orthopédie 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="secteurId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secteur</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectors.map(sector => (
                        <SelectItem key={sector.id} value={sector.id}>
                          <div className="flex items-center">
                            <span
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: sector.couleur }}
                            ></span>
                            {sector.nom}
                          </div>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la salle et de ses spécificités"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipements</FormLabel>
                  <FormControl>
                    <CustomMultiSelect field={field} />
                  </FormControl>
                  <FormDescription>
                    Sélectionnez les équipements disponibles dans cette salle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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
              name="estActif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Salle active</FormLabel>
                    <FormDescription>
                      Décochez cette case pour désactiver temporairement cette salle
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {room ? 'Mettre à jour' : 'Créer la salle'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OperatingRoomForm;
