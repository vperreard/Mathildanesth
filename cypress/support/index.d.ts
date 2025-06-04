/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    // Commandes d'authentification
    login(email: string, password: string): Chainable<void>;
    loginByApi(email: string, password: string): Chainable<void>;
    visitAsAuthenticatedUser(url: string): Chainable<void>;
    cleanState(): Chainable<void>;
    clearTestData(): Chainable<void>;
    createAdminUser(): Chainable<void>;

    // Commandes d'accessibilité
    injectAxe(): Chainable<void>;
    configureAxe(config: any): Chainable<void>;
    checkA11y(
      context?: any,
      options?: any,
      violationCallback?: (violations: any[]) => void,
      skipFailures?: boolean
    ): Chainable<void>;

    // Commandes de navigation et de manipulation
    safeClick(selector: string): Chainable<any>;
    safeType(selector: string, text: string): Chainable<any>;
    selectDate(selector: string, date: Date): Chainable<void>;
    waitForPageLoad(): Chainable<void>;
    waitForApi(): Chainable<void>;
    scrollToBottom(): Chainable<void>;

    // Commandes de tests spécifiques
    testLoginFormAccessibility(): Chainable<void>;
    testPlanningAccessibility(): Chainable<void>;
    testBlocOperatoireAccessibility(): Chainable<void>;

    // Commandes de base de données et fixtures
    createTestUser(userData: {
      email: string;
      password: string;
      name?: string;
      role?: string;
      [key: string]: any;
    }): Chainable<any>;
    loadFixtures(fixtures: string[]): Chainable<void>;
    ensureTestUser(email: string): Chainable<void>;

    // Commandes de vérification
    checkNotification(
      text: string,
      type?: 'success' | 'error' | 'info' | 'warning'
    ): Chainable<void>;
    checkAccessibility(options?: any): Chainable<void>;

    // Commandes de viewport
    viewportDevice(device: 'mobile' | 'tablet' | 'desktop' | 'widescreen'): Chainable<void>;

    // Commandes de performance
    runLighthouseAudit(): Chainable<void>;
    runPa11yAudit(): Chainable<void>;
    lighthouse(thresholds?: any): Chainable<void>;
    pa11y(options?: any): Chainable<void>;

    // Commandes pour les tests de navigation
    testKeyboardNavigation(selector: string): Chainable<void>;

    // Utilitaires de stockage
    saveState(key: string, value: any): Chainable<void>;
    restoreState(key: string): Chainable<any>;

    // Commandes pour les tests de sécurité
    checkSecurityHeaders(): Chainable<void>;
    testCSRFProtection(): Chainable<void>;

    // Commandes spécifiques aux tests e2e
    verifyToast(message: string): Chainable<void>;
    dismissToast(): Chainable<void>;

    // Task specifiques
    task(event: 'logAccessibilityViolation', arg: any): Chainable<null>;
    task(event: 'log', message: string): Chainable<null>;
  }

  interface Cypress {
    env(key: 'viewports'): {
      mobile: { width: number; height: number };
      tablet: { width: number; height: number };
      desktop: { width: number; height: number };
      widescreen: { width: number; height: number };
    };
    env(key: 'lighthouse'): any;
  }
}

// Export vide pour faire de ce fichier un module
export {};
