import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '../useNotifications';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@prisma/client';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('@/services/notificationService');

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

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('useNotifications Hook', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    // Reset all socket mock calls
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockNotification: Notification = {
    id: 1,
    userId: 1,
    type: 'INFO',
    title: 'Test Notification',
    message: 'This is a test',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: null,
    priority: 'MEDIUM',
    expiresAt: null,
  };

  describe('Fetch Notifications', () => {
    it('devrait récupérer les notifications avec succès', async () => {
      const mockNotifications = [mockNotification];
      mockNotificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual(mockNotifications);
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(1);
    });

    it('devrait gérer les erreurs de récupération', async () => {
      const error = new Error('Failed to fetch notifications');
      mockNotificationService.getUserNotifications.mockRejectedValue(error);

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('ne devrait pas récupérer si userId est null', () => {
      const { result } = renderHook(() => useNotifications(null), { wrapper });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockNotificationService.getUserNotifications).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket Integration', () => {
    it('devrait s\'abonner aux nouvelles notifications via WebSocket', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([]);
      
      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate WebSocket connection
      expect(mockSocket.on).toHaveBeenCalledWith('notification:new', expect.any(Function));
      
      // Simulate receiving a new notification
      const newNotification = { ...mockNotification, id: 2 };
      const socketHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'notification:new'
      )?.[1];

      act(() => {
        socketHandler(newNotification);
      });

      expect(result.current.notifications).toContainEqual(newNotification);
    });

    it('devrait mettre à jour les notifications lues via WebSocket', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([mockNotification]);
      
      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      // Simulate marking as read via WebSocket
      const socketHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'notification:read'
      )?.[1];

      act(() => {
        socketHandler({ notificationId: 1 });
      });

      expect(result.current.notifications[0].read).toBe(true);
    });

    it('devrait nettoyer les listeners WebSocket au démontage', () => {
      const { unmount } = renderHook(() => useNotifications(1), { wrapper });

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('notification:new');
      expect(mockSocket.off).toHaveBeenCalledWith('notification:read');
      expect(mockSocket.off).toHaveBeenCalledWith('notification:delete');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Mark as Read', () => {
    it('devrait marquer une notification comme lue', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([mockNotification]);
      mockNotificationService.markAsRead.mockResolvedValue({ ...mockNotification, read: true });

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.markAsRead(1);
      });

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1);
      expect(result.current.notifications[0].read).toBe(true);
    });

    it('devrait gérer les erreurs lors du marquage', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([mockNotification]);
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Failed to mark as read'));

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await expect(act(async () => {
        await result.current.markAsRead(1);
      })).rejects.toThrow('Failed to mark as read');
    });
  });

  describe('Mark All as Read', () => {
    it('devrait marquer toutes les notifications comme lues', async () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 2, read: false },
        { ...mockNotification, id: 3, read: true },
      ];
      mockNotificationService.getUserNotifications.mockResolvedValue(notifications);
      mockNotificationService.markAllAsRead.mockResolvedValue(
        notifications.map(n => ({ ...n, read: true }))
      );

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(3);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(result.current.notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('Delete Notification', () => {
    it('devrait supprimer une notification', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 2 }];
      mockNotificationService.getUserNotifications.mockResolvedValue(notifications);
      mockNotificationService.deleteNotification.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteNotification(1);
      });

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(1);
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications.find(n => n.id === 1)).toBeUndefined();
    });

    it('devrait gérer les erreurs de suppression', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([mockNotification]);
      mockNotificationService.deleteNotification.mockRejectedValue(new Error('Failed to delete'));

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await expect(act(async () => {
        await result.current.deleteNotification(1);
      })).rejects.toThrow('Failed to delete');

      // Notification should still be present
      expect(result.current.notifications).toHaveLength(1);
    });
  });

  describe('Unread Count', () => {
    it('devrait calculer le nombre de notifications non lues', async () => {
      const notifications = [
        { ...mockNotification, read: false },
        { ...mockNotification, id: 2, read: true },
        { ...mockNotification, id: 3, read: false },
      ];
      mockNotificationService.getUserNotifications.mockResolvedValue(notifications);

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });
    });

    it('devrait mettre à jour le compte après marquage', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([
        { ...mockNotification, read: false },
      ]);
      mockNotificationService.markAsRead.mockResolvedValue({ ...mockNotification, read: true });

      const { result } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });

      await act(async () => {
        await result.current.markAsRead(1);
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Notification Filtering', () => {
    it('devrait filtrer les notifications par type', async () => {
      const notifications = [
        { ...mockNotification, type: 'INFO' },
        { ...mockNotification, id: 2, type: 'WARNING' },
        { ...mockNotification, id: 3, type: 'ERROR' },
      ];
      mockNotificationService.getUserNotifications.mockResolvedValue(notifications);

      const { result } = renderHook(() => useNotifications(1, { type: 'WARNING' }), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].type).toBe('WARNING');
      });
    });

    it('devrait filtrer les notifications non lues', async () => {
      const notifications = [
        { ...mockNotification, read: false },
        { ...mockNotification, id: 2, read: true },
        { ...mockNotification, id: 3, read: false },
      ];
      mockNotificationService.getUserNotifications.mockResolvedValue(notifications);

      const { result } = renderHook(() => useNotifications(1, { unreadOnly: true }), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.notifications.every(n => !n.read)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('devrait limiter le nombre de notifications chargées', async () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotification,
        id: i + 1,
      }));
      mockNotificationService.getUserNotifications.mockResolvedValue(manyNotifications);

      const { result } = renderHook(() => useNotifications(1, { limit: 20 }), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(20);
      });
    });

    it('devrait mettre en cache les résultats', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([mockNotification]);

      const { result: result1 } = renderHook(() => useNotifications(1), { wrapper });
      const { result: result2 } = renderHook(() => useNotifications(1), { wrapper });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Should only call the service once due to caching
      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error States', () => {
    it('devrait retry automatiquement en cas d\'erreur réseau', async () => {
      mockNotificationService.getUserNotifications
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([mockNotification]);

      const { result } = renderHook(() => useNotifications(1, { enableRetry: true }), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledTimes(2);
    });

    it('devrait afficher un état d\'erreur après plusieurs échecs', async () => {
      mockNotificationService.getUserNotifications.mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useNotifications(1, { maxRetries: 2 }), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Persistent error');
      });
    });
  });
});