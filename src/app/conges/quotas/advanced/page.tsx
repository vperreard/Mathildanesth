'use client';

import React from 'react';
import QuotaAdvancedManagement from '@/modules/leaves/components/QuotaAdvancedManagement';
import { useSearchParams } from 'next/navigation';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Page de gestion avancée des quotas de congés
 * Permet d'accéder aux fonctionnalités de transfert, reporting et configuration
 */
export default function QuotaAdvancedPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageTitle
                title="Gestion avancée des quotas"
                description="Transferts, reporting et configuration des règles de quotas"
                backUrl="/conges/quotas"
            />

            <QuotaAdvancedManagement userId={userId || undefined} />
        </div>
    );
} 