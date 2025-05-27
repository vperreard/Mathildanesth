// Tests E2E pour la gestion des sites et salles - Module critique Admin

describe('Admin - Gestion des Sites et Salles', () => {
    beforeEach(() => {
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/sites');
    });

    describe('Gestion des Sites', () => {
        it('devrait afficher la liste des sites', () => {
            cy.get('[data-testid="sites-list"]').should('exist');
            cy.get('[data-testid="site-card"]').should('have.length.greaterThan', 0);
            
            // Vérifier les informations affichées
            cy.get('[data-testid="site-card"]').first().within(() => {
                cy.get('[data-testid="site-name"]').should('exist');
                cy.get('[data-testid="site-description"]').should('exist');
                cy.get('[data-testid="site-stats"]').should('contain', 'secteurs');
                cy.get('[data-testid="site-stats"]').should('contain', 'salles');
            });
        });

        it('devrait créer un nouveau site', () => {
            cy.get('[data-testid="create-site-btn"]').click();
            
            cy.get('[data-testid="site-form"]').within(() => {
                cy.get('input[name="name"]').type('Nouveau Site Test');
                cy.get('textarea[name="description"]').type('Description du nouveau site de test');
                cy.get('input[name="address"]').type('123 Rue Test, 75001 Paris');
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Site créé avec succès');
            cy.get('[data-testid="sites-list"]').should('contain', 'Nouveau Site Test');
        });

        it('devrait modifier un site existant', () => {
            cy.get('[data-testid="site-card"]').first().find('[data-testid="edit-site-btn"]').click();
            
            cy.get('[data-testid="site-form"]').within(() => {
                cy.get('input[name="name"]').clear().type('Site Modifié');
                cy.get('textarea[name="description"]').clear().type('Description modifiée');
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Site modifié');
        });

        it('devrait gérer la suppression de site avec vérifications', () => {
            // Créer un site de test sans dépendances
            cy.get('[data-testid="create-site-btn"]').click();
            cy.get('input[name="name"]').type('Site à Supprimer');
            cy.get('[data-testid="submit-btn"]').click();
            cy.wait(1000);

            // Supprimer le site
            cy.get('[data-testid="site-card"]')
                .contains('Site à Supprimer')
                .parents('[data-testid="site-card"]')
                .find('[data-testid="delete-site-btn"]')
                .click();

            cy.get('[data-testid="confirm-dialog"]').should('be.visible');
            cy.get('[data-testid="confirm-delete-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Site supprimé');
            cy.get('[data-testid="sites-list"]').should('not.contain', 'Site à Supprimer');
        });

        it('ne devrait pas permettre de supprimer un site avec des utilisateurs', () => {
            // Tenter de supprimer le site principal
            cy.get('[data-testid="site-card"]')
                .contains('Site Principal')
                .parents('[data-testid="site-card"]')
                .find('[data-testid="delete-site-btn"]')
                .click();

            cy.get('[data-testid="confirm-dialog"]').should('be.visible');
            cy.get('[data-testid="confirm-delete-btn"]').click();
            
            cy.get('[data-testid="error-toast"]').should('contain', 'utilisateurs assignés');
        });
    });

    describe('Gestion des Secteurs', () => {
        beforeEach(() => {
            cy.get('[data-testid="site-card"]').first().click();
            cy.get('[data-testid="sectors-tab"]').click();
        });

        it('devrait afficher et gérer les secteurs d\'un site', () => {
            cy.get('[data-testid="sectors-list"]').should('exist');
            cy.get('[data-testid="sector-item"]').should('have.length.greaterThan', 0);
        });

        it('devrait créer un nouveau secteur', () => {
            cy.get('[data-testid="create-sector-btn"]').click();
            
            cy.get('[data-testid="sector-form"]').within(() => {
                cy.get('input[name="name"]').type('Bloc Opératoire C');
                cy.get('select[name="category"]').select('OPERATING_ROOM');
                cy.get('input[name="displayOrder"]').clear().type('3');
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Secteur créé');
        });

        it('devrait réorganiser les secteurs par drag & drop', () => {
            cy.get('[data-testid="sector-item"]').first().as('firstSector');
            cy.get('[data-testid="sector-item"]').eq(1).as('secondSector');

            // Drag & drop
            cy.get('@firstSector').find('[data-testid="drag-handle"]')
                .trigger('dragstart');
            cy.get('@secondSector')
                .trigger('drop');

            cy.get('[data-testid="success-toast"]').should('contain', 'Ordre modifié');
        });
    });

    describe('Gestion des Salles', () => {
        beforeEach(() => {
            cy.get('[data-testid="site-card"]').first().click();
            cy.get('[data-testid="rooms-tab"]').click();
        });

        it('devrait afficher la liste des salles par secteur', () => {
            cy.get('[data-testid="rooms-by-sector"]').should('exist');
            cy.get('[data-testid="room-card"]').should('have.length.greaterThan', 0);
            
            cy.get('[data-testid="room-card"]').first().within(() => {
                cy.get('[data-testid="room-name"]').should('exist');
                cy.get('[data-testid="room-type"]').should('exist');
                cy.get('[data-testid="room-status"]').should('exist');
            });
        });

        it('devrait créer une nouvelle salle', () => {
            cy.get('[data-testid="create-room-btn"]').click();
            
            cy.get('[data-testid="room-form"]').within(() => {
                cy.get('input[name="name"]').type('Salle 15');
                cy.get('select[name="sectorId"]').select('Bloc A');
                cy.get('select[name="roomType"]').select('SURGERY');
                cy.get('input[name="capacity"]').type('6');
                
                // Équipements
                cy.get('[data-testid="equipment-checkbox-ventilator"]').check();
                cy.get('[data-testid="equipment-checkbox-monitor"]').check();
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Salle créée');
        });

        it('devrait modifier le statut d\'une salle', () => {
            cy.get('[data-testid="room-card"]').first().within(() => {
                cy.get('[data-testid="room-status-toggle"]').click();
            });

            cy.get('[data-testid="status-dialog"]').should('be.visible');
            cy.get('[data-testid="status-reason"]').type('Maintenance programmée');
            cy.get('[data-testid="confirm-status-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Statut modifié');
            cy.get('[data-testid="room-card"]').first()
                .find('[data-testid="room-status"]')
                .should('contain', 'Indisponible');
        });

        it('devrait gérer l\'assignation en masse de salles à un secteur', () => {
            cy.get('[data-testid="bulk-actions-btn"]').click();
            cy.get('[data-testid="bulk-assign-sector"]').click();

            // Sélectionner plusieurs salles
            cy.get('[data-testid="room-checkbox"]').eq(0).check();
            cy.get('[data-testid="room-checkbox"]').eq(1).check();
            cy.get('[data-testid="room-checkbox"]').eq(2).check();

            // Choisir le nouveau secteur
            cy.get('[data-testid="target-sector-select"]').select('Bloc B');
            cy.get('[data-testid="confirm-bulk-assign"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', '3 salles réassignées');
        });
    });

    describe('Configuration avancée', () => {
        it('devrait gérer les types de salles personnalisés', () => {
            cy.visit('/admin/configuration/room-types');
            
            cy.get('[data-testid="create-room-type-btn"]').click();
            cy.get('input[name="code"]').type('HYBRID_OR');
            cy.get('input[name="label"]').type('Salle Hybride');
            cy.get('textarea[name="description"]').type('Salle avec imagerie intégrée');
            
            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Type de salle créé');
        });

        it('devrait configurer les règles d\'affectation par site', () => {
            cy.visit('/admin/sites');
            cy.get('[data-testid="site-card"]').first().find('[data-testid="configure-rules-btn"]').click();

            cy.get('[data-testid="rules-configuration"]').within(() => {
                // Configurer les heures d'ouverture
                cy.get('input[name="openingTime"]').clear().type('07:00');
                cy.get('input[name="closingTime"]').clear().type('20:00');
                
                // Configurer les créneaux
                cy.get('input[name="slotDuration"]').clear().type('30');
                
                // Règles spécifiques
                cy.get('[data-testid="max-concurrent-surgeries"]').clear().type('4');
            });

            cy.get('[data-testid="save-rules-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Règles configurées');
        });
    });

    describe('Import/Export de configuration', () => {
        it('devrait exporter la configuration complète d\'un site', () => {
            cy.get('[data-testid="site-card"]').first().find('[data-testid="export-config-btn"]').click();
            
            cy.get('[data-testid="export-dialog"]').should('be.visible');
            cy.get('[data-testid="include-sectors"]').check();
            cy.get('[data-testid="include-rooms"]').check();
            cy.get('[data-testid="include-rules"]').check();
            
            cy.get('[data-testid="confirm-export-btn"]').click();
            cy.readFile('cypress/downloads/site-config-export.json').should('exist');
        });

        it('devrait importer une configuration de site', () => {
            const configData = {
                site: { name: 'Site Importé' },
                sectors: [{ name: 'Secteur 1' }],
                rooms: [{ name: 'Salle 1', sectorName: 'Secteur 1' }]
            };

            cy.get('[data-testid="import-config-btn"]').click();
            cy.get('input[type="file"]').selectFile({
                contents: JSON.stringify(configData),
                fileName: 'config.json',
                mimeType: 'application/json'
            });

            cy.get('[data-testid="import-preview"]').should('be.visible');
            cy.get('[data-testid="confirm-import-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Configuration importée');
        });
    });

    describe('Monitoring et statistiques', () => {
        it('devrait afficher les statistiques d\'utilisation par site', () => {
            cy.get('[data-testid="site-card"]').first().find('[data-testid="view-stats-btn"]').click();
            
            cy.get('[data-testid="site-statistics"]').should('be.visible');
            cy.get('[data-testid="occupancy-chart"]').should('exist');
            cy.get('[data-testid="usage-by-room"]').should('exist');
            cy.get('[data-testid="peak-hours"]').should('exist');
        });
    });
});