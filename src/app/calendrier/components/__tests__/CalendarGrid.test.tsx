import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';
import { CalendarViewType } from '../CalendarHeader';

// Mock des dépendances FullCalendar simplifié
jest.mock('@fullcalendar/react', () => {
    const React = require('react');
    return function DummyFullCalendar(props: any) {
        // Fonction pour simuler l'appel à datesSet avec la structure complète qui est attendue
        const simulateDatesSet = () => {
            if (props.datesSet) {
                const currentDate = new Date();
                const weekLater = new Date(currentDate);
                weekLater.setDate(currentDate.getDate() + 7);

                // Créer un objet qui simule ce que FullCalendar passerait à datesSet
                props.datesSet({
                    start: currentDate,
                    end: weekLater,
                    view: {
                        currentStart: currentDate,
                        currentEnd: weekLater,
                        type: props.initialView || 'dayGridMonth'
                    }
                });
            }
        };

        // Fonction pour simuler un clic sur un événement
        const simulateEventClick = () => {
            if (props.eventClick && props.events && props.events.length > 0) {
                const event = props.events[0];
                props.eventClick({
                    event: {
                        id: event.id,
                        title: event.title,
                        start: event.start,
                        end: event.end || event.start,
                        allDay: event.allDay || false,
                        extendedProps: event
                    }
                });
            }
        };

        // Création d'un vrai élément DOM avec des attributs data-testid pour les tests
        return React.createElement(
            'div',
            {
                'data-testid': 'fullcalendar-mock',
                className: 'fullcalendar-container'
            },
            // Texte pour le test d'événements
            React.createElement('span', { 'data-testid': 'events-count' }, `Events: ${props.events?.length || 0}`),
            // Bouton pour simuler un changement de dates
            React.createElement('button', {
                'data-testid': 'simulate-dates-set',
                onClick: simulateDatesSet
            }, 'Simulate Dates Set'),
            // Bouton pour simuler un clic sur un événement
            React.createElement('button', {
                'data-testid': 'simulate-event-click',
                onClick: simulateEventClick
            }, 'Simulate Event Click')
        );
    };
});

// Mocks des plugins
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/list', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@fullcalendar/core/locales/fr', () => ({}));

describe('CalendarGrid', () => {
    const mockProps = {
        onDateRangeChange: jest.fn(),
        onEventClick: jest.fn(),
        events: [{ id: '1', title: 'Test 1' }, { id: '2', title: 'Test 2' }],
        view: 'dayGridMonth' as CalendarViewType,
        height: '600px',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("appelle onDateRangeChange quand les dates changent", () => {
        render(<CalendarGrid {...mockProps} />);

        const datesSetButton = screen.getByTestId('simulate-dates-set');
        fireEvent.click(datesSetButton);

        expect(mockProps.onDateRangeChange).toHaveBeenCalledTimes(1);
        // On vérifie que onDateRangeChange est appelé avec deux dates
        expect(mockProps.onDateRangeChange).toHaveBeenCalledWith(
            expect.any(Date),
            expect.any(Date)
        );
    });

    test("affiche le nombre correct d'événements", () => {
        render(<CalendarGrid {...mockProps} events={[]} />);

        // Utiliser getByTestId au lieu de getByText + toBeInTheDocument
        const eventsCount = screen.getByTestId('events-count');
        expect(eventsCount.textContent).toBe('Events: 0');
    });

    test("utilise la hauteur par défaut si non spécifiée", () => {
        render(<CalendarGrid {...mockProps} height={undefined} />);

        // Vérifier directement le style avec getAttribute au lieu de toHaveStyle
        const container = screen.getByTestId('fullcalendar-mock').parentElement;
        expect(container).not.toBeNull();
        expect(container?.style.minHeight).toBe('500px');
    });

    test("affiche l'indicateur de chargement quand loading est true", () => {
        render(<CalendarGrid {...mockProps} loading={true} />);

        // Vérifier la présence du spinner
        const spinnerElement = document.querySelector('.animate-spin');
        expect(spinnerElement).not.toBeNull();
    });

    test("appelle onEventClick quand un événement est cliqué", () => {
        render(<CalendarGrid {...mockProps} />);

        const eventClickButton = screen.getByTestId('simulate-event-click');
        fireEvent.click(eventClickButton);

        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onEventClick).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            title: 'Test 1'
        }));
    });
}); 