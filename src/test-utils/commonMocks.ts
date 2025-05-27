import { jest } from '@jest/globals';
import React from 'react';

// Mock pour les contextes communs
export const mockAuthContext = {
  user: {
    id: 1,
    nom: 'Test',
    prenom: 'User',
    email: 'test@example.com',
    role: 'USER',
    professionalRole: 'MAR' as const,
    actif: true,
    login: 'testuser',
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refetchUser: jest.fn(),
};

export const mockSidebarContext = {
  isSidebarOpen: false,
  setSidebarOpen: jest.fn(),
};

// Mock pour les hooks communs
export const mockUseRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
});

export const mockUsePathname = () => '/';

export const mockUseSearchParams = () => new URLSearchParams();

// Mock pour les services communs
export const createMockWebSocketHook = (defaultValues = {}) => {
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    refresh: jest.fn(),
    isConnected: true,
    socket: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    ...defaultValues,
  };
};

// Helper pour wrapper les composants avec les providers nécessaires
export const createTestWrapper = (providers: React.FC<{ children: React.ReactNode }>[] = []) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return providers.reduce(
      (acc, Provider) => React.createElement(Provider, {}, acc),
      React.createElement(React.Fragment, {}, children)
    );
  };
  return Wrapper;
};

// Mock pour les réponses API communes
export const mockApiResponses = {
  auth: {
    me: {
      authenticated: true,
      user: mockAuthContext.user,
    },
    login: {
      token: 'mock-token',
      user: mockAuthContext.user,
    },
  },
  leaves: {
    balance: {
      userId: 1,
      year: new Date().getFullYear(),
      initialAllowance: 25,
      additionalAllowance: 5,
      used: 10,
      pending: 2,
      remaining: 18,
      detailsByType: {
        ANNUAL: { used: 8, pending: 1 },
        RECOVERY: { used: 2, pending: 1 },
      },
      lastUpdated: new Date().toISOString(),
    },
  },
};