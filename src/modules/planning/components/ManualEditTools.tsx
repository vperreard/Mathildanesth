'use client';

import { useState } from 'react';
import { logger } from "../../../lib/logger";
import { Card, Button, Select, Popover, PopoverTrigger, PopoverContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { BlocRoomAssignment } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { User, Users, Pencil, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface ManualEditToolsProps {
    attributions: BlocRoomAssignment[];
    rooms: Array<{ id: string; name: string; number: string; sectorId: string }>;
    surgeons: Array<{ id: string; name: string; specialty?: string }>;
    onAssignmentChange: (attribution: BlocRoomAssignment, action: 'add' | 'update' | 'delete') => Promise<void>;
    onValidateAssignment: (attribution: BlocRoomAssignment) => Promise<{
        isValid: boolean;
        conflicts: Array<{
            type: string;
            message: string;
            severity: 'warning' | 'error';
        }>;
    }>;
    disabled?: boolean;
}

export default function ManualEditTools({
    attributions,
    rooms,
    surgeons,
    onAssignmentChange,
    onValidateAssignment,
    disabled = false
}: ManualEditToolsProps) {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedSurgeon, setSelectedSurgeon] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        conflicts: Array<{
            type: string;
            message: string;
            severity: 'warning' | 'error';
        }>;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'attribution' | 'validation'>('attribution');

    const handleAssignmentChange = async (action: 'add' | 'update' | 'delete') => {
        if (!selectedRoom || (action !== 'delete' && !selectedSurgeon)) return;

        setIsLoading(true);
        try {
            const roomId = selectedRoom;
            const surgeonId = selectedSurgeon;

            const attribution: BlocRoomAssignment = {
                roomId,
                surgeonId: surgeonId || undefined,
                // Ces valeurs devraient être déjà définies pour les mises à jour/suppressions
                // ou fournies par le parent pour les nouvelles affectations
                ...attributions.find(a => a.roomId === roomId)
            };

            // Vérifier la validité avant d'effectuer le changement
            if (action !== 'delete') {
                const validation = await onValidateAssignment(attribution);
                setValidationResult(validation);
                setActiveTab('validation');

                if (!validation.isValid && validation.conflicts.some(c => c.severity === 'error')) {
                    return; // Ne pas continuer si des erreurs bloquantes sont présentes
                }
            }

            await onAssignmentChange(attribution, action);

            // Réinitialiser après succès
            if (action === 'add' || action === 'delete') {
                setSelectedRoom(null);
                setSelectedSurgeon(null);
            }
            setValidationResult(null);
            setActiveTab('attribution');
        } catch (error: unknown) {
            logger.error('Erreur lors de la modification de l\'affectation:', { error: error });
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentAssignment = () => {
        if (!selectedRoom) return null;
        return attributions.find(a => a.roomId === selectedRoom);
    };

    const currentAssignment = getCurrentAssignment();

    return (
        <Card className="p-5">
            <h2 className="text-xl font-semibold mb-4">Outils d'édition manuelle</h2>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'attribution' | 'validation')} className="w-full mb-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="attribution">Affectation</TabsTrigger>
                    <TabsTrigger value="validation" disabled={!validationResult}>Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="attribution" className="space-y-4 mt-4">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Salle</label>
                            <Select
                                value={selectedRoom || ''}
                                onValueChange={setSelectedRoom}
                                disabled={disabled || isLoading}
                            >
                                <Select.Trigger className="w-full">
                                    <Select.Value placeholder="Sélectionner une salle" />
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Group>
                                        {rooms.map((room) => (
                                            <Select.Item key={room.id} value={room.id}>
                                                {room.number} - {room.name}
                                            </Select.Item>
                                        ))}
                                    </Select.Group>
                                </Select.Content>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Chirurgien</label>
                            <Select
                                value={selectedSurgeon || ''}
                                onValueChange={setSelectedSurgeon}
                                disabled={disabled || isLoading || !selectedRoom}
                            >
                                <Select.Trigger className="w-full">
                                    <Select.Value placeholder="Sélectionner un chirurgien" />
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Group>
                                        {surgeons.map((surgeon) => (
                                            <Select.Item key={surgeon.id} value={surgeon.id}>
                                                {surgeon.name} {surgeon.specialty ? `(${surgeon.specialty})` : ''}
                                            </Select.Item>
                                        ))}
                                    </Select.Group>
                                </Select.Content>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {!currentAssignment ? (
                            <Button
                                onClick={() => handleAssignmentChange('add')}
                                disabled={disabled || isLoading || !selectedRoom || !selectedSurgeon}
                                className="flex gap-2 items-center"
                            >
                                <Pencil size={16} />
                                Ajouter l'affectation
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => handleAssignmentChange('update')}
                                    disabled={disabled || isLoading || !selectedSurgeon || currentAssignment.surgeonId === selectedSurgeon}
                                    className="flex gap-2 items-center"
                                >
                                    <Pencil size={16} />
                                    Modifier
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAssignmentChange('delete')}
                                    disabled={disabled || isLoading}
                                    className="flex gap-2 items-center"
                                >
                                    <XCircle size={16} />
                                    Supprimer
                                </Button>
                            </>
                        )}
                    </div>

                    {currentAssignment && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <h3 className="text-sm font-medium text-blue-800">Affectation actuelle</h3>
                            <p className="text-sm mt-1">
                                Salle: {rooms.find(r => r.id === currentAssignment.roomId)?.name || 'Inconnue'}
                                <br />
                                Chirurgien: {surgeons.find(s => s.id === currentAssignment.surgeonId)?.name || 'Non assigné'}
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="validation" className="space-y-3 mt-4">
                    {validationResult && (
                        <>
                            <div className={`p-3 rounded-md ${validationResult.isValid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                <div className="flex items-center gap-2">
                                    {validationResult.isValid ? (
                                        <CheckCircle className="text-green-500" size={20} />
                                    ) : (
                                        <AlertTriangle className="text-yellow-500" size={20} />
                                    )}
                                    <h3 className={`font-medium ${validationResult.isValid ? 'text-green-800' : 'text-yellow-800'}`}>
                                        {validationResult.isValid
                                            ? 'Affectation valide'
                                            : validationResult.conflicts.some(c => c.severity === 'error')
                                                ? 'Affectation invalide'
                                                : 'Affectation avec avertissements'}
                                    </h3>
                                </div>
                            </div>

                            {validationResult.conflicts.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <h4 className="text-sm font-medium">Problèmes détectés:</h4>
                                    <ul className="space-y-1">
                                        {validationResult.conflicts.map((conflict, index) => (
                                            <li
                                                key={index}
                                                className={`text-sm py-1 px-2 rounded-md flex gap-2 items-start ${conflict.severity === 'error'
                                                        ? 'bg-red-50 text-red-800 border-l-2 border-red-500'
                                                        : 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-500'
                                                    }`}
                                            >
                                                {conflict.severity === 'error' ? (
                                                    <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                                )}
                                                <span>{conflict.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setActiveTab('attribution');
                                        setValidationResult(null);
                                    }}
                                >
                                    Retour
                                </Button>
                                {validationResult.conflicts.some(c => c.severity === 'error') ? (
                                    <Button disabled className="flex gap-2 items-center">
                                        <XCircle size={16} />
                                        Impossible de continuer
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleAssignmentChange(currentAssignment ? 'update' : 'add')}
                                        disabled={isLoading}
                                        className="flex gap-2 items-center"
                                    >
                                        {validationResult.conflicts.length > 0 ? (
                                            <>
                                                <AlertTriangle size={16} />
                                                Continuer malgré les avertissements
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                Confirmer l'affectation
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </Card>
    );
} 