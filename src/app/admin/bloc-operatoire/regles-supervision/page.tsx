"use client";

import React from 'react';
import { PageTitle } from '@/components/ui/page-title';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SupervisionRulesList from '@/modules/planning/bloc-operatoire/components/SupervisionRulesList';

// Créer une instance de QueryClient
const queryClient = new QueryClient();

export default function SupervisionRulesPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="container mx-auto p-6 space-y-8">
                <PageTitle
                    title="Règles de supervision du bloc opératoire"
                    description="Définissez les règles d'affectation et de supervision des salles"
                    backUrl="/admin/bloc-operatoire"
                />

                <SupervisionRulesList />
            </div>
        </QueryClientProvider>
    );
} 