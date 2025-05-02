import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarHeader, CalendarViewType } from '../CalendarHeader';

describe('CalendarHeader', () => {
    const mockProps = {
        view: CalendarViewType.MONTH,
        currentRange: {
            start: new Date(2023, 0, 1), // 1er janvier 2023
            end: new Date(2023, 0, 31)   // 31 janvier 2023
        },
        onViewChange: jest.fn(),
        onPrevious: jest.fn(),
        onNext: jest.fn(),
        onToday: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le titre et la description correctement', () => {
        const title = 'Titre de test';
        const description = 'Description de test';

        render(
            <CalendarHeader
                {...mockProps}
                title={title}
                description={description}
            />
        );

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
    });

    test('affiche la plage de dates correctement en format mois', () => {
        render(<CalendarHeader {...mockProps} />);

        // Pour janvier 2023 en français
        expect(screen.getByText(/janvier 2023/i)).toBeInTheDocument();
    });

    test('appelle onPrevious quand le bouton précédent est cliqué', () => {
        render(<CalendarHeader {...mockProps} />);

        const previousButton = screen.getByLabelText(/période précédente/i);
        fireEvent.click(previousButton);

        expect(mockProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    test('appelle onNext quand le bouton suivant est cliqué', () => {
        render(<CalendarHeader {...mockProps} />);

        const nextButton = screen.getByLabelText(/période suivante/i);
        fireEvent.click(nextButton);

        expect(mockProps.onNext).toHaveBeenCalledTimes(1);
    });

    test('appelle onToday quand le bouton Aujourd\'hui est cliqué', () => {
        render(<CalendarHeader {...mockProps} />);

        const todayButton = screen.getByText(/aujourd'hui/i);
        fireEvent.click(todayButton);

        expect(mockProps.onToday).toHaveBeenCalledTimes(1);
    });

    test('appelle onViewChange avec la bonne vue quand un bouton de vue est cliqué', () => {
        render(<CalendarHeader {...mockProps} />);

        // Cliquer sur le bouton de vue semaine
        const weekButton = screen.getByText(/semaine/i);
        fireEvent.click(weekButton);

        expect(mockProps.onViewChange).toHaveBeenCalledWith(CalendarViewType.WEEK);

        // Cliquer sur le bouton de vue jour
        const dayButton = screen.getByText(/jour/i);
        fireEvent.click(dayButton);

        expect(mockProps.onViewChange).toHaveBeenCalledWith(CalendarViewType.DAY);
    });

    test('met en évidence la vue active', () => {
        const { rerender } = render(<CalendarHeader {...mockProps} />);

        // En mode MONTH, le bouton Mois devrait être mis en évidence
        const monthButton = screen.getByText(/mois/i);
        expect(monthButton.className).toContain('bg-blue-50');

        // Recréer avec une vue différente
        rerender(
            <CalendarHeader
                {...mockProps}
                view={CalendarViewType.WEEK}
            />
        );

        // En mode WEEK, le bouton Semaine devrait être mis en évidence
        const weekButton = screen.getByText(/semaine/i);
        expect(weekButton.className).toContain('bg-blue-50');
    });

    test('affiche les actions supplémentaires quand elles sont fournies', () => {
        const extraActions = <button>Action supplémentaire</button>;

        render(
            <CalendarHeader
                {...mockProps}
                extraActions={extraActions}
            />
        );

        expect(screen.getByText(/action supplémentaire/i)).toBeInTheDocument();
    });

    test('ne montre pas le sélecteur de vue quand showViewSelector est false', () => {
        render(
            <CalendarHeader
                {...mockProps}
                showViewSelector={false}
            />
        );

        expect(screen.queryByText(/mois/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/semaine/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jour/i)).not.toBeInTheDocument();
    });

    test('ne montre pas la plage de dates quand showDateRange est false', () => {
        render(
            <CalendarHeader
                {...mockProps}
                showDateRange={false}
            />
        );

        expect(screen.queryByText(/janvier 2023/i)).not.toBeInTheDocument();
    });
}); 