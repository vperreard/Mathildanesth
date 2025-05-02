import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BaseCalendar } from '../BaseCalendar';
import { CalendarEventType, CalendarViewType } from '../../types/event';
import { useCalendarStore } from '../../store/calendarStore';

// Mock de FullCalendar et ses plugins
jest.mock('@fullcalendar/react', () => ({
    __esModule: true,
    default: ({ events, initialView, eventClick, dateClick, eventDrop, eventResize }: any) => (
        <div data-testid="fullcalendar" data-view={initialView}>
            <div data-testid="event-container">
                {events?.map((event: any, index: number) => (
                    <div
                        key={index}
                        data-testid={`event-${event.id}`}
                        onClick={() => eventClick?.({ event: { extendedProps: event, id: event.id, start: event.start, end: event.end } })}
                    >
                        {event.title}
                    </div>
                ))}
            </div>
            <button
                data-testid="prev-button"
                onClick={() => dateClick?.({ date: new Date('2023-05-01') })}
            >
                Précédent
            </button>
            <button
                data-testid="next-button"
                onClick={() => dateClick?.({ date: new Date('2023-05-31') })}
            >
                Suivant
            </button>
        </div>
    )
}));

jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/list', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@fullcalendar/core/locales/fr', () => ({}));

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock du store du calendrier
jest.mock('../../store/calendarStore', () => ({
    useCalendarStore: jest.fn(),
}));

// Mock du composant de chargement
jest.mock('../ui/CalendarLoadingOverlay', () => ({
    CalendarLoadingOverlay: () => <div data-testid="calendar-loading-overlay">Chargement...</div>
}));

describe('BaseCalendar', () => {
    const mockEvents: any[] = [
        {
            id: '1',
            title: 'Événement test 1',
            start: new Date('2023-05-15T10:00:00'),
            end: new Date('2023-05-15T12:00:00'),
            allDay: false,
            type: CalendarEventType.LEAVE,
        },
        {
            id: '2',
            title: 'Événement test 2',
            start: new Date('2023-05-16T14:00:00'),
            end: new Date('2023-05-16T16:00:00'),
            allDay: false,
            type: CalendarEventType.DUTY,
        },
    ];

    beforeEach(() => {
        // Configurer le mock du store de calendrier
        (useCalendarStore as jest.Mock<any>).mockReturnValue({
            events: [],
            loading: false,
            view: CalendarViewType.MONTH,
            settings: {
                businessHours: true,
                nowIndicator: true,
            },
            userSettings: {
                showRejectedLeaves: true,
                colorScheme: {
                    textColor: '#000000',
                },
                startWeekOn: 1,
                showWeekends: true,
                timeFormat: '24h',
            },
        });
    });

    test('rend le composant FullCalendar', () => {
        render(<BaseCalendar events={mockEvents} />);

        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });

    test('rend les événements correctement', () => {
        render(<BaseCalendar events={mockEvents} />);

        expect(screen.getByText('Événement test 1')).toBeInTheDocument();
        expect(screen.getByText('Événement test 2')).toBeInTheDocument();
    });

    test('appelle onEventClick quand un événement est cliqué', () => {
        const mockOnEventClick = jest.fn();
        render(<BaseCalendar events={mockEvents} onEventClick={mockOnEventClick} />);

        fireEvent.click(screen.getByText('Événement test 1'));

        expect(mockOnEventClick).toHaveBeenCalledTimes(1);
        expect(mockOnEventClick).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            title: 'Événement test 1'
        }));
    });

    test('affiche un indicateur de chargement quand loading=true', () => {
        render(<BaseCalendar events={mockEvents} loading={true} />);

        expect(screen.getByTestId('calendar-loading-overlay')).toBeInTheDocument();
    });

    test('n\'affiche pas l\'indicateur de chargement quand loading=false', () => {
        render(<BaseCalendar events={mockEvents} loading={false} />);

        expect(screen.queryByTestId('calendar-loading-overlay')).not.toBeInTheDocument();
    });

    test('utilise la vue spécifiée en prop', () => {
        render(<BaseCalendar events={mockEvents} view={CalendarViewType.WEEK} />);

        expect(screen.getByTestId('fullcalendar')).toHaveAttribute('data-view', 'timeGridWeek');
    });

    test('filtre les congés refusés selon les paramètres utilisateur', () => {
        const eventsWithRejected: any[] = [
            ...mockEvents,
            {
                id: '3',
                title: 'Congé refusé',
                start: new Date('2023-05-17T10:00:00'),
                end: new Date('2023-05-17T12:00:00'),
                allDay: false,
                type: CalendarEventType.LEAVE,
                status: 'REJECTED',
            },
        ];

        // Utilisateur avec showRejectedLeaves = false
        (useCalendarStore as jest.Mock<any>).mockReturnValue({
            events: [],
            loading: false,
            view: CalendarViewType.MONTH,
            settings: {
                businessHours: true,
                nowIndicator: true,
            },
            userSettings: {
                showRejectedLeaves: false,
                colorScheme: {
                    textColor: '#000000',
                },
                startWeekOn: 1,
                showWeekends: true,
                timeFormat: '24h',
            },
        });

        const { rerender } = render(
            <BaseCalendar
                events={eventsWithRejected}
                userSettings={{
                    showRejectedLeaves: false,
                    startWeekOn: 1,
                    showWeekends: true,
                    timeFormat: '24h',
                    colorScheme: {
                        textColor: '#000000',
                    },
                }}
            />
        );

        // Le congé refusé ne devrait pas être affiché
        expect(screen.queryByText('Congé refusé')).not.toBeInTheDocument();

        // Avec showRejectedLeaves = true
        rerender(
            <BaseCalendar
                events={eventsWithRejected}
                userSettings={{
                    showRejectedLeaves: true,
                    startWeekOn: 1,
                    showWeekends: true,
                    timeFormat: '24h',
                    colorScheme: {
                        textColor: '#000000',
                    },
                }}
            />
        );

        // Maintenant le congé refusé devrait être affiché
        expect(screen.getByText('Congé refusé')).toBeInTheDocument();
    });
}); 