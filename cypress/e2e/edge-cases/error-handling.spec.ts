describe('Gestion des erreurs et cas limites', () => {
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin',
        id: 'user-2'
    };

    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        name: 'Admin Test',
        id: 'user-1'
    };

    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les données de test
        cy.task('seedTestData', {
            fixtures: ['users', 'leaves']
        });
    });

    it('gère correctement les erreurs de validation du formulaire de congés', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/conges/nouveau');

        // Soumettre le formulaire sans remplir les champs obligatoires
        cy.get('[data-cy=submit-leave-request]').click();

        // Vérifier que les erreurs de validation s'affichent
        cy.get('[data-cy=validation-error]').should('have.length.at.least', 2);
        cy.get('[data-cy=type-validation-error]').should('be.visible');
        cy.get('[data-cy=dates-validation-error]').should('be.visible');

        // Remplir partiellement le formulaire
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        // Soumettre à nouveau
        cy.get('[data-cy=submit-leave-request]').click();

        // Vérifier que l'erreur sur le type a disparu mais que l'erreur sur les dates persiste
        cy.get('[data-cy=type-validation-error]').should('not.exist');
        cy.get('[data-cy=dates-validation-error]').should('be.visible');
    });

    it('gère les erreurs de serveur lors de la soumission d\'un formulaire', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/conges/nouveau');

        // Remplir le formulaire
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        cy.selectDate('[data-cy=start-date-input]', tomorrow);
        cy.selectDate('[data-cy=end-date-input]', nextWeek);

        // Simuler une erreur serveur
        cy.intercept('POST', '**/api/conges', {
            statusCode: 500,
            body: {
                message: 'Erreur interne du serveur'
            }
        }).as('serverError');

        // Soumettre le formulaire
        cy.get('[data-cy=submit-leave-request]').click();

        // Attendre la requête interceptée
        cy.wait('@serverError');

        // Vérifier que l'erreur est bien affichée
        cy.get('[data-cy=notification-error]')
            .should('be.visible')
            .and('contain', 'Erreur');

        // Vérifier que le formulaire est toujours affiché avec les données
        cy.get('[data-cy=leave-form]').should('be.visible');
    });

    it('gère les problèmes de réseau lors des requêtes API', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page des congés
        cy.visitAsAuthenticatedUser('/conges');

        // Simuler une erreur réseau pour le chargement des congés
        cy.intercept('GET', '**/api/conges**', {
            forceNetworkError: true
        }).as('networkError');

        // Rafraîchir la page pour déclencher la requête
        cy.reload();

        // Vérifier que l'erreur réseau est bien gérée
        cy.get('[data-cy=network-error-message]')
            .should('be.visible')
            .and('contain', 'Erreur de connexion');

        // Vérifier qu'un bouton de réessai est disponible
        cy.get('[data-cy=retry-button]').should('be.visible');

        // Simuler le retour du réseau
        cy.intercept('GET', '**/api/conges**').as('leavesRequest');

        // Cliquer sur le bouton de réessai
        cy.get('[data-cy=retry-button]').click();

        // Attendre la nouvelle requête
        cy.wait('@leavesRequest');

        // Vérifier que les données s'affichent
        cy.get('[data-cy=leave-list]').should('be.visible');
    });

    it('gère correctement la validation des dates de congés chevauchantes', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/conges/nouveau');

        // Remplir le formulaire avec des dates qui chevauchent un congé existant
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        // Utiliser les dates du congé déjà existant (d'après les fixtures)
        // const existingLeaveStart = new Date('2024-06-01T00:00:00.000Z');
        // const existingLeaveEnd = new Date('2024-06-14T23:59:59.999Z');

        // Choisir des dates qui chevauchent
        const overlapStart = new Date('2024-06-10T00:00:00.000Z');
        const overlapEnd = new Date('2024-06-20T00:00:00.000Z');

        cy.selectDate('[data-cy=start-date-input]', overlapStart);
        cy.selectDate('[data-cy=end-date-input]', overlapEnd);

        // Ajouter des notes
        cy.get('[data-cy=leave-notes]').type('Congés chevauchants');

        // Soumettre le formulaire
        cy.get('[data-cy=submit-leave-request]').click();

        // Vérifier l'affichage de l'avertissement de chevauchement
        cy.get('[data-cy=overlap-warning]')
            .should('be.visible')
            .and('contain', 'chevauchement');

        // Vérifier que des options sont proposées
        cy.get('[data-cy=continue-anyway-button]').should('be.visible');
        cy.get('[data-cy=modify-dates-button]').should('be.visible');
    });

    it('empêche la création de congés avec des dates invalides', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/conges/nouveau');

        // Remplir le formulaire avec une date de fin antérieure à la date de début
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const earlierDate = new Date();
        earlierDate.setDate(earlierDate.getDate() + 5);

        cy.selectDate('[data-cy=start-date-input]', futureDate);
        cy.selectDate('[data-cy=end-date-input]', earlierDate);

        // Vérifier que le message d'erreur sur les dates s'affiche
        cy.get('[data-cy=date-order-error]')
            .should('be.visible')
            .and('contain', 'La date de fin doit être postérieure à la date de début');

        // Vérifier que le bouton de soumission est désactivé
        cy.get('[data-cy=submit-leave-request]').should('be.disabled');
    });

    it('gère correctement la session expirée', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à une page protégée
        cy.visitAsAuthenticatedUser('/conges');

        // Simuler une expiration de session en modifiant le token
        cy.window().then(win => {
            // Sauvegarder le token original pour restauration ultérieure
            const originalToken = win.localStorage.getItem('authToken');

            // Remplacer par un token invalide/expiré
            win.localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

            // Simuler une erreur d'authentification pour la prochaine requête API
            cy.intercept('GET', '**/api/conges**', {
                statusCode: 401,
                body: {
                    message: 'Token expiré ou invalide'
                }
            }).as('authError');

            // Déclencher une requête API
            cy.reload();

            // Attendre la requête interceptée
            cy.wait('@authError');

            // Vérifier la redirection vers la page de connexion
            cy.url().should('include', '/auth/connexion');

            // Vérifier l'affichage d'un message d'erreur
            cy.get('[data-cy=notification-error]')
                .should('be.visible')
                .and('contain', 'Session expirée');

            // Restaurer le token original pour ne pas affecter les tests suivants
            cy.window().then(win => {
                win.localStorage.setItem('authToken', originalToken);
            });
        });
    });

    it('gère les accès non autorisés aux fonctionnalités d\'administration', () => {
        // Se connecter en tant qu'utilisateur standard
        cy.loginByApi(testUser.email, testUser.password);

        // Essayer d'accéder à une page d'administration
        cy.visitAsAuthenticatedUser('/admin/conges');

        // Vérifier la redirection ou l'affichage d'un message d'erreur
        cy.get('[data-cy=access-denied-message]')
            .should('be.visible')
            .and('contain', 'Accès refusé');

        // Vérifier que les fonctionnalités d'administration ne sont pas accessibles
        cy.get('[data-cy=admin-functions]').should('not.exist');
    });

    it('gère correctement le cas d\'un planning complet lors de l\'ajout d\'une nouvelle vacation', () => {
        // Se connecter en tant qu'administrateur
        cy.loginByApi(adminUser.email, adminUser.password);

        // Accéder à la page de planning
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');

        // Sélectionner une semaine
        const nextMonday = new Date();
        const day = nextMonday.getDay(); // 0 = dimanche, 1 = lundi, ...
        const diff = day === 0 ? 1 : 8 - day; // Si dimanche, ajouter 1 jour, sinon ajouter 8 - jour actuel
        nextMonday.setDate(nextMonday.getDate() + diff);

        cy.selectDate('[data-cy=week-select]', nextMonday);

        // Simuler un planning complet
        cy.intercept('GET', '**/api/planning/availability**', {
            statusCode: 200,
            body: {
                available: false,
                message: 'Toutes les salles sont déjà réservées pour cette période'
            }
        }).as('availabilityCheck');

        // Essayer d'ajouter une nouvelle vacation
        cy.get('[data-cy=add-assignment-button]').click();

        // Vérifier l'affichage d'un message indiquant que le planning est complet
        cy.get('[data-cy=planning-full-message]')
            .should('be.visible')
            .and('contain', 'Toutes les salles sont déjà réservées');

        // Vérifier qu'il n'est pas possible d'ajouter une nouvelle vacation
        cy.get('[data-cy=assignment-modal]').should('not.exist');
    });
}); 