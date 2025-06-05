import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import axios from 'axios';

type LeaveBalanceType = {
    typeCode: string;
    typeName: string;
    balance: number;
    allowance: number;
    carryOver: number;
    taken: number;
    pending: number;
    transferred: number;
};

type UserLeaveBalanceProps = {
    userId: number | string;
    year?: number;
    hideHeader?: boolean;
    compact?: boolean;
};

const UserLeaveBalance: React.FC<UserLeaveBalanceProps> = ({
    userId,
    year = new Date().getFullYear(),
    hideHeader = false,
    compact = false,
}) => {
    const [balances, setBalances] = useState<LeaveBalanceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalances = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get<LeaveBalanceType[]>(`/api/conges/balance`, {
                    params: { userId, year },
                });
                setBalances(response.data);
            } catch (err) {
                logger.error('Erreur lors du chargement des soldes de congés:', err);
                setError('Impossible de charger les soldes de congés');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalances();
    }, [userId, year]);

    if (isLoading) {
        return (
            <Card className="w-full">
                {!hideHeader && (
                    <CardHeader>
                        <CardTitle className="text-lg">Chargement des soldes...</CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full border-destructive">
                {!hideHeader && (
                    <CardHeader>
                        <CardTitle className="text-lg text-destructive">Erreur</CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            {!hideHeader && (
                <CardHeader>
                    <CardTitle className="text-lg">Soldes de congés {year}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                {balances.length === 0 ? (
                    <p className="text-muted-foreground">Aucun solde disponible</p>
                ) : (
                    <div className="space-y-4">
                        {balances.map((balance) => (
                            <div key={balance.typeCode} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium">{balance.typeName}</h3>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-lg font-semibold ${balance.balance <= 0 ? 'text-destructive' : ''}`}>
                                            {balance.balance} jour{balance.balance !== 1 ? 's' : ''}
                                        </span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info size={16} className="text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Solde disponible (allocation + reports - congés pris)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                {!compact && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Allocation annuelle:</span>
                                                <span>{balance.allowance} j</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Report année précédente:</span>
                                                <span>{balance.carryOver} j</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Transferts (net):</span>
                                                <span>{balance.transferred} j</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Jours pris:</span>
                                                <span>{balance.taken} j</span>
                                            </div>
                                            {balance.pending > 0 && (
                                                <div className="flex justify-between col-span-2">
                                                    <span className="text-muted-foreground">En attente de validation:</span>
                                                    <span>{balance.pending} j</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserLeaveBalance; 