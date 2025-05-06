import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarDay } from '../CalendarDay';
// Importer le type de base si nécessaire, mais utiliser une interface locale pour les tests
// import { AnyCalendarEvent } from '@/modules/calendar/types/event'; 

// Interface locale pour les données de test incluant extendedProps
interface TestCalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    extendedProps?: { [key: string]: any }; // Garder flexible pour les tests
}

// Données de test
const testDate = new Date(2023, 0, 15);
const testEvents: TestCalendarEvent[] = [
    {
        id: 'allday',
        title: 'Événement toute la journée',
        start: '2023-01-15',
        end: '2023-01-15',
        allDay: true,
        extendedProps: { type: 'leave', color: '#4f46e5' }
    },
    {
        id: '1',
        title: 'Événement 1',
        start: '2023-01-15T09:00:00',
        end: '2023-01-15T10:00:00',
        extendedProps: { type: 'assignment', color: '#4299e1' }
    },
    {
        id: '2',
        title: 'Événement 2',
        start: '2023-01-15T11:00:00',
        end: '2023-01-15T12:00:00',
        extendedProps: { type: 'assignment', color: '#48bb78' }
    },
    {
        id: '3',
        title: 'Événement 3 caché',
        start: '2023-01-15T14:00:00',
        end: '2023-01-15T15:00:00',
        extendedProps: { type: 'assignment', color: '#ecc94b' }
    },
];

const mockProps = {
    date: testDate,
    events: testEvents,
    maxVisibleEvents: 2,
    isCurrentMonth: true,
    onClick: jest.fn(),
    onEventClick: jest.fn(),
};

describe('CalendarDay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('affiche correctly la date et les événements', () => {
        // Utiliser les données de test typées localement
        render(<CalendarDay {...mockProps} events={testEvents.slice(0, 2) as any} maxVisibleEvents={5} />); // Caster en any si CalendarDay attend un type spécifique
        // @ts-ignore
        expect(screen.getByText('15')).toBeInTheDocument();
        // @ts-ignore
        expect(screen.getByText('dimanche')).toBeInTheDocument();
        // @ts-ignore
        expect(screen.getByText('Événement toute la journée')).toBeInTheDocument();
        // @ts-ignore
        expect(screen.getByText('Événement 1')).toBeInTheDocument();
    });

    it('limite le nombre d\'événements visibles', () => {
        render(<CalendarDay {...mockProps} events={testEvents as any} />); // Caster en any
        // @ts-ignore
        expect(screen.getByText('Événement toute la journée')).toBeInTheDocument();
        // @ts-ignore
        expect(screen.getByText('Événement 1')).toBeInTheDocument();
        // @ts-ignore
        expect(screen.queryByText('Événement 2')).not.toBeInTheDocument();
        // @ts-ignore
        expect(screen.queryByText('Événement 3 caché')).not.toBeInTheDocument();
        // @ts-ignore
        expect(screen.getByText(/\+ 2 autre(s)?/i)).toBeInTheDocument();
    });

    it('applique les styles pour le jour hors mois', () => {
        const { rerender } = render(<CalendarDay {...mockProps} events={testEvents as any} isCurrentMonth={true} />);
        // @ts-ignore
        expect(screen.getByText('15').parentElement?.parentElement).not.toHaveClass('text-gray-400');
        rerender(<CalendarDay {...mockProps} events={testEvents as any} isCurrentMonth={false} />);
        // @ts-ignore
        expect(screen.getByText('15').parentElement?.parentElement).toHaveClass('text-gray-400');
    });

    it('appelle onClick quand la cellule du jour est cliquée', () => {
        render(<CalendarDay {...mockProps} events={testEvents as any} />);
        const dayCell = screen.getByText('15').parentElement?.parentElement;
        if (dayCell) {
            fireEvent.click(dayCell);
        }
        // @ts-ignore
        expect(mockProps.onClick).toHaveBeenCalledWith(testDate);
    });

    it('appelle onEventClick quand un événement est cliqué', () => {
        render(<CalendarDay {...mockProps} events={testEvents as any} />);
        const eventElement = screen.getByText('Événement 1');
        fireEvent.click(eventElement);

        // @ts-ignore
        expect(mockProps.onEventClick).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(mockProps.onEventClick).toHaveBeenCalledWith(
            expect.objectContaining({
                id: testEvents[1].id,
                title: testEvents[1].title,
                extendedProps: expect.objectContaining({ type: 'assignment' })
            }),
            expect.anything()
        );
        // @ts-ignore
        expect(mockProps.onClick).not.toHaveBeenCalled();
    });
}); 