'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    MapPin,
    Activity,
    Users,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface OperatingRoom {
    id: number;
    name: string;
    description?: string;
    capacity: number;
    equipment: string[];
    sectorId: number;
    sector?: {
        id: number;
        name: string;
        category: string;
    };
    isActive: boolean;
    displayOrder: number;
}

interface RoomFormData {
    name: string;
    description: string;
    capacity: number;
    equipment: string[];
    sectorId: number;
    isActive: boolean;
}

const defaultFormData: RoomFormData = {
    name: '',
    description: '',
    capacity: 1,
    equipment: [],
    sectorId: 0,
    isActive: true
};

export const SallesOperatoireManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingRoom, setEditingRoom] = useState<number | null>(null);
    const [formData, setFormData] = useState<RoomFormData>(defaultFormData);
    const [isCreating, setIsCreating] = useState(false);
    const [equipmentInput, setEquipmentInput] = useState('');
    const [selectedSector, setSelectedSector] = useState<string>('all');

    // Charger les salles
    const { data: rooms = [], isLoading: roomsLoading } = useQuery({
        queryKey: ['operating-rooms'],
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-rooms');
            return response.data;
        }
    });

    // Charger les secteurs
    const { data: sectors = [] } = useQuery({
        queryKey: ['operating-sectors'],
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-sectors');
            return response.data;
        }
    });

    // Mutation pour créer une salle
    const createRoom = useMutation({
        mutationFn: async (data: RoomFormData) => {
            const response = await axios.post('http://localhost:3000/api/bloc-operatoire/operating-rooms', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-rooms'] });
            toast.success('Salle créée avec succès');
            setIsCreating(false);
            setFormData(defaultFormData);
        },
        onError: () => {
            toast.error('Erreur lors de la création de la salle');
        }
    });

    // Mutation pour mettre à jour une salle
    const updateRoom = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<RoomFormData> }) => {
            const response = await axios.patch(`http://localhost:3000/api/bloc-operatoire/operating-rooms/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-rooms'] });
            toast.success('Salle mise à jour');
            setEditingRoom(null);
        },
        onError: () => {
            toast.error('Erreur lors de la mise à jour');
        }
    });

    // Mutation pour supprimer une salle
    const deleteRoom = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`http://localhost:3000/api/bloc-operatoire/operating-rooms/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-rooms'] });
            toast.success('Salle supprimée');
        },
        onError: () => {
            toast.error('Erreur lors de la suppression');
        }
    });

    // Filtrer les salles par secteur
    const filteredRooms = selectedSector === 'all' 
        ? rooms 
        : rooms.filter((room: OperatingRoom) => room.sectorId.toString() === selectedSector);

    // Grouper les salles par secteur
    const roomsBySector = rooms.reduce((acc: Record<string, OperatingRoom[]>, room: OperatingRoom) => {
        const sectorName = room.sector?.name || 'Sans secteur';
        if (!acc[sectorName]) acc[sectorName] = [];
        acc[sectorName].push(room);
        return acc;
    }, {});

    const handleEdit = (room: OperatingRoom) => {
        setEditingRoom(room.id);
        setFormData({
            name: room.name,
            description: room.description || '',
            capacity: room.capacity,
            equipment: room.equipment || [],
            sectorId: room.sectorId,
            isActive: room.isActive
        });
    };

    const handleSave = async (roomId: number) => {
        await updateRoom.mutateAsync({ id: roomId, data: formData });
    };

    const handleCancel = () => {
        setEditingRoom(null);
        setFormData(defaultFormData);
    };

    const handleAddEquipment = () => {
        if (equipmentInput.trim()) {
            setFormData({
                ...formData,
                equipment: [...formData.equipment, equipmentInput.trim()]
            });
            setEquipmentInput('');
        }
    };

    const handleRemoveEquipment = (index: number) => {
        setFormData({
            ...formData,
            equipment: formData.equipment.filter((_, i) => i !== index)
        });
    };

    const renderRoomCard = (room: OperatingRoom) => {
        const isEditing = editingRoom === room.id;

        return (
            <Card key={room.id} className="relative">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-gray-500" />
                            {isEditing ? (
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-8"
                                />
                            ) : (
                                <CardTitle className="text-lg">{room.name}</CardTitle>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(room)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteRoom.mutate(room.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSave(room.id)}
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
                    {/* Secteur */}
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{room.sector?.name}</Badge>
                        <Badge variant={room.isActive ? 'default' : 'secondary'}>
                            {room.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    {/* Description */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description de la salle"
                            />
                        </div>
                    ) : (
                        room.description && <p className="text-sm text-gray-600">{room.description}</p>
                    )}

                    {/* Capacité */}
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        {isEditing ? (
                            <Input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                className="w-20 h-8"
                                min="1"
                            />
                        ) : (
                            <span className="text-sm">Capacité: {room.capacity}</span>
                        )}
                    </div>

                    {/* Équipements */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Équipements</span>
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={equipmentInput}
                                        onChange={(e) => setEquipmentInput(e.target.value)}
                                        placeholder="Ajouter un équipement"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                                    />
                                    <Button size="sm" onClick={handleAddEquipment}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.equipment.map((eq, idx) => (
                                        <Badge key={idx} variant="secondary" className="pr-1">
                                            {eq}
                                            <button
                                                onClick={() => handleRemoveEquipment(idx)}
                                                className="ml-1 hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {room.equipment?.length > 0 ? (
                                    room.equipment.map((eq, idx) => (
                                        <Badge key={idx} variant="secondary">{eq}</Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">Aucun équipement</span>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderCreateForm = () => (
        <Card>
            <CardHeader>
                <CardTitle>Nouvelle salle d'opération</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la salle</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ex: Salle 1"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sector">Secteur</Label>
                        <Select
                            value={formData.sectorId.toString()}
                            onValueChange={(value) => setFormData({ ...formData, sectorId: parseInt(value) })}
                        >
                            <SelectTrigger id="sector">
                                <SelectValue placeholder="Sélectionner un secteur" />
                            </SelectTrigger>
                            <SelectContent>
                                {sectors.map((sector: unknown) => (
                                    <SelectItem key={sector.id} value={sector.id.toString()}>
                                        {sector.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description de la salle"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                        min="1"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                        setIsCreating(false);
                        setFormData(defaultFormData);
                    }}>
                        Annuler
                    </Button>
                    <Button onClick={() => createRoom.mutate(formData)}>
                        Créer la salle
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (roomsLoading) {
        return <div>Chargement des salles...</div>;
    }

    return (
        <div className="space-y-6">
            {/* En-tête avec filtres */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Gestion des salles</h2>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrer par secteur" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les secteurs</SelectItem>
                            {sectors.map((sector: unknown) => (
                                <SelectItem key={sector.id} value={sector.id.toString()}>
                                    {sector.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle salle
                    </Button>
                )}
            </div>

            {/* Formulaire de création */}
            {isCreating && renderCreateForm()}

            {/* Liste des salles */}
            {filteredRooms.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Aucune salle trouvée. Créez votre première salle d'opération.
                    </AlertDescription>
                </Alert>
            ) : (
                <Tabs defaultValue="grid" className="w-full">
                    <TabsList>
                        <TabsTrigger value="grid">Vue grille</TabsTrigger>
                        <TabsTrigger value="sector">Par secteur</TabsTrigger>
                    </TabsList>

                    <TabsContent value="grid" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRooms.map(renderRoomCard)}
                        </div>
                    </TabsContent>

                    <TabsContent value="sector" className="mt-4 space-y-6">
                        {Object.entries(roomsBySector).map(([sectorName, sectorRooms]) => (
                            <div key={sectorName}>
                                <h3 className="text-lg font-semibold mb-3">{sectorName}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sectorRooms.map(renderRoomCard)}
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default SallesOperatoireManager;