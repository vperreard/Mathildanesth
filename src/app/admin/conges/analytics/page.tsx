import React from 'react';
import { Metadata } from 'next';
import LeaveConflictDashboard from '@/modules/conges/components/LeaveConflictDashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

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
                    { label: 'Congés', href: '/admin/conges' },
                    { label: 'Analyse des Conflits', href: '/admin/conges/analytics' },
                ]}
                actions={[
                    {
                        label: 'Gestion des Congés',
                        href: '/admin/conges',
                        icon: 'calendar',
                        variant: 'outline',
                    },
                    {
                        label: 'Règles de Conflits',
                        href: '/admin/conges/conflict-rules',
                        icon: 'shield',
                        variant: 'outline',
                    },
                ]}
            />

            <Card className="mt-4">
                <CardContent>
                    <LeaveConflictDashboard />
                </CardContent>
            </Card>
        </div>
    );
} 