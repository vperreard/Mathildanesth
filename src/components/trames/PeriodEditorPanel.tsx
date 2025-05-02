import React, { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Clock, ArrowUpDown } from 'lucide-react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TramePeriod } from '@/services/trameAffectationService';

interface PeriodEditorPanelProps {
    periods: TramePeriod[];
    onPeriodsChange: (periods: TramePeriod[]) => void;
    isLocked?: boolean;
}

const PeriodEditorPanel: React.FC<PeriodEditorPanelProps> = ({
    periods,
    onPeriodsChange,
    isLocked = false
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState<TramePeriod | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Fonction pour ouvrir le dialogue d'ajout de période
    const handleAddPeriod = () => {
        const newPeriod: TramePeriod = {
            id: '',
            name: '',
            startTime: '08:00',
            endTime: '12:00',
            color: '#4CAF50',
            isActive: true,
            isLocked: false,
            assignments: []
        };

        setCurrentPeriod(newPeriod);
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    // Fonction pour ouvrir le dialogue d'édition d'une période existante
    const handleEditPeriod = (period: TramePeriod) => {
        setCurrentPeriod({ ...period });
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    // Fonction pour supprimer une période
    const handleDeletePeriod = (periodId: string) => {
        const updatedPeriods = periods.filter(period => period.id !== periodId);
        onPeriodsChange(updatedPeriods);
    };

    // Fonction pour sauvegarder une période (nouvelle ou modifiée)
    const handleSavePeriod = () => {
        if (!currentPeriod) return;

        const updatedPeriods = isEditing
            ? periods.map(p => p.id === currentPeriod.id ? currentPeriod : p)
            : [...periods, {
                ...currentPeriod,
                id: currentPeriod.id || `period-${Date.now()}`
            }];

        onPeriodsChange(updatedPeriods);
        setIsDialogOpen(false);
    };

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentPeriod) return;

        const { name, value, type } = e.target;
        setCurrentPeriod({
            ...currentPeriod,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        });
    };

    // Fonction pour déplacer une période vers le haut
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const updatedPeriods = [...periods];
        [updatedPeriods[index], updatedPeriods[index - 1]] = [updatedPeriods[index - 1], updatedPeriods[index]];
        onPeriodsChange(updatedPeriods);
    };

    // Fonction pour déplacer une période vers le bas
    const handleMoveDown = (index: number) => {
        if (index === periods.length - 1) return;
        const updatedPeriods = [...periods];
        [updatedPeriods[index], updatedPeriods[index + 1]] = [updatedPeriods[index + 1], updatedPeriods[index]];
        onPeriodsChange(updatedPeriods);
    };

    // Formatage de l'heure pour l'affichage
    const formatTime = (time: string): string => {
        return time || '';
    };

    // Calcul de la durée entre deux heures au format "HH:MM"
    const calculateDuration = (startTime: string, endTime: string): string => {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

        // Si la durée est négative, on suppose que la période s'étend sur le jour suivant
        if (durationMinutes < 0) {
            durationMinutes += 24 * 60;
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `${hours}h${minutes < 10 ? '0' + minutes : minutes}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Périodes</h3>
                <Button
                    onClick={handleAddPeriod}
                    size="sm"
                    disabled={isLocked}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une période
                </Button>
            </div>

            {periods.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ordre</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Début</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Couleur</TableHead>
                            <TableHead>Assignations</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {periods.map((period, index) => (
                            <TableRow key={period.id || index}>
                                <TableCell>
                                    <div className="flex flex-col items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0 || isLocked}
                                            className="h-6 w-6 p-0"
                                        >
                                            <ArrowUpDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        <span className="font-medium">{index + 1}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === periods.length - 1 || isLocked}
                                            className="h-6 w-6 p-0"
                                        >
                                            <ArrowUpDown className="h-4 w-4 -rotate-90" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>{period.name}</TableCell>
                                <TableCell>{formatTime(period.startTime)}</TableCell>
                                <TableCell>{formatTime(period.endTime)}</TableCell>
                                <TableCell>{calculateDuration(period.startTime, period.endTime)}</TableCell>
                                <TableCell>
                                    <div
                                        className="w-6 h-6 rounded-md"
                                        style={{ backgroundColor: period.color }}
                                    />
                                </TableCell>
                                <TableCell>{period.assignments?.length || 0}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditPeriod(period)}
                                            disabled={isLocked || period.isLocked}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletePeriod(period.id)}
                                            disabled={isLocked || period.isLocked}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center p-4 border rounded-md">
                    <p className="text-muted-foreground">Aucune période définie</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Cliquez sur "Ajouter une période" pour commencer
                    </p>
                </div>
            )}

            {/* Dialogue d'ajout/édition de période */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Modifier la période' : 'Ajouter une période'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">
                                    Nom de la période
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={currentPeriod?.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="ex: Matin, Après-midi..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="color" className="text-sm font-medium">
                                    Couleur
                                </label>
                                <div className="flex space-x-2">
                                    <Input
                                        id="color"
                                        name="color"
                                        type="color"
                                        value={currentPeriod?.color || '#4CAF50'}
                                        onChange={handleInputChange}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        name="color"
                                        value={currentPeriod?.color || '#4CAF50'}
                                        onChange={handleInputChange}
                                        className="flex-grow"
                                        placeholder="#RRGGBB"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="startTime" className="text-sm font-medium flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Heure de début
                                </label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    value={currentPeriod?.startTime || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="endTime" className="text-sm font-medium flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Heure de fin
                                </label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    value={currentPeriod?.endTime || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="isActive"
                                name="isActive"
                                type="checkbox"
                                className="h-4 w-4"
                                checked={currentPeriod?.isActive ?? true}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">
                                Période active
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleSavePeriod}>
                            {isEditing ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PeriodEditorPanel; 