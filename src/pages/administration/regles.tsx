import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/navigation';
import { useRule } from '../../modules/rules/hooks/useRule';
import { RulesList } from '../../modules/rules/components/RulesList';
import { RuleForm } from '../../modules/rules/components/RuleForm';
import { AnyRule, RuleType } from '../../modules/rules/types/rule';
import AdminLayout from '../../components/layouts/AdminLayout';

export default function RulesAdminPage() {
    const router = useRouter();
    const [showForm, setShowForm] = useState<boolean>(false);

    const {
        rule,
        rules,
        loading,
        error,
        conflicts,
        setRule,
        saveRule,
        deleteRule,
        toggleStatus,
        fetchRules,
        createNewRule,
        checkConflicts
    } = useRule();

    // Gérer la sélection d'une règle pour l'édition
    const handleRuleSelect = (selectedRule: AnyRule) => {
        setRule(selectedRule);
        setShowForm(true);
    };

    // Gérer l'ajout d'une nouvelle règle
    const handleAddRule = (type: RuleType) => {
        createNewRule(type);
        setShowForm(true);
    };

    // Sauvegarder une règle
    const handleSaveRule = async (updatedRule: Partial<AnyRule>) => {
        try {
            // Vérifier les conflits avant de sauvegarder
            await checkConflicts();

            // Si des conflits bloquants sont détectés, confirmer avec l'utilisateur
            if (conflicts && conflicts.hasConflicts) {
                const hasHighSeverityConflicts = conflicts.conflicts.some(c => c.severity === 'HIGH');

                if (hasHighSeverityConflicts) {
                    const confirm = window.confirm(
                        "Des conflits importants ont été détectés. Êtes-vous sûr de vouloir enregistrer cette règle quand même?"
                    );
                    if (!confirm) return;
                }
            }

            // Sauvegarder la règle
            await saveRule();
            setShowForm(false);
            await fetchRules(); // Rafraîchir la liste
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde de la règle:', error instanceof Error ? error : new Error(String(error)));
        }
    };

    // Annuler le formulaire
    const handleCancelForm = () => {
        setRule(null);
        setShowForm(false);
    };

    // Gérer la suppression d'une règle
    const handleDeleteRule = async (ruleId: string) => {
        try {
            await deleteRule(ruleId);
            await fetchRules(); // Rafraîchir la liste
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression de la règle:', error instanceof Error ? error : new Error(String(error)));
        }
    };

    // Gérer l'activation/désactivation d'une règle
    const handleToggleRuleStatus = async (ruleId: string, isActive: boolean) => {
        try {
            await toggleStatus(ruleId, isActive);
            await fetchRules(); // Rafraîchir la liste
        } catch (error: unknown) {
            logger.error('Erreur lors du changement de statut de la règle:', error instanceof Error ? error : new Error(String(error)));
        }
    };

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Administration des règles de planning
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Gérez les règles qui définissent le fonctionnement du planning (gardes, consultations, supervisions, etc.)
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    {error.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {showForm ? (
                        <RuleForm
                            rule={rule || {}}
                            onSave={handleSaveRule}
                            onCancel={handleCancelForm}
                            loading={loading}
                            conflicts={conflicts}
                        />
                    ) : (
                        <RulesList
                            rules={rules}
                            loading={loading}
                            onRuleSelect={handleRuleSelect}
                            onRuleDelete={handleDeleteRule}
                            onRuleToggleStatus={handleToggleRuleStatus}
                            onAddNewRule={handleAddRule}
                            className="mb-6"
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Vérifier l'authentification et les permissions ici
    // Rediriger vers la page de connexion si non authentifié ou non autorisé
    // ...

    return {
        props: {}
    };
}; 