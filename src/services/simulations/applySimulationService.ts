import { PrismaClient, SimulationStatus, Assignment, Leave } from '@prisma/client';
import { simulationNotificationService } from './notificationService';

jest.mock('@/lib/prisma');


const prisma = prisma;

/**
 * Options pour l'application d'une simulation au planning réel
 */
export interface ApplySimulationOptions {
    /** Si vrai, supprime toutes les affectations existantes dans la période avant d'appliquer les nouvelles */
    clearExistingAssignments?: boolean;
    /** Si vrai, crée également les congés validés de la simulation */
    includeLeaves?: boolean;
    /** Si vrai, inclut les affectations de garde/astreinte */
    includeOnCall?: boolean;
    /** ID utilisateur qui effectue l'opération */
    userId: string;
    /** Notes sur l'application de la simulation */
    notes?: string;
}

/**
 * Résultat de l'application d'une simulation
 */
export interface ApplySimulationResult {
    success: boolean;
    assignmentsCreated: number;
    assignmentsUpdated: number;
    leavesCreated: number;
    conflicts: any[];
    date: string;
    message?: string;
    error?: string;
}

/**
 * Service pour appliquer les résultats d'une simulation au planning réel
 */
export class ApplySimulationService {
    /**
     * Applique les résultats d'une simulation au planning réel
     */
    async applySimulationToPlanning(
        simulationResultId: string,
        options: ApplySimulationOptions
    ): Promise<ApplySimulationResult> {
        try {
            // 1. Récupérer les résultats de la simulation
            const simulationResult = await prisma.simulationResult.findUnique({
                where: { id: simulationResultId },
                include: {
                    scenario: true
                }
            });

            if (!simulationResult) {
                throw new Error('Résultat de simulation non trouvé');
            }

            if (simulationResult.status !== SimulationStatus.COMPLETED) {
                throw new Error('Impossible d\'appliquer une simulation non terminée');
            }

            // Récupérer les données de résultat de la simulation
            const resultData = simulationResult.resultData as any;
            if (!resultData || !resultData.simulatedPeriod) {
                throw new Error('Données de simulation invalides ou vides');
            }

            // 2. Extraire la période simulée
            const startDate = new Date(resultData.simulatedPeriod.from);
            const endDate = new Date(resultData.simulatedPeriod.to);

            // 3. Si demandé, supprimer toutes les affectations existantes dans cette période
            if (options.clearExistingAssignments) {
                await this.clearExistingAssignments(startDate, endDate);
            }

            // 4. Convertir et appliquer les résultats
            const assignments = await this.extractAssignmentsFromSimulation(resultData, simulationResult.scenario.id);
            const leaves = options.includeLeaves ? await this.extractLeavesFromSimulation(resultData) : [];

            // 5. Journaliser l'application
            const log = await this.logSimulationApplication(
                simulationResultId,
                options.userId,
                assignments.length,
                leaves.length,
                options.notes
            );

            // 6. Créer les affectations extraites
            const assignmentResults = await this.createAssignments(assignments);

            // 7. Créer les congés si demandé
            let leaveResults = { created: 0, conflicts: [] };
            if (options.includeLeaves && leaves.length > 0) {
                leaveResults = await this.createLeaves(leaves);
            }

            // 8. Créer le résultat
            const result: ApplySimulationResult = {
                success: true,
                assignmentsCreated: assignmentResults.created,
                assignmentsUpdated: assignmentResults.updated,
                leavesCreated: leaveResults.created,
                conflicts: [...assignmentResults.conflicts, ...leaveResults.conflicts],
                date: new Date().toISOString(),
                message: `Simulation appliquée avec succès. ${assignmentResults.created} affectations créées, ${assignmentResults.updated} mises à jour, ${leaveResults.created} congés créés.`
            };

            // 9. Notifier l'utilisateur
            await this.notifySimulationApplied(
                simulationResult.scenarioId,
                options.userId,
                result
            );

            return result;
        } catch (error) {
            console.error('Erreur lors de l\'application de la simulation:', error);

            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

            // Notifier de l'erreur
            await this.notifySimulationApplyError(
                simulationResultId,
                options.userId,
                errorMessage
            );

            return {
                success: false,
                assignmentsCreated: 0,
                assignmentsUpdated: 0,
                leavesCreated: 0,
                conflicts: [],
                date: new Date().toISOString(),
                error: errorMessage
            };
        }
    }

    /**
     * Efface les affectations existantes dans la période spécifiée
     */
    private async clearExistingAssignments(startDate: Date, endDate: Date): Promise<number> {
        // Supprimer les affectations existantes dans la période
        const { count } = await prisma.assignment.deleteMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        return count;
    }

    /**
     * Extrait les affectations à partir des résultats de simulation
     */
    private async extractAssignmentsFromSimulation(
        resultData: any,
        scenarioId: string
    ): Promise<Partial<Assignment>[]> {
        // Vérifier si les données de simulation contiennent des affectations
        if (!resultData.assignments || !Array.isArray(resultData.assignments)) {
            // Si les données ne sont pas dans le format attendu, on utilise un format alternatif
            return this.extractAssignmentsAlternative(resultData, scenarioId);
        }

        // Conversion des affectations simulées en affectations réelles
        return resultData.assignments.map((simAssignment: any) => {
            return {
                userId: simAssignment.userId,
                date: new Date(simAssignment.date),
                periode: simAssignment.periode,
                type: simAssignment.type,
                location: simAssignment.location,
                notes: `Créé depuis simulation: ${scenarioId}`,
                createdFromSimulation: true,
                simulationScenarioId: scenarioId,
                // Autres champs selon le modèle Assignment
            };
        });
    }

    /**
     * Méthode alternative d'extraction des affectations
     * pour les formats de données différents
     */
    private extractAssignmentsAlternative(resultData: any, scenarioId: string): Partial<Assignment>[] {
        const assignments: Partial<Assignment>[] = [];

        // Extraire à partir de la distribution des postes si disponible
        if (resultData.shiftDistribution && Array.isArray(resultData.shiftDistribution)) {
            const startDate = new Date(resultData.simulatedPeriod.from);
            const days = resultData.simulatedPeriod.totalDays || 7;

            // Pour chaque utilisateur dans la distribution
            resultData.shiftDistribution.forEach((userShift: any) => {
                if (!userShift.userName) return;

                // Trouver l'ID utilisateur à partir du nom (simplification - dans un cas réel, il faudrait une requête DB)
                // Note: cette partie devrait être remplacée par une requête réelle
                const userId = 1; // placeholder, à remplacer par une recherche d'utilisateur

                // Générer des affectations basées sur la distribution
                for (let i = 0; i < userShift.morningShifts; i++) {
                    const dayOffset = Math.floor(Math.random() * days);
                    const assignmentDate = new Date(startDate);
                    assignmentDate.setDate(assignmentDate.getDate() + dayOffset);

                    assignments.push({
                        userId,
                        date: assignmentDate,
                        periode: 'MATIN',
                        type: 'BLOC_OPERATOIRE',
                        notes: `Créé depuis simulation: ${scenarioId} (distribution)`,
                        createdFromSimulation: true,
                        simulationScenarioId: scenarioId
                    });
                }

                // De même pour les autres types de postes
                for (let i = 0; i < userShift.afternoonShifts; i++) {
                    const dayOffset = Math.floor(Math.random() * days);
                    const assignmentDate = new Date(startDate);
                    assignmentDate.setDate(assignmentDate.getDate() + dayOffset);

                    assignments.push({
                        userId,
                        date: assignmentDate,
                        periode: 'APRES_MIDI',
                        type: 'BLOC_OPERATOIRE',
                        notes: `Créé depuis simulation: ${scenarioId} (distribution)`,
                        createdFromSimulation: true,
                        simulationScenarioId: scenarioId
                    });
                }
            });
        }

        return assignments;
    }

    /**
     * Extrait les congés à partir des résultats de simulation
     */
    private async extractLeavesFromSimulation(resultData: any): Promise<Partial<Leave>[]> {
        // Si les données ne contiennent pas de détails sur les congés
        if (!resultData.leaveRequests || !resultData.leaveRequests.approved) {
            return [];
        }

        // Dans un cas réel, on extrairait les détails des congés depuis les données de résultat
        // Pour cette implémentation, nous retournons un tableau vide
        return [];
    }

    /**
     * Journalise l'application d'une simulation au planning
     */
    private async logSimulationApplication(
        simulationResultId: string,
        userId: string,
        assignmentsCount: number,
        leavesCount: number,
        notes?: string
    ): Promise<any> {
        return await prisma.auditLog.create({
            data: {
                userId: parseInt(userId),
                action: 'SIMULATION_APPLIED',
                targetType: 'SIMULATION_RESULT',
                targetId: simulationResultId,
                details: {
                    assignmentsCount,
                    leavesCount,
                    notes: notes || 'Application de simulation au planning réel'
                }
            }
        });
    }

    /**
     * Crée les affectations dans la base de données
     */
    private async createAssignments(assignments: Partial<Assignment>[]): Promise<{
        created: number;
        updated: number;
        conflicts: any[];
    }> {
        let created = 0;
        let updated = 0;
        const conflicts: any[] = [];

        for (const assignment of assignments) {
            try {
                // Vérifier si une affectation existe déjà pour cet utilisateur à cette date et période
                const existing = await prisma.assignment.findFirst({
                    where: {
                        userId: assignment.userId,
                        date: assignment.date,
                        periode: assignment.periode
                    }
                });

                if (existing) {
                    // Mettre à jour l'existant
                    await prisma.assignment.update({
                        where: { id: existing.id },
                        data: {
                            ...assignment,
                            updatedAt: new Date()
                        }
                    });
                    updated++;
                } else {
                    // Créer une nouvelle affectation
                    await prisma.assignment.create({
                        data: assignment as any
                    });
                    created++;
                }
            } catch (error) {
                console.error('Erreur lors de la création d\'une affectation:', error);
                conflicts.push({
                    type: 'ASSIGNMENT_CREATION_ERROR',
                    assignment,
                    error: error instanceof Error ? error.message : 'Erreur inconnue'
                });
            }
        }

        return { created, updated, conflicts };
    }

    /**
     * Crée les congés dans la base de données
     */
    private async createLeaves(leaves: Partial<Leave>[]): Promise<{
        created: number;
        conflicts: any[];
    }> {
        let created = 0;
        const conflicts: any[] = [];

        for (const leave of leaves) {
            try {
                // Créer un nouveau congé
                await prisma.leave.create({
                    data: leave as any
                });
                created++;
            } catch (error) {
                console.error('Erreur lors de la création d\'un congé:', error);
                conflicts.push({
                    type: 'LEAVE_CREATION_ERROR',
                    leave,
                    error: error instanceof Error ? error.message : 'Erreur inconnue'
                });
            }
        }

        return { created, conflicts };
    }

    /**
     * Envoie une notification à l'utilisateur concernant l'application de la simulation
     */
    private async notifySimulationApplied(
        scenarioId: string,
        userId: string,
        result: ApplySimulationResult
    ): Promise<void> {
        try {
            // Récupérer le nom du scénario
            const scenario = await prisma.simulationScenario.findUnique({
                where: { id: scenarioId },
                select: { name: true }
            });

            if (!scenario) return;

            // Créer une notification dans la base de données
            await prisma.notification.create({
                data: {
                    userId: parseInt(userId),
                    type: 'SIMULATION_APPLIED', // Assurez-vous que ce type existe dans votre enum NotificationType
                    title: 'Simulation appliquée au planning',
                    content: `La simulation "${scenario.name}" a été appliquée au planning réel`,
                    contextId: scenarioId,
                    data: result
                }
            });

            // Vous pourriez également utiliser Pusher ou un autre mécanisme pour les notifications temps réel
        } catch (error) {
            console.error('Erreur lors de la notification d\'application de simulation:', error);
        }
    }

    /**
     * Envoie une notification d'erreur lors de l'application d'une simulation
     */
    private async notifySimulationApplyError(
        simulationResultId: string,
        userId: string,
        error: string
    ): Promise<void> {
        try {
            // Récupérer le scénario associé au résultat
            const result = await prisma.simulationResult.findUnique({
                where: { id: simulationResultId },
                include: { scenario: true }
            });

            if (!result || !result.scenario) return;

            // Créer une notification d'erreur
            await prisma.notification.create({
                data: {
                    userId: parseInt(userId),
                    type: 'SIMULATION_ERROR', // Assurez-vous que ce type existe dans votre enum NotificationType
                    title: 'Erreur d\'application de simulation',
                    content: `Erreur lors de l'application de la simulation "${result.scenario.name}" au planning`,
                    contextId: result.scenario.id,
                    data: { error }
                }
            });
        } catch (err) {
            console.error('Erreur lors de la notification d\'erreur d\'application de simulation:', err);
        }
    }
}

// Exporter une instance singleton
export const applySimulationService = new ApplySimulationService(); 