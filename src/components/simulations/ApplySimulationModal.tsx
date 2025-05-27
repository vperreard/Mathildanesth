'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckIcon } from 'lucide-react';

type SimulationResult = {
    id: string;
    scenarioId: string;
    scenarioName?: string;
    status: string;
};

interface ApplySimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    simulationResult: SimulationResult;
    onSuccess?: () => void;
}

/**
 * Modal pour appliquer les résultats d'une simulation au planning réel
 */
export function ApplySimulationModal({
    isOpen,
    onClose,
    simulationResult,
    onSuccess,
}: ApplySimulationModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({
        clearExistingAssignments: false,
        includeLeaves: false,
        includeOnCall: true,
    });
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [conflicts, setConflicts] = useState<any[]>([]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            setConflicts([]);

            // Appeler l'API pour appliquer la simulation
            const response = await fetch('http://localhost:3000/api/simulations/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    simulationResultId: simulationResult.id,
                    ...options,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Une erreur est survenue lors de l\'application de la simulation');
                if (data.conflicts) {
                    setConflicts(data.conflicts);
                }
                return;
            }

            // Succès
            toast.success('Simulation appliquée au planning avec succès', {
                description: data.message,
            });

            // Fermer le modal
            onClose();

            // Rafraîchir la page si nécessaire
            if (onSuccess) {
                onSuccess();
            } else {
                // Rediriger vers la page du planning
                router.push('/planning/hebdomadaire');
                router.refresh();
            }
        } catch (error) {
            console.error('Erreur lors de l\'application de la simulation:', error);
            setError('Une erreur est survenue lors de la communication avec le serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Appliquer la simulation au planning réel</DialogTitle>
                    <DialogDescription>
                        Vous êtes sur le point d'appliquer les résultats de la simulation au planning réel.
                        Cette action aura un impact direct sur les affectations visibles par les utilisateurs.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="warning" className="bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Attention</AlertTitle>
                        <AlertDescription>
                            L'application des résultats d'une simulation au planning réel est une action
                            importante qui peut affecter le planning de plusieurs personnes.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="clearExisting"
                                checked={options.clearExistingAssignments}
                                onCheckedChange={(checked) =>
                                    setOptions({
                                        ...options,
                                        clearExistingAssignments: checked === true,
                                    })
                                }
                            />
                            <Label htmlFor="clearExisting" className="cursor-pointer">
                                Supprimer les affectations existantes dans la période
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeLeaves"
                                checked={options.includeLeaves}
                                onCheckedChange={(checked) =>
                                    setOptions({
                                        ...options,
                                        includeLeaves: checked === true,
                                    })
                                }
                            />
                            <Label htmlFor="includeLeaves" className="cursor-pointer">
                                Inclure les congés validés de la simulation
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeOnCall"
                                checked={options.includeOnCall}
                                onCheckedChange={(checked) =>
                                    setOptions({
                                        ...options,
                                        includeOnCall: checked === true,
                                    })
                                }
                            />
                            <Label htmlFor="includeOnCall" className="cursor-pointer">
                                Inclure les gardes et astreintes
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes sur cette application (optionnel)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Raisons de l'application, notes pour l'équipe, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {conflicts.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Conflits détectés ({conflicts.length})</AlertTitle>
                            <AlertDescription>
                                Des conflits ont été détectés lors de l'application de la simulation.
                                Veuillez consulter les logs pour plus de détails.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">↻</span>
                                Application en cours...
                            </>
                        ) : (
                            <>
                                <CheckIcon size={16} />
                                Appliquer au planning
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 