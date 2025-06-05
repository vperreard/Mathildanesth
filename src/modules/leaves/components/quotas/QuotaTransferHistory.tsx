'use client';

import React, { useState, useEffect } from 'react';
import { useQuotaHistory } from '../../hooks/useQuotaHistory';
import { QuotaTransaction, QuotaTransactionType, QuotaTransactionStatus } from '../../types/quota';
import { getLabelForLeaveType } from '../../utils/leaveTypeUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownUp, Calendar, RefreshCw, Filter, ArrowRightLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';

interface QuotaTransferHistoryProps {
    userId: string;
    periodId?: string;
    limit?: number;
    showAllTransactions?: boolean;
    className?: string;
}

const QuotaTransferHistory: React.FC<QuotaTransferHistoryProps> = ({
    userId,
    periodId,
    limit = 10,
    showAllTransactions = false,
    className,
}) => {
    const [activeTab, setActiveTab] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<QuotaTransactionStatus | 'all'>('all');

    const {
        loading,
        error,
        transactions,
        activePeriods,
        quotaSummary,
        loadTransactionHistory,
        loadActivePeriods,
    } = useQuotaHistory(userId, periodId);

    // Charger l'historique des transactions au montage
    useEffect(() => {
        loadActivePeriods();
        loadTransactionHistory(periodId, QuotaTransactionType.TRANSFER);
    }, [periodId, loadActivePeriods, loadTransactionHistory]);

    // Filtrer les transactions par type
    const getFilteredTransactions = () => {
        // Récupérer uniquement les transferts
        const transferTransactions = transactions.filter(t => t.transactionType === QuotaTransactionType.TRANSFER);

        // Appliquer le filtre de statut si nécessaire
        let filtered = transferTransactions;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Appliquer la limite
        if (limit && !showAllTransactions) {
            filtered = filtered.slice(0, limit);
        }

        return filtered;
    };

    // Formatter une date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
        } catch (error: unknown) {
            return dateString;
        }
    };

    // Obtenir la couleur du badge selon le statut
    const getStatusBadgeVariant = (status: QuotaTransactionStatus) => {
        switch (status) {
            case QuotaTransactionStatus.APPROVED:
            case QuotaTransactionStatus.COMPLETED:
                return 'success';
            case QuotaTransactionStatus.PENDING:
                return 'outline';
            case QuotaTransactionStatus.REJECTED:
                return 'destructive';
            case QuotaTransactionStatus.CANCELLED:
                return 'secondary';
            case QuotaTransactionStatus.EXPIRED:
                return 'warning';
            default:
                return 'default';
        }
    };

    // Obtenir le libellé du statut
    const getStatusLabel = (status: QuotaTransactionStatus) => {
        switch (status) {
            case QuotaTransactionStatus.APPROVED:
                return 'Approuvé';
            case QuotaTransactionStatus.PENDING:
                return 'En attente';
            case QuotaTransactionStatus.REJECTED:
                return 'Rejeté';
            case QuotaTransactionStatus.CANCELLED:
                return 'Annulé';
            case QuotaTransactionStatus.EXPIRED:
                return 'Expiré';
            case QuotaTransactionStatus.COMPLETED:
                return 'Terminé';
            default:
                return status;
        }
    };

    // Transactions filtrées à afficher
    const filteredTransactions = getFilteredTransactions();

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Historique des transferts</CardTitle>
                        <CardDescription>
                            Consultez l'historique de vos transferts de quotas
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTransactionHistory(periodId, QuotaTransactionType.TRANSFER)}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">Tous</TabsTrigger>
                            <TabsTrigger value="pending">En attente</TabsTrigger>
                            <TabsTrigger value="completed">Terminés</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 ml-4">
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => setStatusFilter(val as any)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value={QuotaTransactionStatus.PENDING}>En attente</SelectItem>
                                <SelectItem value={QuotaTransactionStatus.APPROVED}>Approuvés</SelectItem>
                                <SelectItem value={QuotaTransactionStatus.COMPLETED}>Terminés</SelectItem>
                                <SelectItem value={QuotaTransactionStatus.REJECTED}>Rejetés</SelectItem>
                                <SelectItem value={QuotaTransactionStatus.CANCELLED}>Annulés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-4 text-red-500">
                        Une erreur est survenue lors du chargement de l'historique.
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Aucun transfert trouvé pour cette période.</p>
                        {activeTab !== 'all' && (
                            <p className="mt-2">
                                <Button variant="link" onClick={() => setActiveTab('all')}>
                                    Voir tous les transferts
                                </Button>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>De</TableHead>
                                    <TableHead>Vers</TableHead>
                                    <TableHead>Jours</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Commentaire</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(transaction.requestDate)}
                                        </TableCell>
                                        <TableCell>
                                            {getLabelForLeaveType(transaction.leaveType)}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.targetLeaveType ?
                                                getLabelForLeaveType(transaction.targetLeaveType) :
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span>{transaction.amount}</span>
                                                <ArrowDownUp className="h-3 w-3 text-slate-400" />
                                                <span className="text-slate-500">
                                                    {transaction.resultingBalance}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                                                {getStatusLabel(transaction.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {transaction.comment || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            {filteredTransactions.length > 0 && limit && !showAllTransactions && filteredTransactions.length >= limit && (
                <CardFooter className="flex justify-center">
                    <Button variant="link" onClick={() => loadTransactionHistory(periodId, QuotaTransactionType.TRANSFER)}>
                        Voir plus de transferts
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default QuotaTransferHistory; 