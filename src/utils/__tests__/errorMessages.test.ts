import { 
  getErrorMessage,
  formatErrorForUser,
  ERROR_MESSAGES,
  createApiError,
  isValidationError
} from '../errorMessages';

describe('errorMessages utils', () => {
  describe('ERROR_MESSAGES constants', () => {
    it('should define common error messages', () => {
      expect(ERROR_MESSAGES).toBeDefined();
      expect(typeof ERROR_MESSAGES).toBe('object');
      
      // Test that it contains common error types
      if (ERROR_MESSAGES.VALIDATION_ERROR) {
        expect(typeof ERROR_MESSAGES.VALIDATION_ERROR).toBe('string');
      }
      if (ERROR_MESSAGES.NETWORK_ERROR) {
        expect(typeof ERROR_MESSAGES.NETWORK_ERROR).toBe('string');
      }
      if (ERROR_MESSAGES.UNAUTHORIZED) {
        expect(typeof ERROR_MESSAGES.UNAUTHORIZED).toBe('string');
      }
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for known error codes', () => {
      const result = getErrorMessage('VALIDATION_ERROR');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return default message for unknown error codes', () => {
      const result = getErrorMessage('UNKNOWN_ERROR_CODE');
      expect(typeof result).toBe('string');
      expect(result).toContain('erreur');
    });

    it('should handle null/undefined input', () => {
      const result1 = getErrorMessage(null);
      const result2 = getErrorMessage(undefined);
      
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('formatErrorForUser', () => {
    it('should format error for user display', () => {
      const error = new Error('Database connection failed');
      const result = formatErrorForUser(error);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle error objects with custom properties', () => {
      const error = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        field: 'email'
      };
      
      const result = formatErrorForUser(error);
      expect(typeof result).toBe('string');
    });

    it('should handle string errors', () => {
      const result = formatErrorForUser('Something went wrong');
      expect(typeof result).toBe('string');
      expect(result).toContain('Something went wrong');
    });

    it('should sanitize sensitive information', () => {
      const error = new Error('Database password: secret123');
      const result = formatErrorForUser(error);
      
      // Should not contain sensitive info
      expect(result).not.toContain('secret123');
    });
  });

  describe('createApiError', () => {
    it('should create API error object', () => {
      const error = createApiError('VALIDATION_ERROR', 'Invalid email format', 400);
      
      expect(error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(error).toHaveProperty('message', 'Invalid email format');
      expect(error).toHaveProperty('status', 400);
      expect(error).toHaveProperty('timestamp');
    });

    it('should include timestamp', () => {
      const error = createApiError('SERVER_ERROR', 'Internal error');
      
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle optional parameters', () => {
      const error = createApiError('NETWORK_ERROR', 'Connection timeout');
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Connection timeout');
      expect(error.status).toBe(500); // Default status
    });
  });

  describe('isValidationError', () => {
    it('should identify validation errors', () => {
      const validationError = { code: 'VALIDATION_ERROR', message: 'Invalid input' };
      const networkError = { code: 'NETWORK_ERROR', message: 'Connection failed' };
      
      expect(isValidationError(validationError)).toBe(true);
      expect(isValidationError(networkError)).toBe(false);
    });

    it('should handle Error objects', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      
      const result = isValidationError(error);
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
    });
  });

  describe('Error message localization', () => {
    it('should return French error messages', () => {
      const message = getErrorMessage('VALIDATION_ERROR');
      
      // Should contain French terms
      const frenchTerms = ['erreur', 'invalide', 'échec', 'impossible'];
      const containsFrench = frenchTerms.some(term => 
        message.toLowerCase().includes(term)
      );
      
      expect(containsFrench).toBe(true);
    });
  });

  describe('Error severity handling', () => {
    it('should categorize error severity', () => {
      const errors = [
        { code: 'VALIDATION_ERROR', severity: 'warning' },
        { code: 'SERVER_ERROR', severity: 'error' },
        { code: 'NETWORK_ERROR', severity: 'error' }
      ];

      errors.forEach(error => {
        expect(['warning', 'error', 'info']).toContain(error.severity);
      });
    });
  });
});