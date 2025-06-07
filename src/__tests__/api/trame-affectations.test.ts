import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/trame-modeles/[trameModeleId]/affectations-individuelles/route';
import { trameAffectationService } from '@/services/trameAffectationService';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/auth-server-utils');
jest.mock('@/services/trameAffectationService');
jest.mock('@/lib/permissions');
jest.mock('@/lib/logger');

const mockVerifyAuthToken = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>;

describe('Trame Affectations API', () => {
  const mockUser = {
    userId: 1,
    role: 'ADMIN_TOTAL',
    email: 'admin@test.com'
  };

  const mockTrameAffectation = {
    id: 'trame-1',
    name: 'Trame Test',
    description: 'Test description',
    isActive: true,
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: null,
    createdBy: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    periods: [],
    user: {
      id: 1,
      firstName: 'Admin',
      lastName: 'Test'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Mocking logger methods
    logger.info = jest.fn();
    // @ts-ignore
    logger.error = jest.fn();
  });

  describe('GET /api/trame-modeles/[trameId]/affectations', () => {
    it('should return trame affectations for authenticated user', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockResolvedValue(true);
      (trameAffectationService.getTrameAffectations as jest.Mock).mockResolvedValue({
        data: [mockTrameAffectation],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles?page=1&limit=20');
      const response = await GET(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('trame-1');
      expect(mockVerifyAuthToken).toHaveBeenCalled();
      expect(trameAffectationService.checkPermission).toHaveBeenCalledWith(1, '123');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockVerifyAuthToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles');
      const response = await GET(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for user without permission', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles');
      const response = await GET(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should handle query parameters correctly', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockResolvedValue(true);
      (trameAffectationService.getTrameAffectations as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles?page=2&limit=10&isActive=true&search=test'
      );
      const response = await GET(request, { params: { trameModeleId: '123' } });

      expect(response.status).toBe(200);
      expect(trameAffectationService.getTrameAffectations).toHaveBeenCalledWith(
        2,
        10,
        expect.objectContaining({
          isActive: true,
          search: 'test'
        }),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/trame-modeles/[trameId]/affectations', () => {
    const newAffectation = {
      name: 'New Trame',
      description: 'New description',
      isActive: true,
      startDate: '2025-01-01T00:00:00.000Z',
      periods: [
        {
          name: 'Morning',
          startTime: '08:00',
          endTime: '12:00',
          color: '#FF0000'
        }
      ]
    };

    it('should create new affectation for admin user', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      mockHasPermission.mockReturnValue(true);
      (trameAffectationService.createTrameAffectation as jest.Mock).mockResolvedValue({
        ...mockTrameAffectation,
        ...newAffectation
      });

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles', {
        method: 'POST',
        body: JSON.stringify(newAffectation)
      });
      const response = await POST(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Trame');
      expect(mockHasPermission).toHaveBeenCalledWith('ADMIN_TOTAL', 'trames.create');
      expect(trameAffectationService.createTrameAffectation).toHaveBeenCalledWith(
        newAffectation,
        1
      );
    });

    it('should return 403 for non-admin user', async () => {
      mockVerifyAuthToken.mockResolvedValue({ ...mockUser, role: 'USER' });
      mockHasPermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles', {
        method: 'POST',
        body: JSON.stringify(newAffectation)
      });
      const response = await POST(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Admin access required');
    });

    it('should return 400 for invalid data', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      mockHasPermission.mockReturnValue(true);

      const invalidData = { name: '' }; // Invalid: name too short
      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });
      const response = await POST(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });
  });

  describe('PUT /api/trame-modeles/[trameId]/affectations/[affectationId]', () => {
    const updateData = {
      name: 'Updated Trame',
      isActive: false
    };

    it('should update affectation for authorized user', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockResolvedValue(true);
      (trameAffectationService.updateTrameAffectation as jest.Mock).mockResolvedValue({
        ...mockTrameAffectation,
        ...updateData
      });

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/affectation-1',
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }
      );
      const response = await PUT(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Trame');
      expect(data.isActive).toBe(false);
      expect(trameAffectationService.updateTrameAffectation).toHaveBeenCalledWith(
        'affectation-1',
        updateData,
        1
      );
    });

    it('should return 404 for non-existent affectation', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockResolvedValue(true);
      (trameAffectationService.updateTrameAffectation as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/non-existent',
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }
      );
      const response = await PUT(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Affectation not found');
    });

    it('should return 400 when affectation ID is missing', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles',
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }
      );
      const response = await PUT(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Affectation ID is required');
    });
  });

  describe('DELETE /api/trame-modeles/[trameId]/affectations/[affectationId]', () => {
    it('should delete affectation for admin user', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      mockHasPermission.mockReturnValue(true);
      (trameAffectationService.deleteTrameAffectation as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/affectation-1',
        { method: 'DELETE' }
      );
      const response = await DELETE(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Affectation deleted successfully');
      expect(trameAffectationService.deleteTrameAffectation).toHaveBeenCalledWith(
        'affectation-1',
        1
      );
    });

    it('should return 404 for non-existent affectation', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      mockHasPermission.mockReturnValue(true);
      (trameAffectationService.deleteTrameAffectation as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/non-existent',
        { method: 'DELETE' }
      );
      const response = await DELETE(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Affectation not found');
    });

    it('should return 409 when affectation has assignments', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      mockHasPermission.mockReturnValue(true);
      (trameAffectationService.deleteTrameAffectation as jest.Mock).mockRejectedValue(
        new Error('Cannot delete trame with existing assignments')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/affectation-1',
        { method: 'DELETE' }
      );
      const response = await DELETE(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Cannot delete trame with existing assignments');
    });

    it('should return 403 for non-admin user', async () => {
      mockVerifyAuthToken.mockResolvedValue({ ...mockUser, role: 'USER' });
      mockHasPermission.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/trame-modeles/123/affectations-individuelles/affectation-1',
        { method: 'DELETE' }
      );
      const response = await DELETE(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Admin access required');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockVerifyAuthToken.mockResolvedValue(mockUser);
      (trameAffectationService.checkPermission as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      const request = new NextRequest('http://localhost:3000/api/trame-modeles/123/affectations-individuelles');
      const response = await GET(request, { params: { trameModeleId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});