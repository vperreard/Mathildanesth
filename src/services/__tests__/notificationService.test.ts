import NotificationService, { notificationService, Notification } from '../notificationService';

describe('NotificationService', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        // Reset singleton instance
        (NotificationService as any).instance = null;
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('getInstance', () => {
        it('should create singleton instance', () => {
            const instance1 = NotificationService.getInstance();
            const instance2 = NotificationService.getInstance();

            expect(instance1).toBe(instance2);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                'NotificationService: Complètement désactivé (version temp)'
            );
            // Should only log once for singleton
            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        });

        it('should return the same instance as exported notificationService', () => {
            expect(notificationService).toBe(NotificationService.getInstance());
        });
    });

    describe('subscribe', () => {
        it('should log disabled message and return unsubscribe function', () => {
            const callback = jest.fn();
            const unsubscribe = notificationService.subscribe('test-type', callback);

            expect(consoleLogSpy).toHaveBeenCalledWith('NotificationService.subscribe: Désactivé');
            expect(typeof unsubscribe).toBe('function');
        });

        it('should return a no-op unsubscribe function', () => {
            const callback = jest.fn();
            const unsubscribe = notificationService.subscribe('test-type', callback);

            // Should not throw when called
            expect(() => unsubscribe()).not.toThrow();
        });
    });

    describe('unsubscribe', () => {
        it('should log disabled message', () => {
            const callback = jest.fn();
            notificationService.unsubscribe('test-type', callback);

            expect(consoleLogSpy).toHaveBeenCalledWith('NotificationService.unsubscribe: Désactivé');
        });
    });

    describe('sendNotification', () => {
        it('should log disabled message with notification title', () => {
            const notification = {
                type: 'info' as const,
                title: 'Test Notification',
                message: 'This is a test message',
                data: { extra: 'data' }
            };

            notificationService.sendNotification(notification);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                'NotificationService.sendNotification: Désactivé - Test Notification'
            );
        });

        it('should handle different notification types', () => {
            const types: Array<Notification['type']> = ['info', 'success', 'warning', 'error'];

            types.forEach(type => {
                notificationService.sendNotification({
                    type,
                    title: `${type} notification`,
                    message: 'Test message'
                });
            });

            expect(consoleLogSpy).toHaveBeenCalledTimes(types.length + 1); // +1 for constructor
            types.forEach(type => {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    `NotificationService.sendNotification: Désactivé - ${type} notification`
                );
            });
        });
    });

    describe('resetForTesting', () => {
        it('should log disabled message', () => {
            notificationService.resetForTesting();

            expect(consoleLogSpy).toHaveBeenCalledWith('NotificationService.resetForTesting: Désactivé');
        });
    });

    describe('disabled state', () => {
        it('should not perform any actual notification operations', () => {
            // Test that service methods don't throw errors and are effectively disabled
            const callback = jest.fn();

            expect(() => {
                const unsubscribe = notificationService.subscribe('test', callback);
                notificationService.sendNotification({
                    type: 'info',
                    title: 'Test',
                    message: 'Test'
                });
                notificationService.unsubscribe('test', callback);
                unsubscribe();
                notificationService.resetForTesting();
            }).not.toThrow();

            // Callback should never be called since service is disabled
            expect(callback).not.toHaveBeenCalled();
        });
    });
});