/**
 * Helpers pour faciliter l'écriture de tests Cypress
 */

/**
 * Génère une chaîne aléatoire pour les tests
 * @param length Longueur de la chaîne (défaut: 10)
 * @returns Chaîne aléatoire
 */
export const randomString = (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Génère un email aléatoire pour les tests
 * @returns Email aléatoire
 */
export const randomEmail = (): string => {
    return `test.${randomString(8)}@example.com`;
};

/**
 * Génère une date aléatoire dans le futur
 * @param minDays Nombre minimum de jours dans le futur
 * @param maxDays Nombre maximum de jours dans le futur
 * @returns Date aléatoire
 */
export const randomFutureDate = (minDays: number = 1, maxDays: number = 30): Date => {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + randomDays);
    return futureDate;
};

/**
 * Formate une date au format YYYY-MM-DD
 * @param date Date à formater
 * @returns Chaîne au format YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Attend que les animations soient terminées
 * Utile pour éviter les problèmes de timing après les transitions CSS
 */
export const waitForAnimations = (): Cypress.Chainable => {
    return cy.wait(300); // Attendre que les animations se terminent
};

/**
 * Vérifie si une page est en chargement
 * @returns true si la page est en chargement, false sinon
 */
export const isPageLoading = (): Cypress.Chainable<boolean> => {
    return cy.get('body').then(($body) => {
        return $body.find('[data-cy=loading-indicator]').length > 0;
    });
};

/**
 * Attend que la page finisse de charger
 */
export const waitForPageLoad = (): Cypress.Chainable => {
    return cy.get('body').then(($body) => {
        if ($body.find('[data-cy=loading-indicator]').length > 0) {
            return cy.get('[data-cy=loading-indicator]').should('not.exist');
        }
        return cy.wrap(true);
    });
};

/**
 * Attend que toutes les requêtes XHR soient terminées
 * @param timeout Délai maximum d'attente en ms (défaut: 10000)
 */
export const waitForXHR = (timeout: number = 10000): Cypress.Chainable => {
    return cy.wait(500).then(() => {
        return cy.window().then((win) => {
            return new Cypress.Promise((resolve) => {
                let openXhr = 0;
                const originalOpen = win.XMLHttpRequest.prototype.open;
                const originalSend = win.XMLHttpRequest.prototype.send;
                const originalOnreadystatechange = win.XMLHttpRequest.prototype.onreadystatechange;

                function checkIfComplete() {
                    if (openXhr === 0) {
                        win.XMLHttpRequest.prototype.open = originalOpen;
                        win.XMLHttpRequest.prototype.send = originalSend;
                        win.XMLHttpRequest.prototype.onreadystatechange = originalOnreadystatechange;
                        resolve(true);
                    } else {
                        setTimeout(checkIfComplete, 100);
                    }
                }

                win.XMLHttpRequest.prototype.open = function () {
                    openXhr++;
                    return originalOpen.apply(this, arguments);
                };

                win.XMLHttpRequest.prototype.send = function () {
                    const xhr = this;
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            openXhr--;
                        }
                        if (originalOnreadystatechange) {
                            originalOnreadystatechange.apply(xhr, arguments);
                        }
                    };
                    return originalSend.apply(xhr, arguments);
                };

                setTimeout(() => {
                    checkIfComplete();
                }, 100);

                // Timeout pour éviter les attentes infinies
                setTimeout(() => {
                    win.XMLHttpRequest.prototype.open = originalOpen;
                    win.XMLHttpRequest.prototype.send = originalSend;
                    win.XMLHttpRequest.prototype.onreadystatechange = originalOnreadystatechange;
                    resolve(true);
                }, timeout);
            });
        });
    });
};

/**
 * Attend que toutes les requêtes réseau soient terminées
 */
export const waitForNetwork = (): Cypress.Chainable => {
    return waitForXHR().then(() => {
        return waitForAnimations();
    });
}; 