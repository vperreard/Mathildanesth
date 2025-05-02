import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarDay } from '../CalendarDay';

describe('CalendarDay', () => {
    // Date de test : 15 janvier 2023
    const testDate = new Date(2023, 0, 15);

    // Événements de test
    const testEvents = [
        {
            id: '1',
            title: 'Événement 1',
            start: '2023-01-15T09:00:00',
            end: '2023-01-15T10:00:00',
            backgroundColor: '#4299e1',
            borderColor: '#3182ce',
            textColor: 'white'
        },
        {
            id: '2',
            title: 'Événement 2',
            start: '2023-01-15T11:00:00',
            end: '2023-01-15T12:00:00'
        },
        {
            id: '3',
            title: 'Événement toute la journée',
            start: '2023-01-15',
            end: '2023-01-15',
            allDay: true
        },
        {
            id: '4',
            title: 'Événement supplémentaire',
            start: '2023-01-15T14:00:00',
            end: '2023-01-15T15:00:00'
        }
    ];

    const mockProps = {
        date: testDate,
        events: testEvents,
        onClick: jest.fn(),
        onEventClick: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche correctement la date', () => {
        render(<CalendarDay {...mockProps} />);

        // Vérifier que le numéro du jour est affiché
        expect(screen.getByText('15')).toBeInTheDocument();

        // Vérifier que le nom du jour est affiché
        expect(screen.getByText(/dimanche/i)).toBeInTheDocument();
    });

    test('limite le nombre d\'événements visibles', () => {
        render(<CalendarDay {...mockProps} maxVisibleEvents={2} />);

        // Vérifier que seuls les deux premiers événements sont visibles
        expect(screen.getByText('Événement 1')).toBeInTheDocument();
        expect(screen.getByText('Événement 2')).toBeInTheDocument();

        // Vérifier que le troisième événement n'est pas visible directement
        expect(screen.queryByText('Événement toute la journée')).not.toBeInTheDocument();

        // Vérifier qu'un indicateur "+2 autres" est affiché (pour les 2 événements masqués)
        expect(screen.getByText(/\+ 2 autres/i)).toBeInTheDocument();
    });

    test('applique des styles différents pour les événements allDay', () => {
        // Recréer le composant avec un seul événement allDay
        const allDayEvent = [testEvents[2]]; // l'événement "Événement toute la journée"

        render(<CalendarDay {...mockProps} events={allDayEvent} />);

        // Vérifier que l'événement est affiché sans heure
        expect(screen.getByText('Événement toute la journée')).toBeInTheDocument();

        // S'assurer qu'aucune heure n'est affichée
        const eventElement = screen.getByText('Événement toute la journée');
        const eventContainer = eventElement.closest('.text-xs');
        expect(eventContainer?.textContent).not.toMatch(/\d{2}:\d{2}/);
    });

    test('applique des styles spéciaux pour les jours du mois courant vs hors mois', () => {
        // Rendu avec isCurrentMonth=true (par défaut)
        const { rerender } = render(<CalendarDay {...mockProps} />);

        let dayElement = screen.getByText('15').closest('.calendar-day');
        expect(dayElement).toHaveClass('bg-white');

        // Rendu avec isCurrentMonth=false
        rerender(<CalendarDay {...mockProps} isCurrentMonth={false} />);

        dayElement = screen.getByText('15').closest('.calendar-day');
        expect(dayElement).toHaveClass('bg-gray-50');
        expect(dayElement).toHaveClass('text-gray-400');
    });

    test('applique des styles spéciaux pour les week-ends', () => {
        render(<CalendarDay {...mockProps} isWeekend={true} />);

        const dayElement = screen.getByText('15').closest('.calendar-day');
        expect(dayElement).toHaveClass('bg-gray-50');
    });

    test('applique des styles spéciaux pour les jours fériés', () => {
        render(<CalendarDay {...mockProps} isHoliday={true} />);

        const dayElement = screen.getByText('15').closest('.calendar-day');
        expect(dayElement).toHaveClass('bg-red-50');
    });

    test('appelle onClick quand la cellule du jour est cliquée', () => {
        render(<CalendarDay {...mockProps} />);

        const dayElement = screen.getByText('15').closest('.calendar-day');

        if (dayElement) {
            fireEvent.click(dayElement);
        }

        expect(mockProps.onClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onClick).toHaveBeenCalledWith(testDate);
    });

    test('appelle onEventClick quand un événement est cliqué', () => {
        render(<CalendarDay {...mockProps} />);

        const eventElement = screen.getByText('Événement 1');
        fireEvent.click(eventElement);

        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onEventClick).toHaveBeenCalledWith(testEvents[0], expect.anything());

        // Vérifier que onClick du jour n'est pas appelé quand on clique sur un événement
        expect(mockProps.onClick).not.toHaveBeenCalled();
    });

    test('n\'affiche pas le nom du jour en vue journalière', () => {
        render(<CalendarDay {...mockProps} currentView="day" />);

        // Le nom du jour (dimanche) ne devrait pas être visible en vue journalière
        expect(screen.queryByText(/dimanche/i)).not.toBeInTheDocument();
    });

    test('trie les événements par heure de début', () => {
        // Événements non triés
        const unsortedEvents = [
            {
                id: '1',
                title: 'Événement à 14h',
                start: '2023-01-15T14:00:00',
                end: '2023-01-15T15:00:00'
            },
            {
                id: '2',
                title: 'Événement à 9h',
                start: '2023-01-15T09:00:00',
                end: '2023-01-15T10:00:00'
            }
        ];

        render(<CalendarDay date={testDate} events={unsortedEvents} />);

        // Vérifier l'ordre des événements dans le DOM
        const eventElements = screen.getAllByText(/Événement à/);
        expect(eventElements.length).toBe(2);

        // Le premier événement doit être celui de 9h, car ils sont triés
        expect(eventElements[0].textContent).toContain('Événement à 9h');
    });
}); 