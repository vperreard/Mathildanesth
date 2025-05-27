import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/admin/rules/v2/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    planningRule: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn()
    },
    activityLog: {
      create: jest.fn()
    },
    ruleVersion: {
      create: jest.fn()
    }
  }
}));

describe('Rule API v2', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/rules/v2', () => {
    it('should return paginated rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'Test Rule',
          type: 'PLANNING',
          status: 'active',
          _count: { versions: 3 }
        }
      ];

      (prisma.planningRule.count as jest.Mock).mockResolvedValue(1);
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue(mockRules);

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rules).toHaveLength(1);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });

    it('should filter by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2?status=active');
      await GET(request);

      expect(prisma.planningRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' }
        })
      );
    });

    it('should search by name and description', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2?search=test');
      await GET(request);

      expect(prisma.planningRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } }
            ]
          }
        })
      );
    });

    it('should filter by tags', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2?tags=planning,critical');
      await GET(request);

      expect(prisma.planningRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tags: { hasSome: ['planning', 'critical'] } }
        })
      );
    });

    it('should reject non-admin users', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { ...mockSession.user, role: 'USER' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/admin/rules/v2', () => {
    const validRuleData = {
      name: 'New Rule',
      description: 'Test rule creation',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'draft',
      conditions: [
        { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
      ],
      actions: [
        { type: 'PREVENT', target: 'assignment', message: 'Not allowed' }
      ],
      effectiveDate: '2024-01-01T00:00:00Z'
    };

    it('should create a new rule', async () => {
      const mockCreatedRule = {
        ...validRuleData,
        id: 'rule-new',
        version: 1,
        createdBy: 'user-1',
        updatedBy: 'user-1'
      };

      (prisma.planningRule.create as jest.Mock).mockResolvedValue(mockCreatedRule);
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([]); // No conflicts

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'POST',
        body: JSON.stringify(validRuleData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.rule).toMatchObject(mockCreatedRule);
      expect(data.message).toBe('Règle créée avec succès');
    });

    it('should detect conflicts when creating', async () => {
      const conflictingRule = {
        id: 'existing-rule',
        conditions: [
          { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
        ],
        actions: [
          { type: 'ALLOW', target: 'assignment' }
        ]
      };

      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([conflictingRule]);
      (prisma.planningRule.create as jest.Mock).mockResolvedValue({ ...validRuleData, id: 'new-rule' });

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'POST',
        body: JSON.stringify(validRuleData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.conflicts).toHaveLength(2); // condition overlap + action contradiction
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validRuleData, name: '' };

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Données invalides');
    });
  });

  describe('PUT /api/admin/rules/v2', () => {
    it('should bulk update rules', async () => {
      (prisma.planningRule.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'PUT',
        body: JSON.stringify({
          ruleIds: ['rule-1', 'rule-2', 'rule-3'],
          updates: { status: 'active', priority: 15 }
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(3);
      expect(data.message).toBe('3 règle(s) mise(s) à jour');
    });

    it('should require rule IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'PUT',
        body: JSON.stringify({
          updates: { status: 'active' }
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Liste des IDs de règles requise');
    });
  });

  describe('DELETE /api/admin/rules/v2', () => {
    it('should archive rules (soft delete)', async () => {
      (prisma.planningRule.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2', {
        method: 'DELETE',
        body: JSON.stringify({
          ruleIds: ['rule-1', 'rule-2']
        })
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('2 règle(s) archivée(s)');
      
      expect(prisma.planningRule.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['rule-1', 'rule-2'] } },
        data: expect.objectContaining({
          status: 'archived'
        })
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.planningRule.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur lors de la récupération des règles');
    });

    it('should handle missing session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/rules/v2');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});