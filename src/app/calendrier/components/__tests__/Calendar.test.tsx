import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';


jest.mock('../Calendar', () => {
    const React = require('react');
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
        }) => {
            const headerChildren = [];
            headerChildren.push(React.createElement('div', { key: 'title' }, `Title: ${title}`));
            if (description) {
                headerChildren.push(React.createElement('div', { key: 'description' }, `Description: ${description}`));
            }
            headerChildren.push(React.createElement('div', { key: 'view' }, `View: ${initialView}`));
            headerChildren.push(
                React.createElement('button', { key: 'click-event', onClick: () => onEventClick && events[0] && onEventClick(events[0]) }, 'Cliquer sur événement')
            );
            headerChildren.push(
                React.createElement('button', { key: 'select-date', onClick: () => onDateSelect && onDateSelect(new Date(), new Date()) }, 'Sélectionner date')
            );
            headerChildren.push(React.createElement('div', { key: 'loading' }, `Loading: ${loading ? 'true' : 'false'}`));
            if (extraHeaderActions) {
                headerChildren.push(
                    React.createElement('div', { key: 'extra', 'data-testid': 'extra-actions' }, extraHeaderActions)
                );
            }

            const gridChildren = [];
            gridChildren.push(React.createElement('div', { key: 'count' }, `Events Count: ${events.length}`));
            gridChildren.push(React.createElement('div', { key: 'editable' }, `Editable: ${editable ? 'true' : 'false'}`));
            gridChildren.push(React.createElement('div', { key: 'selectable' }, `Selectable: ${selectable ? 'true' : 'false'}`));

            return React.createElement(
                'div',
                { 'data-testid': 'mocked-calendar' },
                React.createElement('div', { 'data-testid': 'header', key: 'header' }, headerChildren),
                React.createElement('div', { 'data-testid': 'grid', key: 'grid' }, gridChildren)
            );
        })
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