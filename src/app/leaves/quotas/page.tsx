/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
'use client';

import React from 'react';
import { Tabs, Typography, Button, Row, Col, Divider } from 'antd';
import { SwapOutlined, CalendarOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { QuotaTransferForm } from '@/modules/leaves/quotas/transfer/QuotaTransferForm';
import { QuotaCarryOverForm } from '@/modules/leaves/quotas/carryOver/QuotaCarryOverForm';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/page-title';
import { ChartBar, ArrowLeftRight, FileText, BarChart2 } from 'lucide-react';
import { Card as ShadcnCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Import dynamique des composants pour éviter les erreurs de compilation
const LeaveQuotaOverview = dynamic(() => import('@/components/absences/LeaveQuotaOverview').then(mod => mod.LeaveQuotaOverview), {
    ssr: false,
    loading: () => <ShadcnCard><Typography.Paragraph>Chargement...</Typography.Paragraph></ShadcnCard>
});

const LeaveHistoryTable = dynamic(() => import('@/components/absences/LeaveHistoryTable').then(mod => mod.LeaveHistoryTable), {
    ssr: false,
    loading: () => <ShadcnCard><Typography.Paragraph>Chargement...</Typography.Paragraph></ShadcnCard>
});

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * Page de gestion des quotas de congés
 * Permet de visualiser, transférer et reporter des quotas de congés
 */
export default function QuotasPage() {
    const { user } = useAuth();
    const userId = user?.id;

    // État pour gérer le rafraîchissement du composant après une opération
    const [refreshCounter, setRefreshCounter] = React.useState(0);

    // État pour suivre l'onglet actif
    const [activeTab, setActiveTab] = React.useState('overview');

    // Années pour le report
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Fonction de rafraîchissement après une opération réussie
    const handleOperationComplete = () => {
        setRefreshCounter(prev => prev + 1);
        setActiveTab('overview');
    };

    if (!userId) {
        return (
            <ShadcnCard>
                <Title level={4}>Gestion des quotas de congés</Title>
                <Paragraph>Veuillez vous connecter pour accéder à cette page.</Paragraph>
            </ShadcnCard>
        );
    }

    // Vérifier si l'utilisateur est administrateur (sécurité supplémentaire)
    const isAdmin = user?.role === 'ADMIN' || user?.permissions?.includes('MANAGE_QUOTAS');

    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageTitle
                title="Gestion des quotas de congés"
                description="Consultez et gérez vos quotas de congés"
                backUrl="/leaves"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ShadcnCard>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <ChartBar className="h-5 w-5" />
                            <span>Mes quotas</span>
                        </CardTitle>
                        <CardDescription>
                            Consultez vos quotas de congés par type et par année
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Visualisez l'état de vos quotas, avec les jours disponibles, utilisés et en attente pour chaque type de congé.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/leaves/quotas/summary">
                                Consulter mes quotas
                            </Link>
                        </Button>
                    </CardFooter>
                </ShadcnCard>

                <ShadcnCard>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            <span>Transferts et Reports</span>
                        </CardTitle>
                        <CardDescription>
                            Transférez des quotas entre différents types de congés
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Effectuez des transferts entre vos différents types de congés selon les règles en vigueur.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/leaves/quotas/transfers">
                                Gérer mes transferts
                            </Link>
                        </Button>
                    </CardFooter>
                </ShadcnCard>

                <ShadcnCard>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>Historique</span>
                        </CardTitle>
                        <CardDescription>
                            Consulter l'historique de vos quotas et transferts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Visualisez l'historique de vos quotas, transferts et reports des années précédentes.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/leaves/quotas/history">
                                Voir mon historique
                            </Link>
                        </Button>
                    </CardFooter>
                </ShadcnCard>

                {/* Nouvelle carte pour la gestion avancée */}
                <ShadcnCard className="md:col-span-2 lg:col-span-3 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart2 className="h-5 w-5" />
                            <span>Gestion avancée des quotas</span>
                        </CardTitle>
                        <CardDescription>
                            Fonctionnalités avancées pour les transferts, reporting et configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Accédez à l'interface avancée de gestion des quotas incluant les rapports, transferts avancés et,
                            pour les administrateurs, la configuration des règles de report et transfert.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="default" className="w-full">
                            <Link href="/leaves/quotas/advanced">
                                Accéder à la gestion avancée
                            </Link>
                        </Button>
                    </CardFooter>
                </ShadcnCard>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane
                    tab={<span><HistoryOutlined /> Vue d'ensemble</span>}
                    key="overview"
                >
                    <LeaveQuotaOverview
                        userId={userId}
                        refreshKey={refreshCounter}
                    />

                    <Divider />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <ShadcnCard
                                title="Transfert de quotas"
                                extra={<Button type="primary" onClick={() => setActiveTab('transfer')}><SwapOutlined /> Transférer</Button>}
                            >
                                <Paragraph>
                                    Transférez des jours entre différents types de congés selon les règles en vigueur.
                                    Chaque type de congé a ses propres règles de conversion.
                                </Paragraph>
                            </ShadcnCard>
                        </Col>
                        <Col xs={24} sm={12}>
                            <ShadcnCard
                                title="Report de quotas"
                                extra={<Button type="primary" onClick={() => setActiveTab('carryover')}><CalendarOutlined /> Reporter</Button>}
                            >
                                <Paragraph>
                                    Reportez des jours de congés non utilisés de l'année {currentYear} vers l'année {nextYear}.
                                    Les règles de report varient selon le type de congés.
                                </Paragraph>
                            </ShadcnCard>
                        </Col>
                    </Row>

                    <Divider />

                    <ShadcnCard title="Historique des transactions">
                        <LeaveHistoryTable
                            userId={userId}
                            refreshKey={refreshCounter}
                        />
                    </ShadcnCard>
                </TabPane>

                <TabPane
                    tab={<span><SwapOutlined /> Transfert de quotas</span>}
                    key="transfer"
                >
                    <QuotaTransferForm
                        userId={userId}
                        onTransferComplete={handleOperationComplete}
                        onCancel={() => setActiveTab('overview')}
                    />
                </TabPane>

                <TabPane
                    tab={<span><CalendarOutlined /> Report de quotas</span>}
                    key="carryover"
                >
                    <QuotaCarryOverForm
                        userId={userId}
                        fromYear={currentYear}
                        toYear={nextYear}
                        onCarryOverComplete={handleOperationComplete}
                        onCancel={() => setActiveTab('overview')}
                    />
                </TabPane>

                {isAdmin && (
                    <TabPane
                        tab={<span><SettingOutlined /> Administration</span>}
                        key="admin"
                    >
                        <ShadcnCard title="Administration des quotas">
                            <Paragraph>
                                Cette section est réservée aux administrateurs et permet de configurer les règles de transfert et de report de quotas.
                            </Paragraph>

                            <Button
                                type="primary"
                                style={{ marginTop: 16 }}
                                href="/leaves/quotas/advanced"
                            >
                                <BarChart2 style={{ marginRight: 8 }} /> Accéder à la gestion avancée des quotas
                            </Button>
                        </ShadcnCard>
                    </TabPane>
                )}
            </Tabs>
        </div>
    );
} 