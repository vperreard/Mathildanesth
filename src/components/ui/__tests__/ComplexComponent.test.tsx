import React, { createContext, useContext, useState, useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Déclaration pour étendre les types d'assertion Jest avec testing-library/jest-dom
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveTextContent(text: string | RegExp): R;
            toBeVisible(): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toHaveClass(className: string): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveStyle(style: Record<string, any>): R;
            toHaveValue(value: string | string[] | number): R;
            toBeChecked(): R;
            toBeEmpty(): R;
        }
    }
}

// Créer un context simple
type CounterContextType = {
    count: number;
    increment: () => void;
    decrement: () => void;
};

const CounterContext = createContext<CounterContextType | undefined>(undefined);

// Provider du context
const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [count, setCount] = useState(0);

    const increment = () => setCount(prev => prev + 1);
    const decrement = () => setCount(prev => prev - 1);

    return (
        <CounterContext.Provider value={{ count, increment, decrement }}>
            {children}
        </CounterContext.Provider>
    );
};

// Hook pour utiliser le context
const useCounter = () => {
    const context = useContext(CounterContext);
    if (!context) {
        throw new Error('useCounter doit être utilisé à l\'intérieur d\'un CounterProvider');
    }
    return context;
};

// Composant qui utilise le hook et context
const Counter: React.FC = () => {
    const { count, increment, decrement } = useCounter();
    const [message, setMessage] = useState('');

    useEffect(() => {
        setMessage(count === 0 ? 'Neutre' : count > 0 ? 'Positif' : 'Négatif');
    }, [count]);

    return (
        <div>
            <h2 data-testid="count">{count}</h2>
            <p data-testid="message">{message}</p>
            <button onClick={increment}>Augmenter</button>
            <button onClick={decrement}>Diminuer</button>
        </div>
    );
};

// Tests pour le composant Counter
describe('Counter Component', () => {
    const renderWithProvider = () => {
        return render(
            <CounterProvider>
                <Counter />
            </CounterProvider>
        );
    };

    test('initialisation à zéro avec message "Neutre"', () => {
        renderWithProvider();
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        expect(screen.getByTestId('message')).toHaveTextContent('Neutre');
    });

    test('incrémente correctement le compteur', () => {
        renderWithProvider();
        fireEvent.click(screen.getByText('Augmenter'));
        expect(screen.getByTestId('count')).toHaveTextContent('1');
        expect(screen.getByTestId('message')).toHaveTextContent('Positif');
    });

    test('décrémente correctement le compteur', () => {
        renderWithProvider();
        fireEvent.click(screen.getByText('Diminuer'));
        expect(screen.getByTestId('count')).toHaveTextContent('-1');
        expect(screen.getByTestId('message')).toHaveTextContent('Négatif');
    });

    test('met à jour le message quand le compteur change de signe', () => {
        renderWithProvider();

        // Positif
        fireEvent.click(screen.getByText('Augmenter'));
        expect(screen.getByTestId('message')).toHaveTextContent('Positif');

        // Neutre
        fireEvent.click(screen.getByText('Diminuer'));
        expect(screen.getByTestId('message')).toHaveTextContent('Neutre');

        // Négatif
        fireEvent.click(screen.getByText('Diminuer'));
        expect(screen.getByTestId('message')).toHaveTextContent('Négatif');
    });
}); 