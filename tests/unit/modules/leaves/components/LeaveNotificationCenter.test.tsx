import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeaveNotificationCenter } from '../../../../../src/modules/conges/components/LeaveNotificationCenter';
import { useLeaveNotifications } from '../../../../../src/modules/conges/hooks/useNotifications';
import {
    LeaveNotificationType,
    NotificationPriority,
    LeaveRelatedNotification
} from '../../../../../src/modules/conges/types/notification';
import { LeaveStatus } from '../../../../../src/modules/conges/types/leave';

// Mock des dépendances
jest.mock('../../../../../src/modules/conges/hooks/useNotifications');

// Mock framer-motion sans utiliser l'opérateur rest dans la factory
jest.mock('framer-motion', () => {
    const actual = jest.requireActual('framer-motion');
    return {
        ...actual,
        motion: {
            ...actual.motion,
            div: jest.fn().mockImplementation(props => {
                const { children } = props;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _filteredProps = { ...props };
                delete _filteredProps.children;
                return <div {..._filteredProps}>{children}</div>;
            }),
            // Ajouter d'autres éléments motion si nécessaire
        },
        AnimatePresence: jest.fn().mockImplementation(({ children }) => <>{children}</>),
    };
});

// Mock de useLeaveNotifications
const mockUseLeaveNotifications = useLeaveNotifications as jest.Mock;

// Mock d'icônes Lucide
jest.mock('lucide-react', () => ({
    Bell: () => <div data-testid="bell-icon" />,
    X: () => <div data-testid="x-icon" />,
    Calendar: () => <div data-testid="calendar-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    CheckCircle: () => <div data-testid="check-icon" />,
    XCircle: () => <div data-testid="x-circle-icon" />,
    AlertCircle: () => <div data-testid="alert-icon" />,
    Info: () => <div data-testid="info-icon" />,
}));

// Mock de date-fns pour des dates statiques
jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn().mockReturnValue('il y a 2 jours'),
}));

// Mock des notifications
const mockNotifications: LeaveRelatedNotification[] = [
    {
        id: 'notif1',
        type: LeaveNotificationType.LEAVE_REQUEST,
        title: 'Nouvelle demande',
        message: 'Jean Dupont a soumis une demande de congé',
        read: false,
        createdAt: new Date('2023-12-01T10:00:00Z'),
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user123',
        referenceId: 'leave123',
        referenceType: 'leave',
        leaveType: 'ANNUAL',
        actions: [
            { label: 'Voir', action: 'VIEW', url: '/conges/123' }
        ]
    },
    {
        id: 'notif2',
        type: LeaveNotificationType.LEAVE_STATUS_UPDATE,
        title: 'Demande approuvée',
        message: 'Votre demande a été approuvée',
        read: true,
        createdAt: new Date('2023-12-02T14:30:00Z'),
        priority: NotificationPriority.HIGH,
        recipientId: 'user123',
        referenceId: 'leave456',
        referenceType: 'leave',
        leaveStatus: LeaveStatus.APPROVED,
        leaveType: 'ANNUAL'
    }
];

// Mock de window.location.href
const mockLocationHref = jest.fn();
Object.defineProperty(window, 'location', {
    value: {
        get href() { return ''; },
        set href(val: string) {
            mockLocationHref(val);
        }
    },
    writable: true
});

describe.skip('LeaveNotificationCenter', () => {
    // Mock des fonctions du hook
    const mockFetchNotifications = jest.fn();
    const mockMarkAsRead = jest.fn();
    const mockMarkAllAsRead = jest.fn();
    const mockDeleteNotification = jest.fn();
    const mockDeleteAllNotifications = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurer le mock de useLeaveNotifications
        mockUseLeaveNotifications.mockReturnValue({
            notifications: mockNotifications,
            unreadCount: 1,
            loading: false,
            error: null,
            fetchNotifications: mockFetchNotifications,
            markAsRead: mockMarkAsRead,
            markAllAsRead: mockMarkAllAsRead,
            deleteNotification: mockDeleteNotification,
            deleteAllNotifications: mockDeleteAllNotifications
        });
    });

    it('devrait afficher un bouton avec le compteur de notifications non lues', () => {
        render(<LeaveNotificationCenter />);

        // Vérifier que l'icône Bell est visible
        expect(screen.getByTestId('bell-icon')).toBeInTheDocument();

        // Vérifier que le compteur est visible et affiche le bon nombre
        const counter = screen.getByText('1');
        expect(counter).toBeInTheDocument();
    });

    it('devrait ouvrir le panneau de notifications au clic sur le bouton', async () => {
        render(<LeaveNotificationCenter />);

        // Cliquer sur le bouton
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Vérifier que le panneau s'ouvre
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
            expect(screen.getByText('Tout marquer comme lu')).toBeInTheDocument();
        });

        // Vérifier que les notifications sont affichées
        expect(screen.getByText('Nouvelle demande')).toBeInTheDocument();
        expect(screen.getByText('Demande approuvée')).toBeInTheDocument();
    });

    it('devrait marquer une notification comme lue au clic sur la croix', async () => {
        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Trouver et cliquer sur un bouton de fermeture (X)
        const closeButtons = screen.getAllByTestId('x-icon');
        fireEvent.click(closeButtons[0]);

        // Vérifier que markAsRead a été appelé
        expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');
    });

    it('devrait marquer toutes les notifications comme lues au clic sur "Tout marquer comme lu"', async () => {
        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Cliquer sur "Tout marquer comme lu"
        fireEvent.click(screen.getByText('Tout marquer comme lu'));

        // Vérifier que markAllAsRead a été appelé
        expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('devrait effacer toutes les notifications au clic sur "Tout effacer"', async () => {
        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Cliquer sur "Tout effacer"
        fireEvent.click(screen.getByText('Tout effacer'));

        // Vérifier que deleteAllNotifications a été appelé
        expect(mockDeleteAllNotifications).toHaveBeenCalled();
    });

    it('devrait appeler le callback onNotificationClick au clic sur une notification', async () => {
        // Mock de callback
        const onNotificationClick = jest.fn();

        render(<LeaveNotificationCenter onNotificationClick={onNotificationClick} />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Cliquer sur une notification
        fireEvent.click(screen.getByText('Nouvelle demande'));

        // Vérifier que onNotificationClick a été appelé avec la bonne notification
        expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);

        // Vérifier que markAsRead a été appelé (car la notification n'était pas lue)
        expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');
    });

    it('devrait afficher un message quand il n\'y a pas de notifications', async () => {
        // Configurer le mock pour retourner un tableau vide
        mockUseLeaveNotifications.mockReturnValue({
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: null,
            fetchNotifications: mockFetchNotifications,
            markAsRead: mockMarkAsRead,
            markAllAsRead: mockMarkAllAsRead,
            deleteNotification: mockDeleteNotification,
            deleteAllNotifications: mockDeleteAllNotifications
        });

        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Vérifier que le message "Aucune notification" est affiché
        expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });

    it('devrait afficher un indicateur de chargement', async () => {
        // Configurer le mock pour simuler le chargement
        mockUseLeaveNotifications.mockReturnValue({
            notifications: [],
            unreadCount: 0,
            loading: true,
            error: null,
            fetchNotifications: mockFetchNotifications,
            markAsRead: mockMarkAsRead,
            markAllAsRead: mockMarkAllAsRead,
            deleteNotification: mockDeleteNotification,
            deleteAllNotifications: mockDeleteAllNotifications
        });

        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Vérifier que le message de chargement est affiché
        expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('devrait afficher un message d\'erreur', async () => {
        // Configurer le mock pour simuler une erreur
        mockUseLeaveNotifications.mockReturnValue({
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: 'Erreur de chargement',
            fetchNotifications: mockFetchNotifications,
            markAsRead: mockMarkAsRead,
            markAllAsRead: mockMarkAllAsRead,
            deleteNotification: mockDeleteNotification,
            deleteAllNotifications: mockDeleteAllNotifications
        });

        render(<LeaveNotificationCenter />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Vérifier que le message d'erreur est affiché
        expect(screen.getByText('Erreur: Erreur de chargement')).toBeInTheDocument();
    });

    it('devrait prendre en compte l\'option compact', async () => {
        render(<LeaveNotificationCenter compact={true} />);

        // Ouvrir le panneau
        fireEvent.click(screen.getByLabelText('Notifications'));

        // Attendre que le panneau soit ouvert
        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });

        // Trouver le panneau et vérifier sa classe
        const panel = screen.getByText('Notifications').closest('.notification-panel')?.querySelector('div[class*="w-80"]');
        expect(panel).not.toBeNull();
    });
}); 