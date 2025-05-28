import { apiClient, ApiResponse, createApiInstance } from '../apiClient';

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockClear();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } };
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await apiClient.get('/api/users/1');
      
      expect(result).toEqual(mockResponse);
      expect(mockedFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
    });

    it('should handle query parameters', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response);

      await apiClient.get('/api/users', { page: 1, limit: 10 });
      
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/users?page=1&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'John', email: 'john@example.com' };
      const responseData = { id: 1, ...requestData };
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData
      } as Response);

      const result = await apiClient.post('/api/users', requestData);
      
      expect(result).toEqual(responseData);
      expect(mockedFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(requestData)
      });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'John Updated' };
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...updateData })
      } as Response);

      const result = await apiClient.put('/api/users/1', updateData);
      
      expect(result).toEqual({ id: 1, ...updateData });
      expect(mockedFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(updateData)
      });
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({})
      } as Response);

      const result = await apiClient.delete('/api/users/1');
      
      expect(result).toEqual({});
      expect(mockedFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'User not found' })
      } as Response);

      await expect(apiClient.get('/api/users/999')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/api/users')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      await expect(apiClient.get('/api/users')).rejects.toThrow();
    });
  });

  describe('Headers and authentication', () => {
    it('should include authorization header when token provided', async () => {
      const token = 'bearer-token-123';
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response);

      await apiClient.get('/api/protected', {}, { 
        Authorization: `Bearer ${token}` 
      });
      
      expect(mockedFetch).toHaveBeenCalledWith('/api/protected', {
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${token}`
        })
      });
    });

    it('should merge custom headers with defaults', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      await apiClient.get('/api/test', {}, {
        'Custom-Header': 'value',
        'Content-Type': 'application/xml' // Should override default
      });
      
      expect(mockedFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'Custom-Header': 'value',
          'Content-Type': 'application/xml'
        })
      });
    });
  });

  describe('createApiInstance', () => {
    it('should create instance with custom base URL', async () => {
      const customApi = createApiInstance('https://api.example.com');
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response);

      await customApi.get('/users');
      
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('should create instance with custom headers', async () => {
      const customApi = createApiInstance('', {
        'X-API-Key': 'secret-key'
      });
      
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      await customApi.get('/data');
      
      expect(mockedFetch).toHaveBeenCalledWith('/data', {
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-Key': 'secret-key'
        })
      });
    });
  });

  describe('Response types', () => {
    it('should handle ApiResponse type', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
        status: 200
      };
      
      expect(response.success).toBe(true);
      expect(response.data?.id).toBe(1);
      expect(response.status).toBe(200);
    });

    it('should handle error response type', () => {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Something went wrong',
        status: 500
      };
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.data).toBeUndefined();
    });
  });
});