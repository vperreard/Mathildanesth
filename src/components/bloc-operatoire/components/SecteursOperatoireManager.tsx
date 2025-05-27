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
import { toast } from 'sonner';
import {
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    Building,
    Settings,
    AlertTriangle,
    Info,
    Eye,
    EyeOff
} from 'lucide-react';
import axios from 'axios';

interface OperatingSector {
    id: number;
    name: string;
    description?: string;
    displayOrder: number;
    category: 'STANDARD' | 'SPECIALIZED' | 'EMERGENCY' | 'AMBULATORY';
    sectorType: 'GENERAL' | 'CARDIAC' | 'NEURO' | 'PEDIATRIC' | 'OBSTETRIC' | 'OPHTHALMOLOGY' | 'ENDOSCOPY';
    supervisionRules?: {
        maxRoomsPerSupervisor: number;
        requiresContiguousRooms: boolean;
        compatibleSectors: string[];
    };
    isActive: boolean;
    rooms?: Array<{
        id: number;
        name: string;
        isActive: boolean;
    }>;
}

interface SectorFormData {
    name: string;
    description: string;
    category: string;
    sectorType: string;
    maxRoomsPerSupervisor: number;
    requiresContiguousRooms: boolean;
    compatibleSectors: string[];
    isActive: boolean;
}

const CATEGORY_OPTIONS = [
    { value: 'STANDARD', label: 'Standard', color: 'blue' },
    { value: 'SPECIALIZED', label: 'Spécialisé', color: 'purple' },
    { value: 'EMERGENCY', label: 'Urgence', color: 'red' },
    { value: 'AMBULATORY', label: 'Ambulatoire', color: 'green' }
];

const SECTOR_TYPE_OPTIONS = [
    { value: 'GENERAL', label: 'Général' },
    { value: 'CARDIAC', label: 'Cardiaque' },
    { value: 'NEURO', label: 'Neurologie' },
    { value: 'PEDIATRIC', label: 'Pédiatrie' },
    { value: 'OBSTETRIC', label: 'Obstétrique' },
    { value: 'OPHTHALMOLOGY', label: 'Ophtalmologie' },
    { value: 'ENDOSCOPY', label: 'Endoscopie' }
];

export const SecteursOperatoireManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingSector, setEditingSector] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<SectorFormData>({
        name: '',
        description: '',
        category: 'STANDARD',
        sectorType: 'GENERAL',
        maxRoomsPerSupervisor: 2,
        requiresContiguousRooms: true,
        compatibleSectors: [],
        isActive: true
    });

    // Charger les secteurs
    const { data: sectors = [], isLoading } = useQuery({
        queryKey: ['operating-sectors'],
        queryFn: async () => {
            const response = await axios.get('/api/bloc-operatoire/operating-sectors');
            return response.data;
        }
    });

    // Mutation pour créer un secteur
    const createSector = useMutation({
        mutationFn: async (data: SectorFormData) => {
            const payload = {
                name: data.name,
                description: data.description,
                category: data.category,
                sectorType: data.sectorType,
                supervisionRules: {
                    maxRoomsPerSupervisor: data.maxRoomsPerSupervisor,
                    requiresContiguousRooms: data.requiresContiguousRooms,
                    compatibleSectors: data.compatibleSectors
                },
                isActive: data.isActive
            };
            const response = await axios.post('/api/bloc-operatoire/operating-sectors', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-sectors'] });
            toast.success('Secteur créé avec succès');
            setIsCreating(false);
            resetForm();
        },
        onError: () => {
            toast.error('Erreur lors de la création du secteur');
        }
    });

    // Mutation pour mettre à jour un secteur
    const updateSector = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<SectorFormData> }) => {
            const payload = {
                name: data.name,
                description: data.description,
                category: data.category,
                sectorType: data.sectorType,
                supervisionRules: {
                    maxRoomsPerSupervisor: data.maxRoomsPerSupervisor,
                    requiresContiguousRooms: data.requiresContiguousRooms,
                    compatibleSectors: data.compatibleSectors
                },
                isActive: data.isActive
            };
            const response = await axios.patch(`/api/bloc-operatoire/operating-sectors/${id}`, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-sectors'] });
            toast.success('Secteur mis à jour');
            setEditingSector(null);
        },
        onError: () => {
            toast.error('Erreur lors de la mise à jour');
        }
    });

    // Mutation pour supprimer un secteur
    const deleteSector = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`/api/bloc-operatoire/operating-sectors/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-sectors'] });
            toast.success('Secteur supprimé');
        },
        onError: () => {
            toast.error('Erreur lors de la suppression');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'STANDARD',
            sectorType: 'GENERAL',
            maxRoomsPerSupervisor: 2,
            requiresContiguousRooms: true,
            compatibleSectors: [],
            isActive: true
        });
    };

    const handleEdit = (sector: OperatingSector) => {
        setEditingSector(sector.id);
        setFormData({
            name: sector.name,
            description: sector.description || '',
            category: sector.category,
            sectorType: sector.sectorType,
            maxRoomsPerSupervisor: sector.supervisionRules?.maxRoomsPerSupervisor || 2,
            requiresContiguousRooms: sector.supervisionRules?.requiresContiguousRooms || false,
            compatibleSectors: sector.supervisionRules?.compatibleSectors || [],
            isActive: sector.isActive
        });
    };

    const handleSave = async (sectorId: number) => {
        await updateSector.mutateAsync({ id: sectorId, data: formData });
    };

    const handleCancel = () => {
        setEditingSector(null);
        resetForm();
    };

    const toggleCompatibleSector = (sectorType: string) => {
        const newCompatible = formData.compatibleSectors.includes(sectorType)
            ? formData.compatibleSectors.filter(s => s !== sectorType)
            : [...formData.compatibleSectors, sectorType];
        setFormData({ ...formData, compatibleSectors: newCompatible });
    };

    const getCategoryBadgeColor = (category: string) => {
        const cat = CATEGORY_OPTIONS.find(c => c.value === category);
        return cat?.color || 'gray';
    };

    const renderSectorCard = (sector: OperatingSector) => {
        const isEditing = editingSector === sector.id;

        return (
            <Card key={sector.id} className="relative">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-gray-500" />
                            {isEditing ? (
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-8"
                                />
                            ) : (
                                <CardTitle className="text-lg">{sector.name}</CardTitle>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(sector)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteSector.mutate(sector.id)}
                                        disabled={sector.rooms && sector.rooms.length > 0}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSave(sector.id)}
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
                    <div className="flex items-center gap-2">
                        <Badge variant={sector.isActive ? 'default' : 'secondary'}>
                            {sector.isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                            {sector.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline" className={`border-${getCategoryBadgeColor(sector.category)}-500`}>
                            {CATEGORY_OPTIONS.find(c => c.value === sector.category)?.label}
                        </Badge>
                        <Badge variant="outline">
                            {SECTOR_TYPE_OPTIONS.find(t => t.value === sector.sectorType)?.label}
                        </Badge>
                    </div>

                    {/* Description */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description du secteur"
                            />
                        </div>
                    ) : (
                        sector.description && <p className="text-sm text-gray-600">{sector.description}</p>
                    )}

                    <Separator />

                    {/* Règles de supervision */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Règles de supervision</span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3 pl-6">
                                <div className="space-y-2">
                                    <Label>Nombre max de salles par superviseur</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxRoomsPerSupervisor}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            maxRoomsPerSupervisor: parseInt(e.target.value) || 1 
                                        })}
                                        min="1"
                                        max="5"
                                        className="w-24"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.requiresContiguousRooms}
                                        onCheckedChange={(checked) => setFormData({ 
                                            ...formData, 
                                            requiresContiguousRooms: checked 
                                        })}
                                    />
                                    <Label>Exiger des salles contiguës</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Secteurs compatibles</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {SECTOR_TYPE_OPTIONS.map(type => (
                                            <Badge
                                                key={type.value}
                                                variant={formData.compatibleSectors.includes(type.value) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => toggleCompatibleSector(type.value)}
                                            >
                                                {type.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 pl-6 text-sm">
                                <div>Max {sector.supervisionRules?.maxRoomsPerSupervisor || 2} salles/superviseur</div>
                                {sector.supervisionRules?.requiresContiguousRooms && (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        Salles contiguës requises
                                    </div>
                                )}
                                {sector.supervisionRules?.compatibleSectors && sector.supervisionRules.compatibleSectors.length > 0 && (
                                    <div>
                                        <span className="text-gray-500">Compatible avec: </span>
                                        {sector.supervisionRules.compatibleSectors.map(s => 
                                            SECTOR_TYPE_OPTIONS.find(t => t.value === s)?.label
                                        ).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Salles associées */}
                    {sector.rooms && sector.rooms.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">{sector.rooms.length} salle(s) associée(s)</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-6">
                                {sector.rooms.map(room => (
                                    <Badge key={room.id} variant="secondary" className="text-xs">
                                        {room.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderCreateForm = () => (
        <Card>
            <CardHeader>
                <CardTitle>Nouveau secteur opératoire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du secteur</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ex: Bloc Principal"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger id="category">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sectorType">Type de secteur</Label>
                    <Select
                        value={formData.sectorType}
                        onValueChange={(value) => setFormData({ ...formData, sectorType: value })}
                    >
                        <SelectTrigger id="sectorType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SECTOR_TYPE_OPTIONS.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description du secteur"
                    />
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="font-medium">Règles de supervision</h4>
                    
                    <div className="space-y-2">
                        <Label>Nombre max de salles par superviseur</Label>
                        <Input
                            type="number"
                            value={formData.maxRoomsPerSupervisor}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                maxRoomsPerSupervisor: parseInt(e.target.value) || 1 
                            })}
                            min="1"
                            max="5"
                            className="w-24"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.requiresContiguousRooms}
                            onCheckedChange={(checked) => setFormData({ 
                                ...formData, 
                                requiresContiguousRooms: checked 
                            })}
                        />
                        <Label>Exiger des salles contiguës</Label>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                        setIsCreating(false);
                        resetForm();
                    }}>
                        Annuler
                    </Button>
                    <Button onClick={() => createSector.mutate(formData)}>
                        Créer le secteur
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return <div>Chargement des secteurs...</div>;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestion des secteurs</h2>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau secteur
                    </Button>
                )}
            </div>

            {/* Formulaire de création */}
            {isCreating && renderCreateForm()}

            {/* Liste des secteurs */}
            {sectors.length === 0 ? (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Aucun secteur trouvé. Créez votre premier secteur opératoire.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sectors.map(renderSectorCard)}
                </div>
            )}
        </div>
    );
};

export default SecteursOperatoireManager;