'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    Activity,
    Clock,
    Calendar,
    AlertTriangle,
    Eye,
    EyeOff,
    Palette
} from 'lucide-react';
import axios from 'axios';
import { ActivityCategory, Period, ActivityType, CreateActivityTypeData, UpdateActivityTypeData } from '@/types/activityTypes';

interface ActivityTypeFormData {
    name: string;
    description: string;
    category: ActivityCategory;
    color: string;
    icon: string;
    code: string;
    defaultDurationHours: number;
    defaultPeriod: Period;
    isActive: boolean;
}

const ACTIVITY_CATEGORY_OPTIONS = [
    { value: ActivityCategory.GARDE, label: 'Garde', color: 'red', icon: '🏥' },
    { value: ActivityCategory.ASTREINTE, label: 'Astreinte', color: 'orange', icon: '📞' },
    { value: ActivityCategory.CONSULTATION, label: 'Consultation', color: 'blue', icon: '👨‍⚕️' },
    { value: ActivityCategory.BLOC_OPERATOIRE, label: 'Bloc opératoire', color: 'green', icon: '🔧' },
    { value: ActivityCategory.REUNION, label: 'Réunion', color: 'purple', icon: '👥' },
    { value: ActivityCategory.FORMATION, label: 'Formation', color: 'yellow', icon: '📚' },
    { value: ActivityCategory.ADMINISTRATIF, label: 'Administratif', color: 'gray', icon: '📋' },
    { value: ActivityCategory.AUTRE, label: 'Autre', color: 'zinc', icon: '❓' }
];

const PERIOD_OPTIONS = [
    { value: Period.MATIN, label: 'Matin' },
    { value: Period.APRES_MIDI, label: 'Après-midi' },
    { value: Period.JOURNEE_ENTIERE, label: 'Journée entière' }
];

const COLOR_OPTIONS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#64748b', '#6b7280', '#374151', '#1f2937'
];

export const ActivityTypesManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingActivity, setEditingActivity] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<ActivityTypeFormData>({
        name: '',
        description: '',
        category: ActivityCategory.AUTRE,
        color: '#3b82f6',
        icon: '❓',
        code: '',
        defaultDurationHours: 8,
        defaultPeriod: Period.JOURNEE_ENTIERE,
        isActive: true
    });

    // Charger les types d'activités
    const { data: activityTypes = [], isLoading } = useQuery({
        queryKey: ['activity-types'],
        queryFn: async () => {
            const response = await axios.get('/api/activity-types');
            return response.data;
        }
    });

    // Mutation pour créer un type d'activité
    const createActivityType = useMutation({
        mutationFn: async (data: ActivityTypeFormData) => {
            const payload: CreateActivityTypeData = {
                name: data.name,
                description: data.description,
                category: data.category,
                color: data.color,
                icon: data.icon,
                code: data.code,
                defaultDurationHours: data.defaultDurationHours,
                defaultPeriod: data.defaultPeriod
            };
            const response = await axios.post('/api/activity-types', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-types'] });
            toast.success('Type d\'activité créé avec succès');
            setIsCreating(false);
            resetForm();
        },
        onError: () => {
            toast.error('Erreur lors de la création du type d\'activité');
        }
    });

    // Mutation pour mettre à jour un type d'activité
    const updateActivityType = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ActivityTypeFormData> }) => {
            const payload: UpdateActivityTypeData = {
                name: data.name,
                description: data.description,
                category: data.category,
                color: data.color,
                icon: data.icon,
                defaultDurationHours: data.defaultDurationHours,
                defaultPeriod: data.defaultPeriod,
                isActive: data.isActive
            };
            const response = await axios.patch(`/api/activity-types/${id}`, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-types'] });
            toast.success('Type d\'activité mis à jour');
            setEditingActivity(null);
        },
        onError: () => {
            toast.error('Erreur lors de la mise à jour');
        }
    });

    // Mutation pour supprimer un type d'activité
    const deleteActivityType = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/activity-types/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-types'] });
            toast.success('Type d\'activité supprimé');
        },
        onError: () => {
            toast.error('Erreur lors de la suppression');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: ActivityCategory.AUTRE,
            color: '#3b82f6',
            icon: '❓',
            code: '',
            defaultDurationHours: 8,
            defaultPeriod: Period.JOURNEE_ENTIERE,
            isActive: true
        });
    };

    const handleEdit = (activityType: ActivityType) => {
        setEditingActivity(activityType.id);
        setFormData({
            name: activityType.name,
            description: activityType.description || '',
            category: activityType.category,
            color: activityType.color || '#3b82f6',
            icon: activityType.icon || '❓',
            code: activityType.code,
            defaultDurationHours: activityType.defaultDurationHours || 8,
            defaultPeriod: activityType.defaultPeriod || Period.JOURNEE_ENTIERE,
            isActive: activityType.isActive
        });
    };

    const handleSave = async (activityTypeId: string) => {
        await updateActivityType.mutateAsync({ id: activityTypeId, data: formData });
    };

    const handleCancel = () => {
        setEditingActivity(null);
        resetForm();
    };

    const getCategoryBadgeColor = (category: ActivityCategory) => {
        const cat = ACTIVITY_CATEGORY_OPTIONS.find(c => c.value === category);
        return cat?.color || 'gray';
    };

    const generateCodeFromName = (name: string) => {
        return name.toUpperCase()
            .replace(/[ÀÁÂÃÄÅ]/g, 'A')
            .replace(/[ÈÉÊË]/g, 'E')
            .replace(/[ÌÍÎÏ]/g, 'I')
            .replace(/[ÒÓÔÕÖ]/g, 'O')
            .replace(/[ÙÚÛÜ]/g, 'U')
            .replace(/[ÇÑ]/g, 'C')
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    };

    const renderActivityTypeCard = (activityType: ActivityType) => {
        const isEditing = editingActivity === activityType.id;
        const categoryInfo = ACTIVITY_CATEGORY_OPTIONS.find(c => c.value === activityType.category);

        return (
            <Card key={activityType.id} className="relative">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: activityType.color }}
                            >
                                {activityType.icon || categoryInfo?.icon}
                            </div>
                            {isEditing ? (
                                <Input
                                    value={formData.name}
                                    onChange={(e) => {
                                        const newName = e.target.value;
                                        setFormData({ 
                                            ...formData, 
                                            name: newName,
                                            code: generateCodeFromName(newName)
                                        });
                                    }}
                                    className="h-8 flex-1"
                                />
                            ) : (
                                <div>
                                    <CardTitle className="text-lg">{activityType.name}</CardTitle>
                                    <p className="text-sm text-gray-500">{activityType.code}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(activityType)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteActivityType.mutate(activityType.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSave(activityType.id)}
                                    >
                                        <Save className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancel}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={activityType.isActive ? 'default' : 'secondary'}>
                            {activityType.isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                            {activityType.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline" className={`border-${getCategoryBadgeColor(activityType.category)}-500`}>
                            {categoryInfo?.label}
                        </Badge>
                        {activityType.defaultPeriod && (
                            <Badge variant="secondary">
                                <Calendar className="h-3 w-3 mr-1" />
                                {PERIOD_OPTIONS.find(p => p.value === activityType.defaultPeriod)?.label}
                            </Badge>
                        )}
                        {activityType.defaultDurationHours && (
                            <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {activityType.defaultDurationHours}h
                            </Badge>
                        )}
                    </div>

                    {/* Description */}
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Description de l'activité"
                                    rows={2}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Catégorie</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value: ActivityCategory) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACTIVITY_CATEGORY_OPTIONS.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.icon} {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Période par défaut</Label>
                                    <Select
                                        value={formData.defaultPeriod}
                                        onValueChange={(value: Period) => setFormData({ ...formData, defaultPeriod: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PERIOD_OPTIONS.map(period => (
                                                <SelectItem key={period.value} value={period.value}>
                                                    {period.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Durée par défaut (heures)</Label>
                                    <Input
                                        type="number"
                                        value={formData.defaultDurationHours}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            defaultDurationHours: parseInt(e.target.value) || 1 
                                        })}
                                        min="1"
                                        max="24"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Couleur</Label>
                                    <div className="flex gap-2">
                                        {COLOR_OPTIONS.map(color => (
                                            <div
                                                key={color}
                                                className={`w-6 h-6 rounded cursor-pointer border-2 ${
                                                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setFormData({ ...formData, color })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ 
                                        ...formData, 
                                        isActive: checked 
                                    })}
                                />
                                <Label>Activité active</Label>
                            </div>
                        </div>
                    ) : (
                        activityType.description && <p className="text-sm text-gray-600">{activityType.description}</p>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderCreateForm = () => (
        <Card>
            <CardHeader>
                <CardTitle>Nouveau type d'activité</CardTitle>
                <CardDescription>
                    Créez un nouveau type d'activité (garde, consultation, etc.)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de l'activité</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                const newName = e.target.value;
                                setFormData({ 
                                    ...formData, 
                                    name: newName,
                                    code: generateCodeFromName(newName)
                                });
                            }}
                            placeholder="ex: Garde de nuit"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="GARDE_NUIT"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                        value={formData.category}
                        onValueChange={(value: ActivityCategory) => setFormData({ ...formData, category: value })}
                    >
                        <SelectTrigger id="category">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ACTIVITY_CATEGORY_OPTIONS.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.icon} {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description de l'activité"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Période par défaut</Label>
                        <Select
                            value={formData.defaultPeriod}
                            onValueChange={(value: Period) => setFormData({ ...formData, defaultPeriod: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIOD_OPTIONS.map(period => (
                                    <SelectItem key={period.value} value={period.value}>
                                        {period.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Durée par défaut (heures)</Label>
                        <Input
                            type="number"
                            value={formData.defaultDurationHours}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                defaultDurationHours: parseInt(e.target.value) || 1 
                            })}
                            min="1"
                            max="24"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex gap-2">
                        {COLOR_OPTIONS.map(color => (
                            <div
                                key={color}
                                className={`w-8 h-8 rounded cursor-pointer border-2 ${
                                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setFormData({ ...formData, color })}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                        setIsCreating(false);
                        resetForm();
                    }}>
                        Annuler
                    </Button>
                    <Button onClick={() => createActivityType.mutate(formData)}>
                        Créer l'activité
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return <div>Chargement des types d'activités...</div>;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Types d'activités</h2>
                    <p className="text-gray-600">Gérez les différents types d'activités (gardes, consultations, etc.)</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau type
                    </Button>
                )}
            </div>

            {/* Formulaire de création */}
            {isCreating && renderCreateForm()}

            {/* Liste des types d'activités */}
            {activityTypes.length === 0 ? (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Aucun type d'activité trouvé. Créez votre premier type d'activité.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activityTypes.map(renderActivityTypeCard)}
                </div>
            )}
        </div>
    );
};

export default ActivityTypesManager;