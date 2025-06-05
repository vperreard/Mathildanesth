// ***********************************************************
// Support pour les tests e2e
// ***********************************************************

// Import des commandes personnalisées
import './commands';
import './database';
import './auth';
import '@cypress/code-coverage/support';
import '@testing-library/cypress/add-commands';
// import 'cypress-axe'; // Commenter l'import
import 'cypress-plugin-tab';

// Fonctions utilitaires pour le setup des tests
const setupApiInterceptions = () => {
  // Intercepter les requêtes API et simuler certaines réponses si nécessaire
  cy.intercept('GET', '**/api/utilisateurs/**').as('getUsers');
  cy.intercept('GET', '**/api/chirurgiens/**').as('getSurgeons');
  cy.intercept('GET', '**/api/conges/**').as('getLeaves');
  cy.intercept('GET', '**/api/planning/**').as('getPlanning');
  cy.intercept('POST', '**/api/auth/connexion').as('login');
  cy.intercept('POST', '**/api/conges/**').as('createLeave');

  // Intercepter génériquement les autres requêtes API
  cy.intercept('GET', '**/api/**').as('apiGet');
  cy.intercept('POST', '**/api/**').as('apiPost');
  cy.intercept('PUT', '**/api/**').as('apiPut');
  cy.intercept('DELETE', '**/api/**').as('apiDelete');
};

// Configuration globale pour les tests e2e
beforeEach(() => {
  // Réinitialiser la base de données avant chaque test si nécessaire
  // Cette action peut être conditionnelle selon les besoins des tests
  // if (Cypress.env('resetDatabase') !== false) {
  //   cy.task('resetTestDatabase'); // Commenté car géré dans les 'before()' spécifiques
  // }

  // Add global interceptor to add test headers to all API requests
  cy.intercept('**/api/**', (req) => {
    req.headers['x-cypress-test'] = 'true';
    req.headers['x-test-environment'] = 'cypress';
    req.headers['x-disable-rate-limit'] = 'true';
  }).as('allApiRequestsWithTestHeaders');

  // Configurer les interceptions d'API
  setupApiInterceptions();

  // Définir la taille de la fenêtre pour la cohérence des tests (par défaut)
  cy.viewport(1280, 720);
});

// Commandes personnalisées pour les tests multiplateforme
Cypress.Commands.add('viewportDevice', (device: 'mobile' | 'tablet' | 'desktop' | 'widescreen') => {
  const viewport = Cypress.env('viewports')[device];
  if (viewport) {
    cy.viewport(viewport.width, viewport.height);
  } else {
    throw new Error(`Le viewport "${device}" n'est pas défini dans la configuration`);
  }
});

// Commande pour vérifier l'accessibilité d'une page (commentée)
/*
Cypress.Commands.add('checkAccessibility', (options?: Partial<CypressAxeOptions>) => {
  cy.injectAxe();
  cy.checkA11y(
    undefined,
    {
      includedImpacts: ['critical', 'serious'],
      ...options
    },
    null,
    (violations) => {
      const violationsCount = violations.length;
      if (violationsCount > 0) {
        cy.task('log', `${violationsCount} problèmes d'accessibilité trouvés`);
        const fileName = `a11y-violations-${Date.now()}.json`;
        cy.writeFile(`cypress/reports/a11y/${fileName}`, violations);
      }
    }
  );
});
*/

// Commande pour tester les performances avec Lighthouse
Cypress.Commands.add('runLighthouseAudit', () => {
  const thresholds = Cypress.env('lighthouse');
  cy.lighthouse(thresholds);
});

// Commande pour tester l'accessibilité avec pa11y
Cypress.Commands.add('runPa11yAudit', () => {
  cy.pa11y();
});

// Gérer les erreurs non gérées et les rejets de promesses
Cypress.on('uncaught:exception', (err, _runnable) => {
  // Journaliser l'erreur pour le débogage
  console.error('Exception non capturée:', err.message, err.stack);

  // Ignorer certaines erreurs spécifiques selon les besoins
  const ignoredErrors = [
    // Liste des messages d'erreur à ignorer
    'ResizeObserver loop limit exceeded',
    'Cannot read properties of null',
    'Network Error',
    'Loading CSS chunk',
    'Non-Error promise rejection captured',
    'Cannot find module',
    'Failed to fetch'
  ];

  // Renvoie false pour empêcher Cypress d'échouer le test en cas d'erreur spécifique
  return ignoredErrors.some(errorMsg => err.message.includes(errorMsg));
});

// Commandes de stabilité supplémentaires
Cypress.Commands.add('safeClick', (selector: string) => {
  cy.get(selector).should('be.visible').and('not.be.disabled').click();
});

Cypress.Commands.add('safeType', (selector: string, text: string) => {
  cy.get(selector).should('be.visible').and('not.be.disabled').clear().type(text);
});

// Types pour TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      safeClick(selector: string): Chainable<any>;
      safeType(selector: string, text: string): Chainable<any>;
    }
  }
} 