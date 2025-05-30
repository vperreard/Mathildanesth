import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationPreferences } from '../useNotificationPreferences';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { createAuthHeaders } from '@/lib/auth-helpers';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

// Mock des modules externes
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

jest.mock('@/lib/auth-helpers', () => ({
    createAuthHeaders: jest.fn(),
}));

const mockSession = {
    user: { id: '123', name: 'Test User', email: 'test@example.com' },
    expires: '2024-12-31T23:59:59.999Z',
};

describe('useNotificationPreferences', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup fetch mock with default successful response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                preferences: {
                    emailNotifications: true,
                    smsNotifications: false,
                    quietHours: { start: '22:00', end: '08:00' }
                }
            }),
        });
        
        (useSession as jest.Mock).mockReturnValue({
            data: mockSession,
            status: 'authenticated',
        });
        (createAuthHeaders as jest.Mock).mockReturnValue({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
        });
    });

    it('devrait initialiser avec des valeurs par défaut', () => {
        const { result } = renderHook(() => useNotificationPreferences());

        expect(result.current.preferences).toBeNull();
        expect(result.current.error).toBeNull();
        expect(typeof result.current.fetchPreferences).toBe('function');
        expect(typeof result.current.updatePreferences).toBe('function');
    });

    it('devrait gérer la session non authentifiée', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        const { result } = renderHook(() => useNotificationPreferences());

        act(() => {
            result.current.fetchPreferences();
        });

        expect(result.current.error).toBe('Vous devez être connecté pour accéder à vos préférences de notifications');
    });

    it('devrait avoir toutes les fonctions requises', () => {
        const { result } = renderHook(() => useNotificationPreferences());

        expect(typeof result.current.fetchPreferences).toBe('function');
        expect(typeof result.current.updatePreferences).toBe('function');
        expect(typeof result.current.resetToDefaults).toBe('function');
        expect(typeof result.current.disableAllNotifications).toBe('function');
        expect(typeof result.current.updateQuietHours).toBe('function');
    });
}); 