import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Leave, LeaveType, LeaveBalance } from '../../leaves/types/leave';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button, Card, Col, DatePicker, Row, Select, Table, Tabs, Typography } from 'antd';
import { DownloadOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';

// Enregistrement des composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const { Title: AntTitle, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Interface pour les propriétés du composant
interface LeaveDashboardProps {
    userId?: string;
    departmentId?: string;
    isManager?: boolean;
}

// Tableau de bord analytique pour les congés
const LeaveDashboard: React.FC<LeaveDashboardProps> = ({ userId, departmentId, isManager = false }) => {
    // États pour les filtres et les données
    const [dateRange, setDateRange] = useState<[Date, Date]>([
        subMonths(new Date(), 6),
        addMonths(new Date(), 6),
    ]);
    const [leaveData, setLeaveData] = useState<Leave[]>([]);
    const [balanceData, setBalanceData] = useState<LeaveBalance[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
        departmentId ? [departmentId] : []
    );
    const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Chargement des données
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Dans un cas réel, ces appels seraient faits aux APIs correspondantes
                // Simulons des données pour l'exemple
                const leaves = await fetchLeaveData(dateRange, selectedDepartments, selectedLeaveTypes, userId);
                const balances = await fetchBalanceData(selectedDepartments, userId);

                setLeaveData(leaves);
                setBalanceData(balances);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, selectedDepartments, selectedLeaveTypes, userId]);

    // Fonction de simulation de récupération des congés
    const fetchLeaveData = async (
        range: [Date, Date],
        departments: string[],
        types: LeaveType[],
        user?: string
    ): Promise<Leave[]> => {
        // Simuler un appel API - à remplacer par un vrai appel dans l'implémentation finale
        return new Promise(resolve => {
            setTimeout(() => {
                // Données simulées
                const mockLeaves: Leave[] = [
                    // Ces données seraient normalement récupérées d'une API
                    {
                        id: '1',
                        userId: '101',
                        startDate: new Date('2023-07-10'),
                        endDate: new Date('2023-07-21'),
                        type: LeaveType.ANNUAL,
                        status: 'APPROVED',
                        countedDays: 10,
                        requestDate: new Date('2023-06-15'),
                        createdAt: new Date('2023-06-15'),
                        updatedAt: new Date('2023-06-16'),
                    },
                    // Autres congés...
                ];
                resolve(mockLeaves);
            }, 1000);
        });
    };

    // Fonction de simulation de récupération des soldes
    const fetchBalanceData = async (
        departments: string[],
        user?: string
    ): Promise<LeaveBalance[]> => {
        // Simuler un appel API - à remplacer par un vrai appel dans l'implémentation finale
        return new Promise(resolve => {
            setTimeout(() => {
                // Données simulées
                const mockBalances: LeaveBalance[] = [
                    {
                        userId: '101',
                        year: 2023,
                        initialAllowance: 25,
                        additionalAllowance: 2,
                        used: 15,
                        pending: 5,
                        remaining: 7,
                        detailsByType: {
                            [LeaveType.ANNUAL]: {
                                used: 12,
                                pending: 3,
                            },
                            [LeaveType.RECOVERY]: {
                                used: 3,
                                pending: 2,
                            },
                        },
                        lastUpdated: new Date(),
                    },
                    // Autres soldes...
                ];
                resolve(mockBalances);
            }, 1000);
        });
    };

    // Préparation des données pour les graphiques
    const prepareMonthlySummaryData = () => {
        const months = eachMonthOfInterval({
            start: dateRange[0],
            end: dateRange[1],
        });

        const monthlyData = months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthLeaves = leaveData.filter(
                leave =>
                    new Date(leave.startDate) <= monthEnd &&
                    new Date(leave.endDate) >= monthStart
            );

            return {
                month: format(month, 'MMM yyyy', { locale: fr }),
                count: monthLeaves.length,
                totalDays: monthLeaves.reduce((sum, leave) => sum + leave.countedDays, 0),
            };
        });

        return {
            labels: monthlyData.map(d => d.month),
            datasets: [
                {
                    label: 'Nombre de jours de congés',
                    data: monthlyData.map(d => d.totalDays),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareLeaveTypeData = () => {
        const leavesByType: Record<string, number> = {};

        leaveData.forEach(leave => {
            leavesByType[leave.type] = (leavesByType[leave.type] || 0) + leave.countedDays;
        });

        return {
            labels: Object.keys(leavesByType).map(type => getLeaveTypeName(type)),
            datasets: [
                {
                    data: Object.values(leavesByType),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // Fonction de formatage du nom du type de congé
    const getLeaveTypeName = (type: string): string => {
        switch (type) {
            case LeaveType.ANNUAL:
                return 'Congés annuels';
            case LeaveType.RECOVERY:
                return 'Récupération';
            case LeaveType.TRAINING:
                return 'Formation';
            case LeaveType.SICK:
                return 'Maladie';
            case LeaveType.MATERNITY:
                return 'Maternité';
            case LeaveType.SPECIAL:
                return 'Congés spéciaux';
            case LeaveType.UNPAID:
                return 'Sans solde';
            default:
                return 'Autre';
        }
    };

    // Préparation des données pour l'analyse de quotas
    const prepareQuotaAnalysisData = () => {
        if (balanceData.length === 0) return null;

        const balance = balanceData[0]; // Pour l'exemple, on prend le premier
        const used = balance.used;
        const pending = balance.pending;
        const remaining = balance.remaining;
        const total = used + pending + remaining;

        return {
            labels: ['Utilisés', 'En attente', 'Restants'],
            datasets: [
                {
                    data: [used, pending, remaining],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // Colonnes pour le tableau des congés
    const leaveColumns = [
        {
            title: 'Employé',
            dataIndex: 'userId',
            key: 'userId',
            render: (userId: string) => `Employé ${userId}`, // Remplacer par un vrai nom
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => getLeaveTypeName(type),
        },
        {
            title: 'Début',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date: Date) => format(new Date(date), 'dd/MM/yyyy'),
        },
        {
            title: 'Fin',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date: Date) => format(new Date(date), 'dd/MM/yyyy'),
        },
        {
            title: 'Jours',
            dataIndex: 'countedDays',
            key: 'countedDays',
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                switch (status) {
                    case 'APPROVED':
                        return <span style={{ color: 'green' }}>Approuvé</span>;
                    case 'PENDING':
                        return <span style={{ color: 'orange' }}>En attente</span>;
                    case 'REJECTED':
                        return <span style={{ color: 'red' }}>Refusé</span>;
                    default:
                        return status;
                }
            },
        },
    ];

    return (
        <div className="leave-dashboard">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
                <Col>
                    <AntTitle level={2}>Tableau de bord des congés</AntTitle>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => console.log('Export')}
                    >
                        Exporter
                    </Button>
                </Col>
            </Row>

            {/* Filtres */}
            <Card style={{ marginBottom: 16 }} title="Filtres">
                <Row gutter={16}>
                    <Col span={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={(_, dateStrings) => {
                                setDateRange([new Date(dateStrings[0]), new Date(dateStrings[1])]);
                            }}
                            format="DD/MM/YYYY"
                        />
                    </Col>
                    {isManager && (
                        <Col span={8}>
                            <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                placeholder="Sélectionner les départements"
                                onChange={values => setSelectedDepartments(values)}
                                value={selectedDepartments}
                            >
                                <Option value="dep1">Service RH</Option>
                                <Option value="dep2">Service Technique</Option>
                                <Option value="dep3">Service Commercial</Option>
                            </Select>
                        </Col>
                    )}
                    <Col span={8}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Types de congés"
                            onChange={values => setSelectedLeaveTypes(values)}
                            value={selectedLeaveTypes}
                        >
                            <Option value={LeaveType.ANNUAL}>Congés annuels</Option>
                            <Option value={LeaveType.RECOVERY}>Récupération</Option>
                            <Option value={LeaveType.TRAINING}>Formation</Option>
                            <Option value={LeaveType.SICK}>Maladie</Option>
                            <Option value={LeaveType.MATERNITY}>Maternité</Option>
                            <Option value={LeaveType.SPECIAL}>Congés spéciaux</Option>
                            <Option value={LeaveType.UNPAID}>Sans solde</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Onglets d'analyse */}
            <Tabs defaultActiveKey="overview">
                <TabPane tab="Vue d'ensemble" key="overview">
                    <Row gutter={[16, 16]}>
                        {/* Résumé des quotas */}
                        <Col span={8}>
                            <Card title="Solde de congés" loading={loading}>
                                {balanceData.length > 0 && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                                            {balanceData[0].remaining}
                                        </div>
                                        <Text>jours restants</Text>
                                        <div style={{ marginTop: 16 }}>
                                            <div>
                                                <Text>Attribués: </Text>
                                                <Text strong>{balanceData[0].initialAllowance + balanceData[0].additionalAllowance}</Text>
                                            </div>
                                            <div>
                                                <Text>Utilisés: </Text>
                                                <Text strong>{balanceData[0].used}</Text>
                                            </div>
                                            <div>
                                                <Text>En attente: </Text>
                                                <Text strong>{balanceData[0].pending}</Text>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </Col>

                        {/* Distribution par type */}
                        <Col span={8}>
                            <Card title="Répartition par type" loading={loading}>
                                {leaveData.length > 0 && (
                                    <Pie data={prepareLeaveTypeData()} />
                                )}
                            </Card>
                        </Col>

                        {/* Analyse des quotas */}
                        <Col span={8}>
                            <Card title="Analyse des quotas" loading={loading}>
                                {balanceData.length > 0 && (
                                    <Pie data={prepareQuotaAnalysisData()} />
                                )}
                            </Card>
                        </Col>

                        {/* Graphique d'évolution */}
                        <Col span={24}>
                            <Card title="Évolution mensuelle" loading={loading}>
                                {leaveData.length > 0 && (
                                    <Bar
                                        data={prepareMonthlySummaryData()}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                },
                                                title: {
                                                    display: false,
                                                },
                                            },
                                        }}
                                    />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                <TabPane tab="Détails des congés" key="details">
                    <Card title="Liste des congés" loading={loading}>
                        <Table
                            columns={leaveColumns}
                            dataSource={leaveData}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </TabPane>

                {isManager && (
                    <TabPane tab="Analyse d'équipe" key="team">
                        <Card title="Charge d'absence par période" loading={loading}>
                            <div style={{ height: 400 }}>
                                <Line
                                    data={{
                                        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                                        datasets: [
                                            {
                                                label: 'Taux d\'absence (%)',
                                                data: [5, 7, 8, 10, 15, 25, 35, 28, 12, 8, 10, 12],
                                                borderColor: 'rgba(255, 99, 132, 1)',
                                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                            },
                                            {
                                                label: 'Seuil d\'alerte',
                                                data: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
                                                borderColor: 'rgba(255, 206, 86, 1)',
                                                borderDash: [5, 5],
                                                fill: false,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return context.dataset.label + ': ' + context.parsed.y + '%';
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                max: 50,
                                                title: {
                                                    display: true,
                                                    text: '% d\'effectif absent'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                                <Text type="danger">
                                    Périodes de tension détectées: Juillet (35%), Août (28%)
                                </Text>
                            </div>
                        </Card>
                    </TabPane>
                )}
            </Tabs>
        </div>
    );
};

export default LeaveDashboard; 