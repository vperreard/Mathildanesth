describe('Test de connexion simple', () => {
    it('visite la page de connexion', () => {
        cy.visit('/auth/connexion');
        cy.get('h1').should('contain', 'Connexion');
        cy.get('[data-cy=email-input]').should('be.visible');
        cy.get('[data-cy=password-input]').should('be.visible');
        cy.get('[data-cy=submit-button]').should('be.visible');
    });

    it('affiche une erreur pour des identifiants invalides', () => {
        cy.visit('/auth/connexion');
        cy.get('[data-cy=email-input]').type('test@invalid.com');
        cy.get('[data-cy=password-input]').type('wrongpassword');
        cy.get('[data-cy=submit-button]').click({ force: true });
        
        cy.get('[data-cy=error-message]')
            .should('be.visible')
            .and('contain.text', 'Identifiants invalides');
    });
});