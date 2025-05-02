"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { templateService } from '../services/templateService';
import { PlanningTemplate, AffectationType } from '../types/template';
import { BlocPlanningTemplateEditor } from './BlocPlanningTemplateEditor';

// Importer les composants UI nécessaires
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
// Remplacement de LoadingSpinner par l'icône Loader2 de lucide-react
import { MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
    const [availableTypes, setAvailableTypes] = useState<AffectationType[]>([]);

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTemplates = await templateService.getTemplates();
            setTemplates(fetchedTemplates);
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Erreur lors du chargement des trames.");
            toast.error("Impossible de charger les trames.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAvailableTypes = useCallback(async () => {
        try {
            const types = await templateService.getAvailableAffectationTypes();
            setAvailableTypes(types);
        } catch (err) {
            console.error("Error fetching available types:", err);
            toast.error("Impossible de charger les types d'affectation.");
        }
    }, []);

    useEffect(() => {
        loadTemplates();
        loadAvailableTypes();
    }, [loadTemplates, loadAvailableTypes]);

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (template: PlanningTemplate) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleDuplicate = async (id: string) => {
        try {
            const templateToDuplicate = templates.find(template => template.id === id);
            if (!templateToDuplicate) {
                toast.error("Template non trouvé.");
                return;
            }

            // Créer un nouveau nom pour la copie
            const newName = `${templateToDuplicate.nom} (copie)`;

            // Ajouter indication visuelle du chargement
            toast.info("Duplication en cours...");

            const duplicatedTemplate = await templateService.duplicateTemplate(id);

            toast.success(`Trame "${duplicatedTemplate.nom}" dupliquée.`);
            loadTemplates();

            // Optionnel: Ouvrir l'éditeur avec la trame dupliquée
            if (confirm("Voulez-vous ouvrir la trame dupliquée pour l'éditer?")) {
                setEditingTemplate(duplicatedTemplate);
                setIsEditorOpen(true);
            }
        } catch (err) {
            console.error("Error duplicating template:", err);
            setError("Erreur lors de la duplication de la trame.");
            toast.error("Impossible de dupliquer la trame.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        // Demande de confirmation plus explicite
        toast.info(
            <div>
                <p className="font-bold mb-2">Confirmation de suppression</p>
                <p>Êtes-vous sûr de vouloir supprimer la trame "{name}" ?</p>
                <p className="text-sm text-gray-600 mt-1">Cette action est irréversible.</p>
                <div className="flex gap-2 mt-3">
                    <button
                        className="px-4 py-1 bg-red-600 text-white rounded"
                        onClick={async () => {
                            try {
                                await templateService.deleteTemplate(id);
                                toast.success(`Trame "${name}" supprimée.`);
                                loadTemplates();
                            } catch (err) {
                                console.error("Error deleting template:", err);
                                setError("Erreur lors de la suppression de la trame.");
                                toast.error("Impossible de supprimer la trame.");
                            }
                        }}
                    >
                        Supprimer
                    </button>
                    <button
                        className="px-4 py-1 bg-gray-200 rounded"
                        onClick={() => toast.dismiss()}
                    >
                        Annuler
                    </button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false }
        );
    };

    const handleSaveTemplate = async (templateToSave: PlanningTemplate) => {
        try {
            const saved = await templateService.saveTemplate(templateToSave);
            toast.success(`Trame "${saved.nom}" sauvegardée.`);
            setIsEditorOpen(false);
            setEditingTemplate(null);
            loadTemplates();
        } catch (err) {
            console.error("Error saving template:", err);
            toast.error("Impossible de sauvegarder la trame.");
        }
    };

    if (isLoading) {
        // Utilisation de Loader2 avec animation
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="mr-2 h-16 w-16 animate-spin" />
                Chargement des trames...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 p-4">{error} <Button onClick={loadTemplates}>Réessayer</Button></div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Gestion des Trames de Planning</h1>
                <Button onClick={handleCreateNew}>Créer une nouvelle trame</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Nb Affectations</TableHead>
                        <TableHead>Dernière Modif.</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Aucune trame trouvée.</TableCell>
                        </TableRow>
                    ) : (
                        templates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell className="font-medium">{template.nom}</TableCell>
                                <TableCell>{template.description || '-'}</TableCell>
                                <TableCell>{template.affectations.length}</TableCell>
                                <TableCell>{template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Ouvrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(template)}>Modifier</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>Dupliquer</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(template.id, template.nom)} className="text-red-600">Supprimer</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? `Modifier la trame : ${editingTemplate.nom}` : "Créer une nouvelle trame"}</DialogTitle>
                    </DialogHeader>

                    <BlocPlanningTemplateEditor
                        initialTemplate={editingTemplate ?? undefined}
                        availableAffectationTypes={availableTypes}
                        onSave={handleSaveTemplate}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}; 