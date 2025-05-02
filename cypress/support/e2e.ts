// ***********************************************************
// Support pour les tests e2e
// ***********************************************************

// Import des commandes personnalisées
import './commands';
import '@cypress/code-coverage/support';
import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import 'cypress-plugin-tab';

// Fonctions utilitaires pour le setup des tests
const setupApiInterceptions = () => {
  // Intercepter les requêtes API et simuler certaines réponses si nécessaire
  cy.intercept('GET', '**/api/users/**').as('getUsers');
  cy.intercept('GET', '**/api/surgeons/**').as('getSurgeons');
  cy.intercept('GET', '**/api/leaves/**').as('getLeaves');
  cy.intercept('GET', '**/api/planning/**').as('getPlanning');
  cy.intercept('POST', '**/api/auth/login').as('login');
  cy.intercept('POST', '**/api/leaves/**').as('createLeave');

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
  if (Cypress.env('resetDatabase') !== false) {
    cy.task('resetTestDatabase');
  }

  // Configurer les interceptions d'API
  setupApiInterceptions();

  // Définir la taille de la fenêtre pour la cohérence des tests (par défaut)
  cy.viewport(1280, 720);
});

// Préserver les cookies de session entre les tests
// Au lieu d'utiliser Cypress.Cookies.defaults qui n'est plus supporté
// On utilise la méthode recommandée
// @ts-ignore - Ignorer l'erreur TypeScript pour cette session particulière
Cypress.Cookies.defaults({
  preserve: ['authToken', 'session', 'next-auth.session-token', 'next-auth.csrf-token'],
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

// Commande pour vérifier l'accessibilité d'une page
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

        // Sauvegarder les violations dans un fichier pour analyse
        const fileName = `a11y-violations-${Date.now()}.json`;
        cy.writeFile(`cypress/reports/a11y/${fileName}`, violations);
      }
    }
  );
});

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
Cypress.on('uncaught:exception', (err, runnable) => {
  // Journaliser l'erreur pour le débogage
  console.error('Exception non capturée:', err.message, err.stack);

  // Ignorer certaines erreurs spécifiques selon les besoins
  const ignoredErrors = [
    // Liste des messages d'erreur à ignorer
    'ResizeObserver loop limit exceeded',
    'Cannot read properties of null',
    'Network Error'
  ];

  // Renvoie false pour empêcher Cypress d'échouer le test en cas d'erreur spécifique
  return ignoredErrors.some(errorMsg => err.message.includes(errorMsg));
}); 