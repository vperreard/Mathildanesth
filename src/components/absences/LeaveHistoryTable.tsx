import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { Table, Tag, Typography, Button, Empty, Tooltip, Skeleton } from 'antd';
import { SwapOutlined, CalendarOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, RightOutlined } from '@ant-design/icons';
import {
    fetchTransferHistory,
    fetchCarryOverHistory
} from '@/modules/leaves/services/quotaService';
import { QuotaTransactionStatus, QuotaTransactionType } from '@/modules/leaves/types/quota';

const { Text } = Typography;

/**
 * Props pour le composant LeaveHistoryTable
 */
interface LeaveHistoryTableProps {
    userId: string;
    limit?: number;
    refreshKey?: number;
}

/**
 * Type pour les transactions historiques unifiées
 */
interface TransactionHistoryItem {
    id: string;
    date: string;
    transactionType: QuotaTransactionType;
    sourceType?: string;
    targetType?: string;
    fromYear?: number;
    toYear?: number;
    amount: number;
    targetAmount?: number;
    status: QuotaTransactionStatus;
    approvalDate?: string;
    approvedBy?: string;
    comment?: string;
    expirationDate?: string;
}

/**
 * Composant qui affiche l'historique des transactions des quotas de congés
 * (transferts et reports)
 */
export const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
    userId,
    limit = 10,
    refreshKey = 0,
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [transferHistory, setTransferHistory] = useState<any[]>([]);
    const [carryOverHistory, setCarryOverHistory] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Récupérer les données d'historique
    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const [transfers, carryOvers] = await Promise.all([
                    fetchTransferHistory(userId),
                    fetchCarryOverHistory(userId)
                ]);
                setTransferHistory(transfers);
                setCarryOverHistory(carryOvers);
            } catch (err: unknown) {
                logger.error('Erreur lors de la récupération de l\'historique', err);
                setError('Impossible de charger l\'historique des transactions');
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [userId, limit, refreshKey]);

    // Formater les données pour l'affichage unifié
    const transactions: TransactionHistoryItem[] = [
        ...transferHistory.map(item => ({
            ...item,
            transactionType: QuotaTransactionType.TRANSFER
        })),
        ...carryOverHistory.map(item => ({
            ...item,
            transactionType: QuotaTransactionType.CARRY_OVER
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Obtenir la couleur du statut
    const getStatusColor = (status: QuotaTransactionStatus) => {
        switch (status) {
            case QuotaTransactionStatus.APPROVED:
            case QuotaTransactionStatus.COMPLETED:
                return 'success';
            case QuotaTransactionStatus.PENDING:
                return 'processing';
            case QuotaTransactionStatus.REJECTED:
            case QuotaTransactionStatus.CANCELLED:
                return 'error';
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
            case QuotaTransactionStatus.COMPLETED:
                return 'Terminé';
            case QuotaTransactionStatus.PENDING:
                return 'En attente';
            case QuotaTransactionStatus.REJECTED:
                return 'Rejeté';
            case QuotaTransactionStatus.CANCELLED:
                return 'Annulé';
            case QuotaTransactionStatus.EXPIRED:
                return 'Expiré';
            default:
                return status;
        }
    };

    // Formater la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => formatDate(date)
        },
        {
            title: 'Type',
            dataIndex: 'transactionType',
            key: 'transactionType',
            render: (type: QuotaTransactionType) => (
                <Tag icon={type === QuotaTransactionType.TRANSFER ? <SwapOutlined /> : <CalendarOutlined />}>
                    {type === QuotaTransactionType.TRANSFER ? 'Transfert' : 'Report'}
                </Tag>
            )
        },
        {
            title: 'Détails',
            key: 'details',
            render: (_: unknown, record: TransactionHistoryItem) => {
                if (record.transactionType === QuotaTransactionType.TRANSFER) {
                    return (
                        <span>
                            {record.sourceType} <RightOutlined /> {record.targetType}
                            <br />
                            <Text type="secondary">
                                {record.amount} jour(s) <RightOutlined /> {record.targetAmount} jour(s)
                            </Text>
                        </span>
                    );
                } else {
                    return (
                        <span>
                            {record.sourceType} ({record.fromYear} <RightOutlined /> {record.toYear})
                            <br />
                            <Text type="secondary">
                                {record.amount} jour(s)
                            </Text>
                        </span>
                    );
                }
            }
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status: QuotaTransactionStatus) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusLabel(status)}
                </Tag>
            )
        },
        {
            title: 'Commentaire',
            dataIndex: 'comment',
            key: 'comment',
            ellipsis: true,
            render: (comment?: string) => comment || '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: TransactionHistoryItem) => (
                <Tooltip title="Voir les détails">
                    <Button
                        type="text"
                        size="small"
                        icon={<InfoCircleOutlined />}
                        disabled={true} // Sera activé ultérieurement
                    />
                </Tooltip>
            )
        }
    ];

    if (loading) {
        return <Skeleton active paragraph={{ rows: 5 }} />;
    }

    if (error) {
        return (
            <Empty
                description={error}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    if (transactions.length === 0) {
        return (
            <Empty
                description="Aucune transaction de quota à afficher"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    return (
        <Table
            columns={columns}
            dataSource={transactions}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
        />
    );
}; 