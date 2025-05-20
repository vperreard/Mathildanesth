import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';
import { useNotificationsWebSocket } from '@/hooks/useNotificationsWebSocket';

// Mock du hook useNotificationsWebSocket
jest.mock('@/hooks/useNotificationsWebSocket', () => ({
    useNotificationsWebSocket: jest.fn()
}));

// Implémentation d'un mock pour SessionProvider
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({
        data: { user: { id: 1 } },
        status: 'authenticated'
    }))
}));

// Mock formatDistanceToNow pour être déterministe dans les tests
jest.mock('date-fns', () => ({
    ...jest.requireActual('date-fns'),
    formatDistanceToNow: jest.fn(() => 'il y a 5 minutes')
}));

// Configuration par défaut du mock du hook
const mockNotifications = [
    {
        id: '1',
        userId: 1,
        type: 'INFO',
        message: 'Notification de test',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/test-link'
    },
    {
        id: '2',
        userId: 1,
        type: 'SUCCESS',
        message: 'Notification lue',
        isRead: true,
        createdAt: new Date().toISOString()
    }
];

const defaultHookReturnValue = {
    notifications: mockNotifications,
    unreadCount: 1,
    isLoading: false,
    error: null,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    refresh: jest.fn(),
    isConnected: true,
    socket: null,
    connect: jest.fn(),
    disconnect: jest.fn()
};

describe('NotificationBell', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Configuration par défaut pour tous les tests
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue
        });
    });

    test('affiche le compteur de notifications non lues', () => {
        render(<NotificationBell />);

        // Le badge doit être visible avec le bon compteur
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('n\'affiche pas le badge si aucune notification non lue', () => {
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            unreadCount: 0
        });

        render(<NotificationBell />);

        // Le badge ne doit pas être visible
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('ouvre et ferme le panneau de notifications au clic', async () => {
        render(<NotificationBell />);

        // Le panneau est initialement fermé
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Le panneau doit être ouvert avec le titre
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Vérifier que les notifications sont affichées
        expect(screen.getByText('Notification de test')).toBeInTheDocument();
        expect(screen.getByText('Notification lue')).toBeInTheDocument();

        // Fermer le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Le panneau doit être fermé
        await waitFor(() => {
            expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
        });
    });

    test('affiche un message quand il n\'y a pas de notifications', () => {
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            notifications: [],
            unreadCount: 0
        });

        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Le message d'absence de notifications doit être visible
        expect(screen.getByText('Aucune notification pour le moment')).toBeInTheDocument();
    });

    test('affiche un indicateur de chargement', () => {
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            isLoading: true
        });

        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // L'indicateur de chargement doit être visible
        expect(screen.getByText('Chargement des notifications...')).toBeInTheDocument();
    });

    test('appelle markAsRead lorsqu\'on clique sur "Marquer comme lu"', async () => {
        const mockMarkAsRead = jest.fn();
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            markAsRead: mockMarkAsRead
        });

        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Cliquer sur "Marquer comme lu"
        fireEvent.click(screen.getByText('Marquer comme lu'));

        // La fonction doit être appelée avec l'ID de la notification
        expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    });

    test('appelle markAllAsRead lorsqu\'on clique sur "Tout marquer comme lu"', () => {
        const mockMarkAllAsRead = jest.fn();
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            markAllAsRead: mockMarkAllAsRead
        });

        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Cliquer sur "Tout marquer comme lu"
        fireEvent.click(screen.getByText('Tout marquer comme lu'));

        // La fonction doit être appelée
        expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    test('appelle refresh lorsqu\'on clique sur "Actualiser"', () => {
        const mockRefresh = jest.fn();
        (useNotificationsWebSocket as jest.Mock).mockReturnValue({
            ...defaultHookReturnValue,
            refresh: mockRefresh
        });

        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Cliquer sur "Actualiser"
        fireEvent.click(screen.getByText('Actualiser'));

        // La fonction doit être appelée
        expect(mockRefresh).toHaveBeenCalled();
    });

    test('affiche correctement les liens pour les notifications avec un lien', () => {
        render(<NotificationBell />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

        // Le lien doit être visible
        const link = screen.getByText('Voir');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/test-link');
    });
}); 