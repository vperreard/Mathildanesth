"use client";

import React from 'react';
import { PageTitle } from '@/components/ui/page-title';
import { OperatingSectorList } from '@/modules/planning/bloc-operatoire/components/OperatingSectorList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créer une instance de QueryClient
const queryClient = new QueryClient();

export default function SecteursOperatoiresPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="container mx-auto p-6 space-y-8">
                <PageTitle
                    title="Gestion des secteurs opératoires"
                    description="Organisez les salles en secteurs avec codes couleur"
                    backUrl="/admin/bloc-operatoire"
                />

                <OperatingSectorList />
            </div>
        </QueryClientProvider>
    );
} 