"use client";

import { DragDropContext } from '@hello-pangea/dnd';
import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import {
    Plus, Trash2, Edit, Calendar, MapPin, Tag, User, Save, X,
    Clock, Info, ArrowRight, CheckCircle2, XCircle, Bell, AlertTriangle, Loader2,
    ExternalLink, Link, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { ActivityType, ActivityCategory, Period, Prisma } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_ACTIVITY_TYPES: ActivityType[] = [
    {
        id: "mock-uuid-1",
        name: "Garde Mock",
        code: "GARDE_MOCK",
        description: "Garde mockée pour démo",
        category: ActivityCategory.GARDE,
        color: "#FF5733",
        icon: "Moon",
        isActive: true,
        defaultDurationHours: 12,
        defaultPeriod: Period.JOURNEE_ENTIERE,
        createdAt: new Date(),
        updatedAt: new Date(),
        siteId: null,
    },
    {
        id: "mock-uuid-2",
        name: "Astreinte Mock",
        code: "ASTREINTE_MOCK",
        description: "Astreinte mockée pour démo",
        category: ActivityCategory.ASTREINTE,
        color: "#33CFFF",
        icon: "Phone",
        isActive: false,
        defaultDurationHours: 24,
        defaultPeriod: Period.JOURNEE_ENTIERE,
        createdAt: new Date(),
        updatedAt: new Date(),
        siteId: null,
    },
];

interface AssignmentsConfigPanelProps {
    // ...
}

const AssignmentsConfigPanel: React.FC<AssignmentsConfigPanelProps> = ({ /* ... */ }) => {
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [formData, setFormData] = useState<Partial<ActivityType>>({
        name: '',
        code: '',
        description: '',
        category: ActivityCategory.AUTRE,
        color: '#FFFFFF',
        icon: '',
        isActive: true,
        defaultDurationHours: null,
        defaultPeriod: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteErrorModalOpen, setIsDeleteErrorModalOpen] = useState(false);
    const [deleteErrorDetails, setDeleteErrorDetails] = useState<{
        activityName?: string;
        trames: Array<{ id: number, name: string }>;
        errorMessage?: string;
    }>({});

    const fetchActivityTypes = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            if (!isAuthLoading && !isAuthenticated) {
                setError("Vous devez être connecté pour charger les types d'activités. Utilisation des données mockées.");
                setActivityTypes(MOCK_ACTIVITY_TYPES);
                setIsLoadingData(false);
                return;
            }
            if (!isAuthLoading && isAuthenticated) {
                const response = await axios.get<ActivityType[]>('/api/activity-types');
                setActivityTypes(response.data);
            } else if (isAuthLoading) {
                logger.info("Auth en cours de chargement, attente avant de fetcher les types d'activité.");
                return;
            }
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des types d'activité:", err);
            setError(`Impossible de charger les types d'activité: ${err.message}. Utilisation des données mockées.`);
            setActivityTypes(MOCK_ACTIVITY_TYPES);
        } finally {
            setIsLoadingData(false);
        }
    }, [isAuthenticated, isAuthLoading]);

    useEffect(() => {
        fetchActivityTypes();
    }, [fetchActivityTypes]);

    const handleFormChange = (field: keyof Partial<ActivityType>, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field: keyof Partial<ActivityType>, checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const openNewForm = () => {
        setCurrentActivityType(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            category: ActivityCategory.AUTRE,
            color: '#FFFFFF',
            icon: '',
            isActive: true,
            defaultDurationHours: null,
            defaultPeriod: null,
        });
        setIsModalOpen(true);
    };

    const openEditForm = (type: ActivityType) => {
        setCurrentActivityType(type);
        setFormData({
            name: type.name,
            code: type.code,
            description: type.description || '',
            category: type.category,
            color: type.color || '#FFFFFF',
            icon: type.icon || '',
            isActive: type.isActive,
            defaultDurationHours: type.defaultDurationHours || null,
            defaultPeriod: type.defaultPeriod || null,
        });
        setIsModalOpen(true);
    };

    const resetFormAndCloseModal = () => {
        setIsModalOpen(false);
        setCurrentActivityType(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        logger.info("[AssignmentsConfigPanel] handleSubmit triggered.");
        setError(null);

        if (isAuthLoading || !isAuthenticated) {
            toast.error("Vous devez être authentifié.");
            logger.warn("[AssignmentsConfigPanel] handleSubmit aborted: User not authenticated.");
            return;
        }

        const dataToSubmit: Partial<Omit<ActivityType, 'id' | 'createdAt' | 'updatedAt' | 'sites'>> = {
            name: formData.name || undefined,
            code: formData.code || undefined,
            description: formData.description || null,
            category: formData.category || ActivityCategory.AUTRE,
            color: formData.color || null,
            icon: formData.icon || null,
            isActive: formData.isActive === undefined ? true : formData.isActive,
            defaultDurationHours: formData.defaultDurationHours ? parseFloat(String(formData.defaultDurationHours)) : null,
            defaultPeriod: formData.defaultPeriod || null,
        };

        logger.info("[AssignmentsConfigPanel] Raw dataToSubmit before cleaning:", JSON.parse(JSON.stringify(dataToSubmit)));

        Object.keys(dataToSubmit).forEach(key => {
            const K = key as keyof typeof dataToSubmit;
            if (dataToSubmit[K] === undefined) {
                delete dataToSubmit[K];
            }
        });

        logger.info("[AssignmentsConfigPanel] Cleaned dataToSubmit:", JSON.parse(JSON.stringify(dataToSubmit)));

        const url = currentActivityType
            ? `/api/activity-types/${currentActivityType.id}`
            : '/api/activity-types';
        const method = currentActivityType ? 'PUT' : 'POST';

        logger.info(`[AssignmentsConfigPanel] Method: ${method}, URL: ${url}`);

        try {
            let response;
            if (method === 'PUT') {
                logger.info("[AssignmentsConfigPanel] PRE-AWAIT axios.put...");
                response = await axios.put(url, dataToSubmit);
                logger.info("[AssignmentsConfigPanel] POST-AWAIT axios.put. Response received (or error if it threw).");
                logger.info("[AssignmentsConfigPanel] axios.put response:", response);
                toast.success('Type d\'activité modifié avec succès');
            } else {
                logger.info("[AssignmentsConfigPanel] PRE-AWAIT axios.post...");
                response = await axios.post(url, dataToSubmit);
                logger.info("[AssignmentsConfigPanel] POST-AWAIT axios.post. Response received (or error if it threw).");
                logger.info("[AssignmentsConfigPanel] axios.post response:", response);
                toast.success('Type d\'activité ajouté avec succès');
            }
            resetFormAndCloseModal();
            await fetchActivityTypes();
        } catch (err: unknown) {
            logger.error("[AssignmentsConfigPanel] Error during submission (handleSubmit):", err);
            if (err.response) {
                logger.error('[AssignmentsConfigPanel] Error response data (handleSubmit):', err.response.data);
                logger.error('[AssignmentsConfigPanel] Error response status (handleSubmit):', err.response.status);
                logger.error('[AssignmentsConfigPanel] Error response headers (handleSubmit):', err.response.headers);
            } else if (err.request) {
                logger.error('[AssignmentsConfigPanel] Error request data (handleSubmit):', err.request);
            } else {
                logger.error('[AssignmentsConfigPanel] Error message (handleSubmit):', err.message);
            }
            const errorMessage = err.response?.data?.error || err.message || 'Une erreur est survenue.';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);
        }
    };

    const handleDelete = async (activityTypeId: string) => {
        setIsDeleting(true);
        logger.info('[AssignmentsConfigPanel] Attempting to delete activity type with ID:', activityTypeId);

        const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer ce type d'activité ?`);
        if (!confirmed) {
            setIsDeleting(false);
            return;
        }

        logger.info('[AssignmentsConfigPanel] User confirmed deletion for ID:', activityTypeId);
        try {
            logger.info('[AssignmentsConfigPanel] Calling axios.delete for', `/api/activity-types/${activityTypeId}`);
            const response = await axios.delete(`http://localhost:3000/api/activity-types/${activityTypeId}`);
            logger.info('[AssignmentsConfigPanel] axios.delete response:', response);

            // Mettre à jour la liste après la suppression
            fetchActivityTypes();
            toast.success("Type d'activité supprimé avec succès");
        } catch (error: unknown) {
            logger.error('[AssignmentsConfigPanel] Error during deletion:', { error: error });

            if (error.response) {
                logger.info('[AssignmentsConfigPanel] Error response data:', error.response.data);
                logger.info('[AssignmentsConfigPanel] Error response status:', error.response.status);
                logger.info('[AssignmentsConfigPanel] Error response headers:', error.response.headers);

                if (error.response.status === 409) {
                    // Erreur de conflit - le type d'activité est utilisé ailleurs
                    const details = error.response.data.details;
                    const activityType = activityTypes.find(type => type.id === activityTypeId);

                    // Préparer les détails pour la boîte de dialogue modale
                    setDeleteErrorDetails({
                        activityName: activityType?.name || 'Ce type d\'activité',
                        trames: details?.trames || [],
                        errorMessage: error.response.data.error
                    });

                    // Ouvrir la boîte de dialogue modale au lieu d'afficher un toast
                    setIsDeleteErrorModalOpen(true);
                } else {
                    toast.error(`Erreur lors de la suppression: ${error.response.data.error || "Erreur inconnue"}`);
                }
            } else {
                toast.error("Une erreur est survenue lors de la suppression");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // TODO: Migrate useDrag to @hello-pangea/dnd
    // const [{ isDragging }, drag] = useDrag(() => ({
    //     type: 'ASSIGNMENT_TYPE',
    //     collect: (monitor) => ({
    //         isDragging: monitor.isDragging(),
    //     }),
    // }));

    if (isLoadingData && isAuthLoading) {
        return <div className="p-4">Chargement initial...</div>;
    }

    return (
        <DragDropContext onDragEnd={() => {}}>
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Configuration des Types d'Activité</h2>
                    {isAuthenticated && <Button onClick={openNewForm}><Plus className="mr-2" /> Ajouter un type</Button>}
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-start">
                        <Info className="text-blue-500 w-6 h-6 mt-1 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-gray-800 mb-2">Guide des types d'activité</h3>
                            <p className="text-gray-600 mb-3">
                                Les types d'activité définissent les différentes affectations possibles dans le planning.
                                Configurez-les correctement pour faciliter la planification.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <h4 className="font-medium text-gray-700 mb-1">Bloc Opératoire</h4>
                                    <p className="text-sm text-gray-600">
                                        Définit les activités réalisées au bloc opératoire. Peut être configuré pour une journée entière ou par demi-journée selon les pratiques.
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <h4 className="font-medium text-gray-700 mb-1">Consultations</h4>
                                    <p className="text-sm text-gray-600">
                                        Pour les slots de consultation. Généralement configurés par demi-journée (MATIN ou APRES_MIDI) selon le planning des médecins.
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <h4 className="font-medium text-gray-700 mb-1">Gardes et Astreintes</h4>
                                    <p className="text-sm text-gray-600">
                                        Pour les périodes de garde ou d'astreinte. Généralement configurés sur la journée entière (JOURNEE_ENTIERE) ou sur 24h.
                                    </p>
                                </div>
                            </div>

                            <details className="text-sm">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                    En savoir plus sur l'utilisation des types d'activité
                                </summary>
                                <div className="mt-2 pl-2 border-l-2 border-blue-200">
                                    <p className="mb-2 text-gray-600">
                                        Les types d'activité sont utilisés dans les trameModeles et les plannings pour définir les affectations possibles.
                                        Chaque type d'activité peut avoir sa propre période par défaut et sa durée.
                                    </p>
                                    <p className="mb-2 text-gray-600">
                                        <strong>Pour le bloc opératoire :</strong> Vous pouvez définir des types spécifiques par spécialité ou par salle.
                                    </p>
                                    <p className="mb-2 text-gray-600">
                                        <strong>Pour les consultations :</strong> Vous pouvez créer des types par spécialité ou par médecin.
                                    </p>
                                    <p className="text-gray-600">
                                        Dans les trameModeles, vous pourrez ensuite associer les types d'activité aux périodes de la journée correspondantes.
                                    </p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {!isAuthenticated && !isAuthLoading && (
                    <div className="text-red-500 bg-red-100 p-4 rounded-md">
                        Vous devez être connecté pour gérer les types d'activités.
                        {error && <div>Détail: {error}</div>}
                    </div>
                )}

                {isAuthenticated && error && !activityTypes.length && (
                    <div className="text-red-500 bg-red-100 p-4 rounded-md">Erreur: {error}</div>
                )}

                {isAuthenticated && !isLoadingData && activityTypes.length === 0 && !error && (
                    <p>Aucun type d'activité trouvé.</p>
                )}

                {isAuthenticated && activityTypes.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Types d'activité disponibles</h3>
                            <div className="flex gap-2">
                                {/* Ici on pourrait ajouter un filtre par catégorie */}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activityTypes.map((type) => (
                                <div
                                    key={type.id}
                                    className={`
                                        bg-white border rounded-lg shadow-sm overflow-hidden
                                        transition-all duration-200 hover:shadow
                                        ${!type.isActive ? 'opacity-70' : ''}
                                    `}
                                >
                                    <div
                                        className="h-2"
                                        style={{ backgroundColor: type.color || '#CCCCCC' }}
                                    ></div>

                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-medium text-gray-800">{type.name}</h4>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 mr-2">{type.code}</span>
                                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{type.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => openEditForm(type)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(type.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {type.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{type.description}</p>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center">
                                                <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                                                <span className="text-gray-600">
                                                    {type.defaultDurationHours ? `${type.defaultDurationHours}h` : 'Durée non définie'}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                                                <span className="text-gray-600">
                                                    {type.defaultPeriod || 'Période non définie'}
                                                </span>
                                            </div>
                                        </div>

                                        {!type.isActive && (
                                            <div className="mt-3 flex items-center text-orange-500 text-xs">
                                                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                                <span>Type d'activité inactif</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isModalOpen && (
                    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetFormAndCloseModal(); else setIsModalOpen(true); }}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{currentActivityType ? "Modifier le Type d'Activité" : "Ajouter un Type d'Activité"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="px-2 py-4 max-h-[70vh] overflow-y-auto space-y-4">
                                    <div>
                                        <Label htmlFor="name">Nom</Label>
                                        <Input id="name" name="name" value={formData.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="code">Code</Label>
                                        <Input id="code" name="code" value={formData.code || ''} onChange={(e) => handleFormChange('code', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input id="description" name="description" value={formData.description || ''} onChange={(e) => handleFormChange('description', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Catégorie d'activité</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                            {Object.values(ActivityCategory).map(cat => (
                                                <div
                                                    key={cat}
                                                    className={`
                                                        border rounded-md p-3 cursor-pointer transition-colors
                                                        ${formData.category === cat
                                                            ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }
                                                    `}
                                                    onClick={() => handleFormChange('category', cat)}
                                                >
                                                    <div className="font-medium">{cat}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {cat === 'BLOC_OPERATOIRE' && "Activités chirurgicales en salle d'opération"}
                                                        {cat === 'CONSULTATION' && "Consultations avec les patients"}
                                                        {cat === 'GARDE' && "Services de garde (jour, nuit, weekend)"}
                                                        {cat === 'ASTREINTE' && "Astreintes (disponibilité à distance)"}
                                                        {cat === 'REUNION' && "Réunions, staff ou concertation"}
                                                        {cat === 'FORMATION' && "Formations, enseignement, congrès"}
                                                        {cat === 'ADMINISTRATIF' && "Tâches administratives"}
                                                        {cat === 'AUTRE' && "Autres types d'activités"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="color">Couleur</Label>
                                        <Input id="color" name="color" type="color" value={formData.color || '#FFFFFF'} onChange={(e) => handleFormChange('color', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="icon">Icône (nom)</Label>
                                        <Input id="icon" name="icon" value={formData.icon || ''} onChange={(e) => handleFormChange('icon', e.target.value)} />
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                                        <h3 className="text-md font-semibold text-blue-800 flex items-center mb-2">
                                            <Info className="w-5 h-5 mr-2" />
                                            Guide des périodes et durées
                                        </h3>
                                        <p className="text-sm text-blue-700 mb-2">
                                            La configuration des périodes et durées varie selon le type d'activité :
                                        </p>
                                        <ul className="space-y-2 text-sm text-blue-700 pl-6 list-disc">
                                            <li><span className="font-semibold">Consultations</span> : Choisissez MATIN ou APRES_MIDI pour créer des slots spécifiques sur la trameModele.</li>
                                            <li><span className="font-semibold">Bloc Opératoire</span> : Utilisez JOURNEE_ENTIERE pour un chirurgien opérant toute la journée ou MATIN/APRES_MIDI pour des slots distincts.</li>
                                            <li><span className="font-semibold">Gardes et Astreintes</span> : Utilisez JOURNEE_ENTIERE, ces activités durent généralement 24h avec relève le lendemain.</li>
                                        </ul>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="defaultPeriod" className="flex items-center justify-between">
                                                <span>Période par défaut</span>
                                                <span className="text-xs text-gray-500 italic">Détermine le slot horaire</span>
                                            </Label>
                                            <Select
                                                value={formData.defaultPeriod || "__NULL_PERIOD__"}
                                                onValueChange={(value) => {
                                                    const actualValue = value === "__NULL_PERIOD__" ? null : value as Period;
                                                    handleFormChange('defaultPeriod', actualValue);
                                                }}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Sélectionner une période" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__NULL_PERIOD__">Aucune</SelectItem>
                                                    <SelectItem value="MATIN">Matin (8h-12h typiquement)</SelectItem>
                                                    <SelectItem value="APRES_MIDI">Après-midi (13h-17h typiquement)</SelectItem>
                                                    <SelectItem value="JOURNEE_ENTIERE">Journée entière (8h-17h/24h)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="defaultDurationHours" className="flex items-center justify-between">
                                                <span>Durée par défaut (heures)</span>
                                                <span className="text-xs text-gray-500 italic">Temps standard de l'activité</span>
                                            </Label>
                                            <Input
                                                id="defaultDurationHours"
                                                name="defaultDurationHours"
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                value={formData.defaultDurationHours === null ? '' : String(formData.defaultDurationHours)}
                                                onChange={(e) => handleFormChange('defaultDurationHours', e.target.value === '' ? null : parseFloat(e.target.value))}
                                                placeholder="Ex: 4, 8, 12 ou 24"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Recommandations : 4h (demi-journée), 8h (journée), 12h ou 24h (garde)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="isActive" name="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleCheckboxChange('isActive', !!checked)} />
                                        <Label htmlFor="isActive">Actif</Label>
                                    </div>
                                </div>
                                <DialogFooter className="mt-4">
                                    <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                                    <Button type="submit">Sauvegarder</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {isDeleteErrorModalOpen && (
                    <Dialog open={isDeleteErrorModalOpen} onOpenChange={setIsDeleteErrorModalOpen}>
                        <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center text-red-600">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Impossible de supprimer ce type d'activité
                                </DialogTitle>
                                <DialogDescription>
                                    Ce type d'activité est référencé dans d'autres parties de l'application.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <p className="text-sm text-red-800 font-medium">
                                        <strong>{deleteErrorDetails.activityName}</strong> est actuellement utilisé dans une ou plusieurs trameModeles.
                                    </p>

                                    <p className="text-sm text-gray-700 mt-2">
                                        Avant de pouvoir supprimer ce type d'activité, vous devez d'abord le retirer de toutes les trameModeles qui l'utilisent.
                                    </p>
                                </div>

                                {deleteErrorDetails.trames && deleteErrorDetails.trames.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                                            Ce type d'activité est utilisé dans les trameModeles suivantes:
                                        </h3>
                                        <ul className="space-y-2 max-h-40 overflow-y-auto text-sm bg-gray-50 rounded p-3">
                                            {deleteErrorDetails.trames.map((trameModele) => (
                                                <li key={trameModele.id} className="flex items-center">
                                                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span>{trameModele.name}</span>
                                                    {/* On pourrait ajouter un lien vers la trameModele ici si on a l'URL */}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                    <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                                        <Info className="w-4 h-4 mr-2" /> Comment procéder ?
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                                        <li>Accédez à la section <strong>TrameModeles</strong> dans le menu</li>
                                        <li>Modifiez chaque trameModele listée ci-dessus</li>
                                        <li>Remplacez ou supprimez l'activité <strong>{deleteErrorDetails.activityName}</strong></li>
                                        <li>Retournez sur cette page pour supprimer le type d'activité</li>
                                    </ul>
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteErrorModalOpen(false)}
                                >
                                    Fermer
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsDeleteErrorModalOpen(false);
                                        window.location.href = '/parametres/trameModeles?tab=vue-classique';
                                    }}
                                >
                                    Aller aux trameModeles <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DragDropContext>
    );
};

export default AssignmentsConfigPanel; 