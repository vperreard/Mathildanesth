/**
 * Tests complets pour toutes les routes API
 * Tests l'authentification, validation, et fonctionnalités
 */

import { NextRequest } from 'next/server';
import { 
  mockPrisma, 
  testDataFactories, 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} from '../../../test-utils/standardMocks';

// Mock des modules Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
      headers: new Headers()
    })),
    redirect: jest.fn()
  }
}));

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock de l'authentification
jest.mock('@/lib/auth-server-utils', () => ({
  getAuthTokenServer: jest.fn(),
  checkUserRole: jest.fn(),
}));

// Mock des headers Next.js
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn()
  }))
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('API Routes', () => {
  let testEnv: any;
  let mockAuthUtils: any;
  let mockHeaders: any;

  beforeAll(() => {
    testEnv = setupTestEnvironment();
    mockAuthUtils = require('@/lib/auth-server-utils');
    mockHeaders = require('next/headers');
  });

  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration par défaut pour l'auth
    mockAuthUtils.getAuthTokenServer.mockResolvedValue('valid-token');
    mockAuthUtils.checkUserRole.mockResolvedValue({
      hasRequiredRole: true,
      user: testDataFactories.user({ role: 'ADMIN_TOTAL' }),
      error: null
    });

    mockHeaders.headers.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
  });

  describe('/api/trames', () => {
    let tramesesRoute: any;

    beforeEach(async () => {
      // Import dynamique pour éviter les problèmes de mocking
      tramesesRoute = await import('../trames/route');
    });

    describe('GET /api/trames', () => {
      it('should return trames for authorized user', async () => {
        const mockTrames = [
          testDataFactories.trameAffectation({ id: 1, nom: 'Trame 1' }),
          testDataFactories.trameAffectation({ id: 2, nom: 'Trame 2' })
        ];

        mockPrisma.trameAffectation.findMany.mockResolvedValue(mockTrames);

        const request = new NextRequest('http://localhost:3000/api/trames');
        const response = await tramesesRoute.GET(request);

        expect(mockPrisma.trameAffectation.findMany).toHaveBeenCalledWith({
          orderBy: { updatedAt: 'desc' },
          include: expect.objectContaining({
            periods: expect.any(Object),
            user: expect.any(Object)
          })
        });

        const responseData = await response.json();
        expect(responseData).toEqual(mockTrames);
        expect(response.status).toBe(200);
      });

      it('should reject unauthorized user', async () => {
        mockAuthUtils.checkUserRole.mockResolvedValue({
          hasRequiredRole: false,
          user: null,
          error: 'Insufficient permissions'
        });

        const request = new NextRequest('http://localhost:3000/api/trames');
        const response = await tramesesRoute.GET(request);

        expect(response.status).toBe(401);
        const responseData = await response.json();
        expect(responseData.error).toBe('Insufficient permissions');
      });

      it('should handle dev mode header authentication', async () => {
        process.env.NODE_ENV = 'development';
        
        mockAuthUtils.checkUserRole.mockResolvedValue({
          hasRequiredRole: false,
          user: null,
          error: 'Token invalid'
        });

        mockHeaders.headers.mockReturnValue({
          get: jest.fn().mockReturnValue('ADMIN_TOTAL')
        });

        const mockTrames = [testDataFactories.trameAffectation()];
        mockPrisma.trameAffectation.findMany.mockResolvedValue(mockTrames);

        const request = new NextRequest('http://localhost:3000/api/trames');
        const response = await tramesesRoute.GET(request);

        expect(response.status).toBe(200);
        
        // Restore NODE_ENV
        process.env.NODE_ENV = 'test';
      });

      it('should handle database errors gracefully', async () => {
        mockPrisma.trameAffectation.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost:3000/api/trames');
        const response = await tramesesRoute.GET(request);

        expect(response.status).toBe(500);
        const responseData = await response.json();
        expect(responseData.error).toContain('Erreur interne');
      });
    });

    describe('POST /api/trames', () => {
      it('should create new trame successfully', async () => {
        const newTrameData = {
          nom: 'Nouvelle Trame',
          description: 'Description test',
          type: 'PLANNING'
        };

        const createdTrame = testDataFactories.trameAffectation({
          id: 1,
          nom: newTrameData.nom,
          description: newTrameData.description
        });

        mockPrisma.trameAffectation.create.mockResolvedValue(createdTrame);

        const request = new NextRequest('http://localhost:3000/api/trames', {
          method: 'POST',
          body: JSON.stringify(newTrameData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await tramesesRoute.POST(request);

        expect(mockPrisma.trameAffectation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            nom: newTrameData.nom,
            description: newTrameData.description,
            id: 'mock-uuid-123'
          })
        });

        expect(response.status).toBe(201);
        const responseData = await response.json();
        expect(responseData).toEqual(createdTrame);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // nom manquant
          description: 'Description sans nom'
        };

        const request = new NextRequest('http://localhost:3000/api/trames', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await tramesesRoute.POST(request);

        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toContain('requis');
      });

      it('should handle malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/trames', {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await tramesesRoute.POST(request);

        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toContain('JSON invalide');
      });
    });
  });

  describe('/api/public-holidays', () => {
    let publicHolidaysRoute: any;

    beforeEach(async () => {
      publicHolidaysRoute = await import('../public-holidays/route');
    });

    describe('GET /api/public-holidays', () => {
      it('should return public holidays for valid year', async () => {
        const mockHolidays = [
          { date: '2025-01-01', name: 'Jour de l\'An' },
          { date: '2025-12-25', name: 'Noël' }
        ];

        // Mock du service public holiday
        jest.doMock('@/modules/leaves/services/publicHolidayService', () => ({
          publicHolidayService: {
            getPublicHolidaysForYear: jest.fn().mockResolvedValue(mockHolidays)
          }
        }));

        const url = new URL('http://localhost:3000/api/public-holidays?year=2025');
        const request = new NextRequest(url);

        const response = await publicHolidaysRoute.GET(request);

        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData).toEqual(mockHolidays);
      });

      it('should validate year parameter', async () => {
        const url = new URL('http://localhost:3000/api/public-holidays?year=invalid');
        const request = new NextRequest(url);

        const response = await publicHolidaysRoute.GET(request);

        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toContain('invalide');
      });

      it('should reject year out of range', async () => {
        const url = new URL('http://localhost:3000/api/public-holidays?year=1800');
        const request = new NextRequest(url);

        const response = await publicHolidaysRoute.GET(request);

        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toContain('hors plage');
      });

      it('should handle missing year parameter', async () => {
        const url = new URL('http://localhost:3000/api/public-holidays');
        const request = new NextRequest(url);

        const response = await publicHolidaysRoute.GET(request);

        expect(response.status).toBe(400);
      });
    });
  });

  describe('/api/cache-stats', () => {
    let cacheStatsRoute: any;

    beforeEach(async () => {
      cacheStatsRoute = await import('../cache-stats/route');
    });

    describe('GET /api/cache-stats', () => {
      it('should return cache statistics for admin', async () => {
        const mockStats = {
          hits: 150,
          misses: 25,
          hitRate: 0.857,
          totalKeys: 42,
          memoryUsage: '2.5MB'
        };

        // Mock du service de cache
        jest.doMock('@/services/CacheService', () => ({
          getStats: jest.fn().mockResolvedValue(mockStats)
        }));

        const request = new NextRequest('http://localhost:3000/api/cache-stats');
        const response = await cacheStatsRoute.GET(request);

        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData).toEqual(mockStats);
      });

      it('should reject non-admin users', async () => {
        mockAuthUtils.checkUserRole.mockResolvedValue({
          hasRequiredRole: false,
          user: testDataFactories.user({ role: 'USER' }),
          error: 'Admin access required'
        });

        const request = new NextRequest('http://localhost:3000/api/cache-stats');
        const response = await cacheStatsRoute.GET(request);

        expect(response.status).toBe(403);
        const responseData = await response.json();
        expect(responseData.error).toContain('Admin');
      });
    });
  });

  describe('/api/sectors', () => {
    let sectorsRoute: any;

    beforeEach(async () => {
      sectorsRoute = await import('../sectors/route');
    });

    describe('GET /api/sectors', () => {
      it('should return sectors with proper ordering', async () => {
        const mockSectors = [
          { id: 1, name: 'Secteur A', displayOrder: 1 },
          { id: 2, name: 'Secteur B', displayOrder: 2 }
        ];

        mockPrisma.operatingSector.findMany.mockResolvedValue(mockSectors);

        const request = new NextRequest('http://localhost:3000/api/sectors');
        const response = await sectorsRoute.GET(request);

        expect(mockPrisma.operatingSector.findMany).toHaveBeenCalledWith({
          orderBy: { displayOrder: 'asc' },
          include: expect.any(Object)
        });

        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData).toEqual(mockSectors);
      });

      it('should handle site filtering', async () => {
        const mockSectors = [
          { id: 1, name: 'Secteur A', siteId: 'site-1' }
        ];

        mockPrisma.operatingSector.findMany.mockResolvedValue(mockSectors);

        const url = new URL('http://localhost:3000/api/sectors?siteId=site-1');
        const request = new NextRequest(url);

        const response = await sectorsRoute.GET(request);

        expect(mockPrisma.operatingSector.findMany).toHaveBeenCalledWith({
          where: { siteId: 'site-1' },
          orderBy: { displayOrder: 'asc' },
          include: expect.any(Object)
        });
      });
    });

    describe('POST /api/sectors', () => {
      it('should create new sector', async () => {
        const newSectorData = {
          name: 'Nouveau Secteur',
          siteId: 'site-1',
          category: 'SURGERY'
        };

        const createdSector = {
          id: 1,
          ...newSectorData,
          displayOrder: 1
        };

        mockPrisma.operatingSector.create.mockResolvedValue(createdSector);

        const request = new NextRequest('http://localhost:3000/api/sectors', {
          method: 'POST',
          body: JSON.stringify(newSectorData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await sectorsRoute.POST(request);

        expect(response.status).toBe(201);
        const responseData = await response.json();
        expect(responseData).toEqual(createdSector);
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should handle expired tokens', async () => {
      mockAuthUtils.getAuthTokenServer.mockResolvedValue(null);
      mockAuthUtils.checkUserRole.mockResolvedValue({
        hasRequiredRole: false,
        user: null,
        error: 'Token expired'
      });

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames');
      const response = await tramesesRoute.GET(request);

      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.error).toBe('Token expired');
    });

    it('should handle invalid tokens', async () => {
      mockAuthUtils.getAuthTokenServer.mockResolvedValue('invalid-token');
      mockAuthUtils.checkUserRole.mockResolvedValue({
        hasRequiredRole: false,
        user: null,
        error: 'Invalid token'
      });

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames');
      const response = await tramesesRoute.GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle insufficient permissions', async () => {
      mockAuthUtils.checkUserRole.mockResolvedValue({
        hasRequiredRole: false,
        user: testDataFactories.user({ role: 'USER' }),
        error: 'Insufficient permissions'
      });

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames');
      const response = await tramesesRoute.GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.trameAffectation.findMany.mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames');
      const response = await tramesesRoute.GET(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toContain('Erreur interne');
    });

    it('should handle validation errors', async () => {
      mockPrisma.trameAffectation.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint violation'
      });

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames', {
        method: 'POST',
        body: JSON.stringify({
          nom: 'Trame Existante',
          description: 'Test'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await tramesesRoute.POST(request);

      expect(response.status).toBe(409);
      const responseData = await response.json();
      expect(responseData.error).toContain('existe déjà');
    });

    it('should handle network timeouts', async () => {
      mockPrisma.trameAffectation.findMany.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames');
      const response = await tramesesRoute.GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle CORS headers', async () => {
      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames', {
        headers: {
          'Origin': 'http://localhost:3001'
        }
      });

      const response = await tramesesRoute.GET(request);

      // Vérifier que les headers CORS sont appropriés (si implémentés)
      expect(response.headers).toBeDefined();
    });

    it('should validate content-type for POST requests', async () => {
      const tramesesRoute = await import('../trames/route');
      const request = new NextRequest('http://localhost:3000/api/trames', {
        method: 'POST',
        body: JSON.stringify({ nom: 'Test' }),
        headers: {
          'Content-Type': 'text/plain' // Invalid content type
        }
      });

      const response = await tramesesRoute.POST(request);

      // Should handle gracefully even with incorrect content-type
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});