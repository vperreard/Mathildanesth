import { prisma } from '@/lib/prisma';
import { LeaveRequest } from '@/types/leave';
import { Assignment } from '@/types/assignment';
import { startOfDay, endOfDay, differenceInDays, addDays, subDays } from 'date-fns';

jest.mock('@/lib/prisma');


interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface LeaveValidationInput {
  userId: string;
  startDate: Date;
  endDate: Date;
  type: string;
  quotaId?: string;
}

interface AssignmentValidationInput {
  userId: string;
  operatingRoomId: string;
  date: Date;
  shiftType: 'JOUR' | 'GARDE';
  duration?: number;
}

interface PlanningGenerationInput {
  startDate: Date;
  endDate: Date;
  siteId: string;
  includeWeekends?: boolean;
  respectQuotas?: boolean;
}

export class BusinessRulesValidator {
  // Constantes de règles métier
  private static readonly MAX_CONSECUTIVE_DAYS_LEAVE = 30;
  private static readonly MIN_DAYS_BETWEEN_LONG_LEAVES = 90;
  private static readonly MAX_LEAVE_DAYS_PER_YEAR = 45;
  private static readonly MIN_DAYS_BETWEEN_GUARDS = 7;
  private static readonly MAX_GUARDS_PER_MONTH = 4;
  private static readonly MAX_HOURS_PER_WEEK = 48;
  private static readonly MIN_REST_HOURS_AFTER_GUARD = 11;
  private static readonly MAX_ROOMS_PER_MAR = 3;
  private static readonly MIN_MAR_PER_ROOM = 1;
  private static readonly MAX_CONSECUTIVE_WORKING_DAYS = 6;

  /**
   * Valide une demande de congé
   */
  static async validateLeaveRequest(input: LeaveValidationInput): Promise<ValidationResult> {
    const errors: string[] = [];
    const { userId, startDate, endDate, type, quotaId } = input;

    try {
      // 1. Vérifier la durée maximale du congé
      const leaveDays = differenceInDays(endDate, startDate) + 1;
      if (leaveDays > this.MAX_CONSECUTIVE_DAYS_LEAVE) {
        errors.push(`La durée du congé ne peut pas dépasser ${this.MAX_CONSECUTIVE_DAYS_LEAVE} jours consécutifs`);
      }

      // 2. Vérifier les chevauchements avec d'autres congés
      const overlappingLeaves = await prisma.leave.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        }
      });

      if (overlappingLeaves.length > 0) {
        errors.push('Ce congé chevauche avec une autre demande existante');
      }

      // 3. Vérifier les quotas si applicable
      if (quotaId) {
        const quota = await prisma.leaveQuota.findUnique({
          where: { id: quotaId },
          include: {
            leaves: {
              where: {
                userId,
                status: 'APPROVED',
                startDate: {
                  gte: new Date(new Date().getFullYear(), 0, 1),
                  lte: new Date(new Date().getFullYear(), 11, 31)
                }
              }
            }
          }
        });

        if (quota) {
          const usedDays = quota.leaves.reduce((total, leave) => {
            return total + differenceInDays(leave.endDate, leave.startDate) + 1;
          }, 0);

          if (usedDays + leaveDays > quota.totalDays) {
            errors.push(`Quota insuffisant. Disponible: ${quota.totalDays - usedDays} jours`);
          }
        }
      }

      // 4. Vérifier le nombre total de jours de congé dans l'année
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const yearEnd = new Date(new Date().getFullYear(), 11, 31);
      
      const yearLeaves = await prisma.leave.findMany({
        where: {
          userId,
          status: 'APPROVED',
          startDate: { gte: yearStart, lte: yearEnd }
        }
      });

      const totalDaysThisYear = yearLeaves.reduce((total, leave) => {
        return total + differenceInDays(leave.endDate, leave.startDate) + 1;
      }, 0) + leaveDays;

      if (totalDaysThisYear > this.MAX_LEAVE_DAYS_PER_YEAR) {
        errors.push(`Le nombre total de jours de congé ne peut pas dépasser ${this.MAX_LEAVE_DAYS_PER_YEAR} jours par an`);
      }

      // 5. Vérifier l'espacement entre congés longs (> 14 jours)
      if (leaveDays > 14) {
        const recentLongLeaves = await prisma.leave.findMany({
          where: {
            userId,
            status: 'APPROVED',
            startDate: {
              gte: subDays(startDate, this.MIN_DAYS_BETWEEN_LONG_LEAVES),
              lte: addDays(endDate, this.MIN_DAYS_BETWEEN_LONG_LEAVES)
            }
          }
        });

        const longLeaves = recentLongLeaves.filter(leave => 
          differenceInDays(leave.endDate, leave.startDate) + 1 > 14
        );

        if (longLeaves.length > 0) {
          errors.push(`Un délai de ${this.MIN_DAYS_BETWEEN_LONG_LEAVES} jours est requis entre les congés longs`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push('Erreur lors de la validation du congé');
      return { valid: false, errors };
    }
  }

  /**
   * Valide une affectation
   */
  static async validateAssignment(input: AssignmentValidationInput): Promise<ValidationResult> {
    const errors: string[] = [];
    const { userId, operatingRoomId, date, shiftType, duration = 8 } = input;

    try {
      // 1. Vérifier les conflits horaires
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const existingAssignments = await prisma.assignment.findMany({
        where: {
          userId,
          date: { gte: dayStart, lte: dayEnd }
        }
      });

      if (existingAssignments.length > 0) {
        errors.push('Une affectation existe déjà pour cette date');
      }

      // 2. Vérifier les compétences requises pour la salle
      const operatingRoom = await prisma.operatingRoom.findUnique({
        where: { id: operatingRoomId },
        include: { sector: true }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          skills: true,
          qualifications: true
        }
      });

      if (operatingRoom && user) {
        // Vérifier si la salle nécessite des compétences spéciales
        if (operatingRoom.roomType === 'ENDOSCOPIE' || operatingRoom.roomType === 'RADIOLOGIE') {
          const hasRequiredSkills = user.skills.some(skill => 
            skill.name === operatingRoom.roomType || skill.name === 'POLYVALENT'
          );
          
          if (!hasRequiredSkills) {
            errors.push(`Compétences requises pour la salle ${operatingRoom.name} (${operatingRoom.roomType})`);
          }
        }

        // Vérifier le statut pour les salles spécialisées
        if (operatingRoom.sector?.category === 'SPECIALIZED' && user.professionalRole === 'IADE_JUNIOR') {
          errors.push('Les IADEs juniors ne peuvent pas être affectés aux salles spécialisées sans supervision');
        }
      }

      // 3. Vérifier les règles de garde
      if (shiftType === 'GARDE') {
        // Vérifier l'intervalle entre gardes
        const recentGuards = await prisma.assignment.findMany({
          where: {
            userId,
            shiftType: 'GARDE',
            date: {
              gte: subDays(date, this.MIN_DAYS_BETWEEN_GUARDS),
              lt: date
            }
          }
        });

        if (recentGuards.length > 0) {
          errors.push(`Un délai minimum de ${this.MIN_DAYS_BETWEEN_GUARDS} jours est requis entre les gardes`);
        }

        // Vérifier le nombre de gardes dans le mois
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthGuards = await prisma.assignment.findMany({
          where: {
            userId,
            shiftType: 'GARDE',
            date: { gte: monthStart, lte: monthEnd }
          }
        });

        if (monthGuards.length >= this.MAX_GUARDS_PER_MONTH) {
          errors.push(`Le nombre maximum de gardes par mois (${this.MAX_GUARDS_PER_MONTH}) est atteint`);
        }
      }

      // 4. Vérifier le temps de travail hebdomadaire
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekAssignments = await prisma.assignment.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd }
        }
      });

      const totalHours = weekAssignments.reduce((sum, assignment) => 
        sum + (assignment.duration || 8), 0
      ) + duration;

      if (totalHours > this.MAX_HOURS_PER_WEEK) {
        errors.push(`Le temps de travail hebdomadaire ne peut pas dépasser ${this.MAX_HOURS_PER_WEEK} heures`);
      }

      // 5. Vérifier les jours consécutifs de travail
      const consecutiveDays = await this.checkConsecutiveWorkingDays(userId, date);
      if (consecutiveDays >= this.MAX_CONSECUTIVE_WORKING_DAYS) {
        errors.push(`Le nombre maximum de jours consécutifs de travail (${this.MAX_CONSECUTIVE_WORKING_DAYS}) est atteint`);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push('Erreur lors de la validation de l\'affectation');
      return { valid: false, errors };
    }
  }

  /**
   * Valide la génération d'un planning
   */
  static async validatePlanningGeneration(input: PlanningGenerationInput): Promise<ValidationResult> {
    const errors: string[] = [];
    const { startDate, endDate, siteId, includeWeekends = false } = input;

    try {
      // 1. Vérifier la période de génération
      const daysDiff = differenceInDays(endDate, startDate) + 1;
      if (daysDiff > 31) {
        errors.push('La génération de planning est limitée à 31 jours maximum');
      }

      // 2. Vérifier les ressources disponibles
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
          operatingRooms: true,
          users: {
            where: { isActive: true }
          }
        }
      });

      if (!site) {
        errors.push('Site invalide');
        return { valid: false, errors };
      }

      if (site.operatingRooms.length === 0) {
        errors.push('Aucune salle d\'opération disponible sur ce site');
      }

      // 3. Vérifier le ratio MARs/salles
      const mars = site.users.filter(u => u.professionalRole === 'MAR');
      const iadesConfirmed = site.users.filter(u => u.professionalRole === 'IADE');
      const operatingRoomsCount = site.operatingRooms.length;

      if (mars.length < Math.ceil(operatingRoomsCount / this.MAX_ROOMS_PER_MAR)) {
        errors.push(`Nombre insuffisant de MARs. Minimum requis: ${Math.ceil(operatingRoomsCount / this.MAX_ROOMS_PER_MAR)}`);
      }

      if (iadesConfirmed.length < operatingRoomsCount * this.MIN_MAR_PER_ROOM) {
        errors.push(`Nombre insuffisant d'IADEs. Minimum requis: ${operatingRoomsCount * this.MIN_MAR_PER_ROOM}`);
      }

      // 4. Vérifier les congés prévus
      const leaves = await prisma.leave.findMany({
        where: {
          status: 'APPROVED',
          user: { siteId },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        },
        include: { user: true }
      });

      // Calculer la disponibilité par jour
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        
        // Ignorer les weekends si non inclus
        if (!includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
          continue;
        }

        const usersOnLeave = leaves.filter(leave => 
          currentDate >= leave.startDate && currentDate <= leave.endDate
        );

        const availableMars = mars.filter(mar => 
          !usersOnLeave.some(leave => leave.userId === mar.id)
        ).length;

        const availableIades = iadesConfirmed.filter(iade => 
          !usersOnLeave.some(leave => leave.userId === iade.id)
        ).length;

        if (availableMars < Math.ceil(operatingRoomsCount / this.MAX_ROOMS_PER_MAR)) {
          errors.push(`Nombre insuffisant de MARs disponibles le ${currentDate.toLocaleDateString('fr-FR')}`);
        }

        if (availableIades < operatingRoomsCount) {
          errors.push(`Nombre insuffisant d'IADEs disponibles le ${currentDate.toLocaleDateString('fr-FR')}`);
        }
      }

      // 5. Vérifier les règles de garde (weekends et fériés)
      if (includeWeekends) {
        // Vérifier qu'il y a assez de personnel pour les gardes
        const guardsNeeded = Math.ceil(operatingRoomsCount / 2); // Estimation
        if (mars.length < guardsNeeded * 2 || iadesConfirmed.length < guardsNeeded * 2) {
          errors.push('Personnel insuffisant pour assurer les gardes de weekend');
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.slice(0, 10) // Limiter à 10 erreurs pour la lisibilité
      };
    } catch (error) {
      errors.push('Erreur lors de la validation de la génération du planning');
      return { valid: false, errors };
    }
  }

  /**
   * Méthode utilitaire pour vérifier les jours consécutifs de travail
   */
  private static async checkConsecutiveWorkingDays(userId: string, date: Date): Promise<number> {
    let consecutiveDays = 1;
    let checkDate = new Date(date);

    // Vérifier les jours précédents
    for (let i = 1; i <= this.MAX_CONSECUTIVE_WORKING_DAYS; i++) {
      checkDate.setDate(checkDate.getDate() - 1);
      const assignment = await prisma.assignment.findFirst({
        where: {
          userId,
          date: {
            gte: startOfDay(checkDate),
            lte: endOfDay(checkDate)
          }
        }
      });

      if (assignment) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    // Vérifier les jours suivants
    checkDate = new Date(date);
    for (let i = 1; i <= this.MAX_CONSECUTIVE_WORKING_DAYS - consecutiveDays + 1; i++) {
      checkDate.setDate(checkDate.getDate() + 1);
      const assignment = await prisma.assignment.findFirst({
        where: {
          userId,
          date: {
            gte: startOfDay(checkDate),
            lte: endOfDay(checkDate)
          }
        }
      });

      if (assignment) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }
}