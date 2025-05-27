'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter } from 'lucide-react';

interface Room {
    id: number;
    name: string;
    sectorId: number;
}

interface FilterPanelProps {
    rooms: Room[];
    selectedRooms: number[];
    onRoomsChange: (roomIds: number[]) => void;
    selectedActivityTypes: string[];
    onActivityTypesChange: (types: string[]) => void;
    className?: string;
}

const ACTIVITY_TYPES = [
    { id: 'bloc-anesthesie', label: 'Bloc Anesthésie', color: 'bg-blue-500' },
    { id: 'bloc-supervision', label: 'Bloc Supervision', color: 'bg-green-500' },
    { id: 'consultation', label: 'Consultation', color: 'bg-purple-500' },
    { id: 'garde', label: 'Garde', color: 'bg-orange-500' }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
    rooms,
    selectedRooms,
    onRoomsChange,
    selectedActivityTypes,
    onActivityTypesChange,
    className = ''
}) => {
    const handleRoomToggle = (roomId: number) => {
        if (selectedRooms.includes(roomId)) {
            onRoomsChange(selectedRooms.filter(id => id !== roomId));
        } else {
            onRoomsChange([...selectedRooms, roomId]);
        }
    };

    const handleActivityTypeToggle = (typeId: string) => {
        if (selectedActivityTypes.includes(typeId)) {
            onActivityTypesChange(selectedActivityTypes.filter(id => id !== typeId));
        } else {
            onActivityTypesChange([...selectedActivityTypes, typeId]);
        }
    };

    const handleClearAllRooms = () => {
        onRoomsChange([]);
    };

    const handleSelectAllRooms = () => {
        onRoomsChange(rooms.map(room => room.id));
    };

    const handleClearAllActivityTypes = () => {
        onActivityTypesChange([]);
    };

    const handleSelectAllActivityTypes = () => {
        onActivityTypesChange(ACTIVITY_TYPES.map(type => type.id));
    };

    return (
        <motion.div
            className={`border-t border-gray-200 bg-gray-50 ${className}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                            {selectedRooms.length} salle{selectedRooms.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline">
                            {selectedActivityTypes.length} type{selectedActivityTypes.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Filtres par salle */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Salles</CardTitle>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSelectAllRooms}
                                        className="text-xs"
                                    >
                                        Tout
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearAllRooms}
                                        className="text-xs"
                                    >
                                        Aucun
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {rooms.map(room => (
                                    <div key={room.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`room-${room.id}`}
                                            checked={selectedRooms.includes(room.id)}
                                            onCheckedChange={() => handleRoomToggle(room.id)}
                                        />
                                        <label
                                            htmlFor={`room-${room.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {room.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filtres par type d'activité */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Types d'activité</CardTitle>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSelectAllActivityTypes}
                                        className="text-xs"
                                    >
                                        Tout
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearAllActivityTypes}
                                        className="text-xs"
                                    >
                                        Aucun
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {ACTIVITY_TYPES.map(type => (
                                    <div key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`activity-${type.id}`}
                                            checked={selectedActivityTypes.includes(type.id)}
                                            onCheckedChange={() => handleActivityTypeToggle(type.id)}
                                        />
                                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                        <label
                                            htmlFor={`activity-${type.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {type.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default FilterPanel; 