describe('Opérations du calendrier', () => {
    const testUser = {
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
            fixtures: ['users', 'leaves', 'events']
        });

        // Se connecter et accéder au calendrier
        cy.loginByApi(testUser.email, testUser.password);
        cy.visitAsAuthenticatedUser('/calendrier');
    });

    it('affiche correctement le calendrier avec des événements', () => {
        // Vérifier que le calendrier est affiché
        cy.get('[data-cy=calendar]').should('be.visible');

        // Vérifier que des événements sont affichés
        cy.get('[data-cy=calendar-event]').should('have.length.at.least', 1);

        // Vérifier les différentes vues du calendrier
        cy.get('[data-cy=view-month]').click();
        cy.get('[data-cy=calendar-month-view]').should('be.visible');

        cy.get('[data-cy=view-week]').click();
        cy.get('[data-cy=calendar-week-view]').should('be.visible');

        cy.get('[data-cy=view-day]').click();
        cy.get('[data-cy=calendar-day-view]').should('be.visible');
    });

    it('permet de naviguer entre les périodes du calendrier', () => {
        // Naviguer vers le mois suivant
        cy.get('[data-cy=next-period]').click();

        // Vérifier que le titre du calendrier a changé
        cy.get('[data-cy=calendar-title]').invoke('text').as('nextMonthTitle');

        // Naviguer vers le mois précédent (retour au mois actuel)
        cy.get('[data-cy=prev-period]').click();

        // Vérifier que le titre a changé
        cy.get('[data-cy=calendar-title]').invoke('text').as('currentMonthTitle');

        // Vérifier que les deux titres sont différents
        cy.get('@nextMonthTitle').then(nextTitle => {
            cy.get('@currentMonthTitle').then(currentTitle => {
                expect(nextTitle).not.to.equal(currentTitle);
            });
        });

        // Revenir à aujourd'hui
        cy.get('[data-cy=today-button]').click();

        // Vérifier que le jour actuel est mis en évidence
        const today = new Date();
        const formattedDate = today.getDate().toString();
        cy.get(`[data-cy=calendar-day-${formattedDate}].fc-day-today`).should('exist');
    });

    it('permet de créer un nouvel événement', () => {
        // Cliquer sur une cellule du calendrier pour créer un événement
        cy.get('[data-cy=calendar-day-cell]').first().click();

        // Vérifier que le modal de création d'événement s'ouvre
        cy.get('[data-cy=event-modal]').should('be.visible');

        // Remplir le formulaire
        cy.get('[data-cy=event-title]').type('Réunion de service');
        cy.get('[data-cy=event-description]').type('Discussion des cas cliniques');

        // Sélectionner le type d'événement
        cy.get('[data-cy=event-type-select]').click();
        cy.get('[data-cy=event-type-meeting]').click();

        // Définir les dates
        // Note: Les dates sont généralement déjà définies par la cellule cliquée

        // Intercepter la requête de création
        cy.intercept('POST', '**/api/calendrier/events').as('createEvent');

        // Enregistrer l'événement
        cy.get('[data-cy=save-event-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@createEvent').its('response.statusCode').should('eq', 201);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Événement créé');

        // Vérifier que l'événement apparaît dans le calendrier
        cy.get('[data-cy=calendar-event]:contains("Réunion de service")').should('be.visible');
    });

    it('permet de modifier un événement existant', () => {
        // Trouver et cliquer sur un événement existant
        cy.get('[data-cy=calendar-event]').first().click();

        // Vérifier que le modal d'édition s'ouvre
        cy.get('[data-cy=event-modal]').should('be.visible');

        // Modifier le titre
        cy.get('[data-cy=event-title]').clear().type('Événement modifié');

        // Intercepter la requête de mise à jour
        cy.intercept('PUT', '**/api/calendrier/events/**').as('updateEvent');

        // Enregistrer les modifications
        cy.get('[data-cy=save-event-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@updateEvent').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Événement mis à jour');

        // Vérifier que l'événement modifié apparaît dans le calendrier
        cy.get('[data-cy=calendar-event]:contains("Événement modifié")').should('be.visible');
    });

    it('permet de supprimer un événement', () => {
        // Trouver et cliquer sur un événement existant
        cy.get('[data-cy=calendar-event]').first().as('targetEvent');
        cy.get('@targetEvent').click();

        // Vérifier que le modal d'édition s'ouvre
        cy.get('[data-cy=event-modal]').should('be.visible');

        // Intercepter la requête de suppression
        cy.intercept('DELETE', '**/api/calendrier/events/**').as('deleteEvent');

        // Cliquer sur le bouton de suppression
        cy.get('[data-cy=delete-event-button]').click();

        // Confirmer la suppression
        cy.get('[data-cy=confirm-delete-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@deleteEvent').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Événement supprimé');

        // Conserver le texte de l'événement supprimé
        cy.get('@targetEvent').invoke('text').as('deletedEventText');

        // Vérifier que l'événement n'apparaît plus dans le calendrier
        cy.get('@deletedEventText').then(text => {
            cy.get(`[data-cy=calendar-event]:contains("${text}")`).should('not.exist');
        });
    });

    it('permet de filtrer les événements par type', () => {
        // Vérifier le nombre initial d'événements
        cy.get('[data-cy=calendar-event]').its('length').as('initialEventCount');

        // Ouvrir les filtres
        cy.get('[data-cy=filter-button]').click();

        // Désélectionner tous les types d'événements sauf un
        cy.get('[data-cy=filter-checkbox-meeting]').click(); // Décocher Réunions
        cy.get('[data-cy=filter-checkbox-training]').click(); // Décocher Formations
        // Laisse seulement "Congés" sélectionné

        // Appliquer les filtres
        cy.get('[data-cy=apply-filters-button]').click();

        // Vérifier que le nombre d'événements a changé
        cy.get('[data-cy=calendar-event]').its('length').as('filteredEventCount');

        // Comparer les compteurs
        cy.get('@initialEventCount').then(initialCount => {
            cy.get('@filteredEventCount').then(filteredCount => {
                expect(Number(filteredCount)).to.be.lessThan(Number(initialCount));
            });
        });

        // Réinitialiser les filtres
        cy.get('[data-cy=filter-button]').click();
        cy.get('[data-cy=reset-filters-button]').click();

        // Vérifier que tous les événements sont à nouveau affichés
        cy.get('[data-cy=calendar-event]').its('length').should('eq', cy.get('@initialEventCount'));
    });

    it('permet de rechercher des événements par mot-clé', () => {
        // Effectuer une recherche
        cy.get('[data-cy=search-input]').type('Réunion');
        cy.get('[data-cy=search-button]').click();

        // Vérifier que seuls les événements correspondants sont affichés
        cy.get('[data-cy=calendar-event]').each(($event) => {
            cy.wrap($event).should('contain', 'Réunion');
        });

        // Effacer la recherche
        cy.get('[data-cy=clear-search-button]').click();

        // Vérifier que tous les événements sont à nouveau affichés
        cy.get('[data-cy=calendar-event]').should('have.length.at.least', 1);
    });

    it('permet d\'exporter le calendrier', () => {
        // Cliquer sur le bouton d'export
        cy.get('[data-cy=export-button]').click();

        // Choisir le format d'export
        cy.get('[data-cy=export-option-ical]').click();

        // Vérifier que le fichier est téléchargé
        cy.readFile('cypress/downloads/calendrier.ics').should('exist');

        // Tester également l'export PDF
        cy.get('[data-cy=export-button]').click();
        cy.get('[data-cy=export-option-pdf]').click();

        // Vérifier que le fichier PDF est téléchargé
        cy.readFile('cypress/downloads/calendrier.pdf').should('exist');
    });
}); 