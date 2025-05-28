import { 
  parseRequestBody,
  validateRequest,
  extractHeaders,
  buildResponse,
  sanitizeInput
} from '../requestUtils';

// Mock Request/Response pour les tests
const mockRequest = (body: any, headers: Record<string, string> = {}) => ({
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  headers: new Map(Object.entries(headers)),
  method: 'POST',
  url: 'http://localhost:3000/api/test'
});

const mockResponse = () => ({
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
  headers: new Map()
});

describe('requestUtils', () => {
  describe('parseRequestBody', () => {
    it('should parse JSON body', async () => {
      const req = mockRequest({ name: 'test', id: 1 });
      const result = await parseRequestBody(req as any);
      
      expect(result).toEqual({ name: 'test', id: 1 });
    });

    it('should handle empty body', async () => {
      const req = mockRequest(null);
      const result = await parseRequestBody(req as any);
      
      expect(result).toBeNull();
    });

    it('should handle parsing errors', async () => {
      const req = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      
      const result = await parseRequestBody(req as any);
      expect(result).toBeNull();
    });
  });

  describe('validateRequest', () => {
    it('should validate required fields', () => {
      const data = { name: 'test', email: 'test@example.com' };
      const required = ['name', 'email'];
      
      const result = validateRequest(data, required);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing fields', () => {
      const data = { name: 'test' };
      const required = ['name', 'email', 'phone'];
      
      const result = validateRequest(data, required);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: email');
      expect(result.errors).toContain('Missing required field: phone');
    });

    it('should handle validation schema', () => {
      const data = { email: 'invalid-email' };
      const schema = {
        email: (value: string) => value.includes('@') ? null : 'Invalid email format'
      };
      
      const result = validateRequest(data, [], schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });

  describe('extractHeaders', () => {
    it('should extract request headers', () => {
      const req = mockRequest({}, {
        'authorization': 'Bearer token123',
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      });
      
      const result = extractHeaders(req as any);
      expect(result.authorization).toBe('Bearer token123');
      expect(result['content-type']).toBe('application/json');
    });

    it('should handle missing headers', () => {
      const req = mockRequest({});
      const result = extractHeaders(req as any);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('buildResponse', () => {
    it('should build success response', () => {
      const data = { id: 1, name: 'test' };
      const result = buildResponse(data);
      
      expect(result).toEqual({
        success: true,
        data,
        status: 200,
        timestamp: expect.any(String)
      });
    });

    it('should build error response', () => {
      const result = buildResponse(null, 'Error occurred', 400);
      
      expect(result).toEqual({
        success: false,
        error: 'Error occurred',
        status: 400,
        timestamp: expect.any(String)
      });
    });

    it('should include metadata', () => {
      const metadata = { requestId: 'req-123', duration: 150 };
      const result = buildResponse({ test: true }, null, 200, metadata);
      
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should handle object input', () => {
      const input = {
        name: '<b>Test</b>',
        description: 'Safe text',
        nested: { value: '<img src="x" onerror="alert(1)">' }
      };
      
      const result = sanitizeInput(input);
      expect(result.name).not.toContain('<b>');
      expect(result.description).toBe('Safe text');
      expect(result.nested.value).not.toContain('onerror');
    });

    it('should handle array input', () => {
      const input = ['<script>test</script>', 'safe text', '<div>content</div>'];
      const result = sanitizeInput(input) as string[];
      
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe text');
      expect(result[2]).not.toContain('<div>');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null)).toBeNull();
      expect(sanitizeInput(undefined)).toBeUndefined();
      expect(sanitizeInput('')).toBe('');
    });
  });
});