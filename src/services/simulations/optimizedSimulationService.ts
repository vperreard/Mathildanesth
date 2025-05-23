/**
 * Service d'optimisation des simulations
 * 
 * Ce service propose différentes stratégies d'optimisation pour améliorer
 * les performances des simulations, particulièrement pour les jeux de données volumineux.
 */

import { PrismaClient, SimulationStatus } from '@prisma/client';
import { simulationCache } from './simulationCacheService';
import { simulationNotificationService } from './notificationService';
import * as workerpool from 'workerpool';
import path from 'path';
import { createSimulationHash } from '@/utils/simulationUtils';
import { notifyProgressUpdate } from '@/services/notifications/notificationService';

const prisma = new PrismaClient();

// Configuration du pool de workers
const MAX_WORKERS = process.env.SIMULATION_MAX_WORKERS ? parseInt(process.env.SIMULATION_MAX_WORKERS) : 2;
const WORKER_TIMEOUT = 120000; // 2 minutes de timeout pour les workers

// Créer un pool de workers pour les calculs intensifs
let pool: any = null;

// Initialiser le pool de workers à la demande
function getWorkerPool() {
    if (!pool) {
        // En production, le chemin serait relatif au répertoire de build
        const workerPath = path.resolve(process.cwd(), 'src/services/simulations/simulationWorker.js');
        pool = workerpool.pool(workerPath, {
            minWorkers: 1,
            maxWorkers: MAX_WORKERS,
            workerType: 'thread'
        });
    }
    return pool;
}

// Types
export interface SimulationParams {
    scenarioId: string;
    siteId?: string;
    startDate: Date;
    endDate: Date;
    includedRuleIds?: string[];
    excludedUserIds?: string[];
    options?: SimulationOptions;
    userId?: string; // ID de l'utilisateur qui lance la simulation
}

export interface SimulationOptions {
    strategy?: OptimizationStrategy;
    useCache?: boolean;
    parallelProcessing?: boolean;
    batchSize?: number;
    notifyProgress?: boolean;
}

export enum OptimizationStrategy {
    STANDARD = 'standard',       // Aucune optimisation spéciale
    INCREMENTAL = 'incremental', // Calcul uniquement des modifications
    CACHED = 'cached',           // Utilisation maximale du cache
    PARALLEL = 'parallel',       // Traitement parallèle
    HYBRID = 'hybrid'            // Combinaison de stratégies
}

interface SimulationCache {
    [key: string]: any;
}

// Cache en mémoire pour les résultats intermédiaires
const simulationCache: SimulationCache = {};

// Stratégies d'optimisation
enum OptimizationStrategy {
    CACHE_ONLY = 'CACHE_ONLY',           // Utilise uniquement le cache, sans calcul
    PARALLEL_PROCESSING = 'PARALLEL',     // Utilise des workers parallèles
    INCREMENTAL = 'INCREMENTAL',          // Calcule les résultats de manière incrémentale
    DEFAULT = 'DEFAULT'                   // Stratégie par défaut
}

export class OptimizedSimulationService {
    // Exécute une simulation avec la stratégie d'optimisation choisie
    async runSimulation(
        simulationResultId: string,
        params: SimulationParams,
        strategy: OptimizationStrategy = OptimizationStrategy.DEFAULT
    ): Promise<string> {
        const startTime = Date.now();

        try {
            // Mettre à jour le statut de la simulation en cours
            await this.updateSimulationStatus(simulationResultId, SimulationStatus.RUNNING);

            // Notifier du démarrage de la simulation
            if (params.userId) {
                // Estimer la durée en fonction de la stratégie
                const estimatedDuration = this.getEstimatedDuration(strategy, params);

                await simulationNotificationService.notifySimulationStarted(
                    params.scenarioId,
                    params.userId,
                    estimatedDuration
                );
            }

            let result: any = null;
            let currentProgress = 0;

            // Fonction pour suivre la progression
            const updateProgress = async (progress: number, message?: string) => {
                if (params.userId && progress > currentProgress) {
                    currentProgress = progress;

                    await simulationNotificationService.notifySimulationProgress(
                        params.scenarioId,
                        params.userId,
                        {
                            scenarioId: params.scenarioId,
                            progress,
                            status: 'running',
                            currentStep: message || `Étape ${progress}%`,
                            estimatedTimeRemaining: Math.round((100 - progress) * (Date.now() - startTime) / progress / 1000)
                        }
                    );
                }
            };

            // Choisir la stratégie d'optimisation
            switch (strategy) {
                case OptimizationStrategy.CACHE_ONLY:
                    await updateProgress(10, "Vérification du cache");
                    result = await this.runCacheOnlySimulation(params);
                    await updateProgress(100, "Récupération depuis le cache terminée");
                    break;
                case OptimizationStrategy.PARALLEL_PROCESSING:
                    result = await this.runParallelSimulation(params, updateProgress);
                    break;
                case OptimizationStrategy.INCREMENTAL:
                    result = await this.runIncrementalSimulation(params, simulationResultId, updateProgress);
                    break;
                default:
                    result = await this.runDefaultSimulation(params, updateProgress);
            }

            const executionTime = Date.now() - startTime;

            // Mettre à jour le résultat de la simulation
            await this.saveSimulationResult(simulationResultId, result, executionTime);

            // Notifier de la fin de la simulation
            if (params.userId) {
                await simulationNotificationService.notifySimulationCompleted(
                    params.scenarioId,
                    params.userId,
                    simulationResultId,
                    Math.round(executionTime / 1000)
                );
            }

            return simulationResultId;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la simulation optimisée:', error);

            // Mettre à jour le statut en cas d'erreur
            await this.updateSimulationStatus(
                simulationResultId,
                SimulationStatus.FAILED,
                error instanceof Error ? error.message : 'Erreur inconnue'
            );

            // Notifier de l'erreur
            if (params.userId) {
                await simulationNotificationService.notifySimulationError(
                    params.scenarioId,
                    params.userId,
                    error instanceof Error ? error.message : 'Erreur inconnue'
                );
            }

            throw error;
        }
    }

    // Estimer la durée de la simulation en fonction de la stratégie
    private getEstimatedDuration(strategy: OptimizationStrategy, params: SimulationParams): number {
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Estimations de base en secondes
        switch (strategy) {
            case OptimizationStrategy.CACHE_ONLY:
                return 5; // Très rapide, juste récupérer du cache
            case OptimizationStrategy.PARALLEL_PROCESSING:
                return Math.max(30, Math.ceil(days * 2 / MAX_WORKERS));
            case OptimizationStrategy.INCREMENTAL:
                return Math.max(20, Math.ceil(days * 1.5));
            default:
                return Math.max(30, days * 3);
        }
    }

    // Stratégie utilisant uniquement le cache
    private async runCacheOnlySimulation(params: SimulationParams): Promise<any> {
        const cacheKey = simulationCache.generateCacheKey(params.scenarioId, params);
        const cachedResult = simulationCache.get(cacheKey);

        if (!cachedResult) {
            throw new Error('Aucun résultat en cache disponible. Utilisez une autre stratégie.');
        }

        return cachedResult;
    }

    // Stratégie avec traitement parallèle
    private async runParallelSimulation(
        params: SimulationParams,
        updateProgress: (progress: number, message?: string) => Promise<void>
    ): Promise<any> {
        const pool = getWorkerPool();

        // Diviser la période en sous-périodes
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Si la période est courte, traiter normalement
        if (totalDays <= 7) {
            return this.runDefaultSimulation(params, updateProgress);
        }

        await updateProgress(10, "Préparation des segments parallèles");

        // Sinon, diviser en sous-périodes hebdomadaires
        const subPeriods = [];
        let currentDate = new Date(startDate);

        while (currentDate < endDate) {
            const periodEnd = new Date(currentDate);
            periodEnd.setDate(periodEnd.getDate() + 6); // Ajouter 6 jours (1 semaine)

            if (periodEnd > endDate) {
                periodEnd.setTime(endDate.getTime());
            }

            subPeriods.push({
                ...params,
                startDate: currentDate.toISOString().split('T')[0],
                endDate: periodEnd.toISOString().split('T')[0]
            });

            // Avancer à la période suivante
            currentDate.setDate(currentDate.getDate() + 7);
        }

        await updateProgress(20, `Lancement de ${subPeriods.length} segments parallèles`);

        // Exécuter les sous-périodes en parallèle
        const promises = subPeriods.map(subParams =>
            pool.exec('processSimulationChunk', [subParams])
        );

        // Suivre la progression
        let completedChunks = 0;
        const totalChunks = promises.length;

        // Wrapper chaque promesse pour mettre à jour la progression
        const trackedPromises = promises.map(promise =>
            promise.then(result => {
                completedChunks++;
                const progress = 20 + Math.floor((completedChunks / totalChunks) * 70);
                updateProgress(progress, `Traitement des segments: ${completedChunks}/${totalChunks}`);
                return result;
            })
        );

        const results = await Promise.all(trackedPromises);

        await updateProgress(90, "Combinaison des résultats");
        const combinedResult = this.combineResults(results);

        await updateProgress(100, "Traitement parallèle terminé");
        return combinedResult;
    }

    // Stratégie incrémentale (utilise les résultats précédents comme base)
    private async runIncrementalSimulation(
        params: SimulationParams,
        resultId: string,
        updateProgress: (progress: number, message?: string) => Promise<void>
    ): Promise<any> {
        // Vérifier s'il y a un résultat précédent pour ce scénario
        await updateProgress(10, "Recherche de résultats précédents");

        const previousResults = await prisma.simulationResult.findMany({
            where: {
                scenarioId: params.scenarioId,
                status: SimulationStatus.COMPLETED,
                id: { not: resultId }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        if (previousResults.length === 0) {
            // Aucun résultat précédent, exécuter une simulation normale
            await updateProgress(15, "Aucun résultat précédent, lancement d'une simulation complète");
            return this.runDefaultSimulation(params, updateProgress);
        }

        await updateProgress(20, "Analyse des résultats précédents");
        const previousResult = previousResults[0];

        // Calculer uniquement les différences ou les mises à jour nécessaires
        // basées sur les paramètres et les résultats précédents
        const baseResults = previousResult.resultData || {};

        await updateProgress(30, "Calcul incrémental des modifications");

        // Utiliser les données de base et les mettre à jour si nécessaire
        return await simulationCache.getOrCompute(
            params.scenarioId,
            { ...params, strategy: 'incremental', baseResultId: previousResult.id },
            async () => {
                // Simuler une progression de calcul
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await updateProgress(30 + (i + 1) * 10, `Calcul incrémental en cours (${i + 1}/5)`);
                }

                // Exemple: mise à jour des données de base avec de nouvelles valeurs
                const updatedResults = {
                    ...baseResults,
                    simulatedPeriod: {
                        from: params.startDate,
                        to: params.endDate,
                        totalDays: Math.ceil((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24))
                    },
                    // Ajouter d'autres mises à jour spécifiques ici
                    lastUpdated: new Date().toISOString(),
                    isPartialUpdate: true
                };

                await updateProgress(90, "Finalisation des résultats incrémentaux");
                return updatedResults;
            }
        );
    }

    // Stratégie par défaut avec optimisations de base
    private async runDefaultSimulation(
        params: SimulationParams,
        updateProgress: (progress: number, message?: string) => Promise<void>
    ): Promise<any> {
        await updateProgress(10, "Initialisation de la simulation");

        return await simulationCache.getOrCompute(
            params.scenarioId,
            params,
            async () => {
                // Simuler un traitement progressif
                for (let i = 0; i < 8; i++) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await updateProgress(10 + (i + 1) * 10, `Simulation en cours... (${i + 1}/8)`);
                }

                const startDate = new Date(params.startDate);
                const endDate = new Date(params.endDate);
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                // Génération des résultats de simulation
                const resultData = {
                    simulatedPeriod: {
                        from: params.startDate,
                        to: params.endDate,
                        totalDays: days
                    },
                    staffingCoverage: {
                        overall: 92.5,
                        byDay: this.generateDailyStaffingCoverage(startDate, days)
                    },
                    leaveRequests: {
                        totalRequested: 24,
                        approved: 18,
                        rejected: 6,
                        approvalRate: 75
                    },
                    shiftDistribution: this.generateShiftDistribution(),
                    conflicts: {
                        total: 8,
                        byPriority: {
                            high: 2,
                            medium: 3,
                            low: 3
                        },
                        resolved: 5,
                        unresolved: 3
                    }
                };

                // Stocker les résultats intermédiaires pour une utilisation future
                await simulationCache.persistIntermediateResults(
                    params.scenarioId,
                    'complete-simulation',
                    resultData
                );

                await updateProgress(100, "Simulation terminée");
                return resultData;
            }
        );
    }

    // Mettre à jour le statut de la simulation
    private async updateSimulationStatus(
        resultId: string,
        status: SimulationStatus,
        errorMessage?: string
    ): Promise<void> {
        const updateData: any = {
            status,
            updatedAt: new Date()
        };

        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        await prisma.simulationResult.update({
            where: { id: resultId },
            data: updateData
        });
    }

    // Sauvegarder les résultats de la simulation
    private async saveSimulationResult(
        resultId: string,
        resultData: any,
        executionTime: number
    ): Promise<void> {
        // Calculer les statistiques à partir des résultats
        const statisticsJson = {
            staffUtilization: resultData.staffingCoverage?.overall / 100 || 0,
            ruleComplianceRate: 0.94, // Exemple
            overcoverageWaste: resultData.staffingCoverage?.overall > 95 ? (resultData.staffingCoverage.overall - 95) / 100 : 0,
            undercoverageMissing: resultData.staffingCoverage?.overall < 85 ? (85 - resultData.staffingCoverage.overall) / 100 : 0,
            fairnessScore: 0.92, // Exemple
            overallScore: 0.90 // Exemple
        };

        await prisma.simulationResult.update({
            where: { id: resultId },
            data: {
                status: SimulationStatus.COMPLETED,
                resultData,
                statisticsJson,
                executionTime,
                updatedAt: new Date()
            }
        });
    }

    // Combiner les résultats des sous-périodes
    private combineResults(results: any[]): any {
        if (results.length === 0) return {};

        // Extraire la première et la dernière période pour la période globale
        const combinedPeriod = {
            from: results[0].simulatedPeriod.from,
            to: results[results.length - 1].simulatedPeriod.to,
            totalDays: results.reduce((sum, r) => sum + r.simulatedPeriod.totalDays, 0)
        };

        // Combiner les couvertures quotidiennes
        const allDailyCoverage = results.flatMap(r => r.staffingCoverage.byDay);

        // Calculer la moyenne globale
        const overallCoverage = results.reduce(
            (sum, r) => sum + (r.staffingCoverage.overall * r.simulatedPeriod.totalDays),
            0
        ) / combinedPeriod.totalDays;

        // Combiner les distributions de poste
        const combinedShiftDistribution = this.combineShiftDistributions(
            results.map(r => r.shiftDistribution)
        );

        // Agréger les conflits
        const totalConflicts = results.reduce((sum, r) => sum + r.conflicts.total, 0);
        const highPriorityConflicts = results.reduce((sum, r) => sum + r.conflicts.byPriority.high, 0);
        const mediumPriorityConflicts = results.reduce((sum, r) => sum + r.conflicts.byPriority.medium, 0);
        const lowPriorityConflicts = results.reduce((sum, r) => sum + r.conflicts.byPriority.low, 0);
        const resolvedConflicts = results.reduce((sum, r) => sum + r.conflicts.resolved, 0);
        const unresolvedConflicts = results.reduce((sum, r) => sum + r.conflicts.unresolved, 0);

        // Construire le résultat final combiné
        return {
            simulatedPeriod: combinedPeriod,
            staffingCoverage: {
                overall: overallCoverage,
                byDay: allDailyCoverage
            },
            leaveRequests: {
                totalRequested: results.reduce((sum, r) => sum + r.leaveRequests.totalRequested, 0),
                approved: results.reduce((sum, r) => sum + r.leaveRequests.approved, 0),
                rejected: results.reduce((sum, r) => sum + r.leaveRequests.rejected, 0),
                approvalRate: results.reduce((sum, r) => sum + r.leaveRequests.approvalRate, 0) / results.length
            },
            shiftDistribution: combinedShiftDistribution,
            conflicts: {
                total: totalConflicts,
                byPriority: {
                    high: highPriorityConflicts,
                    medium: mediumPriorityConflicts,
                    low: lowPriorityConflicts
                },
                resolved: resolvedConflicts,
                unresolved: unresolvedConflicts
            }
        };
    }

    // Combiner les distributions de postes
    private combineShiftDistributions(distributions: any[]): any[] {
        if (distributions.length === 0) return [];

        // Créer un dictionnaire pour agréger les données par utilisateur
        const userShifts: Record<string, any> = {};

        // Parcourir toutes les distributions
        distributions.forEach(distribution => {
            distribution.forEach((userShift: any) => {
                const { userName } = userShift;

                if (!userShifts[userName]) {
                    // Initialiser pour le premier utilisateur rencontré
                    userShifts[userName] = {
                        userName,
                        morningShifts: 0,
                        afternoonShifts: 0,
                        nightShifts: 0,
                        weekendShifts: 0,
                        totalHours: 0
                    };
                }

                // Ajouter les valeurs
                userShifts[userName].morningShifts += userShift.morningShifts;
                userShifts[userName].afternoonShifts += userShift.afternoonShifts;
                userShifts[userName].nightShifts += userShift.nightShifts;
                userShifts[userName].weekendShifts += userShift.weekendShifts;
                userShifts[userName].totalHours += userShift.totalHours;
            });
        });

        // Convertir le dictionnaire en tableau
        return Object.values(userShifts);
    }

    // Générer les données de couverture quotidienne
    private generateDailyStaffingCoverage(startDate: Date, days: number) {
        const coverage = [];
        const date = new Date(startDate);

        for (let i = 0; i < days; i++) {
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            coverage.push({
                date: new Date(date).toISOString().split('T')[0],
                coverage: isWeekend ?
                    Math.floor(Math.random() * 15) + 75 : // 75-90% pour les weekends
                    Math.floor(Math.random() * 15) + 85, // 85-100% pour les jours de semaine
                required: isWeekend ? 5 : 10,
                actual: isWeekend ? 4 : 9
            });

            date.setDate(date.getDate() + 1);
        }

        return coverage;
    }

    // Générer la distribution des postes
    private generateShiftDistribution() {
        const users = [
            'Sophie Martin',
            'Thomas Bernard',
            'Marie Dupont',
            'François Leroy',
            'Camille Dubois',
            'Julie Petit',
            'Lucas Moreau'
        ];

        return users.map(user => ({
            userName: user,
            morningShifts: Math.floor(Math.random() * 10) + 5,
            afternoonShifts: Math.floor(Math.random() * 10) + 5,
            nightShifts: Math.floor(Math.random() * 5),
            weekendShifts: Math.floor(Math.random() * 4),
            totalHours: Math.floor(Math.random() * 50) + 120
        }));
    }
}

// Exporter une instance singleton
export const optimizedSimulationService = new OptimizedSimulationService(); 