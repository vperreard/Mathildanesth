import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
    expectToBeInDocument,
    expectToHaveTextContent,
    expectToHaveBeenCalled,
} from './assertions';

// Composant simple pour le test
const TestComponent: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div>
        <h1>Titre de test</h1>
        <button onClick={onClick}>Cliquez-moi</button>
    </div>
);

describe('Test des assertions personnalisées', () => {
    it('devrait fonctionner avec les assertions personnalisées', () => {
        const mockOnClick = jest.fn();
        render(<TestComponent onClick={mockOnClick} />);

        // Utilisation de nos fonctions personnalisées au lieu des assertions directes
        const heading = screen.getByText('Titre de test');
        expectToBeInDocument(heading);
        expectToHaveTextContent(heading, 'Titre de test');

        // On peut encore utiliser screen et d'autres utilitaires RTL normalement
        const button = screen.getByText('Cliquez-moi');
        button.click();

        // Assertion sur le mock avec notre fonction personnalisée
        expectToHaveBeenCalled(mockOnClick);

        // Ceci fonctionnera toujours en runtime, mais TypeScript montrera des erreurs
        // expect(button).toBeInTheDocument(); // Erreur de typage
    });
}); 