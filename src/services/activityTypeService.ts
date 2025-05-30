/**
 * Service pour la gestion des types d'activités
 * 
 * Fournit les méthodes pour créer, modifier et gérer les types d'activités
 * dans la nouvelle architecture séparée ActivityType/SectorType
 */

import { prisma } from '@/lib/prisma';
import { 
  ActivityType, 
  ActivityCategory, 
  Period, 
  CreateActivityTypeData, 
  UpdateActivityTypeData,
  ActivityTypeStats 
} from '@/types/activityTypes';

export class ActivityTypeService {
  /**
   * Récupère tous les types d'activités
   */
  static async getAllActivityTypes(filters?: {
    siteId?: string;
    category?: ActivityCategory;
    isActive?: boolean;
  }): Promise<ActivityType[]> {
    const where: any = {};

    if (filters?.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const activityTypes = await prisma.activityType.findMany({
      where,
      include: {
        site: true,
        _count: {
          select: {
            assignments: true,
            affectationModeles: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return activityTypes as ActivityType[];
  }

  /**
   * Récupère un type d'activité par son ID
   */
  static async getActivityTypeById(id: string): Promise<ActivityType | null> {
    const activityType = await prisma.activityType.findUnique({
      where: { id },
      include: {
        site: true,
        _count: {
          select: {
            assignments: true,
            affectationModeles: true
          }
        }
      }
    });

    return activityType as ActivityType | null;
  }

  /**
   * Récupère un type d'activité par son code
   */
  static async getActivityTypeByCode(code: string, siteId?: string): Promise<ActivityType | null> {
    const activityType = await prisma.activityType.findFirst({
      where: {
        code: code.toUpperCase(),
        siteId: siteId || null
      },
      include: {
        site: true
      }
    });

    return activityType as ActivityType | null;
  }

  /**
   * Crée un nouveau type d'activité
   */
  static async createActivityType(data: CreateActivityTypeData): Promise<ActivityType> {
    // Vérifier l'unicité du code
    const existingActivityType = await this.getActivityTypeByCode(data.code, data.siteId);
    if (existingActivityType) {
      throw new Error(`Un type d'activité avec le code "${data.code}" existe déjà`);
    }

    const activityType = await prisma.activityType.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        color: data.color,
        icon: data.icon,
        code: data.code.toUpperCase(),
        defaultDurationHours: data.defaultDurationHours,
        defaultPeriod: data.defaultPeriod,
        siteId: data.siteId || null,
        isActive: true
      },
      include: {
        site: true
      }
    });

    return activityType as ActivityType;
  }

  /**
   * Met à jour un type d'activité
   */
  static async updateActivityType(id: string, data: UpdateActivityTypeData): Promise<ActivityType> {
    // Vérifier que le type d'activité existe
    const existingActivityType = await this.getActivityTypeById(id);
    if (!existingActivityType) {
      throw new Error(`Type d'activité avec l'ID "${id}" non trouvé`);
    }

    // Vérifier l'unicité du code si modifié
    if (data.code && data.code !== existingActivityType.code) {
      const codeExists = await this.getActivityTypeByCode(data.code, existingActivityType.siteId || undefined);
      if (codeExists && codeExists.id !== id) {
        throw new Error(`Un autre type d'activité avec le code "${data.code}" existe déjà`);
      }
    }

    const activityType = await prisma.activityType.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.color && { color: data.color }),
        ...(data.icon && { icon: data.icon }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.defaultDurationHours !== undefined && { defaultDurationHours: data.defaultDurationHours }),
        ...(data.defaultPeriod && { defaultPeriod: data.defaultPeriod }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      include: {
        site: true
      }
    });

    return activityType as ActivityType;
  }

  /**
   * Supprime un type d'activité
   */
  static async deleteActivityType(id: string): Promise<void> {
    // Vérifier que le type d'activité existe
    const existingActivityType = await this.getActivityTypeById(id);
    if (!existingActivityType) {
      throw new Error(`Type d'activité avec l'ID "${id}" non trouvé`);
    }

    // Vérifier qu'il n'y a pas d'affectations ou de modèles associés
    const usageCount = await prisma.assignment.count({
      where: { activityTypeId: id }
    });

    const modelsCount = await prisma.affectationModele.count({
      where: { activityTypeId: id }
    });

    if (usageCount > 0 || modelsCount > 0) {
      throw new Error(
        `Impossible de supprimer ce type d'activité car il est utilisé dans ${usageCount} affectation(s) et ${modelsCount} modèle(s)`
      );
    }

    await prisma.activityType.delete({
      where: { id }
    });
  }

  /**
   * Désactive/active un type d'activité
   */
  static async toggleActivityType(id: string): Promise<ActivityType> {
    const existingActivityType = await this.getActivityTypeById(id);
    if (!existingActivityType) {
      throw new Error(`Type d'activité avec l'ID "${id}" non trouvé`);
    }

    return this.updateActivityType(id, { isActive: !existingActivityType.isActive });
  }

  /**
   * Récupère les statistiques d'utilisation d'un type d'activité
   */
  static async getActivityTypeStats(id: string): Promise<ActivityTypeStats | null> {
    const activityType = await this.getActivityTypeById(id);
    if (!activityType) {
      return null;
    }

    // Compter les affectations
    const totalAssignments = await prisma.assignment.count({
      where: { activityTypeId: id }
    });

    const activeAssignments = await prisma.assignment.count({
      where: {
        activityTypeId: id,
        date: {
          gte: new Date()
        }
      }
    });

    // Statistiques par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await prisma.assignment.groupBy({
      by: ['date'],
      where: {
        activityTypeId: id,
        date: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Organiser par mois
    const usageByMonth: Record<string, number> = {};
    monthlyStats.forEach(stat => {
      const monthKey = stat.date.toISOString().slice(0, 7); // YYYY-MM
      usageByMonth[monthKey] = (usageByMonth[monthKey] || 0) + stat._count.id;
    });

    // Période la plus utilisée
    const periodStats = await prisma.assignment.groupBy({
      by: ['period'],
      where: {
        activityTypeId: id,
        period: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const mostUsedPeriod = periodStats[0]?.period as Period;

    return {
      activityTypeId: id,
      activityTypeName: activityType.name,
      totalAssignments,
      activeAssignments,
      mostUsedPeriod,
      usageByMonth
    };
  }

  /**
   * Migre les anciennes affectations vers les nouveaux types d'activités
   */
  static async migrateOldAssignments(): Promise<{ migrated: number; errors: string[] }> {
    let migrated = 0;
    const errors: string[] = [];

    // Mapping des anciens types vers les nouveaux IDs
    const typeMapping = new Map<string, string>();

    // Récupérer tous les types d'activités existants
    const activityTypes = await this.getAllActivityTypes();
    activityTypes.forEach(type => {
      typeMapping.set(type.code, type.id);
      // Ajouter des alias pour les anciens noms
      typeMapping.set(type.name.toUpperCase(), type.id);
    });

    // Récupérer les affectations sans activityTypeId
    const assignmentsToMigrate = await prisma.assignment.findMany({
      where: {
        type: { not: null },
        activityTypeId: null
      },
      select: {
        id: true,
        type: true
      }
    });

    for (const assignment of assignmentsToMigrate) {
      try {
        if (!assignment.type) continue;

        const normalizedType = assignment.type.toUpperCase();
        const activityTypeId = typeMapping.get(normalizedType);

        if (activityTypeId) {
          await prisma.assignment.update({
            where: { id: assignment.id },
            data: { activityTypeId }
          });
          migrated++;
        } else {
          errors.push(`Type non mappé: ${assignment.type} (Assignment ID: ${assignment.id})`);
        }
      } catch (error) {
        errors.push(`Erreur migration Assignment ${assignment.id}: ${error}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Récupère les types d'activités par catégorie
   */
  static async getActivityTypesByCategory(): Promise<Record<ActivityCategory, ActivityType[]>> {
    const activityTypes = await this.getAllActivityTypes({ isActive: true });
    
    const result: Record<ActivityCategory, ActivityType[]> = {
      [ActivityCategory.GARDE]: [],
      [ActivityCategory.ASTREINTE]: [],
      [ActivityCategory.CONSULTATION]: [],
      [ActivityCategory.BLOC_OPERATOIRE]: [],
      [ActivityCategory.REUNION]: [],
      [ActivityCategory.FORMATION]: [],
      [ActivityCategory.ADMINISTRATIF]: [],
      [ActivityCategory.AUTRE]: []
    };

    activityTypes.forEach(type => {
      result[type.category].push(type);
    });

    return result;
  }
}

export default ActivityTypeService;