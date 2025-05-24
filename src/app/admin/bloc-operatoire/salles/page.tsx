"use client";

import React from 'react';
import { PageTitle } from '@/components/ui/page-title';
import { OperatingRoomList } from '@/modules/planning/bloc-operatoire/components/OperatingRoomList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créer une instance de QueryClient
const queryClient = new QueryClient();

export default function SallesOperatoiresPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="container mx-auto p-6 space-y-8">
                <PageTitle
                    title="Gestion des salles d'opération"
                    description="Ajoutez, modifiez et supprimez les salles d'opération"
                    backUrl="/admin/bloc-operatoire"
                />

                <OperatingRoomList />
            </div>
        </QueryClientProvider>
    );
} 