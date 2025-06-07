// Mock for jose library
let mockPayloadOverride = null;

// Reset function for tests
const resetMock = () => {
  mockPayloadOverride = null;
};

module.exports = {
  __resetMock: resetMock,
  SignJWT: jest.fn().mockImplementation((payload) => {
    mockPayloadOverride = payload;
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      setIssuer: jest.fn().mockReturnThis(),
      setAudience: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('mock.jwt.token'),
    };
  }),
  jwtVerify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'invalid.token' || token === 'invalid.token.here') {
      throw new Error('Invalid token');
    }
    if (token === 'expired.token') {
      const error = new Error('Token expired');
      error.code = 'ERR_JWT_EXPIRED';
      throw error;
    }
    
    // Check for expired token in the token string
    if (token.includes('expir')) {
      throw new Error('Token expired');
    }
    
    // If we have a payload override from SignJWT, use it
    if (mockPayloadOverride && token === 'mock.jwt.token') {
      return Promise.resolve({
        payload: {
          ...mockPayloadOverride,
          iss: 'mathildanesth',
          aud: 'mathildanesth-client',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }
    
    // Cookie user token
    if (token.includes('cookieuser')) {
      return Promise.resolve({
        payload: {
          userId: 1,
          login: 'cookieuser',
          role: 'USER',
          iss: 'mathildanesth',
          aud: 'mathildanesth-client',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }
    
    // Default return
    return Promise.resolve({
      payload: {
        userId: 1,
        login: 'testuser',
        role: 'USER',
        iss: 'mathildanesth',
        aud: 'mathildanesth-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    });
  }),
  decodeJwt: jest.fn().mockImplementation((token) => {
    // If we have a payload override and it's our token, use it
    if (mockPayloadOverride && token === 'mock.jwt.token') {
      return {
        ...mockPayloadOverride,
        iss: 'mathildanesth',
        aud: 'mathildanesth-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    
    // Default decode
    return {
      userId: 1,
      login: 'testuser',
      role: 'USER',
      iss: 'mathildanesth',
      aud: 'mathildanesth-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }),
  errors: {
    JWTExpired: class JWTExpired extends Error {
      constructor() {
        super('Token expired');
        this.code = 'ERR_JWT_EXPIRED';
      }
    },
  },
};