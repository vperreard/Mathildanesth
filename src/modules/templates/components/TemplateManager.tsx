"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from "../../../lib/logger";
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
import { useSession } from '@/lib/auth/migration-shim-client';
import SimpleDropdownMenu from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Importer le modal de création de trameModele unifié
import dynamic from 'next/dynamic';

// Import dynamique du NewTrameModal pour éviter les problèmes SSR
const NewTrameModal = dynamic(() => import('@/components/trames/grid-view/NewTrameModal'), { ssr: false });

// Import du type TrameModele pour la conversion
import type { TrameModele } from '@/components/trames/grid-view/TrameGridView';

export interface TemplateManagerProps {
    initialTemplatesParam?: PlanningTemplate[]; // Renommé pour éviter confusion avec l'état
    availableSitesParam: unknown[]; // Correction du type pour éviter l'erreur d'import
    availableActivityTypesParam: FullActivityType[];
    availableRolesParam: RoleType[];
}

// Fonction de conversion PlanningTemplate vers TrameModele
const convertPlanningTemplateToTrameModele = (modèle: PlanningTemplate): TrameModele => {
    return {
        id: modèle.id?.toString() || '',
        name: modèle.nom || '',
        description: modèle.description || '',
        siteId: modèle.siteId || '', // Utiliser le vrai siteId au lieu de 'default'
        weekType: modèle.typeSemaine === 'PAIRES' ? 'EVEN' :
            modèle.typeSemaine === 'IMPAIRES' ? 'ODD' : 'ALL',
        activeDays: modèle.joursSemaineActifs || [1, 2, 3, 4, 5],
        effectiveStartDate: modèle.dateDebutEffet instanceof Date ? modèle.dateDebutEffet :
            modèle.dateDebutEffet ? new Date(modèle.dateDebutEffet) : new Date(),
        effectiveEndDate: modèle.dateFinEffet instanceof Date ? modèle.dateFinEffet :
            modèle.dateFinEffet ? new Date(modèle.dateFinEffet) : undefined,
        affectations: [] // Pour l'instant, on ne convertit pas les gardes/vacations complexes
    };
};

// Fonction de conversion TrameModele vers PlanningTemplate
const convertTrameModeleToPartialPlanningTemplate = (trameModele: TrameModele): Partial<PlanningTemplate> => {
    return {
        nom: trameModele.name,
        description: trameModele.description,
        typeSemaine: trameModele.weekType === 'EVEN' ? 'PAIRES' :
            trameModele.weekType === 'ODD' ? 'IMPAIRES' : 'TOUTES',
        joursSemaineActifs: trameModele.activeDays,
        dateDebutEffet: trameModele.effectiveStartDate,
        dateFinEffet: trameModele.effectiveEndDate
    };
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({
    initialTemplatesParam = [],
    availableSitesParam,
    availableActivityTypesParam,
    availableRolesParam
}) => {
    logger.info('[DEBUG TemplateManager] Component RENDERED with props');
    const { data: session } = useSession();
    const [modèles, setTemplates] = useState<PlanningTemplate[]>(initialTemplatesParam);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
    const [editingTemplateRoles, setEditingTemplateRoles] = useState<RoleType[]>([RoleType.TOUS]);
    const [availableTypes, setAvailableTypes] = useState<FullActivityType[]>(availableActivityTypesParam);
    const [isMuiChildModalOpen, setIsMuiChildModalOpen] = useState<boolean>(false);
    const [saveProcessCompleted, setSaveProcessCompleted] = useState<boolean>(false);

    // Nouveaux états pour le modal unifié
    const [isNewTrameModalOpen, setIsNewTrameModalOpen] = useState<boolean>(false);
    const [sites, setSites] = useState<Array<{ id: string; name: string; }>>([]);

    // États pour l'édition avec le nouveau modal
    const [isEditTrameModalOpen, setIsEditTrameModalOpen] = useState<boolean>(false);
    const [trameToEdit, setTrameToEdit] = useState<TrameModele | null>(null);

    const router = useRouter();
    const pathname = usePathname();

    const isSavingRef = useRef(false);

    const editorRef = React.useRef<BlocPlanningTemplateEditorHandle>(null);
    const radixDialogContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const radixDialogPortalElement = radixDialogContentRef.current?.closest('div[role="dialog"][data-state="open"]');

        if (isMuiChildModalOpen) {
            logger.info("[TemplateManager EFFECT] MUI child open, setting body.style.pointerEvents = ''");
            document.body.style.pointerEvents = '';

            if (radixDialogPortalElement) {
                logger.info("[TemplateManager EFFECT] Setting aria-hidden=false on Radix dialog portal element.");
                radixDialogPortalElement.setAttribute('aria-hidden', 'false');
            } else {
                logger.warn("[TemplateManager EFFECT] Could not find Radix dialog portal to set aria-hidden while MUI child is open.");
            }
        } else {
            logger.info("[TemplateManager EFFECT] MUI child closed.");
            if (radixDialogPortalElement) {
                logger.info("[TemplateManager EFFECT] Radix portal element found, letting Radix manage its aria-hidden state on MUI close.");
            }

            if (document.body.style.pointerEvents === '') {
                document.body.style.pointerEvents = 'auto';
                logger.info("[TemplateManager EFFECT] Reset body.style.pointerEvents to 'auto'.");
            }
        }
    }, [isMuiChildModalOpen]);

    useEffect(() => {
        if (!isEditorOpen && isSavingRef.current && saveProcessCompleted) {
            logger.info("[TemplateManager EFFECT] Save completed and modal closed, resetting isSavingRef.");
            isSavingRef.current = false;
            setSaveProcessCompleted(false);
        }
    }, [isEditorOpen, saveProcessCompleted]);

    const createOutsideInteractionHandler = useCallback((eventName: string) => (event: Event) => {
        if (isMuiChildModalOpen) {
            logger.info(`[TemplateManager] ${eventName}: MUI child modal is open. Preventing Radix Dialog closure.`);
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const target = event.target as HTMLElement;
        logger.info(`[TemplateManager] ${eventName} - target:`, target);

        if (target.closest('.MuiDialog-root') ||
            target.closest('.MuiMenu-list') ||
            target.closest('.MuiPopover-paper') ||
            target.closest('.MuiAutocomplete-popper')
        ) {
            logger.info(`[TemplateManager] ${eventName}: Target is within an MUI component. Allowing event to propagate to MUI.`);
            return;
        }

        const isRadixElementOpen =
            document.querySelector('[data-state="open"][data-radix-select-content]') ||
            document.querySelector('[data-state="open"][data-radix-dropdown-menu-content]');

        if (isRadixElementOpen) {
            logger.info(`[TemplateManager] ${eventName}: Radix select/dropdown is open. Preventing default to keep Radix Dialog open.`);
            event.preventDefault();
        }
    }, [isMuiChildModalOpen]);

    const handlePointerDownOutside = useMemo(() => createOutsideInteractionHandler('onPointerDownOutside'), [createOutsideInteractionHandler]);
    const handleFocusOutside = useMemo(() => createOutsideInteractionHandler('onFocusOutside'), [createOutsideInteractionHandler]);
    const handleInteractOutside = useMemo(() => createOutsideInteractionHandler('onInteractOutside'), [createOutsideInteractionHandler]);

    const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
        logger.info('[TemplateManager] handleEscapeKeyDown');
        const hasOpenRadixSelect = document.querySelector('[data-state="open"][data-radix-select-content]');
        const hasOpenRadixDropdown = document.querySelector('[data-state="open"][data-radix-dropdown-menu-content]');

        if (hasOpenRadixSelect || hasOpenRadixDropdown) {
            logger.info('[TemplateManager] Radix select/dropdown is open. Preventing default on escapeKeyDown to keep Radix Dialog open.');
            event.preventDefault();
        }
    }, []);

    const handleMuiModalOpenChange = useCallback((isOpen: boolean) => {
        logger.info(`[TemplateManager] MUI child modal is now: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        setIsMuiChildModalOpen(isOpen);
    }, []);

    const loadTemplates = useCallback(async () => {
        logger.info('🚀🚀🚀 [DEBUG TemplateManager] LOAD TEMPLATES CALLED!!!');
        setIsLoading(true);
        setError(null);
        try {
            logger.info('📡📡📡 [DEBUG TemplateManager] Loading modèles from templateService...');
            const fetchedTemplatesSource = await templateService.getTemplates();
            logger.info('📦📦📦 [DEBUG TemplateManager] Raw modèles from service:', fetchedTemplatesSource);

            const sanitizedNewTemplates = fetchedTemplatesSource.map(modèle => ({
                ...modèle,
                affectations: Array.isArray(modèle.affectations) ? modèle.affectations: [],
                variations: Array.isArray(modèle.variations) ? modèle.variations : [],
            }));

            logger.info('🧹🧹🧹 [DEBUG TemplateManager] Sanitized modèles:', sanitizedNewTemplates);

            setTemplates(prevTemplates => {
                logger.info('⚖️⚖️⚖️ [DEBUG TemplateManager] Previous modèles:', prevTemplates);
                logger.info('🆕🆕🆕 [DEBUG TemplateManager] New modèles:', sanitizedNewTemplates);

                if (JSON.stringify(prevTemplates) !== JSON.stringify(sanitizedNewTemplates)) {
                    logger.info('🔄🔄🔄 [DEBUG TemplateManager] Modèles changed, updating state');
                    return sanitizedNewTemplates;
                } else {
                    logger.info('🔒🔒🔒 [DEBUG TemplateManager] Modèles unchanged, keeping current state');
                    return prevTemplates;
                }
            });

        } catch (err: unknown) {
            logger.error("Error fetching modèles:", err);
            setError("Erreur lors du chargement des trameModeles.");
            toast.error("Impossible de charger les trameModeles.");
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setError, setTemplates]);

    const loadAvailableTypes = useCallback(async () => {
        try {
            const types = await templateService.getAvailableAffectationTypes();
            setAvailableTypes(types);
        } catch (err: unknown) {
            logger.error("Error fetching available types:", err);
            toast.error("Impossible de charger les types d'affectation.");
        }
    }, [setAvailableTypes]);

    const handleEditorOpenChange = useCallback((openState: boolean) => {
        logger.info(`%c[TemplateManager V3] Dialog onOpenChange. openState: ${openState}, current editingTemplate ID: ${editingTemplate?.id}, isSavingRef.current: ${isSavingRef.current}. Call stack:`, 'color: dodgerblue; font-weight: bold;', new Error().stack);

        if (!openState) {
            if (isSavingRef.current) {
                logger.info("[TemplateManager] Closing dialog: save operation has initiated this.");
                setIsEditorOpen(false);
            } else if (editorRef.current?.isDirty()) {
                if (confirm("Vous avez des modifications non sauvegardées dans l'éditeur de trameModele. Êtes-vous sûr de vouloir fermer ?")) {
                    logger.info("[TemplateManager] Closing dialog: user confirmed to close with unsaved changes.");
                    setIsEditorOpen(false);
                    setEditingTemplate(null);
                } else {
                    logger.info("[TemplateManager] Closing dialog: user cancelled closing.");
                    return;
                }
            } else {
                logger.info("[TemplateManager] Closing dialog: no specific unsaved changes condition met for prompt or no changes detected.");
                setIsEditorOpen(false);
                setEditingTemplate(null);
            }
        } else {
            logger.info("[TemplateManager] Opening dialog.");
            setIsEditorOpen(true);
        }
    }, [editingTemplate, setIsEditorOpen, setEditingTemplate]);

    const handleCreateNew = useCallback(() => {
        logger.info('[DEBUG TemplateManager] handleCreateNew called - Opening unified modal');
        setIsNewTrameModalOpen(true);
    }, []);

    const handleEdit = useCallback((modèle: PlanningTemplate) => {
        logger.info('[DEBUG TemplateManager] handleEdit called for modèle:', modèle);
        // Convertir le PlanningTemplate en TrameModele pour le nouveau modal
        const trameModele = convertPlanningTemplateToTrameModele(modèle);
        setTrameToEdit(trameModele);
        setIsEditTrameModalOpen(true);
    }, []);

    const handleDuplicate = useCallback(async (id: string) => {
        logger.info("[TemplateManager] handleDuplicate called for ID:", id);
        try {
            const templateToDuplicate = modèles.find(modèle => modèle.id === id);
            if (!templateToDuplicate) {
                toast.error("Modèle non trouvé.");
                return;
            }

            toast.info("Duplication en cours...");

            const duplicatedTemplate = await templateService.duplicateTemplate(id, availableTypes);

            toast.success(`Tableau de service "${duplicatedTemplate.nom}" dupliquée.`);
            loadTemplates();

            if (confirm("Voulez-vous ouvrir la trameModele dupliquée pour l'éditer?")) {
                setEditingTemplate(duplicatedTemplate);
                setIsEditorOpen(true);
            }
        } catch (err: unknown) {
            logger.error("Error duplicating modèle:", err);
            setError("Erreur lors de la duplication de la trameModele.");
            toast.error("Impossible de dupliquer la trameModele.");
        }
    }, [modèles, loadTemplates, availableTypes, setError]);

    const handleDelete = useCallback(async (id: string, name: string) => {
        logger.info("[TemplateManager] handleDelete called for ID:", id, "Name:", name);

        const performDeleteAction = async (confirmationToastId: string | number) => {
            try {
                await templateService.deleteTemplate(id);
                toast.success(`Tableau de service "${name}" supprimée.`);
                loadTemplates();
            } catch (err: unknown) {
                logger.error("Error deleting modèle:", err);
                setError("Erreur lors de la suppression de la trameModele.");
                toast.error("Impossible de supprimer la trameModele.");
            } finally {
                toast.dismiss(confirmationToastId);
            }
        };

        const confirmationToastId = toast.info(
            ({ closeToast }) => (
                <div>
                    <p className="font-bold mb-2">Confirmation de suppression</p>
                    <p>Êtes-vous sûr de vouloir supprimer la trameModele "{name}" ?</p>
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

            logger.info(
                '[TemplateManager] Contenu de templateWithRoles AVANT appel à templateService.saveTemplate:',
                JSON.parse(JSON.stringify(templateWithRoles)),
                `Nombre d'affectations: ${templateWithRoles.affectations?.length || 0}`,
                'Gardes/Vacations:',
                JSON.stringify(templateWithRoles.affectations, null, 2)
            );
            const saved = await templateService.saveTemplate(templateWithRoles, availableTypes);
            toast.success(`Tableau de service "${saved.nom}" sauvegardée.`);
            setEditingTemplate(null);
            setIsEditorOpen(false);
            await loadTemplates();
            setSaveProcessCompleted(true);
        } catch (err: unknown) {
            logger.error("Error saving modèle:", err);
            if (err instanceof Error && err.message && err.message.includes("Un modèle de trameModele avec ce nom existe déjà")) {
                toast.error(err.message);
            } else {
                toast.error("Impossible de sauvegarder la trameModele. Vérifiez la console pour plus de détails.");
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

    // Charger les sites au démarrage
    useEffect(() => {
        loadSites();
    }, []);

    // Fonction pour charger les sites
    const loadSites = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/sites');
            if (response.ok) {
                const sitesData = await response.json();
                setSites(sitesData);
            }
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des sites:', { error: err });
        }
    }, []);

    // Fonction pour gérer le succès de création de trameModele via le modal unifié
    const handleCreateTrameSuccess = useCallback((newTrameId: string) => {
        logger.info('[DEBUG TemplateManager] New trameModele created with ID:', newTrameId);
        setIsNewTrameModalOpen(false);
        loadTemplates(); // Recharger la liste des trameModeles
        toast.success('Nouvelle trameModele créée avec succès');
    }, [loadTemplates]);

    // Fonction pour gérer le succès d'édition de trameModele via le modal unifié
    const handleEditTrameSuccess = useCallback((updatedTrameId: string) => {
        logger.info('🎯🎯🎯 [DEBUG TemplateManager] EDIT SUCCESS CALLED!!! Tableau de service updated with ID:', updatedTrameId);
        setIsEditTrameModalOpen(false);
        setTrameToEdit(null);

        // Forcer un rechargement complet des modèles
        logger.info('🔄🔄🔄 [DEBUG TemplateManager] Forcing modèle reload after edit success...');
        loadTemplates().then(() => {
            logger.info('✅✅✅ [DEBUG TemplateManager] Modèles reloaded successfully after edit');
            toast.success('Tableau de service modifiée avec succès');
        }).catch((error) => {
            logger.error('❌❌❌ [DEBUG TemplateManager] Error reloading modèles after edit:', { error: error });
            toast.error('Tableau de service modifiée mais erreur lors du rechargement');
        });
    }, [loadTemplates]);

    useEffect(() => {
        if (isEditorOpen) {
            return;
        }
        if (modèles.length > 0 && !editingTemplate) {
        }
        else if (modèles.length === 0 && editingTemplate) {
            setEditingTemplate(null);
        }
    }, [modèles, editingTemplate, isEditorOpen, setEditingTemplate]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadTemplates();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [loadTemplates]);

    const memoizedTemplates = useMemo(() => modèles, [modèles]);
    const memoizedAvailableTypes = useMemo(() => availableTypes, [availableTypes]);

    logger.info('[TemplateManager RENDER] modèles:', modèles);
    if (modèles.length === 0) {
        logger.warn('[TemplateManager] Aucune trameModele reçue du service.');
    } else {
        modèles.forEach((t, i) => {
            if (!t.nom) {
                logger.warn(`[TemplateManager] Tableau de service à l'index ${i} sans nom:`, t);
            }
        });
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="mr-2 h-16 w-16 animate-spin" />
                Chargement des trameModeles...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 p-4">{error} <Button onClick={loadTemplates}>Réessayer</Button></div>;
    }

    if (modèles.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="text-orange-600 mb-4">Aucune trameModele disponible dans le système.</div>
                <p className="text-muted-foreground">Vous pouvez créer votre première trameModele dès maintenant.</p>
                <Button onClick={handleCreateNew} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" /> Créer une nouvelle trameModele
                </Button>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Gestion des Tableaux de service de Planning</h1>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={loadTemplates} className="px-4">Rafraîchir</Button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-6 flex items-center border">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                        <Plus className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-gray-700">
                        Pour créer une nouvelle trameModele, utilisez le bouton violet en bas à droite de l'écran. Le formulaire de création est maintenant unifié avec la vue grille.
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
                        {modèles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Aucune trameModele trouvée.</TableCell>
                            </TableRow>
                        ) : (
                            modèles.map((modèle) => (
                                <TableRow key={modèle.id} className="hover:bg-gray-50 border-b">
                                    <TableCell className="font-medium py-4">{modèle.nom}</TableCell>
                                    <TableCell className="py-4">{modèle.description || '-'}</TableCell>
                                    <TableCell className="py-4">{modèle.typeSemaine || 'N/A'}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(modèle.roles && modèle.roles.length > 0 ? modèle.roles : [RoleType.TOUS]).map(role => (
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
                                                onClick={() => handleEdit(modèle)}
                                                className="px-3"
                                            >
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDuplicate(String(modèle.id))}
                                                className="px-3"
                                            >
                                                Dupliquer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50 px-3"
                                                onClick={() => handleDelete(String(modèle.id), modèle.nom)}
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
                                    {editingTemplate ? "Modifier la Tableau de service de Bloc" : "Créer une Nouvelle Tableau de service de Bloc"}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    {editingTemplate ? "Modifiez les détails de la trameModele de bloc existante et ses gardes/vacations." : "Configurez les détails pour une nouvelle trameModele de bloc et ses gardes/vacations."}
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
                                        modèles={modèles}
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
                                        Sauvegarder la Tableau de service
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </DialogPortal>
                </Dialog>

                {/* Bouton flottant pour ajouter une nouvelle trameModele */}
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
                                    <span className="sr-only">Nouvelle trameModele</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Créer une nouvelle trameModele</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Modal de création de nouvelle trameModele unifié */}
                {isNewTrameModalOpen && (
                    <NewTrameModal
                        isOpen={isNewTrameModalOpen}
                        onClose={() => setIsNewTrameModalOpen(false)}
                        onSuccess={handleCreateTrameSuccess}
                        sites={sites}
                    />
                )}

                {/* Modal d'édition de trameModele unifié */}
                {isEditTrameModalOpen && trameToEdit && (
                    <NewTrameModal
                        isOpen={isEditTrameModalOpen}
                        onClose={() => {
                            setIsEditTrameModalOpen(false);
                            setTrameToEdit(null);
                        }}
                        onSuccess={handleEditTrameSuccess}
                        sites={sites}
                        initialTrame={trameToEdit}
                        isEditMode={true}
                    />
                )}
            </div>
        </DndProvider>
    );
};

export default TemplateManager; 