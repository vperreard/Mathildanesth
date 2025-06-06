import { User, UserRole } from '@/types/user';

/**
 * Utilitaires partagés pour les tests
 */

// Attendre un délai spécifique (utile pour les tests asynchrones)
export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Créer un utilisateur mock pour les tests
export const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    firstName: 'Jean',
    lastName: 'Test',
    email: 'jean.test@hospital.fr',
    role: UserRole.DOCTOR,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides
});

// Simuler l'appel d'un service API
export const mockApiResponse = <T>(data: T, delay = 0) =>
    new Promise<T>(resolve => setTimeout(() => resolve(data), delay));

// Simuler une erreur API
export const mockApiError = (message = 'Une erreur est survenue', status = 500, delay = 0) =>
    new Promise((_, reject) =>
        setTimeout(() => reject({ message, status, ok: false }), delay)
    );

// Tester les propriétés d'un objet
export const expectObjectToHaveProperties = (obj: Record<string, unknown>, properties: string[]) => {
    properties.forEach(prop => {
        expect(obj).toHaveProperty(prop);
    });
};

// Utilitaire pour mocker les événements React
export const createMockEvent = () => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
}); 