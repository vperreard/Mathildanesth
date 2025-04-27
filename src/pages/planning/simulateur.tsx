'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PlanningSimulatorComponent from '../../components/PlanningSimulator';
import { Assignment, GenerationParameters, AssignmentType } from '../../types/assignment';
import { User } from '../../types/user';
import { defaultRulesConfiguration } from '../../types/rules';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import Button from '../../components/ui/button';

// Page du simulateur multi-planning
export default function SimulateurPage() {
    const router = useRouter();
    const [personnel, setPersonnel] = useState<User[]>([]);
    const [existingAssignments, setExistingAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);

    // Paramètres par défaut pour la génération
    const defaultParameters: GenerationParameters = {
        dateDebut: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        dateFin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        etapesActives: [
            AssignmentType.GARDE,
            AssignmentType.ASTREINTE,
            AssignmentType.CONSULTATION,
            AssignmentType.BLOC
        ],
        conserverAffectationsExistantes: true,
        niveauOptimisation: 'standard',
        appliquerPreferencesPersonnelles: true,
        poidsEquite: 0.5,
        poidsPreference: 0.5,
        poidsQualiteVie: 0.5
    };

    // Chargement des données au démarrage
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Chargement du personnel (utilisateurs actifs)
                const personnelResponse = await fetch('/api/users?status=active');
                if (!personnelResponse.ok) {
                    throw new Error('Erreur lors du chargement des utilisateurs');
                }
                const personnelData = await personnelResponse.json();
                setPersonnel(personnelData);

                // Chargement des affectations existantes pour le mois en cours
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

                const assignmentsResponse = await fetch(`/api/assignments?start=${firstDay}&end=${lastDay}`);
                if (!assignmentsResponse.ok) {
                    throw new Error('Erreur lors du chargement des affectations');
                }
                const assignmentsData = await assignmentsResponse.json();
                setExistingAssignments(assignmentsData);

                setLoading(false);
            } catch (err) {
                setError(`Erreur de chargement: ${err instanceof Error ? err.message : String(err)}`);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Gestion de l'application d'une simulation
    const handleSimulationApplied = (assignments: Assignment[]) => {
        setSelectedAssignments(assignments);
        setShowConfirmDialog(true);
    };

    // Confirme l'application du planning sélectionné
    const handleConfirmApply = async () => {
        try {
            setLoading(true);

            // Appel à l'API pour enregistrer les nouvelles affectations
            const response = await fetch('/api/assignments/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assignments: selectedAssignments })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'enregistrement du planning');
            }

            // Ferme la boîte de dialogue et redirige vers le calendrier
            setShowConfirmDialog(false);
            router.push('/planning/calendrier');
        } catch (err) {
            setError(`Erreur d'application: ${err instanceof Error ? err.message : String(err)}`);
            setLoading(false);
        }
    };

    // Si les données sont en cours de chargement
    if (loading && personnel.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Simulateur Multi-Planning</h1>

            {error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-6">
                    {error}
                    <Button
                        onClick={() => window.location.reload()}
                        className="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded"
                    >
                        Réessayer
                    </Button>
                </div>
            ) : (
                <PlanningSimulatorComponent
                    initialParameters={defaultParameters}
                    personnel={personnel}
                    existingAssignments={existingAssignments}
                    onSimulationApplied={handleSimulationApplied}
                />
            )}

            {/* Boîte de dialogue de confirmation */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer l'application du planning</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-4">
                            Vous êtes sur le point d'appliquer la simulation sélectionnée au planning actuel.
                            Cette action va créer ou modifier {selectedAssignments.length} affectations.
                        </p>
                        <p className="mb-4 font-medium">
                            Cette action ne peut pas être annulée automatiquement.
                        </p>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmDialog(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleConfirmApply}
                                disabled={loading}
                            >
                                {loading ? 'Application en cours...' : 'Confirmer et appliquer'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 