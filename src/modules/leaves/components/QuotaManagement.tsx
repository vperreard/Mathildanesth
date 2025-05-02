import React, { useState } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import QuotaTransferForm from './QuotaTransferForm';
import { useLeaveQuota } from '../hooks/useLeaveQuota';
import { LeaveType, LeaveBalance, TransferHistory } from '../types/leave';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useQuotaTransfer } from '../hooks/useQuotaTransfer';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';

interface QuotaManagementProps {
    userId: string;
    userBalances?: LeaveBalance[];
    onUpdate?: () => void;
}

const QuotaManagement: React.FC<QuotaManagementProps> = ({
    userId,
    userBalances,
    onUpdate,
}) => {
    const [activeTab, setActiveTab] = useState('quotas');
    const { quotasByType, loading, error } = useLeaveQuota({ userId });
    const {
        transferHistory,
        fetchTransferHistory,
        loading: transferHistoryLoading
    } = useQuotaTransfer({ userId });

    const handleTransferComplete = () => {
        // Revenir à l'onglet des quotas après un transfert réussi
        setActiveTab('quotas');
        if (onUpdate) onUpdate();
        fetchTransferHistory();
    };

    // Formatage des soldes pour l'affichage
    const formatQuota = (amount: number) => {
        return amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
    };

    // Charger l'historique des transferts lorsque l'onglet "transferts" est activé
    React.useEffect(() => {
        if (activeTab === 'history') {
            fetchTransferHistory();
        }
    }, [activeTab, fetchTransferHistory]);

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Chargement des quotas...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="bg-red-50 text-red-800 p-4 rounded-md">
                        <p className="font-medium">Erreur lors du chargement</p>
                        <p className="text-sm">{error.toString()}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="quotas">Mes quotas</TabsTrigger>
                <TabsTrigger value="transfer">Transfert de jours</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="quotas">
                <Card>
                    <CardHeader>
                        <CardTitle>Mes quotas de congés</CardTitle>
                        <CardDescription>
                            Récapitulatif de vos soldes de congés par type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quotasByType.map((quota) => (
                                <Card key={quota.type} className="bg-slate-50">
                                    <CardContent className="p-6">
                                        <h3 className="font-medium text-lg mb-2">{quota.label}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Disponible</span>
                                            <span className="text-2xl font-bold">
                                                {formatQuota(quota.remaining)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-muted-foreground">Total</span>
                                            <span>{formatQuota(quota.total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-muted-foreground">Utilisé</span>
                                            <span>{formatQuota(quota.used)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-muted-foreground">En attente</span>
                                            <span>{formatQuota(quota.pending)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="transfer">
                <QuotaTransferForm
                    userId={userId}
                    onTransferComplete={handleTransferComplete}
                />
            </TabsContent>

            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des transferts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transferHistoryLoading ? (
                            <div className="text-center py-4">Chargement de l'historique...</div>
                        ) : transferHistory.length === 0 ? (
                            <div className="text-center py-4">Aucun transfert n'a été effectué</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>De</TableHead>
                                        <TableHead>Vers</TableHead>
                                        <TableHead>Jours débités</TableHead>
                                        <TableHead>Jours crédités</TableHead>
                                        <TableHead>Motif</TableHead>
                                        <TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transferHistory.map((transfer: TransferHistory) => (
                                        <TableRow key={transfer.id}>
                                            <TableCell>{formatDate(new Date(transfer.createdAt))}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {transfer.sourceType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {transfer.destinationType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{transfer.daysDebited}</TableCell>
                                            <TableCell>{transfer.daysCredit}</TableCell>
                                            <TableCell>{transfer.reason}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={transfer.status === 'COMPLETED' ? 'success' : 'secondary'}
                                                >
                                                    {transfer.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default QuotaManagement; 