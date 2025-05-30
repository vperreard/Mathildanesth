// Mock for jose JWT library
export const SignJWT = class MockSignJWT {
  constructor(payload) {
    this.payload = payload;
    this.options = {};
  }
  
  setProtectedHeader(header) {
    this.header = header;
    return this;
  }
  
  setIssuedAt() {
    return this;
  }
  
  setExpirationTime(time) {
    return this;
  }
  
  setIssuer(issuer) {
    return this;
  }
  
  setAudience(audience) {
    return this;
  }
  
  async sign(secret) {
    return 'mock.jwt.token';
  }
};

export const jwtVerify = jest.fn().mockResolvedValue({
  payload: {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  protectedHeader: {
    alg: 'HS256',
  },
});

export const jwtDecrypt = jest.fn().mockResolvedValue({
  payload: {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'USER',
  },
});

export const EncryptJWT = class MockEncryptJWT {
  constructor(payload) {
    this.payload = payload;
  }
  
  setProtectedHeader(header) {
    return this;
  }
  
  setIssuedAt() {
    return this;
  }
  
  setExpirationTime(time) {
    return this;
  }
  
  async encrypt(secret) {
    return 'mock.encrypted.token';
  }
};

export const errors = {
  JWTExpired: class JWTExpired extends Error {
    constructor(message) {
      super(message);
      this.name = 'JWTExpired';
    }
  },
  JWTInvalid: class JWTInvalid extends Error {
    constructor(message) {
      super(message);
      this.name = 'JWTInvalid';
    }
  },
};