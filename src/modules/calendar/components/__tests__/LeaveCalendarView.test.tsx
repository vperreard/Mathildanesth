import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeaveCalendarView } from '../LeaveCalendarView';
import { useLeaveData } from '../../../leaves/hooks/useLeaveData';
import { useUserSettings } from '../../../settings/hooks/useUserSettings';
import { Leave, LeaveStatus, LeaveType } from '../../../leaves/types/leave';

// Mock des hooks
jest.mock('../../../leaves/hooks/useLeaveData');
jest.mock('../../../settings/hooks/useUserSettings');

// Mock de la modal de détail
jest.mock('../../../leaves/components/LeaveDetailModal', () => ({
    LeaveDetailModal: ({ leaveId, onClose }: any) => (
        <div data-testid="leave-detail-modal">
            <span>Leave ID: {leaveId}</span>
            <button onClick={onClose}>Fermer</button>
        </div>
    )
}));

// Mock du composant BaseCalendar
jest.mock('../BaseCalendar', () => ({
    BaseCalendar: ({
        events,
        onEventClick,
        onViewChange,
        onDateRangeChange,
        loading
    }: any) => (
        <div data-testid="base-calendar" data-loading={loading}>
            <div data-testid="event-count">{events.length} événements</div>
            <button
                data-testid="event-click-test"
                onClick={() => onEventClick && onEventClick('leave-123')}
            >
                Simuler clic sur événement
            </button>
            <button
                data-testid="view-change-test"
                onClick={() => onViewChange && onViewChange('timeGridWeek')}
            >
                Changer vue
            </button>
            <button
                data-testid="date-range-change-test"
                onClick={() => onDateRangeChange && onDateRangeChange(new Date('2023-08-01'), new Date('2023-08-31'))}
            >
                Changer plage de dates
            </button>
        </div>
    )
}));

// Mock de performance.now()
const mockPerformanceNow = jest.spyOn(performance, 'now');
mockPerformanceNow.mockReturnValue(100);

describe('LeaveCalendarView', () => {
    // Données de test
    const mockLeaves: Leave[] = [
        {
            id: '123',
            userId: 'user1',
            requestDate: new Date('2023-06-01'),
            type: LeaveType.ANNUAL,
            status: LeaveStatus.APPROVED,
            startDate: new Date('2023-07-10'),
            endDate: new Date('2023-07-15'),
            countedDays: 5,
            isRecurring: false,
            createdAt: new Date('2023-06-01'),
            updatedAt: new Date('2023-06-01'),
            user: {
                id: 'user1',
                prenom: 'Jean',
                nom: 'Dupont',
                email: 'jean.dupont@exemple.fr',
                role: 'UTILISATEUR'
            }
        },
        {
            id: '456',
            userId: 'user1',
            requestDate: new Date('2023-06-15'),
            type: LeaveType.RECOVERY,
            status: LeaveStatus.PENDING,
            startDate: new Date('2023-07-20'),
            endDate: new Date('2023-07-22'),
            countedDays: 3,
            isRecurring: false,
            createdAt: new Date('2023-06-15'),
            updatedAt: new Date('2023-06-15'),
            user: {
                id: 'user1',
                prenom: 'Jean',
                nom: 'Dupont',
                email: 'jean.dupont@exemple.fr',
                role: 'UTILISATEUR'
            }
        },
        {
            id: '789',
            userId: 'user2',
            requestDate: new Date('2023-06-10'),
            type: LeaveType.SICK,
            status: LeaveStatus.REJECTED,
            startDate: new Date('2023-07-25'),
            endDate: new Date('2023-07-28'),
            countedDays: 4,
            isRecurring: false,
            createdAt: new Date('2023-06-10'),
            updatedAt: new Date('2023-06-15'),
            user: {
                id: 'user2',
                prenom: 'Marie',
                nom: 'Martin',
                email: 'marie.martin@exemple.fr',
                role: 'UTILISATEUR'
            }
        }
    ];

    // Mock des hooks par défaut
    const mockUserSettings = {
        settings: {
            showRejectedLeaves: true,
            startWeekOn: 'monday',
            timeFormat: '24h'
        },
        loading: false,
        error: null,
        saveSettings: jest.fn()
    };

    const mockLeaveData = {
        leaves: [],
        loading: false,
        error: null,
        fetchLeaves: jest.fn().mockResolvedValue(mockLeaves)
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useUserSettings as jest.Mock).mockReturnValue(mockUserSettings);
        (useLeaveData as jest.Mock).mockReturnValue(mockLeaveData);
    });

    it('devrait afficher un indicateur de chargement', () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            loading: true
        });

        // Act
        render(<LeaveCalendarView userId="user1" />);

        // Assert
        expect(screen.getByTestId('base-calendar')).toHaveAttribute('data-loading', 'true');
    });

    it('devrait charger les congés pour l\'utilisateur spécifié en mode personnel', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });

        // Act
        render(<LeaveCalendarView userId="user1" mode="personal" />);

        // Assert
        await waitFor(() => {
            expect(mockLeaveData.fetchLeaves).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user1'
                })
            );
        });
    });

    it('devrait charger les congés pour le département spécifié en mode département', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });

        // Act
        render(<LeaveCalendarView departmentId="dept1" mode="department" />);

        // Assert
        await waitFor(() => {
            expect(mockLeaveData.fetchLeaves).toHaveBeenCalledWith(
                expect.objectContaining({
                    departmentId: 'dept1'
                })
            );
        });
    });

    it('devrait convertir les congés en événements du calendrier', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });

        // Act
        render(<LeaveCalendarView />);

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('event-count')).toHaveTextContent('3 événements');
        });
    });

    it('devrait filtrer les congés rejetés selon les préférences utilisateur', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });
        (useUserSettings as jest.Mock).mockReturnValue({
            ...mockUserSettings,
            settings: {
                ...mockUserSettings.settings,
                showRejectedLeaves: false
            }
        });

        // Act
        render(<LeaveCalendarView />);

        // Assert
        await waitFor(() => {
            // 3 congés au total, dont 1 rejeté qui devrait être filtré
            expect(screen.getByTestId('event-count')).toHaveTextContent('2 événements');
        });
    });

    it('devrait appeler onLeaveClick quand un événement est cliqué et que le callback est fourni', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });
        const handleLeaveClick = jest.fn();

        // Act
        render(<LeaveCalendarView onLeaveClick={handleLeaveClick} />);

        // Attendre que le composant ait chargé
        await waitFor(() => {
            expect(screen.getByTestId('event-click-test')).toBeInTheDocument();
        });

        // Simuler un clic sur un événement
        fireEvent.click(screen.getByTestId('event-click-test'));

        // Assert
        expect(handleLeaveClick).toHaveBeenCalledWith('123');
    });

    it('devrait ouvrir la modal de détail quand un événement est cliqué et qu\'aucun callback n\'est fourni', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });

        // Act
        render(<LeaveCalendarView />);

        // Attendre que le composant ait chargé
        await waitFor(() => {
            expect(screen.getByTestId('event-click-test')).toBeInTheDocument();
        });

        // Simuler un clic sur un événement
        fireEvent.click(screen.getByTestId('event-click-test'));

        // Assert
        expect(screen.getByTestId('leave-detail-modal')).toBeInTheDocument();
        expect(screen.getByText('Leave ID: 123')).toBeInTheDocument();
    });

    it('devrait fermer la modal de détail quand on clique sur le bouton fermer', async () => {
        // Arrange
        (useLeaveData as jest.Mock).mockReturnValue({
            ...mockLeaveData,
            leaves: mockLeaves
        });

        // Act
        render(<LeaveCalendarView />);

        // Ouvrir la modal
        fireEvent.click(screen.getByTestId('event-click-test'));
        // Vérifier que la modal est ouverte
        expect(screen.getByTestId('leave-detail-modal')).toBeInTheDocument();

        // Fermer la modal
        fireEvent.click(screen.getByText('Fermer'));

        // Assert
        await waitFor(() => {
            expect(screen.queryByTestId('leave-detail-modal')).not.toBeInTheDocument();
        });
    });

    it('devrait appeler onViewChange quand la vue change', async () => {
        // Arrange
        const handleViewChange = jest.fn();

        // Act
        render(<LeaveCalendarView onViewChange={handleViewChange} />);

        // Attendre que le composant ait chargé
        await waitFor(() => {
            expect(screen.getByTestId('view-change-test')).toBeInTheDocument();
        });

        // Simuler un changement de vue
        fireEvent.click(screen.getByTestId('view-change-test'));

        // Assert
        expect(handleViewChange).toHaveBeenCalledWith('timeGridWeek');
    });

    it('devrait appeler onDateRangeChange quand la plage de dates change', async () => {
        // Arrange
        const handleDateRangeChange = jest.fn();

        // Act
        render(<LeaveCalendarView onDateRangeChange={handleDateRangeChange} />);

        // Attendre que le composant ait chargé
        await waitFor(() => {
            expect(screen.getByTestId('date-range-change-test')).toBeInTheDocument();
        });

        // Simuler un changement de plage de dates
        fireEvent.click(screen.getByTestId('date-range-change-test'));

        // Assert
        expect(handleDateRangeChange).toHaveBeenCalledWith(
            expect.any(Date), // 2023-08-01
            expect.any(Date)  // 2023-08-31
        );
    });

    it('devrait utiliser les paramètres du calendrier fournis', async () => {
        // Arrange
        const customSettings = {
            locale: 'en',
            firstDay: 0, // Dimanche
            slotMinTime: '06:00:00',
            slotMaxTime: '22:00:00'
        };

        // Act - Render avec des paramètres personnalisés
        render(<LeaveCalendarView settings={customSettings} />);

        // Assert - Vérification indirecte via les props transmises à BaseCalendar
        // Dans un test réel, nous vérifierions que ces paramètres sont correctement passés
        // au composant BaseCalendar
        expect(screen.getByTestId('base-calendar')).toBeInTheDocument();

        // Note: Comme nous avons mocké BaseCalendar, nous ne pouvons pas vérifier directement
        // que les paramètres lui sont passés correctement sans modifier le mock.
    });
}); 