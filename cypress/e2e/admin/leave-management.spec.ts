// Tests E2E pour la gestion administrative des congés

describe('Admin - Gestion des Congés', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/conges');
    });

    describe('Tableau de bord des congés', () => {
        it('devrait afficher les statistiques globales', () => {
            cy.get('[data-testid="leave-stats"]').within(() => {
                cy.get('[data-testid="pending-requests"]').should('exist');
                cy.get('[data-testid="approved-this-month"]').should('exist');
                cy.get('[data-testid="total-days-taken"]').should('exist');
                cy.get('[data-testid="upcoming-leaves"]').should('exist');
            });
        });

        it('devrait afficher les demandes en attente en priorité', () => {
            cy.get('[data-testid="pending-leaves-section"]').should('be.visible');
            cy.get('[data-testid="pending-leave-card"]').each(($card) => {
                cy.wrap($card).find('[data-testid="status-badge"]').should('contain', 'En attente');
                cy.wrap($card).find('[data-testid="approve-btn"]').should('exist');
                cy.wrap($card).find('[data-testid="reject-btn"]').should('exist');
            });
        });
    });

    describe('Validation des demandes', () => {
        it('devrait approuver une demande de congé', () => {
            cy.get('[data-testid="pending-leave-card"]').first().within(() => {
                cy.get('[data-testid="user-name"]').invoke('text').as('userName');
                cy.get('[data-testid="leave-dates"]').invoke('text').as('leaveDates');
                cy.get('[data-testid="approve-btn"]').click();
            });

            cy.get('[data-testid="approval-dialog"]').should('be.visible');
            cy.get('[data-testid="approval-comment"]').type('Approuvé pour raisons médicales');
            cy.get('[data-testid="confirm-approve-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Demande approuvée');
            
            // Vérifier que la demande n'est plus dans les pending
            cy.get('@userName').then((name) => {
                cy.get('[data-testid="pending-leaves-section"]').should('not.contain', name);
            });
        });

        it('devrait rejeter une demande avec motif obligatoire', () => {
            cy.get('[data-testid="pending-leave-card"]').first().find('[data-testid="reject-btn"]').click();

            cy.get('[data-testid="rejection-dialog"]').should('be.visible');
            
            // Tenter de soumettre sans motif
            cy.get('[data-testid="confirm-reject-btn"]').click();
            cy.get('[data-testid="error-message"]').should('contain', 'Motif requis');

            // Ajouter un motif
            cy.get('[data-testid="rejection-reason"]').type('Effectifs insuffisants pendant cette période');
            cy.get('[data-testid="confirm-reject-btn"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'Demande rejetée');
        });

        it('devrait permettre la validation en masse', () => {
            // Sélectionner plusieurs demandes
            cy.get('[data-testid="select-all-pending"]').check();
            cy.get('[data-testid="bulk-actions"]').should('be.visible');
            
            cy.get('[data-testid="bulk-approve-btn"]').click();
            cy.get('[data-testid="bulk-approval-dialog"]').should('be.visible');
            
            cy.get('[data-testid="bulk-comment"]').type('Validation groupée - période calme');
            cy.get('[data-testid="confirm-bulk-approve"]').click();

            cy.get('[data-testid="success-toast"]').should('contain', 'demandes approuvées');
        });
    });

    describe('Gestion des quotas', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="quotas-tab"]').click();
        });

        it('devrait afficher les quotas par utilisateur', () => {
            cy.get('[data-testid="quotas-table"]').should('exist');
            cy.get('[data-testid="quota-row"]').should('have.length.greaterThan', 0);

            cy.get('[data-testid="quota-row"]').first().within(() => {
                cy.get('[data-testid="user-name"]').should('exist');
                cy.get('[data-testid="leave-type"]').should('exist');
                cy.get('[data-testid="initial-balance"]').should('exist');
                cy.get('[data-testid="used-days"]').should('exist');
                cy.get('[data-testid="remaining-days"]').should('exist');
            });
        });

        it('devrait permettre l\'ajustement manuel des quotas', () => {
            cy.get('[data-testid="quota-row"]').first().find('[data-testid="adjust-quota-btn"]').click();

            cy.get('[data-testid="adjustment-dialog"]').within(() => {
                cy.get('input[name="adjustment"]').type('5');
                cy.get('textarea[name="reason"]').type('Compensation heures supplémentaires');
                cy.get('select[name="type"]').select('CREDIT');
            });

            cy.get('[data-testid="confirm-adjustment-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Quota ajusté');
        });

        it('devrait gérer les reports de congés', () => {
            cy.get('[data-testid="carryover-btn"]').click();
            
            cy.get('[data-testid="carryover-dialog"]').within(() => {
                cy.get('[data-testid="year-select"]').select('2023');
                cy.get('[data-testid="preview-carryover-btn"]').click();
            });

            cy.get('[data-testid="carryover-preview"]').should('be.visible');
            cy.get('[data-testid="confirm-carryover-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Reports effectués');
        });
    });

    describe('Types de congés', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="leave-types-tab"]').click();
        });

        it('devrait créer un nouveau type de congé', () => {
            cy.get('[data-testid="create-leave-type-btn"]').click();

            cy.get('[data-testid="leave-type-form"]').within(() => {
                cy.get('input[name="code"]').type('FORM');
                cy.get('input[name="label"]').type('Formation');
                cy.get('input[name="defaultDays"]').type('5');
                cy.get('input[name="color"]').type('#9C27B0');
                cy.get('input[name="requiresApproval"]').check();
                cy.get('input[name="countsAsAbsence"]').uncheck();
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Type de congé créé');
        });

        it('devrait configurer les règles par type', () => {
            cy.get('[data-testid="leave-type-row"]')
                .contains('CP')
                .parents('[data-testid="leave-type-row"]')
                .find('[data-testid="configure-rules-btn"]')
                .click();

            cy.get('[data-testid="rules-dialog"]').within(() => {
                cy.get('input[name="minDays"]').clear().type('1');
                cy.get('input[name="maxDays"]').clear().type('25');
                cy.get('input[name="advanceNotice"]').clear().type('14');
                cy.get('input[name="maxConsecutive"]').clear().type('15');
                
                // Périodes de restriction
                cy.get('[data-testid="add-blackout-period"]').click();
                cy.get('input[name="blackout.0.start"]').type('2024-07-15');
                cy.get('input[name="blackout.0.end"]').type('2024-08-15');
                cy.get('input[name="blackout.0.reason"]').type('Période estivale critique');
            });

            cy.get('[data-testid="save-rules-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Règles configurées');
        });
    });

    describe('Analyse et rapports', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            cy.get('[data-testid="analytics-tab"]').click();
        });

        it('devrait afficher les graphiques d\'analyse', () => {
            cy.get('[data-testid="analytics-dashboard"]').within(() => {
                cy.get('[data-testid="absences-by-month-chart"]').should('be.visible');
                cy.get('[data-testid="absences-by-type-chart"]').should('be.visible');
                cy.get('[data-testid="absences-by-department-chart"]').should('be.visible');
                cy.get('[data-testid="trends-chart"]').should('be.visible');
            });
        });

        it('devrait générer un rapport personnalisé', () => {
            cy.get('[data-testid="generate-report-btn"]').click();

            cy.get('[data-testid="report-config"]').within(() => {
                cy.get('input[name="startDate"]').type('2024-01-01');
                cy.get('input[name="endDate"]').type('2024-12-31');
                
                // Sélectionner les métriques
                cy.get('[data-testid="metric-checkbox-total-days"]').check();
                cy.get('[data-testid="metric-checkbox-by-user"]').check();
                cy.get('[data-testid="metric-checkbox-by-type"]').check();
                
                // Format d'export
                cy.get('select[name="format"]').select('PDF');
            });

            cy.get('[data-testid="generate-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Rapport généré');
            
            // Vérifier le téléchargement
            cy.readFile('cypress/downloads/leave-report-2024.pdf').should('exist');
        });

        it('devrait identifier les patterns d\'absence', () => {
            cy.get('[data-testid="patterns-analysis-btn"]').click();
            
            cy.get('[data-testid="patterns-results"]').within(() => {
                cy.get('[data-testid="frequent-mondays"]').should('exist');
                cy.get('[data-testid="bridge-days"]').should('exist');
                cy.get('[data-testid="seasonal-peaks"]').should('exist');
            });
        });
    });

    describe('Gestion des conflits', () => {
        it('devrait détecter et résoudre les conflits', () => {
            cy.get('[data-testid="conflicts-tab"]').click();
            
            cy.get('[data-testid="conflicts-list"]').should('exist');
            cy.get('[data-testid="conflict-item"]').first().within(() => {
                cy.get('[data-testid="conflict-type"]').should('exist');
                cy.get('[data-testid="affected-users"]').should('exist');
                cy.get('[data-testid="resolve-btn"]').click();
            });

            cy.get('[data-testid="resolution-dialog"]').within(() => {
                cy.get('[data-testid="resolution-option-1"]').click();
                cy.get('[data-testid="apply-resolution-btn"]').click();
            });

            cy.get('[data-testid="success-toast"]').should('contain', 'Conflit résolu');
        });
    });

    describe('Congés récurrents', () => {
        it('devrait configurer des congés récurrents', () => {
            cy.get('[data-testid="recurring-tab"]').click();
            cy.get('[data-testid="create-recurring-btn"]').click();

            cy.get('[data-testid="recurring-form"]').within(() => {
                cy.get('select[name="userId"]').select('Dr. Martin');
                cy.get('select[name="leaveType"]').select('RTT');
                cy.get('select[name="pattern"]').select('MONTHLY');
                cy.get('input[name="dayOfMonth"]').type('15');
                cy.get('input[name="startDate"]').type('2024-01-01');
                cy.get('input[name="endDate"]').type('2024-12-31');
            });

            cy.get('[data-testid="preview-occurrences-btn"]').click();
            cy.get('[data-testid="occurrences-preview"]').should('contain', '12 occurrences');
            
            cy.get('[data-testid="confirm-recurring-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Congés récurrents créés');
        });
    });
});