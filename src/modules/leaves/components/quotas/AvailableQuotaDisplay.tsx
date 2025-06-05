'use client';

import React, { useEffect, useState } from 'react';
import { useQuotaHistory } from '../../hooks/useQuotaHistory';
import { LeaveType } from '../../types/leave';
import { getLabelForLeaveType } from '../../utils/leaveTypeUtils';
import { format, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Alert,
    AlertDescription,
    AlertTitle
} from '@/components/ui/alert';
import {
    Info,
    AlertTriangle,
    Clock,
    RefreshCw,
    Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AvailableQuotaDisplayProps {
    userId: string;
    periodId?: string;
    className?: string;
}

const AvailableQuotaDisplay: React.FC<AvailableQuotaDisplayProps> = ({
    userId,
    periodId,
    className,
}) => {
    const {
        loading,
        error,
        quotaSummary,
        loadQuotaSummary,
        activePeriods,
        loadActivePeriods,
    } = useQuotaHistory(userId, periodId);

    // Charger les données initiales
    useEffect(() => {
        loadActivePeriods();
        loadQuotaSummary(periodId);
    }, [loadQuotaSummary, loadActivePeriods, periodId, userId]);

    // Vérifier si des quotas expirent bientôt (dans les 30 jours)
    const hasExpiringQuotas = () => {
        if (!quotaSummary) return false;

        for (const leaveType of Object.keys(quotaSummary.expiringDays)) {
            const expiringItems = quotaSummary.expiringDays[leaveType as any];

            if (expiringItems && expiringItems.length > 0) {
                for (const item of expiringItems) {
                    const daysUntilExpiry = differenceInDays(
                        new Date(item.expirationDate),
                        new Date()
                    );

                    if (daysUntilExpiry <= 30) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    // Calculer le pourcentage utilisé d'un quota
    const getUsagePercentage = (leaveType: LeaveType) => {
        if (!quotaSummary) return 0;

        const balance = quotaSummary.balances.find(b => b.leaveType === leaveType);

        if (!balance) return 0;

        const total = balance.initialBalance + balance.adjustedDays + balance.carriedOverDays;

        if (total === 0) return 0;

        return Math.min(100, Math.round((balance.usedDays / total) * 100));
    };

    // Obtenir les quotas à afficher, triés par solde disponible
    const getQuotasToDisplay = () => {
        if (!quotaSummary) return [];

        return [...quotaSummary.balances]
            .sort((a, b) => {
                // Priorité aux soldes non nuls
                if (a.currentBalance > 0 && b.currentBalance === 0) return -1;
                if (a.currentBalance === 0 && b.currentBalance > 0) return 1;

                // Ensuite par ordre décroissant de solde
                return b.currentBalance - a.currentBalance;
            });
    };

    // Obtenir la liste des jours qui vont expirer pour un type de congé
    const getExpiringDays = (leaveType: LeaveType) => {
        if (!quotaSummary) return null;

        const expiringItems = quotaSummary.expiringDays[leaveType];

        if (!expiringItems || expiringItems.length === 0) return null;

        return expiringItems.sort((a, b) =>
            new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
        );
    };

    // Formater une date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
        } catch (error: unknown) {
            return dateString;
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Quotas disponibles</CardTitle>
                        <CardDescription>
                            Consultez vos soldes de congés et les quotas qui vont expirer
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadQuotaSummary(periodId)}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                            Impossible de charger les informations de quotas.
                        </AlertDescription>
                    </Alert>
                ) : !quotaSummary ? (
                    <div className="text-center py-4 text-slate-500">
                        Aucune information de quota disponible.
                    </div>
                ) : (
                    <>
                        {/* Avertissement pour les quotas qui expirent bientôt */}
                        {hasExpiringQuotas() && (
                            <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription>
                                    <strong>Attention :</strong> Certains de vos quotas expirent bientôt. Consultez la section "Expiration" pour plus de détails.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Période active */}
                        {quotaSummary && (
                            <div className="mb-4 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                                <span>Période active : {activePeriods.find(p => p.id === quotaSummary.periodId)?.name || quotaSummary.periodId}</span>
                            </div>
                        )}

                        {/* Liste des quotas disponibles */}
                        <div className="space-y-4">
                            {getQuotasToDisplay().length === 0 ? (
                                <div className="text-center py-4 text-slate-500">
                                    Aucun quota disponible pour cette période.
                                </div>
                            ) : (
                                getQuotasToDisplay().map(balance => {
                                    const usagePercentage = getUsagePercentage(balance.leaveType);
                                    const expiringQuotas = getExpiringDays(balance.leaveType);

                                    return (
                                        <div key={balance.leaveType} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-medium text-base">
                                                        {getLabelForLeaveType(balance.leaveType)}
                                                        {balance.pendingDays > 0 && (
                                                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                                                {balance.pendingDays} j en attente
                                                            </Badge>
                                                        )}
                                                    </h3>
                                                    <div className="text-sm text-slate-500 flex items-center gap-1">
                                                        <span>Total : {balance.initialBalance + balance.adjustedDays + balance.carriedOverDays} jours</span>
                                                        {balance.carriedOverDays > 0 && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                dont {balance.carriedOverDays} j reportés
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold">
                                                    {balance.currentBalance}
                                                    <span className="text-sm font-normal text-slate-500 ml-1">jours</span>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Utilisé : {balance.usedDays} j</span>
                                                    <span className="text-slate-500">{usagePercentage}%</span>
                                                </div>
                                                <Progress
                                                    value={usagePercentage}
                                                    className={cn(
                                                        "h-2",
                                                        usagePercentage > 80 ? "bg-red-100" : usagePercentage > 50 ? "bg-amber-100" : "bg-slate-100"
                                                    )}
                                                    indicatorClassName={
                                                        usagePercentage > 80 ? "bg-red-500" : usagePercentage > 50 ? "bg-amber-500" : "bg-green-500"
                                                    }
                                                />
                                            </div>

                                            {/* Détails des transferts et reports si présents */}
                                            {(balance.transferredInDays > 0 || balance.transferredOutDays > 0) && (
                                                <div className="text-xs text-slate-500 mt-2">
                                                    {balance.transferredInDays > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                            </span>
                                                            <span>{balance.transferredInDays} jours reçus par transfert</span>
                                                        </div>
                                                    )}
                                                    {balance.transferredOutDays > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                            </span>
                                                            <span>{balance.transferredOutDays} jours transférés vers d'autres types</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Section d'expiration si des jours vont expirer */}
                                            {expiringQuotas && expiringQuotas.length > 0 && (
                                                <Accordion type="single" collapsible className="mt-2">
                                                    <AccordionItem value="expiration" className="border-0">
                                                        <AccordionTrigger className="py-2 text-sm text-amber-600 flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>Expiration de quotas</span>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="text-sm space-y-2 bg-amber-50 p-3 rounded-md">
                                                                {expiringQuotas.map((item, index) => {
                                                                    const daysUntil = differenceInDays(
                                                                        new Date(item.expirationDate),
                                                                        new Date()
                                                                    );

                                                                    return (
                                                                        <div key={index} className="flex justify-between items-center">
                                                                            <div>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={cn(
                                                                                        "mr-2",
                                                                                        daysUntil <= 7
                                                                                            ? "bg-red-50 text-red-700 border-red-200"
                                                                                            : daysUntil <= 30
                                                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                                                : "bg-blue-50 text-blue-700 border-blue-200"
                                                                                    )}
                                                                                >
                                                                                    {item.days} j
                                                                                </Badge>
                                                                                expirent le {formatDate(item.expirationDate)}
                                                                            </div>
                                                                            <div className="text-xs text-slate-500">
                                                                                {daysUntil <= 0
                                                                                    ? "Expiré"
                                                                                    : daysUntil === 1
                                                                                        ? "Demain"
                                                                                        : `Dans ${daysUntil} jours`}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default AvailableQuotaDisplay; 