import { 
  buildApiUrl, 
  handleApiError, 
  createApiResponse,
  validateApiResponse,
  formatApiDate
} from '../apiUtils';

describe('apiUtils', () => {
  describe('buildApiUrl', () => {
    it('should build basic URL', () => {
      const result = buildApiUrl('/test');
      expect(result).toContain('/test');
    });

    it('should handle base URL', () => {
      const result = buildApiUrl('/users', 'http://localhost:3000');
      expect(result).toBe('http://localhost:3000/users');
    });

    it('should handle query parameters', () => {
      const result = buildApiUrl('/users', undefined, { page: 1, limit: 10 });
      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
    });
  });

  describe('handleApiError', () => {
    it('should handle fetch errors', () => {
      const error = new Error('Network error');
      const result = handleApiError(error);
      
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle HTTP errors', () => {
      const response = { status: 404, statusText: 'Not Found' };
      const result = handleApiError(response);
      
      expect(result).toHaveProperty('success', false);
    });
  });

  describe('createApiResponse', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'test' };
      const result = createApiResponse(data);
      
      expect(result).toEqual({
        success: true,
        data,
        status: 200
      });
    });

    it('should create error response', () => {
      const result = createApiResponse(null, 'Error message', 400);
      
      expect(result).toEqual({
        success: false,
        error: 'Error message',
        status: 400
      });
    });
  });

  describe('validateApiResponse', () => {
    it('should validate successful response', () => {
      const response = { success: true, data: { id: 1 } };
      const result = validateApiResponse(response);
      
      expect(result).toBe(true);
    });

    it('should validate error response', () => {
      const response = { success: false, error: 'Error' };
      const result = validateApiResponse(response);
      
      expect(result).toBe(true);
    });

    it('should reject invalid response', () => {
      const response = { invalid: true };
      const result = validateApiResponse(response);
      
      expect(result).toBe(false);
    });
  });

  describe('formatApiDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = formatApiDate(date);
      
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle string date', () => {
      const result = formatApiDate('2024-01-01');
      
      expect(typeof result).toBe('string');
    });

    it('should handle null/undefined', () => {
      expect(formatApiDate(null)).toBeNull();
      expect(formatApiDate(undefined)).toBeUndefined();
    });
  });
});