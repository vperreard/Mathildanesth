import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';
import { CalendarViewType } from '../CalendarHeader';

// Mock des dépendances FullCalendar
jest.mock('@fullcalendar/react', () => {
    return function DummyFullCalendar(props: any) {
        return (
            <div data-testid="fullcalendar-mock">
                <div>View: {props.initialView}</div>
                <div>Events: {props.events?.length || 0}</div>
                <div>Loading: {props.loading ? 'true' : 'false'}</div>
                <div>Editable: {props.editable ? 'true' : 'false'}</div>
                <div>Selectable: {props.selectable ? 'true' : 'false'}</div>
                <button onClick={() => props.eventClick({ event: { id: '1', title: 'Test Event', start: new Date(), extendedProps: { id: '1', title: 'Test Event' } } })}>
                    Simulate Event Click
                </button>
                <button onClick={() => props.datesSet({ view: { currentStart: new Date(), currentEnd: new Date() } })}>
                    Simulate Dates Set
                </button>
            </div>
        );
    };
});

// Mock des plugins
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/list', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@fullcalendar/core/locales/fr', () => ({}));

describe('CalendarGrid', () => {
    const mockEvents = [
        {
            id: '1',
            title: 'Événement de test 1',
            start: '2023-01-01T10:00:00',
            end: '2023-01-01T12:00:00',
        },
        {
            id: '2',
            title: 'Événement de test 2',
            start: '2023-01-02T14:00:00',
            end: '2023-01-02T16:00:00',
        }
    ];

    const mockProps = {
        events: mockEvents,
        view: CalendarViewType.MONTH,
        loading: false,
        editable: true,
        selectable: true,
        onEventClick: jest.fn(),
        onEventDrop: jest.fn(),
        onEventResize: jest.fn(),
        onDateSelect: jest.fn(),
        onViewChange: jest.fn(),
        onDateRangeChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('rend FullCalendar avec les bonnes props', () => {
        render(<CalendarGrid {...mockProps} />);

        expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
        expect(screen.getByText(/view: dayGridMonth/i)).toBeInTheDocument();
        expect(screen.getByText(/events: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/editable: true/i)).toBeInTheDocument();
        expect(screen.getByText(/selectable: true/i)).toBeInTheDocument();
    });

    test('affiche le loader quand loading est true', () => {
        render(<CalendarGrid {...mockProps} loading={true} />);

        expect(screen.getByText(/loading: true/i)).toBeInTheDocument();
        // Vérifier que l'indicateur de chargement est présent
        expect(screen.getByTestId('fullcalendar-mock').parentElement).toHaveClass('relative');
        // La div spinner devrait être présente
        expect(screen.getByText(/loading: true/i).parentElement?.parentElement?.querySelector('.animate-spin')).toBeTruthy();
    });

    test('appelle onEventClick quand un événement est cliqué', () => {
        render(<CalendarGrid {...mockProps} />);

        const eventClickButton = screen.getByText('Simulate Event Click');
        eventClickButton.click();

        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onEventClick).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            title: 'Test Event'
        }));
    });

    test('appelle onDateRangeChange quand les dates changent', () => {
        render(<CalendarGrid {...mockProps} />);

        const datesSetButton = screen.getByText('Simulate Dates Set');
        datesSetButton.click();

        expect(mockProps.onDateRangeChange).toHaveBeenCalledTimes(1);
        expect(mockProps.onDateRangeChange).toHaveBeenCalledWith(
            expect.any(Date),
            expect.any(Date)
        );
    });

    test('fonctionne avec des événements vides', () => {
        render(<CalendarGrid {...mockProps} events={[]} />);

        expect(screen.getByText(/events: 0/i)).toBeInTheDocument();
    });

    test('utilise la hauteur par défaut si non spécifiée', () => {
        render(<CalendarGrid {...mockProps} />);

        const container = screen.getByTestId('fullcalendar-mock').parentElement;
        expect(container).toHaveStyle({ minHeight: '500px' });
    });
}); 