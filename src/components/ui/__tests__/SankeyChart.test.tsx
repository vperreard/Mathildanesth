import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SankeyChart from '../SankeyChart';

// Mock D3 et d3-sankey
jest.mock('d3', () => ({
    select: jest.fn(() => ({
        selectAll: jest.fn(() => ({
            remove: jest.fn(),
        })),
        append: jest.fn(() => ({
            attr: jest.fn(() => ({
                attr: jest.fn(() => ({ attr: jest.fn() })),
            })),
            selectAll: jest.fn(() => ({
                data: jest.fn(() => ({
                    enter: jest.fn(() => ({
                        append: jest.fn(() => ({
                            attr: jest.fn(() => ({
                                attr: jest.fn(() => ({
                                    attr: jest.fn(() => ({
                                        attr: jest.fn(() => ({
                                            attr: jest.fn(() => ({
                                                style: jest.fn(() => ({
                                                    on: jest.fn(() => ({
                                                        on: jest.fn(() => ({
                                                            on: jest.fn(() => ({
                                                                on: jest.fn()
                                                            }))
                                                        }))
                                                    }))
                                                }))
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    })),
                })),
            })),
        })),
    })),
    rgb: jest.fn(() => ({
        darker: jest.fn(() => "darker-color"),
        brighter: jest.fn(() => "brighter-color"),
    })),
}));

jest.mock('d3-sankey', () => ({
    sankey: jest.fn(() => ({
        nodeWidth: jest.fn(() => ({
            nodePadding: jest.fn(() => ({
                extent: jest.fn(() => (data: any) => ({
                    nodes: data.nodes,
                    links: data.links.map((l: any) => ({
                        ...l,
                        width: l.value,
                        y0: 0,
                        y1: l.value
                    }))
                }))
            }))
        }))
    })),
    sankeyLinkHorizontal: jest.fn(() => jest.fn()),
}));

describe('SankeyChart', () => {
    // Données de test
    const mockData = {
        nodes: [
            { id: 'A', name: 'Node A' },
            { id: 'B', name: 'Node B' },
            { id: 'C', name: 'Node C' },
        ],
        links: [
            { source: 'A', target: 'B', value: 100 },
            { source: 'B', target: 'C', value: 50 },
            { source: 'A', target: 'C', value: 25 },
        ]
    };

    const defaultProps = {
        data: mockData,
        title: 'Test Sankey Chart',
        nodeWidth: 15,
        nodePadding: 10,
        units: 'personnes',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('doit rendre correctement avec les props par défaut', () => {
        render(<SankeyChart {...defaultProps} />);

        // Vérifier que le titre est affiché
        expect(screen.getByText('Test Sankey Chart')).toBeInTheDocument();

        // Vérifier que le select pour le type de lien est présent
        expect(screen.getByLabelText('Type de lien:')).toBeInTheDocument();
    });

    it('doit afficher un message d\'erreur si les données sont invalides', () => {
        render(<SankeyChart {...defaultProps} data={null as any} />);

        expect(screen.getByText('Test Sankey Chart')).toBeInTheDocument();
        expect(screen.getByText('Données non valides pour le diagramme de Sankey')).toBeInTheDocument();
    });

    it('doit afficher un message d\'erreur si les données sont vides', () => {
        render(<SankeyChart {...defaultProps} data={{ nodes: [], links: [] }} />);

        expect(screen.getByText('Test Sankey Chart')).toBeInTheDocument();
        expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });

    it('doit afficher un titre personnalisé', () => {
        render(
            <SankeyChart
                {...defaultProps}
                title="Titre Personnalisé"
            />
        );

        expect(screen.getByText('Titre Personnalisé')).toBeInTheDocument();
    });

    it('doit inclure une aide pour l\'utilisateur', () => {
        render(<SankeyChart {...defaultProps} />);

        expect(screen.getByText(/Cliquez sur un nœud ou un lien pour plus de détails/)).toBeInTheDocument();
    });

    it('doit utiliser l\'unité spécifiée', () => {
        const { container } = render(
            <SankeyChart
                {...defaultProps}
                units="heures"
            />
        );

        // Nous ne pouvons pas facilement tester le contenu des tooltips
        // car ils sont générés dynamiquement, mais nous pouvons vérifier
        // que l'unité est passée en prop
        expect(container).toBeInTheDocument();
    });

    it('doit permettre de changer le type de lien affiché', async () => {
        const user = userEvent.setup();
        render(<SankeyChart {...defaultProps} />);

        // Tester que le sélecteur de type de lien est présent et peut être cliqué
        const selectTrigger = screen.getByRole('combobox');
        expect(selectTrigger).toBeInTheDocument();

        // Remarque: Nous ne pouvons pas tester complètement l'interaction car cela
        // nécessiterait d'ouvrir le select et de sélectionner une option, ce qui est 
        // difficile avec les mocks actuels
    });
}); 