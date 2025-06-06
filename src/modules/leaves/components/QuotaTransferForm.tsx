import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import Input from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import Textarea from '@/components/ui/textarea';
import {
    Alert,
    AlertTitle,
    AlertDescription
} from '@/components/ui/alert';
import { useQuotaTransfer } from '../hooks/useQuotaTransfer';
import { LeaveType } from '../types/leave';
import { useLeaveQuota } from '../hooks/useLeaveQuota';
import { getLeaveTypeLabel } from '../services/leaveService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { LeaveTypeQuota } from '../hooks/useLeaveQuota';
import { QuotaTransferSimulationResult } from '../types/quota';
import { quotaAdvancedService } from '../services/QuotaAdvancedService';

// Schéma de validation Zod pour le formulaire
const quotaTransferSchema = z.object({
    fromType: z.nativeEnum(LeaveType, {
        required_error: "Le type de congé source est requis"
    }),
    toType: z.nativeEnum(LeaveType, {
        required_error: "Le type de congé destination est requis"
    }),
    days: z.number({
        required_error: "Le nombre de jours est requis",
        invalid_type_error: "Veuillez entrer un nombre valide"
    }).positive("Le nombre de jours doit être positif")
        .max(100, "Le nombre de jours est trop élevé"),
    reason: z.string({
        required_error: "Le motif est requis"
    }).min(5, "Le motif doit comporter au moins 5 caractères")
        .max(500, "Le motif ne peut pas dépasser 500 caractères")
});

type QuotaTransferFormValues = z.infer<typeof quotaTransferSchema>;

interface QuotaTransferFormProps {
    userId: string;
    quotasByType: LeaveTypeQuota[];
    onTransferComplete: () => void;
}

const QuotaTransferForm: React.FC<QuotaTransferFormProps> = ({
    userId,
    quotasByType,
    onTransferComplete
}) => {
    const [transferSuccess, setTransferSuccess] = useState(false);
    const [simulationResult, setSimulationResult] = useState<QuotaTransferSimulationResult | null>(null);
    const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sourceType, setSourceType] = useState<LeaveType | ''>('');
    const [targetType, setTargetType] = useState<LeaveType | ''>('');
    const [amount, setAmount] = useState<number>(1);
    const [comment, setComment] = useState<string>('');

    const {
        transferQuota,
        getTransferRules,
        loading,
        simulateTransfer,
        simulationResult: useQuotaSimulationResult,
        getBalanceForType
    } = useQuotaTransfer({ userId });

    const {
        quotasByType: useQuotaQuotasByType,
        loading: quotaLoading
    } = useLeaveQuota({ userId });

    const form = useForm<QuotaTransferFormValues>({
        resolver: zodResolver(quotaTransferSchema),
        defaultValues: {
            fromType: undefined,
            toType: undefined,
            days: 1,
            reason: ''
        }
    });

    const { watch, setValue, reset } = form;
    const fromType = watch('fromType') as LeaveType;
    const toType = watch('toType') as LeaveType;
    const days = watch('days');

    // Règles de transfert disponibles
    const transferRules = getTransferRules();

    // Types de congés sources disponibles (ceux qui ont un solde positif)
    const availableSourceTypes = quotasByType.filter(quota => quota.remaining > 0);

    // Types de congés destinations disponibles basés sur le type source sélectionné
    const availableDestinationTypes = fromType
        ? transferRules
            .filter(rule => rule.fromType === fromType)
            .map(rule => rule.toType)
        : [];

    // Recherche la règle de transfert actuelle
    const currentRule = fromType && toType
        ? transferRules.find(rule =>
            rule.fromType === fromType &&
            rule.toType === toType
        )
        : null;

    // Solde actuel pour le type source sélectionné
    const currentFromBalance = fromType
        ? quotasByType.find(quota => quota.type === fromType)?.remaining || 0
        : 0;

    // Limite maximum de jours transférables
    const maxTransferableDays = currentRule
        ? currentRule.maxTransferDays ||
        (currentRule.maxTransferPercentage
            ? Math.floor(currentFromBalance * currentRule.maxTransferPercentage / 100)
            : currentFromBalance)
        : 0;

    // Vérification si le transfert est possible
    const isTransferPossible = fromType &&
        toType &&
        fromType !== toType &&
        currentRule &&
        currentFromBalance > 0;

    // Quand le type source change, réinitialiser le type destination
    useEffect(() => {
        setValue('toType', undefined);
    }, [fromType, setValue]);

    // Simule le transfert pour afficher les résultats prévisionnels
    const handleSimulate = () => {
        if (fromType && toType && days > 0) {
            simulateTransfer(fromType, toType, days);
        }
    };

    useEffect(() => {
        if (fromType && toType && days > 0) {
            handleSimulate();
        }
    }, [fromType, toType, days]);

    useEffect(() => {
        const simulateTransfer = async () => {
            if (!sourceType || !targetType || amount <= 0 || !userId) {
                setSimulationResult(null);
                return;
            }

            setSimulationLoading(true);
            setError(null);

            try {
                const result = await quotaAdvancedService.simulateTransfer({
                    userId,
                    sourceType,
                    targetType,
                    amount,
                    applyRules: true
                });

                setSimulationResult(result);
            } catch (err: unknown) {
                setError(`Erreur lors de la simulation : ${err instanceof Error ? err.message : String(err)}`);
                setSimulationResult(null);
            } finally {
                setSimulationLoading(false);
            }
        };

        // Utiliser un délai pour éviter des appels trop fréquents
        const timeoutId = setTimeout(simulateTransfer, 500);
        return () => clearTimeout(timeoutId);
    }, [sourceType, targetType, amount, userId]);

    const onSubmit = async (values: QuotaTransferFormValues) => {
        try {
            const success = await transferQuota(
                values.fromType,
                values.toType,
                values.days,
                values.reason
            );

            if (success) {
                setTransferSuccess(true);
                reset();

                if (onTransferComplete) {
                    onTransferComplete();
                }

                // Réinitialiser le message de succès après 3 secondes
                setTimeout(() => {
                    setTransferSuccess(false);
                }, 3000);
            }
        } catch (err: unknown) {
            logger.error("Erreur lors du transfert:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceType || !targetType || amount <= 0 || !userId) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        // Vérifier que la simulation est valide
        if (!simulationResult?.isValid) {
            setError('Le transfert n\'est pas valide selon la simulation. Veuillez ajuster les paramètres.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await quotaAdvancedService.executeTransfer({
                employeeId: userId,
                sourceType,
                targetType,
                amount,
                notes: comment
            }, userId); // Utiliser userId comme currentUserId pour simplifier

            // Afficher le succès
            setTransferSuccess(true);

            // Réinitialiser le formulaire
            setTimeout(() => {
                setSourceType('');
                setTargetType('');
                setAmount(1);
                setComment('');
                setSimulationResult(null);
                setTransferSuccess(false);

                // Notifier le parent du succès du transfert
                onTransferComplete();
            }, 2000);
        } catch (err: unknown) {
            setError(`Erreur lors du transfert : ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (quotaLoading) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Chargement des quotas...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Transfert de jours de congés</CardTitle>
                <CardDescription>
                    Transférez des jours entre différents types de congés selon les règles de conversion
                </CardDescription>
            </CardHeader>

            <CardContent>
                {transferSuccess && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                        <AlertTitle>Transfert réussi</AlertTitle>
                        <AlertDescription>
                            Vos jours ont été transférés avec succès.
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert className="mb-4 bg-red-50 border-red-200">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="fromType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type de congé source</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={loading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un type de congé" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableSourceTypes.length > 0 ? (
                                                    availableSourceTypes.map((type) => (
                                                        <SelectItem key={type.type} value={type.type}>
                                                            {getLeaveTypeLabel(type.type)} ({type.remaining} j)
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-muted-foreground">
                                                        Aucun type de congé avec solde disponible
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="toType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type de congé destination</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!fromType || loading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un type de congé" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableDestinationTypes.length > 0 ? (
                                                    availableDestinationTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {getLeaveTypeLabel(type)}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-muted-foreground">
                                                        {fromType
                                                            ? "Aucun transfert possible depuis ce type"
                                                            : "Sélectionnez d'abord un type source"}
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="days"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de jours à transférer</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={maxTransferableDays || 100}
                                            step={0.5}
                                            placeholder="Entrez le nombre de jours"
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (!isNaN(value)) {
                                                    field.onChange(value);
                                                } else {
                                                    field.onChange(undefined);
                                                }
                                            }}
                                            disabled={!isTransferPossible || loading}
                                        />
                                    </FormControl>
                                    {currentRule && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Maximum: {maxTransferableDays} jours
                                            {currentRule.maxTransferPercentage && ` (${currentRule.maxTransferPercentage}% du solde)`}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {simulationResult && (
                            <div className="rounded-md border p-4 bg-slate-50">
                                <h3 className="font-medium mb-2">Simulation du transfert</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium">{getLeaveTypeLabel(simulationResult.sourceType)}</p>
                                        <p>Solde actuel: {simulationResult.sourceDeducted + simulationResult.sourceAfter} jours</p>
                                        <p>Après transfert: {simulationResult.sourceAfter} jours</p>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs text-muted-foreground">Taux de conversion</p>
                                            <p className="font-medium">{currentRule?.conversionRate || 1} : 1</p>
                                            <ArrowRight className="my-1" />
                                            <p>{simulationResult.sourceDeducted} jours → {simulationResult.targetAdded} jours</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium">{getLeaveTypeLabel(simulationResult.targetType)}</p>
                                        <p>Solde actuel: {simulationResult.targetBefore} jours</p>
                                        <p>Après transfert: {simulationResult.targetAfter} jours</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motif du transfert</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Veuillez indiquer la raison de ce transfert"
                                            rows={3}
                                            {...field}
                                            disabled={!isTransferPossible || loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {currentRule?.requiresApproval && (
                            <Alert className="bg-amber-50 border-amber-200">
                                <AlertTitle>Information</AlertTitle>
                                <AlertDescription>
                                    Ce transfert nécessitera une approbation avant d'être appliqué.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            disabled={!isTransferPossible || loading || !days || days <= 0}
                            className="w-full md:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement en cours...
                                </>
                            ) : (
                                'Effectuer le transfert'
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-start bg-slate-50 text-xs text-muted-foreground">
                <p>Notes:</p>
                <ul className="list-disc list-inside">
                    <li>Les transferts sont irréversibles une fois validés</li>
                    <li>Les taux de conversion sont définis par la politique RH</li>
                    {currentRule?.requiresApproval && (
                        <li>Ce type de transfert requiert une validation par le service RH</li>
                    )}
                </ul>
            </CardFooter>
        </Card>
    );
};

export default QuotaTransferForm;