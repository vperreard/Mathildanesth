'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecurringLeaveRequestForm from '@/modules/leaves/components/RecurringLeaveRequestForm';
import { RecurringLeaveRequest } from '@/modules/leaves/types/leave';
import { createRecurringLeaveRequest } from '@/modules/leaves/services/leaveService';

/**
 * Page de demande de congés récurrents
 */
const RecurringLeavePage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // État initial avec l'utilisateur actuel (dans une application réelle, il serait obtenu depuis un contexte)
    const initialData: Partial<RecurringLeaveRequest> = {
        userId: 'current-user-id', // À remplacer par l'ID réel de l'utilisateur
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (data: Partial<RecurringLeaveRequest>) => {
        setIsLoading(true);
        setError(null);

        try {
            // Envoyer la demande à l'API
            const result = await createRecurringLeaveRequest(data);

            // Rediriger vers une page de confirmation ou la liste des congés
            router.push('/conges?success=recurring-created');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la demande');
            setIsLoading(false);
        }
    };

    // Annuler et retourner à la liste des congés
    const handleCancel = () => {
        router.push('/conges');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Nouvelle demande de congés récurrents</h1>

                {error && (
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                <RecurringLeaveRequestForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default RecurringLeavePage; 