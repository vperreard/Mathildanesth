/**
 * Service d'analyse des conflits de congés
 * Permet de générer des statistiques et des tendances sur les conflits
 */

import { LeaveConflict, ConflictType, ConflictSeverity } from '../types/conflict';
import { logger } from "../../../lib/logger";
import { Leave, LeaveType, LeaveStatus } from '../types/leave';
import { User } from '../../../types/user';
import { Department } from '../../../types/department';

interface ConflictStatsByType {
    [key: string]: number;
}

interface ConflictStatsBySeverity {
    [key: string]: number;
}

interface ConflictStatsByDepartment {
    [departmentId: string]: {
        total: number;
        byType: ConflictStatsByType;
        bySeverity: ConflictStatsBySeverity;
    };
}

interface ConflictStatsByMonth {
    [month: string]: {
        total: number;
        byType: ConflictStatsByType;
        bySeverity: ConflictStatsBySeverity;
    };
}

interface ConflictsTrend {
    period: string;
    total: number;
    blocking: number;
    warning: number;
    info: number;
}

export interface ConflictAnalyticsReport {
    totalConflicts: number;
    byType: ConflictStatsByType;
    bySeverity: ConflictStatsBySeverity;
    byDepartment: ConflictStatsByDepartment;
    byMonth: ConflictStatsByMonth;
    trends: ConflictsTrend[];
    mostCommonType: ConflictType | null;
    mostCriticalDepartment: string | null;
    highRiskPeriods: string[];
    recommendations: string[];
}

export interface AnalyticsFilter {
    startDate?: Date;
    endDate?: Date;
    departmentIds?: string[];
    leaveTypes?: LeaveType[];
    conflictTypes?: ConflictType[];
    severities?: ConflictSeverity[];
}

export interface ConflictStats {
    totalConflicts: number;
    byType: Record<ConflictType, number>;
    bySeverity: Record<ConflictSeverity, number>;
    byTeam: Record<string, number>;
    byPeriod: Record<string, number>; // format 'YYYY-MM'
    byLeaveType: Record<LeaveType, number>;
    topConflictingTeamPairs: { teams: [string, string], count: number }[];
    resolutionRate: number;
    averageResolutionTime: number; // en heures
    mostOverriddenConflictTypes: { type: ConflictType, count: number }[];
}

export interface ConflictTrend {
    period: string; // format 'YYYY-MM' ou 'YYYY-WW' (semaine)
    count: number;
    byType?: Partial<Record<ConflictType, number>>;
}

export interface TeamConflictAnalytics {
    teamId: string;
    teamName: string;
    totalConflicts: number;
    mostCommonConflictType: ConflictType;
    conflictRate: number; // conflits / total des demandes
    resolutionRate: number;
    trends: ConflictTrend[];
}

export interface ConflictRecommendation {
    type: 'SCHEDULING' | 'TEAM_BALANCE' | 'POLICY';
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    targetTeams?: string[];
    targetPeriods?: string[];
    suggestedActions: string[];
}

export interface ConflictAnalyticsFilters {
    startDate?: Date;
    endDate?: Date;
    departmentIds?: string[];
    teamIds?: string[];
    leaveTypes?: LeaveType[];
    conflictTypes?: ConflictType[];
    severities?: ConflictSeverity[];
    userId?: string;
    groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export class LeaveConflictAnalyticsService {
    /**
     * Génère un rapport d'analyse des conflits de congés
     * @param conflicts Liste des conflits à analyser
     * @param leaves Liste des congés associés
     * @param users Liste des utilisateurs 
     * @param departments Liste des départements
     * @param filter Filtres à appliquer
     * @returns Rapport d'analyse complet
     */
    public generateAnalyticsReport(
        conflicts: LeaveConflict[],
        leaves: Leave[],
        users: User[],
        departments: Department[],
        filter?: AnalyticsFilter
    ): ConflictAnalyticsReport {
        // Appliquer les filtres si présents
        const filteredConflicts = this.applyFilters(conflicts, leaves, filter);

        // Calculer les statistiques
        const totalConflicts = filteredConflicts.length;
        const byType = this.calculateStatsByType(filteredConflicts);
        const bySeverity = this.calculateStatsBySeverity(filteredConflicts);
        const byDepartment = this.calculateStatsByDepartment(filteredConflicts, users, departments);
        const byMonth = this.calculateStatsByMonth(filteredConflicts);
        const trends = this.calculateTrends(filteredConflicts);

        // Analyse des insights
        const mostCommonType = this.findMostCommonType(byType);
        const mostCriticalDepartment = this.findMostCriticalDepartment(byDepartment);
        const highRiskPeriods = this.identifyHighRiskPeriods(byMonth);
        const recommendations = this.generateRecommendations(
            filteredConflicts,
            leaves,
            users,
            departments,
            mostCommonType,
            mostCriticalDepartment,
            highRiskPeriods
        );

        return {
            totalConflicts,
            byType,
            bySeverity,
            byDepartment,
            byMonth,
            trends,
            mostCommonType,
            mostCriticalDepartment,
            highRiskPeriods,
            recommendations
        };
    }

    /**
     * Applique les filtres aux conflits
     */
    private applyFilters(
        conflicts: LeaveConflict[],
        leaves: Leave[],
        filter?: AnalyticsFilter
    ): LeaveConflict[] {
        if (!filter) return conflicts;

        return conflicts.filter(conflict => {
            // Filtrer par type de conflit
            if (filter.conflictTypes &&
                filter.conflictTypes.length > 0 &&
                !filter.conflictTypes.includes(conflict.type)) {
                return false;
            }

            // Filtrer par sévérité
            if (filter.severities &&
                filter.severities.length > 0 &&
                !filter.severities.includes(conflict.severity)) {
                return false;
            }

            // Filtrer par période
            const conflictStartDate = new Date(conflict.startDate);
            const conflictEndDate = new Date(conflict.endDate);

            if (filter.startDate && conflictEndDate < filter.startDate) {
                return false;
            }

            if (filter.endDate && conflictStartDate > filter.endDate) {
                return false;
            }

            // Filtrer par département (nécessite de rechercher le congé associé)
            if (filter.departmentIds && filter.departmentIds.length > 0) {
                const leave = leaves.find(l => l.id === conflict.leaveId);
                if (!leave) return false;

                // En supposant que l'utilisateur a une propriété departmentId
                const userDepartment = leave.departmentId;
                if (!userDepartment || !filter.departmentIds.includes(userDepartment)) {
                    return false;
                }
            }

            // Filtrer par type de congé
            if (filter.leaveTypes && filter.leaveTypes.length > 0) {
                const leave = leaves.find(l => l.id === conflict.leaveId);
                if (!leave || !filter.leaveTypes.includes(leave.type)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Calcule les statistiques par type de conflit
     */
    private calculateStatsByType(conflicts: LeaveConflict[]): ConflictStatsByType {
        const stats: ConflictStatsByType = {};

        conflicts.forEach(conflict => {
            if (!stats[conflict.type]) {
                stats[conflict.type] = 0;
            }
            stats[conflict.type]!++;
        });

        return stats;
    }

    /**
     * Calcule les statistiques par niveau de sévérité
     */
    private calculateStatsBySeverity(conflicts: LeaveConflict[]): ConflictStatsBySeverity {
        const stats: ConflictStatsBySeverity = {};

        conflicts.forEach(conflict => {
            if (!stats[conflict.severity]) {
                stats[conflict.severity] = 0;
            }
            stats[conflict.severity]!++;
        });

        return stats;
    }

    /**
     * Calcule les statistiques par département
     */
    private calculateStatsByDepartment(
        conflicts: LeaveConflict[],
        users: User[],
        departments: Department[]
    ): ConflictStatsByDepartment {
        const stats: ConflictStatsByDepartment = {};

        // Initialiser les stats pour chaque département
        departments.forEach(dept => {
            stats[dept.id] = {
                total: 0,
                byType: {},
                bySeverity: {}
            };
        });

        // Agréger les statistiques
        conflicts.forEach(conflict => {
            const affectedUserIds = conflict.affectedUserIds || [];

            // Pour chaque utilisateur affecté, identifier son département
            affectedUserIds.forEach(userId => {
                const user = users.find(u => u.id === userId);
                if (!user || !user.departmentId) return;

                const deptId = user.departmentId;

                // Assurer que le département existe dans les stats
                if (!stats[deptId]) {
                    stats[deptId] = {
                        total: 0,
                        byType: {},
                        bySeverity: {}
                    };
                }

                // Incrémenter les compteurs
                stats[deptId].total++;

                if (!stats[deptId].byType[conflict.type]) {
                    stats[deptId].byType[conflict.type] = 0;
                }
                stats[deptId].byType[conflict.type]!++;

                if (!stats[deptId].bySeverity[conflict.severity]) {
                    stats[deptId].bySeverity[conflict.severity] = 0;
                }
                stats[deptId].bySeverity[conflict.severity]!++;
            });
        });

        return stats;
    }

    /**
     * Calcule les statistiques par mois
     */
    private calculateStatsByMonth(conflicts: LeaveConflict[]): ConflictStatsByMonth {
        const stats: ConflictStatsByMonth = {};

        conflicts.forEach(conflict => {
            const date = new Date(conflict.startDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!stats[monthKey]) {
                stats[monthKey] = {
                    total: 0,
                    byType: {},
                    bySeverity: {}
                };
            }

            // Incrémenter les compteurs
            stats[monthKey].total++;

            if (!stats[monthKey].byType[conflict.type]) {
                stats[monthKey].byType[conflict.type] = 0;
            }
            stats[monthKey].byType[conflict.type]!++;

            if (!stats[monthKey].bySeverity[conflict.severity]) {
                stats[monthKey].bySeverity[conflict.severity] = 0;
            }
            stats[monthKey].bySeverity[conflict.severity]!++;
        });

        // Trier par mois
        return Object.keys(stats)
            .sort()
            .reduce((sorted, key) => {
                sorted[key] = stats[key];
                return sorted;
            }, {} as ConflictStatsByMonth);
    }

    /**
     * Calcule les tendances de conflits au fil du temps
     */
    private calculateTrends(conflicts: LeaveConflict[]): ConflictsTrend[] {
        const trends: Record<string, ConflictsTrend> = {};

        // Regrouper par mois
        conflicts.forEach(conflict => {
            const date = new Date(conflict.startDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!trends[monthKey]) {
                trends[monthKey] = {
                    period: monthKey,
                    total: 0,
                    blocking: 0,
                    warning: 0,
                    info: 0
                };
            }

            trends[monthKey].total++;

            switch (conflict.severity) {
                case ConflictSeverity.BLOQUANT:
                    trends[monthKey].blocking++;
                    break;
                case ConflictSeverity.AVERTISSEMENT:
                    trends[monthKey].warning++;
                    break;
                case ConflictSeverity.INFORMATION:
                    trends[monthKey].info++;
                    break;
            }
        });

        // Convertir en tableau trié
        return Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));
    }

    /**
     * Trouve le type de conflit le plus courant
     */
    private findMostCommonType(byType: ConflictStatsByType): ConflictType | null {
        let maxCount = 0;
        let mostCommonType: ConflictType | null = null;

        Object.entries(byType).forEach(([type, count]) => {
            if (count! > maxCount) {
                maxCount = count!;
                mostCommonType = type as ConflictType;
            }
        });

        return mostCommonType;
    }

    /**
     * Trouve le département le plus critique en termes de conflits
     */
    private findMostCriticalDepartment(byDepartment: ConflictStatsByDepartment): string | null {
        let maxCount = 0;
        let mostCriticalDept: string | null = null;

        Object.entries(byDepartment).forEach(([deptId, stats]) => {
            const blockingCount = stats.bySeverity[ConflictSeverity.BLOQUANT] || 0;

            if (blockingCount > maxCount) {
                maxCount = blockingCount;
                mostCriticalDept = deptId;
            }
        });

        return mostCriticalDept;
    }

    /**
     * Identifie les périodes à haut risque de conflits
     */
    private identifyHighRiskPeriods(byMonth: ConflictStatsByMonth): string[] {
        const monthEntries = Object.entries(byMonth);
        if (monthEntries.length === 0) return [];

        // Calculer la moyenne et l'écart-type des conflits par mois
        const totalConflicts = monthEntries.reduce((sum, [_, stats]) => sum + stats.total, 0);
        const avgConflictsPerMonth = totalConflicts / monthEntries.length;

        // Considérer comme "à haut risque" les mois avec 50% de plus que la moyenne
        const threshold = avgConflictsPerMonth * 1.5;

        return monthEntries
            .filter(([_, stats]) => stats.total > threshold)
            .map(([month, _]) => month);
    }

    /**
     * Génère des recommandations basées sur l'analyse
     */
    private generateRecommendations(
        conflicts: LeaveConflict[],
        leaves: Leave[],
        users: User[],
        departments: Department[],
        mostCommonType: ConflictType | null,
        mostCriticalDepartment: string | null,
        highRiskPeriods: string[]
    ): string[] {
        const recommendations: string[] = [];

        // Recommandations basées sur le type de conflit le plus courant
        if (mostCommonType) {
            switch (mostCommonType) {
                case ConflictType.TEAM_ABSENCE:
                    recommendations.push(
                        "Mettre en place une planification anticipée des congés pour éviter trop d'absences simultanées dans une équipe."
                    );
                    recommendations.push(
                        "Établir un quota maximum d'absences simultanées par équipe."
                    );
                    break;

                case ConflictType.CRITICAL_ROLE:
                    recommendations.push(
                        "Identifier des remplaçants pour les rôles critiques et assurer leur formation."
                    );
                    recommendations.push(
                        "Mettre en place une matrice de compétences pour identifier les postes à risque."
                    );
                    break;

                case ConflictType.DEADLINE_PROXIMITY:
                    recommendations.push(
                        "Améliorer la visibilité des échéances importantes dans le calendrier partagé."
                    );
                    recommendations.push(
                        "Mettre en place un préavis plus long pour les congés autour des périodes critiques."
                    );
                    break;

                case ConflictType.HIGH_WORKLOAD:
                    recommendations.push(
                        "Identifier et communiquer clairement les périodes de forte charge de travail à l'avance."
                    );
                    recommendations.push(
                        "Envisager des renforts temporaires pendant les périodes de haute activité."
                    );
                    break;
            }
        }

        // Recommandations basées sur le département le plus critique
        if (mostCriticalDepartment) {
            const dept = departments.find(d => d.id === mostCriticalDepartment);
            if (dept) {
                recommendations.push(
                    `Revoir la politique de congés du département ${dept.name} qui présente un nombre élevé de conflits bloquants.`
                );
                recommendations.push(
                    `Envisager une augmentation temporaire des effectifs dans le département ${dept.name} pendant les périodes critiques.`
                );
            }
        }

        // Recommandations basées sur les périodes à risque
        if (highRiskPeriods.length > 0) {
            const formattedPeriods = highRiskPeriods.map(period => {
                const [year, month] = period.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            }).join(', ');

            recommendations.push(
                `Mettre en place une politique de congés spécifique pour les périodes à risque : ${formattedPeriods}.`
            );
            recommendations.push(
                "Instaurer un système de rotation des congés pendant les périodes de forte demande."
            );
        }

        // Recommandations générales
        if (conflicts.length > 0) {
            recommendations.push(
                "Implémenter un système de notification précoce des conflits potentiels."
            );
            recommendations.push(
                "Organiser des réunions de planification des congés par trimestre pour anticiper les besoins."
            );
        }

        return recommendations;
    }

    /**
     * Génère un rapport spécifique pour un département
     */
    public generateDepartmentReport(
        conflicts: LeaveConflict[],
        leaves: Leave[],
        users: User[],
        departments: Department[],
        departmentId: string
    ): ConflictAnalyticsReport {
        const filter: AnalyticsFilter = {
            departmentIds: [departmentId]
        };

        return this.generateAnalyticsReport(conflicts, leaves, users, departments, filter);
    }

    /**
     * Génère un rapport pour une période spécifique
     */
    public generatePeriodReport(
        conflicts: LeaveConflict[],
        leaves: Leave[],
        users: User[],
        departments: Department[],
        startDate: Date,
        endDate: Date
    ): ConflictAnalyticsReport {
        const filter: AnalyticsFilter = {
            startDate,
            endDate
        };

        return this.generateAnalyticsReport(conflicts, leaves, users, departments, filter);
    }

    /**
     * Exporte les données au format CSV
     */
    public exportReportAsCSV(report: ConflictAnalyticsReport): string {
        // Entête
        let csv = "Type,Total\n";

        // Données par type
        Object.entries(report.byType).forEach(([type, count]) => {
            csv += `${type},${count}\n`;
        });

        csv += "\nSeverity,Total\n";
        Object.entries(report.bySeverity).forEach(([severity, count]) => {
            csv += `${severity},${count}\n`;
        });

        csv += "\nPeriod,Total,Blocking,Warning,Info\n";
        report.trends.forEach(trend => {
            csv += `${trend.period},${trend.total},${trend.blocking},${trend.warning},${trend.info}\n`;
        });

        csv += "\nRecommendations\n";
        report.recommendations.forEach(recommendation => {
            csv += `"${recommendation}"\n`;
        });

        return csv;
    }

    /**
     * Récupère les statistiques globales sur les conflits
     */
    async getConflictStats(filters: ConflictAnalyticsFilters = {}): Promise<ConflictStats> {
        try {
            // Simulation de données pour le moment
            // Dans une implémentation réelle, cela viendrait de la base de données
            return {
                totalConflicts: 256,
                byType: {
                    [ConflictType.TEAM_ABSENCE]: 87,
                    [ConflictType.SPECIALTY_CAPACITY]: 52,
                    [ConflictType.USER_LEAVE_OVERLAP]: 34,
                    [ConflictType.CRITICAL_ROLE]: 29,
                    [ConflictType.DEADLINE_PROXIMITY]: 21,
                    [ConflictType.DUTY_CONFLICT]: 15,
                    [ConflictType.ON_CALL_CONFLICT]: 9,
                    [ConflictType.ASSIGNMENT_CONFLICT]: 4,
                    [ConflictType.RECURRING_MEETING]: 3,
                    [ConflictType.HOLIDAY_PROXIMITY]: 2,
                    [ConflictType.SPECIAL_PERIOD]: 0,
                    [ConflictType.HIGH_WORKLOAD]: 0,
                    [ConflictType.OTHER]: 0,
                },
                bySeverity: {
                    [ConflictSeverity.INFORMATION]: 102,
                    [ConflictSeverity.AVERTISSEMENT]: 93,
                    [ConflictSeverity.BLOQUANT]: 61,
                },
                byTeam: {
                    'dev-team': 87,
                    'design-team': 42,
                    'marketing': 38,
                    'support': 56,
                    'management': 33,
                },
                byPeriod: {
                    '2023-06': 32,
                    '2023-07': 45,
                    '2023-08': 59,
                    '2023-09': 38,
                    '2023-10': 41,
                    '2023-11': 28,
                    '2023-12': 13,
                },
                byLeaveType: {
                    [LeaveType.CONGE_PAYE]: 156,
                    [LeaveType.RTT]: 48,
                    [LeaveType.MALADIE]: 23,
                    [LeaveType.SANS_SOLDE]: 12,
                    [LeaveType.FORMATION]: 11,
                    [LeaveType.MATERNITE]: 4,
                    [LeaveType.PATERNITE]: 2,
                    [LeaveType.AUTRE]: 0,
                },
                topConflictingTeamPairs: [
                    { teams: ['dev-team', 'design-team'], count: 28 },
                    { teams: ['dev-team', 'support'], count: 22 },
                    { teams: ['marketing', 'design-team'], count: 18 },
                ],
                resolutionRate: 0.78, // 78% des conflits ont été résolus
                averageResolutionTime: 18.5, // en heures
                mostOverriddenConflictTypes: [
                    { type: ConflictType.TEAM_ABSENCE, count: 32 },
                    { type: ConflictType.DEADLINE_PROXIMITY, count: 15 },
                    { type: ConflictType.ON_CALL_CONFLICT, count: 9 },
                ],
            };
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des statistiques de conflits:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de récupérer les statistiques de conflits');
        }
    }

    /**
     * Récupère les tendances de conflits sur une période donnée
     */
    async getConflictTrends(
        period: 'daily' | 'weekly' | 'monthly' = 'monthly',
        filters: ConflictAnalyticsFilters = {}
    ): Promise<ConflictTrend[]> {
        try {
            // Simulation de données pour le moment
            return [
                { period: '2023-06', count: 32, byType: { [ConflictType.TEAM_ABSENCE]: 12, [ConflictType.SPECIALTY_CAPACITY]: 8 } },
                { period: '2023-07', count: 45, byType: { [ConflictType.TEAM_ABSENCE]: 18, [ConflictType.SPECIALTY_CAPACITY]: 11 } },
                { period: '2023-08', count: 59, byType: { [ConflictType.TEAM_ABSENCE]: 22, [ConflictType.SPECIALTY_CAPACITY]: 14 } },
                { period: '2023-09', count: 38, byType: { [ConflictType.TEAM_ABSENCE]: 15, [ConflictType.SPECIALTY_CAPACITY]: 9 } },
                { period: '2023-10', count: 41, byType: { [ConflictType.TEAM_ABSENCE]: 16, [ConflictType.SPECIALTY_CAPACITY]: 10 } },
                { period: '2023-11', count: 28, byType: { [ConflictType.TEAM_ABSENCE]: 10, [ConflictType.SPECIALTY_CAPACITY]: 7 } },
                { period: '2023-12', count: 13, byType: { [ConflictType.TEAM_ABSENCE]: 5, [ConflictType.SPECIALTY_CAPACITY]: 3 } },
            ];
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des tendances de conflits:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de récupérer les tendances de conflits');
        }
    }

    /**
     * Récupère les statistiques des conflits pour une équipe spécifique
     */
    async getTeamConflictAnalytics(teamId: string, filters: ConflictAnalyticsFilters = {}): Promise<TeamConflictAnalytics> {
        try {
            // Simulation de données pour le moment
            return {
                teamId,
                teamName: teamId === 'dev-team' ? 'Équipe Développement' : 'Équipe Inconnue',
                totalConflicts: 87,
                mostCommonConflictType: ConflictType.TEAM_ABSENCE,
                conflictRate: 0.32, // 32% des demandes ont des conflits
                resolutionRate: 0.81,
                trends: [
                    { period: '2023-06', count: 12 },
                    { period: '2023-07', count: 14 },
                    { period: '2023-08', count: 18 },
                    { period: '2023-09', count: 12 },
                    { period: '2023-10', count: 15 },
                    { period: '2023-11', count: 9 },
                    { period: '2023-12', count: 7 },
                ],
            };
        } catch (error: unknown) {
            logger.error(`Erreur lors de la récupération des statistiques pour l'équipe ${teamId}:`, error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Impossible de récupérer les statistiques pour l'équipe ${teamId}`);
        }
    }

    /**
     * Génère des recommandations pour réduire les conflits
     */
    async generateRecommendations(filters: ConflictAnalyticsFilters = {}): Promise<ConflictRecommendation[]> {
        try {
            // Récupération des statistiques pour analyser les problèmes
            const stats = await this.getConflictStats(filters);

            // Simulation de recommandations basées sur les données
            return [
                {
                    type: 'SCHEDULING',
                    description: 'Répartition des congés plus équilibrée dans l\'équipe de développement',
                    impact: 'HIGH',
                    targetTeams: ['dev-team'],
                    suggestedActions: [
                        'Encourager la planification des congés à l\'avance',
                        'Implémenter un système de rotation pour les périodes très demandées',
                        'Limiter à 30% le taux d\'absence maximum pendant les sprints'
                    ]
                },
                {
                    type: 'TEAM_BALANCE',
                    description: 'Meilleure répartition des compétences critiques',
                    impact: 'MEDIUM',
                    targetTeams: ['dev-team', 'support'],
                    suggestedActions: [
                        'Former plus d\'employés aux compétences critiques',
                        'Documenter les procédures pour faciliter les remplacements',
                        'Mettre en place des binômes avec compétences complémentaires'
                    ]
                },
                {
                    type: 'POLICY',
                    description: 'Ajustement des règles de détection des conflits',
                    impact: 'MEDIUM',
                    suggestedActions: [
                        'Assouplir les règles pour les conflits fréquemment overridés',
                        'Renforcer les règles pour les périodes critiques',
                        'Créer des règles spécifiques par équipe selon leurs besoins'
                    ]
                }
            ];
        } catch (error: unknown) {
            logger.error('Erreur lors de la génération des recommandations:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de générer des recommandations');
        }
    }

    /**
     * Calcule l'impact des conflits sur les délais d'approbation
     */
    async analyzeConflictImpactOnApprovalTime(filters: ConflictAnalyticsFilters = {}): Promise<{
        withConflicts: number; // temps moyen en heures
        withoutConflicts: number; // temps moyen en heures
        bySeverity: Record<ConflictSeverity, number>;
        byType: Record<ConflictType, number>;
    }> {
        try {
            // Simulation de données pour le moment
            return {
                withConflicts: 36.8, // heures
                withoutConflicts: 12.4, // heures
                bySeverity: {
                    [ConflictSeverity.INFORMATION]: 18.2,
                    [ConflictSeverity.AVERTISSEMENT]: 32.5,
                    [ConflictSeverity.BLOQUANT]: 59.7,
                },
                byType: {
                    [ConflictType.TEAM_ABSENCE]: 28.3,
                    [ConflictType.SPECIALTY_CAPACITY]: 35.2,
                    [ConflictType.USER_LEAVE_OVERLAP]: 15.4,
                    [ConflictType.CRITICAL_ROLE]: 42.1,
                    [ConflictType.DEADLINE_PROXIMITY]: 33.8,
                    [ConflictType.DUTY_CONFLICT]: 29.5,
                    [ConflictType.ON_CALL_CONFLICT]: 31.2,
                    [ConflictType.ASSIGNMENT_CONFLICT]: 22.6,
                    [ConflictType.RECURRING_MEETING]: 18.9,
                    [ConflictType.HOLIDAY_PROXIMITY]: 21.3,
                    [ConflictType.SPECIAL_PERIOD]: 25.7,
                    [ConflictType.HIGH_WORKLOAD]: 30.4,
                    [ConflictType.OTHER]: 20.1,
                },
            };
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'analyse de l\'impact des conflits:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible d\'analyser l\'impact des conflits');
        }
    }

    /**
     * Identifie les périodes à fort risque de conflits
     */
    async identifyHighRiskPeriods(year: number): Promise<{
        period: string;
        riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        expectedConflicts: number;
        dominantTypes: ConflictType[];
    }[]> {
        try {
            // Simulation de données pour le moment
            return [
                {
                    period: `${year}-06-15/${year}-07-15`,
                    riskLevel: 'HIGH',
                    expectedConflicts: 45,
                    dominantTypes: [ConflictType.TEAM_ABSENCE, ConflictType.SPECIALTY_CAPACITY]
                },
                {
                    period: `${year}-12-15/${year}-01-05`,
                    riskLevel: 'HIGH',
                    expectedConflicts: 38,
                    dominantTypes: [ConflictType.TEAM_ABSENCE, ConflictType.CRITICAL_ROLE]
                },
                {
                    period: `${year}-08-01/${year}-08-31`,
                    riskLevel: 'MEDIUM',
                    expectedConflicts: 30,
                    dominantTypes: [ConflictType.TEAM_ABSENCE]
                },
                {
                    period: `${year}-04-15/${year}-05-15`,
                    riskLevel: 'MEDIUM',
                    expectedConflicts: 25,
                    dominantTypes: [ConflictType.DEADLINE_PROXIMITY, ConflictType.TEAM_ABSENCE]
                }
            ];
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'identification des périodes à risque:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible d\'identifier les périodes à risque');
        }
    }

    /**
     * Exporte les données d'analyse au format CSV
     */
    async exportAnalyticsToCSV(filters: ConflictAnalyticsFilters = {}): Promise<string> {
        try {
            const stats = await this.getConflictStats(filters);
            const trends = await this.getConflictTrends('monthly', filters);

            // Simulation d'export CSV - dans une implémentation réelle, nous construirions un vrai CSV
            return 'data:text/csv;charset=utf-8,Date,Conflits Totaux,Conflits Équipe,Conflits Capacité...\n' +
                '2023-06,32,12,8\n' +
                '2023-07,45,18,11\n' +
                '...';
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'export des données:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible d\'exporter les données d\'analyse');
        }
    }
} 