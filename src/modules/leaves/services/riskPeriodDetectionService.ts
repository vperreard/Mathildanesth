import { formatDate, parseDate } from '../../../utils/dateUtils';
import { addDays, subDays, eachDayOfInterval, format, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveRequest } from '../types/leave';
import { ConflictType, ConflictSeverity } from '../types/conflict';
import { EventBusService } from '@/services/eventBusService';
import { logError } from '@/services/errorLoggingService';

/**
 * Interface pour décrire une période à risque
 */
export interface RiskPeriod {
    id: string;
    startDate: string;
    endDate: string;
    riskLevel: RiskLevel;
    riskScore: number;
    affectedTeams: string[];
    affectedDepartments: string[];
    reason: string;
    conflictTypes: ConflictType[];
    expectedConflictCount: number;
    historicalConflictRate: number;
    isActive: boolean;
    createdAt: string;
}

/**
 * Niveau de risque d'une période
 */
export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

/**
 * Options pour la détection des périodes à risque
 */
export interface RiskDetectionOptions {
    lookAheadDays: number;
    historicalAnalysisMonths: number;
    minimumRiskScoreThreshold: number;
    enableHolidayDetection: boolean;
    enableSeasonalityAnalysis: boolean;
    enableTeamCapacityAnalysis: boolean;
    riskLevelThresholds: {
        medium: number;
        high: number;
        critical: number;
    };
}

/**
 * Service de détection des périodes à risque de conflits
 */
export class RiskPeriodDetectionService {
    private static instance: RiskPeriodDetectionService;
    private eventBus: EventBusService;
    private riskPeriods: RiskPeriod[] = [];
    private options: RiskDetectionOptions;
    private knownHolidays: { date: string; name: string }[] = [];
    private historicalData: {
        date: string;
        conflictCount: number;
        leaveCount: number;
        teamAbsenceRates: Record<string, number>;
    }[] = [];

    private constructor() {
        this.eventBus = EventBusService.getInstance();
        this.options = {
            lookAheadDays: 90, // Analyser les 90 prochains jours
            historicalAnalysisMonths: 12, // Utiliser les données des 12 derniers mois
            minimumRiskScoreThreshold: 30, // Score minimum pour considérer une période à risque
            enableHolidayDetection: true,
            enableSeasonalityAnalysis: true,
            enableTeamCapacityAnalysis: true,
            riskLevelThresholds: {
                medium: 40,
                high: 65,
                critical: 85
            }
        };

        // Initialiser les jours fériés connus
        this.initializeHolidays();

        // S'abonner aux événements pertinents
        this.subscribeToEvents();
    }

    /**
     * Obtenir l'instance singleton du service
     */
    public static getInstance(): RiskPeriodDetectionService {
        if (!RiskPeriodDetectionService.instance) {
            RiskPeriodDetectionService.instance = new RiskPeriodDetectionService();
        }
        return RiskPeriodDetectionService.instance;
    }

    /**
     * Initialiser les jours fériés connus
     */
    private initializeHolidays(): void {
        const currentYear = new Date().getFullYear();

        // Liste des jours fériés français
        this.knownHolidays = [
            { date: `${currentYear}-01-01`, name: 'Jour de l\'An' },
            { date: `${currentYear}-05-01`, name: 'Fête du Travail' },
            { date: `${currentYear}-05-08`, name: 'Victoire 1945' },
            { date: `${currentYear}-07-14`, name: 'Fête Nationale' },
            { date: `${currentYear}-08-15`, name: 'Assomption' },
            { date: `${currentYear}-11-01`, name: 'Toussaint' },
            { date: `${currentYear}-11-11`, name: 'Armistice 1918' },
            { date: `${currentYear}-12-25`, name: 'Noël' },
            // Périodes de vacances scolaires (approximatives)
            ...this.generateSchoolHolidayPeriods(currentYear)
        ];
    }

    /**
     * Générer les périodes de vacances scolaires (approximatives)
     */
    private generateSchoolHolidayPeriods(year: number): { date: string; name: string }[] {
        const holidays = [];

        // Vacances d'hiver (approximatives)
        for (let day = 1; day <= 15; day++) {
            holidays.push({
                date: `${year}-02-${day.toString().padStart(2, '0')}`,
                name: 'Vacances d\'hiver'
            });
        }

        // Vacances de printemps (approximatives)
        for (let day = 15; day <= 30; day++) {
            holidays.push({
                date: `${year}-04-${day.toString().padStart(2, '0')}`,
                name: 'Vacances de printemps'
            });
        }

        // Vacances d'été (approximatives)
        for (let day = 1; day <= 31; day++) {
            holidays.push({
                date: `${year}-07-${day.toString().padStart(2, '0')}`,
                name: 'Vacances d\'été'
            });
        }
        for (let day = 1; day <= 31; day++) {
            holidays.push({
                date: `${year}-08-${day.toString().padStart(2, '0')}`,
                name: 'Vacances d\'été'
            });
        }

        // Vacances de la Toussaint (approximatives)
        for (let day = 20; day <= 31; day++) {
            holidays.push({
                date: `${year}-10-${day.toString().padStart(2, '0')}`,
                name: 'Vacances de la Toussaint'
            });
        }
        for (let day = 1; day <= 5; day++) {
            holidays.push({
                date: `${year}-11-${day.toString().padStart(2, '0')}`,
                name: 'Vacances de la Toussaint'
            });
        }

        // Vacances de Noël (approximatives)
        for (let day = 20; day <= 31; day++) {
            holidays.push({
                date: `${year}-12-${day.toString().padStart(2, '0')}`,
                name: 'Vacances de Noël'
            });
        }

        return holidays;
    }

    /**
     * S'abonner aux événements pertinents
     */
    private subscribeToEvents(): void {
        // S'abonner aux changements de congés
        this.eventBus.subscribe('leave.created', this.handleLeaveChange.bind(this));
        this.eventBus.subscribe('leave.updated', this.handleLeaveChange.bind(this));
        this.eventBus.subscribe('leave.deleted', this.handleLeaveChange.bind(this));

        // S'abonner aux résolutions de conflits (pour l'apprentissage)
        this.eventBus.subscribe('conflict.resolved', this.handleConflictResolution.bind(this));

        // Planifier une analyse périodique
        setInterval(() => {
            this.analyzeRiskPeriods();
        }, 24 * 60 * 60 * 1000); // Analyser une fois par jour
    }

    /**
     * Gérer un changement de congé
     */
    private handleLeaveChange(event: unknown): void {
        // Un nouveau congé peut créer une nouvelle période à risque
        this.analyzeRiskPeriods();
    }

    /**
     * Gérer une résolution de conflit
     */
    private handleConflictResolution(event: unknown): void {
        // Utiliser les résolutions pour améliorer l'analyse future
        this.updateHistoricalData(event.data);
    }

    /**
     * Mettre à jour les données historiques
     */
    private updateHistoricalData(resolution: unknown): void {
        const date = resolution.resolvedAt?.split('T')[0] || formatDate(new Date());

        // Trouver l'index des données historiques pour cette date
        const index = this.historicalData.findIndex(data => data.date === date);

        if (index >= 0) {
            // Mettre à jour les données existantes
            this.historicalData[index].conflictCount++;
        } else {
            // Ajouter une nouvelle entrée
            this.historicalData.push({
                date,
                conflictCount: 1,
                leaveCount: 0,
                teamAbsenceRates: {}
            });
        }
    }

    /**
     * Analyser les périodes à risque
     */
    public analyzeRiskPeriods(): RiskPeriod[] {
        try {
            const today = new Date();
            const endDate = addDays(today, this.options.lookAheadDays);

            // Réinitialiser les périodes à risque inactives
            this.riskPeriods = this.riskPeriods.filter(period => period.isActive);

            // Analyser chaque jour de la période
            const days = eachDayOfInterval({ start: today, end: endDate });
            let currentRiskPeriod: Partial<RiskPeriod> | null = null;

            for (const day of days) {
                const formattedDate = formatDate(day);

                // Calculer le score de risque pour ce jour
                const riskScore = this.calculateDailyRiskScore(day);

                // Déterminer le niveau de risque
                const riskLevel = this.determineRiskLevel(riskScore);

                // Si le risque est significatif, créer ou étendre une période à risque
                if (riskScore >= this.options.minimumRiskScoreThreshold) {
                    if (!currentRiskPeriod) {
                        // Créer une nouvelle période à risque
                        currentRiskPeriod = {
                            id: `risk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            startDate: formattedDate,
                            riskLevel,
                            riskScore,
                            affectedTeams: [],
                            affectedDepartments: [],
                            reason: this.determineRiskReason(day, riskScore),
                            conflictTypes: this.predictConflictTypes(day, riskScore),
                            expectedConflictCount: this.predictConflictCount(day, riskScore),
                            historicalConflictRate: this.calculateHistoricalConflictRate(day),
                            isActive: true,
                            createdAt: formatDate(new Date())
                        };
                    } else {
                        // Mettre à jour le niveau de risque si nécessaire
                        if (this.getRiskLevelValue(riskLevel) > this.getRiskLevelValue(currentRiskPeriod.riskLevel as RiskLevel)) {
                            currentRiskPeriod.riskLevel = riskLevel;
                        }

                        // Mettre à jour le score de risque (moyenne)
                        currentRiskPeriod.riskScore = Math.max(currentRiskPeriod.riskScore || 0, riskScore);

                        // Ajouter des types de conflits s'ils ne sont pas déjà présents
                        const newConflictTypes = this.predictConflictTypes(day, riskScore);
                        for (const type of newConflictTypes) {
                            if (!currentRiskPeriod.conflictTypes?.includes(type)) {
                                currentRiskPeriod.conflictTypes = [...(currentRiskPeriod.conflictTypes || []), type];
                            }
                        }

                        // Mettre à jour le nombre de conflits attendus
                        currentRiskPeriod.expectedConflictCount = (currentRiskPeriod.expectedConflictCount || 0) +
                            this.predictConflictCount(day, riskScore) / days.length;
                    }
                } else if (currentRiskPeriod) {
                    // Fermer la période à risque actuelle
                    currentRiskPeriod.endDate = formatDate(subDays(day, 1));

                    // Ajouter la période complétée à la liste
                    this.riskPeriods.push(currentRiskPeriod as RiskPeriod);

                    // Réinitialiser la période actuelle
                    currentRiskPeriod = null;

                    // Émettre un événement pour la nouvelle période à risque
                    this.eventBus.emit({
                        type: 'risk.period.detected',
                        data: this.riskPeriods[this.riskPeriods.length - 1]
                    });
                }
            }

            // Si une période est en cours à la fin de l'analyse, la finaliser
            if (currentRiskPeriod) {
                currentRiskPeriod.endDate = formatDate(endDate);
                this.riskPeriods.push(currentRiskPeriod as RiskPeriod);

                // Émettre un événement pour la nouvelle période à risque
                this.eventBus.emit({
                    type: 'risk.period.detected',
                    data: this.riskPeriods[this.riskPeriods.length - 1]
                });
            }

            return this.riskPeriods;
        } catch (error: unknown) {
            logError('Erreur lors de l\'analyse des périodes à risque', error);
            return [];
        }
    }

    /**
     * Calculer le score de risque quotidien
     */
    private calculateDailyRiskScore(date: Date): number {
        let score = 0;

        // 1. Vérifier si c'est un jour férié ou une période de vacances
        if (this.options.enableHolidayDetection && this.isHoliday(date)) {
            score += 25;
        }

        // 2. Vérifier si c'est une période saisonnière à risque (été, fin d'année)
        if (this.options.enableSeasonalityAnalysis) {
            score += this.calculateSeasonalityScore(date);
        }

        // 3. Analyser la capacité de l'équipe et les tendances historiques
        if (this.options.enableTeamCapacityAnalysis) {
            score += this.calculateTeamCapacityScore(date);
        }

        // 4. Ajouter un score basé sur les conflits historiques à cette période
        score += this.calculateHistoricalConflictScore(date);

        // 5. Ajouter un score pour les facteurs externes (weekends proches, etc.)
        score += this.calculateExternalFactorsScore(date);

        // Limiter le score entre 0 et 100
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Vérifier si une date est un jour férié ou en période de vacances
     */
    private isHoliday(date: Date): boolean {
        const formattedDate = formatDate(date);
        return this.knownHolidays.some(holiday => holiday.date === formattedDate);
    }

    /**
     * Calculer le score de saisonnalité
     */
    private calculateSeasonalityScore(date: Date): number {
        const month = date.getMonth() + 1;
        let score = 0;

        // Périodes saisonnières à risque élevé
        if (month === 7 || month === 8) {
            // Été (juillet-août)
            score += 30;
        } else if (month === 12 || month === 1) {
            // Période des fêtes (décembre-janvier)
            score += 35;
        } else if (month === 5) {
            // Mai (nombreux jours fériés)
            score += 20;
        } else if (month === 2 || month === 4) {
            // Vacances scolaires fréquentes
            score += 15;
        }

        return score;
    }

    /**
     * Calculer le score basé sur la capacité de l'équipe
     */
    private calculateTeamCapacityScore(date: Date): number {
        // Cette méthode nécessiterait des données réelles sur les effectifs
        // Pour cette démonstration, utilisons une approximation basée sur les données historiques

        const formattedDate = formatDate(date);
        const previousYearData = this.historicalData.find(data => {
            const dataDate = new Date(data.date);
            return dataDate.getMonth() === date.getMonth() &&
                dataDate.getDate() === date.getDate() &&
                dataDate.getFullYear() === date.getFullYear() - 1;
        });

        if (previousYearData) {
            // Calculer un score basé sur les taux d'absence historiques
            const avgAbsenceRate = Object.values(previousYearData.teamAbsenceRates).reduce(
                (sum, rate) => sum + rate, 0
            ) / Object.values(previousYearData.teamAbsenceRates).length;

            return avgAbsenceRate * 50; // Convertir en score (0-50)
        }

        return 0;
    }

    /**
     * Calculer le score basé sur les conflits historiques
     */
    private calculateHistoricalConflictScore(date: Date): number {
        const month = date.getMonth();
        const day = date.getDate();

        // Trouver les données historiques pour le même mois/jour
        const relevantData = this.historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate.getMonth() === month && dataDate.getDate() === day;
        });

        if (relevantData.length > 0) {
            // Calculer le taux moyen de conflits
            const avgConflictCount = relevantData.reduce(
                (sum, data) => sum + data.conflictCount, 0
            ) / relevantData.length;

            // Convertir en score (0-25)
            return Math.min(25, avgConflictCount * 5);
        }

        return 0;
    }

    /**
     * Calculer le score basé sur les facteurs externes
     */
    private calculateExternalFactorsScore(date: Date): number {
        let score = 0;

        // Vérifier si c'est un vendredi (risque accru de demandes de congés)
        if (date.getDay() === 5) {
            score += 10;
        }

        // Vérifier si c'est un lundi (risque accru de demandes de congés)
        if (date.getDay() === 1) {
            score += 8;
        }

        // Vérifier la proximité des weekends
        if (date.getDay() === 4 || date.getDay() === 2) {
            score += 5; // Jeudi ou mardi (proche du weekend)
        }

        return score;
    }

    /**
     * Déterminer le niveau de risque en fonction du score
     */
    private determineRiskLevel(score: number): RiskLevel {
        if (score >= this.options.riskLevelThresholds.critical) {
            return RiskLevel.CRITICAL;
        } else if (score >= this.options.riskLevelThresholds.high) {
            return RiskLevel.HIGH;
        } else if (score >= this.options.riskLevelThresholds.medium) {
            return RiskLevel.MEDIUM;
        } else {
            return RiskLevel.LOW;
        }
    }

    /**
     * Déterminer la raison principale du risque
     */
    private determineRiskReason(date: Date, score: number): string {
        const reasons = [];

        // Vérifier les vacances
        if (this.isHoliday(date)) {
            const holiday = this.knownHolidays.find(h => h.date === formatDate(date));
            if (holiday) {
                reasons.push(`Période de ${holiday.name}`);
            }
        }

        // Vérifier la saisonnalité
        const month = date.getMonth() + 1;
        if (month === 7 || month === 8) {
            reasons.push('Période estivale (congés d\'été)');
        } else if (month === 12) {
            reasons.push('Période des fêtes de fin d\'année');
        }

        // Vérifier les facteurs de capacité d'équipe
        if (this.calculateTeamCapacityScore(date) > 20) {
            reasons.push('Capacité d\'équipe historiquement réduite');
        }

        // Si aucune raison spécifique n'est identifiée
        if (reasons.length === 0) {
            reasons.push('Multiples facteurs combinés');
        }

        return reasons.join(', ');
    }

    /**
     * Prédire les types de conflits probables
     */
    private predictConflictTypes(date: Date, score: number): ConflictType[] {
        const types = [];

        // Période estivale ou fêtes -> Conflits d'équipe probables
        if (this.calculateSeasonalityScore(date) > 25) {
            types.push(ConflictType.TEAM_ABSENCE);
            types.push(ConflictType.TEAM_CAPACITY);
        }

        // Jours fériés -> Conflits de chevauchement probables
        if (this.isHoliday(date)) {
            types.push(ConflictType.USER_LEAVE_OVERLAP);
            types.push(ConflictType.HOLIDAY_PROXIMITY);
        }

        // Score élevé -> Rôles critiques probablement affectés
        if (score > 70) {
            types.push(ConflictType.CRITICAL_ROLE);
        }

        // Si aucun type spécifique n'est prédit
        if (types.length === 0) {
            types.push(ConflictType.USER_LEAVE_OVERLAP);
        }

        return types;
    }

    /**
     * Prédire le nombre de conflits attendus
     */
    private predictConflictCount(date: Date, score: number): number {
        // Cette méthode utiliserait idéalement un template prédictif basé sur des données historiques
        // Pour cette démonstration, utilisons une formule simple
        const baseCount = (score / 20); // 0-5 conflits selon le score

        // Ajuster en fonction de la saisonnalité
        const seasonalityFactor = this.calculateSeasonalityScore(date) / 50 + 1; // 1-1.7

        // Ajuster en fonction du jour de la semaine
        const dayFactor = date.getDay() === 5 || date.getDay() === 1 ? 1.3 : 1; // 1.3 pour lundi/vendredi

        // Calculer le nombre prédit
        return Math.round(baseCount * seasonalityFactor * dayFactor);
    }

    /**
     * Calculer le taux de conflits historique
     */
    private calculateHistoricalConflictRate(date: Date): number {
        const month = date.getMonth();

        // Trouver les données historiques pour le même mois
        const relevantData = this.historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate.getMonth() === month;
        });

        if (relevantData.length > 0) {
            // Calculer le ratio conflits/congés
            const totalConflicts = relevantData.reduce((sum, data) => sum + data.conflictCount, 0);
            const totalLeaves = relevantData.reduce((sum, data) => sum + data.leaveCount, 0);

            return totalLeaves > 0 ? totalConflicts / totalLeaves : 0;
        }

        return 0;
    }

    /**
     * Obtenir la valeur numérique d'un niveau de risque
     */
    private getRiskLevelValue(level: RiskLevel): number {
        switch (level) {
            case RiskLevel.CRITICAL:
                return 4;
            case RiskLevel.HIGH:
                return 3;
            case RiskLevel.MEDIUM:
                return 2;
            case RiskLevel.LOW:
            default:
                return 1;
        }
    }

    /**
     * Obtenir toutes les périodes à risque
     */
    public getRiskPeriods(): RiskPeriod[] {
        return this.riskPeriods;
    }

    /**
     * Obtenir les périodes à risque actuelles (qui incluent la date d'aujourd'hui)
     */
    public getCurrentRiskPeriods(): RiskPeriod[] {
        const today = formatDate(new Date());

        return this.riskPeriods.filter(period =>
            period.startDate <= today &&
            period.endDate >= today &&
            period.isActive
        );
    }

    /**
     * Obtenir les périodes à risque à venir
     */
    public getUpcomingRiskPeriods(days: number = 30): RiskPeriod[] {
        const today = new Date();
        const futureDate = formatDate(addDays(today, days));
        const todayFormatted = formatDate(today);

        return this.riskPeriods.filter(period =>
            period.startDate > todayFormatted &&
            period.startDate <= futureDate &&
            period.isActive
        );
    }

    /**
     * Désactiver une période à risque
     */
    public deactivateRiskPeriod(periodId: string): boolean {
        const index = this.riskPeriods.findIndex(period => period.id === periodId);

        if (index >= 0) {
            this.riskPeriods[index].isActive = false;

            // Émettre un événement pour la désactivation
            this.eventBus.emit({
                type: 'risk.period.deactivated',
                data: this.riskPeriods[index]
            });

            return true;
        }

        return false;
    }

    /**
     * Mettre à jour les options de détection
     */
    public updateOptions(newOptions: Partial<RiskDetectionOptions>): void {
        this.options = {
            ...this.options,
            ...newOptions
        };

        // Relancer l'analyse avec les nouvelles options
        this.analyzeRiskPeriods();
    }
} 