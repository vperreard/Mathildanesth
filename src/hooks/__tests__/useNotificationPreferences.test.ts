import { renderHook, act } from '@testing-library/react-hooks';
import { useNotificationPreferences } from '../useNotificationPreferences';
import { toast } from 'react-toastify';

// Mock des modules externes
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('useNotificationPreferences', () => {
    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock global fetch
        global.fetch = jest.fn();
    });

    it('devrait récupérer les préférences avec succès', async () => {
        const mockPreferences = {
            id: '1',
            userId: 123,
            assignmentReminders: true,
            assignmentSwapRequests: true,
            assignmentSwapResponses: true,
            assignmentSwapAdminActions: true,
            contextualMessages: true,
            mentionsInMessages: true,
            planningUpdates: true,
            leaveRequestStatusChanges: true,
            openShifts: false,
            teamPlanningPublished: true,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            quietHoursDays: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Mock de fetch pour la récupération
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPreferences,
        });

        const { result, waitForNextUpdate } = renderHook(() => useNotificationPreferences());

        // Initialement, les préférences devraient être null et isLoading devrait être true
        expect(result.current.preferences).toBeNull();
        expect(result.current.isLoading).toBe(true);

        // Attendre la fin de la requête
        await waitForNextUpdate();

        // Vérifier que les préférences ont été chargées correctement
        expect(result.current.preferences).toEqual(mockPreferences);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();

        // Vérifier que fetch a été appelé avec les bons arguments
        expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences');
    });

    it('devrait gérer les erreurs lors de la récupération des préférences', async () => {
        const errorMessage = 'Erreur de serveur';

        // Mock de fetch pour simuler une erreur
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: errorMessage }),
        });

        const { result, waitForNextUpdate } = renderHook(() => useNotificationPreferences());

        // Attendre la fin de la requête
        await waitForNextUpdate();

        // Vérifier que l'erreur a été correctement gérée
        expect(result.current.preferences).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });

    it('devrait mettre à jour les préférences avec succès', async () => {
        const initialPreferences = {
            id: '1',
            userId: 123,
            assignmentReminders: true,
            assignmentSwapRequests: true,
            // ... autres propriétés
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedPreferences = {
            ...initialPreferences,
            assignmentReminders: false,
            updatedAt: new Date().toISOString(),
        };

        // Mock de fetch pour la récupération initiale
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => initialPreferences,
        });

        // Mock de fetch pour la mise à jour
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => updatedPreferences,
        });

        const { result, waitForNextUpdate } = renderHook(() => useNotificationPreferences());

        // Attendre que les préférences initiales soient chargées
        await waitForNextUpdate();

        // Mettre à jour les préférences
        act(() => {
            result.current.updatePreferences({ assignmentReminders: false });
        });

        // Vérifier que isLoading est true pendant la mise à jour
        expect(result.current.isLoading).toBe(true);

        // Attendre la fin de la mise à jour
        await waitForNextUpdate();

        // Vérifier que les préférences ont été mises à jour
        expect(result.current.preferences).toEqual(updatedPreferences);
        expect(result.current.isLoading).toBe(false);
        expect(toast.success).toHaveBeenCalledWith('Préférences de notifications mises à jour');

        // Vérifier que fetch a été appelé avec les bons arguments
        expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assignmentReminders: false })
        });
    });

    it('devrait gérer les erreurs lors de la mise à jour des préférences', async () => {
        const initialPreferences = {
            id: '1',
            userId: 123,
            // ... propriétés
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const errorMessage = 'Erreur lors de la mise à jour';

        // Mock de fetch pour la récupération initiale
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => initialPreferences,
        });

        // Mock de fetch pour simuler une erreur lors de la mise à jour
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: errorMessage }),
        });

        const { result, waitForNextUpdate } = renderHook(() => useNotificationPreferences());

        // Attendre que les préférences initiales soient chargées
        await waitForNextUpdate();

        // Tenter de mettre à jour les préférences
        act(() => {
            result.current.updatePreferences({ assignmentReminders: false });
        });

        // Attendre la fin de la tentative de mise à jour
        await waitForNextUpdate();

        // Vérifier que l'erreur a été correctement gérée
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
        expect(toast.error).toHaveBeenCalledWith(`Erreur: ${errorMessage}`);
        expect(result.current.preferences).toEqual(initialPreferences); // Les préférences ne devraient pas changer
    });

    it('devrait réinitialiser les préférences aux valeurs par défaut', async () => {
        const initialPreferences = {
            id: '1',
            userId: 123,
            // ... propriétés avec des valeurs personnalisées
            assignmentReminders: false,
            quietHoursEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const defaultPreferences = {
            id: '1',
            userId: 123,
            assignmentReminders: true,
            assignmentSwapRequests: true,
            assignmentSwapResponses: true,
            assignmentSwapAdminActions: true,
            contextualMessages: true,
            mentionsInMessages: true,
            planningUpdates: true,
            leaveRequestStatusChanges: true,
            openShifts: false,
            teamPlanningPublished: true,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            quietHoursDays: null,
            createdAt: initialPreferences.createdAt,
            updatedAt: new Date().toISOString(),
        };

        // Mock de fetch pour la récupération initiale
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => initialPreferences,
        });

        // Mock de fetch pour la réinitialisation
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => defaultPreferences,
        });

        const { result, waitForNextUpdate } = renderHook(() => useNotificationPreferences());

        // Attendre que les préférences initiales soient chargées
        await waitForNextUpdate();

        // Réinitialiser les préférences
        act(() => {
            result.current.resetToDefaults();
        });

        // Attendre la fin de la réinitialisation
        await waitForNextUpdate();

        // Vérifier que les préférences ont été réinitialisées
        expect(result.current.preferences).toEqual(defaultPreferences);
        expect(toast.success).toHaveBeenCalledWith('Préférences de notifications mises à jour');
    });
}); 