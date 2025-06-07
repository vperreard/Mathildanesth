import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { OptimizedAuditService } from '@/services/OptimizedAuditService';
import { 
  TrameAffectationType,
  TrameAffectationResponse,
  TrameAffectationListResponse,
  CreateTrameAffectationRequest,
  UpdateTrameAffectationRequest,
  TrameAffectationFilters,
  TrameAffectationSortOptions,
  TramePeriodResponse
} from '@/types/trame-affectations';
import { Prisma } from '@prisma/client';

export class TrameAffectationService {
  private auditService: OptimizedAuditService;

  constructor() {
    this.auditService = new OptimizedAuditService();
  }

  /**
   * Get all trame affectations with pagination and filters
   */
  async getTrameAffectations(
    page: number,
    limit: number,
    filters: TrameAffectationFilters,
    sortOptions: TrameAffectationSortOptions
  ): Promise<TrameAffectationListResponse> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.TrameAffectationWhereInput = {};
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.startDate) {
        where.startDate = { gte: filters.startDate };
      }
      
      if (filters.endDate) {
        where.endDate = { lte: filters.endDate };
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.createdBy) {
        where.createdBy = filters.createdBy;
      }

      // Build orderBy
      const orderBy: Prisma.TrameAffectationOrderByWithRelationInput = {
        [sortOptions.sortBy]: sortOptions.sortOrder
      };

      // Execute queries
      const [trames, total] = await Promise.all([
        prisma.trameAffectation.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            periods: {
              orderBy: { startTime: 'asc' },
              include: {
                _count: {
                  select: { assignments: true }
                }
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        prisma.trameAffectation.count({ where })
      ]);

      const data = trames.map(trame => this.formatTrameResponse(trame));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching trame affectations', { error });
      throw error;
    }
  }

  /**
   * Get a single trame affectation by ID
   */
  async getTrameAffectationById(id: string): Promise<TrameAffectationResponse | null> {
    try {
      const trame = await prisma.trameAffectation.findUnique({
        where: { id },
        include: {
          periods: {
            orderBy: { startTime: 'asc' },
            include: {
              _count: {
                select: { assignments: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!trame) {
        return null;
      }

      return this.formatTrameResponse(trame);
    } catch (error) {
      logger.error('Error fetching trame affectation by ID', { error, id });
      throw error;
    }
  }

  /**
   * Create a new trame affectation
   */
  async createTrameAffectation(
    data: CreateTrameAffectationRequest,
    userId: number
  ): Promise<TrameAffectationResponse> {
    try {
      const trame = await prisma.trameAffectation.create({
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          createdBy: userId,
          periods: {
            create: data.periods?.map(period => ({
              name: period.name,
              startTime: period.startTime,
              endTime: period.endTime,
              color: period.color,
              isActive: period.isActive ?? true,
              isLocked: period.isLocked ?? false
            })) || []
          }
        },
        include: {
          periods: {
            orderBy: { startTime: 'asc' },
            include: {
              _count: {
                select: { assignments: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Audit log
      await this.auditService.logAction({
        userId,
        action: 'CREATE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: trame.id,
        details: {
          name: trame.name,
          periodsCount: trame.periods.length
        }
      });

      return this.formatTrameResponse(trame);
    } catch (error) {
      logger.error('Error creating trame affectation', { error, data });
      throw error;
    }
  }

  /**
   * Update a trame affectation
   */
  async updateTrameAffectation(
    id: string,
    data: UpdateTrameAffectationRequest,
    userId: number
  ): Promise<TrameAffectationResponse | null> {
    try {
      // Get current state for audit
      const currentTrame = await prisma.trameAffectation.findUnique({
        where: { id }
      });

      if (!currentTrame) {
        return null;
      }

      const updateData: Prisma.TrameAffectationUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

      const updatedTrame = await prisma.trameAffectation.update({
        where: { id },
        data: updateData,
        include: {
          periods: {
            orderBy: { startTime: 'asc' },
            include: {
              _count: {
                select: { assignments: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Audit log
      await this.auditService.logAction({
        userId,
        action: 'UPDATE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: id,
        details: {
          changes: data,
          previousState: {
            name: currentTrame.name,
            isActive: currentTrame.isActive,
            startDate: currentTrame.startDate,
            endDate: currentTrame.endDate
          }
        }
      });

      return this.formatTrameResponse(updatedTrame);
    } catch (error) {
      logger.error('Error updating trame affectation', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete a trame affectation
   */
  async deleteTrameAffectation(id: string, userId: number): Promise<boolean> {
    try {
      // Check if trame exists and get details for audit
      const trame = await prisma.trameAffectation.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              periods: true,
              assignments: true
            }
          }
        }
      });

      if (!trame) {
        return false;
      }

      // Check if trame has assignments
      if (trame._count.assignments > 0) {
        throw new Error('Cannot delete trame with existing assignments');
      }

      // Delete trame (cascade will delete periods)
      await prisma.trameAffectation.delete({
        where: { id }
      });

      // Audit log
      await this.auditService.logAction({
        userId,
        action: 'DELETE_TRAME_AFFECTATION',
        entityType: 'TrameAffectation',
        entityId: id,
        details: {
          name: trame.name,
          periodsCount: trame._count.periods,
          assignmentsCount: trame._count.assignments
        }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting trame affectation', { error, id });
      throw error;
    }
  }

  /**
   * Check if user has permission to manage trame affectations
   */
  async checkPermission(userId: number, trameId?: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return false;
      }

      // Admin users can manage all trames
      if (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL') {
        return true;
      }

      // If checking for a specific trame, verify ownership
      if (trameId) {
        const trame = await prisma.trameAffectation.findUnique({
          where: { id: trameId },
          select: { createdBy: true }
        });

        return trame?.createdBy === userId;
      }

      return false;
    } catch (error) {
      logger.error('Error checking trame permission', { error, userId, trameId });
      return false;
    }
  }

  /**
   * Format trame response
   */
  private formatTrameResponse(trame: any): TrameAffectationResponse {
    return {
      id: trame.id,
      name: trame.name,
      description: trame.description,
      isActive: trame.isActive,
      startDate: trame.startDate.toISOString(),
      endDate: trame.endDate?.toISOString() || null,
      createdBy: trame.createdBy,
      createdAt: trame.createdAt.toISOString(),
      updatedAt: trame.updatedAt.toISOString(),
      periods: trame.periods.map((period: any) => ({
        id: period.id,
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        color: period.color,
        isActive: period.isActive,
        isLocked: period.isLocked,
        createdAt: period.createdAt.toISOString(),
        updatedAt: period.updatedAt.toISOString(),
        assignmentsCount: period._count?.assignments || 0
      })),
      user: trame.user ? {
        id: trame.user.id,
        firstName: trame.user.firstName,
        lastName: trame.user.lastName
      } : null
    };
  }
}

// Export singleton instance
export const trameAffectationService = new TrameAffectationService();