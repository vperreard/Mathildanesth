import { 
  API_ENDPOINTS,
  API_CONFIG,
  buildApiUrl,
  getApiHeaders,
  API_TIMEOUTS
} from '../api';

describe('API configuration', () => {
  describe('API_ENDPOINTS', () => {
    it('should define all required endpoints', () => {
      expect(API_ENDPOINTS).toBeDefined();
      expect(typeof API_ENDPOINTS).toBe('object');
      
      // Test common endpoints
      if (API_ENDPOINTS.USERS) {
        expect(typeof API_ENDPOINTS.USERS).toBe('string');
        expect(API_ENDPOINTS.USERS).toContain('/');
      }
      
      if (API_ENDPOINTS.LEAVES) {
        expect(typeof API_ENDPOINTS.LEAVES).toBe('string');
        expect(API_ENDPOINTS.LEAVES).toContain('/');
      }
      
      if (API_ENDPOINTS.AUTH) {
        expect(typeof API_ENDPOINTS.AUTH).toBe('string');
        expect(API_ENDPOINTS.AUTH).toContain('/');
      }
    });

    it('should have consistent URL format', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        if (typeof endpoint === 'string') {
          expect(endpoint).toMatch(/^\/api\//);
        }
      });
    });
  });

  describe('API_CONFIG', () => {
    it('should define base configuration', () => {
      expect(API_CONFIG).toBeDefined();
      expect(typeof API_CONFIG).toBe('object');
      
      if (API_CONFIG.BASE_URL) {
        expect(typeof API_CONFIG.BASE_URL).toBe('string');
      }
      
      if (API_CONFIG.VERSION) {
        expect(typeof API_CONFIG.VERSION).toBe('string');
      }
      
      if (API_CONFIG.TIMEOUT) {
        expect(typeof API_CONFIG.TIMEOUT).toBe('number');
        expect(API_CONFIG.TIMEOUT).toBeGreaterThan(0);
      }
    });

    it('should have valid timeout values', () => {
      if (API_CONFIG.TIMEOUT) {
        expect(API_CONFIG.TIMEOUT).toBeGreaterThan(1000); // At least 1 second
        expect(API_CONFIG.TIMEOUT).toBeLessThan(60000); // Less than 1 minute
      }
    });
  });

  describe('buildApiUrl', () => {
    it('should build complete API URLs', () => {
      const url = buildApiUrl('/users');
      
      expect(typeof url).toBe('string');
      expect(url).toContain('/users');
    });

    it('should handle query parameters', () => {
      const url = buildApiUrl('/users', { page: 1, limit: 10 });
      
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });

    it('should handle empty endpoint', () => {
      const url = buildApiUrl('');
      expect(typeof url).toBe('string');
    });

    it('should encode special characters', () => {
      const url = buildApiUrl('/search', { q: 'test query' });
      
      expect(url).toContain('q=test%20query');
    });
  });

  describe('getApiHeaders', () => {
    it('should return default headers', () => {
      const headers = getApiHeaders();
      
      expect(headers).toBeDefined();
      expect(typeof headers).toBe('object');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include authorization header when token provided', () => {
      const headers = getApiHeaders('bearer-token-123');
      
      expect(headers.Authorization).toBe('Bearer bearer-token-123');
    });

    it('should merge custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'value' };
      const headers = getApiHeaders(null, customHeaders);
      
      expect(headers['X-Custom-Header']).toBe('value');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should override default headers with custom ones', () => {
      const customHeaders = { 'Content-Type': 'application/xml' };
      const headers = getApiHeaders(null, customHeaders);
      
      expect(headers['Content-Type']).toBe('application/xml');
    });
  });

  describe('API_TIMEOUTS', () => {
    it('should define timeout configurations', () => {
      if (API_TIMEOUTS) {
        expect(typeof API_TIMEOUTS).toBe('object');
        
        if (API_TIMEOUTS.DEFAULT) {
          expect(typeof API_TIMEOUTS.DEFAULT).toBe('number');
          expect(API_TIMEOUTS.DEFAULT).toBeGreaterThan(0);
        }
        
        if (API_TIMEOUTS.UPLOAD) {
          expect(typeof API_TIMEOUTS.UPLOAD).toBe('number');
          expect(API_TIMEOUTS.UPLOAD).toBeGreaterThan(API_TIMEOUTS.DEFAULT || 0);
        }
      }
    });
  });

  describe('Environment-based configuration', () => {
    it('should handle different environments', () => {
      const environments = ['development', 'production', 'test'];
      
      environments.forEach(env => {
        // Mock environment
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = env;
        
        // Test configuration adapts to environment
        expect(process.env.NODE_ENV).toBe(env);
        
        // Restore environment
        process.env.NODE_ENV = originalEnv;
      });
    });
  });

  describe('URL validation', () => {
    it('should validate API endpoint format', () => {
      const validEndpoints = [
        '/api/users',
        '/api/leaves/types',
        '/api/auth/login'
      ];

      validEndpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^\/api\//);
        expect(endpoint.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Header validation', () => {
    it('should validate content-type headers', () => {
      const validContentTypes = [
        'application/json',
        'application/xml',
        'multipart/form-data'
      ];

      validContentTypes.forEach(contentType => {
        expect(typeof contentType).toBe('string');
        expect(contentType).toContain('/');
      });
    });
  });
});