import { renderHook, act, waitFor } from '@testing-library/react';
import { useLeaveNotifications } from '../../../../../src/modules/leaves/hooks/useNotifications';
import { leaveNotificationService } from '../../../../../src/modules/leaves/services/notificationService';
import {
    LeaveNotificationType,
    NotificationPriority,
    LeaveRelatedNotification
} from '../../../../../src/modules/leaves/types/notification';
import { useSession } from 'next-auth/react';
import { LeaveStatus } from '../../../../../src/modules/leaves/types/leave';

// Mock des dépendances
jest.mock('next-auth/react');
jest.mock('../../../../../src/modules/leaves/services/notificationService');

// Mock de useSession
const mockUseSession = useSession as jest.Mock;
const mockSession = {
    data: {
        user: {
            id: 'user123',
            name: 'Jean Dupont',
            email: 'jean.dupont@example.com'
        }
    },
    status: 'authenticated'
};

// Mock de notifications pour les tests
const mockNotifications: LeaveRelatedNotification[] = [
    {
        id: 'notif1',
        type: LeaveNotificationType.LEAVE_REQUEST,
        title: 'Notification 1',
        message: 'Test message 1',
        read: false,
        createdAt: new Date('2023-12-01'),
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user123',
        referenceId: 'leave123',
        referenceType: 'leave'
    },
    {
        id: 'notif2',
        type: LeaveNotificationType.LEAVE_STATUS_UPDATE,
        title: 'Notification 2',
        message: 'Test message 2',
        read: true,
        createdAt: new Date('2023-12-02'),
        priority: NotificationPriority.HIGH,
        recipientId: 'user123',
        referenceId: 'leave456',
        referenceType: 'leave',
        leaveStatus: LeaveStatus.APPROVED
    }
];

describe('useLeaveNotifications', () => {
    // Mocks de méthodes du service
    const mockGetNotifications = jest.fn();
    const mockMarkAsRead = jest.fn();
    const mockMarkAllAsRead = jest.fn();
    const mockDeleteNotification = jest.fn();
    const mockDeleteAllNotifications = jest.fn();
    const mockUpdateConfig = jest.fn();
    const mockSubscribe = jest.fn();

    beforeAll(() => {
        // Configuration des mocks
        mockGetNotifications.mockResolvedValue({
            notifications: mockNotifications,
            totalCount: mockNotifications.length,
            unreadCount: 1
        });

        mockMarkAsRead.mockResolvedValue(undefined);
        mockMarkAllAsRead.mockResolvedValue(undefined);
        mockDeleteNotification.mockResolvedValue(undefined);
        mockDeleteAllNotifications.mockResolvedValue(undefined);
        mockUpdateConfig.mockResolvedValue(undefined);
        mockSubscribe.mockReturnValue(() => { }); // Fonction de désabonnement

        // Configuration du mock du service
        (leaveNotificationService.getNotifications as jest.Mock) = mockGetNotifications;
        (leaveNotificationService.markAsRead as jest.Mock) = mockMarkAsRead;
        (leaveNotificationService.markAllAsRead as jest.Mock) = mockMarkAllAsRead;
        (leaveNotificationService.deleteNotification as jest.Mock) = mockDeleteNotification;
        (leaveNotificationService.deleteAllNotifications as jest.Mock) = mockDeleteAllNotifications;
        (leaveNotificationService.updateConfig as jest.Mock) = mockUpdateConfig;
        (leaveNotificationService.subscribe as jest.Mock) = mockSubscribe;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSession.mockReturnValue(mockSession);
    });

    it('devrait récupérer les notifications au chargement', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetNotifications).toHaveBeenCalledWith('user123', expect.any(Object));
        expect(result.current.notifications).toEqual(mockNotifications);
        expect(result.current.unreadCount).toBe(1);
    });

    it('ne devrait pas récupérer les notifications si autoFetch est à false', () => {
        renderHook(() => useLeaveNotifications({ autoFetch: false }));
        expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it('ne devrait pas récupérer les notifications si l\'utilisateur n\'est pas authentifié', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        renderHook(() => useLeaveNotifications({ autoFetch: true }));
        expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it('devrait s\'abonner aux notifications et mettre à jour l\'état lorsqu\'une notification est reçue', async () => {
        // Mock de la fonction de rappel pour les notifications
        let subscribeCallback: (notification: LeaveRelatedNotification) => void = () => { };
        mockSubscribe.mockImplementation((type, callback) => {
            subscribeCallback = callback;
            return jest.fn();
        });

        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Vérifier que l'abonnement a été créé
        expect(mockSubscribe).toHaveBeenCalled();

        // Simuler la réception d'une nouvelle notification
        const newNotification: LeaveRelatedNotification = {
            id: 'notif3',
            type: LeaveNotificationType.LEAVE_REMINDER,
            title: 'Notification 3',
            message: 'Test message 3',
            read: false,
            createdAt: new Date(),
            priority: NotificationPriority.LOW,
            recipientId: 'user123',
            referenceId: 'leave789',
            referenceType: 'leave',
            daysUntilStart: 3
        };

        act(() => {
            subscribeCallback(newNotification);
        });

        // Vérifier que l'état a été mis à jour avec la nouvelle notification
        expect(result.current.notifications[0]).toEqual(newNotification);
        expect(result.current.unreadCount).toBe(2); // 1 initial + 1 nouveau
    });

    it('devrait marquer une notification comme lue', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Appeler la méthode à tester
        await act(async () => {
            await result.current.markAsRead('notif1');
        });

        // Vérifier que le service a été appelé
        expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');

        // Vérifier que l'état a été mis à jour
        const updatedNotification = result.current.notifications.find(n => n.id === 'notif1');
        expect(updatedNotification?.read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('devrait marquer toutes les notifications comme lues', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Appeler la méthode à tester
        await act(async () => {
            await result.current.markAllAsRead();
        });

        // Vérifier que le service a été appelé
        expect(mockMarkAllAsRead).toHaveBeenCalledWith('user123');

        // Vérifier que l'état a été mis à jour
        expect(result.current.notifications.every(n => n.read)).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('devrait supprimer une notification', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Nombre initial de notifications
        const initialCount = result.current.notifications.length;

        // Appeler la méthode à tester
        await act(async () => {
            await result.current.deleteNotification('notif1');
        });

        // Vérifier que le service a été appelé
        expect(mockDeleteNotification).toHaveBeenCalledWith('notif1');

        // Vérifier que l'état a été mis à jour
        expect(result.current.notifications.length).toBe(initialCount - 1);
        expect(result.current.notifications.find(n => n.id === 'notif1')).toBeUndefined();
        expect(result.current.unreadCount).toBe(0); // La notification supprimée était non lue
    });

    it('devrait supprimer toutes les notifications', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Appeler la méthode à tester
        await act(async () => {
            await result.current.deleteAllNotifications();
        });

        // Vérifier que le service a été appelé
        expect(mockDeleteAllNotifications).toHaveBeenCalledWith('user123');

        // Vérifier que l'état a été mis à jour
        expect(result.current.notifications.length).toBe(0);
        expect(result.current.unreadCount).toBe(0);
    });

    it('devrait mettre à jour la configuration des notifications', async () => {
        const { result } = renderHook(() => useLeaveNotifications({ autoFetch: true }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Nouvelle configuration
        const newConfig = {
            reminderDays: [2, 5],
            quotaThreshold: 15
        };

        // Appeler la méthode à tester
        await act(async () => {
            await result.current.updateConfig(newConfig);
        });

        // Vérifier que le service a été appelé
        expect(mockUpdateConfig).toHaveBeenCalledWith(newConfig);

        // Vérifier que l'état a été mis à jour
        expect(result.current.config).toMatchObject(newConfig);
    });

    it('devrait filtrer les notifications par type', async () => {
        mockGetNotifications.mockResolvedValueOnce({
            notifications: mockNotifications,
            totalCount: mockNotifications.length,
            unreadCount: 1
        });

        const { result } = renderHook(() => useLeaveNotifications({
            autoFetch: true,
            type: LeaveNotificationType.LEAVE_REQUEST
        }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Vérifier que seules les notifications du type spécifié sont conservées
        expect(result.current.notifications.length).toBe(1);
        expect(result.current.notifications[0].type).toBe(LeaveNotificationType.LEAVE_REQUEST);
    });

    it('devrait appeler le callback onNotificationReceived lorsqu\'une notification est reçue', async () => {
        // Mock de la fonction de rappel pour les notifications
        let subscribeCallback: (notification: LeaveRelatedNotification) => void = () => { };
        mockSubscribe.mockImplementation((type, callback) => {
            subscribeCallback = callback;
            return jest.fn();
        });

        // Mock du callback onNotificationReceived
        const mockOnNotificationReceived = jest.fn();

        const { result } = renderHook(() => useLeaveNotifications({
            autoFetch: true,
            onNotificationReceived: mockOnNotificationReceived
        }));

        await waitFor(() => {
            expect(mockSubscribe).toHaveBeenCalled();
        });

        // Simuler la réception d'une nouvelle notification
        const newNotification: LeaveRelatedNotification = {
            id: 'notif3',
            type: LeaveNotificationType.LEAVE_REMINDER,
            title: 'Notification 3',
            message: 'Test message 3',
            read: false,
            createdAt: new Date(),
            priority: NotificationPriority.LOW,
            recipientId: 'user123',
            referenceId: 'leave789',
            referenceType: 'leave',
            daysUntilStart: 3
        };

        act(() => {
            subscribeCallback(newNotification);
        });

        // Vérifier que le callback a été appelé
        expect(mockOnNotificationReceived).toHaveBeenCalledWith(newNotification);
    });
}); 