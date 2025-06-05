import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useLeaveQuota, CalculateCarryOverParams, LeaveTypeQuota } from '../hooks/useLeaveQuota';
import { LeaveType } from '../types/leave';
import { QuotaCarryOverRule } from '../types/quota';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { quotaAdvancedService } from '../services/QuotaAdvancedService';
import { formatDate } from '../../../utils/dateUtils';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import {
    Alert,
    AlertTitle,
    AlertDescription
} from '@/components/ui/alert';
import { CalendarDays, AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';
import { getLabelForLeaveType } from '../utils/leaveTypeUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addMonths } from 'date-fns';

// Définir l'interface du résultat de simulation
interface QuotaCarryOverCalculationResult {
    originalRemaining: number;
    carryOverAmount: number;
    eligibleForCarryOver: number;
    message?: string;
    expiryDate?: Date;
    appliedRule?: {
        id: string;
        ruleType: string;
        value: number;
        expirationDays?: number;
    };
}

interface QuotaCarryOverFormProps {
    userId: string;
    quotasByType: LeaveTypeQuota[];
    onCarryOverComplete: () => void;
}

// Schéma de validation pour le formulaire de report
const carryOverSchema = z.object({
    leaveType: z.nativeEnum(LeaveType, {
        required_error: "Le type de congé est requis"
    }),
    fromYear: z.number({
        required_error: "L'année source est requise"
    }),
    toYear: z.number({
        required_error: "L'année cible est requise"
    }).refine(val => val > 0, {
        message: "L'année cible doit être supérieure à 0"
    }),
    comment: z.string().max(500, "Le commentaire ne peut pas dépasser 500 caractères").optional(),
    carryOverAmount: z.number().optional(),
});

type CarryOverFormValues = z.infer<typeof carryOverSchema>;

/**
 * Composant permettant de reporter des quotas d'une année sur l'autre
 */
export const QuotaCarryOverForm: React.FC<QuotaCarryOverFormProps> = ({
    userId,
    quotasByType,
    onCarryOverComplete
}) => {
    const currentYear = new Date().getFullYear();

    // Gestion du formulaire avec React Hook Form
    const form = useForm<CarryOverFormValues>({
        resolver: zodResolver(carryOverSchema),
        defaultValues: {
            leaveType: undefined,
            fromYear: currentYear,
            toYear: currentYear + 1,
            comment: '',
            carryOverAmount: undefined,
        }
    });

    const { watch, setValue, reset, handleSubmit: handleFormSubmit } = form;

    // Watch des valeurs du formulaire
    const selectedLeaveType = watch('leaveType');
    const selectedFromYear = watch('fromYear');
    const selectedToYear = watch('toYear');
    const selectedComment = watch('comment');

    // État de la simulation
    const [simulationResult, setSimulationResult] = useState<QuotaCarryOverCalculationResult | null>(null);
    const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
    const [carryOverRules, setCarryOverRules] = useState<QuotaCarryOverRule[]>([]);
    const [loadingRules, setLoadingRules] = useState<boolean>(false);

    // État du report
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Types de congés disponibles pour le report
    const availableTypes = quotasByType.filter(q => q.remaining > 0);

    // Quota pour le type sélectionné
    const selectedQuota = selectedLeaveType
        ? quotasByType.find(q => q.type === selectedLeaveType)
        : null;

    // Règle de report applicable pour le type sélectionné
    const applicableRule = selectedLeaveType && carryOverRules.length > 0
        ? carryOverRules.find(rule => rule.leaveType === selectedLeaveType)
        : null;

    // Charger les règles de report au montage du composant
    useEffect(() => {
        const loadCarryOverRules = async () => {
            if (!userId) return;

            setLoadingRules(true);
            try {
                const rules = await quotaAdvancedService.getActiveCarryOverRules(userId);
                setCarryOverRules(rules);
            } catch (err: unknown) {
                logger.error('Erreur lors du chargement des règles de report:', err);
                setError(`Impossible de charger les règles de report: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoadingRules(false);
            }
        };

        loadCarryOverRules();
    }, [userId]);

    // Effectuer une simulation lorsque les paramètres changent
    useEffect(() => {
        const simulateCarryOver = async () => {
            if (!selectedLeaveType || !userId) {
                setSimulationResult(null);
                return;
            }

            setSimulationLoading(true);
            setError(null);

            try {
                const result = await quotaAdvancedService.simulateCarryOver({
                    userId,
                    leaveType: selectedLeaveType,
                    fromYear: selectedFromYear,
                    toYear: selectedToYear
                });

                setSimulationResult(result);

                // Mettre à jour automatiquement le montant à reporter dans le formulaire
                if (result.carryOverAmount > 0) {
                    setValue('carryOverAmount', result.carryOverAmount);
                }
            } catch (err: unknown) {
                setError(`Erreur lors de la simulation : ${err instanceof Error ? err.message : String(err)}`);
                setSimulationResult(null);
            } finally {
                setSimulationLoading(false);
            }
        };

        // Utiliser un délai pour éviter des appels trop fréquents
        const timeoutId = setTimeout(simulateCarryOver, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedLeaveType, selectedFromYear, selectedToYear, userId, setValue]);

    // Gérer la soumission du formulaire
    const onSubmit = async (values: CarryOverFormValues) => {
        if (!values.leaveType || !userId) {
            setError('Veuillez sélectionner un type de congé');
            return;
        }

        // Vérifier que la simulation est valide
        if (!simulationResult || simulationResult.carryOverAmount <= 0) {
            setError('Aucun jour disponible pour le report');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await quotaAdvancedService.executeCarryOver({
                userId,
                leaveType: values.leaveType,
                fromYear: values.fromYear,
                toYear: values.toYear
            }, userId); // Utiliser userId comme currentUserId pour simplifier

            // Afficher le succès
            setSuccess(true);

            // Réinitialiser le formulaire
            setTimeout(() => {
                reset();
                setSimulationResult(null);
                setSuccess(false);

                // Notifier le parent du succès du report
                onCarryOverComplete();
            }, 2000);
        } catch (err: unknown) {
            setError(`Erreur lors du report : ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formater les années pour affichage
    const formatYearLabel = (year: number) => `${year}`;

    // Générer les années disponibles pour la source
    const availableFromYears = [currentYear - 1, currentYear];

    // Générer les années disponibles pour la destination
    const availableToYears = [currentYear, currentYear + 1];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Reporter des quotas sur l'année suivante</CardTitle>
                <CardDescription>
                    Transférez des jours de congés non utilisés d'une année à l'autre selon les règles en vigueur
                </CardDescription>
            </CardHeader>

            <CardContent>
                {success && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Report effectué</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Le report de quotas a été effectué avec succès.
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert className="mb-4 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">Erreur</AlertTitle>
                        <AlertDescription className="text-red-700">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                        {/* Type de congé */}
                        <FormField
                            control={form.control}
                            name="leaveType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type de congé à reporter</FormLabel>
                                    <Select
                                        disabled={isSubmitting}
                                        onValueChange={(value) => field.onChange(value as LeaveType)}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez un type de congé" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableTypes.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    Aucun type de congé disponible pour le report
                                                </SelectItem>
                                            ) : (
                                                availableTypes.map((quota) => (
                                                    <SelectItem key={quota.type} value={quota.type}>
                                                        {quota.label} ({quota.remaining} jours disponibles)
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Années source et cible */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fromYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Année source</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Année source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableFromYears.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {formatYearLabel(year)}
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
                                name="toYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Année cible</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Année cible" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableToYears.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                        disabled={year <= selectedFromYear}
                                                    >
                                                        {formatYearLabel(year)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Commentaire */}
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Commentaire (optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Motif du report..."
                                            disabled={isSubmitting}
                                            className="resize-none"
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Règle applicable */}
                        {applicableRule && (
                            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 mb-4">
                                <h4 className="font-medium mb-1">Règle applicable :</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    {applicableRule.ruleType === 'PERCENTAGE' && (
                                        <li>Report limité à {applicableRule.value}% du solde restant</li>
                                    )}
                                    {applicableRule.ruleType === 'FIXED' && (
                                        <li>Report limité à {applicableRule.value} jours maximum</li>
                                    )}
                                    {applicableRule.ruleType === 'ALL' && (
                                        <li>Report intégral du solde restant</li>
                                    )}
                                    {applicableRule.expirationDays > 0 && (
                                        <li>
                                            <span className="flex items-center">
                                                <CalendarDays className="mr-1 h-4 w-4" />
                                                Expiration après {applicableRule.expirationDays} jours
                                            </span>
                                        </li>
                                    )}
                                    {applicableRule.requiresApproval && (
                                        <li>Nécessite une approbation</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Résultat de la simulation */}
                        {simulationLoading && (
                            <div className="py-4 flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        )}

                        {simulationResult && (
                            <div className={`p-4 rounded-md ${simulationResult.carryOverAmount > 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                <h4 className="text-sm font-medium mb-2">
                                    {simulationResult.carryOverAmount > 0 ? 'Aperçu du report' : 'Report impossible'}
                                </h4>

                                {simulationResult.carryOverAmount > 0 ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-gray-500">Jours disponibles:</p>
                                                <p className="font-medium">{simulationResult.originalRemaining} jours</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Jours à reporter:</p>
                                                <p className="font-medium">{simulationResult.carryOverAmount} jours</p>
                                            </div>
                                        </div>

                                        {simulationResult.expiryDate && (
                                            <div>
                                                <p className="text-gray-500">Date d'expiration:</p>
                                                <p className="font-medium text-amber-700 flex items-center">
                                                    <CalendarDays className="mr-1 h-4 w-4" />
                                                    {formatDate(simulationResult.expiryDate)}
                                                </p>
                                            </div>
                                        )}

                                        {simulationResult.appliedRule && (
                                            <div>
                                                <p className="text-xs text-gray-500 italic">
                                                    Règle appliquée: {
                                                        simulationResult.appliedRule.ruleType === 'PERCENTAGE'
                                                            ? `${simulationResult.appliedRule.value}% du solde`
                                                            : simulationResult.appliedRule.ruleType === 'FIXED'
                                                                ? `${simulationResult.appliedRule.value} jours maximum`
                                                                : simulationResult.appliedRule.ruleType === 'ALL'
                                                                    ? 'Report total'
                                                                    : 'Règle personnalisée'
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm">
                                        <p>{simulationResult.message || 'Aucun jour disponible pour le report selon les règles en vigueur.'}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bouton de soumission */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                isSubmitting ||
                                !selectedLeaveType ||
                                !simulationResult ||
                                simulationResult.carryOverAmount <= 0
                            }
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement en cours...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Reporter les quotas
                                </span>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default QuotaCarryOverForm; 