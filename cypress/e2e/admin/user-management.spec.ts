// Tests E2E pour la gestion des utilisateurs - Module critique Admin

describe('Admin - Gestion des Utilisateurs', () => {
    beforeEach(() => {
        // Login comme admin
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
        cy.visit('/admin/users');
    });

    describe('Liste des utilisateurs', () => {
        it('devrait afficher la liste complète des utilisateurs', () => {
            cy.get('[data-testid="users-table"]').should('exist');
            cy.get('[data-testid="user-row"]').should('have.length.greaterThan', 0);
            
            // Vérifier les colonnes
            cy.get('thead').within(() => {
                cy.contains('Nom').should('be.visible');
                cy.contains('Email').should('be.visible');
                cy.contains('Rôle').should('be.visible');
                cy.contains('Statut').should('be.visible');
                cy.contains('Sites').should('be.visible');
            });
        });

        it('devrait permettre de filtrer les utilisateurs', () => {
            // Filtrer par nom
            cy.get('[data-testid="search-input"]').type('Dupont');
            cy.get('[data-testid="user-row"]').each(($row) => {
                cy.wrap($row).should('contain', 'Dupont');
            });

            // Filtrer par rôle
            cy.get('[data-testid="role-filter"]').select('ADMIN_TOTAL');
            cy.get('[data-testid="user-row"]').each(($row) => {
                cy.wrap($row).find('[data-testid="user-role"]').should('contain', 'Admin Total');
            });

            // Filtrer par statut
            cy.get('[data-testid="status-filter"]').select('ACTIF');
            cy.get('[data-testid="user-row"]').each(($row) => {
                cy.wrap($row).find('[data-testid="user-status"]').should('contain', 'Actif');
            });
        });

        it('devrait paginer correctement les résultats', () => {
            cy.get('[data-testid="pagination"]').should('exist');
            cy.get('[data-testid="page-info"]').should('contain', 'Page 1');
            
            // Aller à la page suivante
            cy.get('[data-testid="next-page"]').click();
            cy.get('[data-testid="page-info"]').should('contain', 'Page 2');
        });
    });

    describe('Création d\'utilisateur', () => {
        beforeEach(() => {
            cy.get('[data-testid="create-user-btn"]').click();
        });

        it('devrait créer un nouvel utilisateur avec succès', () => {
            // Remplir le formulaire
            cy.get('[data-testid="user-form"]').within(() => {
                cy.get('input[name="email"]').type('nouveau.user@test.fr');
                cy.get('input[name="nom"]').type('Nouveau');
                cy.get('input[name="prenom"]').type('Utilisateur');
                cy.get('input[name="password"]').type('SecurePass123!');
                cy.get('select[name="role"]').select('USER');
                cy.get('select[name="professionalRole"]').select('MAR');
                
                // Sélectionner des sites
                cy.get('[data-testid="sites-select"]').click();
                cy.get('[data-testid="site-option-1"]').click();
                cy.get('[data-testid="site-option-2"]').click();
            });

            // Soumettre
            cy.get('[data-testid="submit-btn"]').click();

            // Vérifier le succès
            cy.get('[data-testid="success-toast"]').should('contain', 'Utilisateur créé avec succès');
            cy.get('[data-testid="users-table"]').should('contain', 'nouveau.user@test.fr');
        });

        it('devrait valider les champs requis', () => {
            cy.get('[data-testid="submit-btn"]').click();

            cy.get('[data-testid="error-email"]').should('contain', 'Email requis');
            cy.get('[data-testid="error-nom"]').should('contain', 'Nom requis');
            cy.get('[data-testid="error-password"]').should('contain', 'Mot de passe requis');
        });

        it('devrait valider le format email', () => {
            cy.get('input[name="email"]').type('invalid-email');
            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="error-email"]').should('contain', 'Email invalide');
        });

        it('devrait valider la complexité du mot de passe', () => {
            cy.get('input[name="password"]').type('weak');
            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="error-password"]').should('contain', 'Le mot de passe doit contenir');
        });
    });

    describe('Modification d\'utilisateur', () => {
        beforeEach(() => {
            cy.get('[data-testid="user-row"]').first().find('[data-testid="edit-btn"]').click();
        });

        it('devrait modifier un utilisateur existant', () => {
            cy.get('[data-testid="user-form"]').within(() => {
                cy.get('input[name="nom"]').clear().type('Modifié');
                cy.get('select[name="role"]').select('ADMIN_PARTIEL');
            });

            cy.get('[data-testid="submit-btn"]').click();
            cy.get('[data-testid="success-toast"]').should('contain', 'Utilisateur modifié');
        });

        it('devrait permettre de réinitialiser le mot de passe', () => {
            cy.get('[data-testid="reset-password-btn"]').click();
            cy.get('[data-testid="new-password-input"]').type('NewSecure123!');
            cy.get('[data-testid="confirm-reset-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Mot de passe réinitialisé');
        });

        it('devrait permettre de changer le statut', () => {
            cy.get('[data-testid="toggle-status-btn"]').click();
            cy.get('[data-testid="confirm-dialog"]').should('be.visible');
            cy.get('[data-testid="confirm-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Statut modifié');
        });
    });

    describe('Gestion des permissions', () => {
        it('devrait afficher et modifier les sites assignés', () => {
            cy.get('[data-testid="user-row"]').first().find('[data-testid="manage-sites-btn"]').click();
            
            cy.get('[data-testid="sites-modal"]').should('be.visible');
            cy.get('[data-testid="site-checkbox"]').should('have.length.greaterThan', 0);
            
            // Modifier les sites
            cy.get('[data-testid="site-checkbox"]').first().click();
            cy.get('[data-testid="save-sites-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', 'Sites mis à jour');
        });

        it('devrait respecter les permissions selon le rôle', () => {
            // Tester qu'un admin partiel ne peut voir que ses sites
            cy.logout();
            cy.login('admin.partiel@test.fr', 'password');
            cy.visit('/admin/users');
            
            cy.get('[data-testid="user-row"]').each(($row) => {
                cy.wrap($row).find('[data-testid="user-sites"]').should('contain.oneOf', ['Site A', 'Site B']);
            });
        });
    });

    describe('Import/Export en masse', () => {
        it('devrait permettre l\'import CSV d\'utilisateurs', () => {
            cy.get('[data-testid="import-btn"]').click();
            
            const csvContent = `email,nom,prenom,role,professionalRole
user1@test.fr,Test1,User1,USER,MAR
user2@test.fr,Test2,User2,USER,IADE`;

            cy.get('input[type="file"]').selectFile({
                contents: Cypress.Buffer.from(csvContent),
                fileName: 'users.csv',
                mimeType: 'text/csv'
            });

            cy.get('[data-testid="preview-table"]').should('be.visible');
            cy.get('[data-testid="confirm-import-btn"]').click();
            
            cy.get('[data-testid="success-toast"]').should('contain', '2 utilisateurs importés');
        });

        it('devrait permettre l\'export des utilisateurs', () => {
            cy.get('[data-testid="export-btn"]').click();
            cy.get('[data-testid="export-format"]').select('CSV');
            cy.get('[data-testid="confirm-export-btn"]').click();
            
            // Vérifier le téléchargement
            cy.readFile('cypress/downloads/users-export.csv').should('exist');
        });
    });

    describe('Audit et logs', () => {
        it('devrait afficher l\'historique des actions', () => {
            cy.get('[data-testid="user-row"]').first().find('[data-testid="history-btn"]').click();
            
            cy.get('[data-testid="audit-modal"]').should('be.visible');
            cy.get('[data-testid="audit-entry"]').should('have.length.greaterThan', 0);
            
            // Vérifier le contenu des logs
            cy.get('[data-testid="audit-entry"]').first().within(() => {
                cy.get('[data-testid="audit-date"]').should('exist');
                cy.get('[data-testid="audit-action"]').should('exist');
                cy.get('[data-testid="audit-user"]').should('exist');
            });
        });
    });

    describe('Sécurité et validation', () => {
        it('ne devrait pas permettre de supprimer le dernier admin', () => {
            // Compter les admins
            cy.get('[data-testid="role-filter"]').select('ADMIN_TOTAL');
            cy.get('[data-testid="user-row"]').then(($rows) => {
                if ($rows.length === 1) {
                    cy.wrap($rows[0]).find('[data-testid="delete-btn"]').should('be.disabled');
                }
            });
        });

        it('devrait empêcher la création d\'emails dupliqués', () => {
            cy.get('[data-testid="create-user-btn"]').click();
            cy.get('input[name="email"]').type('admin@mathildanesth.fr'); // Email existant
            cy.get('[data-testid="submit-btn"]').click();
            
            cy.get('[data-testid="error-toast"]').should('contain', 'Email déjà utilisé');
        });
    });
});