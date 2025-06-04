import { PrismaClient, TrameModele, AffectationModele, PersonnelRequisModele, ActivityType, BlocDayPlanning, BlocRoomAssignment, BlocStaffAssignment, User, Surgeon, OperatingRoom, DayOfWeek, Period, TypeSemaineTrame, BlocStaffRole } from '@prisma/client';
import { startOfWeek, addWeeks, addDays, format, getISOWeek, getISODay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrameModeleWithRelations extends TrameModele {
  affectations: (AffectationModele & {
    activityType: ActivityType;
    operatingRoom: OperatingRoom | null;
    personnelRequis: (PersonnelRequisModele & {
      userHabituel: User | null;
      surgeonHabituel: Surgeon | null;
    })[];
  })[];
}

interface ApplyTrameResult {
  success: boolean;
  message: string;
  planningsCreated: number;
  assignmentsCreated: number;
  errors: string[];
  warnings: string[];
}

interface DateRangeOptions {
  forceOverwrite?: boolean;
  skipExistingAssignments?: boolean;
  includeInactive?: boolean;
  dryRun?: boolean;
}

export class TrameApplicationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Applique un modèle de trameModele à une plage de dates
   * Génère automatiquement les BlocDayPlanning et BlocRoomAssignment selon la récurrence
   */
  async applyTrameToDateRange(
    trameModeleId: number,
    startDate: Date,
    endDate: Date,
    siteId: string,
    options: DateRangeOptions = {}
  ): Promise<ApplyTrameResult> {
    const result: ApplyTrameResult = {
      success: false,
      message: '',
      planningsCreated: 0,
      assignmentsCreated: 0,
      errors: [],
      warnings: []
    };

    try {
      // 1. Récupérer le modèle de trameModele avec toutes ses relations
      const trameModele = await this.getTrameModeleWithRelations(trameModeleId);
      if (!trameModele) {
        result.errors.push(`Modèle de trameModele avec l'ID ${trameModeleId} non trouvé`);
        return result;
      }

      // 2. Valider les paramètres
      const validation = this.validateApplyParameters(trameModele, startDate, endDate, siteId);
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        return result;
      }

      // 3. Générer les dates d'application selon la récurrence
      const applicableDates = this.generateApplicableDates(trameModele, startDate, endDate);
      
      if (applicableDates.length === 0) {
        result.warnings.push('Aucune date applicable trouvée pour cette plage et cette récurrence');
        result.success = true;
        result.message = 'Aucune date à traiter';
        return result;
      }

      // 4. Mode dry run - simulation sans persistance
      if (options.dryRun) {
        result.success = true;
        result.message = `Mode simulation: ${applicableDates.length} dates seraient traitées`;
        result.planningsCreated = applicableDates.length;
        result.assignmentsCreated = applicableDates.length * trameModele.affectations.length;
        return result;
      }

      // 5. Appliquer la trameModele pour chaque date
      for (const date of applicableDates) {
        try {
          const dayResult = await this.applyTrameToSingleDate(
            trameModele,
            date,
            siteId,
            options
          );
          
          result.planningsCreated += dayResult.planningCreated ? 1 : 0;
          result.assignmentsCreated += dayResult.assignmentsCreated;
          result.warnings.push(...dayResult.warnings);
          
        } catch (error) {
          const errorMsg = `Erreur pour la date ${format(date, 'dd/MM/yyyy')}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          
          // Continuer le traitement des autres dates
          continue;
        }
      }

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Tableau de service appliquée avec succès sur ${result.planningsCreated} jours`
        : `Tableau de service appliquée partiellement avec ${result.errors.length} erreurs`;

      return result;

    } catch (error) {
      result.errors.push(`Erreur générale: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Récupère un modèle de trameModele avec toutes ses relations
   */
  private async getTrameModeleWithRelations(trameModeleId: number): Promise<TrameModeleWithRelations | null> {
    return await this.prisma.trameModele.findUnique({
      where: { id: trameModeleId },
      include: {
        affectations: {
          include: {
            activityType: true,
            operatingRoom: true,
            personnelRequis: {
              include: {
                userHabituel: true,
                surgeonHabituel: true
              }
            }
          },
          where: {
            isActive: true
          }
        }
      }
    });
  }

  /**
   * Valide les paramètres d'application de la trameModele
   */
  private validateApplyParameters(
    trameModele: TrameModeleWithRelations,
    startDate: Date,
    endDate: Date,
    siteId: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier que la trameModele est active
    if (!trameModele.isActive) {
      errors.push('Le modèle de trameModele n\'est pas actif');
    }

    // Vérifier les dates de validité de la trameModele
    if (startDate < trameModele.dateDebutEffet) {
      errors.push(`La date de début est antérieure à la date d'effet de la trameModele(${format(trameModele.dateDebutEffet, 'dd/MM/yyyy')})`);
    }

    if (trameModele.dateFinEffet && endDate > trameModele.dateFinEffet) {
      errors.push(`La date de fin est postérieure à la date de fin d'effet de la trameModele(${format(trameModele.dateFinEffet, 'dd/MM/yyyy')})`);
    }

    // Vérifier la cohérence des dates
    if (startDate > endDate) {
      errors.push('La date de début doit être antérieure à la date de fin');
    }

    // Vérifier que la trameModele a des gardes/vacations
    if (trameModele.affectations.length === 0) {
      errors.push('Le modèle de trameModele ne contient aucune affectation active');
    }

    // Vérifier la cohérence du site si spécifié
    if (trameModele.siteId && trameModele.siteId !== siteId) {
      errors.push(`Le modèle de trameModele est associé au site ${trameModele.siteId} mais l'application est demandée pour le site ${siteId}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Génère la liste des dates auxquelles appliquer la trameModele selon sa récurrence
   */
  private generateApplicableDates(
    trameModele: TrameModeleWithRelations,
    startDate: Date,
    endDate: Date
  ): Date[] {
    const dates: Date[] = [];
    
    if (trameModele.recurrenceType === 'AUCUNE') {
      // Application unique à la date de début si elle est dans la plage
      if (startDate >= trameModele.dateDebutEffet && 
          (!trameModele.dateFinEffet || startDate <= trameModele.dateFinEffet)) {
        dates.push(startDate);
      }
      return dates;
    }

    if (trameModele.recurrenceType === 'HEBDOMADAIRE') {
      // Générer les dates selon la récurrence hebdomadaire
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Vérifier si la date est dans la période d'effet de la trameModele
        if (currentDate >= trameModele.dateDebutEffet && 
            (!trameModele.dateFinEffet || currentDate <= trameModele.dateFinEffet)) {
          
          const dayOfWeek = getISODay(currentDate); // Lundi = 1, Dimanche = 7
          const weekNumber = getISOWeek(currentDate);
          
          // Vérifier si ce jour de la semaine est actif dans la trameModele
          if (trameModele.joursSemaineActifs.includes(dayOfWeek)) {
            // Vérifier le type de semaine (paire/impaire/toutes)
            if (this.isDateApplicableForWeekType(weekNumber, trameModele.typeSemaine)) {
              dates.push(new Date(currentDate));
            }
          }
        }
        
        currentDate = addDays(currentDate, 1);
      }
    }

    return dates;
  }

  /**
   * Vérifie si une date est applicable selon le type de semaine
   */
  private isDateApplicableForWeekType(weekNumber: number, typeSemaine: TypeSemaineTrame): boolean {
    switch (typeSemaine) {
      case 'TOUTES':
        return true;
      case 'PAIRES':
        return weekNumber % 2 === 0;
      case 'IMPAIRES':
        return weekNumber % 2 === 1;
      default:
        return false;
    }
  }

  /**
   * Applique la trameModele à une date spécifique
   */
  private async applyTrameToSingleDate(
    trameModele: TrameModeleWithRelations,
    date: Date,
    siteId: string,
    options: DateRangeOptions
  ): Promise<{
    planningCreated: boolean;
    assignmentsCreated: number;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let assignmentsCreated = 0;
    let planningCreated = false;

    // 1. Créer ou récupérer le BlocDayPlanning pour cette date
    let blocDayPlanning = await this.prisma.blocDayPlanning.findUnique({
      where: {
        siteId_date: {
          siteId,
          date
        }
      }
    });

    if (!blocDayPlanning) {
      blocDayPlanning = await this.prisma.blocDayPlanning.create({
        data: {
          date,
          siteId,
          status: 'DRAFT'
        }
      });
      planningCreated = true;
    } else if (!options.forceOverwrite) {
      warnings.push(`Planning existant pour le ${format(date, 'dd/MM/yyyy')} - utilisez forceOverwrite pour écraser`);
    }

    // 2. Traiter chaque affectation de la trameModele
    const dayOfWeek = this.convertISODayToDayOfWeek(getISODay(date));
    const weekNumber = getISOWeek(date);
    const isApplicableWeek = this.isDateApplicableForWeekType(weekNumber, trameModele.typeSemaine);

    for (const affectation of trameModele.affectations) {
      // Vérifier si cette affectation s'applique à ce jour et ce type de semaine
      if (affectation.jourSemaine === dayOfWeek && 
          (affectation.typeSemaine === 'TOUTES' || 
           (affectation.typeSemaine === 'PAIRES' && weekNumber % 2 === 0) ||
           (affectation.typeSemaine === 'IMPAIRES' && weekNumber % 2 === 1))) {
        
        try {
          const assignmentCreated = await this.createRoomAssignmentFromAffectation(
            blocDayPlanning.id,
            affectation,
            options
          );
          
          if (assignmentCreated) {
            assignmentsCreated++;
          }
        } catch (error) {
          warnings.push(`Erreur lors de la création de l'affectation pour ${affectation.activityType.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      planningCreated,
      assignmentsCreated,
      warnings
    };
  }

  /**
   * Crée un BlocRoomAssignment à partir d'un AffectationModele
   */
  private async createRoomAssignmentFromAffectation(
    blocDayPlanningId: string,
    affectation: AffectationModele & {
      activityType: ActivityType;
      operatingRoom: OperatingRoom | null;
      personnelRequis: (PersonnelRequisModele & {
        userHabituel: User | null;
        surgeonHabituel: Surgeon | null;
      })[];
    },
    options: DateRangeOptions
  ): Promise<boolean> {
    
    if (!affectation.operatingRoom) {
      throw new Error(`Aucune salle d'opération définie pour l'affectation ${affectation.activityType.name}`);
    }

    // Vérifier s'il existe déjà une affectation pour cette salle et cette période
    if (!options.forceOverwrite && !options.skipExistingAssignments) {
      const existingAssignment = await this.prisma.blocRoomAssignment.findFirst({
        where: {
          blocDayPlanningId,
          operatingRoomId: affectation.operatingRoomId!,
          period: affectation.periode
        }
      });

      if (existingAssignment) {
        if (options.skipExistingAssignments) {
          return false; // Skip sans erreur
        } else {
          throw new Error(`Garde/Vacation existante pour la salle ${affectation.operatingRoom.name} en ${affectation.periode}`);
        }
      }
    }

    // Créer l'affectation de salle
    const roomAssignment = await this.prisma.blocRoomAssignment.create({
      data: {
        blocDayPlanningId,
        operatingRoomId: affectation.operatingRoomId!,
        period: affectation.periode,
        chirurgienId: affectation.personnelRequis.find(p => p.surgeonHabituel)?.surgeonHabituel?.id,
        expectedSpecialty: affectation.activityType.name,
        notes: `Généré automatiquement depuis la trameModele ${affectation.trameModeleId}`
      }
    });

    // Créer les gardes/vacations de personnel
    for (const personnelRequis of affectation.personnelRequis) {
      if (personnelRequis.userHabituel && personnelRequis.roleGenerique) {
        await this.createStaffAssignmentFromPersonnelRequis(
          roomAssignment.id,
          personnelRequis
        );
      }
    }

    return true;
  }

  /**
   * Crée un BlocStaffAssignment à partir d'un PersonnelRequisModele
   */
  private async createStaffAssignmentFromPersonnelRequis(
    blocRoomAssignmentId: string,
    personnelRequis: PersonnelRequisModele & {
      userHabituel: User | null;
    }
  ): Promise<void> {
    if (!personnelRequis.userHabituel) {
      return;
    }

    // Mapper le rôle générique vers BlocStaffRole
    const role = this.mapRoleGeneriqueToStaffRole(personnelRequis.roleGenerique);
    if (!role) {
      throw new Error(`Rôle générique non supporté: ${personnelRequis.roleGenerique}`);
    }

    await this.prisma.blocStaffAssignment.create({
      data: {
        blocRoomAssignmentId,
        userId: personnelRequis.userHabituel.id,
        role,
        isPrimaryAnesthetist: personnelRequis.roleGenerique === 'IADE' // Par défaut pour les IADE
      }
    });
  }

  /**
   * Convertit un jour ISO (1-7) en DayOfWeek Prisma
   */
  private convertISODayToDayOfWeek(isoDay: number): DayOfWeek {
    const mapping: { [key: number]: DayOfWeek } = {
      1: 'MONDAY',
      2: 'TUESDAY', 
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
      7: 'SUNDAY'
    };
    return mapping[isoDay];
  }

  /**
   * Mappe un rôle générique vers BlocStaffRole
   */
  private mapRoleGeneriqueToStaffRole(roleGenerique: string): BlocStaffRole | null {
    const mapping: { [key: string]: BlocStaffRole } = {
      'MAR': 'MAR',
      'IADE': 'IADE'
    };
    return mapping[roleGenerique] || null;
  }

  /**
   * Nettoie les ressources Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default TrameApplicationService;