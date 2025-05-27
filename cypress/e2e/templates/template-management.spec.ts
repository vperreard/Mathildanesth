// Tests E2E pour la gestion des templates de planning

describe('Gestion des Templates de Planning', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/templates');
    });

    describe('Vue d\'ensemble des templates', () => {
        it('devrait afficher la bibliothèque de templates', () => {
            cy.get('[data-testid="templates-library"]').should('be.visible');
            cy.get('[data-testid="create-template-btn"]').should('exist');
            cy.get('[data-testid="template-categories"]').should('exist');
            cy.get('[data-testid="search-templates"]').should('exist');
        });

        it('devrait permettre de filtrer par catégorie', () => {
            cy.get('[data-testid="category-filter"]').select('WEEKLY');
            cy.get('[data-testid="template-card"]').each(($card) => {
                cy.wrap($card).find('[data-testid="template-category"]').should('contain', 'Hebdomadaire');
            });
        });

        it('devrait permettre de rechercher des templates', () => {
            cy.get('[data-testid="search-templates"]').type('garde');
            cy.get('[data-testid="template-card"]').each(($card) => {
                cy.wrap($card).should('contain.text', 'garde');
            });
        });

        it('devrait afficher les statistiques d\'utilisation', () => {
            cy.get('[data-testid="template-stats"]').within(() => {
                cy.get('[data-testid="total-templates"]').should('exist');
                cy.get('[data-testid="most-used-template"]').should('exist');
                cy.get('[data-testid="recent-usage"]').should('exist');
            });
        });
    });

    describe('Création de template', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="create-template-btn"]').click();
        });

        it('devrait créer un template basique', () => {
            cy.get('[data-testid="template-wizard"]').should('be.visible');
            
            // Étape 1: Informations générales
            cy.get('[data-testid="template-name"]').type('Template Garde Week-end');
            cy.get('[data-testid="template-description"]').type('Configuration pour les gardes de week-end');
            cy.get('[data-testid="template-category"]').select('WEEKEND');
            cy.get('[data-testid="template-tags"]').type('garde,weekend,urgence{enter}');
            cy.get('[data-testid="next-step"]').click();

            // Étape 2: Configuration temporelle
            cy.get('[data-testid="pattern-type"]').select('WEEKLY');
            cy.get('[data-testid="start-time"]').type('08:00');
            cy.get('[data-testid="end-time"]').type('20:00');
            cy.get('[data-testid="days-selection"]').within(() => {
                cy.get('[data-testid="saturday"]').check();
                cy.get('[data-testid="sunday"]').check();
            });
            cy.get('[data-testid="next-step"]').click();

            // Étape 3: Assignation du personnel
            cy.get('[data-testid="staff-assignment-type"]').select('ROLE_BASED');
            cy.get('[data-testid="required-roles"]').within(() => {
                cy.get('[data-testid="role-mar"]').type('2');
                cy.get('[data-testid="role-iade"]').type('1');
                cy.get('[data-testid="role-secretaire"]').type('1');
            });
            cy.get('[data-testid="next-step"]').click();

            // Étape 4: Règles et contraintes
            cy.get('[data-testid="max-consecutive-weekends"]').type('2');
            cy.get('[data-testid="min-rest-between-shifts"]').type('11');
            cy.get('[data-testid="allow-overtime"]').check();
            cy.get('[data-testid="create-template"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Template créé');
            cy.get('[data-testid="templates-library"]').should('contain', 'Template Garde Week-end');
        });

        it('devrait créer un template à partir d\'un planning existant', () => {
            cy.get('[data-testid="create-from-existing"]').click();
            
            cy.get('[data-testid="planning-selector"]').select('Planning Janvier 2024');
            cy.get('[data-testid="date-range"]').within(() => {
                cy.get('[data-testid="start-date"]').type('2024-01-15');
                cy.get('[data-testid="end-date"]').type('2024-01-21');
            });
            cy.get('[data-testid="extract-pattern"]').click();

            // Vérifier l'extraction
            cy.get('[data-testid="extracted-pattern"]').should('be.visible');
            cy.get('[data-testid="pattern-preview"]').should('exist');
            
            cy.get('[data-testid="template-name"]').type('Template Extrait Janvier');
            cy.get('[data-testid="save-template"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Template créé');
        });

        it('devrait valider les champs obligatoires', () => {
            cy.get('[data-testid="next-step"]').click();
            
            cy.get('[data-testid="error-name"]').should('contain', 'Nom requis');
            cy.get('[data-testid="error-category"]').should('contain', 'Catégorie requise');
        });
    });

    describe('Édition de template', () => {
        it('devrait modifier un template existant', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="edit-template-btn"]').click();
            });

            cy.get('[data-testid="template-editor"]').should('be.visible');
            
            // Modifier les informations de base
            cy.get('[data-testid="template-name"]').clear().type('Template Modifié');
            cy.get('[data-testid="template-description"]').clear().type('Description mise à jour');
            
            // Modifier la configuration
            cy.get('[data-testid="pattern-config-tab"]').click();
            cy.get('[data-testid="start-time"]').clear().type('07:30');
            cy.get('[data-testid="end-time"]').clear().type('19:30');

            // Sauvegarder
            cy.get('[data-testid="save-changes"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Template mis à jour');
        });

        it('devrait permettre de modifier les règles avancées', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="edit-template-btn"]').click();
            cy.get('[data-testid="advanced-rules-tab"]').click();

            cy.get('[data-testid="rules-editor"]').within(() => {
                // Ajouter une nouvelle règle
                cy.get('[data-testid="add-rule-btn"]').click();
                cy.get('[data-testid="rule-type"]').last().select('MAX_HOURS_PER_WEEK');
                cy.get('[data-testid="rule-value"]').last().type('48');
                cy.get('[data-testid="rule-severity"]').last().select('ERROR');
                
                // Modifier une règle existante
                cy.get('[data-testid="rule-item"]').first().within(() => {
                    cy.get('[data-testid="rule-enabled"]').uncheck();
                });
            });

            cy.get('[data-testid="save-changes"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Règles mises à jour');
        });

        it('devrait permettre de prévisualiser les changements', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="edit-template-btn"]').click();
            
            // Faire des modifications
            cy.get('[data-testid="start-time"]').clear().type('09:00');
            
            // Prévisualiser
            cy.get('[data-testid="preview-changes"]').click();
            cy.get('[data-testid="preview-modal"]').should('be.visible');
            cy.get('[data-testid="changes-summary"]').should('contain', 'Heure de début');
            cy.get('[data-testid="impact-analysis"]').should('exist');
            
            cy.get('[data-testid="close-preview"]').click();
        });
    });

    describe('Application de template', () => {
        it('devrait appliquer un template à une période', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="apply-template-btn"]').click();
            });

            cy.get('[data-testid="application-wizard"]').should('be.visible');
            
            // Sélectionner la période
            cy.get('[data-testid="target-period"]').within(() => {
                cy.get('[data-testid="start-date"]').type('2024-02-01');
                cy.get('[data-testid="end-date"]').type('2024-02-29');
            });
            
            // Sélectionner le site
            cy.get('[data-testid="target-site"]').select('Site Principal');
            
            // Options d'application
            cy.get('[data-testid="application-options"]').within(() => {
                cy.get('[data-testid="overwrite-existing"]').check();
                cy.get('[data-testid="validate-conflicts"]').check();
                cy.get('[data-testid="send-notifications"]').check();
            });

            cy.get('[data-testid="apply-template"]').click();
            
            // Vérifier l'application
            cy.get('[data-testid="application-progress"]').should('be.visible');
            cy.get('[data-testid="success-toast"]', { timeout: 10000 }).should('contain', 'Template appliqué');
        });

        it('devrait gérer les conflits lors de l\'application', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="apply-template-btn"]').click();
            
            cy.get('[data-testid="target-period"]').within(() => {
                cy.get('[data-testid="start-date"]').type('2024-01-01'); // Période avec données existantes
                cy.get('[data-testid="end-date"]').type('2024-01-07');
            });
            
            cy.get('[data-testid="apply-template"]').click();
            
            // Gestion des conflits
            cy.get('[data-testid="conflicts-detected"]').should('be.visible');
            cy.get('[data-testid="conflict-resolution"]').within(() => {
                cy.get('[data-testid="resolution-strategy"]').select('MERGE');
                cy.get('[data-testid="confirm-resolution"]').click();
            });

            cy.get('[data-testid="success-toast"]').should('contain', 'Conflits résolus');
        });

        it('devrait permettre d\'appliquer avec des variations', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="apply-with-variations"]').click();
            
            cy.get('[data-testid="variations-config"]').within(() => {
                // Ajouter du personnel supplémentaire
                cy.get('[data-testid="staff-variation"]').within(() => {
                    cy.get('[data-testid="role-mar"]').type('+1');
                    cy.get('[data-testid="specific-dates"]').type('2024-02-14,2024-02-15');
                });
                
                // Modifier les horaires pour certains jours
                cy.get('[data-testid="schedule-variation"]').within(() => {
                    cy.get('[data-testid="override-hours"]').check();
                    cy.get('[data-testid="new-start-time"]').type('10:00');
                    cy.get('[data-testid="affected-days"]').select('SUNDAY');
                });
            });

            cy.get('[data-testid="apply-with-variations"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Template appliqué avec variations');
        });
    });

    describe('Gestion des versions', () => {
        it('devrait créer une nouvelle version d\'un template', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="template-menu"]').click();
                cy.get('[data-testid="create-version"]').click();
            });

            cy.get('[data-testid="version-dialog"]').within(() => {
                cy.get('[data-testid="version-name"]').type('v2.0 - Optimisé');
                cy.get('[data-testid="version-notes"]').type('Optimisation des rotations');
                cy.get('[data-testid="base-on-current"]').check();
            });

            cy.get('[data-testid="create-version-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Nouvelle version créée');
        });

        it('devrait comparer différentes versions', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="template-menu"]').click();
            cy.get('[data-testid="compare-versions"]').click();

            cy.get('[data-testid="version-comparison"]').should('be.visible');
            cy.get('[data-testid="version-selector-1"]').select('v1.0');
            cy.get('[data-testid="version-selector-2"]').select('v2.0');

            cy.get('[data-testid="comparison-result"]').should('be.visible');
            cy.get('[data-testid="differences"]').should('exist');
            cy.get('[data-testid="side-by-side-view"]').should('exist');
        });

        it('devrait restaurer une version antérieure', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="template-menu"]').click();
            cy.get('[data-testid="version-history"]').click();

            cy.get('[data-testid="version-list"]').should('be.visible');
            cy.get('[data-testid="version-item"]').eq(1).within(() => {
                cy.get('[data-testid="restore-version"]').click();
            });

            cy.get('[data-testid="confirm-restore"]').should('be.visible');
            cy.get('[data-testid="confirm-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Version restaurée');
        });
    });

    describe('Analyse et optimisation', () => {
        it('devrait analyser la performance d\'un template', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="analyze-performance"]').click();
            });

            cy.get('[data-testid="performance-analysis"]').should('be.visible');
            cy.get('[data-testid="usage-statistics"]').should('exist');
            cy.get('[data-testid="efficiency-metrics"]').should('exist');
            cy.get('[data-testid="user-satisfaction"]').should('exist');
            cy.get('[data-testid="optimization-suggestions"]').should('exist');
        });

        it('devrait optimiser automatiquement un template', () => {
            cy.get('[data-testid="template-card"]').first().find('[data-testid="optimize-template"]').click();

            cy.get('[data-testid="optimization-options"]').within(() => {
                cy.get('[data-testid="optimization-goal"]').select('MINIMIZE_CONFLICTS');
                cy.get('[data-testid="constraints"]').within(() => {
                    cy.get('[data-testid="keep-core-structure"]').check();
                    cy.get('[data-testid="max-change-percentage"]').type('20');
                });
            });

            cy.get('[data-testid="start-optimization"]').click();
            cy.get('[data-testid="optimization-progress"]', { timeout: 30000 }).should('not.exist');

            cy.get('[data-testid="optimization-results"]').should('be.visible');
            cy.get('[data-testid="improvements-summary"]').should('exist');
            cy.get('[data-testid="accept-optimization"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Template optimisé');
        });
    });

    describe('Import/Export et partage', () => {
        it('devrait exporter un template', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="template-menu"]').click();
                cy.get('[data-testid="export-template"]').click();
            });

            cy.get('[data-testid="export-options"]').within(() => {
                cy.get('[data-testid="export-format"]').select('JSON');
                cy.get('[data-testid="include-metadata"]').check();
                cy.get('[data-testid="include-usage-stats"]').check();
            });

            cy.get('[data-testid="export-btn"]').click();
            cy.readFile('cypress/downloads/template-export.json').should('exist');
        });

        it('devrait importer un template', () => {
            cy.get('[data-testid="import-template-btn"]').click();

            const templateData = {
                name: 'Template Importé',
                category: 'CUSTOM',
                pattern: { type: 'DAILY' }
            };

            cy.get('input[type="file"]').selectFile({
                contents: JSON.stringify(templateData),
                fileName: 'template.json',
                mimeType: 'application/json'
            });

            cy.get('[data-testid="import-preview"]').should('be.visible');
            cy.get('[data-testid="confirm-import"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Template importé');
            cy.get('[data-testid="templates-library"]').should('contain', 'Template Importé');
        });

        it('devrait partager un template avec d\'autres sites', () => {
            cy.get('[data-testid="template-card"]').first().within(() => {
                cy.get('[data-testid="share-template"]').click();
            });

            cy.get('[data-testid="sharing-dialog"]').within(() => {
                cy.get('[data-testid="target-sites"]').select(['Site B', 'Site C']);
                cy.get('[data-testid="permissions"]').select('READ_ONLY');
                cy.get('[data-testid="include-customizations"]').check();
            });

            cy.get('[data-testid="share-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Template partagé');
        });
    });

    describe('Gestion des catégories et tags', () => {
        it('devrait créer une nouvelle catégorie', () => {
            cy.get('[data-testid="manage-categories-btn"]').click();
            cy.get('[data-testid="add-category-btn"]').click();

            cy.get('[data-testid="category-form"]').within(() => {
                cy.get('input[name="name"]').type('NUIT');
                cy.get('input[name="label"]').type('Templates de Nuit');
                cy.get('input[name="color"]').type('#2196F3');
                cy.get('textarea[name="description"]').type('Templates spécialisés pour les gardes de nuit');
            });

            cy.get('[data-testid="save-category"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Catégorie créée');
        });

        it('devrait gérer les tags de template', () => {
            cy.get('[data-testid="manage-tags-btn"]').click();
            
            cy.get('[data-testid="tags-manager"]').should('be.visible');
            cy.get('[data-testid="popular-tags"]').should('exist');
            cy.get('[data-testid="unused-tags"]').should('exist');
            
            // Fusionner des tags similaires
            cy.get('[data-testid="merge-tags-btn"]').click();
            cy.get('[data-testid="source-tag"]').select('garde');
            cy.get('[data-testid="target-tag"]').select('gardes');
            cy.get('[data-testid="confirm-merge"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Tags fusionnés');
        });
    });
});