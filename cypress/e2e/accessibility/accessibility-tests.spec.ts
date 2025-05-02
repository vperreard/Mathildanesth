describe('Tests d\'accessibilité', () => {
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

    it('vérifie l\'accessibilité de la page d\'accueil', () => {
        cy.visitAsAuthenticatedUser('/dashboard');

        // Injecter et vérifier l'accessibilité
        cy.checkAccessibility();
    });

    it('vérifie l\'accessibilité de la page de congés', () => {
        cy.visitAsAuthenticatedUser('/leaves');

        // Injecter et vérifier l'accessibilité
        cy.checkAccessibility();
    });

    it('vérifie l\'accessibilité de la page de planning', () => {
        cy.visitAsAuthenticatedUser('/planning/hebdomadaire');

        // Injecter et vérifier l'accessibilité
        cy.checkAccessibility();
    });

    it('vérifie l\'accessibilité du calendrier', () => {
        cy.visitAsAuthenticatedUser('/calendar');

        // Injecter et vérifier l'accessibilité
        cy.checkAccessibility();
    });

    it('vérifie l\'accessibilité du formulaire de demande de congés', () => {
        cy.visitAsAuthenticatedUser('/leaves/new');

        // Injecter et vérifier l'accessibilité avec une configuration personnalisée
        cy.checkAccessibility({
            rules: {
                'color-contrast': { enabled: true },
                'label': { enabled: true },
                'form-field-multiple-labels': { enabled: false }
            }
        });
    });
}); 