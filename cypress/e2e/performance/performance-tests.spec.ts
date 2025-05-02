describe('Tests de performance', () => {
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
            fixtures: ['users']
        });

        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);
    });

    it('évalue les performances de la page d\'accueil', () => {
        cy.visitAsAuthenticatedUser('/dashboard');
        cy.runLighthouseAudit();
    });

    it('évalue les performances de la page de congés', () => {
        cy.visitAsAuthenticatedUser('/leaves');
        cy.runLighthouseAudit();
    });

    it('évalue les performances du calendrier', () => {
        cy.visitAsAuthenticatedUser('/calendar');
        cy.runLighthouseAudit();
    });

    it('évalue les performances du planning', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');
        cy.runLighthouseAudit();
    });
}); 