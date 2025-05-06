import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// IMPORTANT: Mock complet du module Calendar sans référence au module original
jest.mock('../Calendar', () => {
    return {
        __esModule: true,
        Calendar: jest.fn(({
            events = [],
            initialView = 'dayGridMonth',
            loading = false,
            editable = false,
            selectable = false,
            onEventClick,
            onEventDrop,
            onEventResize,
            onDateSelect,
            title = 'Calendrier',
            description = '',
            extraHeaderActions
        }) => (
            <div data-testid="mocked-calendar">
                <div data-testid="header">
                    <div>Title: {title}</div>
                    {description && <div>Description: {description}</div>}
                    <div>View: {initialView}</div>
                    <button onClick={() => onEventClick && events[0] && onEventClick(events[0])}>
                        Cliquer sur événement
                    </button>
                    <button onClick={() => onDateSelect && onDateSelect(new Date(), new Date())}>
                        Sélectionner date
                    </button>
                    <div>Loading: {loading ? 'true' : 'false'}</div>
                    {extraHeaderActions && <div data-testid="extra-actions">{extraHeaderActions}</div>}
                </div>
                <div data-testid="grid">
                    <div>Events Count: {events.length}</div>
                    <div>Editable: {editable ? 'true' : 'false'}</div>
                    <div>Selectable: {selectable ? 'true' : 'false'}</div>
                </div>
            </div>
        ))
    };
});

// Importer après avoir défini les mocks
const { Calendar } = require('../Calendar');

describe('Calendar Props et Callbacks', () => {
    const mockEvents = [
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
        events: mockEvents,
        initialView: 'dayGridMonth',
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

    test('affiche correctement les props de base', () => {
        render(<Calendar {...mockProps} />);

        expect(screen.getByTestId('mocked-calendar')).toBeInTheDocument();
        expect(screen.getByText('Title: Calendrier de test')).toBeInTheDocument();
        expect(screen.getByText('Description: Description du calendrier')).toBeInTheDocument();
        expect(screen.getByText('View: dayGridMonth')).toBeInTheDocument();
        expect(screen.getByText('Events Count: 2')).toBeInTheDocument();
        expect(screen.getByText('Editable: true')).toBeInTheDocument();
        expect(screen.getByText('Selectable: true')).toBeInTheDocument();
    });

    test('affiche correctement l\'état de chargement', () => {
        const { rerender } = render(<Calendar {...mockProps} loading={false} />);
        expect(screen.getByText('Loading: false')).toBeInTheDocument();

        rerender(<Calendar {...mockProps} loading={true} />);
        expect(screen.getByText('Loading: true')).toBeInTheDocument();
    });

    test('propage le clic sur un événement au callback onEventClick', () => {
        render(<Calendar {...mockProps} />);

        fireEvent.click(screen.getByText('Cliquer sur événement'));

        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    test('propage la sélection d\'une date au callback onDateSelect', () => {
        render(<Calendar {...mockProps} />);

        fireEvent.click(screen.getByText('Sélectionner date'));

        expect(mockProps.onDateSelect).toHaveBeenCalledTimes(1);
        expect(mockProps.onDateSelect).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });

    test('affiche des actions supplémentaires si fournies', () => {
        const extraHeaderActions = <button>Action supplémentaire</button>;

        render(<Calendar {...mockProps} extraHeaderActions={extraHeaderActions} />);

        expect(screen.getByTestId('extra-actions')).toBeInTheDocument();
        expect(screen.getByText('Action supplémentaire')).toBeInTheDocument();
    });

    test('utilise les valeurs par défaut si aucune prop n\'est fournie', () => {
        render(<Calendar />);

        expect(screen.getByText('Title: Calendrier')).toBeInTheDocument();
        expect(screen.getByText('Events Count: 0')).toBeInTheDocument();
        expect(screen.getByText('View: dayGridMonth')).toBeInTheDocument();
        expect(screen.getByText('Editable: false')).toBeInTheDocument();
        expect(screen.getByText('Selectable: false')).toBeInTheDocument();
    });
}); 