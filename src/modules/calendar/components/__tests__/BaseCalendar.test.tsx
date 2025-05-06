import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BaseCalendar } from '../BaseCalendar';
import { CalendarEventType, CalendarViewType } from '../../types/event';
import { useCalendarStore, CalendarState } from '../../store/calendarStore';

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

// jest.mock('framer-motion', () => ({
//     motion: {
//         div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
//     },
//     AnimatePresence: ({ children }: any) => <>{children}</>,
// }));

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

// Mock du store du calendrier
jest.mock('../../store/calendarStore', () => ({
    useCalendarStore: jest.fn<Partial<CalendarState>, []>().mockReturnValue({
        events: [],
        loading: false,
        view: 'dayGridMonth',
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
    }),
}));

// Mock du composant de chargement
jest.mock('../ui/CalendarLoadingOverlay', () => ({
    CalendarLoadingOverlay: () => <div data-testid="calendar-loading-overlay">Chargement...</div>
}));

describe.skip('BaseCalendar', () => {
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
        // Vider les appels des mocks si besoin, mais la config de base est déjà faite
        jest.clearAllMocks();

        // Si un test nécessite une config spécifique du store, on peut la surcharger ici:
        // (useCalendarStore as jest.Mock<Partial<CalendarState>, []>).mockReturnValueOnce({...});
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

    test.skip('utilise la vue spécifiée en prop', async () => {
        render(<BaseCalendar events={mockEvents} view={CalendarViewType.WEEK} />);

        const calendarElement = await screen.findByTestId('fullcalendar');
        expect(calendarElement).toHaveAttribute('data-view', 'timeGridWeek');
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

        // Surcharger avec le type correct
        (useCalendarStore as jest.Mock<Partial<CalendarState>, []>).mockReturnValueOnce({
            events: [],
            loading: false,
            view: 'dayGridMonth',
            settings: { businessHours: true, nowIndicator: true },
            userSettings: {
                showRejectedLeaves: false, // <- Surcharge
                colorScheme: { textColor: '#000000' },
                startWeekOn: 1,
                showWeekends: true,
                timeFormat: '24h',
            },
        });

        const { rerender } = render(
            <BaseCalendar
                events={eventsWithRejected}
            // On peut supprimer userSettings ici si on se fie au store mocké
            />
        );

        expect(screen.queryByText('Congé refusé')).not.toBeInTheDocument();

        // Pour la deuxième partie du test (showRejectedLeaves = true),
        // il faut à nouveau surcharger ou s'assurer que le mock par défaut est restauré.
        // Si on utilise mockReturnValueOnce, le mock par défaut revient après le premier appel.
        // Ici, le mock par défaut a showRejectedLeaves: true, donc pas besoin de surcharger à nouveau.

        rerender(
            <BaseCalendar events={eventsWithRejected} />
        );

        expect(screen.getByText('Congé refusé')).toBeInTheDocument();
    });
}); 