import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('useAuth', () => {
  const mockPush = jest.fn();
  const mockSession = {
    user: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should return unauthenticated state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login successfully', async () => {
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token' }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password');
        expect(success).toBe(true);
      });

      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password',
        redirect: false,
      });
    });

    it('should handle login failure', async () => {
      (signIn as jest.Mock).mockResolvedValue({ ok: false, error: 'Invalid credentials' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'wrong-password');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('should return authenticated state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle logout', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(signOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/connexion');
    });

    it('should check permissions correctly', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole('USER')).toBe(true);
      expect(result.current.hasRole('ADMIN')).toBe(false);
      expect(result.current.hasAnyRole(['USER', 'ADMIN'])).toBe(true);
      expect(result.current.hasAnyRole(['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });
  });

  describe('when loading', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });
    });

    it('should return loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should update user profile successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSession.user, name: 'Updated Name' }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.updateProfile({ name: 'Updated Name' });
        expect(success).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
    });

    it('should handle profile update failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.updateProfile({ name: 'Updated Name' });
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('checkSession', () => {
    it('should verify session validity', async () => {
      const { useSession } = require('next-auth/react');
      const mockUpdate = jest.fn();
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: mockUpdate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const isValid = await result.current.checkSession();
        expect(isValid).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle invalid session', async () => {
      const { useSession } = require('next-auth/react');
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const isValid = await result.current.checkSession();
        expect(isValid).toBe(false);
      });

      expect(signOut).toHaveBeenCalled();
    });
  });
});