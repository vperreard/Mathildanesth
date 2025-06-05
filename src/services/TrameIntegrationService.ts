import { prisma } from '@/lib/prisma';
import { logger } from "../lib/logger";
import { PlanningGenerator } from './planningGenerator';
import TrameApplicationService from './TrameApplicationService';
import { performanceMonitor } from './PerformanceMonitoringService';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AssignmentType } from '@/types/attribution';

interface IntegrationResult {
  success: boolean;
  message: string;
  planningsGenerated: number;
  assignmentsCreated: number;
  conflicts: string[];
  warnings: string[];
}

/**
 * Service d'intégration entre le système de trameModeles et le générateur de planning
 * Combine les deux systèmes pour une génération optimale
 */
export class TrameIntegrationService {
  private prisma: PrismaClient;
  private trameService: TrameApplicationService;
  private planningGenerator: PlanningGenerator | null = null;

  constructor() {
    this.prisma = prisma;
    this.trameService = new TrameApplicationService();
  }

  /**
   * Génère un planning complet en utilisant les trameModeles comme base
   * et le générateur pour optimiser et compléter
   */
  async generatePlanningWithTrames(
    siteId: string,
    startDate: Date,
    endDate: Date,
    options: {
      useTrames?: boolean;
      trameModeleIds?: number[];
      generateGardes?: boolean;
      generateAstreintes?: boolean;
      optimizeDistribution?: boolean;
      respectPreferences?: boolean;
    } = {}
  ): Promise<IntegrationResult> {
    const measure = performanceMonitor.startMeasure('trame_integration_generate');

    const result: IntegrationResult = {
      success: false,
      message: '',
      planningsGenerated: 0,
      assignmentsCreated: 0,
      conflicts: [],
      warnings: []
    };

    try {
      // 1. Appliquer les trameModeles de base si demandé
      if (options.useTrames !== false) {
        const trameResult = await this.applyTrames(
          siteId,
          startDate,
          endDate,
          options.trameModeleIds
        );

        result.assignmentsCreated += trameResult.assignmentsCreated;
        result.warnings.push(...trameResult.warnings);
      }

      // 2. Récupérer le personnel et les gardes/vacations existantes
      const personnel = await this.getPersonnel(siteId);
      const existingAssignments = await this.getExistingAssignments(
        siteId,
        startDate,
        endDate
      );

      // 3. Initialiser le générateur de planning
      const generatorParams = {
        dateDebut: startDate,
        dateFin: endDate,
        etapesActives: [
          ...(options.generateGardes ? [AssignmentType.GARDE] : []),
          ...(options.generateAstraintes ? [AssignmentType.ASTREINTE] : [])
        ],
        conserverAffectationsExistantes: true,
        niveauOptimisation: options.optimizeDistribution ? 'standard' : 'rapide',
        appliquerPreferencesPersonnelles: options.respectPreferences ?? true,
        poidsEquite: 0.5,
        poidsPreference: 0.3,
        poidsQualiteVie: 0.2
      };

      this.planningGenerator = new PlanningGenerator(generatorParams);
      await this.planningGenerator.initialize(personnel, existingAssignments);

      // 4. Générer les plannings complémentaires (gardes, astreintes)
      if (options.generateGardes || options.generateAstreintes) {
        const generationResult = await this.planningGenerator.generate();
        
        if (generationResult.validation.valid) {
          // 5. Sauvegarder les gardes/vacations générées
          const saveResult = await this.saveGeneratedAssignments(
            generationResult.attributions,
            siteId
          );

          result.planningsGenerated += saveResult.count;
          result.assignmentsCreated += saveResult.count;
        } else {
          result.conflicts.push(...generationResult.validation.violations.map(v => v.message));
        }
      }

      // 6. Optimiser la distribution si demandé
      if (options.optimizeDistribution && result.assignmentsCreated > 0) {
        const optimizationResult = await this.optimizeDistribution(
          siteId,
          startDate,
          endDate
        );

        if (optimizationResult.improved) {
          result.warnings.push(
            `Distribution optimisée : score d'équité amélioré de ${optimizationResult.improvement}%`
          );
        }
      }

      // 7. Valider le planning final
      const validation = await this.validateFinalPlanning(siteId, startDate, endDate);
      if (!validation.isValid) {
        result.conflicts.push(...validation.errors);
      }

      result.success = result.conflicts.length === 0;
      result.message = result.success
        ? `Planning généré avec succès : ${result.assignmentsCreated} gardes/vacations créées`
        : `Planning généré avec ${result.conflicts.length} conflits`;

      performanceMonitor.endMeasure('trame_integration_generate');
      return result;

    } catch (error) {
      performanceMonitor.endMeasure('trame_integration_generate');
      result.message = `Erreur lors de la génération : ${error instanceof Error ? error.message : String(error)}`;
      return result;
    }
  }

  /**
   * Applique les trameModeles configurées pour la période
   */
  private async applyTrames(
    siteId: string,
    startDate: Date,
    endDate: Date,
    trameModeleIds?: number[]
  ): Promise<{
    assignmentsCreated: number;
    warnings: string[];
  }> {
    let totalAssignments = 0;
    const warnings: string[] = [];

    // Récupérer les trameModeles actives pour le site
    const trameModeles = await this.prisma.trameModele.findMany({
      where: {
        isActive: true,
        siteId,
        dateDebutEffet: { lte: endDate },
        OR: [
          { dateFinEffet: null },
          { dateFinEffet: { gte: startDate } }
        ],
        ...(trameModeleIds && { id: { in: trameModeleIds } })
      },
      orderBy: { priorite: 'desc' }
    });

    // Appliquer chaque trameModele
    for (const trameModele of trameModeles) {
      try {
        const result = await this.trameService.applyTrameToDateRange(
          trameModele.id,
          startDate,
          endDate,
          siteId,
          { skipExistingAssignments: true }
        );

        totalAssignments += result.assignmentsCreated;
        warnings.push(...result.warnings);

      } catch (error) {
        warnings.push(
          `Erreur lors de l'application de la trameModele ${trameModele.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      assignmentsCreated: totalAssignments,
      warnings
    };
  }

  /**
   * Récupère le personnel du site
   */
  private async getPersonnel(siteId: string): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        actif: true,
        sites: {
          some: { id: siteId }
        }
      },
      include: {
        skills: true,
        leaves: {
          where: {
            status: 'APPROVED',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        }
      }
    });

    // Adapter au format attendu par le générateur
    return users.map(user => ({
      id: user.id,
      name: `${user.prenom} ${user.nom}`,
      firstName: user.prenom,
      lastName: user.nom,
      role: user.professionalRole,
      isActive: user.actif,
      workPattern: user.workPattern,
      skills: user.skills.map(s => s.skillId),
      absences: user.leaves.map(l => ({
        startDate: l.startDate,
        endDate: l.endDate,
        type: l.type
      }))
    }));
  }

  /**
   * Récupère les gardes/vacations existantes
   */
  private async getExistingAssignments(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const attributions = await this.prisma.attribution.findMany({
      where: {
        siteId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true,
        operatingRoom: true
      }
    });

    return attributions.map(a => ({
      id: a.id,
      userId: a.userId,
      startDate: a.date,
      endDate: a.date,
      type: a.type,
      status: a.statut,
      siteId: a.siteId,
      operatingRoomId: a.operatingRoomId
    }));
  }

  /**
   * Sauvegarde les gardes/vacations générées
   */
  private async saveGeneratedAssignments(
    attributions: any[],
    siteId: string
  ): Promise<{ count: number }> {
    let count = 0;

    for (const attribution of attributions) {
      try {
        await this.prisma.attribution.create({
          data: {
            date: new Date(attribution.startDate),
            userId: attribution.userId,
            type: attribution.type,
            statut: 'PLANIFIE',
            siteId,
            heureDebut: attribution.startTime,
            heureFin: attribution.endTime,
            notes: `Généré automatiquement le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
          }
        });
        count++;
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde de l\'affectation:', error);
      }
    }

    return { count };
  }

  /**
   * Optimise la distribution des gardes/vacations
   */
  private async optimizeDistribution(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    improved: boolean;
    improvement: number;
  }> {
    // Calculer le score d'équité actuel
    const currentScore = await this.calculateEquityScore(siteId, startDate, endDate);

    // Appliquer l'optimisation (swap intelligent, rééquilibrage)
    // TODO: Implémenter la logique d'optimisation

    // Calculer le nouveau score
    const newScore = await this.calculateEquityScore(siteId, startDate, endDate);

    const improvement = ((newScore - currentScore) / currentScore) * 100;

    return {
      improved: improvement > 0,
      improvement: Math.round(improvement)
    };
  }

  /**
   * Calcule le score d'équité de la distribution
   */
  private async calculateEquityScore(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const attributions = await this.prisma.attribution.groupBy({
      by: ['userId'],
      where: {
        siteId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });

    if (attributions.length === 0) return 100;

    // Calculer l'écart-type de la distribution
    const counts = attributions.map(a => a._count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Score d'équité inversement proportionnel à l'écart-type
    const equityScore = Math.max(0, 100 - (stdDev / mean) * 100);

    return Math.round(equityScore);
  }

  /**
   * Valide le planning final
   */
  private async validateFinalPlanning(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifier la couverture minimale
    const coverageCheck = await this.checkMinimumCoverage(siteId, startDate, endDate);
    errors.push(...coverageCheck.errors);
    warnings.push(...coverageCheck.warnings);

    // 2. Vérifier les conflits
    const conflictCheck = await this.checkConflicts(siteId, startDate, endDate);
    errors.push(...conflictCheck.errors);

    // 3. Vérifier les règles métier
    const rulesCheck = await this.checkBusinessRules(siteId, startDate, endDate);
    errors.push(...rulesCheck.errors);
    warnings.push(...rulesCheck.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Vérifie la couverture minimale requise
   */
  private async checkMinimumCoverage(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier que chaque jour a au moins une garde
    const daysWithoutGuard = await this.prisma.$queryRaw<{ date: Date }[]>`
      SELECT DISTINCT date::date as date
      FROM generate_series(${startDate}::date, ${endDate}::date, '1 day'::interval) as date
      WHERE NOT EXISTS (
        SELECT 1 FROM attributions
        WHERE site_id = ${siteId}
        AND date::date = date.date::date
        AND type = 'GARDE'
      )
    `;

    if (daysWithoutGuard.length > 0) {
      errors.push(
        `${daysWithoutGuard.length} jour(s) sans garde : ${
          daysWithoutGuard.map(d => format(d.date, 'dd/MM')).join(', ')
        }`
      );
    }

    return { errors, warnings };
  }

  /**
   * Vérifie les conflits d'gardes/vacations
   */
  private async checkConflicts(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    errors: string[];
  }> {
    const errors: string[] = [];

    // Rechercher les conflits (même personne, même moment, gardes/vacations différentes)
    const conflicts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        a1.user_id,
        a1.date,
        COUNT(*) as conflict_count
      FROM attributions a1
      JOIN attributions a2 ON 
        a1.user_id = a2.user_id AND
        a1.date = a2.date AND
        a1.id != a2.id
      WHERE 
        a1.site_id = ${siteId} AND
        a1.date >= ${startDate} AND
        a1.date <= ${endDate}
      GROUP BY a1.user_id, a1.date
      HAVING COUNT(*) > 1
    `;

    if (conflicts.length > 0) {
      errors.push(
        `${conflicts.length} conflit(s) détecté(s) : utilisateurs affectés plusieurs fois le même jour`
      );
    }

    return { errors };
  }

  /**
   * Vérifie les règles métier
   */
  private async checkBusinessRules(
    siteId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier le repos minimum entre gardes
    const insufficientRest = await this.prisma.$queryRaw<any[]>`
      WITH consecutive_guards AS (
        SELECT 
          user_id,
          date,
          LAG(date) OVER (PARTITION BY user_id ORDER BY date) as prev_date
        FROM attributions
        WHERE 
          site_id = ${siteId} AND
          date >= ${startDate} AND
          date <= ${endDate} AND
          type = 'GARDE'
      )
      SELECT 
        user_id,
        COUNT(*) as violations
      FROM consecutive_guards
      WHERE date - prev_date < INTERVAL '2 days'
      GROUP BY user_id
    `;

    if (insufficientRest.length > 0) {
      warnings.push(
        `${insufficientRest.length} utilisateur(s) avec repos insuffisant entre gardes`
      );
    }

    return { errors, warnings };
  }

  /**
   * Nettoie les ressources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.trameService.disconnect();
  }
}

export default TrameIntegrationService;