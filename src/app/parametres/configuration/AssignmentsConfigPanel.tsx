"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Edit, Calendar, MapPin, Tag, User, Save, X,
    Clock, Info, ArrowRight, CheckCircle2, XCircle, Bell, AlertTriangle, Loader2
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
import { HTML5Backend } from 'react-dnd-html5-backend';
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
        siteIDs: [],
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
        siteIDs: [],
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
                console.log("Auth en cours de chargement, attente avant de fetcher les types d'activité.");
                return;
            }
        } catch (err: any) {
            console.error("Erreur lors du chargement des types d'activité:", err);
            setError(`Impossible de charger les types d'activité: ${err.message}. Utilisation des données mockées.`);
            setActivityTypes(MOCK_ACTIVITY_TYPES);
        } finally {
            setIsLoadingData(false);
        }
    }, [isAuthenticated, isAuthLoading]);

    useEffect(() => {
        fetchActivityTypes();
    }, [fetchActivityTypes]);

    const handleFormChange = (field: keyof Partial<ActivityType>, value: any) => {
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
        console.log("[AssignmentsConfigPanel] handleSubmit triggered.");
        setError(null);

        if (isAuthLoading || !isAuthenticated) {
            toast.error("Vous devez être authentifié.");
            console.warn("[AssignmentsConfigPanel] handleSubmit aborted: User not authenticated.");
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

        console.log("[AssignmentsConfigPanel] Raw dataToSubmit before cleaning:", JSON.parse(JSON.stringify(dataToSubmit)));

        Object.keys(dataToSubmit).forEach(key => {
            const K = key as keyof typeof dataToSubmit;
            if (dataToSubmit[K] === undefined) {
                delete dataToSubmit[K];
            }
        });

        console.log("[AssignmentsConfigPanel] Cleaned dataToSubmit:", JSON.parse(JSON.stringify(dataToSubmit)));

        const url = currentActivityType
            ? `/api/activity-types/${currentActivityType.id}`
            : '/api/activity-types';
        const method = currentActivityType ? 'PUT' : 'POST';

        console.log(`[AssignmentsConfigPanel] Method: ${method}, URL: ${url}`);

        try {
            let response;
            if (method === 'PUT') {
                console.log("[AssignmentsConfigPanel] PRE-AWAIT axios.put...");
                response = await axios.put(url, dataToSubmit);
                console.log("[AssignmentsConfigPanel] POST-AWAIT axios.put. Response received (or error if it threw).");
                console.log("[AssignmentsConfigPanel] axios.put response:", response);
                toast.success('Type d\'activité modifié avec succès');
            } else {
                console.log("[AssignmentsConfigPanel] PRE-AWAIT axios.post...");
                response = await axios.post(url, dataToSubmit);
                console.log("[AssignmentsConfigPanel] POST-AWAIT axios.post. Response received (or error if it threw).");
                console.log("[AssignmentsConfigPanel] axios.post response:", response);
                toast.success('Type d\'activité ajouté avec succès');
            }
            resetFormAndCloseModal();
            await fetchActivityTypes();
        } catch (err: any) {
            console.error("[AssignmentsConfigPanel] Error during submission (handleSubmit):", err);
            if (err.response) {
                console.error('[AssignmentsConfigPanel] Error response data (handleSubmit):', err.response.data);
                console.error('[AssignmentsConfigPanel] Error response status (handleSubmit):', err.response.status);
                console.error('[AssignmentsConfigPanel] Error response headers (handleSubmit):', err.response.headers);
            } else if (err.request) {
                console.error('[AssignmentsConfigPanel] Error request data (handleSubmit):', err.request);
            } else {
                console.error('[AssignmentsConfigPanel] Error message (handleSubmit):', err.message);
            }
            const errorMessage = err.response?.data?.error || err.message || 'Une erreur est survenue.';
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: string) => {
        console.log(`[AssignmentsConfigPanel] Attempting to delete activity type with ID: ${id}`);
        if (!isAuthenticated) {
            toast.error("Vous devez être authentifié pour supprimer.");
            console.warn("[AssignmentsConfigPanel] Delete aborted: User not authenticated.");
            return;
        }
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce type d'activité ?")) {
            console.log(`[AssignmentsConfigPanel] User confirmed deletion for ID: ${id}`);
            try {
                console.log(`[AssignmentsConfigPanel] Calling axios.delete for /api/activity-types/${id}`);
                const response = await axios.delete(`/api/activity-types/${id}`);
                console.log("[AssignmentsConfigPanel] axios.delete response:", response); // LOG DE LA RÉPONSE
                toast.success('Type d\'activité supprimé');
                await fetchActivityTypes();
            } catch (err: any) {
                console.error('[AssignmentsConfigPanel] Error during deletion:', err);
                if (err.response) {
                    console.error('[AssignmentsConfigPanel] Error response data:', err.response.data);
                    console.error('[AssignmentsConfigPanel] Error response status:', err.response.status);
                    console.error('[AssignmentsConfigPanel] Error response headers:', err.response.headers);
                } else if (err.request) {
                    console.error('[AssignmentsConfigPanel] Error request data:', err.request);
                } else {
                    console.error('[AssignmentsConfigPanel] Error message:', err.message);
                }
                const errorMessage = err.response?.data?.error || err.message || 'Une erreur est survenue lors de la suppression.';
                toast.error(`Erreur: ${errorMessage}`);
            }
        } else {
            console.log("[AssignmentsConfigPanel] User cancelled deletion.");
        }
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'ASSIGNMENT_TYPE',
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    if (isLoadingData && isAuthLoading) {
        return <div className="p-4">Chargement initial...</div>;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700">Configuration des Types d'Activité</h2>
                    {isAuthenticated && <Button onClick={openNewForm}><Plus className="mr-2" /> Ajouter un type</Button>}
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
                    <div className="bg-white shadow rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Catégorie
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Icône
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activityTypes.map((type, index) => (
                                    <tr key={type.id} ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div style={{ width: '20px', height: '20px', backgroundColor: type.color || undefined, borderRadius: '50%' }}></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.icon}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {type.isActive ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" size="sm" onClick={() => openEditForm(type)} className="mr-2"><Edit /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}><Trash2 /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                        <Label htmlFor="category">Catégorie</Label>
                                        <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value as ActivityCategory)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                                            <SelectContent>
                                                {Object.values(ActivityCategory).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="color">Couleur</Label>
                                        <Input id="color" name="color" type="color" value={formData.color || '#FFFFFF'} onChange={(e) => handleFormChange('color', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="icon">Icône (nom)</Label>
                                        <Input id="icon" name="icon" value={formData.icon || ''} onChange={(e) => handleFormChange('icon', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="defaultDurationHours">Durée par défaut (heures)</Label>
                                        <Input
                                            id="defaultDurationHours"
                                            name="defaultDurationHours"
                                            type="number"
                                            value={formData.defaultDurationHours === null ? '' : String(formData.defaultDurationHours)}
                                            onChange={(e) => handleFormChange('defaultDurationHours', e.target.value === '' ? null : parseFloat(e.target.value))}
                                            placeholder="Ex: 8"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="defaultPeriod">Période par défaut</Label>
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
                                                {Object.values(Period).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
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
            </div>
        </DndProvider>
    );
};

export default AssignmentsConfigPanel; 