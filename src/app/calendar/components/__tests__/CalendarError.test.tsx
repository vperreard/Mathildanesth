import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarError } from '../CalendarError';

describe('CalendarError', () => {
    const mockError = new Error('Test error message');

    test('affiche le message d\'erreur', () => {
        render(<CalendarError error={mockError} />);

        // Vérifier que le titre d'erreur est présent
        expect(screen.getByText('Erreur calendrier')).toBeInTheDocument();

        // Vérifier que le message d'erreur est affiché
        expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    test('a la bonne structure et style', () => {
        render(<CalendarError error={mockError} />);

        // Vérifier les styles principaux
        const alertContainer = document.querySelector('.bg-red-50');
        expect(alertContainer).toHaveClass('border-l-4');
        expect(alertContainer).toHaveClass('border-red-400');
        expect(alertContainer).toHaveClass('p-4');
        expect(alertContainer).toHaveClass('my-2');
        expect(alertContainer).toHaveClass('rounded-md');

        // Vérifier que l'icône est présente
        const iconElement = document.querySelector('svg');
        expect(iconElement).toBeInTheDocument();
        expect(iconElement).toHaveClass('text-red-400');
    });
}); 