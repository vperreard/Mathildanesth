/**
 * Service pour la gestion des secteurs opératoires
 * 
 * Fournit les méthodes pour créer, modifier et gérer les secteurs opératoires
 * dans la nouvelle architecture séparée ActivityType/SectorType
 */

import { prisma } from '@/lib/prisma';
import { 
  OperatingSector, 
  SectorCategory, 
  CreateSectorData, 
  UpdateSectorData,
  SectorStats 
} from '@/types/activityTypes';

export class OperatingSectorService {
  /**
   * Récupère tous les secteurs opératoires
   */
  static async getAllOperatingSectors(filters?: {
    siteId?: string;
    category?: SectorCategory;
    isActive?: boolean;
  }): Promise<OperatingSector[]> {
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

    const sectors = await prisma.operatingSector.findMany({
      where,
      include: {
        site: true,
        rooms: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            number: true,
            roomType: true,
            capacity: true,
            isActive: true,
            displayOrder: true
          }
        },
        _count: {
          select: {
            rooms: true
          }
        }
      },
      orderBy: [
        { displayOrder: { sort: 'asc', nulls: 'last' } },
        { name: 'asc' }
      ]
    });

    return sectors as OperatingSector[];
  }

  /**
   * Récupère un secteur opératoire par son ID
   */
  static async getOperatingSectorById(id: number): Promise<OperatingSector | null> {
    const sector = await prisma.operatingSector.findUnique({
      where: { id },
      include: {
        site: true,
        rooms: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    return sector as OperatingSector | null;
  }

  /**
   * Crée un nouveau secteur opératoire
   */
  static async createOperatingSector(data: CreateSectorData): Promise<OperatingSector> {
    // Vérifier l'unicité du nom pour le site
    const existingSector = await prisma.operatingSector.findFirst({
      where: {
        name: data.name,
        siteId: data.siteId || null
      }
    });

    if (existingSector) {
      throw new Error(`Un secteur avec le nom "${data.name}" existe déjà pour ce site`);
    }

    // Déterminer l'ordre d'affichage si non spécifié
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const lastSector = await prisma.operatingSector.findFirst({
        where: { siteId: data.siteId || null },
        orderBy: { displayOrder: 'desc' }
      });
      displayOrder = (lastSector?.displayOrder || 0) + 1;
    }

    const sector = await prisma.operatingSector.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        colorCode: data.colorCode,
        displayOrder,
        siteId: data.siteId || null,
        rules: data.rules || {},
        isActive: true
      },
      include: {
        site: true,
        rooms: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    return sector as OperatingSector;
  }

  /**
   * Met à jour un secteur opératoire
   */
  static async updateOperatingSector(id: number, data: UpdateSectorData): Promise<OperatingSector> {
    // Vérifier que le secteur existe
    const existingSector = await this.getOperatingSectorById(id);
    if (!existingSector) {
      throw new Error(`Secteur avec l'ID "${id}" non trouvé`);
    }

    // Vérifier l'unicité du nom si modifié
    if (data.name && data.name !== existingSector.name) {
      const nameExists = await prisma.operatingSector.findFirst({
        where: {
          name: data.name,
          siteId: existingSector.siteId,
          id: { not: id }
        }
      });

      if (nameExists) {
        throw new Error(`Un autre secteur avec le nom "${data.name}" existe déjà pour ce site`);
      }
    }

    const sector = await prisma.operatingSector.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.colorCode && { colorCode: data.colorCode }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.rules && { rules: data.rules }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      include: {
        site: true,
        rooms: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    return sector as OperatingSector;
  }

  /**
   * Supprime un secteur opératoire
   */
  static async deleteOperatingSector(id: number): Promise<void> {
    // Vérifier que le secteur existe
    const existingSector = await this.getOperatingSectorById(id);
    if (!existingSector) {
      throw new Error(`Secteur avec l'ID "${id}" non trouvé`);
    }

    // Vérifier qu'il n'y a pas de salles associées
    const roomsCount = await prisma.operatingRoom.count({
      where: { operatingSectorId: id }
    });

    if (roomsCount > 0) {
      throw new Error(
        `Impossible de supprimer ce secteur car il contient ${roomsCount} salle(s). Supprimez d'abord les salles ou réassignez-les.`
      );
    }

    await prisma.operatingSector.delete({
      where: { id }
    });
  }

  /**
   * Désactive/active un secteur opératoire
   */
  static async toggleOperatingSector(id: number): Promise<OperatingSector> {
    const existingSector = await this.getOperatingSectorById(id);
    if (!existingSector) {
      throw new Error(`Secteur avec l'ID "${id}" non trouvé`);
    }

    return this.updateOperatingSector(id, { isActive: !existingSector.isActive });
  }

  /**
   * Réorganise l'ordre des secteurs
   */
  static async reorderOperatingSectors(sectorOrders: { id: number; displayOrder: number }[]): Promise<void> {
    const operations = sectorOrders.map(({ id, displayOrder }) =>
      prisma.operatingSector.update({
        where: { id },
        data: { displayOrder }
      })
    );

    await prisma.$transaction(operations);
  }

  /**
   * Récupère les statistiques d'utilisation d'un secteur opératoire
   */
  static async getOperatingSectorStats(id: number): Promise<SectorStats | null> {
    const sector = await this.getOperatingSectorById(id);
    if (!sector) {
      return null;
    }

    // Compter les salles
    const totalRooms = await prisma.operatingRoom.count({
      where: { operatingSectorId: id }
    });

    const activeRooms = await prisma.operatingRoom.count({
      where: {
        operatingSectorId: id,
        isActive: true
      }
    });

    // Calculer l'utilisation (basée sur les affectations des 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const roomAssignments = await prisma.assignment.count({
      where: {
        operatingRoom: {
          operatingSectorId: id
        },
        date: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Estimation de l'utilisation (jours * salles actives vs affectations)
    const possibleSlots = 30 * activeRooms;
    const utilization = possibleSlots > 0 ? (roomAssignments / possibleSlots) * 100 : 0;

    // Salle la plus utilisée
    const roomUsageStats = await prisma.assignment.groupBy({
      by: ['operatingRoomId'],
      where: {
        operatingRoom: {
          operatingSectorId: id
        },
        date: {
          gte: thirtyDaysAgo
        }
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

    let mostUsedRoom: string | undefined;
    if (roomUsageStats.length > 0 && roomUsageStats[0].operatingRoomId) {
      const room = await prisma.operatingRoom.findUnique({
        where: { id: roomUsageStats[0].operatingRoomId },
        select: { name: true }
      });
      mostUsedRoom = room?.name;
    }

    // Calcul de l'utilisation de la capacité (simplifié)
    const totalCapacity = await prisma.operatingRoom.aggregate({
      where: {
        operatingSectorId: id,
        isActive: true
      },
      _sum: {
        capacity: true
      }
    });

    const capacityUtilization = totalCapacity._sum.capacity && totalCapacity._sum.capacity > 0 
      ? (roomAssignments / (totalCapacity._sum.capacity * 30)) * 100 
      : 0;

    return {
      sectorId: id,
      sectorName: sector.name,
      totalRooms,
      activeRooms,
      utilization: Math.round(utilization * 100) / 100,
      mostUsedRoom,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100
    };
  }

  /**
   * Récupère les secteurs par catégorie
   */
  static async getOperatingSectorsByCategory(siteId?: string): Promise<Record<SectorCategory, OperatingSector[]>> {
    const sectors = await this.getAllOperatingSectors({ 
      siteId, 
      isActive: true 
    });
    
    const result: Record<SectorCategory, OperatingSector[]> = {
      [SectorCategory.STANDARD]: [],
      [SectorCategory.HYPERASEPTIQUE]: [],
      [SectorCategory.OPHTALMOLOGIE]: [],
      [SectorCategory.ENDOSCOPIE]: []
    };

    sectors.forEach(sector => {
      result[sector.category].push(sector);
    });

    return result;
  }

  /**
   * Recherche des secteurs par nom ou description
   */
  static async searchOperatingSectors(
    query: string, 
    filters?: {
      siteId?: string;
      category?: SectorCategory;
      isActive?: boolean;
    }
  ): Promise<OperatingSector[]> {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters?.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const sectors = await prisma.operatingSector.findMany({
      where,
      include: {
        site: true,
        rooms: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: [
        { displayOrder: { sort: 'asc', nulls: 'last' } },
        { name: 'asc' }
      ]
    });

    return sectors as OperatingSector[];
  }
}

export default OperatingSectorService;