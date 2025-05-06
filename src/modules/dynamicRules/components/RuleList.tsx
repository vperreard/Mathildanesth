'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Supposer l'utilisation de react-query
import { Rule, RulePriority, RuleType } from '../types/rule';
import { fetchRules, deleteRule, RuleCreateData, RuleUpdateData, updateRule, createRule } from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Importer Badge
import { toast } from "sonner"; // Supposer l'utilisation de sonner pour les notifications
import { RuleForm } from './RuleForm';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';

// Clé pour les requêtes react-query
const RULES_QUERY_KEY = ['rules'];

export function RuleList() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    // --- Requêtes API avec React Query ---
    const { data: rules = [], isLoading, isError, error } = useQuery<Rule[], Error>({
        queryKey: RULES_QUERY_KEY,
        queryFn: fetchRules,
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY }); // Recharger la liste après succès
            setIsFormOpen(false); // Fermer le formulaire
            setSelectedRule(null);
            toast.success('Opération réussie !');
        },
        onError: (err: Error) => {
            toast.error(`Échec de l'opération: ${err.message}`);
        },
    };

    const createMutation = useMutation<Rule, Error, RuleCreateData>(
        { mutationFn: createRule, ...mutationOptions }
    );
    const updateMutation = useMutation<Rule, Error, { id: string; data: RuleUpdateData }>(
        { mutationFn: (vars) => updateRule(vars.id, vars.data), ...mutationOptions }
    );
    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: deleteRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
            toast.success('Règle supprimée avec succès.');
        },
        onError: (err: Error) => {
            toast.error(`Échec de la suppression: ${err.message}`);
        },
    });

    // --- Gestionnaires d'événements ---
    const handleAddClick = () => {
        setSelectedRule(null); // Assurer qu'aucune règle n'est sélectionnée pour la création
        setIsFormOpen(true);
    };

    const handleEditClick = (rule: Rule) => {
        setSelectedRule(rule);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (ruleId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
            deleteMutation.mutate(ruleId);
        }
    };

    const handleFormSubmit = async (data: RuleCreateData | RuleUpdateData) => {
        if (selectedRule && selectedRule.id) {
            // Mise à jour
            await updateMutation.mutateAsync({ id: selectedRule.id, data });
        } else {
            // Création
            await createMutation.mutateAsync(data as RuleCreateData);
        }
        // La fermeture et la notification sont gérées dans onSuccess de la mutation
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedRule(null);
    };

    // --- Rendu ---
    if (isLoading) {
        return <div>Chargement des règles...</div>;
    }

    if (isError) {
        return <div>Erreur lors du chargement des règles: {error?.message}</div>;
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Gestion des Règles Dynamiques</h1>
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une Règle
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length > 0 ? (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-xs">{rule.description || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{rule.type}</Badge>
                                    </TableCell>
                                    <TableCell>{RulePriority[rule.priority] || rule.priority}</TableCell>
                                    <TableCell>
                                        <Badge variant={rule.isActive ? "default" : "outline"}>
                                            {rule.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(rule)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modifier</span>
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(rule.id)} disabled={deleteMutation.isPending}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Supprimer</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Aucune règle définie pour le moment.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal Formulaire */}
            <RuleForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
                initialData={selectedRule}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
} 