"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { templateService, FullActivityType } from '../services/templateService';
import { PlanningTemplate, RoleType } from '../types/template';
import BlocPlanningTemplateEditor, { BlocPlanningTemplateEditorHandle } from './BlocPlanningTemplateEditor';
import { useRouter, usePathname } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importer les composants UI nécessaires
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
// Remplacement de LoadingSpinner par l'icône Loader2 de lucide-react
import { MoreHorizontal, Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import Input from "@/components/ui/input";
import { toast as hotToast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import SimpleDropdownMenu from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TemplateManagerProps {
    initialTemplatesParam?: PlanningTemplate[]; // Renommé pour éviter confusion avec l'état
    availableSitesParam: any[]; // Correction du type pour éviter l'erreur d'import
    availableActivityTypesParam: FullActivityType[];
    availableRolesParam: RoleType[];
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
    initialTemplatesParam = [],
    availableSitesParam,
    availableActivityTypesParam,
    availableRolesParam
}) => {
    console.log('[DEBUG TemplateManager] Component RENDERED with props');
    const { data: session } = useSession();
    const [templates, setTemplates] = useState<PlanningTemplate[]>(initialTemplatesParam);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
    const [editingTemplateRoles, setEditingTemplateRoles] = useState<RoleType[]>([RoleType.TOUS]);
    const [availableTypes, setAvailableTypes] = useState<FullActivityType[]>(availableActivityTypesParam);
    const [isMuiChildModalOpen, setIsMuiChildModalOpen] = useState<boolean>(false);
    const [saveProcessCompleted, setSaveProcessCompleted] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const isSavingRef = useRef(false);

    const editorRef = React.useRef<BlocPlanningTemplateEditorHandle>(null);
    const radixDialogContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const radixDialogPortalElement = radixDialogContentRef.current?.closest('div[role="dialog"][data-state="open"]');

        if (isMuiChildModalOpen) {
            console.log("[TemplateManager EFFECT] MUI child open, setting body.style.pointerEvents = ''");
            document.body.style.pointerEvents = '';

            if (radixDialogPortalElement) {
                console.log("[TemplateManager EFFECT] Setting aria-hidden=false on Radix dialog portal element.");
                radixDialogPortalElement.setAttribute('aria-hidden', 'false');
            } else {
                console.warn("[TemplateManager EFFECT] Could not find Radix dialog portal to set aria-hidden while MUI child is open.");
            }
        } else {
            console.log("[TemplateManager EFFECT] MUI child closed.");
            if (radixDialogPortalElement) {
                console.log("[TemplateManager EFFECT] Radix portal element found, letting Radix manage its aria-hidden state on MUI close.");
            }

            if (document.body.style.pointerEvents === '') {
                document.body.style.pointerEvents = 'auto';
                console.log("[TemplateManager EFFECT] Reset body.style.pointerEvents to 'auto'.");
            }
        }
    }, [isMuiChildModalOpen]);

    useEffect(() => {
        if (!isEditorOpen && isSavingRef.current && saveProcessCompleted) {
            console.log("[TemplateManager EFFECT] Save completed and modal closed, resetting isSavingRef.");
            isSavingRef.current = false;
            setSaveProcessCompleted(false);
        }
    }, [isEditorOpen, saveProcessCompleted]);

    const createOutsideInteractionHandler = useCallback((eventName: string) => (event: Event) => {
        if (isMuiChildModalOpen) {
            console.log(`[TemplateManager] ${eventName}: MUI child modal is open. Preventing Radix Dialog closure.`);
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const target = event.target as HTMLElement;
        console.log(`[TemplateManager] ${eventName} - target:`, target);

        if (target.closest('.MuiDialog-root') ||
            target.closest('.MuiMenu-list') ||
            target.closest('.MuiPopover-paper') ||
            target.closest('.MuiAutocomplete-popper')
        ) {
            console.log(`[TemplateManager] ${eventName}: Target is within an MUI component. Allowing event to propagate to MUI.`);
            return;
        }

        const isRadixElementOpen =
            document.querySelector('[data-state="open"][data-radix-select-content]') ||
            document.querySelector('[data-state="open"][data-radix-dropdown-menu-content]');

        if (isRadixElementOpen) {
            console.log(`[TemplateManager] ${eventName}: Radix select/dropdown is open. Preventing default to keep Radix Dialog open.`);
            event.preventDefault();
        }
    }, [isMuiChildModalOpen]);

    const handlePointerDownOutside = useMemo(() => createOutsideInteractionHandler('onPointerDownOutside'), [createOutsideInteractionHandler]);
    const handleFocusOutside = useMemo(() => createOutsideInteractionHandler('onFocusOutside'), [createOutsideInteractionHandler]);
    const handleInteractOutside = useMemo(() => createOutsideInteractionHandler('onInteractOutside'), [createOutsideInteractionHandler]);

    const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
        console.log('[TemplateManager] handleEscapeKeyDown');
        const hasOpenRadixSelect = document.querySelector('[data-state="open"][data-radix-select-content]');
        const hasOpenRadixDropdown = document.querySelector('[data-state="open"][data-radix-dropdown-menu-content]');

        if (hasOpenRadixSelect || hasOpenRadixDropdown) {
            console.log('[TemplateManager] Radix select/dropdown is open. Preventing default on escapeKeyDown to keep Radix Dialog open.');
            event.preventDefault();
        }
    }, []);

    const handleMuiModalOpenChange = useCallback((isOpen: boolean) => {
        console.log(`[TemplateManager] MUI child modal is now: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        setIsMuiChildModalOpen(isOpen);
    }, []);

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTemplatesSource = await templateService.getTemplates();

            const sanitizedNewTemplates = fetchedTemplatesSource.map(template => ({
                ...template,
                affectations: Array.isArray(template.affectations) ? template.affectations : [],
                variations: Array.isArray(template.variations) ? template.variations : [],
            }));

            setTemplates(prevTemplates => {
                if (JSON.stringify(prevTemplates) !== JSON.stringify(sanitizedNewTemplates)) {
                    return sanitizedNewTemplates;
                }
                return prevTemplates;
            });

        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Erreur lors du chargement des trames.");
            toast.error("Impossible de charger les trames.");
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setError, setTemplates]);

    const loadAvailableTypes = useCallback(async () => {
        try {
            const types = await templateService.getAvailableAffectationTypes();
            setAvailableTypes(types);
        } catch (err) {
            console.error("Error fetching available types:", err);
            toast.error("Impossible de charger les types d'affectation.");
        }
    }, [setAvailableTypes]);

    const handleEditorOpenChange = useCallback((openState: boolean) => {
        console.log(`%c[TemplateManager V3] Dialog onOpenChange. openState: ${openState}, current editingTemplate ID: ${editingTemplate?.id}, isSavingRef.current: ${isSavingRef.current}. Call stack:`, 'color: dodgerblue; font-weight: bold;', new Error().stack);

        if (!openState) {
            if (isSavingRef.current) {
                console.log("[TemplateManager] Closing dialog: save operation has initiated this.");
                setIsEditorOpen(false);
            } else if (editorRef.current?.isDirty()) {
                if (confirm("Vous avez des modifications non sauvegardées dans l'éditeur de trame. Êtes-vous sûr de vouloir fermer ?")) {
                    console.log("[TemplateManager] Closing dialog: user confirmed to close with unsaved changes.");
                    setIsEditorOpen(false);
                    setEditingTemplate(null);
                } else {
                    console.log("[TemplateManager] Closing dialog: user cancelled closing.");
                    return;
                }
            } else {
                console.log("[TemplateManager] Closing dialog: no specific unsaved changes condition met for prompt or no changes detected.");
                setIsEditorOpen(false);
                setEditingTemplate(null);
            }
        } else {
            console.log("[TemplateManager] Opening dialog.");
            setIsEditorOpen(true);
        }
    }, [editingTemplate, setIsEditorOpen, setEditingTemplate]);

    const handleCreateNew = useCallback(() => {
        console.log('[DEBUG TemplateManager] handleCreateNew called');
        setEditingTemplate(null);
        setEditingTemplateRoles([RoleType.TOUS]);
        setIsEditorOpen(true);
    }, []);

    const handleEdit = useCallback((template: PlanningTemplate) => {
        console.log('[DEBUG TemplateManager] handleEdit called for template:', template);
        setEditingTemplate(template);
        setEditingTemplateRoles(template.roles || [RoleType.TOUS]);
        setIsEditorOpen(true);
    }, []);

    const handleDuplicate = useCallback(async (id: string) => {
        console.log("[TemplateManager] handleDuplicate called for ID:", id);
        try {
            const templateToDuplicate = templates.find(template => template.id === id);
            if (!templateToDuplicate) {
                toast.error("Template non trouvé.");
                return;
            }

            toast.info("Duplication en cours...");

            const duplicatedTemplate = await templateService.duplicateTemplate(id, availableTypes);

            toast.success(`Trame "${duplicatedTemplate.nom}" dupliquée.`);
            loadTemplates();

            if (confirm("Voulez-vous ouvrir la trame dupliquée pour l'éditer?")) {
                setEditingTemplate(duplicatedTemplate);
                setIsEditorOpen(true);
            }
        } catch (err) {
            console.error("Error duplicating template:", err);
            setError("Erreur lors de la duplication de la trame.");
            toast.error("Impossible de dupliquer la trame.");
        }
    }, [templates, loadTemplates, availableTypes, setError]);

    const handleDelete = useCallback(async (id: string, name: string) => {
        console.log("[TemplateManager] handleDelete called for ID:", id, "Name:", name);

        const performDeleteAction = async (confirmationToastId: string | number) => {
            try {
                await templateService.deleteTemplate(id);
                toast.success(`Trame "${name}" supprimée.`);
                loadTemplates();
            } catch (err) {
                console.error("Error deleting template:", err);
                setError("Erreur lors de la suppression de la trame.");
                toast.error("Impossible de supprimer la trame.");
            } finally {
                toast.dismiss(confirmationToastId);
            }
        };

        const confirmationToastId = toast.info(
            ({ closeToast }) => (
                <div>
                    <p className="font-bold mb-2">Confirmation de suppression</p>
                    <p>Êtes-vous sûr de vouloir supprimer la trame "{name}" ?</p>
                    <p className="text-sm text-gray-600 mt-1">Cette action est irréversible.</p>
                    <div className="flex gap-2 mt-3">
                        <button
                            className="px-4 py-1 bg-red-600 text-white rounded"
                            onClick={() => performDeleteAction(confirmationToastId)}
                        >
                            Supprimer
                        </button>
                        <button
                            className="px-4 py-1 bg-gray-200 rounded"
                            onClick={() => toast.dismiss(confirmationToastId)}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            ),
            {
                autoClose: false,
                closeOnClick: false,
                toastId: `delete-confirmation-${id}`
            }
        );
    }, [loadTemplates, setError]);

    const handleSaveTemplate = useCallback(async (templateToSave: PlanningTemplate) => {
        setIsLoading(true);
        isSavingRef.current = true;
        setSaveProcessCompleted(false);
        try {
            const templateWithRoles = {
                ...templateToSave,
                roles: editingTemplateRoles,
                affectations: templateToSave.affectations || [],
                variations: templateToSave.variations || []
            };

            console.log(
                '[TemplateManager] Contenu de templateWithRoles AVANT appel à templateService.saveTemplate:',
                JSON.parse(JSON.stringify(templateWithRoles)),
                `Nombre d'affectations: ${templateWithRoles.affectations?.length || 0}`,
                'Affectations:',
                JSON.stringify(templateWithRoles.affectations, null, 2)
            );
            const saved = await templateService.saveTemplate(templateWithRoles, availableTypes);
            toast.success(`Trame "${saved.nom}" sauvegardée.`);
            setEditingTemplate(null);
            setIsEditorOpen(false);
            await loadTemplates();
            setSaveProcessCompleted(true);
        } catch (err: any) {
            console.error("Error saving template:", err);
            if (err instanceof Error && err.message && err.message.includes("Un modèle de trame avec ce nom existe déjà")) {
                toast.error(err.message);
            } else {
                toast.error("Impossible de sauvegarder la trame. Vérifiez la console pour plus de détails.");
            }
            isSavingRef.current = false;
            setSaveProcessCompleted(false);
        } finally {
            setIsLoading(false);
        }
    }, [editingTemplateRoles, loadTemplates, setIsLoading, setIsEditorOpen, setEditingTemplate, availableTypes]);

    useEffect(() => {
        loadTemplates();
        loadAvailableTypes();
    }, [loadTemplates, loadAvailableTypes]);

    useEffect(() => {
        if (isEditorOpen) {
            return;
        }
        if (templates.length > 0 && !editingTemplate) {
        }
        else if (templates.length === 0 && editingTemplate) {
            setEditingTemplate(null);
        }
    }, [templates, editingTemplate, isEditorOpen, setEditingTemplate]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadTemplates();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [loadTemplates]);

    const memoizedTemplates = useMemo(() => templates, [templates]);
    const memoizedAvailableTypes = useMemo(() => availableTypes, [availableTypes]);

    console.log('[TemplateManager RENDER] templates:', templates);
    if (templates.length === 0) {
        console.warn('[TemplateManager] Aucune trame reçue du service.');
    } else {
        templates.forEach((t, i) => {
            if (!t.nom) {
                console.warn(`[TemplateManager] Trame à l'index ${i} sans nom:`, t);
            }
        });
    }

    if (isLoading) {
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

    if (templates.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="text-orange-600 mb-4">Aucune trame disponible dans le système.</div>
                <p className="text-muted-foreground">Vous pouvez créer votre première trame dès maintenant.</p>
                <Button onClick={handleCreateNew} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" /> Créer une nouvelle trame
                </Button>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Gestion des Trames de Planning</h1>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={loadTemplates} className="px-4">Rafraîchir</Button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-6 flex items-center border">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                        <Plus className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-gray-700">
                        Pour créer une nouvelle trame, utilisez le bouton violet en bas à droite de l'écran.
                    </p>
                </div>

                <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-gray-50">
                            <TableHead className="py-4 font-semibold text-gray-700">Nom</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-700">Description</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-700">Type Semaine</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-700">Rôles</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Aucune trame trouvée.</TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template) => (
                                <TableRow key={template.id} className="hover:bg-gray-50 border-b">
                                    <TableCell className="font-medium py-4">{template.nom}</TableCell>
                                    <TableCell className="py-4">{template.description || '-'}</TableCell>
                                    <TableCell className="py-4">{template.typeSemaine || 'N/A'}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(template.roles && template.roles.length > 0 ? template.roles : [RoleType.TOUS]).map(role => (
                                                <span key={role} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-medium">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(template)}
                                                className="px-3"
                                            >
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDuplicate(String(template.id))}
                                                className="px-3"
                                            >
                                                Dupliquer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50 px-3"
                                                onClick={() => handleDelete(String(template.id), template.nom)}
                                            >
                                                Supprimer
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <Dialog modal={false} open={isEditorOpen} onOpenChange={handleEditorOpenChange}>
                    <DialogPortal>
                        <DialogOverlay />
                        <DialogContent
                            className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw] h-[90vh] flex flex-col p-0 gap-0"
                            onEscapeKeyDown={handleEscapeKeyDown}
                            onPointerDownOutside={handlePointerDownOutside}
                            onFocusOutside={handleFocusOutside}
                            onInteractOutside={handleInteractOutside}
                            ref={radixDialogContentRef}
                        >
                            <DialogHeader className="p-2">
                                <DialogTitle className="text-lg font-semibold">
                                    {editingTemplate ? "Modifier la Trame de Bloc" : "Créer une Nouvelle Trame de Bloc"}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    {editingTemplate ? "Modifiez les détails de la trame de bloc existante et ses affectations." : "Configurez les détails pour une nouvelle trame de bloc et ses affectations."}
                                </DialogDescription>
                            </DialogHeader>
                            {isEditorOpen && (
                                <div className="flex-grow overflow-y-auto w-full h-full" style={{ minHeight: "calc(90vh - 100px)" }}>
                                    <BlocPlanningTemplateEditor
                                        ref={editorRef}
                                        initialTemplate={editingTemplate || undefined}
                                        onSave={handleSaveTemplate}
                                        onCancel={() => handleEditorOpenChange(false)}
                                        availableAffectationTypes={memoizedAvailableTypes}
                                        templates={templates}
                                        onMuiModalOpenChange={handleMuiModalOpenChange}
                                    />
                                </div>
                            )}
                            {isEditorOpen && (
                                <div className="flex justify-end gap-2 p-4 border-t">
                                    <Button variant="outline" onClick={() => handleEditorOpenChange(false)}>
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (editorRef.current) {
                                                await editorRef.current.submit();
                                            }
                                        }}
                                    >
                                        Sauvegarder la Trame
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </DialogPortal>
                </Dialog>

                {/* Bouton flottant pour ajouter une nouvelle trame */}
                <div className="fixed bottom-6 right-6">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleCreateNew}
                                    size="lg"
                                    className="rounded-full shadow-lg h-16 w-16 p-0 bg-purple-600 hover:bg-purple-700 transition-all duration-200 ease-in-out hover:scale-105"
                                >
                                    <Plus className="h-8 w-8" />
                                    <span className="sr-only">Nouvelle trame</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Créer une nouvelle trame</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </DndProvider>
    );
};

export default TemplateManager; 