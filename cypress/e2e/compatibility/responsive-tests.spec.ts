describe('Tests de compatibilité responsive', () => {
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
            fixtures: ['users', 'leaves']
        });

        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);
    });

    describe('Tests sur mobile', () => {
        beforeEach(() => {
            cy.viewportDevice('mobile');
        });

        it('affiche correctement le menu de navigation', () => {
            cy.visitAsAuthenticatedUser('/dashboard');

            // Vérifier que le menu hamburger est présent sur mobile
            cy.get('[data-cy=mobile-menu-button]').should('be.visible');

            // Cliquer sur le menu hamburger
            cy.get('[data-cy=mobile-menu-button]').click();

            // Vérifier que le menu s'ouvre
            cy.get('[data-cy=navigation-menu]').should('be.visible');
        });

        it('affiche correctement la liste des congés', () => {
            cy.visitAsAuthenticatedUser('/leaves');

            // Vérifier que les cartes de congés s'affichent en une colonne
            cy.get('[data-cy=leave-item]').should('have.css', 'width', '100%');
        });

        it('adapte correctement le calendrier', () => {
            cy.visitAsAuthenticatedUser('/calendar');

            // Vérifier que la vue par défaut est différente sur mobile
            cy.get('[data-cy=calendar-day-view]').should('be.visible');

            // Vérifier que les contrôles du calendrier sont adaptés
            cy.get('[data-cy=calendar-controls]').should('have.css', 'flex-direction', 'column');
        });
    });

    describe('Tests sur tablette', () => {
        beforeEach(() => {
            cy.viewportDevice('tablet');
        });

        it('affiche correctement le menu de navigation', () => {
            cy.visitAsAuthenticatedUser('/dashboard');

            // Vérifier l'affichage correct du menu sur tablette
            cy.get('[data-cy=navigation-menu]').should('be.visible');
        });

        it('affiche correctement la liste des congés', () => {
            cy.visitAsAuthenticatedUser('/leaves');

            // Vérifier que les cartes de congés s'affichent en grille
            cy.get('[data-cy=leave-grid]').should('have.css', 'grid-template-columns');
        });
    });

    describe('Tests sur desktop', () => {
        beforeEach(() => {
            cy.viewportDevice('desktop');
        });

        it('affiche correctement le menu de navigation', () => {
            cy.visitAsAuthenticatedUser('/dashboard');

            // Vérifier l'affichage du menu latéral sur desktop
            cy.get('[data-cy=sidebar-navigation]').should('be.visible');
        });

        it('affiche correctement le planning hebdomadaire', () => {
            cy.visitAsAuthenticatedUser('/planning/hebdomadaire');

            // Vérifier que toutes les colonnes sont visibles
            cy.get('[data-cy=planning-day-column]').should('have.length.at.least', 5);
        });
    });

    describe('Tests sur grand écran', () => {
        beforeEach(() => {
            cy.viewportDevice('widescreen');
        });

        it('optimise l\'affichage du planning', () => {
            cy.visitAsAuthenticatedUser('/planning/hebdomadaire');

            // Vérifier que l'interface exploite l'espace disponible
            cy.get('[data-cy=planning-container]').invoke('width').should('be.gt', 1800);
        });

        it('affiche correctement le tableau de bord', () => {
            cy.visitAsAuthenticatedUser('/dashboard');

            // Vérifier que les widgets s'adaptent à l'espace disponible
            cy.get('[data-cy=dashboard-widgets]').invoke('width').should('be.gt', 1800);
        });
    });
}); 