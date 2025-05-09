/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarFiltersComponent } from '../CalendarFilters';
import { CalendarEventType, CalendarFilters } from '../../types/event';

// Mock des types pour éviter de dépendre de l'implémentation des types
jest.mock('../../types/event', () => ({
    CalendarEventType: {
        LEAVE: 'LEAVE',
        DUTY: 'DUTY',
        ASSIGNMENT: 'ASSIGNMENT',
        MEETING: 'MEETING',
        TRAINING: 'TRAINING',
        ON_CALL: 'ON_CALL',
        HOLIDAY: 'HOLIDAY',
        OTHER: 'OTHER'
    }
}));

describe('CalendarFilters', () => {
    const mockOnFilterChange = jest.fn();

    const defaultFilters: CalendarFilters = {
        eventTypes: [CalendarEventType.LEAVE, CalendarEventType.DUTY],
        searchTerm: '',
        userIds: [],
        userRoles: [],
        leaveTypes: [],
        leaveStatuses: [],
        locationIds: [],
        teamIds: [],
        specialtyIds: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('rend correctement le composant avec les filtres par défaut', () => {
        render(
            <CalendarFiltersComponent
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );

        // Vérifier que la barre de recherche est présente
        expect(screen.getByPlaceholderText('Rechercher...')).toBeTruthy();

        // Vérifier que les boutons de filtre de type d'événement sont présents
        const leaveButton = screen.getByText(/congés/i);
        const dutyButton = screen.getByText(/gardes/i);

        // Les filtres activés doivent avoir une classe spécifique
        expect(leaveButton).toHaveClass('bg-blue-100');
        expect(dutyButton).toHaveClass('bg-blue-100');
    });

    test('appelle onFilterChange quand le terme de recherche change', () => {
        render(
            <CalendarFiltersComponent
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Rechercher...');
        fireEvent.change(searchInput, { target: { value: 'test search' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({ searchTerm: 'test search' })
        );
    });

    test('ajoute et supprime correctement un type d\'événement quand on clique sur le bouton', () => {
        // Rendre le composant avec tous les types disponibles pour s'assurer que MEETING est visible
        const availableTypes = [
            CalendarEventType.LEAVE,
            CalendarEventType.DUTY,
            CalendarEventType.ASSIGNMENT,
            CalendarEventType.MEETING
        ];

        render(
            <CalendarFiltersComponent
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
                availableEventTypes={availableTypes}
            />
        );

        // Cliquer sur un filtre déjà actif (LEAVE)
        const leaveButton = screen.getByText(/congés/i);
        fireEvent.click(leaveButton);

        // Vérifier que le filtre a été supprimé
        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
                eventTypes: [CalendarEventType.DUTY]  // Seul DUTY reste
            })
        );

        mockOnFilterChange.mockClear();

        // Cliquer sur un filtre inactif (MEETING)
        const meetingButton = screen.getByText(/rendez-vous/i);
        fireEvent.click(meetingButton);

        // Vérifier que le filtre a été ajouté
        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
                eventTypes: expect.arrayContaining([CalendarEventType.DUTY, CalendarEventType.MEETING])
            })
        );
    });

    test('n\'affiche pas la barre de recherche quand showSearchTerm est false', () => {
        render(
            <CalendarFiltersComponent
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
                showSearchTerm={false}
            />
        );

        expect(screen.queryByPlaceholderText('Rechercher...')).toBeNull();
    });

    test('réinitialise tous les filtres quand on clique sur le bouton réinitialiser', () => {
        render(
            <CalendarFiltersComponent
                filters={{
                    ...defaultFilters,
                    searchTerm: 'test',
                    userIds: ['user1', 'user2'],
                    leaveTypes: ['type1']
                }}
                onFilterChange={mockOnFilterChange}
            />
        );

        const resetButton = screen.getByText(/réinitialiser/i);
        fireEvent.click(resetButton);

        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
                eventTypes: expect.any(Array),
                searchTerm: '',
                userIds: [],
                userRoles: [],
                leaveTypes: [],
                leaveStatuses: [],
                locationIds: [],
                teamIds: [],
                specialtyIds: []
            })
        );
    });

    test('utilise les availableEventTypes fournis', () => {
        const customAvailableTypes = [CalendarEventType.LEAVE, CalendarEventType.MEETING];

        render(
            <CalendarFiltersComponent
                filters={{
                    ...defaultFilters,
                    eventTypes: [CalendarEventType.LEAVE] // S'assurer que seul LEAVE est actif
                }}
                onFilterChange={mockOnFilterChange}
                availableEventTypes={customAvailableTypes}
            />
        );

        // Vérifier que seuls les types disponibles sont affichés
        expect(screen.getByText(/congés/i)).toBeTruthy();
        expect(screen.getByText(/rendez-vous/i)).toBeTruthy();
        expect(screen.queryByText(/gardes/i)).toBeNull();
        expect(screen.queryByText(/formation/i)).toBeNull();
    });
}); 