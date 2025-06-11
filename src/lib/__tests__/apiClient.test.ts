// Mock modules before imports
jest.mock('axios');
// Remove next-auth mock as it's not used

import axios from 'axios';
// getSession remplacé - utiliser getServerSession côté serveur ou useAuth côté client;

// Helper to access axios mock
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Setup axios mock before importing apiClient
const mockInterceptors = {
  request: {
    use: jest.fn(),
  },
  response: {
    use: jest.fn(),
  },
};

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: mockInterceptors,
};

(axios.create as jest.Mock) = jest.fn(() => mockAxiosInstance);

// Import apiClient after mocking
import apiClient, { api } from '../apiClient';

describe('apiClient', () => {
  let windowLocationSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
    windowLocationSpy = jest.fn();
    Object.defineProperty(window.location, 'href', {
      set: windowLocationSpy,
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('axios instance configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
    });
  });

  describe('request interceptor', () => {
    let requestInterceptor: (config: any) => any;
    let errorInterceptor: (error: any) => any;

    beforeEach(() => {
      // Get the request interceptor handlers
      const requestUseCall = mockInterceptors.request.use.mock.calls[0];
      requestInterceptor = requestUseCall[0];
      errorInterceptor = requestUseCall[1];
    });

    it('should add authorization header when session has accessToken', async () => {
      const mockSession = { accessToken: 'test-token-123' };
      (getSession as jest.Mock).mockResolvedValue(mockSession);

      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(getSession).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('should not add authorization header when no session', async () => {
      (getSession as jest.Mock).mockResolvedValue(null);

      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(getSession).toHaveBeenCalled();
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should handle getSession errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (getSession as jest.Mock).mockRejectedValue(new Error('Session error'));

      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Impossible d'obtenir la session pour la requête API:",
        expect.any(Error)
      );
      expect(result).toBe(config);

      consoleWarnSpy.mockRestore();
    });

    it('should reject request interceptor errors', async () => {
      const error = new Error('Request error');
      const result = errorInterceptor(error);

      await expect(result).rejects.toBe(error);
    });
  });

  describe('response interceptor', () => {
    let responseInterceptor: (response: any) => any;
    let errorInterceptor: (error: any) => any;

    beforeEach(() => {
      // Get the response interceptor handlers
      const responseUseCall = mockInterceptors.response.use.mock.calls[0];
      responseInterceptor = responseUseCall[0];
      errorInterceptor = responseUseCall[1];
    });

    it('should pass through successful responses', () => {
      const response = { data: 'test', status: 200 };
      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });

    it('should redirect to login on 401 error', async () => {
      const error = {
        response: { status: 401 },
      };

      await expect(errorInterceptor(error)).rejects.toBe(error);
      expect(windowLocationSpy).toHaveBeenCalledWith('/auth/connexion');
    });

    it('should reject non-401 errors', async () => {
      const error = {
        response: { status: 500 },
      };

      await expect(errorInterceptor(error)).rejects.toBe(error);
      expect(windowLocationSpy).not.toHaveBeenCalled();
    });

    it('should handle errors without response', async () => {
      const error = new Error('Network error');

      await expect(errorInterceptor(error)).rejects.toBe(error);
      expect(windowLocationSpy).not.toHaveBeenCalled();
    });
  });

  describe('api helper methods', () => {
    beforeEach(() => {
      // Setup successful responses
      mockAxiosInstance.get.mockResolvedValue({ data: 'get data' });
      mockAxiosInstance.post.mockResolvedValue({ data: 'post data' });
      mockAxiosInstance.put.mockResolvedValue({ data: 'put data' });
      mockAxiosInstance.patch.mockResolvedValue({ data: 'patch data' });
      mockAxiosInstance.delete.mockResolvedValue({ data: 'delete data' });
    });

    it('should call get method correctly', async () => {
      const config = { params: { id: 1 } };
      const result = await api.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
      expect(result.data).toBe('get data');
    });

    it('should call post method correctly', async () => {
      const data = { name: 'test' };
      const config = { headers: { 'X-Custom': 'header' } };
      const result = await api.post('/test', data, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, config);
      expect(result.data).toBe('post data');
    });

    it('should call put method correctly', async () => {
      const data = { name: 'updated' };
      const config = { timeout: 5000 };
      const result = await api.put('/test/1', data, config);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', data, config);
      expect(result.data).toBe('put data');
    });

    it('should call patch method correctly', async () => {
      const data = { field: 'value' };
      const result = await api.patch('/test/1', data);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', data, undefined);
      expect(result.data).toBe('patch data');
    });

    it('should call delete method correctly', async () => {
      const config = { data: { reason: 'test' } };
      const result = await api.delete('/test/1', config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', config);
      expect(result.data).toBe('delete data');
    });
  });

  describe('error handling', () => {
    it('should propagate axios errors', async () => {
      const error = new Error('Axios error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(api.get('/test')).rejects.toBe(error);
    });
  });
});
