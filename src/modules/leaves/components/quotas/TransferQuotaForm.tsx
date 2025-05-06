'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LeaveType, LeaveTypeQuota } from '../../types/leave';
import { QuotaTransactionStatus } from '../../types/quota';
import { getLabelForLeaveType } from '../../utils/leaveTypeUtils';
import { useQuotaCalculation } from '../../hooks/useQuotaCalculation';
import { useQuotaHistory } from '../../hooks/useQuotaHistory';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label as UILabel } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useQuotaTransfer } from '../../hooks/useQuotaTransfer';
import { getLeaveTypeName } from '../../utils/leaveUtils';

// Définition du schéma de validation
const transferFormSchema = z.object({
    fromType: z.string().min(1, { message: "Veuillez sélectionner un type de congé source" }),
    toType: z.string().min(1, { message: "Veuillez sélectionner un type de congé destination" }),
    days: z
        .number({ invalid_type_error: "Veuillez entrer un nombre" })
        .positive({ message: "Le nombre de jours doit être positif" })
        .min(0.5, { message: "Le transfert minimum est de 0.5 jours" }),
    comment: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferQuotaFormProps {
    userId: string;
    periodId?: string;
    onTransferComplete?: () => void;
    className?: string;
}

const TransferQuotaForm: React.FC<TransferQuotaFormProps> = ({
    userId,
    periodId,
    onTransferComplete,
    className,
}) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>([]);
    const [targetLeaveTypes, setTargetLeaveTypes] = useState<LeaveType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Hooks pour la gestion des quotas
    const {
        loading: quotaLoading,
        error: quotaError,
        transferRules,
        loadTransferRules,
        simulateTransfer,
        requestTransfer,
        isTransferPossible,
        getConversionRate
    } = useQuotaCalculation(userId, periodId);

    const {
        quotaSummary,
        loadQuotaSummary,
        refreshAll
    } = useQuotaHistory(userId, periodId);

    // Configuration du formulaire
    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferFormSchema),
        defaultValues: {
            fromType: "",
            toType: "",
            days: 1,
            comment: "",
        },
    });

    // Charger les données initiales
    useEffect(() => {
        loadQuotaSummary();
    }, [loadQuotaSummary]);

    // Mettre à jour les types de congés disponibles lorsque le résumé est chargé
    useEffect(() => {
        if (quotaSummary) {
            // Filtrer les types avec un solde positif
            const typesWithBalance = quotaSummary.balances
                .filter(balance => balance.currentBalance > 0)
                .map(balance => balance.leaveType);

            setAvailableLeaveTypes(typesWithBalance);
        }
    }, [quotaSummary]);

    // Mettre à jour les types de congés cibles lorsque le type source change
    const onSourceTypeChange = async (sourceType: string) => {
        if (!sourceType) {
            setTargetLeaveTypes([]);
            return;
        }

        const rules = await loadTransferRules(sourceType as LeaveType);

        // Récupérer les types cibles possibles à partir des règles
        const possibleTargets = rules
            .filter(rule => rule.isActive)
            .map(rule => rule.toType);

        setTargetLeaveTypes(possibleTargets);

        // Réinitialiser le type cible et la simulation
        form.setValue('toType', '');
        setSimulationResult(null);
    };

    // Simuler le transfert lorsque les valeurs changent
    const handleSimulate = async () => {
        // Valider le formulaire
        const valid = await form.trigger();
        if (!valid) return;

        const values = form.getValues();

        // Vérifier que les deux types sont différents
        if (values.fromType === values.toType) {
            form.setError('toType', {
                message: "Le type source et destination doivent être différents"
            });
            return;
        }

        setIsSimulating(true);
        setSimulationResult(null);

        try {
            const result = await simulateTransfer(
                values.fromType as LeaveType,
                values.toType as LeaveType,
                values.days
            );

            setSimulationResult(result);
        } catch (error) {
            console.error("Erreur lors de la simulation:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    // Surveiller les changements pour déclencher une simulation
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            // Si les champs essentiels sont remplis, simuler automatiquement
            const fromType = form.getValues('fromType');
            const toType = form.getValues('toType');
            const days = form.getValues('days');

            if (fromType && toType && days > 0 &&
                name && ['fromType', 'toType', 'days'].includes(name)) {
                handleSimulate();
            }
        });

        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Soumettre le formulaire pour effectuer le transfert
    const onSubmit = async (values: TransferFormValues) => {
        setIsSubmitting(true);
        setSubmitSuccess(false);
        setSubmitError(null);

        try {
            const result = await requestTransfer(
                values.fromType as LeaveType,
                values.toType as LeaveType,
                values.days,
                values.comment
            );

            if (result) {
                setSubmitSuccess(true);
                form.reset();
                setSimulationResult(null);

                // Rafraîchir les données
                refreshAll();

                // Notifier le parent si nécessaire
                if (onTransferComplete) {
                    onTransferComplete();
                }
            } else {
                setSubmitError("Échec du transfert de quota. Veuillez réessayer.");
            }
        } catch (error: any) {
            setSubmitError(error?.message || "Une erreur est survenue lors du transfert");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Obtenir le taux de conversion pour afficher l'information
    const getConversionInfo = () => {
        const fromType = form.getValues('fromType') as LeaveType;
        const toType = form.getValues('toType') as LeaveType;

        if (!fromType || !toType) return null;

        const rate = getConversionRate(fromType, toType);
        if (rate === 1) return null;

        return `1 jour de ${fromType} = ${rate} jour${rate > 1 ? 's' : ''} de ${toType}`;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Transfert de quotas</CardTitle>
                <CardDescription>
                    Transférez vos quotas entre différents types de congés
                </CardDescription>
            </CardHeader>

            <CardContent>
                {quotaLoading && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {quotaError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                            Impossible de charger les informations de quotas. Veuillez réessayer.
                        </AlertDescription>
                    </Alert>
                )}

                {submitError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                )}

                {submitSuccess && (
                    <Alert variant="success" className="mb-4 bg-green-50 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle>Succès</AlertTitle>
                        <AlertDescription>
                            Le transfert de quota a été effectué avec succès.
                        </AlertDescription>
                    </Alert>
                )}

                {!quotaLoading && quotaSummary && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Type de congé source */}
                            <FormField
                                control={form.control}
                                name="fromType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transférer depuis</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                onSourceTypeChange(value);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un type de congé" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableLeaveTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {getLabelForLeaveType(type)}
                                                        <span className="ml-2 text-muted-foreground">
                                                            ({quotaSummary.balances.find(b => b.leaveType === type)?.currentBalance || 0} j)
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Sélectionnez le type de congé à partir duquel vous souhaitez transférer des jours
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type de congé destination */}
                            <FormField
                                control={form.control}
                                name="toType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transférer vers</FormLabel>
                                        <Select
                                            disabled={isSubmitting || targetLeaveTypes.length === 0}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        targetLeaveTypes.length === 0
                                                            ? "Sélectionnez d'abord un type source"
                                                            : "Sélectionner un type de congé destination"
                                                    } />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {targetLeaveTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {getLabelForLeaveType(type)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Sélectionnez le type de congé vers lequel vous souhaitez transférer des jours
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Taux de conversion si applicable */}
                            {getConversionInfo() && (
                                <div className="flex items-center justify-center p-2">
                                    <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                                        <ArrowRightCircle className="h-4 w-4 mr-2 text-primary" />
                                        {getConversionInfo()}
                                    </Badge>
                                </div>
                            )}

                            {/* Nombre de jours */}
                            <FormField
                                control={form.control}
                                name="days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de jours</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0.5}
                                                step={0.5}
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Entrez le nombre de jours que vous souhaitez transférer
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Commentaire optionnel */}
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commentaire (optionnel)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Raison du transfert..."
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Ajoutez un commentaire pour expliquer la raison du transfert
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Résultat de la simulation */}
                            {isSimulating && (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                    <span>Simulation en cours...</span>
                                </div>
                            )}

                            {simulationResult && (
                                <Alert variant={simulationResult.isValid ? "default" : "destructive"} className="mt-4">
                                    {simulationResult.isValid ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4" />
                                    )}
                                    <AlertTitle>
                                        {simulationResult.isValid ? "Transfert possible" : "Transfert impossible"}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {simulationResult.message}

                                        {simulationResult.isValid && (
                                            <div className="mt-2 text-sm">
                                                <p>Solde restant: <strong>{simulationResult.sourceRemaining} jours</strong></p>
                                                <p>Jours crédités: <strong>{simulationResult.resultingDays} jours</strong></p>
                                                {simulationResult.requiresApproval && (
                                                    <p className="text-amber-600 font-semibold mt-1">
                                                        Ce transfert nécessite une approbation.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </form>
                    </Form>
                )}
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isSubmitting}
                >
                    Annuler
                </Button>
                <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={
                        isSubmitting ||
                        !simulationResult?.isValid ||
                        !form.formState.isValid
                    }
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                        </>
                    ) : (
                        "Transférer"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default TransferQuotaForm; 