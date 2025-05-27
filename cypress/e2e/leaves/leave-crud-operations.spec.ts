describe('Gestion complète des congés - CRUD', () => {
    // Utilisateur de test
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin'
    };

    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser la base de données et charger les fixtures
        cy.task('resetTestDatabase');
        cy.task('seedTestData', {
            fixtures: ['users', 'leaves']
        });

        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);
        cy.visitAsAuthenticatedUser('/conges');
    });

    describe('Création de congés', () => {
        it('permet de créer une demande de congé simple', () => {
            // Cliquer sur le bouton pour créer une nouvelle demande
            cy.get('[data-testid=create-leave-button]').click();

            // Remplir le formulaire
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-06-01');
            cy.get('[data-testid=leave-end-date]').type('2025-06-07');
            cy.get('[data-testid=leave-reason]').type('Vacances familiales');

            // Soumettre le formulaire
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier la notification de succès
            cy.get('[data-testid=notification-success]')
                .should('be.visible')
                .and('contain', 'Demande de congé créée avec succès');

            // Vérifier que la demande apparaît dans la liste
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.contains('01/06/2025 - 07/06/2025').should('exist');
                cy.contains('Congé annuel').should('exist');
                cy.contains('En attente').should('exist');
            });
        });

        it('empêche la création de congés avec des dates invalides', () => {
            cy.get('[data-testid=create-leave-button]').click();

            // Essayer de créer un congé avec une date de fin avant la date de début
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-06-10');
            cy.get('[data-testid=leave-end-date]').type('2025-06-05');

            // Soumettre le formulaire
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier le message d'erreur
            cy.get('[data-testid=form-error]')
                .should('be.visible')
                .and('contain', 'La date de fin doit être après la date de début');
        });

        it('vérifie les quotas disponibles avant la création', () => {
            cy.get('[data-testid=create-leave-button]').click();

            // Sélectionner un type de congé
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');

            // Vérifier l'affichage du quota restant
            cy.get('[data-testid=quota-remaining]')
                .should('be.visible')
                .and('contain', 'jours restants');

            // Tenter de créer un congé dépassant le quota
            cy.get('[data-testid=leave-start-date]').type('2025-06-01');
            cy.get('[data-testid=leave-end-date]').type('2025-12-31'); // Beaucoup trop de jours

            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier l'avertissement
            cy.get('[data-testid=quota-warning]')
                .should('be.visible')
                .and('contain', 'Quota insuffisant');
        });
    });

    describe('Modification de congés', () => {
        it('permet de modifier une demande de congé en attente', () => {
            // Trouver une demande en attente et cliquer sur modifier
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=leave-status-pending]')
                    .first()
                    .parent('tr')
                    .find('[data-testid=edit-leave-button]')
                    .click();
            });

            // Modifier les dates
            cy.get('[data-testid=leave-end-date]').clear().type('2025-06-14');
            cy.get('[data-testid=leave-reason]').clear().type('Vacances prolongées');

            // Sauvegarder les modifications
            cy.get('[data-testid=save-leave-button]').click();

            // Vérifier la notification
            cy.get('[data-testid=notification-success]')
                .should('be.visible')
                .and('contain', 'Demande de congé modifiée avec succès');

            // Vérifier que les modifications sont visibles
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.contains('14/06/2025').should('exist');
                cy.contains('Vacances prolongées').should('exist');
            });
        });

        it('empêche la modification des congés approuvés', () => {
            // Trouver une demande approuvée
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=leave-status-approved]')
                    .first()
                    .parent('tr')
                    .find('[data-testid=edit-leave-button]')
                    .should('be.disabled');
            });
        });

        it('empêche la modification des congés passés', () => {
            // Filtrer pour voir les congés passés
            cy.get('[data-testid=filter-past-leaves]').click();

            // Vérifier que les boutons de modification sont désactivés
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=edit-leave-button]').each(($btn) => {
                    cy.wrap($btn).should('be.disabled');
                });
            });
        });
    });

    describe('Suppression de congés', () => {
        it('permet de supprimer une demande de congé en attente', () => {
            // Trouver une demande en attente et cliquer sur supprimer
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=leave-status-pending]')
                    .first()
                    .parent('tr')
                    .find('[data-testid=delete-leave-button]')
                    .click();
            });

            // Confirmer la suppression dans la modal
            cy.get('[data-testid=confirm-delete-modal]').within(() => {
                cy.contains('Êtes-vous sûr de vouloir supprimer cette demande de congé ?');
                cy.get('[data-testid=confirm-delete-button]').click();
            });

            // Vérifier la notification
            cy.get('[data-testid=notification-success]')
                .should('be.visible')
                .and('contain', 'Demande de congé supprimée avec succès');

            // Vérifier que la demande n'apparaît plus
            cy.get('[data-testid=leaves-table]').should('not.contain', 'La demande supprimée');
        });

        it('empêche la suppression des congés approuvés', () => {
            // Trouver une demande approuvée
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=leave-status-approved]')
                    .first()
                    .parent('tr')
                    .find('[data-testid=delete-leave-button]')
                    .should('not.exist');
            });
        });

        it('restaure les quotas après suppression', () => {
            // Noter le quota initial
            cy.get('[data-testid=quota-display]')
                .invoke('text')
                .then((initialQuota) => {
                    // Supprimer une demande en attente
                    cy.get('[data-testid=leaves-table]').within(() => {
                        cy.get('[data-testid=leave-status-pending]')
                            .first()
                            .parent('tr')
                            .find('[data-testid=delete-leave-button]')
                            .click();
                    });

                    // Confirmer la suppression
                    cy.get('[data-testid=confirm-delete-button]').click();

                    // Vérifier que le quota a été restauré
                    cy.get('[data-testid=quota-display]')
                        .invoke('text')
                        .should('not.equal', initialQuota);
                });
        });
    });

    describe('Validation des règles métier', () => {
        it('détecte les conflits avec d\'autres congés', () => {
            cy.get('[data-testid=create-leave-button]').click();

            // Essayer de créer un congé qui chevauche avec un congé existant
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-07-15');
            cy.get('[data-testid=leave-end-date]').type('2025-07-25');

            // Vérifier l'avertissement de conflit
            cy.get('[data-testid=conflict-warning]')
                .should('be.visible')
                .and('contain', 'Conflit détecté avec d\'autres congés');

            // Afficher les détails du conflit
            cy.get('[data-testid=show-conflict-details]').click();
            cy.get('[data-testid=conflict-details]').within(() => {
                cy.contains('Congé existant').should('exist');
                cy.contains('Dr Dupont').should('exist');
            });
        });

        it('vérifie le nombre minimum de personnel présent', () => {
            cy.get('[data-testid=create-leave-button]').click();

            // Créer un congé pendant une période critique
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-12-24');
            cy.get('[data-testid=leave-end-date]').type('2025-12-26');

            // Vérifier l'avertissement de personnel minimum
            cy.get('[data-testid=minimum-staff-warning]')
                .should('be.visible')
                .and('contain', 'Personnel minimum non respecté');
        });

        it('affiche les recommandations pour les périodes alternatives', () => {
            cy.get('[data-testid=create-leave-button]').click();

            // Sélectionner des dates avec conflits
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-08-01');
            cy.get('[data-testid=leave-end-date]').type('2025-08-15');

            // Vérifier les recommandations
            cy.get('[data-testid=alternative-dates-suggestion]')
                .should('be.visible')
                .and('contain', 'Périodes alternatives suggérées');

            // Cliquer sur une suggestion
            cy.get('[data-testid=suggested-date-1]').click();

            // Vérifier que les dates sont mises à jour
            cy.get('[data-testid=leave-start-date]').should('have.value', '2025-08-16');
            cy.get('[data-testid=leave-end-date]').should('have.value', '2025-08-30');
        });
    });

    describe('Fonctionnalités avancées', () => {
        it('permet l\'export des congés en CSV', () => {
            // Cliquer sur le bouton d'export
            cy.get('[data-testid=export-leaves-button]').click();

            // Sélectionner les options d'export
            cy.get('[data-testid=export-modal]').within(() => {
                cy.get('[data-testid=export-format-csv]').check();
                cy.get('[data-testid=export-date-range]').check();
                cy.get('[data-testid=export-start-date]').type('2025-01-01');
                cy.get('[data-testid=export-end-date]').type('2025-12-31');
                cy.get('[data-testid=confirm-export-button]').click();
            });

            // Vérifier que le fichier est téléchargé
            cy.readFile('cypress/downloads/conges-export-2025.csv').should('exist');
        });

        it('permet de filtrer et rechercher les congés', () => {
            // Filtrer par type de congé
            cy.get('[data-testid=filter-leave-type]').select('Congé maladie');
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('tbody tr').each(($row) => {
                    cy.wrap($row).should('contain', 'Congé maladie');
                });
            });

            // Rechercher par nom d'utilisateur
            cy.get('[data-testid=search-leaves]').type('Martin');
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('tbody tr').should('have.length.greaterThan', 0);
                cy.contains('Dr Martin').should('exist');
            });

            // Filtrer par statut
            cy.get('[data-testid=filter-status]').select('Approuvé');
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('[data-testid=leave-status-approved]').should('exist');
                cy.get('[data-testid=leave-status-pending]').should('not.exist');
            });
        });

        it('affiche l\'historique complet d\'une demande', () => {
            // Cliquer sur une demande pour voir les détails
            cy.get('[data-testid=leaves-table]').within(() => {
                cy.get('tbody tr').first().click();
            });

            // Vérifier l'affichage de l'historique
            cy.get('[data-testid=leave-history-modal]').within(() => {
                cy.contains('Historique de la demande').should('exist');
                cy.get('[data-testid=history-timeline]').should('exist');
                cy.contains('Créée le').should('exist');
                cy.contains('Modifiée le').should('exist');
            });
        });
    });
});