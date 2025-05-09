import { ConflictType, ConflictSeverity, LeaveConflict } from '../../types/conflict';

/**
 * Mock pour useLeaveConflictNotification
 * Ce fichier sert à remplacer le hook dans les tests
 */
export const useLeaveConflictNotification = jest.fn().mockReturnValue({
    notifyConflict: jest.fn(),
    notifyConflicts: jest.fn(),
    notifyCurrentConflicts: jest.fn(),
    showBlockingAlert: jest.fn().mockReturnValue(null),
    showWarningAlert: jest.fn().mockReturnValue(null),
    showInfoAlert: jest.fn().mockReturnValue(null),
    formatConflictMessage: jest.fn(),
    formatConflictTitle: jest.fn(),
    notificationsSent: false,
    resetNotifications: jest.fn(),
    conflictDetection: {
        conflicts: [],
        getBlockingConflicts: jest.fn().mockReturnValue([]),
        getWarningConflicts: jest.fn().mockReturnValue([]),
        getInfoConflicts: jest.fn().mockReturnValue([])
    }
});

export default useLeaveConflictNotification; 