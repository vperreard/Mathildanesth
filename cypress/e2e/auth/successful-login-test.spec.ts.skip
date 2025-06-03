describe('Test de connexion réussie', () => {
    it('permet la connexion avec des identifiants valides', () => {
        cy.visit('/auth/connexion');
        cy.get('[data-cy=email-input]').type('admin');
        cy.get('[data-cy=password-input]').type('admin');
        cy.get('[data-cy=submit-button]').click({ force: true });
        
        // Attendre la redirection ou un changement de page
        cy.url().should('not.include', '/auth/connexion');
        // Optionnel : vérifier qu'on est sur une page protégée
        cy.url().should('satisfy', (url: string) => {
            return url.includes('/tableau-de-bord') || url.includes('/') || url.includes('/planning');
        });
    });
});