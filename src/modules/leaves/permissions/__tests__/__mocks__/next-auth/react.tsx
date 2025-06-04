import { jest } from '@jest/globals';
import { Session } from 'next-auth';
import { GetSessionParams } from 'next-auth/react';

export const getSession = jest.fn<(params?: GetSessionParams) => Promise<Session | null>>();

export const useSession = jest.fn(() => ({ data: null, status: 'unauthenticated' }));
export const signIn = jest.fn();
export const signOut = jest.fn();

// Basic test to satisfy Jest requirement
describe('NextAuth React Mock', () => {
  it('should provide mock functions', () => {
    expect(typeof getSession).toBe('function');
    expect(typeof useSession).toBe('function');
    expect(typeof signIn).toBe('function');
    expect(typeof signOut).toBe('function');
  });
}); 