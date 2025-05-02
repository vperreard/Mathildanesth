import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar, CalendarViewType } from '../Calendar';

// Mock des composants enfants
jest.mock('../CalendarHeader', () => ({
    CalendarHeader: jest.fn(({ title, description, view, onViewChange, onPrevious, onNext, onToday, extraActions }) => (
        <div data-testid="calendar-header-mock">
            <div>Title: {title}</div>
            {description && <div>Description: {description}</div>}
            <div>View: {view}</div>
            <button onClick={() => onViewChange(CalendarViewType.MONTH)}>Set Month View</button>
            <button onClick={() => onViewChange(CalendarViewType.WEEK)}>Set Week View</button>
            <button onClick={onPrevious}>Previous</button>
            <button onClick={onNext}>Next</button>
            <button onClick={onToday}>Today</button>
            {extraActions && <div data-testid="extra-actions">{extraActions}</div>}
        </div>
    )),
    CalendarViewType
}));

jest.mock('../CalendarGrid', () => ({
    CalendarGrid: jest.fn(({ events, view, loading, editable, selectable, onEventClick, onDateSelect }) => (
        <div data-testid="calendar-grid-mock">
            <div>Events Count: {events.length}</div>
            <div>View: {view}</div>
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>Editable: {editable ? 'true' : 'false'}</div>
            <div>Selectable: {selectable ? 'true' : 'false'}</div>
            <button onClick={() => onEventClick(events[0])}>Click Event</button>
            <button onClick={() => onDateSelect(new Date(), new Date())}>Select Date</button>
        </div>
    ))
}));

describe('Calendar', () => {
    const testEvents = [
        {
            id: '1',
            title: 'Réunion',
            start: '2023-01-01T10:00:00',
            end: '2023-01-01T11:00:00'
        },
        {
            id: '2',
            title: 'Formation',
            start: '2023-01-02T14:00:00',
            end: '2023-01-02T16:00:00'
        }
    ];

    const mockProps = {
        events: testEvents,
        initialView: CalendarViewType.MONTH,
        loading: false,
        editable: true,
        selectable: true,
        onEventClick: jest.fn(),
        onEventDrop: jest.fn(),
        onEventResize: jest.fn(),
        onDateSelect: jest.fn(),
        title: 'Calendrier de test',
        description: 'Description du calendrier'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('rend le CalendarHeader et le CalendarGrid avec les propriétés correctes', () => {
        render(<Calendar {...mockProps} />);

        // Vérifier le header
        const header = screen.getByTestId('calendar-header-mock');
        expect(header).toBeInTheDocument();
        expect(screen.getByText(/title: calendrier de test/i)).toBeInTheDocument();
        expect(screen.getByText(/description: description du calendrier/i)).toBeInTheDocument();

        // Vérifier la grille
        const grid = screen.getByTestId('calendar-grid-mock');
        expect(grid).toBeInTheDocument();
        expect(screen.getByText(/events count: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/view: dayGridMonth/i)).toBeInTheDocument();
        expect(screen.getByText(/editable: true/i)).toBeInTheDocument();
        expect(screen.getByText(/selectable: true/i)).toBeInTheDocument();
    });

    test('utilise la vue initiale correctement', () => {
        const { rerender } = render(<Calendar {...mockProps} initialView={CalendarViewType.WEEK} />);

        // Vérifier que la vue initiale est WEEK
        expect(screen.getByText(/view: timeGridWeek/i)).toBeInTheDocument();

        // Réafficher avec une vue initiale différente
        rerender(<Calendar {...mockProps} initialView={CalendarViewType.DAY} />);

        // Vérifier que la vue initiale est maintenant DAY
        expect(screen.getByText(/view: timeGridDay/i)).toBeInTheDocument();
    });

    test('change la vue quand le bouton de changement de vue est cliqué', () => {
        render(<Calendar {...mockProps} initialView={CalendarViewType.MONTH} />);

        // Initialement en vue MONTH
        expect(screen.getByText(/view: dayGridMonth/i)).toBeInTheDocument();

        // Cliquer sur le bouton pour passer en vue WEEK
        fireEvent.click(screen.getByText('Set Week View'));

        // Vérifier que la vue a changé
        expect(screen.getByText(/view: timeGridWeek/i)).toBeInTheDocument();
    });

    test('propage le clic sur un événement au callback onEventClick', () => {
        render(<Calendar {...mockProps} />);

        // Cliquer sur un événement
        fireEvent.click(screen.getByText('Click Event'));

        // Vérifier que le callback a été appelé
        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onEventClick).toHaveBeenCalledWith(testEvents[0]);
    });

    test('propage la sélection d\'une date au callback onDateSelect', () => {
        render(<Calendar {...mockProps} />);

        // Sélectionner une date
        fireEvent.click(screen.getByText('Select Date'));

        // Vérifier que le callback a été appelé
        expect(mockProps.onDateSelect).toHaveBeenCalledTimes(1);
        expect(mockProps.onDateSelect).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });

    test('affiche correctement l\'état de chargement', () => {
        const { rerender } = render(<Calendar {...mockProps} loading={false} />);

        // Vérifier l'état initial (non chargement)
        expect(screen.getByText(/loading: false/i)).toBeInTheDocument();

        // Réafficher avec l'état de chargement
        rerender(<Calendar {...mockProps} loading={true} />);

        // Vérifier l'état de chargement
        expect(screen.getByText(/loading: true/i)).toBeInTheDocument();
    });

    test('affiche des actions supplémentaires dans le header si fournies', () => {
        const extraHeaderActions = <button>Action supplémentaire</button>;

        render(<Calendar {...mockProps} extraHeaderActions={extraHeaderActions} />);

        // Vérifier que les actions supplémentaires sont affichées
        expect(screen.getByTestId('extra-actions')).toBeInTheDocument();
    });

    test('utilise les valeurs par défaut si aucune prop n\'est fournie', () => {
        // Rendre le composant sans props
        render(<Calendar />);

        // Vérifier que les valeurs par défaut sont utilisées
        expect(screen.getByText(/title: calendrier/i)).toBeInTheDocument(); // titre par défaut
        expect(screen.getByText(/events count: 0/i)).toBeInTheDocument(); // pas d'événements par défaut
        expect(screen.getByText(/view: dayGridMonth/i)).toBeInTheDocument(); // vue par défaut
        expect(screen.getByText(/editable: false/i)).toBeInTheDocument(); // non éditable par défaut
        expect(screen.getByText(/selectable: false/i)).toBeInTheDocument(); // non sélectionnable par défaut
    });
}); 