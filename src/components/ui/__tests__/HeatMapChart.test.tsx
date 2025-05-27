import React from 'react';
import { render, screen } from '@testing-library/react';
import HeatMapChart from '../HeatMapChart';

// Mock des composants UI
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

jest.mock('@/components/ui/select', () => ({
    Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    SelectValue: ({ ...props }: any) => <span {...props} />,
}));

jest.mock('@/components/ui/skeleton', () => ({
    Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

jest.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
    TooltipProvider: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

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
        description: 'Test Description',
    };

    it('doit rendre correctement avec les props par défaut', () => {
        // Act
        render(<HeatMapChart {...defaultProps} />);

        // Assert
        expect(screen.getByText('Test Heat Map')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        // Le composant custom n'utilise pas responsive-container
        // Vérifier que le composant se rend sans erreur
        expect(screen.getByText('Test Heat Map')).toBeTruthy();
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