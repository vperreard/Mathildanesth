import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarLoading } from '../CalendarLoading';

describe('CalendarLoading', () => {
    test('affiche correctement l\'indicateur de chargement', () => {
        render(<CalendarLoading />);

        // Vérifier que le spinner est présent
        const spinnerElement = document.querySelector('.animate-spin');
        expect(spinnerElement).toBeInTheDocument();

        // Vérifier que le texte de chargement est présent (caché visuellement mais accessible)
        expect(screen.getByText('Chargement...')).toBeInTheDocument();
        expect(screen.getByText('Chargement...')).toHaveClass('sr-only');
    });

    test('a la bonne structure et style', () => {
        render(<CalendarLoading />);

        // Vérifier la structure du composant
        const container = document.querySelector('.relative');
        expect(container).toHaveClass('flex');
        expect(container).toHaveClass('items-center');
        expect(container).toHaveClass('justify-center');
        expect(container).toHaveClass('bg-white/80');
        expect(container).toHaveClass('rounded-lg');
    });
}); 