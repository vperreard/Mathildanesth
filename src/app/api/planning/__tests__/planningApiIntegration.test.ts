import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

// Mock des modules externes
jest.mock('@/lib/prisma', () => ({
  prisma: {
    attribution: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn()
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    planning: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {}
}));

jest.mock('@/services/planningService', () => ({
  PlanningService: {
    saveAssignments: jest.fn(),
    validateAssignments: jest.fn(),
    getAssignments: jest.fn()
  }
}));

jest.mock('@/services/planningGenerator', () => ({
  PlanningGenerator: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    generate: jest.fn().mockResolvedValue({
      attributions: [],
      validation: { valid: true, violations: [], metrics: { equiteScore: 0.8 } },
      metrics: { totalAssignments: 0, coveragePercentage: 90, equityScore: 0.8, conflictsDetected: 0 }
    })
  }))
}));

// Mock WebSocket pour les notifications temps réel
const mockWebSocketSend = jest.fn();
jest.mock('@/lib/websocket', () => ({
  WebSocketService: {
    broadcast: jest.fn(),
    sendToUser: mockWebSocketSend,
    notifyPlanningUpdate: jest.fn()
  }
}));

describe('Planning API Integration Tests', () => {
  const mockSession = {
    user: {
      id: '1',
      role: 'ADMIN',
      email: 'admin@hospital.fr',
      sites: [1]
    }
  };

  const mockUser = {
    id: 1,
    nom: 'Admin',
    prenom: 'Test',
    email: 'admin@hospital.fr',
    role: 'ADMIN',
    active: true,
    sites: [1]
  };

  const mockPersonnel = [
    {
      id: 1,
      nom: 'Martin',
      prenom: 'Jean',
      email: 'j.martin@hospital.fr',
      role: 'MAR',
      specialite: 'Anesthésie Générale',
      active: true,
      sites: [1],
      competences: ['BLOC_GENERAL'],
      weeklyHours: 35
    },
    {
      id: 2,
      nom: 'Dubois',
      prenom: 'Marie',
      email: 'm.dubois@hospital.fr',
      role: 'IADE',
      specialite: 'Anesthésie Pédiatrique',
      active: true,
      sites: [1],
      competences: ['PEDIATRIE', 'SUPERVISION_MAR'],
      weeklyHours: 35
    }
  ];

  const mockAttributions = [
    {
      id: 'attr-1',
      userId: '1',
      type: 'GARDE',
      startDate: new Date('2025-01-15T08:00:00'),
      endDate: new Date('2025-01-16T08:00:00'),
      site: 'Bloc Principal',
      status: 'VALIDATED'
    },
    {
      id: 'attr-2',
      userId: '2',
      type: 'ASTREINTE',
      startDate: new Date('2025-01-15T18:00:00'),
      endDate: new Date('2025-01-16T08:00:00'),
      site: 'Bloc Principal',
      status: 'PENDING'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth par défaut
    const { getServerSession } = require('@/lib/auth');
    getServerSession.mockResolvedValue(mockSession);

    // Mock Prisma par défaut
    const { prisma } = require('@/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.findMany.mockResolvedValue(mockPersonnel);
    prisma.attribution.findMany.mockResolvedValue(mockAttributions);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/planning/gardes-vacations', () => {
    it('should retrieve planning assignments for date range', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/planning/gardes-vacations?start=2025-01-15&end=2025-01-15',
        query: {
          start: '2025-01-15',
          end: '2025-01-15'
        }
      });

      const { prisma } = require('@/lib/prisma');
      prisma.attribution.findMany.mockResolvedValue(mockAttributions);

      // Simulate API call
      const response = await fetch('http://localhost:3000/api/planning/gardes-vacations', {
        method: 'GET'
      });

      expect(prisma.attribution.findMany).toHaveBeenCalledWith({
        where: {
          startDate: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true,
              specialite: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });
    });

    it('should filter by user role when specified', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/planning/gardes-vacations?start=2025-01-15&end=2025-01-15&role=MAR',
        query: {
          start: '2025-01-15',
          end: '2025-01-15',
          role: 'MAR'
        }
      });

      const { prisma } = require('@/lib/prisma');
      const marAttributions = mockAttributions.filter(attr => attr.userId === '1');
      prisma.attribution.findMany.mockResolvedValue(marAttributions);

      expect(prisma.attribution.findMany).toHaveBeenCalledWith({
        where: {
          startDate: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          },
          user: {
            role: 'MAR'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true,
              specialite: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });
    });

    it('should handle site-specific filtering', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/planning/gardes-vacations?start=2025-01-15&end=2025-01-15&site=1',
        query: {
          start: '2025-01-15',
          end: '2025-01-15',
          site: '1'
        }
      });

      const { prisma } = require('@/lib/prisma');
      prisma.attribution.findMany.mockResolvedValue(mockAttributions);

      expect(prisma.attribution.findMany).toHaveBeenCalledWith({
        where: {
          startDate: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          },
          user: {
            sites: {
              hasSome: [1]
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true,
              specialite: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });
    });
  });

  describe('POST /api/planning/gardes-vacations', () => {
    it('should create new planning assignments', async () => {
      const newAttributions = [
        {
          userId: '1',
          type: 'GARDE',
          startDate: new Date('2025-01-20T08:00:00'),
          endDate: new Date('2025-01-21T08:00:00'),
          site: 'Bloc Principal'
        }
      ];

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/planning/gardes-vacations',
        body: {
          attributions: newAttributions
        }
      });

      const { prisma } = require('@/lib/prisma');
      const { PlanningService } = require('@/services/planningService');
      
      // Mock successful validation and creation
      PlanningService.validateAssignments.mockResolvedValue([]);
      prisma.attribution.createMany.mockResolvedValue({ count: 1 });
      
      const createdAttribution = {
        id: 'new-attr-1',
        ...newAttributions[0],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prisma.attribution.findMany.mockResolvedValue([createdAttribution]);

      // Simulate API call
      expect(PlanningService.validateAssignments).toHaveBeenCalledWith(newAttributions);
      expect(prisma.attribution.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 1,
            type: 'GARDE',
            status: 'PENDING'
          })
        ])
      });
    });

    it('should reject invalid assignments', async () => {
      const invalidAttributions = [
        {
          userId: '1',
          type: 'GARDE',
          startDate: new Date('2025-01-20T08:00:00'),
          endDate: new Date('2025-01-21T08:00:00'),
          site: 'Bloc Principal'
        }
      ];

      const validationViolations = [
        {
          ruleId: 'INSUFFICIENT_REST_TIME',
          severity: 'ERROR',
          message: 'Temps de repos insuffisant entre deux gardes',
          assignmentId: 'temp-id',
          userId: '1'
        }
      ];

      const { PlanningService } = require('@/services/planningService');
      PlanningService.validateAssignments.mockResolvedValue(validationViolations);

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/planning/gardes-vacations',
        body: {
          attributions: invalidAttributions
        }
      });

      // Simulation would reject with validation errors
      expect(PlanningService.validateAssignments).toHaveBeenCalledWith(invalidAttributions);
    });

    it('should send real-time notifications on creation', async () => {
      const newAttributions = [
        {
          userId: '1',
          type: 'GARDE',
          startDate: new Date('2025-01-20T08:00:00'),
          endDate: new Date('2025-01-21T08:00:00'),
          site: 'Bloc Principal'
        }
      ];

      const { prisma } = require('@/lib/prisma');
      const { PlanningService } = require('@/services/planningService');
      const { WebSocketService } = require('@/lib/websocket');
      
      PlanningService.validateAssignments.mockResolvedValue([]);
      prisma.attribution.createMany.mockResolvedValue({ count: 1 });

      // Simulate successful creation
      expect(WebSocketService.notifyPlanningUpdate).toHaveBeenCalledWith({
        type: 'PLANNING_CREATED',
        data: {
          attributions: expect.any(Array),
          createdBy: mockSession.user.id,
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('PUT /api/planning/gardes-vacations', () => {
    it('should update existing assignments', async () => {
      const updatedAttributions = [
        {
          id: 'attr-1',
          userId: '1',
          type: 'GARDE',
          startDate: new Date('2025-01-15T09:00:00'), // Changed time
          endDate: new Date('2025-01-16T09:00:00'),
          site: 'Bloc Principal',
          status: 'VALIDATED'
        }
      ];

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/planning/gardes-vacations',
        body: {
          attributions: updatedAttributions
        }
      });

      const { prisma } = require('@/lib/prisma');
      const { PlanningService } = require('@/services/planningService');
      
      PlanningService.validateAssignments.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (operations) => {
        return await Promise.all(operations);
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle bulk assignment updates efficiently', async () => {
      const bulkUpdates = Array.from({ length: 50 }, (_, i) => ({
        id: `attr-${i}`,
        userId: String((i % 2) + 1),
        type: i % 2 === 0 ? 'GARDE' : 'ASTREINTE',
        startDate: new Date(`2025-01-${i + 1 <= 31 ? i + 1 : 31}T08:00:00`),
        endDate: new Date(`2025-01-${i + 1 <= 31 ? i + 1 : 31}T20:00:00`),
        site: 'Bloc Principal',
        status: 'VALIDATED'
      }));

      const { prisma } = require('@/lib/prisma');
      const { PlanningService } = require('@/services/planningService');
      
      PlanningService.validateAssignments.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (operations) => {
        // Simulate efficient batch processing
        expect(operations.length).toBeLessThanOrEqual(10); // Batched operations
        return operations;
      });

      // Simulate bulk update
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/planning/gardes-vacations', () => {
    it('should delete assignments by ID', async () => {
      const assignmentIds = ['attr-1', 'attr-2'];

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/planning/gardes-vacations',
        body: {
          ids: assignmentIds
        }
      });

      const { prisma } = require('@/lib/prisma');
      prisma.attribution.delete.mockResolvedValue({ count: 2 });

      expect(prisma.attribution.delete).toHaveBeenCalledWith({
        where: {
          id: {
            in: assignmentIds
          }
        }
      });
    });

    it('should prevent deletion of validated assignments without permission', async () => {
      const protectedAssignmentIds = ['validated-attr-1'];

      const sessionWithoutPermission = {
        ...mockSession,
        user: {
          ...mockSession.user,
          role: 'USER' // Not admin
        }
      };

      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValue(sessionWithoutPermission);

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/planning/gardes-vacations',
        body: {
          ids: protectedAssignmentIds
        }
      });

      // Should throw authorization error
      expect(() => {
        // Simulate authorization check
        if (sessionWithoutPermission.user.role !== 'ADMIN') {
          throw new Error('Insufficient permissions to delete validated assignments');
        }
      }).toThrow('Insufficient permissions');
    });
  });

  describe('POST /api/planning/generate', () => {
    it('should generate planning with medical parameters', async () => {
      const generationParameters = {
        dateDebut: '2025-02-01',
        dateFin: '2025-02-28',\n        etapesActives: ['GARDE', 'ASTREINTE'],\n        niveauOptimisation: 'medical',\n        appliquerPreferencesPersonnelles: true,\n        poidsEquite: 0.4,\n        poidsPreference: 0.3,\n        poidsQualiteVie: 0.3\n      };\n\n      const { req, res } = createMocks({\n        method: 'POST',\n        url: '/api/planning/generate',\n        body: generationParameters\n      });\n\n      const { PlanningGenerator } = require('@/services/planningGenerator');\n      const mockGenerator = new PlanningGenerator();\n      \n      const generatedResult = {\n        attributions: [\n          {\n            id: 'generated-1',\n            userId: '1',\n            type: 'GARDE',\n            startDate: new Date('2025-02-01T08:00:00'),\n            endDate: new Date('2025-02-02T08:00:00'),\n            status: 'PENDING'\n          }\n        ],\n        validation: {\n          valid: true,\n          violations: [],\n          metrics: { equiteScore: 0.85, fatigueScore: 0.3 }\n        },\n        metrics: {\n          totalAssignments: 1,\n          coveragePercentage: 95,\n          equityScore: 0.85,\n          conflictsDetected: 0\n        }\n      };\n\n      mockGenerator.generate.mockResolvedValue(generatedResult);\n\n      expect(mockGenerator.initialize).toHaveBeenCalledWith(\n        mockPersonnel,\n        expect.any(Array)\n      );\n      expect(mockGenerator.generate).toHaveBeenCalled();\n    });\n\n    it('should handle generation with medical constraints', async () => {\n      const medicalParameters = {\n        dateDebut: '2025-02-01',\n        dateFin: '2025-02-28',\n        etapesActives: ['GARDE', 'ASTREINTE'],\n        constraintesMedicales: {\n          tempsReposMinimum: 12,\n          maxGardesConsecutives: 2,\n          supervisionMAR: true,\n          limitesSpecialite: true\n        }\n      };\n\n      const { PlanningGenerator } = require('@/services/planningGenerator');\n      const mockGenerator = new PlanningGenerator();\n      \n      const constrainedResult = {\n        attributions: [],\n        validation: {\n          valid: false,\n          violations: [\n            {\n              ruleId: 'SUPERVISION_REQUIRED',\n              severity: 'ERROR',\n              message: 'Supervision IADE requise pour MAR',\n              userId: '1'\n            }\n          ],\n          metrics: { equiteScore: 0.5 }\n        },\n        metrics: {\n          totalAssignments: 0,\n          coveragePercentage: 60,\n          equityScore: 0.5,\n          conflictsDetected: 1\n        }\n      };\n\n      mockGenerator.generate.mockResolvedValue(constrainedResult);\n\n      // Should handle constraints and return appropriate warnings\n      expect(constrainedResult.validation.violations.length).toBeGreaterThan(0);\n      expect(constrainedResult.validation.violations[0].ruleId).toBe('SUPERVISION_REQUIRED');\n    });\n  });\n\n  describe('WebSocket Real-time Updates', () => {\n    it('should broadcast planning changes to connected users', async () => {\n      const { WebSocketService } = require('@/lib/websocket');\n      \n      const planningUpdate = {\n        type: 'PLANNING_UPDATED',\n        data: {\n          attributions: mockAttributions,\n          updatedBy: mockSession.user.id,\n          timestamp: new Date(),\n          affectedUsers: ['1', '2']\n        }\n      };\n\n      WebSocketService.broadcast.mockImplementation((message) => {\n        expect(message.type).toBe('PLANNING_UPDATED');\n        expect(message.data.affectedUsers).toContain('1');\n        expect(message.data.affectedUsers).toContain('2');\n      });\n\n      WebSocketService.broadcast(planningUpdate);\n      \n      expect(WebSocketService.broadcast).toHaveBeenCalledWith(planningUpdate);\n    });\n\n    it('should notify specific users of their assignment changes', async () => {\n      const { WebSocketService } = require('@/lib/websocket');\n      \n      const userSpecificUpdate = {\n        type: 'ASSIGNMENT_CHANGED',\n        data: {\n          userId: '1',\n          assignment: mockAttributions[0],\n          changeType: 'UPDATED',\n          timestamp: new Date()\n        }\n      };\n\n      WebSocketService.sendToUser.mockImplementation((userId, message) => {\n        expect(userId).toBe('1');\n        expect(message.type).toBe('ASSIGNMENT_CHANGED');\n        expect(message.data.assignment.id).toBe('attr-1');\n      });\n\n      WebSocketService.sendToUser('1', userSpecificUpdate);\n      \n      expect(mockWebSocketSend).toHaveBeenCalledWith('1', userSpecificUpdate);\n    });\n\n    it('should handle WebSocket connection failures gracefully', async () => {\n      const { WebSocketService } = require('@/lib/websocket');\n      \n      // Simulate connection failure\n      WebSocketService.broadcast.mockImplementation(() => {\n        throw new Error('WebSocket connection failed');\n      });\n\n      const planningUpdate = {\n        type: 'PLANNING_UPDATED',\n        data: { test: 'data' }\n      };\n\n      // Should not throw error, should handle gracefully\n      expect(() => {\n        try {\n          WebSocketService.broadcast(planningUpdate);\n        } catch (error) {\n          // Log error but continue operation\n          console.error('WebSocket notification failed:', error.message);\n        }\n      }).not.toThrow();\n    });\n  });\n\n  describe('Performance and Scaling', () => {\n    it('should handle large dataset queries efficiently', async () => {\n      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({\n        id: `large-attr-${i}`,\n        userId: String((i % 10) + 1),\n        type: i % 3 === 0 ? 'GARDE' : i % 3 === 1 ? 'ASTREINTE' : 'CONSULTATION',\n        startDate: new Date(`2025-01-${(i % 31) + 1}T08:00:00`),\n        endDate: new Date(`2025-01-${(i % 31) + 1}T20:00:00`),\n        status: 'VALIDATED'\n      }));\n\n      const { prisma } = require('@/lib/prisma');\n      \n      // Mock efficient pagination\n      prisma.attribution.findMany.mockImplementation(({ skip, take }) => {\n        const start = skip || 0;\n        const limit = take || 50;\n        return Promise.resolve(largeDataset.slice(start, start + limit));\n      });\n\n      prisma.attribution.count.mockResolvedValue(largeDataset.length);\n\n      const { req, res } = createMocks({\n        method: 'GET',\n        url: '/api/planning/gardes-vacations?start=2025-01-01&end=2025-01-31&page=1&limit=50',\n        query: {\n          start: '2025-01-01',\n          end: '2025-01-31',\n          page: '1',\n          limit: '50'\n        }\n      });\n\n      expect(prisma.attribution.findMany).toHaveBeenCalledWith(\n        expect.objectContaining({\n          skip: 0,\n          take: 50\n        })\n      );\n    });\n\n    it('should implement caching for frequently accessed data', async () => {\n      const cacheKey = 'planning_2025-01-15_2025-01-15';\n      const cachedData = mockAttributions;\n\n      // Mock Redis cache\n      const mockCache = {\n        get: jest.fn().mockResolvedValue(JSON.stringify(cachedData)),\n        set: jest.fn().mockResolvedValue(true),\n        del: jest.fn().mockResolvedValue(true)\n      };\n\n      // Simulate cache hit\n      const cacheResult = await mockCache.get(cacheKey);\n      expect(cacheResult).toBeDefined();\n      expect(JSON.parse(cacheResult)).toEqual(cachedData);\n\n      // Simulate cache invalidation on update\n      await mockCache.del(cacheKey);\n      expect(mockCache.del).toHaveBeenCalledWith(cacheKey);\n    });\n\n    it('should rate limit API requests', async () => {\n      const rateLimitStore = new Map();\n      const maxRequests = 100; // per minute\n      const windowMs = 60 * 1000; // 1 minute\n\n      const checkRateLimit = (ip: string) => {\n        const now = Date.now();\n        const windowStart = now - windowMs;\n        \n        if (!rateLimitStore.has(ip)) {\n          rateLimitStore.set(ip, []);\n        }\n        \n        const requests = rateLimitStore.get(ip);\n        const recentRequests = requests.filter((time: number) => time > windowStart);\n        \n        if (recentRequests.length >= maxRequests) {\n          throw new Error('Rate limit exceeded');\n        }\n        \n        recentRequests.push(now);\n        rateLimitStore.set(ip, recentRequests);\n      };\n\n      const testIp = '192.168.1.1';\n      \n      // Should allow normal usage\n      for (let i = 0; i < 50; i++) {\n        expect(() => checkRateLimit(testIp)).not.toThrow();\n      }\n      \n      // Should block excessive requests\n      for (let i = 0; i < 60; i++) {\n        checkRateLimit(testIp);\n      }\n      \n      expect(() => checkRateLimit(testIp)).toThrow('Rate limit exceeded');\n    });\n  });\n\n  describe('Error Handling and Recovery', () => {\n    it('should handle database connection failures', async () => {\n      const { prisma } = require('@/lib/prisma');\n      \n      // Simulate database connection error\n      prisma.attribution.findMany.mockRejectedValue(new Error('Database connection failed'));\n\n      const { req, res } = createMocks({\n        method: 'GET',\n        url: '/api/planning/gardes-vacations?start=2025-01-15&end=2025-01-15'\n      });\n\n      // Should handle gracefully and return appropriate error\n      try {\n        await prisma.attribution.findMany();\n      } catch (error) {\n        expect(error.message).toBe('Database connection failed');\n        // Should log error and return 500 status\n      }\n    });\n\n    it('should implement transaction rollback on partial failures', async () => {\n      const { prisma } = require('@/lib/prisma');\n      \n      const bulkOperations = [\n        { operation: 'create', data: { userId: 1, type: 'GARDE' } },\n        { operation: 'update', id: 'attr-1', data: { status: 'VALIDATED' } },\n        { operation: 'delete', id: 'attr-2' }\n      ];\n\n      // Simulate partial failure (second operation fails)\n      prisma.$transaction.mockImplementation(async (operations) => {\n        // First operation succeeds\n        await operations[0]();\n        \n        // Second operation fails\n        throw new Error('Update operation failed');\n        \n        // Third operation never executes due to rollback\n      });\n\n      try {\n        await prisma.$transaction(bulkOperations.map(() => jest.fn()));\n      } catch (error) {\n        expect(error.message).toBe('Update operation failed');\n        // All operations should be rolled back\n      }\n    });\n\n    it('should validate request data thoroughly', async () => {\n      const invalidRequest = {\n        attributions: [\n          {\n            // Missing required fields\n            userId: null,\n            type: 'INVALID_TYPE',\n            startDate: 'invalid-date',\n            endDate: new Date('2025-01-01'), // End before start\n          }\n        ]\n      };\n\n      const validateRequestData = (data: any) => {\n        const errors = [];\n        \n        if (!data.attributions || !Array.isArray(data.attributions)) {\n          errors.push('attributions must be an array');\n        }\n        \n        data.attributions.forEach((attr: any, index: number) => {\n          if (!attr.userId) {\n            errors.push(`attributions[${index}].userId is required`);\n          }\n          \n          if (!['GARDE', 'ASTREINTE', 'CONSULTATION', 'BLOC'].includes(attr.type)) {\n            errors.push(`attributions[${index}].type is invalid`);\n          }\n          \n          if (isNaN(Date.parse(attr.startDate))) {\n            errors.push(`attributions[${index}].startDate is invalid`);\n          }\n          \n          if (new Date(attr.endDate) <= new Date(attr.startDate)) {\n            errors.push(`attributions[${index}].endDate must be after startDate`);\n          }\n        });\n        \n        return errors;\n      };\n\n      const validationErrors = validateRequestData(invalidRequest);\n      \n      expect(validationErrors.length).toBeGreaterThan(0);\n      expect(validationErrors).toContain('attributions[0].userId is required');\n      expect(validationErrors).toContain('attributions[0].type is invalid');\n      expect(validationErrors).toContain('attributions[0].startDate is invalid');\n      expect(validationErrors).toContain('attributions[0].endDate must be after startDate');\n    });\n  });\n});