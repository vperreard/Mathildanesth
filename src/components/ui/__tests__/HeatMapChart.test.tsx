import React from 'react';
import { render, screen } from '@testing-library/react';
import HeatMapChart from '../HeatMapChart';

// Mock de recharts
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="responsive-container">{children}</div>
        ),
        Tooltip: () => <div data-testid="tooltip" />,
        Legend: () => <div data-testid="legend" />,
        XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
        YAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="y-axis" data-key={dataKey} />,
    };
});

describe('HeatMapChart', () => {
    // Données de test
    const mockData = [
        { x: 'A', y: '1', value: 100 },
        { x: 'B', y: '1', value: 80 },
        { x: 'A', y: '2', value: 60 },
        { x: 'B', y: '2', value: 40 },
    ];

    const defaultProps = {
        data: mockData,
        xAxisLabel: 'X Axis',
        yAxisLabel: 'Y Axis',
        title: 'Test Heat Map',
        colorScale: ['#ff0000', '#00ff00', '#0000ff'],
    };

    it('doit rendre correctement avec les props par défaut', () => {
        // Act
        render(<HeatMapChart {...defaultProps} />);

        // Assert
        expect(screen.getByText('Test Heat Map')).toBeInTheDocument();
        expect(screen.getByText('X Axis')).toBeInTheDocument();
        expect(screen.getByText('Y Axis')).toBeInTheDocument();
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('doit rendre le conteneur sans crasher quand data est vide', () => {
        // Act
        render(<HeatMapChart {...defaultProps} data={[]} />);

        // Assert
        expect(screen.getByText('Test Heat Map')).toBeInTheDocument();
        expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });

    it('doit appliquer la bonne échelle de couleurs', () => {
        // Act
        const { container } = render(
            <HeatMapChart
                {...defaultProps}
                colorScale={['#ff0000', '#00ff00']}
            />
        );

        // Vérifier que l'échelle de couleurs est bien définie
        // Note: C'est difficile de tester cela précisément sans mocks plus profonds de recharts
        // ou sans une approche de snapshot testing
        expect(container).toMatchSnapshot();
    });

    it('doit utiliser des étiquettes d\'axe personnalisées', () => {
        // Act
        render(
            <HeatMapChart
                {...defaultProps}
                xAxisLabel="Custom X"
                yAxisLabel="Custom Y"
            />
        );

        // Assert
        expect(screen.getByText('Custom X')).toBeInTheDocument();
        expect(screen.getByText('Custom Y')).toBeInTheDocument();
    });

    it('doit afficher un titre personnalisé', () => {
        // Act
        render(
            <HeatMapChart
                {...defaultProps}
                title="Titre Personnalisé"
            />
        );

        // Assert
        expect(screen.getByText('Titre Personnalisé')).toBeInTheDocument();
    });

    it('doit utiliser une taille personnalisée si fournie', () => {
        // Act
        const { container } = render(
            <HeatMapChart
                {...defaultProps}
                width={800}
                height={600}
            />
        );

        // Assert - Vérifier que le style est appliqué
        // Pour un test plus précis, on pourrait vérifier les styles appliqués
        expect(container.firstChild).toHaveStyle('width: 800px; height: 600px;');
    });
}); 