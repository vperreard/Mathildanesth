// Support pour la gestion de base de données dans les tests
export const resetDatabase = () => {
  return cy.task('db:reset');
};

export const seedDatabase = (fixtures: string[] = []) => {
  return cy.task('db:seed', { fixtures });
};

export const createTestUser = (userData: {
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
}) => {
  return cy.task('db:createUser', userData);
};

// Commandes Cypress pour la base de données
Cypress.Commands.add('resetDb', () => {
  return resetDatabase();
});

Cypress.Commands.add('seedDb', (fixtures: string[]) => {
  return seedDatabase(fixtures);
});

Cypress.Commands.add('createUser', (userData: any) => {
  return createTestUser(userData);
});

// Types pour TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      resetDb(): Chainable<any>;
      seedDb(fixtures: string[]): Chainable<any>;
      createUser(userData: any): Chainable<any>;
    }
  }
}