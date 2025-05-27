// Tests E2E pour le simulateur de planning - Module critique

describe('Simulateur de Planning', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/simulations');
    });

    describe('Interface du simulateur', () => {
        it('devrait afficher le tableau de bord de simulation', () => {
            cy.get('[data-testid="simulation-dashboard"]').should('be.visible');
            cy.get('[data-testid="create-simulation-btn"]').should('exist');
            cy.get('[data-testid="templates-section"]').should('exist');
            cy.get('[data-testid="recent-simulations"]').should('exist');
        });

        it('devrait afficher les statistiques des simulations', () => {
            cy.get('[data-testid="simulation-stats"]').within(() => {
                cy.get('[data-testid="total-simulations"]').should('exist');
                cy.get('[data-testid="success-rate"]').should('exist');
                cy.get('[data-testid="avg-conflicts"]').should('exist');
                cy.get('[data-testid="last-optimization"]').should('exist');
            });
        });
    });

    describe('Création de simulation', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="create-simulation-btn"]').click();
        });

        it('devrait créer une simulation basique', () => {
            cy.get('[data-testid="simulation-wizard"]').should('be.visible');
            
            // Étape 1: Configuration générale
            cy.get('[data-testid="simulation-name"]').type('Test Simulation Janvier 2024');
            cy.get('[data-testid="start-date"]').type('2024-01-01');
            cy.get('[data-testid="end-date"]').type('2024-01-31');
            cy.get('[data-testid="site-select"]').select('Site Principal');
            cy.get('[data-testid="next-step-btn"]').click();

            // Étape 2: Sélection des salles
            cy.get('[data-testid="rooms-selection"]').should('be.visible');
            cy.get('[data-testid="room-checkbox"]').eq(0).check();
            cy.get('[data-testid="room-checkbox"]').eq(1).check();
            cy.get('[data-testid="room-checkbox"]').eq(2).check();
            cy.get('[data-testid="next-step-btn"]').click();

            // Étape 3: Règles et contraintes
            cy.get('[data-testid="rules-configuration"]').should('be.visible');
            cy.get('[data-testid="max-consecutive-days"]').clear().type('5');
            cy.get('[data-testid="min-rest-hours"]').clear().type('12');
            cy.get('[data-testid="enable-auto-optimization"]').check();
            cy.get('[data-testid="next-step-btn"]').click();

            // Étape 4: Personnel
            cy.get('[data-testid="staff-assignment"]').should('be.visible');
            cy.get('[data-testid="auto-assign-staff"]').check();
            cy.get('[data-testid="create-simulation-final"]').click();

            // Vérification
            cy.get('[data-testid="simulation-created-toast"]').should('contain', 'Simulation créée');
            cy.url().should('include', '/admin/simulations/');
        });

        it('devrait valider les champs obligatoires', () => {
            cy.get('[data-testid="next-step-btn"]').click();
            
            cy.get('[data-testid="error-name"]').should('contain', 'Nom requis');
            cy.get('[data-testid="error-start-date"]').should('contain', 'Date de début requise');
            cy.get('[data-testid="error-end-date"]').should('contain', 'Date de fin requise');
        });

        it('devrait valider la cohérence des dates', () => {
            cy.get('[data-testid="simulation-name"]').type('Test');
            cy.get('[data-testid="start-date"]').type('2024-01-31');
            cy.get('[data-testid="end-date"]').type('2024-01-01'); // Date de fin avant début
            cy.get('[data-testid="next-step-btn"]').click();

            cy.get('[data-testid="error-dates"]').should('contain', 'Date de fin antérieure');
        });
    });

    describe('Exécution de simulation', () => {
        it('devrait exécuter une simulation et afficher les résultats', () => {
            // Sélectionner une simulation existante
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="run-simulation-btn"]').click();

            // Attendre l'exécution
            cy.get('[data-testid="simulation-progress"]').should('be.visible');
            cy.get('[data-testid="progress-bar"]', { timeout: 30000 }).should('not.exist');

            // Vérifier les résultats
            cy.get('[data-testid="simulation-results"]').should('be.visible');
            cy.get('[data-testid="planning-grid"]').should('exist');
            cy.get('[data-testid="conflicts-summary"]').should('exist');
            cy.get('[data-testid="optimization-score"]').should('exist');
        });

        it('devrait afficher les conflits détectés', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="run-simulation-btn"]').click();
            cy.wait(5000);

            cy.get('[data-testid="conflicts-tab"]').click();
            cy.get('[data-testid="conflicts-list"]').should('be.visible');
            
            // Vérifier les types de conflits
            cy.get('[data-testid="conflict-item"]').each(($conflict) => {
                cy.wrap($conflict).find('[data-testid="conflict-type"]').should('exist');
                cy.wrap($conflict).find('[data-testid="conflict-severity"]').should('exist');
                cy.wrap($conflict).find('[data-testid="affected-users"]').should('exist');
            });
        });

        it('devrait permettre de résoudre les conflits manuellement', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="run-simulation-btn"]').click();
            cy.wait(5000);

            cy.get('[data-testid="conflicts-tab"]').click();
            cy.get('[data-testid="conflict-item"]').first().within(() => {
                cy.get('[data-testid="resolve-conflict-btn"]').click();
            });

            cy.get('[data-testid="resolution-modal"]').should('be.visible');
            cy.get('[data-testid="suggested-solutions"]').should('have.length.greaterThan', 0);
            cy.get('[data-testid="solution-option"]').first().click();
            cy.get('[data-testid="apply-solution-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Conflit résolu');
        });
    });

    describe('Optimisation automatique', () => {
        it('devrait optimiser automatiquement le planning', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="optimize-btn"]').click();

            cy.get('[data-testid="optimization-dialog"]').within(() => {
                cy.get('[data-testid="optimization-strategy"]').select('MINIMIZE_CONFLICTS');
                cy.get('[data-testid="max-iterations"]').clear().type('100');
                cy.get('[data-testid="start-optimization-btn"]').click();
            });

            // Attendre l'optimisation
            cy.get('[data-testid="optimization-progress"]', { timeout: 60000 }).should('not.exist');
            
            // Vérifier l'amélioration
            cy.get('[data-testid="optimization-results"]').should('be.visible');
            cy.get('[data-testid="score-improvement"]').should('exist');
            cy.get('[data-testid="conflicts-reduced"]').should('exist');
        });

        it('devrait comparer différentes stratégies d\'optimisation', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="compare-strategies-btn"]').click();

            cy.get('[data-testid="strategy-comparison"]').should('be.visible');
            cy.get('[data-testid="strategy-result"]').should('have.length', 3);

            // Vérifier les métriques de comparaison
            cy.get('[data-testid="comparison-chart"]').should('exist');
            cy.get('[data-testid="best-strategy"]').should('be.highlighted');
        });
    });

    describe('Templates de simulation', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="templates-tab"]').click();
        });

        it('devrait créer un template à partir d\'une simulation', () => {
            cy.get('[data-testid="simulation-card"]').first().within(() => {
                cy.get('[data-testid="save-as-template-btn"]').click();
            });

            cy.get('[data-testid="template-form"]').within(() => {
                cy.get('input[name="name"]').type('Template Hiver 2024');
                cy.get('textarea[name="description"]').type('Configuration pour période hivernale');
                cy.get('[data-testid="template-category"]').select('SEASONAL');
                cy.get('[data-testid="save-template-btn"]').click();
            });

            cy.get('[data-testid="success-toast"]').should('contain', 'Template créé');
            cy.get('[data-testid="templates-list"]').should('contain', 'Template Hiver 2024');
        });

        it('devrait utiliser un template existant', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="use-template-btn"]').click();
            });

            cy.get('[data-testid="template-application"]').should('be.visible');
            cy.get('[data-testid="template-preview"]').should('exist');
            cy.get('[data-testid="apply-template-btn"]').click();

            cy.get('[data-testid="simulation-created-toast"]').should('be.visible');
        });

        it('devrait modifier un template existant', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="edit-template-btn"]').click();
            });

            cy.get('[data-testid="template-editor"]').should('be.visible');
            cy.get('input[name="name"]').clear().type('Template Modifié');
            cy.get('[data-testid="save-changes-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Template mis à jour');
        });
    });

    describe('Analyse et rapports', () => {
        it('devrait générer un rapport de simulation', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="generate-report-btn"]').click();

            cy.get('[data-testid="report-options"]').within(() => {
                cy.get('[data-testid="include-conflicts"]').check();
                cy.get('[data-testid="include-statistics"]').check();
                cy.get('[data-testid="include-recommendations"]').check();
                cy.get('[data-testid="report-format"]').select('PDF');
            });

            cy.get('[data-testid="generate-btn"]').click();
            cy.get('[data-testid="download-link"]', { timeout: 10000 }).should('be.visible');
        });

        it('devrait afficher les statistiques avancées', () => {
            cy.get('[data-testid="analytics-tab"]').click();
            
            cy.get('[data-testid="advanced-stats"]').within(() => {
                cy.get('[data-testid="workload-distribution"]').should('exist');
                cy.get('[data-testid="efficiency-metrics"]').should('exist');
                cy.get('[data-testid="timeline-analysis"]').should('exist');
                cy.get('[data-testid="resource-utilization"]').should('exist');
            });
        });

        it('devrait comparer plusieurs simulations', () => {
            cy.get('[data-testid="compare-simulations-btn"]').click();
            
            // Sélectionner 2-3 simulations
            cy.get('[data-testid="simulation-selector"]').eq(0).select('Simulation A');
            cy.get('[data-testid="simulation-selector"]').eq(1).select('Simulation B');
            cy.get('[data-testid="compare-btn"]').click();

            cy.get('[data-testid="comparison-results"]').should('be.visible');
            cy.get('[data-testid="side-by-side-view"]').should('exist');
            cy.get('[data-testid="differences-highlight"]').should('exist');
        });
    });

    describe('Gestion des scénarios', () => {
        it('devrait créer des scénarios what-if', () => {
            cy.get('[data-testid="scenarios-tab"]').click();
            cy.get('[data-testid="create-scenario-btn"]').click();

            cy.get('[data-testid="scenario-form"]').within(() => {
                cy.get('input[name="name"]').type('Scénario: +20% chirurgies');
                cy.get('[data-testid="base-simulation"]').select('Simulation Base');
                
                // Modifier les paramètres
                cy.get('[data-testid="surgery-volume-increase"]').type('20');
                cy.get('[data-testid="additional-staff"]').type('2');
            });

            cy.get('[data-testid="run-scenario-btn"]').click();
            cy.get('[data-testid="scenario-results"]', { timeout: 30000 }).should('be.visible');
        });

        it('devrait analyser l\'impact des changements', () => {
            cy.get('[data-testid="scenario-card"]').first().click();
            cy.get('[data-testid="impact-analysis"]').should('be.visible');

            cy.get('[data-testid="impact-metrics"]').within(() => {
                cy.get('[data-testid="staff-impact"]').should('exist');
                cy.get('[data-testid="resource-impact"]').should('exist');
                cy.get('[data-testid="cost-impact"]').should('exist');
                cy.get('[data-testid="quality-impact"]').should('exist');
            });
        });
    });

    describe('Export et partage', () => {
        it('devrait exporter le planning généré', () => {
            cy.get('[data-testid="simulation-card"]').first().click();
            cy.get('[data-testid="export-planning-btn"]').click();

            cy.get('[data-testid="export-options"]').within(() => {
                cy.get('[data-testid="format-excel"]').check();
                cy.get('[data-testid="include-metadata"]').check();
                cy.get('[data-testid="export-btn"]').click();
            });

            cy.readFile('cypress/downloads/planning-export.xlsx').should('exist');
        });

        it('devrait partager une simulation avec d\'autres utilisateurs', () => {
            cy.get('[data-testid="simulation-card"]').first().within(() => {
                cy.get('[data-testid="share-btn"]').click();
            });

            cy.get('[data-testid="share-dialog"]').within(() => {
                cy.get('[data-testid="user-selector"]').select('Dr. Martin');
                cy.get('[data-testid="permission-level"]').select('READ_ONLY');
                cy.get('[data-testid="share-btn-confirm"]').click();
            });

            cy.get('[data-testid="success-toast"]').should('contain', 'Simulation partagée');
        });
    });
});