/**
 * Common mocks pour résoudre les problèmes d'imports et modules manquants
 * Centralise tous les mocks récurrents utilisés dans les tests
 */

import React from 'react';

// Mock des modules Next.js critiques
export const mockNextModules = () => {
  // Mock next/dynamic
  jest.mock('next/dynamic', () => (componentImport: any) => {
    const DynamicComponent = (props: any) => {
      const Component = componentImport;
      return React.createElement('div', { 'data-testid': 'dynamic-component' }, 'Dynamic Component');
    };
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  });

  // Mock next/head
  jest.mock('next/head', () => {
    return function Head({ children }: { children: React.ReactNode }) {
      return React.createElement('div', { 'data-testid': 'head' }, children);
    };
  });

  // Mock next/link
  jest.mock('next/link', () => {
    return function Link({ children, href, ...props }: any) {
      return React.createElement('a', { href, ...props }, children);
    };
  });

  // Mock next/script
  jest.mock('next/script', () => {
    return function Script(props: any) {
      return React.createElement('script', props);
    };
  });
};

// Mock des modules de crypto et sécurité
export const mockCryptoModules = () => {
  // Mock bcryptjs/bcrypt
  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue('salt'),
  }));

  // Mock jose
  jest.mock('jose', () => ({
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('mock-jwt-token'),
    })),
    jwtVerify: jest.fn().mockResolvedValue({
      payload: { userId: 1, email: 'test@example.com' },
    }),
    importJWK: jest.fn().mockResolvedValue('mock-key'),
  }));

  // Mock crypto
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn().mockReturnValue('mock-uuid'),
      getRandomValues: jest.fn().mockReturnValue(new Uint8Array(32)),
    },
  });
};

// Mock des modules de validation
export const mockValidationModules = () => {
  // Mock zod
  jest.mock('zod', () => ({
    z: {
      string: jest.fn().mockReturnValue({
        min: jest.fn().mockReturnThis(),
        email: jest.fn().mockReturnThis(),
        optional: jest.fn().mockReturnThis(),
      }),
      object: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation((data) => data),
        safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
      }),
      union: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation((data) => data),
      }),
      enum: jest.fn().mockReturnValue({
        parse: jest.fn().mockImplementation((data) => data),
      }),
    },
  }));
};

// Mock des modules d'email
export const mockEmailModules = () => {
  // Mock nodemailer
  jest.mock('nodemailer', () => ({
    createTransporter: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    }),
  }));

  // Mock @sendgrid/mail
  jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
  }));
};

// Mock des modules d'upload/fichiers
export const mockFileModules = () => {
  // Mock multer
  jest.mock('multer', () => ({
    diskStorage: jest.fn().mockReturnValue({}),
    memoryStorage: jest.fn().mockReturnValue({}),
  }));

  // Mock formidable
  jest.mock('formidable', () => ({
    IncomingForm: jest.fn().mockImplementation(() => ({
      parse: jest.fn().mockImplementation((req, callback) => {
        callback(null, {}, {});
      }),
    })),
  }));
};

// Mock des modules de cache et database
export const mockDatabaseModules = () => {
  // Mock redis
  jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
    }),
  }));
};

// Mock des modules d'analytics et monitoring
export const mockAnalyticsModules = () => {
  // Mock @vercel/analytics
  jest.mock('@vercel/analytics', () => ({
    track: jest.fn(),
    Analytics: jest.fn().mockImplementation(() => null),
  }));

  // Mock posthog-js
  jest.mock('posthog-js', () => ({
    init: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn(),
  }));

  // Mock @sentry/nextjs
  jest.mock('@sentry/nextjs', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    configureScope: jest.fn(),
  }));
};

// Mock des modules UI et composants externes
export const mockUIModules = () => {
  // Mock framer-motion
  jest.mock('framer-motion', () => ({
    motion: {
      div: jest.fn().mockImplementation(({ children, ...props }) => 
        React.createElement('div', props, children)
      ),
      span: jest.fn().mockImplementation(({ children, ...props }) => 
        React.createElement('span', props, children)
      ),
      button: jest.fn().mockImplementation(({ children, ...props }) => 
        React.createElement('button', props, children)
      ),
    },
    AnimatePresence: jest.fn().mockImplementation(({ children }) => children),
    useAnimation: jest.fn().mockReturnValue({}),
  }));

  // Mock react-hot-toast
  jest.mock('react-hot-toast', () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
      dismiss: jest.fn(),
    },
    Toaster: jest.fn().mockImplementation(() => 
      React.createElement('div', { 'data-testid': 'toaster' })
    ),
  }));

  // Mock react-toastify
  jest.mock('react-toastify', () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    ToastContainer: jest.fn().mockImplementation(() => 
      React.createElement('div', { 'data-testid': 'toast-container' })
    ),
  }));
};

// Mock des WebSockets et temps réel
export const mockWebSocketModules = () => {
  // Mock socket.io-client
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'test-socket-id',
  };

  jest.mock('socket.io-client', () => ({
    __esModule: true,
    default: jest.fn(() => mockSocket),
    io: jest.fn(() => mockSocket),
  }));

  return mockSocket;
};

// Mock des modules d'API externes
export const mockExternalAPIModules = () => {
  // Mock axios
  jest.mock('axios', () => ({
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }));
};

// Setup de tous les mocks communs
export const setupAllCommonMocks = () => {
  mockNextModules();
  mockCryptoModules();
  mockValidationModules();
  mockEmailModules();
  mockFileModules();
  mockDatabaseModules();
  mockAnalyticsModules();
  mockUIModules();
  mockWebSocketModules();
  mockExternalAPIModules();
};