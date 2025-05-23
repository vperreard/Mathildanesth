import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarEvent, EventType } from '../CalendarEvent';

describe('CalendarEvent', () => {
    // Événement de test de base
    const baseEvent = {
        id: '1',
        title: 'Réunion d\'équipe',
        start: '2023-01-15T10:00:00',
        end: '2023-01-15T11:00:00',
        description: 'Discussion des objectifs hebdomadaires',
        extendedProps: {
            type: EventType.MEETING
        }
    };

    const mockProps = {
        event: baseEvent,
        onClick: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche correctement le titre et les horaires de l\'événement', () => {
        render(<CalendarEvent {...mockProps} />);

        // Vérifier que le titre est affiché
        expect(screen.getByText('Réunion d\'équipe')).toBeInTheDocument();

        // Vérifier que les horaires sont affichés
        expect(screen.getByText(/15\/01\/2023 10:00 - 15\/01\/2023 11:00/)).toBeInTheDocument();
    });

    test('affiche la description si elle est fournie', () => {
        render(<CalendarEvent {...mockProps} />);

        expect(screen.getByText('Discussion des objectifs hebdomadaires')).toBeInTheDocument();
    });

    test('n\'affiche pas la description si elle n\'est pas fournie', () => {
        const eventWithoutDescription = {
            ...baseEvent,
            description: undefined
        };

        render(<CalendarEvent event={eventWithoutDescription} />);

        expect(screen.queryByText('Discussion des objectifs hebdomadaires')).not.toBeInTheDocument();
    });

    test('appelle onClick quand l\'événement est cliqué', () => {
        render(<CalendarEvent {...mockProps} />);

        const eventElement = screen.getByText('Réunion d\'équipe');
        const eventContainer = eventElement.closest('.calendar-event');

        if (eventContainer) {
            fireEvent.click(eventContainer);
        }

        expect(mockProps.onClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onClick).toHaveBeenCalledWith(baseEvent);
    });

    test('applique les couleurs fournies dans l\'événement', () => {
        const coloredEvent = {
            ...baseEvent,
            backgroundColor: '#ff0000',
            borderColor: '#cc0000',
            textColor: '#ffffff'
        };

        render(<CalendarEvent event={coloredEvent} />);

        const eventContainer = screen.getByText('Réunion d\'équipe').closest('.calendar-event');

        expect(eventContainer).toHaveStyle({
            backgroundColor: '#ff0000',
            borderLeft: '4px solid #cc0000',
            color: '#ffffff'
        });
    });

    test('utilise les couleurs par défaut basées sur le type d\'événement', () => {
        // Événement sans couleurs spécifiées
        render(<CalendarEvent {...mockProps} />);

        const eventContainer = screen.getByText('Réunion d\'équipe').closest('.calendar-event');

        // Les couleurs par défaut pour le type MEETING doivent être appliquées
        expect(eventContainer).toHaveStyle({
            borderLeft: expect.stringContaining('#ed64a6') // couleur de bordure par défaut pour MEETING
        });
    });

    test('affiche un statut si fourni', () => {
        const eventWithStatus = {
            ...baseEvent,
            extendedProps: {
                ...baseEvent.extendedProps,
                status: 'APPROVED'
            }
        };

        render(<CalendarEvent event={eventWithStatus} />);

        expect(screen.getByText('Approuvé')).toBeInTheDocument();
    });

    test('n\'affiche pas de statut s\'il n\'est pas fourni', () => {
        render(<CalendarEvent {...mockProps} />);

        expect(screen.queryByText('Approuvé')).not.toBeInTheDocument();
        expect(screen.queryByText('Refusé')).not.toBeInTheDocument();
        expect(screen.queryByText('En attente')).not.toBeInTheDocument();
    });

    test('rend un mode compact quand isCompact est true', () => {
        render(<CalendarEvent {...mockProps} isCompact={true} />);

        const eventContainer = screen.getByText('Réunion d\'équipe').closest('.calendar-event');

        // Vérifier que la classe pour le mode compact est appliquée
        expect(eventContainer).toHaveClass('p-1');
        expect(eventContainer).toHaveClass('text-xs');

        // En mode compact, la description ne devrait pas être affichée
        expect(screen.queryByText('Discussion des objectifs hebdomadaires')).not.toBeInTheDocument();
    });

    test('utilise des styles différents pour les événements toute la journée', () => {
        const allDayEvent = {
            ...baseEvent,
            start: '2023-01-15',
            end: '2023-01-15',
            allDay: true
        };

        render(<CalendarEvent event={allDayEvent} />);

        // Vérifier le format spécial pour les événements toute la journée
        expect(screen.getByText(/Toute la journée: 15\/01\/2023/)).toBeInTheDocument();
    });

    test('n\'affiche pas les horaires quand showTime est false', () => {
        render(<CalendarEvent {...mockProps} showTime={false} />);

        // Les horaires ne devraient pas être affichés
        expect(screen.queryByText(/15\/01\/2023 10:00 - 15\/01\/2023 11:00/)).not.toBeInTheDocument();
    });

    test('affiche l\'icône correspondant au type d\'événement', () => {
        const { rerender } = render(<CalendarEvent {...mockProps} />);

        // Pour le type MEETING, on devrait voir l'icône 👥
        const eventTitle = screen.getByText('Réunion d\'équipe');
        const titleContainer = eventTitle.closest('.flex');
        expect(titleContainer?.textContent).toContain('👥');

        // Tester avec un autre type d'événement
        const leaveEvent = {
            ...baseEvent,
            extendedProps: {
                type: EventType.LEAVE
            }
        };

        rerender(<CalendarEvent event={leaveEvent} />);

        // Pour le type LEAVE, on devrait voir l'icône 🏖️
        const updatedTitleContainer = screen.getByText('Réunion d\'équipe').closest('.flex');
        expect(updatedTitleContainer?.textContent).toContain('🏖️');
    });
}); 