describe('Gestion des plannings bloc opératoire', () => {
    // Utilisateur administrateur pour les tests
    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        name: 'Admin'
    };

    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser et préparer les données de test
        cy.task('resetTestDatabase');
        cy.task('seedTestData', {
            fixtures: ['users', 'operatingRooms', 'surgeons', 'specialties']
        });

        // Se connecter en tant qu'admin
        cy.loginByApi(adminUser.email, adminUser.password);
        cy.visitAsAuthenticatedUser('/bloc-operatoire');
    });

    describe('Visualisation du planning', () => {
        it('affiche correctement la vue hebdomadaire du planning', () => {
            // Vérifier les éléments principaux
            cy.get('[data-testid=planning-header]').should('be.visible');
            cy.get('[data-testid=week-selector]').should('be.visible');
            cy.get('[data-testid=planning-grid]').should('be.visible');

            // Vérifier l'affichage des salles d'opération
            cy.get('[data-testid=operating-rooms-list]').within(() => {
                cy.contains('Salle 1').should('exist');
                cy.contains('Salle 2').should('exist');
                cy.contains('Salle Urgences').should('exist');
            });

            // Vérifier l'affichage des jours de la semaine
            const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
            jours.forEach(jour => {
                cy.get('[data-testid=planning-grid]').contains(jour).should('exist');
            });
        });

        it('permet de naviguer entre les semaines', () => {
            // Noter la semaine actuelle
            cy.get('[data-testid=current-week-label]')
                .invoke('text')
                .then((currentWeek) => {
                    // Aller à la semaine suivante
                    cy.get('[data-testid=next-week-button]').click();

                    // Vérifier que la semaine a changé
                    cy.get('[data-testid=current-week-label]')
                        .invoke('text')
                        .should('not.equal', currentWeek);

                    // Revenir à la semaine précédente
                    cy.get('[data-testid=prev-week-button]').click();

                    // Vérifier qu'on est revenu à la semaine initiale
                    cy.get('[data-testid=current-week-label]')
                        .invoke('text')
                        .should('equal', currentWeek);
                });
        });

        it('permet de filtrer par secteur', () => {
            // Sélectionner un secteur spécifique
            cy.get('[data-testid=sector-filter]').select('Chirurgie');

            // Vérifier que seules les salles du secteur sont affichées
            cy.get('[data-testid=operating-rooms-list]').within(() => {
                cy.contains('Salle 1').should('exist');
                cy.contains('Salle 2').should('exist');
                cy.contains('Endoscopie').should('not.exist');
            });
        });
    });

    describe('Création d\'affectations', () => {
        it('permet de créer une affectation par glisser-déposer', () => {
            // Sélectionner un chirurgien dans la liste
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .as('surgeon');

            // Glisser-déposer sur un créneau
            cy.get('@surgeon').drag('[data-testid=slot-monday-morning-room1]');

            // Vérifier que l'affectation est créée
            cy.get('[data-testid=slot-monday-morning-room1]').within(() => {
                cy.contains('Dr Dupont').should('exist');
                cy.get('[data-testid=assignment-badge]').should('have.class', 'assigned');
            });

            // Vérifier la notification de succès
            cy.get('[data-testid=notification-success]')
                .should('be.visible')
                .and('contain', 'Affectation créée avec succès');
        });

        it('permet de créer une affectation via le formulaire', () => {
            // Cliquer sur un créneau vide
            cy.get('[data-testid=slot-tuesday-afternoon-room2]').click();

            // Remplir le formulaire d'affectation
            cy.get('[data-testid=assignment-modal]').within(() => {
                cy.get('[data-testid=surgeon-select]').select('Dr Martin');
                cy.get('[data-testid=specialty-select]').select('Orthopédie');
                cy.get('[data-testid=assignment-type]').select('Intervention');
                cy.get('[data-testid=notes-input]').type('Prothèse de hanche');
                cy.get('[data-testid=submit-assignment]').click();
            });

            // Vérifier que l'affectation est créée
            cy.get('[data-testid=slot-tuesday-afternoon-room2]').within(() => {
                cy.contains('Dr Martin').should('exist');
                cy.contains('Orthopédie').should('exist');
            });
        });

        it('valide les règles métier lors de la création', () => {
            // Essayer d'affecter un chirurgien déjà occupé
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-monday-morning-room1]');

            // Essayer de l'affecter à nouveau au même moment
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-monday-morning-room2]');

            // Vérifier l'avertissement de conflit
            cy.get('[data-testid=conflict-warning]')
                .should('be.visible')
                .and('contain', 'Dr Dupont est déjà affecté à ce créneau');
        });

        it('vérifie les compétences pour les salles spécialisées', () => {
            // Essayer d'affecter un chirurgien non qualifié en endoscopie
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Orthopédiste')
                .drag('[data-testid=slot-wednesday-morning-endoscopy]');

            // Vérifier l'avertissement de compétence
            cy.get('[data-testid=skill-warning]')
                .should('be.visible')
                .and('contain', 'Dr Orthopédiste n\'est pas qualifié pour l\'endoscopie');
        });
    });

    describe('Modification d\'affectations', () => {
        it('permet de modifier une affectation existante', () => {
            // Créer d'abord une affectation
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-thursday-morning-room1]');

            // Double-cliquer pour modifier
            cy.get('[data-testid=slot-thursday-morning-room1]').dblclick();

            // Modifier les détails
            cy.get('[data-testid=assignment-modal]').within(() => {
                cy.get('[data-testid=specialty-select]').select('Neurochirurgie');
                cy.get('[data-testid=notes-input]').clear().type('Intervention modifiée');
                cy.get('[data-testid=update-assignment]').click();
            });

            // Vérifier les modifications
            cy.get('[data-testid=slot-thursday-morning-room1]').within(() => {
                cy.contains('Neurochirurgie').should('exist');
            });
        });

        it('permet de déplacer une affectation par glisser-déposer', () => {
            // Créer une affectation
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Martin')
                .drag('[data-testid=slot-friday-morning-room1]');

            // Déplacer l'affectation vers un autre créneau
            cy.get('[data-testid=slot-friday-morning-room1]')
                .find('[data-testid=assignment-badge]')
                .drag('[data-testid=slot-friday-afternoon-room2]');

            // Vérifier le déplacement
            cy.get('[data-testid=slot-friday-morning-room1]')
                .should('not.contain', 'Dr Martin');
            cy.get('[data-testid=slot-friday-afternoon-room2]')
                .should('contain', 'Dr Martin');
        });

        it('propose des créneaux alternatifs en cas de conflit', () => {
            // Créer deux affectations
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-monday-morning-room1]');

            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Martin')
                .drag('[data-testid=slot-monday-morning-room2]');

            // Essayer de déplacer la première sur la seconde
            cy.get('[data-testid=slot-monday-morning-room1]')
                .find('[data-testid=assignment-badge]')
                .drag('[data-testid=slot-monday-morning-room2]');

            // Vérifier les suggestions
            cy.get('[data-testid=alternative-slots-modal]').within(() => {
                cy.contains('Créneaux alternatifs disponibles').should('exist');
                cy.get('[data-testid=alternative-slot]').should('have.length.greaterThan', 0);
                
                // Choisir une alternative
                cy.get('[data-testid=alternative-slot]').first().click();
            });
        });
    });

    describe('Suppression d\'affectations', () => {
        it('permet de supprimer une affectation', () => {
            // Créer une affectation
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-wednesday-morning-room1]');

            // Cliquer droit pour supprimer
            cy.get('[data-testid=slot-wednesday-morning-room1]')
                .find('[data-testid=assignment-badge]')
                .rightclick();

            cy.get('[data-testid=context-menu]')
                .contains('Supprimer')
                .click();

            // Confirmer la suppression
            cy.get('[data-testid=confirm-delete-modal]').within(() => {
                cy.get('[data-testid=confirm-delete-button]').click();
            });

            // Vérifier la suppression
            cy.get('[data-testid=slot-wednesday-morning-room1]')
                .should('not.contain', 'Dr Dupont');
        });

        it('permet de supprimer plusieurs affectations en lot', () => {
            // Créer plusieurs affectations
            ['room1', 'room2', 'room3'].forEach((room, index) => {
                cy.get('[data-testid=surgeons-list]')
                    .contains(`Dr Test${index + 1}`)
                    .drag(`[data-testid=slot-thursday-morning-${room}]`);
            });

            // Activer le mode sélection multiple
            cy.get('[data-testid=multi-select-toggle]').click();

            // Sélectionner plusieurs affectations
            cy.get('[data-testid^=slot-thursday-morning]')
                .find('[data-testid=assignment-badge]')
                .click({ multiple: true });

            // Supprimer en lot
            cy.get('[data-testid=bulk-delete-button]').click();
            cy.get('[data-testid=confirm-bulk-delete-button]').click();

            // Vérifier la suppression
            ['room1', 'room2', 'room3'].forEach(room => {
                cy.get(`[data-testid=slot-thursday-morning-${room}]`)
                    .should('be.empty');
            });
        });
    });

    describe('Validation des règles métier', () => {
        it('vérifie la règle de supervision pour les internes', () => {
            // Affecter un interne seul
            cy.get('[data-testid=surgeons-list]')
                .contains('Interne Durand')
                .drag('[data-testid=slot-monday-morning-room1]');

            // Vérifier l'avertissement de supervision
            cy.get('[data-testid=supervision-warning]')
                .should('be.visible')
                .and('contain', 'Un interne doit être supervisé par un senior');

            // Ajouter un senior
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Senior')
                .drag('[data-testid=slot-monday-morning-room1]');

            // Vérifier que l'avertissement disparaît
            cy.get('[data-testid=supervision-warning]').should('not.exist');
        });

        it('vérifie les temps de repos obligatoires', () => {
            // Affecter un chirurgien en garde de nuit
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-sunday-night-emergency]');

            // Essayer de l'affecter le lendemain matin
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-monday-morning-room1]');

            // Vérifier l'avertissement de repos
            cy.get('[data-testid=rest-time-warning]')
                .should('be.visible')
                .and('contain', 'Temps de repos insuffisant après une garde');
        });

        it('vérifie le nombre maximum d\'heures hebdomadaires', () => {
            // Affecter un chirurgien sur de nombreux créneaux
            const slots = [
                'monday-morning', 'monday-afternoon',
                'tuesday-morning', 'tuesday-afternoon',
                'wednesday-morning', 'wednesday-afternoon',
                'thursday-morning', 'thursday-afternoon',
                'friday-morning', 'friday-afternoon'
            ];

            slots.forEach(slot => {
                cy.get('[data-testid=surgeons-list]')
                    .contains('Dr Workaholic')
                    .drag(`[data-testid=slot-${slot}-room1]`);
            });

            // Vérifier l'avertissement de dépassement d'heures
            cy.get('[data-testid=hours-limit-warning]')
                .should('be.visible')
                .and('contain', 'Limite d\'heures hebdomadaires dépassée');
        });
    });

    describe('Fonctionnalités avancées', () => {
        it('permet de copier le planning d\'une semaine', () => {
            // Créer quelques affectations
            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Dupont')
                .drag('[data-testid=slot-monday-morning-room1]');

            cy.get('[data-testid=surgeons-list]')
                .contains('Dr Martin')
                .drag('[data-testid=slot-tuesday-afternoon-room2]');

            // Copier le planning
            cy.get('[data-testid=planning-actions-menu]').click();
            cy.get('[data-testid=copy-week-planning]').click();

            // Aller à la semaine suivante
            cy.get('[data-testid=next-week-button]').click();

            // Coller le planning
            cy.get('[data-testid=planning-actions-menu]').click();
            cy.get('[data-testid=paste-week-planning]').click();

            // Vérifier que les affectations sont copiées
            cy.get('[data-testid=slot-monday-morning-room1]')
                .should('contain', 'Dr Dupont');
            cy.get('[data-testid=slot-tuesday-afternoon-room2]')
                .should('contain', 'Dr Martin');
        });

        it('permet d\'exporter le planning en PDF', () => {
            // Ouvrir le menu d'export
            cy.get('[data-testid=export-planning-button]').click();

            // Configurer l'export
            cy.get('[data-testid=export-modal]').within(() => {
                cy.get('[data-testid=export-format-pdf]').check();
                cy.get('[data-testid=include-notes]').check();
                cy.get('[data-testid=export-confirm]').click();
            });

            // Vérifier le téléchargement
            cy.readFile('cypress/downloads/planning-bloc-operatoire.pdf')
                .should('exist');
        });

        it('affiche les statistiques du planning', () => {
            // Créer plusieurs affectations
            // ... (affectations créées)

            // Ouvrir les statistiques
            cy.get('[data-testid=planning-stats-button]').click();

            // Vérifier l'affichage des statistiques
            cy.get('[data-testid=stats-modal]').within(() => {
                cy.contains('Taux d\'occupation').should('exist');
                cy.contains('Heures par chirurgien').should('exist');
                cy.contains('Répartition par spécialité').should('exist');
                cy.get('[data-testid=occupation-chart]').should('be.visible');
            });
        });

        it('permet de générer un planning automatique', () => {
            // Ouvrir l'assistant de génération
            cy.get('[data-testid=auto-generate-button]').click();

            // Configurer les paramètres
            cy.get('[data-testid=generation-modal]').within(() => {
                cy.get('[data-testid=respect-preferences]').check();
                cy.get('[data-testid=balance-workload]').check();
                cy.get('[data-testid=optimize-skills]').check();
                cy.get('[data-testid=generate-planning]').click();
            });

            // Attendre la génération
            cy.get('[data-testid=generation-progress]').should('be.visible');
            cy.get('[data-testid=generation-complete]', { timeout: 30000 })
                .should('be.visible');

            // Vérifier que des affectations ont été créées
            cy.get('[data-testid^=slot-]')
                .find('[data-testid=assignment-badge]')
                .should('have.length.greaterThan', 10);
        });
    });
});