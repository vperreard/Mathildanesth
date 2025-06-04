// Service pour l'analyse et les prédictions avancées
import { prisma } from '@/lib/prisma';


// Interfaces pour les types de données d'analyse
export interface GuardDutyDistribution {
    userId: string;
    userName: string;
    guardCount: number;
    onCallCount: number;
    totalHours: number;
    weightedScore: number; // Score pondéré tenant compte du type et de la durée
}

export interface LeavePeakAnalysis {
    period: string; // Format 'YYYY-MM'
    requestCount: number;
    approvalRate: number;
    isHolidayPeriod: boolean;
    isSchoolHoliday: boolean;
    trend: 'increasing' | 'stable' | 'decreasing';
    previousPeriodDelta: number; // Variation par rapport à la période précédente
}

export interface PredictiveInsight {
    type: 'leave_request' | 'staffing_issue' | 'guard_imbalance';
    probability: number; // 0-1
    description: string;
    suggestedAction?: string;
    affectedPeriod: string;
}

/**
 * Récupère la distribution des gardes et astreintes par personne
 */
export async function getGuardDutyDistributionStats(): Promise<GuardDutyDistribution[]> {
    try {
        // Dans une implémentation réelle, nous interrogerions la base de données
        // pour obtenir ces statistiques à partir des gardes/vacations et des gardes

        // Exemple de code qui pourrait être utilisé:
        /*
        const guardStats = await prisma.$queryRaw`
          SELECT 
            u.id as userId,
            CONCAT(u.firstName, ' ', u.lastName) as userName,
            COUNT(CASE WHEN a.type = 'GUARD' THEN 1 END) as guardCount,
            COUNT(CASE WHEN a.type = 'ON_CALL' THEN 1 END) as onCallCount,
            SUM(TIMESTAMPDIFF(HOUR, a.startTime, a.endTime)) as totalHours,
            SUM(
              CASE 
                WHEN a.type = 'GUARD' THEN TIMESTAMPDIFF(HOUR, a.startTime, a.endTime) * 1.5
                WHEN a.type = 'ON_CALL' THEN TIMESTAMPDIFF(HOUR, a.startTime, a.endTime) * 1.0
                ELSE 0 
              END
            ) as weightedScore
          FROM 
            users u
          LEFT JOIN 
            attributions a ON u.id = a.userId
          WHERE 
            a.startTime >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            AND (a.type = 'GUARD' OR a.type = 'ON_CALL')
          GROUP BY 
            u.id, userName
          ORDER BY 
            weightedScore DESC
        `;
        return guardStats;
        */

        // Pour la démonstration, nous utilisons des données simulées
        return getMockGuardDistributionStats();
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques de garde:", error);
        throw error;
    }
}

/**
 * Analyse les pics de demandes de congés et leur corrélation avec les périodes spéciales
 */
export async function getLeavePeakAnalysis(): Promise<LeavePeakAnalysis[]> {
    try {
        // Dans une implémentation réelle, nous interrogerions la base de données
        // pour analyser les tendances des demandes de congés

        // Exemple de code qui pourrait être utilisé:
        /*
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear - 1, 0, 1); // 1er janvier de l'année précédente
        
        // Récupérer les demandes de congés par mois
        const leaveRequests = await prisma.$queryRaw`
          SELECT 
            DATE_FORMAT(requestDate, '%Y-%m') as period,
            COUNT(*) as requestCount,
            SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) / COUNT(*) as approvalRate
          FROM 
            leaveRequests
          WHERE 
            requestDate >= ${startDate}
          GROUP BY 
            period
          ORDER BY 
            period
        `;
        
        // Enrichir avec les informations sur les périodes de vacances
        const enrichedData = await Promise.all(
          leaveRequests.map(async (period) => {
            const [year, month] = period.period.split('-');
            
            // Vérifier si c'est une période de vacances scolaires
            const isSchoolHoliday = await prisma.schoolHolidays.findFirst({
              where: {
                startDate: {
                  lte: new Date(parseInt(year), parseInt(month), 1)
                },
                endDate: {
                  gte: new Date(parseInt(year), parseInt(month), 0)
                }
              }
            });
            
            // Vérifier s'il y a des jours fériés dans ce mois
            const publicHolidays = await prisma.publicHolidays.count({
              where: {
                date: {
                  gte: new Date(parseInt(year), parseInt(month) - 1, 1),
                  lt: new Date(parseInt(year), parseInt(month), 1)
                }
              }
            });
            
            // Calculer la tendance par rapport à la période précédente
            const previousPeriod = await prisma.$queryRaw`
              SELECT 
                COUNT(*) as requestCount
              FROM 
                leaveRequests
              WHERE 
                DATE_FORMAT(requestDate, '%Y-%m') = ${getPreviousPeriod(period.period)}
            `;
            
            const previousCount = previousPeriod[0]?.requestCount || 0;
            const currentCount = period.requestCount;
            
            const previousPeriodDelta = previousCount > 0 
              ? ((currentCount - previousCount) / previousCount) * 100 
              : 0;
            
            let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
            if (previousPeriodDelta > 10) trend = 'increasing';
            if (previousPeriodDelta < -10) trend = 'decreasing';
            
            return {
              ...period,
              isHolidayPeriod: publicHolidays > 0,
              isSchoolHoliday: !!isSchoolHoliday,
              trend,
              previousPeriodDelta
            };
          })
        );
        
        return enrichedData;
        */

        // Pour la démonstration, utilisons des données simulées
        return getMockLeavePeakAnalysis();
    } catch (error) {
        console.error("Erreur lors de l'analyse des pics de congés:", error);
        throw error;
    }
}

/**
 * Génère des insights prédictifs basés sur les données historiques
 */
export async function getPredictiveInsights(): Promise<PredictiveInsight[]> {
    try {
        // Dans une implémentation réelle, nous utiliserions un modèle d'apprentissage
        // ou des algorithmes statistiques pour générer des prédictions

        // Pour la démonstration, utilisons des données simulées
        return getMockPredictiveInsights();
    } catch (error) {
        console.error("Erreur lors de la génération des insights prédictifs:", error);
        throw error;
    }
}

// Fonctions utilitaires pour générer des données de test

function getMockGuardDistributionStats(): GuardDutyDistribution[] {
    return [
        { userId: "1", userName: "Sophie Martin", guardCount: 15, onCallCount: 8, totalHours: 210, weightedScore: 285 },
        { userId: "2", userName: "Thomas Bernard", guardCount: 12, onCallCount: 14, totalHours: 230, weightedScore: 272 },
        { userId: "3", userName: "Marie Dupont", guardCount: 10, onCallCount: 12, totalHours: 190, weightedScore: 235 },
        { userId: "4", userName: "François Leroy", guardCount: 8, onCallCount: 10, totalHours: 156, weightedScore: 196 },
        { userId: "5", userName: "Camille Dubois", guardCount: 7, onCallCount: 15, totalHours: 182, weightedScore: 192.5 },
        { userId: "6", userName: "Julie Petit", guardCount: 6, onCallCount: 16, totalHours: 170, weightedScore: 179 },
        { userId: "7", userName: "Lucas Moreau", guardCount: 5, onCallCount: 12, totalHours: 142, weightedScore: 149.5 },
    ];
}

function getMockLeavePeakAnalysis(): LeavePeakAnalysis[] {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Générer les données pour les 12 derniers mois
    const periods = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        periods.push(`${year}-${month.toString().padStart(2, '0')}`);
    }

    return [
        {
            period: periods[0],
            requestCount: 18,
            approvalRate: 0.82,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: 5.9
        },
        {
            period: periods[1],
            requestCount: 17,
            approvalRate: 0.88,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: -5.6
        },
        {
            period: periods[2],
            requestCount: 18,
            approvalRate: 0.78,
            isHolidayPeriod: true,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: 0
        },
        {
            period: periods[3],
            requestCount: 25,
            approvalRate: 0.72,
            isHolidayPeriod: false,
            isSchoolHoliday: true,
            trend: 'increasing',
            previousPeriodDelta: 38.9
        },
        {
            period: periods[4],
            requestCount: 18,
            approvalRate: 0.94,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: -18.2
        },
        {
            period: periods[5],
            requestCount: 22,
            approvalRate: 0.68,
            isHolidayPeriod: true,
            isSchoolHoliday: false,
            trend: 'increasing',
            previousPeriodDelta: 22.2
        },
        {
            period: periods[6],
            requestCount: 42,
            approvalRate: 0.62,
            isHolidayPeriod: false,
            isSchoolHoliday: true,
            trend: 'increasing',
            previousPeriodDelta: 133.3
        },
        {
            period: periods[7],
            requestCount: 18,
            approvalRate: 0.89,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'decreasing',
            previousPeriodDelta: -45.5
        },
        {
            period: periods[8],
            requestCount: 33,
            approvalRate: 0.70,
            isHolidayPeriod: true,
            isSchoolHoliday: true,
            trend: 'increasing',
            previousPeriodDelta: 50
        },
        {
            period: periods[9],
            requestCount: 22,
            approvalRate: 0.86,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: -8.3
        },
        {
            period: periods[10],
            requestCount: 24,
            approvalRate: 0.71,
            isHolidayPeriod: false,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: 4.3
        },
        {
            period: periods[11],
            requestCount: 23,
            approvalRate: 0.83,
            isHolidayPeriod: true,
            isSchoolHoliday: false,
            trend: 'stable',
            previousPeriodDelta: -4.2
        },
    ];
}

function getMockPredictiveInsights(): PredictiveInsight[] {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`;

    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const twoMonthsLaterStr = `${twoMonthsLater.getFullYear()}-${(twoMonthsLater.getMonth() + 1).toString().padStart(2, '0')}`;

    return [
        {
            type: 'leave_request',
            probability: 0.87,
            description: "Hausse probable des demandes de congés en période de vacances scolaires",
            suggestedAction: "Prévoir une augmentation de 35% des demandes et ajuster les quotas",
            affectedPeriod: nextMonthStr
        },
        {
            type: 'staffing_issue',
            probability: 0.75,
            description: "Risque de sous-effectif dans le service de cardiologie",
            suggestedAction: "Vérifier les plannings du service et prévoir des remplacements",
            affectedPeriod: nextMonthStr
        },
        {
            type: 'guard_imbalance',
            probability: 0.68,
            description: "Déséquilibre possible dans la répartition des gardes du weekend",
            suggestedAction: "Revoir la distribution des gardes pour les 4 prochains weekends",
            affectedPeriod: twoMonthsLaterStr
        },
        {
            type: 'leave_request',
            probability: 0.63,
            description: "Plusieurs demandes de congés pourraient se chevaucher dans le service urgences",
            suggestedAction: "Anticiper et proposer des alternatives pour étaler les départs",
            affectedPeriod: twoMonthsLaterStr
        }
    ];
} 