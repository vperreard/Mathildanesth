import React from 'react';
import { Metadata } from 'next';
import { LeaveConflictDashboard } from '@/modules/leaves/components/LeaveConflictDashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';

export const metadata: Metadata = {
    title: 'Analyse des Conflits de Congés | Administration',
    description: "Tableau de bord d'analyse des conflits de congés pour les administrateurs",
};

export default function LeaveConflictAnalyticsPage() {
    return (
        <div className="container-fluid p-4">
            <PageHeader
                title="Analyse des Conflits de Congés"
                description="Visualisez et analysez les tendances et patterns des conflits de congés"
                breadcrumbs={[
                    { label: 'Accueil', href: '/admin' },
                    { label: 'Congés', href: '/admin/leaves' },
                    { label: 'Analyse des Conflits', href: '/admin/leaves/analytics' },
                ]}
                actions={[
                    {
                        label: 'Gestion des Congés',
                        href: '/admin/leaves',
                        icon: 'calendar',
                        variant: 'outline',
                    },
                    {
                        label: 'Règles de Conflits',
                        href: '/admin/leaves/conflict-rules',
                        icon: 'shield',
                        variant: 'outline',
                    },
                ]}
            />

            <Card className="mt-4">
                <CardBody>
                    <LeaveConflictDashboard />
                </CardBody>
            </Card>
        </div>
    );
} 