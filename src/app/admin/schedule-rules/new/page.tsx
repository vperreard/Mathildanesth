'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScheduleRules } from '@/modules/dynamicRules/hooks/useScheduleRules';
import { RuleForm } from '@/modules/dynamicRules/components/RuleForm';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Supposons que ce hook existe pour l'authentification

export default function NewRulePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const { createRule } = useScheduleRules({ autoFetch: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Vous devez être connecté pour créer une règle.'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createRule({
                ...data,
                createdBy: user.id
            });

            toast({
                title: 'Succès',
                description: 'La règle a été créée avec succès.'
            });

            router.push('/admin/schedule-rules');
        } catch (error) {
            console.error('Erreur lors de la création de la règle:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la création de la règle.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin/schedule-rules');
    };

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Créer une nouvelle règle</h1>
                <p className="text-gray-500 mt-2">
                    Configurez les conditions et les actions pour cette règle de planification.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                {user ? (
                    <RuleForm
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isSubmitting}
                        currentUserId={user.id}
                    />
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                        Chargement des données utilisateur...
                    </div>
                )}
            </div>
        </div>
    );
} 