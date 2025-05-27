describe('Validation des règles métier', () => {
    // Utilisateurs de test
    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        name: 'Admin'
    };

    beforeEach(() => {
        // Réinitialiser et préparer les données
        cy.task('resetTestDatabase');
        cy.task('seedTestData', {
            fixtures: ['users', 'operatingRooms', 'surgeons', 'specialties', 'leaves']
        });

        // Se connecter en tant qu'admin
        cy.loginByApi(adminUser.email, adminUser.password);
    });

    describe('Règles de gestion des congés', () => {
        beforeEach(() => {
            cy.visitAsAuthenticatedUser('/leaves');
        });

        it('valide la règle de préavis minimum pour les congés', () => {
            // Ouvrir le formulaire de création
            cy.get('[data-testid=create-leave-button]').click();

            // Essayer de créer un congé avec un préavis insuffisant (moins de 48h)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type(tomorrow.toISOString().split('T')[0]);
            cy.get('[data-testid=leave-end-date]').type(tomorrow.toISOString().split('T')[0]);
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier le message d'erreur
            cy.get('[data-testid=rule-violation-alert]')
                .should('be.visible')
                .and('contain', 'Préavis minimum de 48 heures requis');
        });

        it('valide la règle de quota maximum par type de congé', () => {
            // Naviguer vers la page de gestion des quotas
            cy.get('[data-testid=quota-management-link]').click();

            // Vérifier l'affichage des quotas
            cy.get('[data-testid=quota-table]').within(() => {
                cy.contains('Congé annuel').parent('tr').within(() => {
                    cy.get('[data-testid=quota-used]').should('contain', '5');
                    cy.get('[data-testid=quota-total]').should('contain', '25');
                });
            });

            // Essayer de dépasser le quota
            cy.get('[data-testid=create-leave-button]').click();
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-08-01');
            cy.get('[data-testid=leave-end-date]').type('2025-09-30'); // 61 jours
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier le blocage
            cy.get('[data-testid=quota-exceeded-error]')
                .should('be.visible')
                .and('contain', 'Quota dépassé');
        });

        it('valide la règle de non-chevauchement des congés', () => {
            // Créer un premier congé
            cy.get('[data-testid=create-leave-button]').click();
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-07-01');
            cy.get('[data-testid=leave-end-date]').type('2025-07-15');
            cy.get('[data-testid=submit-leave-button]').click();

            // Attendre la confirmation
            cy.get('[data-testid=notification-success]').should('be.visible');

            // Essayer de créer un congé chevauchant
            cy.get('[data-testid=create-leave-button]').click();
            cy.get('[data-testid=leave-type-select]').select('Formation');
            cy.get('[data-testid=leave-start-date]').type('2025-07-10');
            cy.get('[data-testid=leave-end-date]').type('2025-07-20');
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier l'alerte de chevauchement
            cy.get('[data-testid=overlap-warning]')
                .should('be.visible')
                .and('contain', 'Chevauchement détecté avec un congé existant');
        });

        it('valide les règles de congés récurrents', () => {
            // Créer un congé récurrent
            cy.get('[data-testid=create-leave-button]').click();
            cy.get('[data-testid=leave-type-select]').select('Formation récurrente');
            cy.get('[data-testid=recurring-checkbox]').check();
            
            // Configurer la récurrence
            cy.get('[data-testid=recurrence-pattern]').select('Hebdomadaire');
            cy.get('[data-testid=recurrence-day]').select('Mercredi');
            cy.get('[data-testid=recurrence-start]').type('2025-06-01');
            cy.get('[data-testid=recurrence-end]').type('2025-12-31');
            
            cy.get('[data-testid=submit-leave-button]').click();

            // Vérifier la création des occurrences
            cy.get('[data-testid=recurring-confirmation-modal]').within(() => {
                cy.contains('30 occurrences seront créées').should('exist');
                cy.get('[data-testid=confirm-recurring]').click();
            });

            // Vérifier que les règles sont appliquées à toutes les occurrences
            cy.get('[data-testid=leaves-table]')
                .find('[data-testid=recurring-leave-indicator]')
                .should('have.length.greaterThan', 20);
        });
    });

    describe('Règles de planification bloc opératoire', () => {
        beforeEach(() => {
            cy.visitAsAuthenticatedUser('/bloc-operatoire');
        });

        it('valide la règle de compétences par salle', () => {
            // Essayer d'affecter un chirurgien non qualifié à une salle spécialisée
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Généraliste')
                .drag('[data-testid=slot-monday-morning-cardiac-surgery]');

            // Vérifier le blocage
            cy.get('[data-testid=skill-requirement-error]')
                .should('be.visible')
                .and('contain', 'Qualification en chirurgie cardiaque requise');

            // Vérifier les suggestions
            cy.get('[data-testid=qualified-surgeons-suggestion]').within(() => {
                cy.contains('Chirurgiens qualifiés disponibles:').should('exist');
                cy.contains('Dr Cardiologue').should('exist');
            });
        });

        it('valide la règle de temps de travail maximum', () => {
            const surgeon = 'Dr Travailleur';
            
            // Affecter le chirurgien sur plusieurs créneaux
            const slots = [];
            for (let i = 0; i < 12; i++) {
                slots.push(`slot-day${Math.floor(i/2)}-${i%2 === 0 ? 'morning' : 'afternoon'}-room1`);
            }

            slots.forEach(slot => {
                cy.get('[data-testid=surgeons-list]')
                    .contains(surgeon)
                    .drag(`[data-testid=${slot}]`);
            });

            // Vérifier l'alerte de dépassement
            cy.get('[data-testid=worktime-limit-alert]')
                .should('be.visible')
                .and('contain', 'Temps de travail hebdomadaire dépassé (48h max)');

            // Vérifier le compteur d'heures
            cy.get('[data-testid=surgeon-hours-counter]')
                .contains(surgeon)
                .parent()
                .should('have.class', 'hours-exceeded')
                .and('contain', '60h');
        });

        it('valide la règle de repos après garde', () => {
            // Affecter une garde de nuit
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Gardien')
                .drag('[data-testid=slot-sunday-night-emergency]');

            // Essayer d'affecter le lendemain matin
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Gardien')
                .drag('[data-testid=slot-monday-morning-room1]');

            // Vérifier le blocage
            cy.get('[data-testid=rest-time-violation]')
                .should('be.visible')
                .and('contain', 'Repos obligatoire de 11h après une garde');

            // Vérifier que l'après-midi est possible
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Gardien')
                .drag('[data-testid=slot-monday-afternoon-room1]');

            cy.get('[data-testid=rest-time-violation]').should('not.exist');
        });

        it('valide les règles de supervision des internes', () => {
            // Affecter un interne seul
            cy.get('[data-testid=surgeons-list]')
                .contains('Interne Junior')
                .drag('[data-testid=slot-tuesday-morning-room2]');

            // Vérifier l'avertissement
            cy.get('[data-testid=supervision-required-warning]')
                .should('be.visible')
                .and('contain', 'Un interne doit être supervisé');

            // Vérifier les superviseurs suggérés
            cy.get('[data-testid=available-supervisors]').within(() => {
                cy.contains('Superviseurs disponibles:').should('exist');
                cy.get('[data-testid=supervisor-option]').should('have.length.greaterThan', 0);
            });

            // Ajouter un superviseur
            cy.get('[data-testid=add-supervisor-button]').click();
            cy.get('[data-testid=supervisor-select]').select('Dr Senior');
            cy.get('[data-testid=confirm-supervisor]').click();

            // Vérifier que l'avertissement disparaît
            cy.get('[data-testid=supervision-required-warning]').should('not.exist');
        });
    });

    describe('Règles de cohérence globale', () => {
        it('valide la cohérence entre congés et affectations', () => {
            // Créer un congé pour un chirurgien
            cy.visitAsAuthenticatedUser('/leaves');
            cy.get('[data-testid=create-leave-button]').click();
            cy.get('[data-testid=user-select]').select('Dr Dupont');
            cy.get('[data-testid=leave-type-select]').select('Congé annuel');
            cy.get('[data-testid=leave-start-date]').type('2025-07-01');
            cy.get('[data-testid=leave-end-date]').type('2025-07-07');
            cy.get('[data-testid=submit-leave-button]').click();

            // Aller au planning et essayer d'affecter le chirurgien pendant son congé
            cy.visitAsAuthenticatedUser('/bloc-operatoire');
            cy.get('[data-testid=week-selector]').type('2025-07-01');
            
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-tuesday-morning-room1]'); // 2 juillet

            // Vérifier le blocage
            cy.get('[data-testid=leave-conflict-error]')
                .should('be.visible')
                .and('contain', 'Dr Dupont est en congé du 01/07 au 07/07');
        });

        it('valide les effectifs minimums par secteur', () => {
            cy.visitAsAuthenticatedUser('/bloc-operatoire');

            // Afficher la vue par secteur
            cy.get('[data-testid=view-by-sector]').click();

            // Vérifier l'indicateur d'effectif minimum
            cy.get('[data-testid=sector-urgences]').within(() => {
                cy.get('[data-testid=minimum-staff-indicator]')
                    .should('contain', '2/3')
                    .and('have.class', 'below-minimum');
            });

            // Essayer de retirer un chirurgien d'un secteur sous-effectif
            cy.get('[data-testid=sector-urgences]')
                .find('[data-testid=assignment-badge]')
                .first()
                .rightclick();

            cy.get('[data-testid=context-menu]').contains('Supprimer').click();

            // Vérifier le blocage
            cy.get('[data-testid=minimum-staff-error]')
                .should('be.visible')
                .and('contain', 'Effectif minimum non respecté (3 requis)');
        });

        it('valide les règles personnalisées dynamiques', () => {
            // Accéder à la configuration des règles
            cy.visitAsAuthenticatedUser('/admin/rules');

            // Créer une règle personnalisée
            cy.get('[data-testid=create-rule-button]').click();
            cy.get('[data-testid=rule-name]').type('Limite interventions complexes');
            cy.get('[data-testid=rule-type]').select('Limite quotidienne');
            cy.get('[data-testid=rule-condition]').type('interventions.complexity = "high"');
            cy.get('[data-testid=rule-limit]').type('2');
            cy.get('[data-testid=rule-scope]').select('Par chirurgien');
            cy.get('[data-testid=save-rule]').click();

            // Aller au planning et tester la règle
            cy.visitAsAuthenticatedUser('/bloc-operatoire');

            // Créer 2 interventions complexes
            for (let i = 0; i < 2; i++) {
                cy.get('[data-testid=slot-monday-morning-room' + (i+1) + ']').click();
                cy.get('[data-testid=intervention-type]').select('Chirurgie complexe');
                cy.get('[data-testid=surgeon-select]').select('Dr Expert');
                cy.get('[data-testid=submit-assignment]').click();
            }

            // Essayer d'en créer une 3ème
            cy.get('[data-testid=slot-monday-afternoon-room1]').click();
            cy.get('[data-testid=intervention-type]').select('Chirurgie complexe');
            cy.get('[data-testid=surgeon-select]').select('Dr Expert');
            cy.get('[data-testid=submit-assignment]').click();

            // Vérifier le blocage par la règle personnalisée
            cy.get('[data-testid=custom-rule-violation]')
                .should('be.visible')
                .and('contain', 'Limite interventions complexes: max 2 par jour');
        });
    });

    describe('Tableau de bord des violations de règles', () => {
        it('affiche un récapitulatif des violations en temps réel', () => {
            cy.visitAsAuthenticatedUser('/admin/rules-dashboard');

            // Vérifier l'affichage du tableau de bord
            cy.get('[data-testid=rules-dashboard]').within(() => {
                // Statistiques globales
                cy.get('[data-testid=total-violations]').should('exist');
                cy.get('[data-testid=critical-violations]').should('exist');
                cy.get('[data-testid=warning-violations]').should('exist');

                // Liste des violations actives
                cy.get('[data-testid=violations-list]').within(() => {
                    cy.get('[data-testid=violation-item]').should('have.length.greaterThan', 0);
                });
            });

            // Filtrer par type de règle
            cy.get('[data-testid=filter-rule-type]').select('Temps de travail');
            cy.get('[data-testid=violations-list]')
                .find('[data-testid=violation-item]')
                .each(($item) => {
                    cy.wrap($item).should('contain', 'temps');
                });

            // Exporter le rapport
            cy.get('[data-testid=export-violations-report]').click();
            cy.readFile('cypress/downloads/violations-report.csv').should('exist');
        });

        it('permet de résoudre les violations suggérées', () => {
            cy.visitAsAuthenticatedUser('/admin/rules-dashboard');

            // Cliquer sur une violation avec suggestion
            cy.get('[data-testid=violation-with-suggestion]').first().click();

            // Vérifier les détails et suggestions
            cy.get('[data-testid=violation-details-modal]').within(() => {
                cy.contains('Détails de la violation').should('exist');
                cy.get('[data-testid=violation-description]').should('exist');
                cy.get('[data-testid=suggested-actions]').should('exist');

                // Appliquer une suggestion
                cy.get('[data-testid=apply-suggestion-1]').click();
            });

            // Confirmer l'application
            cy.get('[data-testid=confirm-suggestion-modal]').within(() => {
                cy.get('[data-testid=confirm-apply]').click();
            });

            // Vérifier que la violation est résolue
            cy.get('[data-testid=notification-success]')
                .should('contain', 'Violation résolue avec succès');
        });
    });
});