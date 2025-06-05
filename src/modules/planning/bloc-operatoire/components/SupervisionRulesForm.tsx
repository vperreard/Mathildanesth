import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Button from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OperatingSupervisionRule, OperatingSector } from '../types';
import { supervisionRulesService } from '../services/SupervisionRulesService';
import { operatingRoomService } from '../services/OperatingRoomService';

// Définition du schéma de validation avec Zod
const ruleFormSchema = z.object({
    nom: z.string().min(1, 'Le nom est obligatoire'),
    description: z.string().optional(),
    type: z.enum(['BASIQUE', 'SPECIFIQUE', 'EXCEPTION']),
    secteurId: z.string().optional(),
    estActif: z.boolean().default(true),
    priorite: z.number().int().min(1, 'La priorité doit être d\'au moins 1'),
    conditions: z.object({
        maxSallesParMAR: z.number().int().min(1, 'Au moins 1 salle par MAR'),
        maxSallesExceptionnel: z.number().int().optional(),
        supervisionInterne: z.boolean().optional(),
        supervisionContigues: z.boolean().optional(),
        competencesRequises: z.array(z.string()).optional(),
        supervisionDepuisAutreSecteur: z.array(z.string()).optional(),
        incompatibilites: z.array(z.string()).optional(),
    })
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface SupervisionRulesFormProps {
    rule?: OperatingSupervisionRule; // Si défini, mode édition, sinon mode création
    onSubmit: (rule: Omit<OperatingSupervisionRule, 'id'> | OperatingSupervisionRule) => void;
    onCancel: () => void;
}

export const SupervisionRulesForm: React.FC<SupervisionRulesFormProps> = ({
    rule,
    onSubmit,
    onCancel
}) => {
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ruleType, setRuleType] = useState(rule?.type || 'BASIQUE');

    // Configuration du formulaire avec react-hook-form et zod
    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: rule ? {
            nom: rule.nom,
            description: rule.description || '',
            type: rule.type,
            secteurId: rule.secteurId || '',
            estActif: rule.estActif,
            priorite: rule.priorite,
            conditions: {
                maxSallesParMAR: rule.conditions.maxSallesParMAR,
                maxSallesExceptionnel: rule.conditions.maxSallesExceptionnel || undefined,
                supervisionInterne: rule.conditions.supervisionInterne || false,
                supervisionContigues: rule.conditions.supervisionContigues || false,
                competencesRequises: rule.conditions.competencesRequises || [],
                supervisionDepuisAutreSecteur: rule.conditions.supervisionDepuisAutreSecteur || [],
                incompatibilites: rule.conditions.incompatibilites || []
            }
        } : {
            nom: '',
            description: '',
            type: 'BASIQUE',
            secteurId: '',
            estActif: true,
            priorite: 1,
            conditions: {
                maxSallesParMAR: 2,
                maxSallesExceptionnel: undefined,
                supervisionInterne: true,
                supervisionContigues: false,
                competencesRequises: [],
                supervisionDepuisAutreSecteur: [],
                incompatibilites: []
            }
        }
    });

    // Réagir au changement de type de règle
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'type') {
                setRuleType(value.type as any);

                // Si on passe à SPECIFIQUE, vider le secteurId s'il est déjà défini
                if (value.type === 'SPECIFIQUE' && !value.secteurId) {
                    form.setError('secteurId', {
                        type: 'manual',
                        message: 'Le secteur est obligatoire pour une règle spécifique'
                    });
                }

                // Si on passe à EXCEPTION, ajuster les valeurs par défaut
                if (value.type === 'EXCEPTION') {
                    form.setValue('priorite', 10);
                    form.setValue('conditions.maxSallesExceptionnel', 4);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [form]);

    // Charger les secteurs au montage du composant
    useEffect(() => {
        loadSectors();
    }, []);

    const loadSectors = async () => {
        try {
            setIsLoading(true);

            // Récupérer tous les secteurs
            const allSectors = operatingRoomService.getAllSectors();
            setSectors(allSectors);

            setError(null);
        } catch (err: unknown) {
            setError("Erreur lors du chargement des secteurs");
            logger.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (values: RuleFormValues) => {
        try {
            setIsLoading(true);

            // Si c'est une règle de type BASIQUE ou EXCEPTION, on retire le secteurId s'il est défini
            if (values.type !== 'SPECIFIQUE') {
                values.secteurId = undefined;
            }

            // Si on est en mode édition, on inclut l'ID
            if (rule?.id) {
                onSubmit({
                    id: rule.id,
                    ...values
                });
            } else {
                // Mode création
                onSubmit(values);
            }

            setError(null);
        } catch (err: unknown) {
            setError("Erreur lors de l'enregistrement de la règle de supervision");
            logger.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {rule ? `Modifier la règle ${rule.nom}` : 'Ajouter une nouvelle règle de supervision'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && <div className="text-red-500 mb-4">{error}</div>}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de la règle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Règle standard orthopédie" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type de règle</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BASIQUE">Standard (tous les secteurs)</SelectItem>
                                                <SelectItem value="SPECIFIQUE">Spécifique (un secteur)</SelectItem>
                                                <SelectItem value="EXCEPTION">Exception (priorité élevée)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Les règles standards s'appliquent partout, les règles spécifiques à un secteur,
                                            et les exceptions permettent de gérer les cas particuliers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Description des conditions d'application de cette règle"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {ruleType === 'SPECIFIQUE' && (
                            <FormField
                                control={form.control}
                                name="secteurId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Secteur concerné</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un secteur" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sectors.map((sector) => (
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
                                        <FormDescription>
                                            Choisissez le secteur auquel cette règle s'applique spécifiquement
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priorite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priorité</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Plus la valeur est élevée, plus la règle est prioritaire (1-10)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="conditions.maxSallesParMAR"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre max de salles par MAR</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Nombre maximum de salles qu'un MAR peut superviser simultanément
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {ruleType === 'EXCEPTION' && (
                            <FormField
                                control={form.control}
                                name="conditions.maxSallesExceptionnel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre max de salles exceptionnel</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || field.value)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Nombre maximum de salles en situation exceptionnelle
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="conditions.supervisionInterne"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Supervision interne uniquement</FormLabel>
                                            <FormDescription>
                                                Si activé, la supervision ne peut être faite que par un MAR du même secteur
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="conditions.supervisionContigues"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Salles contiguës uniquement</FormLabel>
                                            <FormDescription>
                                                Si activé, les salles supervisées doivent être physiquement proches
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="estActif"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Règle active</FormLabel>
                                        <FormDescription>
                                            Désactivez pour suspendre temporairement l'application de cette règle
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isLoading}
                            >
                                {rule ? 'Mettre à jour' : 'Créer la règle'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default SupervisionRulesForm; 