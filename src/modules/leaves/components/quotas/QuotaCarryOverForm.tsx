import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LeaveType } from '../../types/leave';
import { QuotaTransactionStatus } from '../../types/quota';
import { getLabelForLeaveType } from '../../utils/leaveTypeUtils';
import { useQuotaCarryOver } from '../../hooks/useQuotaCarryOver';
import { useQuotaHistory } from '../../hooks/useQuotaHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Calendar, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définition du schéma de validation
const carryOverFormSchema = z.object({
    leaveType: z.string().min(1, { message: "Veuillez sélectionner un type de congé" }),
    fromPeriodId: z.string().min(1, { message: "Veuillez sélectionner la période source" }),
    toPeriodId: z.string().min(1, { message: "Veuillez sélectionner la période destination" }),
    days: z
        .number({ invalid_type_error: "Veuillez entrer un nombre" })
        .positive({ message: "Le nombre de jours doit être positif" })
        .min(0.5, { message: "Le report minimum est de 0.5 jours" }),
    comment: z.string().optional(),
});

type CarryOverFormValues = z.infer<typeof carryOverFormSchema>;

interface QuotaCarryOverFormProps {
    userId: string;
    onCarryOverComplete?: () => void;
    className?: string;
}

const QuotaCarryOverForm: React.FC<QuotaCarryOverFormProps> = ({
    userId,
    onCarryOverComplete,
    className,
}) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [maxCarryOverDays, setMaxCarryOverDays] = useState(0);

    // Hooks pour la gestion des reports de quotas
    const {
        loading: carryOverLoading,
        error: carryOverError,
        carryOverRules,
        loadCarryOverRules,
        simulateCarryOver,
        requestCarryOver,
        canCarryOver,
        getMaxCarryOverAmount
    } = useQuotaCarryOver(userId);

    const {
        loading: historyLoading,
        error: historyError,
        quotaSummary,
        activePeriods,
        loadQuotaSummary,
        loadActivePeriods,
        refreshAll
    } = useQuotaHistory(userId);

    // Configuration du formulaire
    const form = useForm<CarryOverFormValues>({
        resolver: zodResolver(carryOverFormSchema),
        defaultValues: {
            leaveType: "",
            fromPeriodId: "",
            toPeriodId: "",
            days: 1,
            comment: "",
        },
    });

    // Charger les données initiales
    useEffect(() => {
        loadActivePeriods();
        loadQuotaSummary();
    }, [loadActivePeriods, loadQuotaSummary]);

    // Mettre à jour les types de congés disponibles pour report lorsque le résumé est chargé
    useEffect(() => {
        if (quotaSummary) {
            // Filtrer les types avec un solde positif
            const typesWithBalance = quotaSummary.balances
                .filter(balance => balance.currentBalance > 0)
                .map(balance => balance.leaveType);

            setAvailableLeaveTypes(typesWithBalance);
        }
    }, [quotaSummary]);

    // Mettre à jour les règles lorsque le type de congé change
    const onLeaveTypeChange = async (leaveType: string) => {
        if (!leaveType) {
            setMaxCarryOverDays(0);
            setSimulationResult(null);
            return;
        }

        await loadCarryOverRules(leaveType as LeaveType);

        // Mettre à jour le maximum de jours reportables
        if (quotaSummary) {
            const balance = quotaSummary.balances.find(b => b.leaveType === leaveType);
            if (balance) {
                const maxDays = getMaxCarryOverAmount(leaveType as LeaveType, balance.currentBalance);
                setMaxCarryOverDays(maxDays);

                // Ajuster les jours si nécessaire
                const currentDays = form.getValues('days');
                if (currentDays > maxDays) {
                    form.setValue('days', maxDays);
                }
            }
        }
    };

    // Simuler le report lorsque les valeurs changent
    const handleSimulate = async () => {
        // Valider les champs essentiels
        const valid = await form.trigger(['leaveType', 'fromPeriodId', 'toPeriodId', 'days']);
        if (!valid) return;

        const values = form.getValues();

        // Vérifier que les périodes sont différentes
        if (values.fromPeriodId === values.toPeriodId) {
            form.setError('toPeriodId', {
                message: "Les périodes source et destination doivent être différentes"
            });
            return;
        }

        setIsSimulating(true);
        setSimulationResult(null);

        try {
            const result = await simulateCarryOver(
                values.fromPeriodId,
                values.toPeriodId,
                values.leaveType as LeaveType,
                values.days
            );

            setSimulationResult(result);
        } catch (error: unknown) {
            logger.error("Erreur lors de la simulation de report:", error instanceof Error ? error : new Error(String(error)));
        } finally {
            setIsSimulating(false);
        }
    };

    // Surveiller les changements pour déclencher une simulation
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            // Si les champs essentiels sont remplis, simuler automatiquement
            const leaveType = form.getValues('leaveType');
            const fromPeriodId = form.getValues('fromPeriodId');
            const toPeriodId = form.getValues('toPeriodId');
            const days = form.getValues('days');

            if (leaveType && fromPeriodId && toPeriodId && days > 0 &&
                name && ['leaveType', 'fromPeriodId', 'toPeriodId', 'days'].includes(name)) {
                handleSimulate();
            }
        });

        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Soumettre le formulaire pour effectuer le report
    const onSubmit = async (values: CarryOverFormValues) => {
        setIsSubmitting(true);
        setSubmitSuccess(false);
        setSubmitError(null);

        try {
            const result = await requestCarryOver(
                values.fromPeriodId,
                values.toPeriodId,
                values.leaveType as LeaveType,
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
                if (onCarryOverComplete) {
                    onCarryOverComplete();
                }
            } else {
                setSubmitError("Échec de la demande de report. Veuillez réessayer.");
            }
        } catch (error: unknown) {
            setSubmitError(error?.message || "Une erreur est survenue lors de la demande");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formater une date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
        } catch (error: unknown) {
            return dateString;
        }
    };

    // Obtenir le nom d'une période
    const getPeriodName = (periodId: string) => {
        const period = activePeriods.find(p => p.id === periodId);
        return period ? period.name : periodId;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Report de quotas</CardTitle>
                <CardDescription>
                    Reportez vos jours de congés non utilisés sur la période suivante
                </CardDescription>
            </CardHeader>

            <CardContent>
                {(carryOverLoading || historyLoading) && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {(carryOverError || historyError) && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                            Impossible de charger les données nécessaires. Veuillez réessayer.
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
                            Votre demande de report a été effectuée avec succès.
                            {simulationResult?.requiresApproval &&
                                " Une approbation est nécessaire avant que le report ne soit finalisé."}
                        </AlertDescription>
                    </Alert>
                )}

                {!carryOverLoading && !historyLoading && quotaSummary && activePeriods.length > 0 && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Type de congé */}
                            <FormField
                                control={form.control}
                                name="leaveType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type de congé</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                onLeaveTypeChange(value);
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
                                            Sélectionnez le type de congé que vous souhaitez reporter
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Période source */}
                            <FormField
                                control={form.control}
                                name="fromPeriodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Période source</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner la période source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {activePeriods.map((period) => (
                                                    <SelectItem key={period.id} value={period.id}>
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            {period.name}
                                                            {period.isActive && (
                                                                <Badge variant="outline" className="ml-2 text-xs">
                                                                    Actuelle
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Période à partir de laquelle vous souhaitez reporter des jours
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Période destination */}
                            <FormField
                                control={form.control}
                                name="toPeriodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Période destination</FormLabel>
                                        <Select
                                            disabled={isSubmitting}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner la période destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {activePeriods.map((period) => (
                                                    <SelectItem key={period.id} value={period.id}>
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            {period.name}
                                                            {period.isActive && (
                                                                <Badge variant="outline" className="ml-2 text-xs">
                                                                    Actuelle
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Période vers laquelle vous souhaitez reporter des jours
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                max={maxCarryOverDays}
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {maxCarryOverDays > 0 ? (
                                                <>Maximum reportable : <strong>{maxCarryOverDays} jours</strong></>
                                            ) : (
                                                "Entrez le nombre de jours que vous souhaitez reporter"
                                            )}
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
                                                placeholder="Raison du report..."
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Ajoutez un commentaire pour expliquer la raison du report
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
                                        {simulationResult.isValid ? "Report possible" : "Report impossible"}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {simulationResult.message}

                                        {simulationResult.isValid && (
                                            <div className="mt-2 text-sm">
                                                <p>Jours éligibles au report: <strong>{simulationResult.eligibleDays} jours</strong></p>

                                                {simulationResult.expirationDate && (
                                                    <p className="text-amber-600">
                                                        Les jours reportés expireront le: <strong>{formatDate(simulationResult.expirationDate)}</strong>
                                                    </p>
                                                )}

                                                {simulationResult.requiresApproval && (
                                                    <p className="text-amber-600 font-semibold mt-1">
                                                        Ce report nécessite une approbation.
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
                        "Demander le report"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default QuotaCarryOverForm; 