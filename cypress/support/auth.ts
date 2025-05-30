// Support pour l'authentification dans les tests
export const loginAs = (role: 'admin' | 'iade' | 'mar' | 'chirurgien' = 'admin') => {
  const credentials = {
    admin: { email: 'admin@example.com', password: 'Test123!' },
    iade: { email: 'iade@example.com', password: 'Test123!' },
    mar: { email: 'medecin@example.com', password: 'Test123!' },
    chirurgien: { email: 'chirurgien@example.com', password: 'Test123!' }
  };

  const creds = credentials[role];
  
  cy.session([role], () => {
    cy.visit('/auth/connexion');
    cy.get('[data-cy=email-input]').should('be.visible').clear().type(creds.email);
    cy.get('[data-cy=password-input]').should('be.visible').clear().type(creds.password);
    cy.get('[data-cy=submit-button]').should('not.be.disabled').click();
    
    // Attendre que la connexion soit effective
    cy.url().should('not.include', '/auth/connexion');
  });
};

export const logout = () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.clearCookies();
};

// Commandes Cypress pour l'authentification
Cypress.Commands.add('loginAs', (role: 'admin' | 'iade' | 'mar' | 'chirurgien') => {
  return loginAs(role);
});

Cypress.Commands.add('logout', () => {
  return logout();
});

// Types pour TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: 'admin' | 'iade' | 'mar' | 'chirurgien'): Chainable<any>;
      logout(): Chainable<any>;
    }
  }
}