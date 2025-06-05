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

                win.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
                    openXhr++;
                    return originalOpen.apply(this, args as any);
                };

                win.XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: any[]) {
                    const xhr = this;
                    xhr.onreadystatechange = function (...stateArgs: any[]) {
                        if (xhr.readyState === 4) {
                            openXhr--;
                        }
                        if (originalOnreadystatechange) {
                            originalOnreadystatechange.apply(xhr, stateArgs as any);
                        }
                    };
                    return originalSend.apply(xhr, args as any);
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

/**
 * Helper pour le drag and drop entre deux éléments
 * Implémentation améliorée qui fonctionne avec React et les librairies modernes
 * @param sourceSelector Sélecteur de l'élément source
 * @param targetSelector Sélecteur de l'élément cible
 * @param options Options supplémentaires
 */
export const dragAndDrop = (
    sourceSelector: string,
    targetSelector: string,
    options: {
        force?: boolean;
        position?: 'center' | 'top' | 'topLeft' | 'topRight' | 'left' | 'right' | 'bottom' | 'bottomLeft' | 'bottomRight';
        delay?: number;
    } = {}
): Cypress.Chainable => {
    const { force = false, position: _position = 'center', delay = 0 } = options;

    return cy.get(sourceSelector).then(($source) => {
        const sourceElement = $source[0];
        const sourceRect = sourceElement.getBoundingClientRect();
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;

        cy.get(targetSelector).then(($target) => {
            const targetElement = $target[0];
            const targetRect = targetElement.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2;

            // Créer un DataTransfer pour le drag and drop
            const dataTransfer = new DataTransfer();

            // Déclencher mousedown sur l'élément source
            cy.wrap($source)
                .trigger('mousedown', {
                    button: 0,
                    clientX: sourceX,
                    clientY: sourceY,
                    force
                });

            // Déclencher dragstart
            cy.wrap($source)
                .trigger('dragstart', {
                    dataTransfer,
                    clientX: sourceX,
                    clientY: sourceY,
                    force
                });

            // Si un délai est spécifié, attendre
            if (delay > 0) {
                cy.wait(delay);
            }

            // Déclencher dragenter sur la cible
            cy.wrap($target)
                .trigger('dragenter', {
                    dataTransfer,
                    clientX: targetX,
                    clientY: targetY,
                    force
                });

            // Déclencher dragover sur la cible
            cy.wrap($target)
                .trigger('dragover', {
                    dataTransfer,
                    clientX: targetX,
                    clientY: targetY,
                    force
                });

            // Déclencher drop sur la cible
            cy.wrap($target)
                .trigger('drop', {
                    dataTransfer,
                    clientX: targetX,
                    clientY: targetY,
                    force
                });

            // Déclencher dragend sur la source
            cy.wrap($source)
                .trigger('dragend', {
                    dataTransfer,
                    clientX: targetX,
                    clientY: targetY,
                    force
                });

            // Déclencher mouseup
            cy.wrap($target)
                .trigger('mouseup', {
                    button: 0,
                    clientX: targetX,
                    clientY: targetY,
                    force
                });
        });
    });
};

/**
 * Helper pour vérifier qu'un élément est dans le viewport
 * @param selector Sélecteur de l'élément à vérifier
 * @returns true si l'élément est visible dans le viewport
 */
export const isInViewport = (selector: string): Cypress.Chainable<boolean> => {
    return cy.get(selector).then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        const windowHeight = Cypress.config('viewportHeight') || 0;
        const windowWidth = Cypress.config('viewportWidth') || 0;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight &&
            rect.right <= windowWidth
        );
    });
};

/**
 * Helper pour attendre qu'un élément soit stable (ne bouge plus)
 * Utile pour les animations et transitions
 * @param selector Sélecteur de l'élément
 * @param timeout Temps maximum d'attente en ms
 */
export const waitForElementStability = (
    selector: string,
    timeout: number = 5000
): Cypress.Chainable => {
    return cy.get(selector).then(($el) => {
        let previousPosition = $el[0].getBoundingClientRect();
        let stableCount = 0;
        const requiredStableChecks = 3;
        const checkInterval = 100;

        return new Cypress.Promise((resolve) => {
            const checkStability = () => {
                const currentPosition = $el[0].getBoundingClientRect();
                
                if (
                    previousPosition.top === currentPosition.top &&
                    previousPosition.left === currentPosition.left &&
                    previousPosition.width === currentPosition.width &&
                    previousPosition.height === currentPosition.height
                ) {
                    stableCount++;
                    if (stableCount >= requiredStableChecks) {
                        resolve($el);
                        return;
                    }
                } else {
                    stableCount = 0;
                }
                
                previousPosition = currentPosition;
                setTimeout(checkStability, checkInterval);
            };

            checkStability();

            // Timeout de sécurité
            setTimeout(() => resolve($el), timeout);
        });
    });
};

/**
 * Helper pour scroller jusqu'à un élément et attendre qu'il soit visible
 * @param selector Sélecteur de l'élément
 * @param options Options de scrolling
 */
export const scrollToElement = (
    selector: string,
    options: {
        duration?: number;
        offset?: { top?: number; left?: number };
        ensureScrollable?: boolean;
    } = {}
): Cypress.Chainable => {
    const { duration = 300, offset = { top: 0, left: 0 }, ensureScrollable: _ensureScrollable = true } = options;

    return cy.get(selector).then(($el) => {
        const element = $el[0];
        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset + (offset.top || 0);
        const absoluteLeft = rect.left + window.pageXOffset + (offset.left || 0);

        cy.window().scrollTo(absoluteLeft, absoluteTop, { duration });
        
        // Attendre que le scroll soit terminé
        cy.wait(duration + 100);
        
        // Vérifier que l'élément est maintenant visible
        return cy.wrap($el).should('be.visible');
    });
};

/**
 * Helper pour simuler la saisie de texte avec un délai réaliste
 * @param selector Sélecteur de l'input
 * @param text Texte à saisir
 * @param delay Délai entre chaque caractère en ms
 */
export const typeWithDelay = (
    selector: string,
    text: string,
    delay: number = 50
): Cypress.Chainable => {
    return cy.get(selector).clear().type(text, { delay });
}; 