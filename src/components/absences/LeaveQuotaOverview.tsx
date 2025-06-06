import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { Card, Row, Col, Statistic, Progress, Divider, Typography, Tooltip, Alert, Skeleton } from 'antd';
// import { CalendarOutlined, ClockCircleOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { LeaveType } from '@/modules/leaves/types/leave';
import { fetchLeaveBalance } from '@/modules/leaves/services/leaveService';

const { Title, Text, Paragraph } = Typography;

/**
 * Props pour le composant LeaveQuotaOverview
 */
interface LeaveQuotaOverviewProps {
    userId: string;
    year?: number;
    refreshKey?: number;
}

/**
 * Composant qui affiche une vue d'ensemble des quotas de congés
 * avec les soldes actuels, utilisés et restants pour chaque type de congé
 */
export const LeaveQuotaOverview: React.FC<LeaveQuotaOverviewProps> = ({
    userId,
    year = new Date().getFullYear(),
    refreshKey = 0,
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [balance, setBalance] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Récupérer les données de solde
    useEffect(() => {
        const loadBalance = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchLeaveBalance(userId);
                setBalance(data);
            } catch (err: unknown) {
                logger.error('Erreur lors de la récupération des soldes de congés', { error: err });
                setError('Impossible de charger les soldes de congés');
            } finally {
                setLoading(false);
            }
        };

        loadBalance();
    }, [userId, refreshKey]);

    // Labels pour les types de congés
    const typeLabels: Record<string, string> = {
        [LeaveType.CONGE_PAYE]: 'Congés payés',
        [LeaveType.RTT]: 'RTT',
        [LeaveType.MALADIE]: 'Maladie',
        [LeaveType.SANS_SOLDE]: 'Sans solde',
        [LeaveType.MATERNITE]: 'Maternité',
        [LeaveType.PATERNITE]: 'Paternité',
        [LeaveType.FORMATION]: 'Formation',
        [LeaveType.AUTRE]: 'Autre',
    };

    // Calculer le pourcentage utilisé
    const getUsagePercentage = (type: string) => {
        if (!balance?.quotas?.[type]) return 0;
        const { initial, used } = balance.quotas[type];
        if (initial <= 0) return 0;
        return Math.min(Math.round((used / initial) * 100), 100);
    };

    // Déterminer la couleur en fonction du pourcentage restant
    const getColorByPercentage = (type: string) => {
        const percentage = getUsagePercentage(type);
        if (percentage >= 90) return '#f5222d'; // Rouge
        if (percentage >= 75) return '#fa8c16'; // Orange
        return '#52c41a'; // Vert
    };

    // Formater les jours avec une décimale si nécessaire
    const formatDays = (days: number) => {
        return days % 1 === 0 ? days.toString() : days.toFixed(1);
    };

    if (loading) {
        return (
            <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
        );
    }

    if (error) {
        return (
            <Alert
                message="Erreur"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    if (!balance || !balance.quotas) {
        return (
            <Alert
                message="Information"
                description="Aucune donnée de quota disponible pour cette année."
                type="info"
                showIcon
            />
        );
    }

    return (
        <Card>
            <Title level={4}>
                <CalendarOutlined /> Mes quotas de congés {year}
            </Title>
            <Paragraph>
                Vue d'ensemble de vos quotas et soldes de congés pour l'année {year}.
            </Paragraph>

            <Divider />

            <Row gutter={[16, 16]}>
                {Object.entries(balance.quotas).map(([type, quota]: [string, any]) => (
                    <Col xs={24} sm={12} md={8} key={type}>
                        <Card
                            size="small"
                            bordered
                            title={
                                <span>
                                    {typeLabels[type] || type}
                                    {quota.expiring > 0 && (
                                        <Tooltip title={`${quota.expiring} jour(s) expirant prochainement`}>
                                            <span style={{ color: '#faad14', marginLeft: 8 }}>⚠</span>
                                        </Tooltip>
                                    )}
                                </span>
                            }
                        >
                            <Statistic
                                title="Solde disponible"
                                value={formatDays(quota.remaining)}
                                suffix="jours"
                                valueStyle={{ color: getColorByPercentage(type) }}
                            />

                            <Progress
                                percent={getUsagePercentage(type)}
                                strokeColor={getColorByPercentage(type)}
                                size="small"
                                format={(percent) => `${percent}% utilisé`}
                            />

                            <Row style={{ marginTop: 12 }} gutter={8}>
                                <Col span={12}>
                                    <Tooltip title="Droits initiaux">
                                        <Text type="secondary">
                                            ℹ Initial: {formatDays(quota.initial)}j
                                        </Text>
                                    </Tooltip>
                                </Col>
                                <Col span={12}>
                                    <Tooltip title="Jours utilisés">
                                        <Text type="secondary">
                                            🕒 Utilisé: {formatDays(quota.used)}j
                                        </Text>
                                    </Tooltip>
                                </Col>
                            </Row>

                            {quota.pending > 0 && (
                                <Row style={{ marginTop: 8 }}>
                                    <Col span={24}>
                                        <Tooltip title="Demandes en attente d'approbation">
                                            <Text type="warning">
                                                🕒 En attente: {formatDays(quota.pending)}j
                                            </Text>
                                        </Tooltip>
                                    </Col>
                                </Row>
                            )}

                            {quota.transferred > 0 && (
                                <Row style={{ marginTop: 8 }}>
                                    <Col span={24}>
                                        <Tooltip title="Jours transférés (entrée - sortie)">
                                            <Text type={quota.transferred > 0 ? "success" : "danger"}>
                                                ✅ Transférés: {formatDays(quota.transferred)}j
                                            </Text>
                                        </Tooltip>
                                    </Col>
                                </Row>
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>
        </Card>
    );
}; 