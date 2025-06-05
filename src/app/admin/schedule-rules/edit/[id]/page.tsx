'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../../lib/logger";
import { useRouter } from 'next/navigation';
import { useScheduleRules } from '@/modules/dynamicRules/hooks/useScheduleRules';
import { RuleForm } from '@/modules/dynamicRules/components/RuleForm';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface EditRulePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditRulePage({ params }: EditRulePageProps) {
    const [id, setId] = useState<string>('');
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    const {
        getRuleById,
        updateRule
    } = useScheduleRules({ autoFetch: false });

    const [rule, setRule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resolve params Promise
    useEffect(() => {
        params.then(resolvedParams => {
            setId(resolvedParams.id);
        });
    }, [params]);

    // Charger la règle au chargement de la page
    useEffect(() => {
        const fetchRule = async () => {
            setIsLoading(true);
            try {
                const fetchedRule = await getRuleById(id);
                if (!fetchedRule) {
                    setError('Règle non trouvée');
                    return;
                }
                setRule(fetchedRule);
            } catch (err) {
                logger.error('Erreur lors du chargement de la règle:', err);
                setError('Erreur lors du chargement de la règle');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchRule();
        }
    }, [id, getRuleById]);

    // Gérer la soumission du formulaire
    const handleSubmit = async (data: any) => {
        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Vous devez être connecté pour modifier une règle.'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateRule(id, {
                ...data,
                updatedBy: user.id
            });

            toast({
                title: 'Succès',
                description: 'La règle a été mise à jour avec succès.'
            });

            router.push('/admin/planningMedical-rules');
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de la règle:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la mise à jour de la règle.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Annuler l'édition
    const handleCancel = () => {
        router.push('/admin/planningMedical-rules');
    };

    // Afficher un message d'erreur si la règle n'a pas pu être chargée
    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="bg-red-50 p-6 rounded-lg shadow text-red-700">
                    <h1 className="text-2xl font-bold mb-4">Erreur</h1>
                    <p>{error}</p>
                    <button
                        onClick={() => router.push('/admin/planningMedical-rules')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retour à la liste des règles
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Modifier la règle</h1>
                <p className="text-gray-500 mt-2">
                    Modifiez les conditions et les actions pour cette règle de planification.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : rule && user ? (
                    <RuleForm
                        initialData={rule}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isSubmitting}
                        currentUserId={user.id}
                    />
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                        Chargement des données...
                    </div>
                )}
            </div>
        </div>
    );
} 