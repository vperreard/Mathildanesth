import { jest } from '@jest/globals';
import { Session } from 'next-auth';
import { GetSessionParams } from 'next-auth/react';

export const getSession = jest.fn<(params?: GetSessionParams) => Promise<Session | null>>();

export const useSession = jest.fn(() => ({ data: null, status: 'unauthenticated' }));
export const signIn = jest.fn();
export const signOut = jest.fn(); 