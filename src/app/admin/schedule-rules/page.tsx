'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RulesList } from '@/modules/dynamicRules/components/RulesList';
import { useScheduleRules } from '@/modules/dynamicRules/hooks/useScheduleRules';
import { ScheduleRule } from '@/modules/dynamicRules/models/ScheduleRule';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ScheduleRulesPage() {
    const router = useRouter();
    const { toast } = useToast();

    const {
        rules,
        loading,
        error,
        updateRule,
        deleteRule
    } = useScheduleRules({ autoFetch: true });

    // États pour la boîte de dialogue de confirmation de suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

    // Gérer les erreurs
    useEffect(() => {
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message
            });
        }
    }, [error, toast]);

    // Naviguer vers la page de création
    const handleCreateRule = () => {
        router.push('/admin/schedule-rules/new');
    };

    // Naviguer vers la page d'édition
    const handleEditRule = (rule: ScheduleRule) => {
        router.push(`/admin/schedule-rules/edit/${rule.id}`);
    };

    // Ouvrir la boîte de dialogue de confirmation de suppression
    const handleDeleteConfirmation = (id: string) => {
        setRuleToDelete(id);
        setDeleteDialogOpen(true);
    };

    // Confirmer la suppression
    const confirmDelete = async () => {
        if (ruleToDelete) {
            try {
                await deleteRule(ruleToDelete);
                toast({
                    title: 'Succès',
                    description: 'La règle a été supprimée avec succès.'
                });
            } catch (err) {
                toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: 'Impossible de supprimer la règle.'
                });
            } finally {
                setRuleToDelete(null);
                setDeleteDialogOpen(false);
            }
        }
    };

    // Activer/désactiver une règle
    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await updateRule(id, { isActive });
            toast({
                title: 'Succès',
                description: `La règle a été ${isActive ? 'activée' : 'désactivée'} avec succès.`
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: `Impossible de ${isActive ? 'activer' : 'désactiver'} la règle.`
            });
        }
    };

    // Filtrer les règles actives et inactives
    const activeRules = rules.filter(rule => rule.isActive);
    const inactiveRules = rules.filter(rule => !rule.isActive);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gestion des règles de planification</h1>
                <Button onClick={handleCreateRule}>
                    Créer une nouvelle règle
                </Button>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
                <Tabs defaultValue="active">
                    <TabsList className="mb-4">
                        <TabsTrigger value="active">Règles actives ({activeRules.length})</TabsTrigger>
                        <TabsTrigger value="inactive">Règles inactives ({inactiveRules.length})</TabsTrigger>
                        <TabsTrigger value="all">Toutes les règles ({rules.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        <RulesList
                            rules={activeRules}
                            onEdit={handleEditRule}
                            onDelete={handleDeleteConfirmation}
                            onToggleActive={handleToggleActive}
                        />
                    </TabsContent>

                    <TabsContent value="inactive">
                        <RulesList
                            rules={inactiveRules}
                            onEdit={handleEditRule}
                            onDelete={handleDeleteConfirmation}
                            onToggleActive={handleToggleActive}
                        />
                    </TabsContent>

                    <TabsContent value="all">
                        <RulesList
                            rules={rules}
                            onEdit={handleEditRule}
                            onDelete={handleDeleteConfirmation}
                            onToggleActive={handleToggleActive}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Boîte de dialogue de confirmation de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette règle?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. La règle sera définitivement supprimée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 