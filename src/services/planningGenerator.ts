import {
  Attribution,
  AssignmentType,
  GenerationParameters,
  RuleViolation,
  ValidationResult,
  UserCounter,
  AssignmentStatus,
} from '../types/assignment';
import { ShiftType } from '../types/common';
import { User, WeekType, Leave } from '../types/user';
import {
  RulesConfiguration,
  FatigueConfig,
  defaultRulesConfiguration,
  defaultFatigueConfig,
  RuleSeverity,
} from '../types/rules';
import { PlanningOptimizer } from './planningOptimizer';
import { rulesConfigService } from './rulesConfigService';
import {
  parseDate,
  addDaysToDate,
  formatDate,
  ISO_DATE_FORMAT,
  areDatesSameDay,
  getDifferenceInDays,
  addHoursToDate,
} from '@/utils/dateUtils';
import { differenceInDays } from 'date-fns';
// import { fetchFatigueConfig } from '@/app/parametres/configuration/fatigue/page'; // !! Temporairement commenté !!
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { RuleContext } from '@/modules/dynamicRules/v2/types/ruleV2.types';

// Simulation Logger
const logger = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

/**
 * Service principal de génération de planning
 */
export class PlanningGenerator {
  private parameters: GenerationParameters;
  private personnel: User[] = [];
  private rulesConfig: RulesConfiguration;
  private fatigueConfig: FatigueConfig;
  private existingAssignments: Attribution[] = [];
  private userCounters: Map<string, UserCounter> = new Map();
  private isInitialized: boolean = false;
  private ruleEngine: RuleEngineV2;
  private results: {
    gardes: Attribution[];
    astreintes: Attribution[];
    consultations: Attribution[];
    blocs: Attribution[];
  };

  constructor(
    parameters: GenerationParameters,
    rulesConfig: RulesConfiguration = defaultRulesConfiguration,
    fatigueConfig: FatigueConfig = defaultFatigueConfig
  ) {
    this.parameters = parameters;
    this.rulesConfig = rulesConfig;
    this.fatigueConfig = fatigueConfig;
    this.ruleEngine = new RuleEngineV2();
    this.results = {
      gardes: [],
      astreintes: [],
      consultations: [],
      blocs: [],
    };
  }

  /**
   * Initialiser le générateur en chargeant les données nécessaires
   * y compris la configuration dynamique de la fatigue.
   */
  async initialize(personnel: User[], existingAssignments: Attribution[] = []): Promise<void> {
    this.personnel = personnel;
    this.existingAssignments = existingAssignments;

    // Charger la configuration dynamique depuis la base de données
    this.rulesConfig = await rulesConfigService.getRulesConfiguration();
    this.fatigueConfig = await rulesConfigService.getFatigueConfiguration();

    // Le moteur de règles V2 est initialisé via getInstance() - pas besoin d'initialize() explicite

    this.initializeUserCounters();
    this.isInitialized = true;
    logger.log('PlanningGenerator initialized with dynamic configuration and RuleEngineV2.');
  }

  private initializeUserCounters(): void {
    this.userCounters.clear();
    this.personnel.forEach(user => {
      this.userCounters.set(String(user.id), {
        userId: String(user.id),
        gardes: { total: 0, weekends: 0, feries: 0, noel: 0 },
        astreintes: { total: 0, semaine: 0, weekendFeries: 0 },
        consultations: { total: 0, matin: 0, apresmidi: 0 },
        fatigue: { score: 0, lastUpdate: new Date() },
      });
    });
    this.existingAssignments.forEach(attribution => {
      const counter = this.userCounters.get(String(attribution.userId));
      if (counter) {
        this.updateCounterForAssignment(counter, attribution, true);
      }
    });
  }

  private updateCounterForAssignment(
    counter: UserCounter,
    attribution: Attribution,
    isExisting: boolean = false
  ): void {
    const date = parseDate(attribution.startDate);
    if (!date) return;

    const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
    const isHolidayDay = false;
    const isWeekendOrHoliday = isWeekendDay || isHolidayDay;

    switch (attribution.shiftType) {
      case ShiftType.GARDE_24H:
        counter.gardes.total++;
        if (isWeekendDay) counter.gardes.weekends++;
        if (isHolidayDay) counter.gardes.feries++;
        break;
      case ShiftType.ASTREINTE:
        counter.astreintes.total++;
        if (isWeekendOrHoliday) counter.astreintes.weekendFeries++;
        else counter.astreintes.semaine++;
        break;
      case ShiftType.MATIN:
        counter.consultations.total++;
        counter.consultations.matin++;
        break;
      case ShiftType.APRES_MIDI:
        counter.consultations.total++;
        counter.consultations.apresmidi++;
        break;
    }

    if (!isExisting && this.fatigueConfig && this.fatigueConfig.enabled) {
      let fatiguePoints = 0;
      switch (attribution.shiftType) {
        case ShiftType.GARDE_24H:
          fatiguePoints += this.fatigueConfig.points?.garde || 0;
          break;
        case ShiftType.ASTREINTE:
          if (isWeekendOrHoliday) {
            fatiguePoints +=
              this.fatigueConfig.points?.astreinteWeekendFerie ||
              this.fatigueConfig.points?.astreinte ||
              0;
          }
          break;
      }
      counter.fatigue.score += fatiguePoints;
    }
  }

  private createRuleContext(
    date: Date,
    user?: User,
    attribution?: Partial<Attribution>
  ): RuleContext {
    return {
      date,
      user: user
        ? {
            id: String(user.id),
            name: user.name,
            email: user.email,
            weekType: user.weekType,
            specialty: user.specialty,
            yearsOfExperience: user.yearsOfExperience || 0,
          }
        : undefined,
      attribution: attribution
        ? {
            type: attribution.shiftType,
            startDate: attribution.startDate,
            endDate: attribution.endDate,
            userId: attribution.userId,
            location: attribution.notes,
          }
        : undefined,
      planning: {
        existingAssignments: this.existingAssignments,
        proposedAssignments: [
          ...this.results.gardes,
          ...this.results.astreintes,
          ...this.results.consultations,
          ...this.results.blocs,
        ],
      },
      metrics:
        user && this.userCounters.get(String(user.id))
          ? {
              fatigueScore: this.userCounters.get(String(user.id))!.fatigue.score,
              totalAssignments:
                this.userCounters.get(String(user.id))!.gardes.total +
                this.userCounters.get(String(user.id))!.astreintes.total,
              weekendAssignments: this.userCounters.get(String(user.id))!.gardes.weekends,
            }
          : undefined,
    };
  }

  private async applyGenerationRules(context: RuleContext): Promise<Attribution[]> {
    const ruleResults = await this.ruleEngine.evaluate(context, 'generation');
    const generatedAssignments: Attribution[] = [];

    for (const result of ruleResults) {
      if (result.actions) {
        for (const action of result.actions) {
          if (action.type === 'assign' && action.parameters.userId && action.parameters.shiftType) {
            const user = this.personnel.find(u => String(u.id) === action.parameters.userId);
            if (user) {
              const attribution = this.createAssignment(
                user,
                context.date,
                action.parameters.shiftType as ShiftType,
                action.parameters.assignmentType as AssignmentType,
                action.parameters.notes
              );
              generatedAssignments.push(attribution);
            }
          }
        }
      }
    }

    return generatedAssignments;
  }

  private async applyValidationRules(attribution: Attribution): Promise<RuleViolation[]> {
    const user = this.personnel.find(u => String(u.id) === attribution.userId);
    const context = this.createRuleContext(attribution.startDate, user, attribution);
    const ruleResults = await this.ruleEngine.evaluate(context, 'validation');
    const violations: RuleViolation[] = [];

    for (const result of ruleResults) {
      if (!result.passed && result.actions) {
        for (const action of result.actions) {
          if (action.type === 'validate' && action.parameters.severity) {
            violations.push({
              id: `rule-${result.ruleId}-${Date.now()}`,
              type: action.parameters.violationType || 'RULE_VIOLATION',
              severity: action.parameters.severity as RuleSeverity,
              message: action.parameters.message || `Règle ${result.ruleName} non respectée`,
              affectedAssignments: [attribution.id],
            });
          }
        }
      }
    }

    return violations;
  }

  private isUserAvailable(user: User, date: Date, shiftType: ShiftType): boolean {
    const userIdStr = String(user.id);
    const logPrefix = `[Availability Check] User: ${userIdStr}, Date: ${date.toISOString().slice(0, 10)}, Shift: ${shiftType}:`;

    if (this.fatigueConfig?.enabled) {
      const counter = this.userCounters.get(userIdStr);
      const currentFatigueScore = counter?.fatigue.score || 0;
      const criticalThreshold = this.fatigueConfig.seuils?.critique;

      let potentialFatigueIncrease = 0;
      switch (shiftType) {
        case ShiftType.GARDE_24H:
          potentialFatigueIncrease = this.fatigueConfig.points?.garde || 0;
          break;
        case ShiftType.ASTREINTE:
          potentialFatigueIncrease = this.fatigueConfig.points?.astreinte || 0;
          break;
      }
      const potentialFatigueScore = currentFatigueScore + potentialFatigueIncrease;

      if (criticalThreshold !== undefined && potentialFatigueScore >= criticalThreshold) {
        logger.log(
          `${logPrefix} REJECTED due to fatigue score (${potentialFatigueScore}/${criticalThreshold}) reaching critical threshold.`
        );
        return false;
      }
    }

    const userAssignments = this.findUserAssignments(userIdStr);
    for (const existingAssignment of userAssignments) {
      const existingStartDate = parseDate(existingAssignment.startDate);
      if (!existingStartDate) continue;

      if (areDatesSameDay(date, existingStartDate)) {
        logger.log(`${logPrefix} REJECTED due to existing attribution on the same day.`);
        return false;
      }

      if (
        shiftType === ShiftType.GARDE_24H &&
        existingAssignment.shiftType === ShiftType.GARDE_24H
      ) {
        const daysBetween = getDifferenceInDays(
          parseDate(date)!,
          parseDate(existingAssignment.startDate)!
        );
        const minGap = this.rulesConfig.intervalle?.minJoursEntreGardes || 3;
        if (daysBetween !== null && Math.abs(daysBetween) < minGap) {
          logger.log(
            `${logPrefix} REJECTED due to GARDE spacing rule (${Math.abs(daysBetween)} < ${minGap} days).`
          );
          return false;
        }
      }
    }

    const dayBefore = addDaysToDate(date, -1);
    if (dayBefore) {
      const hasGardeDayBefore = userAssignments.some(
        a =>
          a.shiftType === ShiftType.GARDE_24H &&
          parseDate(a.startDate) &&
          areDatesSameDay(parseDate(a.startDate)!, dayBefore)
      );
      if (hasGardeDayBefore) {
        logger.log(`${logPrefix} REJECTED due to required rest after GARDE.`);
        return false;
      }
    }

    logger.log(`${logPrefix} ACCEPTED`);
    return true;
  }

  public async generate(): Promise<{
    attributions: Attribution[];
    validation: ValidationResult;
    metrics: {
      totalAssignments: number;
      coveragePercentage: number;
      equityScore: number;
      conflictsDetected: number;
    };
  }> {
    if (!this.isInitialized) {
      throw new Error('Organisateur not initialized. Call initialize() first.');
    }
    logger.log('Starting planning generation...');

    // Réinitialiser les résultats
    this.results = {
      gardes: [],
      astreintes: [],
      consultations: [],
      blocs: [],
    };

    // Générer le planning pour chaque jour de la période
    const startDate = parseDate(this.parameters.dateDebut);
    const endDate = parseDate(this.parameters.dateFin);

    if (!startDate || !endDate) {
      throw new Error('Invalid date parameters');
    }

    let currentDate = new Date(startDate);
    const totalDays = getDifferenceInDays(endDate, startDate) || 1;
    let daysProcessed = 0;

    while (currentDate <= endDate) {
      logger.log(`Processing date: ${formatDate(currentDate, ISO_DATE_FORMAT)}`);

      // Déterminer si c'est un weekend ou un jour férié
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const isHoliday = this.isHoliday(currentDate);

      // Générer les gardes/vacations pour chaque type d'activité activé
      if (this.parameters.etapesActives.includes(AssignmentType.GARDE)) {
        await this.generateGardes(currentDate, isWeekend || isHoliday);
      }

      if (this.parameters.etapesActives.includes(AssignmentType.ASTREINTE)) {
        await this.generateAstreintes(currentDate, isWeekend || isHoliday);
      }

      if (
        this.parameters.etapesActives.includes(AssignmentType.CONSULTATION) &&
        !isWeekend &&
        !isHoliday
      ) {
        await this.generateConsultations(currentDate);
      }

      if (this.parameters.etapesActives.includes(AssignmentType.BLOC)) {
        await this.generateBlocAssignments(currentDate, isWeekend);
      }

      // Avancer à la journée suivante
      currentDate = addDaysToDate(currentDate, 1)!;
      daysProcessed++;

      // Log de progression
      if (daysProcessed % 7 === 0) {
        logger.log(`Progress: ${Math.round((daysProcessed / totalDays) * 100)}%`);
      }
    }

    // Optimiser le planning si demandé
    if (this.parameters.niveauOptimisation !== 'rapide') {
      await this.optimizePlanning();
    }

    // Valider le planning généré
    const validationResult = await this.validatePlanning();

    // Calculer les métriques
    const allAssignments = [
      ...this.results.gardes,
      ...this.results.astreintes,
      ...this.results.consultations,
      ...this.results.blocs,
    ];

    const metrics = {
      totalAssignments: allAssignments.length,
      coveragePercentage: this.calculateCoveragePercentage(),
      equityScore: validationResult.metrics.equiteScore,
      conflictsDetected: validationResult.violations.length,
    };

    logger.log(
      `Planning generation completed: ${metrics.totalAssignments} attributions, ${metrics.conflictsDetected} conflicts`
    );

    return {
      attributions: allAssignments,
      validation: validationResult,
      metrics,
    };
  }

  private async generateGardes(date: Date, isWeekendOrHoliday: boolean): Promise<void> {
    // D'abord essayer d'appliquer les règles de génération
    const context = this.createRuleContext(date);
    const generatedByRules = await this.applyGenerationRules(context);

    // Ajouter les gardes/vacations générées par les règles
    for (const attribution of generatedByRules) {
      if (attribution.shiftType === ShiftType.GARDE_24H) {
        // Valider l'garde/vacation avec les règles
        const violations = await this.applyValidationRules(attribution);

        if (violations.length === 0) {
          this.results.gardes.push(attribution);
          this.updateCounterForAssignment(
            this.userCounters.get(String(attribution.userId))!,
            attribution
          );
        } else {
          logger.warn(
            `Rule violations for garde attribution: ${violations.map(v => v.message).join(', ')}`
          );
        }
      }
    }

    // Si pas assez de gardes générées par les règles, utiliser la logique classique
    const requiredGuards = isWeekendOrHoliday ? 2 : 1;
    const currentGuards = this.results.gardes.filter(g =>
      areDatesSameDay(g.startDate, date)
    ).length;

    for (let i = currentGuards; i < requiredGuards; i++) {
      const eligibleUsers = this.findEligibleUsersForGarde(date);

      if (eligibleUsers.length === 0) {
        logger.warn(`No eligible users for garde on ${formatDate(date, ISO_DATE_FORMAT)}`);
        continue;
      }

      const selectedUser = this.selectBestCandidateForGarde(eligibleUsers, date);
      const attribution = this.createAssignment(
        selectedUser,
        date,
        ShiftType.GARDE_24H,
        AssignmentType.GARDE
      );

      // Valider avec les règles V2
      const violations = await this.applyValidationRules(attribution);

      if (violations.length === 0) {
        this.results.gardes.push(attribution);
        this.updateCounterForAssignment(
          this.userCounters.get(String(selectedUser.id))!,
          attribution
        );
      } else {
        logger.warn(
          `Cannot assign garde due to rule violations: ${violations.map(v => v.message).join(', ')}`
        );
      }
    }
  }

  private async generateAstreintes(date: Date, isWeekendOrHoliday: boolean): Promise<void> {
    const shiftType = isWeekendOrHoliday
      ? ShiftType.ASTREINTE_WEEKEND
      : ShiftType.ASTREINTE_SEMAINE;
    const eligibleUsers = this.findEligibleUsersForAstreinte(date);

    if (eligibleUsers.length === 0) {
      logger.warn(`No eligible users for astreinte on ${formatDate(date, ISO_DATE_FORMAT)}`);
      return;
    }

    const selectedUser = this.selectBestCandidateForAstreinte(eligibleUsers, date);
    const attribution = this.createAssignment(
      selectedUser,
      date,
      shiftType,
      AssignmentType.ASTREINTE
    );

    this.results.astreintes.push(attribution);
    this.updateCounterForAssignment(this.userCounters.get(String(selectedUser.id))!, attribution);
  }

  private async generateConsultations(date: Date): Promise<void> {
    // Générer les consultations du matin
    const morningSlots = this.rulesConfig.consultations.creneauxMatin || 2;
    for (let i = 0; i < morningSlots; i++) {
      const eligibleUsers = this.findEligibleUsersForConsultation(date, ShiftType.MATIN);
      if (eligibleUsers.length > 0) {
        const selectedUser = this.selectBestCandidateForConsultation(
          eligibleUsers,
          date,
          ShiftType.MATIN
        );
        const attribution = this.createAssignment(
          selectedUser,
          date,
          ShiftType.MATIN,
          AssignmentType.CONSULTATION
        );
        this.results.consultations.push(attribution);
        this.updateCounterForAssignment(
          this.userCounters.get(String(selectedUser.id))!,
          attribution
        );
      }
    }

    // Générer les consultations de l'après-midi
    const afternoonSlots = this.rulesConfig.consultations.creneauxApresMidi || 2;
    for (let i = 0; i < afternoonSlots; i++) {
      const eligibleUsers = this.findEligibleUsersForConsultation(date, ShiftType.APRES_MIDI);
      if (eligibleUsers.length > 0) {
        const selectedUser = this.selectBestCandidateForConsultation(
          eligibleUsers,
          date,
          ShiftType.APRES_MIDI
        );
        const attribution = this.createAssignment(
          selectedUser,
          date,
          ShiftType.APRES_MIDI,
          AssignmentType.CONSULTATION
        );
        this.results.consultations.push(attribution);
        this.updateCounterForAssignment(
          this.userCounters.get(String(selectedUser.id))!,
          attribution
        );
      }
    }
  }

  private async generateBlocAssignments(date: Date, isWeekend: boolean): Promise<void> {
    // Nombre de salles à superviser (réduit le weekend)
    const roomsToSupervise = isWeekend ? 2 : 4;

    for (let i = 0; i < roomsToSupervise; i++) {
      const eligibleUsers = this.findEligibleUsersForBloc(date, isWeekend);
      if (eligibleUsers.length > 0) {
        const selectedUser = this.selectBestCandidateForBloc(eligibleUsers, date, isWeekend);
        const attribution = this.createAssignment(
          selectedUser,
          date,
          ShiftType.JOURNEE,
          AssignmentType.BLOC,
          `Salle ${i + 1}`
        );
        this.results.blocs.push(attribution);
        this.updateCounterForAssignment(
          this.userCounters.get(String(selectedUser.id))!,
          attribution
        );
      }
    }
  }

  private createAssignment(
    user: User,
    date: Date,
    shiftType: ShiftType,
    assignmentType: AssignmentType,
    notes?: string
  ): Attribution {
    const startDate = new Date(date);
    const endDate = new Date(date);

    // Définir les heures de début et fin selon le type de shift
    switch (shiftType) {
      case ShiftType.GARDE_24H:
        startDate.setHours(8, 0, 0, 0);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(8, 0, 0, 0);
        break;
      case ShiftType.MATIN:
        startDate.setHours(8, 0, 0, 0);
        endDate.setHours(12, 30, 0, 0);
        break;
      case ShiftType.APRES_MIDI:
        startDate.setHours(13, 30, 0, 0);
        endDate.setHours(18, 0, 0, 0);
        break;
      case ShiftType.JOURNEE:
        startDate.setHours(8, 0, 0, 0);
        endDate.setHours(18, 0, 0, 0);
        break;
      case ShiftType.ASTREINTE:
      case ShiftType.ASTREINTE_SEMAINE:
      case ShiftType.ASTREINTE_WEEKEND:
        startDate.setHours(18, 0, 0, 0);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(8, 0, 0, 0);
        break;
    }

    return {
      id: `attribution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: String(user.id),
      shiftType,
      startDate,
      endDate,
      status: AssignmentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes,
    };
  }

  private async optimizePlanning(): Promise<void> {
    logger.log('Optimizing planning...');

    const optimizer = new PlanningOptimizer(
      this.rulesConfig,
      this.fatigueConfig,
      this.userCounters
    );

    // Optimiser chaque type d'garde/vacation
    this.results.gardes = optimizer.optimizePlanning(this.results.gardes);
    this.results.astreintes = optimizer.optimizePlanning(this.results.astreintes);
    this.results.consultations = optimizer.optimizePlanning(this.results.consultations);
    this.results.blocs = optimizer.optimizePlanning(this.results.blocs);
  }

  private calculateCoveragePercentage(): number {
    const startDate = parseDate(this.parameters.dateDebut)!;
    const endDate = parseDate(this.parameters.dateFin)!;
    const totalDays = getDifferenceInDays(endDate, startDate) || 1;

    let coveredDays = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate, ISO_DATE_FORMAT);
      const hasGarde = this.results.gardes.some(
        a => formatDate(a.startDate, ISO_DATE_FORMAT) === dateStr
      );
      const hasAstreinte = this.results.astreintes.some(
        a => formatDate(a.startDate, ISO_DATE_FORMAT) === dateStr
      );

      if (hasGarde && hasAstreinte) {
        coveredDays++;
      }

      currentDate = addDaysToDate(currentDate, 1)!;
    }

    return Math.round((coveredDays / totalDays) * 100);
  }

  private isHoliday(date: Date): boolean {
    // TODO: Implémenter la détection des jours fériés
    // Pour l'instant, retourner false
    return false;
  }

  private findEligibleUsersForGarde(date: Date): User[] {
    return this.personnel.filter(user => {
      if (!this.isUserAvailable(user, date, ShiftType.GARDE_24H)) return false;
      if (this.hasConsecutiveAssignments(user, date)) return false;
      const userCounter = this.userCounters.get(String(user.id));
      if (userCounter && userCounter.gardes.total >= this.rulesConfig.intervalle.maxGardesMois)
        return false;
      return true;
    });
  }

  private findEligibleUsersForAstreinte(date: Date): User[] {
    return this.personnel.filter(user => {
      if (!this.isUserAvailable(user, date, ShiftType.ASTREINTE)) return false;
      if (this.hasConsecutiveAssignments(user, date)) return false;
      const userCounter = this.userCounters.get(String(user.id));
      if (
        userCounter &&
        userCounter.astreintes.total >= this.rulesConfig.intervalle.maxAstreintesMois
      ) {
        return false;
      }
      return true;
    });
  }

  private findEligibleUsersForConsultation(date: Date, shift: ShiftType): User[] {
    return this.personnel.filter(user => {
      if (!this.isUserAvailable(user, date, shift)) return false;
      const userCounter = this.userCounters.get(String(user.id));
      if (
        userCounter &&
        userCounter.consultations.total >= this.rulesConfig.consultations.maxParSemaine
      )
        return false;
      return true;
    });
  }

  private findEligibleUsersForBloc(date: Date, isWeekend: boolean): User[] {
    return this.personnel.filter(user => {
      if (!this.isUserAvailable(user, date, ShiftType.GARDE_24H)) return false;
      if (this.hasConsecutiveAssignments(user, date)) return false;
      return true;
    });
  }

  private selectBestCandidateForGarde(eligibleUsers: User[], date: Date): User {
    return eligibleUsers.reduce((best, current) => {
      const bestCounter = this.userCounters.get(String(best.id))!;
      const currentCounter = this.userCounters.get(String(current.id))!;

      const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
      const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

      return currentScore > bestScore ? current : best;
    }, eligibleUsers[0]);
  }

  private selectBestCandidateForAstreinte(eligibleUsers: User[], date: Date): User {
    return eligibleUsers.reduce((best, current) => {
      const bestCounter = this.userCounters.get(String(best.id))!;
      const currentCounter = this.userCounters.get(String(current.id))!;

      const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
      const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

      return currentScore > bestScore ? current : best;
    }, eligibleUsers[0]);
  }

  private selectBestCandidateForConsultation(
    eligibleUsers: User[],
    date: Date,
    shift: ShiftType
  ): User {
    return eligibleUsers.reduce((best, current) => {
      const bestCounter = this.userCounters.get(String(best.id))!;
      const currentCounter = this.userCounters.get(String(current.id))!;

      const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
      const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

      return currentScore > bestScore ? current : best;
    }, eligibleUsers[0]);
  }

  private selectBestCandidateForBloc(eligibleUsers: User[], date: Date, isWeekend: boolean): User {
    return eligibleUsers.reduce((best, current) => {
      const bestCounter = this.userCounters.get(String(best.id))!;
      const currentCounter = this.userCounters.get(String(current.id))!;

      const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
      const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

      return currentScore > bestScore ? current : best;
    }, eligibleUsers[0]);
  }

  private calculateAssignmentScore(user: User, counter: UserCounter, date: Date): number {
    let score = 100; // Score de base

    // 1. Pénalité pour la fatigue (0-40 points)
    const fatigueRatio = counter.fatigue.score / this.fatigueConfig.seuils.critique;
    score -= fatigueRatio * 40;

    // 2. Bonus pour équité dans la répartition (0-30 points)
    const avgGardes = this.getAverageGardesPerUser();
    if (avgGardes > 0) {
      const deviationRatio = Math.abs(counter.gardes.total - avgGardes) / avgGardes;
      // Plus l'utilisateur est en dessous de la moyenne, plus le score est élevé
      if (counter.gardes.total < avgGardes) {
        score += (1 - deviationRatio) * 30;
      } else {
        score -= deviationRatio * 20;
      }
    }

    // 3. Pénalité pour gardes/vacations consécutives récentes (0-20 points)
    const recentAssignments = this.findUserAssignments(String(user.id)).filter(a => {
      const assignmentDate = parseDate(a.startDate);
      if (!assignmentDate) return false;
      const daysDiff = getDifferenceInDays(date, assignmentDate);
      return daysDiff !== null && daysDiff >= 0 && daysDiff <= 7;
    });
    score -= recentAssignments.length * 5;

    // 4. Bonus pour temps partiel (0-10 points)
    if (user.weekType === WeekType.SEMAINE_PARTIELLE) {
      const workRatio = user.workedWeeks ? user.workedWeeks / 52 : 0.5;
      score += (1 - workRatio) * 10;
    }

    // 5. Considération des préférences (si activé)
    if (this.parameters.appliquerPreferencesPersonnelles) {
      // TODO: Implémenter la gestion des préférences
      // Pour l'instant, bonus aléatoire pour simulation
      score += Math.random() * 10;
    }

    // Assurer que le score reste dans la plage 0-100
    return Math.max(0, Math.min(100, score));
  }

  private getAverageGardesPerUser(): number {
    const totalGardes = Array.from(this.userCounters.values()).reduce(
      (sum, counter) => sum + counter.gardes.total,
      0
    );
    return totalGardes / this.userCounters.size;
  }

  private async validatePlanning(): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    await this.checkForViolations(violations);

    const metrics = {
      equiteScore: this.calculateEquityScore(),
      fatigueScore: this.calculateAverageFatigueScore(),
      satisfactionScore: this.calculateSatisfactionScore(),
    };

    return {
      valid: violations.length === 0,
      violations,
      metrics,
    };
  }

  private async checkForViolations(violations: RuleViolation[]): Promise<void> {
    // Vérifications classiques
    this.checkMinimumGardeIntervals(violations);
    this.checkMaxGardesPerMonth(violations);
    this.checkConsecutiveAssignments(violations);
    this.checkFatigueScores(violations);

    // Vérifications avec les règles V2
    const allAssignments = [
      ...this.results.gardes,
      ...this.results.astreintes,
      ...this.results.consultations,
      ...this.results.blocs,
    ];

    for (const attribution of allAssignments) {
      const ruleViolations = await this.applyValidationRules(attribution);
      violations.push(...ruleViolations);
    }
  }

  private checkMinimumGardeIntervals(violations: RuleViolation[]): void {
    this.personnel.forEach(user => {
      const userAssignments = this.findUserAssignments(String(user.id));
      userAssignments.forEach(attribution => {
        const nextAssignment = userAssignments.find(a => a.startDate > attribution.startDate);
        if (nextAssignment) {
          const daysBetween = getDifferenceInDays(
            parseDate(nextAssignment.startDate)!,
            parseDate(attribution.startDate)!
          );
          if (
            daysBetween !== null &&
            daysBetween < this.rulesConfig.intervalle.minJoursEntreGardes
          ) {
            violations.push({
              id: `min-interval-${attribution.id}-${nextAssignment.id}`,
              type: 'MIN_INTERVAL',
              severity: RuleSeverity.ERROR,
              message: `Intervalle minimum de ${this.rulesConfig.intervalle.minJoursEntreGardes} jours non respecté entre les gardes`,
              affectedAssignments: [attribution.id, nextAssignment.id],
            });
          }
        }
      });
    });
  }

  private checkMaxGardesPerMonth(violations: RuleViolation[]): void {
    this.personnel.forEach(user => {
      const counter = this.userCounters.get(String(user.id));
      if (!counter) return;

      if (counter.gardes.total > this.rulesConfig.intervalle.maxGardesMois) {
        violations.push({
          id: `max-gardes-${user.id}`,
          type: 'MAX_GARDES',
          severity: RuleSeverity.ERROR,
          message: `Nombre maximum de gardes par mois dépassé (${counter.gardes.total} > ${this.rulesConfig.intervalle.maxGardesMois})`,
          affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id),
        });
      }
    });
  }

  private checkConsecutiveAssignments(violations: RuleViolation[]): void {
    this.personnel.forEach(user => {
      const userAssignments = this.findUserAssignments(String(user.id));
      let consecutiveCount = 0;

      const sortedAssignments = [...userAssignments].sort((a, b) => {
        const dateA = parseDate(a.startDate);
        const dateB = parseDate(b.startDate);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

      sortedAssignments.forEach((attribution, index) => {
        if (index > 0) {
          const previousAssignment = sortedAssignments[index - 1];
          if (areDatesSameDay(previousAssignment.endDate, attribution.startDate)) {
            consecutiveCount++;
            if (consecutiveCount + 1 > this.rulesConfig.intervalle.maxGardesConsecutives) {
              violations.push({
                id: `consecutive-${previousAssignment.id}-${attribution.id}`,
                type: 'CONSECUTIVE_ASSIGNMENTS',
                severity: RuleSeverity.WARNING,
                message: `Nombre maximum d'gardes/vacations consécutives (${this.rulesConfig.intervalle.maxGardesConsecutives}) dépassé`,
                affectedAssignments: [previousAssignment.id, attribution.id],
              });
            }
          } else {
            consecutiveCount = 0;
          }
        } else {
          consecutiveCount = 0;
        }
      });
    });
  }

  private checkFatigueScores(violations: RuleViolation[]): void {
    this.personnel.forEach(user => {
      const counter = this.userCounters.get(String(user.id));
      if (!counter) return;

      if (counter.fatigue.score >= this.fatigueConfig.seuils.critique) {
        violations.push({
          id: `fatigue-${user.id}`,
          type: 'FATIGUE',
          severity: RuleSeverity.ERROR,
          message: `Score de fatigue critique atteint (${counter.fatigue.score})`,
          affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id),
        });
      } else if (counter.fatigue.score >= this.fatigueConfig.seuils.alerte) {
        violations.push({
          id: `fatigue-warning-${user.id}`,
          type: 'FATIGUE_WARNING',
          severity: RuleSeverity.WARNING,
          message: `Score de fatigue élevé (${counter.fatigue.score})`,
          affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id),
        });
      }
    });
  }

  private calculateEquityScore(): number {
    const totalGardes = this.results.gardes.length;
    const totalUsers = this.personnel.length;
    const averageGardes = totalGardes / totalUsers;

    let deviationSum = 0;
    this.userCounters.forEach(counter => {
      const deviation = Math.abs(counter.gardes.total - averageGardes);
      deviationSum += deviation;
    });

    const maxDeviation = totalGardes;
    return 1 - deviationSum / maxDeviation;
  }

  private calculateAverageFatigueScore(): number {
    let totalScore = 0;
    let count = 0;

    this.personnel.forEach(user => {
      const score = this.calculateFatigueScore(user, new Date());
      if (score > 0) {
        totalScore += score;
        count++;
      }
    });

    return count > 0 ? totalScore / count : 0;
  }

  private calculateSatisfactionScore(): number {
    return 0;
  }

  private calculateFatigueScore(user: User, date: Date): number {
    const counter = this.userCounters.get(String(user.id));
    if (!counter) return 0;

    const daysSinceLastUpdate = getDifferenceInDays(date, counter.fatigue.lastUpdate);

    if (daysSinceLastUpdate === null) {
      return counter.fatigue.score;
    }

    let score = counter.fatigue.score;
    const recoveryPoints = (this.fatigueConfig?.recovery?.jourOff || 15) / 30;
    score = Math.max(0, score - daysSinceLastUpdate * recoveryPoints);

    return score;
  }

  private getResults(): {
    gardes: Attribution[];
    astreintes: Attribution[];
    consultations: Attribution[];
    blocs: Attribution[];
  } {
    return this.results;
  }

  private findUserAssignments(userId: string): Attribution[] {
    const generatedAssignments = [
      ...this.results.gardes,
      ...this.results.astreintes,
      ...this.results.consultations,
      ...this.results.blocs,
    ];
    return [
      ...this.existingAssignments.filter(a => String(a.userId) === userId),
      ...generatedAssignments.filter(a => String(a.userId) === userId),
    ];
  }

  private isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
    return date >= interval.start && date <= interval.end;
  }

  private hasConsecutiveAssignments(user: User, targetDate: Date): boolean {
    const userAssignments = this.findUserAssignments(String(user.id));
    return userAssignments.some(attribution => {
      const assignmentStartDate = parseDate(attribution.startDate);
      if (assignmentStartDate) {
        const dayBeforeTarget = addDaysToDate(targetDate, -1);
        if (dayBeforeTarget && areDatesSameDay(assignmentStartDate, dayBeforeTarget)) {
          return true;
        }
      }
      return false;
    });
  }
}
