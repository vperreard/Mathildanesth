import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeaveType } from "../types/leave";
import { useQuotaTransfer } from "../hooks/useQuotaTransfer";
import { getLeaveTypeLabel } from "../services/leaveService";
import { formatDate } from "@/utils/date";
import { Loader2 } from "lucide-react";
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DatePickerWithRange } from '../../../components/ui/date-range-picker';
import { formatLeaveType } from '../utils/leaveTypeFormatter';
import { TransferHistory } from '../types/leave';

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface QuotaTransferHistoryProps {
    userId?: string;
}

export function QuotaTransferHistory({ userId }: QuotaTransferHistoryProps) {
    const { transferHistory, loadTransferHistory, isLoading } = useQuotaTransfer();
    const [filteredHistory, setFilteredHistory] = useState<TransferHistory[]>([]);
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [dateRange, setDateRange] = useState<DateRange>({
        from: undefined,
        to: undefined
    });

    const years = Array.from(
        { length: 5 },
        (_, i) => (new Date().getFullYear() - i).toString()
    );

    useEffect(() => {
        loadTransferHistory(parseInt(yearFilter));
    }, [yearFilter, loadTransferHistory]);

    useEffect(() => {
        let filtered = [...transferHistory];

        // Filtrage par plage de dates si défini
        if (dateRange.from && dateRange.to) {
            filtered = filtered.filter(transfer => {
                const transferDate = new Date(transfer.createdAt);
                return transferDate >= dateRange.from! && transferDate <= dateRange.to!;
            });
        }

        setFilteredHistory(filtered);
    }, [transferHistory, dateRange]);

    const handleYearChange = (year: string) => {
        setYearFilter(year);
        // Réinitialiser le filtre de date
        setDateRange({ from: undefined, to: undefined });
    };

    const handleDateRangeChange = (range: DateRange) => {
        setDateRange(range);
    };

    const renderSourceTypeBadge = (type: string) => (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {formatLeaveType(type)}
        </Badge>
    );

    const renderDestinationTypeBadge = (type: string) => (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {formatLeaveType(type)}
        </Badge>
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">
                            Chargement de l'historique...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Historique des transferts de quotas</CardTitle>
                <CardDescription>
                    Consultez l'historique de vos transferts de jours entre types de congés
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <div className="w-full sm:w-1/4">
                        <Select value={yearFilter} onValueChange={handleYearChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Année" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-2/4">
                        <DatePickerWithRange
                            dateRange={dateRange}
                            onChange={handleDateRangeChange}
                            className="w-full"
                        />
                    </div>
                    <div className="w-full sm:w-1/4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDateRange({ from: undefined, to: undefined });
                                loadTransferHistory(parseInt(yearFilter));
                            }}
                        >
                            Réinitialiser les filtres
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center p-6 text-slate-500">
                        Aucun transfert trouvé pour la période sélectionnée
                    </div>
                ) : (
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead className="text-right">Jours prélevés</TableHead>
                                    <TableHead className="text-right">Jours crédités</TableHead>
                                    <TableHead>Motif</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.map((transfer) => (
                                    <TableRow key={transfer.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(transfer.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </TableCell>
                                        <TableCell>
                                            {renderSourceTypeBadge(transfer.sourceType)}
                                        </TableCell>
                                        <TableCell>
                                            {renderDestinationTypeBadge(transfer.destinationType)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            -{transfer.daysDebited}j
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            +{transfer.daysCredit}j
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={transfer.reason}>
                                            {transfer.reason}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default QuotaTransferHistory; 