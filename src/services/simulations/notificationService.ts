// Service de notifications pour les simulations longues
import { PrismaClient, Notification, NotificationType, SimulationStatus } from '@prisma/client';
import { pusherServer } from '@/lib/pusher';

const prisma = new PrismaClient();

/**
 * Événements de notification pour les simulations
 */
export enum SimulationEvent {
    STARTED = 'simulation.started',
    PROGRESS = 'simulation.progress',
    COMPLETED = 'simulation.completed',
    FAILED = 'simulation.failed'
}

export interface SimulationProgress {
    scenarioId: string;
    progress: number; // 0-100
    status: 'queued' | 'running' | 'completed' | 'failed';
    currentStep?: string;
    estimatedTimeRemaining?: number; // en secondes
    message?: string;
}

export class SimulationNotificationService {
    // Mise à jour du statut de la simulation dans la base de données
    private async updateSimulationStatus(
        scenarioId: string,
        status: string,
        progress: number = 0,
        message?: string
    ) {
        try {
            await prisma.simulationResult.updateMany({
                where: {
                    scenarioId,
                    status: {
                        in: [SimulationStatus.PENDING, SimulationStatus.RUNNING]
                    }
                },
                data: {
                    statusDetails: {
                        status,
                        progress,
                        message,
                        lastUpdated: new Date()
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de simulation:', error);
        }
    }

    // Notification du démarrage d'une simulation
    async notifySimulationStarted(
        scenarioId: string,
        userId: string,
        estimatedDuration?: number
    ) {
        try {
            // 1. Récupérer le scénario pour avoir son nom
            const scenario = await prisma.simulationScenario.findUnique({
                where: { id: scenarioId },
                select: { name: true }
            });

            if (!scenario) return;

            // 2. Créer une notification dans la base de données
            await prisma.notification.create({
                data: {
                    userId,
                    type: NotificationType.SIMULATION_STARTED,
                    title: 'Simulation démarrée',
                    content: `La simulation "${scenario.name}" a démarré`,
                    contextId: scenarioId,
                    data: {
                        scenarioId,
                        estimatedDuration
                    }
                }
            });

            // 3. Mettre à jour le statut de la simulation
            await this.updateSimulationStatus(
                scenarioId,
                'running',
                0,
                'Simulation démarrée'
            );

            // 4. Envoyer une notification temps réel via Pusher
            const channelName = `private-user-${userId}`;
            await pusherServer.trigger(
                channelName,
                SimulationEvent.STARTED,
                {
                    scenarioId,
                    scenarioName: scenario.name,
                    estimatedDuration,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Erreur lors de la notification de démarrage de simulation:', error);
        }
    }

    // Notification de la progression d'une simulation
    async notifySimulationProgress(
        scenarioId: string,
        userId: string,
        progress: SimulationProgress
    ) {
        try {
            // 1. Mettre à jour le statut de la simulation
            await this.updateSimulationStatus(
                scenarioId,
                progress.status,
                progress.progress,
                progress.message
            );

            // 2. Envoyer une notification temps réel via Pusher
            const channelName = `private-user-${userId}`;
            await pusherServer.trigger(
                channelName,
                SimulationEvent.PROGRESS,
                {
                    ...progress,
                    timestamp: new Date().toISOString()
                }
            );

            // 3. Si on atteint certains jalons clés (25%, 50%, 75%), créer une notification persistante
            if (progress.progress === 25 || progress.progress === 50 || progress.progress === 75) {
                const scenario = await prisma.simulationScenario.findUnique({
                    where: { id: scenarioId },
                    select: { name: true }
                });

                if (scenario) {
                    await prisma.notification.create({
                        data: {
                            userId,
                            type: NotificationType.SIMULATION_PROGRESS,
                            title: 'Progression de la simulation',
                            content: `La simulation "${scenario.name}" est à ${progress.progress}%`,
                            contextId: scenarioId,
                            data: {
                                scenarioId,
                                progress: progress.progress
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la notification de progression de simulation:', error);
        }
    }

    // Notification de la fin d'une simulation
    async notifySimulationCompleted(
        scenarioId: string,
        userId: string,
        resultId: string,
        executionTimeSeconds?: number
    ) {
        try {
            // 1. Récupérer le scénario pour avoir son nom
            const scenario = await prisma.simulationScenario.findUnique({
                where: { id: scenarioId },
                select: { name: true }
            });

            if (!scenario) return;

            // 2. Créer une notification persistante
            await prisma.notification.create({
                data: {
                    userId,
                    type: NotificationType.SIMULATION_COMPLETED,
                    title: 'Simulation terminée',
                    content: `La simulation "${scenario.name}" est terminée`,
                    contextId: scenarioId,
                    data: {
                        scenarioId,
                        resultId,
                        executionTime: executionTimeSeconds
                    }
                }
            });

            // 3. Mettre à jour le statut de la simulation
            await this.updateSimulationStatus(
                scenarioId,
                'completed',
                100,
                'Simulation terminée'
            );

            // 4. Envoyer une notification temps réel via Pusher
            const channelName = `private-user-${userId}`;
            await pusherServer.trigger(
                channelName,
                SimulationEvent.COMPLETED,
                {
                    scenarioId,
                    scenarioName: scenario.name,
                    resultId,
                    executionTime: executionTimeSeconds,
                    timestamp: new Date().toISOString(),
                    viewUrl: `/admin/simulations/scenarios/${scenarioId}/results/${resultId}`
                }
            );

            // 5. Envoi d'une notification globale pour tous les utilisateurs intéressés
            // Si le scénario est public ou partagé avec d'autres utilisateurs
            const isPublic = await prisma.simulationScenario.count({
                where: {
                    id: scenarioId,
                    isPublic: true
                }
            }) > 0;

            if (isPublic) {
                // Récupérer les utilisateurs ayant des préférences de notification pour les simulations
                const interestedUsers = await prisma.notificationPreference.findMany({
                    where: {
                        type: NotificationType.SIMULATION_COMPLETED,
                        enabled: true,
                        userId: { not: userId } // Exclure l'utilisateur qui a lancé la simulation
                    },
                    select: { userId: true }
                });

                // Créer des notifications pour ces utilisateurs
                if (interestedUsers.length > 0) {
                    const notifications = interestedUsers.map(user => ({
                        userId: user.userId,
                        type: NotificationType.SIMULATION_COMPLETED,
                        title: 'Nouvelle simulation disponible',
                        content: `Une nouvelle simulation "${scenario.name}" est disponible`,
                        contextId: scenarioId,
                        data: {
                            scenarioId,
                            resultId,
                            isPublic: true,
                            executionTime: executionTimeSeconds
                        }
                    }));

                    await prisma.notification.createMany({
                        data: notifications
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la notification de complétion de simulation:', error);
        }
    }

    // Notification d'erreur durant une simulation
    async notifySimulationError(
        scenarioId: string,
        userId: string,
        error: string
    ) {
        try {
            // 1. Récupérer le scénario pour avoir son nom
            const scenario = await prisma.simulationScenario.findUnique({
                where: { id: scenarioId },
                select: { name: true }
            });

            if (!scenario) return;

            // 2. Créer une notification persistante
            await prisma.notification.create({
                data: {
                    userId,
                    type: NotificationType.SIMULATION_FAILED,
                    title: 'Erreur de simulation',
                    content: `La simulation "${scenario.name}" a échoué`,
                    contextId: scenarioId,
                    data: {
                        scenarioId,
                        error
                    }
                }
            });

            // 3. Mettre à jour le statut de la simulation
            await this.updateSimulationStatus(
                scenarioId,
                'failed',
                0,
                error
            );

            // 4. Envoyer une notification temps réel via Pusher
            const channelName = `private-user-${userId}`;
            await pusherServer.trigger(
                channelName,
                SimulationEvent.FAILED,
                {
                    scenarioId,
                    scenarioName: scenario.name,
                    error,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (err) {
            console.error('Erreur lors de la notification d\'échec de simulation:', err);
        }
    }
}

// Export d'une instance singleton
export const simulationNotificationService = new SimulationNotificationService(); 