"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { templateService, FullActivityType } from '../services/templateService';
import { PlanningTemplate, RoleType } from '../types/template';
import BlocPlanningTemplateEditor from './BlocPlanningTemplateEditor';
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

// Interface pour exposer la méthode de sauvegarde du composant enfant
interface BlocPlanningTemplateEditorHandle {
    submit: () => Promise<void>;
    isDirty: () => boolean;
}

export const TemplateManager: React.FC = () => {
    console.log('[DEBUG TemplateManager] Component RENDERED - src/modules/templates/components/TemplateManager.tsx');
    const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
    const [editingTemplateRoles, setEditingTemplateRoles] = useState<RoleType[]>([RoleType.TOUS]);
    const [availableTypes, setAvailableTypes] = useState<FullActivityType[]>([]);
    const [isMuiChildModalOpen, setIsMuiChildModalOpen] = useState<boolean>(false);
    const [saveProcessCompleted, setSaveProcessCompleted] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const isSavingRef = useRef(false); // Ref pour l'état de sauvegarde

    // Ref pour appeler la méthode de sauvegarde de l'éditeur enfant
    const editorRef = React.useRef<BlocPlanningTemplateEditorHandle>(null);

    // Gérer pointer-events sur le body lorsque l'état de la modale MUI change
    useEffect(() => {
        if (isMuiChildModalOpen) {
            // Lorsque la modale MUI s'ouvre, s'assurer que le body autorise les pointer-events
            // Utilisation d'un setTimeout pour s'exécuter après les possibles modifications de Radix
            const timer = setTimeout(() => {
                console.log("[TemplateManager EFFECT] MUI child open, setting body.style.pointerEvents = ''");
                document.body.style.pointerEvents = '' // ou 'auto'
            }, 0);
            return () => {
                clearTimeout(timer);
                // Lorsque la modale MUI se ferme, Radix devrait reprendre la main.
                // Si la modale Radix principale est toujours ouverte, Radix pourrait remettre pointer-events: none sur le body.
                // Si la modale Radix principale est aussi fermée, alors le body devrait être 'auto'.
                // Laisser Radix gérer ou forcer 'auto' si on est sûr que tout est fermé.
                // Pour l'instant, on ne fait rien ici, en attendant de voir le comportement de Radix.
                console.log("[TemplateManager EFFECT] MUI child closed. Body pointer events will be managed by Radix or default.");
            };
        } else {
            // Si la modale MUI est fermée et que la modale Radix est potentiellement encore ouverte,
            // Radix devrait gérer les pointer-events du body.
            // Si on voulait être plus directif, on pourrait faire :
            // if (!isEditorOpen) document.body.style.pointerEvents = 'auto';
            // Mais il est préférable de laisser Radix gérer si possible.
            console.log("[TemplateManager EFFECT] MUI child closed, no specific body.style.pointerEvents override from here.");
        }
    }, [isMuiChildModalOpen]);

    // Effet pour réinitialiser isSavingRef après la fermeture de la modale post-sauvegarde
    useEffect(() => {
        if (!isEditorOpen && isSavingRef.current && saveProcessCompleted) {
            console.log("[TemplateManager EFFECT] Save completed and modal closed, resetting isSavingRef.");
            isSavingRef.current = false;
            setSaveProcessCompleted(false); // Réinitialiser le déclencheur de l'effet
        }
    }, [isEditorOpen, saveProcessCompleted]);

    const createOutsideInteractionHandler = useCallback((eventName: string) => (event: Event) => {
        // Si une modale MUI enfant est explicitement marquée comme ouverte,
        // on empêche toute interaction extérieure de fermer la modale Radix parente.
        // Cela donne la priorité à l'interaction avec la modale MUI.
        if (isMuiChildModalOpen) {
            console.log(`[TemplateManager] ${eventName}: MUI child modal is open. Preventing Radix Dialog closure.`);
            event.preventDefault(); // Empêche la fermeture de la modale Radix
            event.stopPropagation(); // Empêche d'autres listeners de réagir
            return;
        }

        const target = event.target as HTMLElement;
        console.log(`[TemplateManager] ${eventName} - target:`, target);

        // Si la cible est dans une modale MUI, un menu MUI, ou un popover MUI, ne rien faire.
        // Note: Cette partie devient moins critique si la vérification isMuiChildModalOpen ci-dessus fonctionne bien,
        // mais elle reste une bonne sécurité.
        if (target.closest('.MuiDialog-root') ||
            target.closest('.MuiMenu-list') ||
            target.closest('.MuiPopover-paper') ||
            target.closest('.MuiAutocomplete-popper')
        ) {
            console.log(`[TemplateManager] ${eventName}: Target is within an MUI component. Allowing event to propagate to MUI.`);
            // On ne fait pas event.preventDefault() ici pour que MUI puisse gérer l'événement.
            // Cependant, si Radix doit rester ouvert, il faudrait aussi un preventDefault() ici.
            // La logique avec isMuiChildModalOpen est plus robuste.
            return;
        }

        // Si un select Radix (ShadCN) ou un DropdownMenu Radix est ouvert à l'intérieur de cette Dialog Radix
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
    // onInteractOutside est souvent redondant si onPointerDownOutside est géré, mais on le garde pour couvrir tous les cas.
    const handleInteractOutside = useMemo(() => createOutsideInteractionHandler('onInteractOutside'), [createOutsideInteractionHandler]);

    const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
        console.log('[TemplateManager] handleEscapeKeyDown');
        // Si un Select Radix (ShadCN) ou un DropdownMenu Radix est ouvert à l'intérieur de cette Dialog Radix,
        // empêcher Escape de fermer la Dialog Radix principale. L'Escape devrait fermer le select/dropdown interne.
        const hasOpenRadixSelect = document.querySelector('[data-state="open"][data-radix-select-content]');
        const hasOpenRadixDropdown = document.querySelector('[data-state="open"][data-radix-dropdown-menu-content]');

        if (hasOpenRadixSelect || hasOpenRadixDropdown) {
            console.log('[TemplateManager] Radix select/dropdown is open. Preventing default on escapeKeyDown to keep Radix Dialog open.');
            event.preventDefault();
        }
        // Sinon, laisser Escape fermer la Dialog Radix principale (comportement par défaut de Radix Dialog).
    }, []);

    // Callback pour gérer l'état d'ouverture des modales MUI enfants
    const handleMuiModalOpenChange = useCallback((isOpen: boolean) => {
        console.log(`[TemplateManager] MUI child modal is now: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        setIsMuiChildModalOpen(isOpen);
    }, []);

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTemplatesSource = await templateService.getTemplates();

            // Sanitize templates (ensure affectations and variations are arrays)
            const sanitizedNewTemplates = fetchedTemplatesSource.map(template => ({
                ...template,
                affectations: Array.isArray(template.affectations) ? template.affectations : [],
                variations: Array.isArray(template.variations) ? template.variations : [],
            }));

            // Only update state if the templates have actually changed
            // Cette comparaison est basique et peut être améliorée si nécessaire (ex: deep-diff)
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
        // S'assurer que le log est bien celui-ci pour vérifier la valeur de isSavingRef.current
        console.log(`%c[TemplateManager V3] Dialog onOpenChange. openState: ${openState}, current editingTemplate ID: ${editingTemplate?.id}, isSavingRef.current: ${isSavingRef.current}. Call stack:`, 'color: dodgerblue; font-weight: bold;', new Error().stack);

        if (!openState) { // Si on tente de fermer
            if (isSavingRef.current) {
                // Fermeture due à une sauvegarde. `editingTemplate` a déjà été mis à null par handleSaveTemplate.
                // `isSavingRef` sera remis à `false` par l'useEffect après fermeture effective.
                console.log("[TemplateManager] Closing dialog: save operation has initiated this.");
                setIsEditorOpen(false);
            } else if (editorRef.current?.isDirty()) { // MODIFIÉ: Utiliser isDirty de l'éditeur
                if (confirm("Vous avez des modifications non sauvegardées dans l'éditeur de trame. Êtes-vous sûr de vouloir fermer ?")) {
                    console.log("[TemplateManager] Closing dialog: user confirmed to close with unsaved changes.");
                    setIsEditorOpen(false);
                    setEditingTemplate(null); // Réinitialiser pour la prochaine ouverture
                } else {
                    // L'utilisateur a annulé, on ne fait rien (Radix ne fermera pas si l'état open n'est pas mis à false)
                    console.log("[TemplateManager] Closing dialog: user cancelled closing.");
                    return;
                }
            } else {
                // Fermeture normale (nouvelle trame non encore sauvegardée, ou pas de `editingTemplate`, ou pas de modifs)
                console.log("[TemplateManager] Closing dialog: no specific unsaved changes condition met for prompt or no changes detected.");
                setIsEditorOpen(false);
                setEditingTemplate(null); // Réinitialiser pour la prochaine ouverture
            }
        } else { // Si on ouvre
            console.log("[TemplateManager] Opening dialog.");
            setIsEditorOpen(true);
            // Ne pas toucher à editingTemplate ici, il est défini par handleCreateNew ou handleEdit
        }
    }, [editingTemplate, setIsEditorOpen, setEditingTemplate]); // editingTemplate, isSavingRef (implicite via current) et editorRef (implicite via current) sont utilisés.

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

        // Fonction pour effectuer la suppression et fermer le toast de confirmation
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
                toast.dismiss(confirmationToastId); // Fermer le toast de confirmation
            }
        };

        // Afficher le toast de confirmation
        const confirmationToastId = toast.info(
            ({ closeToast }) => ( // closeToast est injecté par react-toastify
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
                            onClick={() => toast.dismiss(confirmationToastId)} // Utiliser aussi l'ID ici pour la robustesse
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            ),
            {
                autoClose: false,
                closeOnClick: false,
                toastId: `delete-confirmation-${id}` // Optionnel: donner un ID unique pour éviter les doublons si cliqué rapidement
            }
        );
    }, [loadTemplates, setError]); // Ajout de setError aux dépendances si utilisé dans le catch

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

    // useEffect après tous les useCallback
    useEffect(() => {
        loadTemplates();
        loadAvailableTypes();
    }, [loadTemplates, loadAvailableTypes]);

    // Sélection automatique de la première trame si aucune sélection et si la liste n'est pas vide
    useEffect(() => {
        if (isEditorOpen) { // Ne pas interférer si l'éditeur est actif
            return;
        }
        if (templates.length > 0 && !editingTemplate) {
            // setEditingTemplate(templates[0]);
        }
        else if (templates.length === 0 && editingTemplate) {
            setEditingTemplate(null);
        }
    }, [templates, editingTemplate, isEditorOpen, setEditingTemplate]);

    // Recharger les trames à chaque fois que la fenêtre redevient active
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadTemplates();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [loadTemplates]);

    // Ajout de useMemo pour stabiliser la référence de `templates` passée à l'éditeur
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

    if (templates.length === 0) {
        return <div className="text-orange-600 p-4">Aucune trame reçue du service. Vérifiez le mapping ou la réponse API.</div>;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Gestion des Trames de Planning</h1>
                    <div className="flex gap-2">
                        <Button onClick={handleCreateNew}>Créer une nouvelle trame</Button>
                        <Button variant="outline" onClick={loadTemplates}>Rafraîchir</Button>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type Semaine</TableHead>
                            <TableHead>Rôles</TableHead>
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
                                    <TableCell>{template.typeSemaine || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(template.roles && template.roles.length > 0 ? template.roles : [RoleType.TOUS]).map(role => (
                                                <span key={role} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
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
                                                <DropdownMenuItem onClick={() => handleDuplicate(String(template.id))}>Dupliquer</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(String(template.id), template.nom)} className="text-red-600">Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <Dialog modal={false} open={isEditorOpen} onOpenChange={handleEditorOpenChange}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateNew} className="mb-4">
                            <Plus className="mr-2 h-4 w-4" /> Nouvelle Trame de Bloc
                        </Button>
                    </DialogTrigger>
                    <DialogPortal>
                        <DialogOverlay style={{ pointerEvents: isMuiChildModalOpen ? 'none' : 'auto' }} />
                        <DialogContent
                            className="w-[90vw] h-[90vh] max-w-[1800px] sm:w-[90vw] sm:max-w-[1800px] md:w-[90vw] md:max-w-[1800px] lg:w-[90vw] lg:max-w-[1800px] xl:w-[90vw] xl:max-w-[1800px] flex flex-col p-4"
                            onEscapeKeyDown={handleEscapeKeyDown}
                            onPointerDownOutside={handlePointerDownOutside}
                            onFocusOutside={handleFocusOutside}
                            onInteractOutside={handleInteractOutside}
                            style={isMuiChildModalOpen ? { pointerEvents: 'auto' } : {}}
                        >
                            <DialogHeader className="p-2">
                                <DialogTitle className="text-lg">{editingTemplate ? "Modifier la Trame de Bloc" : "Créer une Nouvelle Trame de Bloc"}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    {editingTemplate ? "Modifiez les détails de la trame de bloc existante et ses affectations." : "Configurez les détails pour une nouvelle trame de bloc et ses affectations."}
                                </DialogDescription>
                            </DialogHeader>
                            {isEditorOpen && (
                                <div className="flex-grow overflow-y-auto w-full h-full" style={{ minHeight: "calc(90vh - 100px)" }}> {/* Ajustement pour le footer */}
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
                            {/* Pied de page de la modale avec les boutons Sauvegarder et Annuler */}
                            {isEditorOpen && (
                                <div className="flex justify-end gap-2 p-4 border-t">
                                    <Button variant="outline" onClick={() => handleEditorOpenChange(false)}>
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (editorRef.current) {
                                                // La validation et la sauvegarde réelle se font DANS BlocPlanningTemplateEditor via sa prop onSave
                                                // Ici, on déclenche juste la soumission qui mènera à l'appel de props.onSave
                                                await editorRef.current.submit();
                                                // handleSaveTemplate (de TemplateManager) sera appelé par BlocPlanningTemplateEditor via la prop onSave
                                                // La fermeture de la modale est gérée dans handleSaveTemplate de TemplateManager
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
            </div>
        </DndProvider>
    );
};

export default TemplateManager; 