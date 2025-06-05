/**
 * Optimisations apportées à conflictDetectionService.ts :
 * 1. Mise en cache des vérifications fréquentes
 * 2. Calculs parallèles pour les différents types de conflits
 * 3. Vérifications progressives (arrêt précoce si un conflit bloquant est trouvé)
 * 4. Journalisation détaillée pour le débogage
 */

import { LeaveRequest, LeaveStatus, LeaveDuration } from '../types/leave';
import { logger } from "../../../lib/logger";
import {
    ConflictType,
    ConflictSeverity,
    LeaveConflict,
    ConflictRules,
    ConflictCheckResult
} from '../types/conflict';
import { User } from '../../../types/user';
import { UserService } from '../../../services/userService';
import { TeamService } from '../../teams/services/teamService';
import { PerformanceLogger } from '../../../utils/performanceLogger';

// Interface pour la configuration
interface ConfigService {
    getConfigValue<T>(key: string): Promise<T | null>;
    setConfigValue<T>(key: string, value: T): Promise<void>;
}

// Interface pour les entrées de cache
interface CacheKey {
    userId: string;
    startDate: string;
    endDate: string;
    leaveId?: string;
}

// Interface pour le résultat mis en cache
interface CachedResult {
    result: ConflictCheckResult;
    timestamp: number;
}

/**
 * Service de détection des conflits dans les demandes de congés
 * Ce service centralise la logique de vérification des conflits pour toutes les demandes de congés.
 * Il prend en compte différentes règles métier configurables et retourne un résultat structuré.
 * 
 * Optimisé pour les performances avec mise en cache et vérifications parallèles.
 */
export class ConflictDetectionService {
    private userService: UserService;
    private teamService: TeamService;
    private configService: ConfigService;
    private rules: ConflictRules;

    // Cache pour éviter de recalculer les mêmes vérifications
    private cache: Map<string, CachedResult> = new Map();
    private cacheTimeToLiveMs: number = 5 * 60 * 1000; // 5 minutes

    // Logger de performance
    private logger: PerformanceLogger;

    constructor(
        userService: UserService,
        teamService: TeamService,
        configService: ConfigService,
        initialRules: ConflictRules = {} // Règles par défaut
    ) {
        this.userService = userService;
        this.teamService = teamService;
        this.configService = configService;
        this.rules = initialRules;
        this.logger = new PerformanceLogger('ConflictDetectionService');
        this.initializeRules();
    }

    /**
     * Initialise les règles de détection des conflits à partir de la configuration
     */
    public async initializeRules(): Promise<void> {
        try {
            // Récupérer la configuration stockée pour les règles de conflit
            const storedRules = await this.configService.getConfigValue<ConflictRules>('leaveConflictRules');

            if (storedRules) {
                this.rules = {
                    ...this.rules, // Conserver les règles par défaut
                    ...storedRules // Surcharger avec les règles configurées
                };
                logger.info('Règles de conflit chargées depuis la configuration');
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des règles de conflit:', error);
            // Continuer avec les règles par défaut
        }
    }

    /**
     * Définit ou met à jour les règles de détection des conflits
     * @param newRules Nouvelles règles à appliquer
     */
    public setRules(newRules: Partial<ConflictRules>): void {
        this.rules = {
            ...this.rules,
            ...newRules
        };

        // Vider le cache car les règles ont changé
        this.clearCache();

        // Sauvegarder les nouvelles règles dans la configuration
        this.configService.setConfigValue('leaveConflictRules', this.rules)
            .catch(error => {
                logger.error('Erreur lors de la sauvegarde des règles de conflit:', error);
            });
    }

    /**
     * Récupère les règles de détection des conflits actuelles
     * @returns Les règles de conflit actuelles
     */
    public getRules(): ConflictRules {
        return { ...this.rules }; // Retourner une copie pour éviter les modifications externes
    }

    /**
     * Vide le cache des vérifications
     */
    public clearCache(): void {
        this.cache.clear();
        this.logger.log('Cache vidé');
    }

    /**
     * Configure la durée de vie du cache
     * @param ttlMs Durée de vie en millisecondes
     */
    public setCacheTTL(ttlMs: number): void {
        this.cacheTimeToLiveMs = ttlMs;
        this.logger.log(`TTL du cache défini à ${ttlMs}ms`);
    }

    /**
     * Génère une clé de cache pour une vérification
     * @param key Informations pour générer la clé
     * @returns Clé de cache unique
     */
    private generateCacheKey(key: CacheKey): string {
        return `${key.userId}|${key.startDate}|${key.endDate}|${key.leaveId || ''}`;
    }

    /**
     * Vérifie les conflits pour une demande de congés
     * @param leaveRequest Demande de congés à vérifier
     * @param existingLeaves Congés existants à prendre en compte
     * @param skipCache Si true, ignore le cache et recalcule
     * @returns Résultat de la vérification des conflits
     */
    async checkConflicts(
        leaveRequest: LeaveRequest,
        existingLeaves: LeaveRequest[] = [],
        skipCache: boolean = false
    ): Promise<ConflictCheckResult> {
        this.logger.startTimer('checkConflicts');

        // Validation des données d'entrée
        if (!leaveRequest) {
            throw new Error('Demande de congés non définie');
        }

        if (!leaveRequest.userId) {
            throw new Error('ID utilisateur non défini dans la demande de congés');
        }

        // Vérifier le cache si on ne doit pas l'ignorer
        if (!skipCache) {
            const cacheKey = this.generateCacheKey({
                userId: leaveRequest.userId,
                startDate: leaveRequest.startDate,
                endDate: leaveRequest.endDate,
                leaveId: leaveRequest.id
            });

            const cachedResult = this.cache.get(cacheKey);

            if (cachedResult && (Date.now() - cachedResult.timestamp) < this.cacheTimeToLiveMs) {
                this.logger.log(`Résultat trouvé dans le cache pour ${cacheKey}`);
                this.logger.endTimer('checkConflicts', 'depuis cache');
                return cachedResult.result;
            }
        }

        // Récupérer l'utilisateur concerné
        const user = await this.userService.getUserById(leaveRequest.userId);
        if (!user) {
            throw new Error(`Utilisateur ${leaveRequest.userId} non trouvé`);
        }

        // Récupérer les membres de l'équipe si l'utilisateur a un département
        let teamMembers: User[] = [];
        if (user.departmentId) {
            teamMembers = await this.teamService.getTeamMembers(user.departmentId);
        }

        const conflicts: LeaveConflict[] = [];

        // Optimisation 1: Vérifier d'abord les conflits les plus bloquants et les plus rapides à calculer
        // Vérifier en priorité si l'utilisateur a des congés qui se chevauchent pour un arrêt précoce
        this.logger.startTimer('checkUserLeaveOverlapConflicts');
        await this.checkUserLeaveOverlapConflicts(leaveRequest, user, existingLeaves, conflicts);
        this.logger.endTimer('checkUserLeaveOverlapConflicts');

        // Optimisation 2: Arrêt précoce si on a déjà des conflits bloquants
        const hasBlockers = conflicts.some(
            conflict => conflict.severity === ConflictSeverity.BLOQUANT
        );

        if (hasBlockers && this.rules.stopCheckingAfterBlockingConflict) {
            this.logger.log('Arrêt précoce: conflit bloquant détecté');
            const result = this.createResultFromConflicts(conflicts);
            this.cacheResult(leaveRequest, result);
            this.logger.endTimer('checkConflicts', 'arrêt précoce');
            return result;
        }

        // Optimisation 3: Exécution parallèle des vérifications de conflit non bloquantes
        // Les conflits critiques ont déjà été vérifiés, on lance maintenant les vérifications en parallèle
        this.logger.startTimer('conflictChecksParallel');
        const checkPromises = [
            this.checkTeamAbsenceConflicts(leaveRequest, existingLeaves, teamMembers, conflicts),
            this.checkCriticalRoleConflicts(leaveRequest, user, existingLeaves, conflicts),
            this.checkDeadlineProximityConflicts(leaveRequest, conflicts),
            this.checkHolidayProximityConflicts(leaveRequest, conflicts),
            this.checkRecurringMeetingConflicts(leaveRequest, user, conflicts),
            this.checkHighWorkloadPeriodConflicts(leaveRequest, conflicts)
        ];

        await Promise.all(checkPromises);
        this.logger.endTimer('conflictChecksParallel');

        // Créer le résultat
        const result = this.createResultFromConflicts(conflicts);

        // Mettre en cache le résultat
        this.cacheResult(leaveRequest, result);

        this.logger.endTimer('checkConflicts', 'calcul complet');
        return result;
    }

    /**
     * Met en cache le résultat d'une vérification
     * @param leaveRequest Demande de congés vérifiée
     * @param result Résultat à mettre en cache
     */
    private cacheResult(leaveRequest: LeaveRequest, result: ConflictCheckResult): void {
        const cacheKey = this.generateCacheKey({
            userId: leaveRequest.userId,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            leaveId: leaveRequest.id
        });

        this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });

        this.logger.log(`Résultat mis en cache pour ${cacheKey}`);
    }

    /**
     * Crée un résultat à partir des conflits détectés
     * @param conflicts Liste des conflits détectés
     * @returns Résultat structuré
     */
    private createResultFromConflicts(conflicts: LeaveConflict[]): ConflictCheckResult {
        const hasBlockers = conflicts.some(
            conflict => conflict.severity === ConflictSeverity.BLOQUANT
        );

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
            hasBlockers,
            canAutoApprove: !hasBlockers,
            requiresManagerReview: conflicts.length > 0
        };
    }

    /**
     * Vérifie si une demande de congés peut être automatiquement approuvée
     * @param leaveRequest Demande de congés à vérifier
     * @param existingLeaves Congés existants à prendre en compte
     * @returns true si la demande peut être approuvée automatiquement
     */
    async canAutoApprove(
        leaveRequest: LeaveRequest,
        existingLeaves: LeaveRequest[] = []
    ): Promise<boolean> {
        const result = await this.checkConflicts(leaveRequest, existingLeaves);
        return result.canAutoApprove;
    }

    /**
     * Vérifie les conflits de chevauchement avec les congés existants du même utilisateur
     */
    private async checkUserLeaveOverlapConflicts(
        leaveRequest: LeaveRequest,
        user: User,
        existingLeaves: LeaveRequest[],
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Optimisation: Filtrer les congés en une seule passe
        const userLeaves = existingLeaves.filter(leave =>
            leave.userId === user.id &&
            leave.id !== leaveRequest.id &&
            [LeaveStatus.APPROVED, LeaveStatus.PENDING].includes(leave.status)
        );

        // Convertir les dates de la demande une seule fois
        const requestStart = new Date(leaveRequest.startDate);
        const requestEnd = new Date(leaveRequest.endDate);

        // Vérifier le chevauchement avec chaque congé existant
        for (const leave of userLeaves) {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            // Vérifier si les périodes se chevauchent
            if (leaveStart <= requestEnd && leaveEnd >= requestStart) {
                // Créer un conflit de chevauchement
                conflicts.push({
                    id: `user-leave-overlap-${leave.id}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.USER_LEAVE_OVERLAP,
                    severity: ConflictSeverity.BLOQUANT,
                    description: `Chevauchement avec un congé existant du ${leaveStart.toLocaleDateString()} au ${leaveEnd.toLocaleDateString()}`,
                    startDate: leaveStart.toISOString().split('T')[0],
                    endDate: leaveEnd.toISOString().split('T')[0],
                    affectedUserIds: [user.id],
                    canOverride: false,
                    metadata: {
                        overlappingLeaveId: leave.id,
                        overlappingLeaveStatus: leave.status
                    }
                });

                // Optimisation: Si arrêt précoce configuré, on peut sortir dès qu'on a trouvé un conflit bloquant
                if (this.rules.stopCheckingAfterBlockingConflict) {
                    this.logger.log('Chevauchement détecté - arrêt précoce');
                    break;
                }
            }
        }
    }

    /**
     * Vérifie les conflits liés au taux d'absence dans l'équipe
     */
    private async checkTeamAbsenceConflicts(
        leaveRequest: LeaveRequest,
        existingLeaves: LeaveRequest[],
        teamMembers: User[],
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Vérifier si la règle est activée
        if (!this.rules.maxTeamAbsencePercentage) {
            return;
        }

        // Calculer le taux d'absence pour chaque jour de la période
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);

        // Pour chaque jour de la période demandée
        for (
            let currentDate = new Date(startDate);
            currentDate <= endDate;
            currentDate.setDate(currentDate.getDate() + 1)
        ) {
            // Ignorer les weekends
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                continue;
            }

            const currentDateStr = currentDate.toISOString().split('T')[0];

            // Compter les membres absents ce jour-là
            const absentMembers = teamMembers.filter(member => {
                // Vérifier si ce membre a un congé approuvé ce jour-là
                return existingLeaves.some(leave => {
                    // Ne considérer que les congés approuvés
                    if (leave.status !== LeaveStatus.APPROVED) {
                        return false;
                    }

                    // Vérifier si le congé inclut la date actuelle
                    const leaveStart = new Date(leave.startDate);
                    const leaveEnd = new Date(leave.endDate);
                    return (
                        leave.userId === member.id &&
                        leaveStart <= currentDate &&
                        leaveEnd >= currentDate
                    );
                });
            });

            // Calculer le pourcentage d'absences
            const absentPercentage = (absentMembers.length / teamMembers.length) * 100;

            // Si le pourcentage dépasse le seuil, créer un conflit
            if (absentPercentage >= this.rules.maxTeamAbsencePercentage) {
                conflicts.push({
                    id: `team-absence-${currentDateStr}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.TEAM_ABSENCE,
                    severity: ConflictSeverity.AVERTISSEMENT,
                    description: `${absentPercentage.toFixed(0)}% de l'équipe sera absent le ${currentDateStr}`,
                    startDate: currentDateStr,
                    endDate: currentDateStr,
                    affectedUserIds: absentMembers.map(member => member.id),
                    canOverride: true,
                    metadata: {
                        threshold: this.rules.maxTeamAbsencePercentage,
                        actual: absentPercentage,
                        teamSize: teamMembers.length,
                        absentCount: absentMembers.length
                    }
                });
            }
        }
    }

    /**
     * Vérifie les conflits liés aux rôles critiques
     */
    private async checkCriticalRoleConflicts(
        leaveRequest: LeaveRequest,
        user: User,
        existingLeaves: LeaveRequest[],
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Vérifier si la règle est activée
        if (!this.rules.criticalRolesRequireBackup) {
            return;
        }

        // Vérifier si l'utilisateur a un rôle critique
        if (!user.roles || !user.roles.some(role => role.isCritical)) {
            return; // Pas de rôle critique, on peut sortir
        }

        // Récupérer les rôles critiques de l'utilisateur
        const criticalRoles = user.roles.filter(role => role.isCritical);

        // Pour chaque rôle critique, vérifier s'il y a un remplaçant disponible
        for (const role of criticalRoles) {
            // Trouver les utilisateurs qui peuvent remplacer ce rôle
            const backups = await this.userService.getUsersByRole(role.id);

            // Filtrer l'utilisateur qui demande le congé
            const availableBackups = backups.filter(backup => backup.id !== user.id);

            if (availableBackups.length === 0) {
                // Pas de remplaçant disponible, créer un conflit bloquant
                conflicts.push({
                    id: `critical-role-${role.id}-no-backup`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.CRITICAL_ROLE,
                    severity: ConflictSeverity.BLOQUANT,
                    description: `Aucun remplaçant disponible pour le rôle critique "${role.name}"`,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    canOverride: false,
                    metadata: {
                        roleId: role.id,
                        roleName: role.name
                    }
                });
                continue;
            }

            // Vérifier si tous les remplaçants sont en congé pendant cette période
            const startDate = new Date(leaveRequest.startDate);
            const endDate = new Date(leaveRequest.endDate);

            const unavailableBackups = availableBackups.filter(backup => {
                return existingLeaves.some(leave => {
                    if (leave.status !== LeaveStatus.APPROVED || leave.userId !== backup.id) {
                        return false;
                    }

                    const leaveStart = new Date(leave.startDate);
                    const leaveEnd = new Date(leave.endDate);

                    // Vérifier si les périodes se chevauchent
                    return (
                        (leaveStart <= endDate && leaveEnd >= startDate)
                    );
                });
            });

            if (unavailableBackups.length === availableBackups.length) {
                // Tous les remplaçants sont absents, créer un conflit bloquant
                conflicts.push({
                    id: `critical-role-${role.id}-all-backups-absent`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.CRITICAL_ROLE,
                    severity: ConflictSeverity.BLOQUANT,
                    description: `Tous les remplaçants pour le rôle critique "${role.name}" sont absents pendant cette période`,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    affectedUserIds: unavailableBackups.map(backup => backup.id),
                    canOverride: true,
                    metadata: {
                        roleId: role.id,
                        roleName: role.name,
                        backupCount: availableBackups.length
                    }
                });
            }
        }
    }

    /**
     * Vérifie les conflits liés à la proximité des deadlines
     */
    private async checkDeadlineProximityConflicts(
        leaveRequest: LeaveRequest,
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Vérifier si la règle est activée
        if (!this.rules.minDaysBeforeDeadline) {
            return;
        }

        // TODO: Récupérer les deadlines du projet depuis un service de projets
        // Pour l'exemple, nous utilisons une deadline fictive

        const projectDeadlines = [
            {
                id: 'deadline1',
                projectId: 'project1',
                projectName: 'Projet A',
                name: 'Livraison MVP',
                date: '2023-12-15',
                importance: 'HIGH'
            }
        ];

        const endDate = new Date(leaveRequest.endDate);

        for (const deadline of projectDeadlines) {
            const deadlineDate = new Date(deadline.date);

            // Calculer le nombre de jours entre la fin du congé et la deadline
            const diffTime = deadlineDate.getTime() - endDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < this.rules.minDaysBeforeDeadline) {
                conflicts.push({
                    id: `deadline-proximity-${deadline.id}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.DEADLINE_PROXIMITY,
                    severity: deadline.importance === 'HIGH'
                        ? ConflictSeverity.BLOQUANT
                        : ConflictSeverity.AVERTISSEMENT,
                    description: `Le congé se termine ${diffDays} jours avant la deadline "${deadline.name}" du projet "${deadline.projectName}"`,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    canOverride: true,
                    metadata: {
                        deadlineId: deadline.id,
                        deadlineName: deadline.name,
                        deadlineDate: deadline.date,
                        projectId: deadline.projectId,
                        projectName: deadline.projectName,
                        daysBeforeDeadline: diffDays,
                        minDaysRequired: this.rules.minDaysBeforeDeadline
                    }
                });
            }
        }
    }

    /**
     * Vérifie les conflits liés à la proximité des jours fériés (ponts)
     */
    private async checkHolidayProximityConflicts(
        leaveRequest: LeaveRequest,
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Vérifier si la règle est activée
        if (!this.rules.blockHolidayBridging) {
            return;
        }

        // TODO: Récupérer les jours fériés depuis un service de calendrier
        // Pour l'exemple, nous utilisons des jours fériés fictifs

        const holidays = [
            { id: 'holiday1', name: 'Jour férié 1', date: '2023-12-25' },
            { id: 'holiday2', name: 'Jour férié 2', date: '2024-01-01' }
        ];

        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);

        for (const holiday of holidays) {
            const holidayDate = new Date(holiday.date);

            // Vérifier si le congé crée un pont avant le jour férié
            // (le congé se termine juste avant le jour férié)
            if (this.isAdjacentDate(endDate, holidayDate, 1)) {
                conflicts.push({
                    id: `holiday-bridge-before-${holiday.id}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.HOLIDAY_PROXIMITY,
                    severity: ConflictSeverity.AVERTISSEMENT,
                    description: `Le congé crée un pont avant le jour férié "${holiday.name}" (${holiday.date})`,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    canOverride: true,
                    metadata: {
                        holidayId: holiday.id,
                        holidayName: holiday.name,
                        holidayDate: holiday.date,
                        bridgeType: 'BEFORE'
                    }
                });
            }

            // Vérifier si le congé crée un pont après le jour férié
            // (le congé commence juste après le jour férié)
            if (this.isAdjacentDate(holidayDate, startDate, 1)) {
                conflicts.push({
                    id: `holiday-bridge-after-${holiday.id}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.HOLIDAY_PROXIMITY,
                    severity: ConflictSeverity.AVERTISSEMENT,
                    description: `Le congé crée un pont après le jour férié "${holiday.name}" (${holiday.date})`,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    canOverride: true,
                    metadata: {
                        holidayId: holiday.id,
                        holidayName: holiday.name,
                        holidayDate: holiday.date,
                        bridgeType: 'AFTER'
                    }
                });
            }
        }
    }

    /**
     * Vérifie les conflits liés aux réunions récurrentes
     */
    private async checkRecurringMeetingConflicts(
        leaveRequest: LeaveRequest,
        user: User,
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // TODO: Récupérer les réunions récurrentes de l'utilisateur
        // Pour l'exemple, nous utilisons des réunions fictives

        const recurringMeetings = [
            {
                id: 'meeting1',
                name: 'Réunion d\'équipe',
                description: 'Réunion hebdomadaire d\'équipe',
                dayOfWeek: 1, // Lundi
                timeStart: '09:00',
                timeEnd: '10:00',
                participantIds: [user.id], // L'utilisateur participe à cette réunion
                isRequired: true // Sa présence est requise
            }
        ];

        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);

        // Pour chaque jour de la période de congé
        for (
            let currentDate = new Date(startDate);
            currentDate <= endDate;
            currentDate.setDate(currentDate.getDate() + 1)
        ) {
            // Pour chaque réunion récurrente
            for (const meeting of recurringMeetings) {
                // Vérifier si le jour de la semaine correspond
                if (currentDate.getDay() === meeting.dayOfWeek) {
                    const currentDateStr = currentDate.toISOString().split('T')[0];

                    conflicts.push({
                        id: `recurring-meeting-${meeting.id}-${currentDateStr}`,
                        leaveId: leaveRequest.id,
                        type: ConflictType.RECURRING_MEETING,
                        severity: meeting.isRequired
                            ? ConflictSeverity.AVERTISSEMENT
                            : ConflictSeverity.INFORMATION,
                        description: `Conflit avec la réunion récurrente "${meeting.name}" (${meeting.timeStart}-${meeting.timeEnd})`,
                        startDate: currentDateStr,
                        endDate: currentDateStr,
                        canOverride: true,
                        metadata: {
                            meetingId: meeting.id,
                            meetingName: meeting.name,
                            meetingDescription: meeting.description,
                            meetingTime: `${meeting.timeStart}-${meeting.timeEnd}`,
                            isRequired: meeting.isRequired
                        }
                    });
                }
            }
        }
    }

    /**
     * Vérifie les conflits liés aux périodes de charge de travail élevée
     */
    private async checkHighWorkloadPeriodConflicts(
        leaveRequest: LeaveRequest,
        conflicts: LeaveConflict[]
    ): Promise<void> {
        // Vérifier si la règle est activée et si des périodes sont définies
        if (!this.rules.blockHighWorkloadPeriods || !this.rules.highWorkloadPeriods) {
            return;
        }

        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);

        // Pour chaque période de charge élevée
        for (const period of this.rules.highWorkloadPeriods) {
            const periodStart = new Date(period.startDate);
            const periodEnd = new Date(period.endDate);

            // Vérifier si les périodes se chevauchent
            if (
                (startDate <= periodEnd && endDate >= periodStart)
            ) {
                conflicts.push({
                    id: `high-workload-${period.startDate}-${period.endDate}`,
                    leaveId: leaveRequest.id,
                    type: ConflictType.HIGH_WORKLOAD,
                    severity: ConflictSeverity.BLOQUANT,
                    description: `Congé pendant une période de charge de travail élevée : ${period.description}`,
                    startDate: period.startDate,
                    endDate: period.endDate,
                    canOverride: true,
                    metadata: {
                        periodStart: period.startDate,
                        periodEnd: period.endDate,
                        description: period.description
                    }
                });
            }
        }
    }

    /**
     * Vérifie si deux dates sont adjacentes avec un écart donné
     * @param date1 Première date
     * @param date2 Deuxième date
     * @param gap Écart en jours
     * @returns True si les dates sont adjacentes avec l'écart spécifié
     */
    private isAdjacentDate(date1: Date, date2: Date, gap: number): boolean {
        const differenceInDays = Math.abs(
            (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
        );
        return differenceInDays <= gap;
    }
}

/**
 * Détecte les conflits de congés pour une demande donnée
 * @param leaveRequest Demande de congés à vérifier
 * @param existingLeaves Congés existants
 * @returns Liste des conflits détectés
 */
export const detectLeaveConflicts = async (
    leaveRequest: LeaveRequest,
    existingLeaves: LeaveRequest[] = []
): Promise<LeaveConflict[]> => {
    // Créer des services mockés pour cette fonction utilitaire
    const userService = {
        getUserById: async (id: string) => ({ 
            id, 
            name: 'User', 
            email: 'user@example.com',
            departmentId: 'dept1',
            roles: []
        } as User),
        getUsersByRole: async (roleId: string) => [] as User[]
    } as UserService;
    
    const teamService = {
        getTeamMembers: async (departmentId: string) => [] as User[]
    } as TeamService;
    
    const configService: ConfigService = {
        getConfigValue: async <T>(key: string) => null,
        setConfigValue: async <T>(key: string, value: T) => {}
    };
    
    const service = new ConflictDetectionService(userService, teamService, configService);
    const result = await service.checkConflicts(leaveRequest, existingLeaves);
    
    return result.conflicts;
};

/**
 * Valide les règles de conflit configurées
 * @param rules Règles de conflit à valider
 * @returns true si les règles sont valides
 */
export const validateConflictRules = (rules: ConflictRules): boolean => {
    try {
        // Vérifier que les pourcentages sont dans les limites valides
        if (rules.maxTeamAbsencePercentage !== undefined) {
            if (rules.maxTeamAbsencePercentage < 0 || rules.maxTeamAbsencePercentage > 100) {
                return false;
            }
        }

        // Vérifier que les jours minimum sont positifs
        if (rules.minDaysBeforeDeadline !== undefined) {
            if (rules.minDaysBeforeDeadline < 0) {
                return false;
            }
        }

        // Vérifier que les périodes de forte charge sont valides
        if (rules.highWorkloadPeriods) {
            for (const period of rules.highWorkloadPeriods) {
                const startDate = new Date(period.startDate);
                const endDate = new Date(period.endDate);
                
                if (startDate >= endDate) {
                    return false;
                }
            }
        }

        return true;
    } catch (error) {
        logger.error('Erreur lors de la validation des règles:', error);
        return false;
    }
};

/**
 * Résout un conflit en proposant des solutions
 * @param conflict Conflit à résoudre
 * @param leaveRequest Demande de congés concernée
 * @returns Solutions proposées
 */
export const resolveConflict = async (
    conflict: LeaveConflict,
    leaveRequest: LeaveRequest
): Promise<{
    canResolve: boolean;
    solutions: Array<{
        type: 'RESCHEDULE' | 'REDUCE_DURATION' | 'OVERRIDE' | 'SPLIT';
        description: string;
        newStartDate?: string;
        newEndDate?: string;
        metadata?: Record<string, any>;
    }>;
}> => {
    const solutions: Array<{
        type: 'RESCHEDULE' | 'REDUCE_DURATION' | 'OVERRIDE' | 'SPLIT';
        description: string;
        newStartDate?: string;
        newEndDate?: string;
        metadata?: Record<string, any>;
    }> = [];

    switch (conflict.type) {
        case ConflictType.USER_LEAVE_OVERLAP:
            if (conflict.canOverride) {
                solutions.push({
                    type: 'OVERRIDE',
                    description: 'Annuler le congé existant et approuver cette demande',
                    metadata: { overlappingLeaveId: conflict.metadata?.overlappingLeaveId }
                });
            }

            // Proposer de reprogrammer avant le conflit
            const conflictStart = new Date(conflict.startDate);
            const requestStart = new Date(leaveRequest.startDate);
            const requestEnd = new Date(leaveRequest.endDate);
            const duration = Math.ceil((requestEnd.getTime() - requestStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const newEndDate = new Date(conflictStart);
            newEndDate.setDate(newEndDate.getDate() - 1);
            const newStartDate = new Date(newEndDate);
            newStartDate.setDate(newStartDate.getDate() - duration + 1);

            solutions.push({
                type: 'RESCHEDULE',
                description: `Reprogrammer du ${newStartDate.toLocaleDateString()} au ${newEndDate.toLocaleDateString()}`,
                newStartDate: newStartDate.toISOString().split('T')[0],
                newEndDate: newEndDate.toISOString().split('T')[0]
            });
            break;

        case ConflictType.TEAM_ABSENCE:
            solutions.push({
                type: 'RESCHEDULE',
                description: 'Reprogrammer à une période avec moins d\'absences dans l\'équipe'
            });

            if (conflict.canOverride) {
                solutions.push({
                    type: 'OVERRIDE',
                    description: 'Approuver malgré le taux d\'absence élevé avec validation managériale'
                });
            }
            break;

        case ConflictType.CRITICAL_ROLE:
            solutions.push({
                type: 'RESCHEDULE',
                description: 'Reprogrammer à une période où un remplaçant est disponible'
            });
            break;

        case ConflictType.DEADLINE_PROXIMITY:
            const currentEnd = new Date(leaveRequest.endDate);
            const reducedEnd = new Date(currentEnd);
            reducedEnd.setDate(reducedEnd.getDate() - 3);

            solutions.push({
                type: 'REDUCE_DURATION',
                description: 'Réduire la durée pour finir plus tôt',
                newEndDate: reducedEnd.toISOString().split('T')[0]
            });

            if (conflict.canOverride) {
                solutions.push({
                    type: 'OVERRIDE',
                    description: 'Approuver avec validation managériale renforcée'
                });
            }
            break;

        case ConflictType.HIGH_WORKLOAD:
            const workloadStart = new Date(conflict.startDate);
            const workloadEnd = new Date(conflict.endDate);
            
            // Proposer avant la période
            const beforeEnd = new Date(workloadStart);
            beforeEnd.setDate(beforeEnd.getDate() - 1);
            const beforeStart = new Date(beforeEnd);
            beforeStart.setDate(beforeStart.getDate() - duration + 1);

            solutions.push({
                type: 'RESCHEDULE',
                description: `Reprogrammer avant la période de forte charge (${beforeStart.toLocaleDateString()} au ${beforeEnd.toLocaleDateString()})`,
                newStartDate: beforeStart.toISOString().split('T')[0],
                newEndDate: beforeEnd.toISOString().split('T')[0]
            });

            // Proposer après la période
            const afterStart = new Date(workloadEnd);
            afterStart.setDate(afterStart.getDate() + 1);
            const afterEnd = new Date(afterStart);
            afterEnd.setDate(afterEnd.getDate() + duration - 1);

            solutions.push({
                type: 'RESCHEDULE',
                description: `Reprogrammer après la période de forte charge (${afterStart.toLocaleDateString()} au ${afterEnd.toLocaleDateString()})`,
                newStartDate: afterStart.toISOString().split('T')[0],
                newEndDate: afterEnd.toISOString().split('T')[0]
            });
            break;

        default:
            if (conflict.canOverride) {
                solutions.push({
                    type: 'OVERRIDE',
                    description: 'Approuver avec validation managériale'
                });
            }
    }

    return {
        canResolve: solutions.length > 0,
        solutions
    };
}; 