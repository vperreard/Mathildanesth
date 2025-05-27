// Tests E2E pour les visualisations avancées de simulation

describe('Visualisations Avancées de Simulation', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/simulations/avances-visualizations');
    });

    describe('Tableau de bord des visualisations', () => {
        it('devrait afficher tous les types de graphiques', () => {
            cy.get('[data-testid="visualization-dashboard"]').should('be.visible');
            
            // Vérifier la présence des différents graphiques
            cy.get('[data-testid="workload-heatmap"]').should('exist');
            cy.get('[data-testid="timeline-gantt"]').should('exist');
            cy.get('[data-testid="resource-utilization-chart"]').should('exist');
            cy.get('[data-testid="conflicts-radar"]').should('exist');
            cy.get('[data-testid="efficiency-metrics"]').should('exist');
        });

        it('devrait permettre de filtrer les données par période', () => {
            cy.get('[data-testid="date-range-picker"]').within(() => {
                cy.get('[data-testid="start-date"]').clear().type('2024-01-01');
                cy.get('[data-testid="end-date"]').clear().type('2024-01-31');
                cy.get('[data-testid="apply-filter"]').click();
            });

            cy.get('[data-testid="loading-indicator"]').should('not.exist');
            cy.get('[data-testid="data-updated-indicator"]').should('be.visible');
        });

        it('devrait permettre de filtrer par site', () => {
            cy.get('[data-testid="site-filter"]').select('Site Principal');
            cy.get('[data-testid="loading-indicator"]').should('not.exist');
            
            // Vérifier que les données sont mises à jour
            cy.get('[data-testid="site-label"]').should('contain', 'Site Principal');
        });
    });

    describe('Carte de chaleur de charge de travail', () => {
        it('devrait afficher la répartition de la charge par utilisateur et jour', () => {
            cy.get('[data-testid="workload-heatmap"]').should('be.visible');
            
            // Vérifier les axes
            cy.get('[data-testid="heatmap-x-axis"]').should('contain.text', 'Jours');
            cy.get('[data-testid="heatmap-y-axis"]').should('contain.text', 'Utilisateurs');
            
            // Vérifier la légende
            cy.get('[data-testid="heatmap-legend"]').should('exist');
        });

        it('devrait permettre de zoomer sur une période spécifique', () => {
            cy.get('[data-testid="workload-heatmap"]').trigger('mousedown', 100, 100);
            cy.get('[data-testid="workload-heatmap"]').trigger('mousemove', 200, 150);
            cy.get('[data-testid="workload-heatmap"]').trigger('mouseup');

            cy.get('[data-testid="zoom-controls"]').should('be.visible');
            cy.get('[data-testid="reset-zoom"]').should('exist');
        });

        it('devrait afficher les détails au survol', () => {
            cy.get('[data-testid="heatmap-cell"]').first().trigger('mouseover');
            
            cy.get('[data-testid="tooltip"]').should('be.visible');
            cy.get('[data-testid="tooltip"]').should('contain', 'Utilisateur:');
            cy.get('[data-testid="tooltip"]').should('contain', 'Date:');
            cy.get('[data-testid="tooltip"]').should('contain', 'Charge:');
        });
    });

    describe('Diagramme de Gantt temporel', () => {
        it('devrait afficher la timeline des assignations', () => {
            cy.get('[data-testid="timeline-gantt"]').should('be.visible');
            
            // Vérifier les barres de tâches
            cy.get('[data-testid="gantt-task"]').should('have.length.greaterThan', 0);
            
            // Vérifier l\'axe temporel
            cy.get('[data-testid="gantt-timeline"]').should('exist');
        });

        it('devrait permettre de naviguer dans le temps', () => {
            cy.get('[data-testid="timeline-navigation"]').within(() => {
                cy.get('[data-testid="prev-week"]').click();
                cy.get('[data-testid="current-week"]').should('exist');
                cy.get('[data-testid="next-week"]').click();
            });
        });

        it('devrait afficher les conflits sur la timeline', () => {
            cy.get('[data-testid="show-conflicts-toggle"]').check();
            
            cy.get('[data-testid="conflict-indicator"]').should('be.visible');
            cy.get('[data-testid="conflict-indicator"]').should('have.class', 'conflict-warning');
        });

        it('devrait permettre de modifier les assignations par drag & drop', () => {
            cy.get('[data-testid="gantt-task"]').first().as('task');
            
            cy.get('@task').trigger('dragstart');
            cy.get('[data-testid="gantt-drop-zone"]').trigger('drop');
            
            cy.get('[data-testid="confirm-change-modal"]').should('be.visible');
            cy.get('[data-testid="confirm-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Assignation modifiée');
        });
    });

    describe('Graphique d\'utilisation des ressources', () => {
        it('devrait afficher l\'utilisation par type de ressource', () => {
            cy.get('[data-testid="resource-utilization-chart"]').should('be.visible');
            
            cy.get('[data-testid="resource-type-legend"]').within(() => {
                cy.contains('Salles d\'opération').should('exist');
                cy.contains('Personnel médical').should('exist');
                cy.contains('Équipements').should('exist');
            });
        });

        it('devrait permettre de basculer entre différents types de graphiques', () => {
            cy.get('[data-testid="chart-type-selector"]').within(() => {
                cy.get('[data-testid="bar-chart"]').click();
                cy.get('[data-testid="resource-utilization-chart"]').should('have.attr', 'data-type', 'bar');
                
                cy.get('[data-testid="line-chart"]').click();
                cy.get('[data-testid="resource-utilization-chart"]').should('have.attr', 'data-type', 'line');
                
                cy.get('[data-testid="pie-chart"]').click();
                cy.get('[data-testid="resource-utilization-chart"]').should('have.attr', 'data-type', 'pie');
            });
        });

        it('devrait afficher les statistiques d\'utilisation', () => {
            cy.get('[data-testid="utilization-stats"]').within(() => {
                cy.get('[data-testid="avg-utilization"]').should('exist');
                cy.get('[data-testid="peak-utilization"]').should('exist');
                cy.get('[data-testid="underutilized-resources"]').should('exist');
            });
        });
    });

    describe('Radar des conflits', () => {
        it('devrait afficher les différents types de conflits', () => {
            cy.get('[data-testid="conflicts-radar"]').should('be.visible');
            
            // Vérifier les axes du radar
            cy.get('[data-testid="radar-axis"]').should('have.length', 6);
            cy.get('[data-testid="radar-label"]').should('contain', 'Surcharge');
            cy.get('[data-testid="radar-label"]').should('contain', 'Compétences');
            cy.get('[data-testid="radar-label"]').should('contain', 'Congés');
        });

        it('devrait permettre de comparer différentes simulations', () => {
            cy.get('[data-testid="comparison-mode"]').check();
            
            cy.get('[data-testid="simulation-selector-1"]').select('Simulation A');
            cy.get('[data-testid="simulation-selector-2"]').select('Simulation B');
            
            cy.get('[data-testid="radar-overlay"]').should('have.length', 2);
            cy.get('[data-testid="legend"]').should('contain', 'Simulation A');
            cy.get('[data-testid="legend"]').should('contain', 'Simulation B');
        });
    });

    describe('Métriques d\'efficacité', () => {
        it('devrait afficher les KPIs principaux', () => {
            cy.get('[data-testid="efficiency-metrics"]').within(() => {
                cy.get('[data-testid="kpi-card"]').should('have.length.greaterThan', 4);
                
                // Vérifier les KPIs essentiels
                cy.contains('Taux d\'occupation').should('exist');
                cy.contains('Conflits résolus').should('exist');
                cy.contains('Temps d\'optimisation').should('exist');
                cy.contains('Satisfaction équipe').should('exist');
            });
        });

        it('devrait afficher les tendances temporelles', () => {
            cy.get('[data-testid="trends-chart"]').should('be.visible');
            cy.get('[data-testid="trend-line"]').should('have.length.greaterThan', 0);
            
            // Vérifier les indicateurs de tendance
            cy.get('[data-testid="trend-indicator"]').each(($indicator) => {
                cy.wrap($indicator).should('have.class').and('match', /(up|down|stable)/);
            });
        });

        it('devrait permettre d\'exporter les métriques', () => {
            cy.get('[data-testid="export-metrics-btn"]').click();
            
            cy.get('[data-testid="export-format"]').select('CSV');
            cy.get('[data-testid="confirm-export"]').click();
            
            cy.readFile('cypress/downloads/efficiency-metrics.csv').should('exist');
        });
    });

    describe('Interactions et navigation', () => {
        it('devrait permettre de lier les visualisations', () => {
            // Cliquer sur un élément dans la carte de chaleur
            cy.get('[data-testid="heatmap-cell"]').first().click();
            
            // Vérifier que les autres graphiques sont mis à jour
            cy.get('[data-testid="timeline-gantt"]').should('have.class', 'filtered');
            cy.get('[data-testid="resource-utilization-chart"]').should('have.class', 'filtered');
        });

        it('devrait permettre de sauvegarder une vue personnalisée', () => {
            // Configurer la vue
            cy.get('[data-testid="layout-config"]').click();
            cy.get('[data-testid="hide-chart"]').first().click();
            cy.get('[data-testid="resize-chart"]').first().trigger('mousedown');
            
            // Sauvegarder
            cy.get('[data-testid="save-layout-btn"]').click();
            cy.get('[data-testid="layout-name"]').type('Ma vue personnalisée');
            cy.get('[data-testid="save-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Vue sauvegardée');
        });

        it('devrait permettre le plein écran pour chaque visualisation', () => {
            cy.get('[data-testid="workload-heatmap"]').within(() => {
                cy.get('[data-testid="fullscreen-btn"]').click();
            });
            
            cy.get('[data-testid="fullscreen-modal"]').should('be.visible');
            cy.get('[data-testid="fullscreen-chart"]').should('have.class', 'fullscreen');
            
            cy.get('[data-testid="exit-fullscreen"]').click();
            cy.get('[data-testid="fullscreen-modal"]').should('not.exist');
        });
    });

    describe('Performance et chargement', () => {
        it('devrait charger les visualisations de manière progressive', () => {
            cy.get('[data-testid="loading-skeleton"]').should('be.visible');
            
            // Attendre que les données se chargent
            cy.get('[data-testid="workload-heatmap"]', { timeout: 10000 }).should('be.visible');
            cy.get('[data-testid="loading-skeleton"]').should('not.exist');
        });

        it('devrait gérer les gros volumes de données', () => {
            // Charger une simulation avec beaucoup de données
            cy.get('[data-testid="simulation-selector"]').select('Simulation Complète Année');
            
            cy.get('[data-testid="data-size-warning"]').should('be.visible');
            cy.get('[data-testid="continue-loading"]').click();
            
            // Vérifier que le rendu reste fluide
            cy.get('[data-testid="performance-indicator"]').should('have.class', 'good-performance');
        });

        it('devrait permettre la pagination des données', () => {
            cy.get('[data-testid="large-dataset-indicator"]').should('be.visible');
            
            cy.get('[data-testid="pagination-controls"]').within(() => {
                cy.get('[data-testid="next-page"]').click();
                cy.get('[data-testid="page-indicator"]').should('contain', 'Page 2');
            });
        });
    });

    describe('Export et partage des visualisations', () => {
        it('devrait exporter les graphiques en PNG', () => {
            cy.get('[data-testid="workload-heatmap"]').within(() => {
                cy.get('[data-testid="export-btn"]').click();
            });
            
            cy.get('[data-testid="export-format"]').select('PNG');
            cy.get('[data-testid="export-quality"]').select('High');
            cy.get('[data-testid="confirm-export"]').click();
            
            cy.readFile('cypress/downloads/workload-heatmap.png').should('exist');
        });

        it('devrait créer un rapport PDF avec toutes les visualisations', () => {
            cy.get('[data-testid="generate-report-btn"]').click();
            
            cy.get('[data-testid="report-options"]').within(() => {
                cy.get('[data-testid="include-all-charts"]').check();
                cy.get('[data-testid="include-analysis"]').check();
                cy.get('[data-testid="report-title"]').type('Rapport Visualisations Janvier 2024');
            });
            
            cy.get('[data-testid="generate-pdf"]').click();
            cy.get('[data-testid="download-link"]', { timeout: 15000 }).should('be.visible');
        });
    });
});