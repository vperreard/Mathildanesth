describe('Gestion des plannings', () => {
    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        name: 'Admin Test',
        id: 'user-1'
    };

    const surgeonUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin',
        id: 'user-2'
    };

    beforeEach(() => {
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les données de test
        cy.task('seedTestData', {
            fixtures: ['users', 'surgeons', 'operatingRooms', 'specialties']
        });

        // Se connecter en tant qu'administrateur
        cy.loginByApi(adminUser.email, adminUser.password);
    });

    it('permet de générer un planning hebdomadaire', () => {
        cy.visitAsAuthenticatedUser('/planning/generator');
        cy.contains('h1', 'Générateur de planning').should('be.visible'); // Vérifier que la page de base est là

        const nextMonday = getNextMonday();
        cy.log('Tentative de sélection de la date de début...');
        // Augmenter le timeout spécifiquement pour cet élément
        cy.get('#dateDebut', { timeout: 10000 }).should('be.visible').type(nextMonday.toISOString().split('T')[0]);
        cy.log('Date de début sélectionnée.');

        // Sélectionner un secteur opératoire
        cy.get('[data-cy=sector-select]').click();
        cy.get('[data-cy=sector-option-1]').click();

        // Définir les paramètres de génération
        cy.get('[data-cy=include-weekends]').click(); // Désactiver les weekends
        cy.get('[data-cy=respect-preferences]').click(); // Activer le respect des préférences
        cy.get('[data-cy=balance-workload]').click(); // Activer l'équilibrage de charge

        // Intercepter la requête de génération
        cy.intercept('POST', '**/api/planning/generate').as('generatePlanning');

        // Lancer la génération
        cy.get('[data-cy=generate-planning-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@generatePlanning').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Planning généré avec succès');

        // Vérifier que le planning a été généré et redirige vers la vue du planning
        cy.url().should('include', '/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');
        cy.get('table').should('be.visible');
    });

    it('permet de modifier manuellement un planning', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');

        cy.log('Attente des cellules de planning...');
        // Augmenter le timeout pour trouver une cellule vide
        cy.get('td[data-date]', { timeout: 15000 }).not(':has(div)').first().should('be.visible').click();
        cy.log('Cellule vide cliquée.');

        // Vérifier que le modal d'édition s'ouvre
        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[data-cy=assignment-modal]').should('be.visible');

        // Sélectionner un chirurgien
        cy.get('[data-cy=surgeon-select]').click();
        cy.get('[data-cy=surgeon-option]').first().click();

        // Sélectionner un MAR (Médecin Anesthésiste Réanimateur)
        cy.get('[data-cy=mar-select]').click();
        cy.get('[data-cy=mar-option]').first().click();

        // Ajouter un IADE (optionnel)
        cy.get('[data-cy=add-iade-checkbox]').click();
        cy.get('[data-cy=iade-select]').click();
        cy.get('[data-cy=iade-option]').first().click();

        // Définir le type d'intervention
        cy.get('[data-cy=assignment-type-select]').click();
        cy.get('[data-cy=assignment-type-option-standard]').click();

        // Ajouter des notes
        cy.get('[data-cy=assignment-notes]').type('Intervention programmée manuellement');

        // Intercepter la requête de création
        cy.intercept('POST', '**/api/planning/assignments').as('createAssignment');

        // Enregistrer l'assignation
        cy.get('[data-cy=save-assignment-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@createAssignment').its('response.statusCode').should('eq', 201);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Assignation créée');

        // Vérifier que le créneau est maintenant occupé
        cy.get('td[data-date] div[draggable="true"]').should('have.length.at.least', 1);
    });

    it('permet de modifier une assignation existante', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');

        createTestAssignment(); // S'assure qu'une assignation existe

        cy.log('Attente de l\'assignation à modifier...');
        // Augmenter le timeout pour trouver l'assignation
        cy.get('td[data-date] div[draggable="true"]', { timeout: 10000 }).first().should('be.visible').click();
        cy.log('Assignation cliquée.');

        // Vérifier que le modal d'édition s'ouvre
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('[data-cy=assignment-modal]').should('be.visible');

        // Modifier les notes
        cy.get('[data-cy=assignment-notes]').clear().type('Intervention modifiée');

        // Intercepter la requête de mise à jour
        cy.intercept('PUT', '**/api/planning/assignments/**').as('updateAssignment');

        // Enregistrer les modifications
        cy.get('[data-cy=save-assignment-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@updateAssignment').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Assignation mise à jour');
    });

    it('permet de supprimer une assignation', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');

        createTestAssignment();

        cy.log('Attente de l\'assignation à supprimer...');
        cy.get('td[data-date] div[draggable="true"]', { timeout: 10000 }).first().should('be.visible').click();
        cy.log('Assignation cliquée.');

        // Vérifier que le modal d'édition s'ouvre
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('[data-cy=assignment-modal]').should('be.visible');

        // Intercepter la requête de suppression
        cy.intercept('DELETE', '**/api/planning/assignments/**').as('deleteAssignment');

        // Cliquer sur le bouton de suppression
        cy.get('[data-cy=delete-assignment-button]').click();

        // Confirmer la suppression
        cy.get('[data-cy=confirm-delete-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@deleteAssignment').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Assignation supprimée');

        // Vérifier que le créneau est maintenant vide
        cy.get('td[data-date] div[draggable="true"]').should('not.exist');
    });

    it('permet de publier un planning', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');

        createTestAssignment();

        cy.log('Attente du bouton Publier...');
        // Augmenter le timeout si nécessaire, et s'assurer que le sélecteur est bon
        cy.get('[data-cy=publish-planning-button]', { timeout: 10000 }).should('be.visible').click();
        // NOTE: Ce data-cy existe-t-il vraiment ? A vérifier.

        // Confirmer la publication
        cy.get('[data-cy=confirm-publish-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@publishPlanning').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Planning publié');

        // Vérifier que le planning est marqué comme publié
        cy.get('[data-cy=published-badge]').should('be.visible');
    });

    it('permet de détecter les conflits lors de la génération d\'un planning', () => {
        cy.visitAsAuthenticatedUser('/planning/generator');
        cy.contains('h1', 'Générateur de planning').should('be.visible');

        const nextMonday = getNextMonday();
        cy.log('Tentative de sélection de la date de début (conflits)...');
        cy.get('#dateDebut', { timeout: 10000 }).should('be.visible').type(nextMonday.toISOString().split('T')[0]);
        cy.log('Date de début sélectionnée (conflits).');

        // Sélectionner un secteur opératoire
        cy.get('[data-cy=sector-select]').click();
        cy.get('[data-cy=sector-option-1]').click();

        // Activer la détection de conflits stricte
        cy.get('[data-cy=strict-conflict-detection]').click();

        // Simuler un conflit (par exemple, en créant manuellement une absence pour un médecin)
        createConflictingLeave();

        // Intercepter la requête de génération
        cy.intercept('POST', '**/api/planning/generate').as('generatePlanning');

        // Lancer la génération
        cy.get('[data-cy=generate-planning-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@generatePlanning');

        // Vérifier l'affichage des conflits
        cy.get('[data-cy=conflicts-modal]').should('be.visible');
        cy.get('[data-cy=conflict-item]').should('have.length.at.least', 1);

        // Résoudre les conflits en ignorant
        cy.get('[data-cy=ignore-conflicts-button]').click();

        // Vérifier que le planning est généré malgré les conflits
        cy.url().should('include', '/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');
        cy.get('table').should('be.visible');
    });

    it('permet aux utilisateurs standards de visualiser leur planning', () => {
        cy.loginByApi('mar@example.com', 'Test123!');
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.contains('h1', 'Planning Hebdomadaire').should('be.visible');

        cy.log('Attente du tableau de planning pour utilisateur standard...');
        cy.get('table', { timeout: 10000 }).should('be.visible');
        cy.log('Tableau trouvé.');

        // Vérifier que le planning est visible mais que les contrôles admin sont absents
        cy.get('table').should('be.visible');
        cy.get('[data-cy=generate-planning-button]').should('not.exist');
        cy.get('[data-cy=publish-planning-button]').should('not.exist');

        // Optionnel: vérifier des éléments spécifiques au rôle USER
        cy.contains('Mon Planning');

        // Déconnexion
        cy.request('/api/auth/logout');
        cy.url().should('include', '/auth/login');
    });

    // Fonctions utilitaires pour les tests
    function getNextMonday() {
        const date = new Date();
        const day = date.getDay(); // 0 = dimanche, 1 = lundi, ...
        const diff = day === 0 ? 1 : 8 - day; // Si dimanche, ajouter 1 jour, sinon ajouter 8 - jour actuel
        date.setDate(date.getDate() + diff);
        return date;
    }

    function createTestAssignment() {
        // Cliquer sur un créneau vide pour l'éditer
        cy.get('td[data-date]').not(':has(div)').first().click({ force: true });
        cy.wait(500);

        // Remplir le formulaire
        cy.get('[data-cy=surgeon-select]').click();
        cy.get('[data-cy=surgeon-option]').first().click();

        cy.get('[data-cy=mar-select]').click();
        cy.get('[data-cy=mar-option]').first().click();

        cy.get('[data-cy=assignment-type-select]').click();
        cy.get('[data-cy=assignment-type-option-standard]').click();

        // Intercepter la requête de création
        cy.intercept('POST', '**/api/planning/assignments').as('createTestAssignment');

        // Enregistrer l'assignation
        cy.get('[data-cy=save-assignment-button]').click();

        // Attendre la fin de la requête
        cy.wait('@createTestAssignment');
        cy.get('[role="dialog"][aria-modal="true"]').should('not.exist');
    }

    function createConflictingLeave() {
        // Créer une absence pour un médecin pendant la période du planning
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/leaves`,
            headers: {
                'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
            },
            body: {
                userId: surgeonUser.id,
                startDate: getNextMonday().toISOString(),
                endDate: (() => {
                    const endDate = getNextMonday();
                    endDate.setDate(endDate.getDate() + 1);
                    return endDate.toISOString();
                })(),
                type: 'congés payés',
                notes: 'Absence pour test de conflit'
            }
        });
    }
}); 