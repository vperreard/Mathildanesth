import React, { useState, useEffect } from 'react';
import { DragDropAssignmentEditor } from './planning/hebdomadaire/components';
import { Medecin, FatigueState } from '@/modules/rules/engine/fatigue-system';
import { Attribution, RuleSeverity } from '@/types/attribution';
import { RuleEngine } from '@/modules/rules/engine/rule-engine';
import { v4 as uuidv4 } from 'uuid';

// Fonction pour générer des données de démonstration
const generateDemoData = () => {
    // Générer des médecins fictifs
    const medecins: Medecin[] = Array.from({ length: 5 }).map((_, index) => ({
        id: `${index + 1}`,
        nom: `Dupont${index + 1}`,
        prenom: `Jean${index + 1}`,
        fatigue: {
            score: Math.floor(Math.random() * 80) + 10, // Score entre 10 et 90
            history: [],
            lastUpdate: new Date()
        } as FatigueState,
    }));

    // Dates de début et fin pour la semaine
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Générer des affectations fictives
    const attributions: Attribution[] = [];

    const assignmentTypes = ['GARDE', 'ASTREINTE', 'CONSULTATION', 'BLOC'];
    const shifts = ['matin', 'apresmidi', 'nuit', 'full'];

    // Pour chaque médecin, créer des affectations aléatoires
    medecins.forEach(medecin => {
        // Nombre aléatoire d'affectations par médecin (1-7)
        const assignmentCount = Math.floor(Math.random() * 7) + 1;

        for (let i = 0; i < assignmentCount; i++) {
            // Date aléatoire dans la semaine
            const date = new Date(startDate);
            date.setDate(date.getDate() + Math.floor(Math.random() * 7));

            attributions.push({
                id: uuidv4(),
                userId: parseInt(medecin.id),
                date,
                type: assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)] as any,
                shift: shifts[Math.floor(Math.random() * shifts.length)] as any,
                secteur: `Secteur ${Math.floor(Math.random() * 3) + 1}`,
                salle: `Salle ${Math.floor(Math.random() * 5) + 1}`,
                confirmed: Math.random() > 0.3, // 70% des affectations sont confirmées
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    });

    return { medecins, startDate, endDate, attributions };
};

// Mock du moteur de règles pour la démo
const createMockRuleEngine = () => {
    const mockRuleEngine = {
        evaluate: async (context: unknown) => {
            // Simuler un délai de traitement
            await new Promise(resolve => setTimeout(resolve, 500));

            // Générer des violations aléatoires
            const generateRandomViolations = () => {
                const violations = [];
                const violationTypes = [
                    'CONSECUTIVE_SHIFTS',
                    'WEEKEND_OVERLOAD',
                    'FATIGUE_LIMIT',
                    'EQUITY_VIOLATION'
                ];

                const violationMessages = {
                    'CONSECUTIVE_SHIFTS': "Shifts consécutifs sans période de repos suffisante",
                    'WEEKEND_OVERLOAD': "Trop de week-ends travaillés consécutifs",
                    'FATIGUE_LIMIT': "Niveau de fatigue critique atteint",
                    'EQUITY_VIOLATION': "Distribution inéquitable des gardes"
                };

                // 50% de chance d'avoir des violations
                if (Math.random() > 0.5) {
                    // Nombre aléatoire de violations (1-3)
                    const violationCount = Math.floor(Math.random() * 3) + 1;

                    for (let i = 0; i < violationCount; i++) {
                        const type = violationTypes[Math.floor(Math.random() * violationTypes.length)];
                        const severity = Math.random() > 0.7 ? 'ERROR' : 'WARNING';

                        // Sélectionner 1-2 affectations aléatoires pour la violation
                        const affectedCount = Math.floor(Math.random() * 2) + 1;
                        const affectedAssignmentIds = [];

                        for (let j = 0; j < affectedCount; j++) {
                            if (context.attributions.length > 0) {
                                const randomIndex = Math.floor(Math.random() * context.attributions.length);
                                affectedAssignmentIds.push(context.attributions[randomIndex].id);
                            }
                        }

                        violations.push({
                            ruleId: `rule-${i + 1}`,
                            ruleType: type,
                            severity,
                            message: violationMessages[type as keyof typeof violationMessages],
                            affectedAssignmentIds
                        });
                    }
                }

                return violations;
            };

            const violations = generateRandomViolations();

            return {
                isValid: violations.length === 0,
                violations,
                warnings: [],
                score: Math.floor(Math.random() * 100)
            };
        }
    };

    return mockRuleEngine as RuleEngine;
};

export default function DragAndDropDemo() {
    const [demoData, setDemoData] = useState<{
        medecins: Medecin[];
        startDate: Date;
        endDate: Date;
        attributions: Attribution[];
        ruleEngine: RuleEngine;
    } | null>(null);

    useEffect(() => {
        // Générer les données de démonstration
        const { medecins, startDate, endDate, attributions } = generateDemoData();
        const ruleEngine = createMockRuleEngine();

        setDemoData({ medecins, startDate, endDate, attributions, ruleEngine });
    }, []);

    const handleAssignmentsChange = (newAssignments: Attribution[]) => {
        if (demoData) {
            setDemoData({
                ...demoData,
                attributions: newAssignments
            });
        }
    };

    if (!demoData) {
        return <div className="p-10 text-center">Chargement de la démonstration...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Démonstration de l'Éditeur Drag & Drop</h1>
            <p className="mb-6">
                Cette démo présente l'interface de modification d'affectations par glisser-déposer avec
                détection en temps réel des violations de règles et suggestions automatiques pour résoudre les conflits.
            </p>

            <div className="bg-white shadow-md rounded-lg p-6">
                <DragDropAssignmentEditor
                    attributions={demoData.attributions}
                    medecins={demoData.medecins}
                    startDate={demoData.startDate}
                    endDate={demoData.endDate}
                    ruleEngine={demoData.ruleEngine}
                    onAssignmentsChange={handleAssignmentsChange}
                />
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-md text-sm">
                <p className="font-semibold">Instructions:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Glissez les affectations d'une cellule à une autre pour les déplacer</li>
                    <li>Observez les violations de règles qui s'affichent en temps réel</li>
                    <li>Cliquez sur une violation pour voir les options de résolution</li>
                    <li>Les éléments en surbrillance ont des conflits détectés</li>
                </ul>
            </div>
        </div>
    );
} 