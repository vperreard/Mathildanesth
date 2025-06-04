/**
 * Tests de performance pour les pages publiques et les opérations
 * qui ne nécessitent pas d'authentification
 */
describe('Benchmark des pages publiques', () => {
    it('Mesure les temps de chargement des pages publiques', () => {
        // Liste des pages publiques à tester
        const publicPages = [
            '/',
            '/login',
            '/auth/connexion'
        ];

        // Tester chaque page
        publicPages.forEach(page => {
            // Mesurer le temps de navigation complet
            const startTime = Date.now();
            cy.visit(page, { failOnStatusCode: false, timeout: 30000 });
            cy.get('body', { timeout: 30000 }).should('be.visible');

            cy.window().then(() => {
                const loadTime = Date.now() - startTime;
                // Enregistrer la métrique
                cy.task('logPerformance', {
                    type: 'page',
                    name: page,
                    duration: loadTime,
                    timestamp: Date.now()
                });
                // Montrer le résultat
                cy.log(`📊 Page publique ${page}: ${loadTime}ms`);
            });
        });
    });

    it('Mesure les performances des opérations publiques', () => {
        // Tester le temps de chargement initial de l'application
        const startTimeApp = Date.now();
        cy.visit('/', { failOnStatusCode: false, timeout: 30000 });
        cy.get('body', { timeout: 30000 }).should('be.visible');

        cy.window().then(() => {
            const appLoadTime = Date.now() - startTimeApp;
            cy.task('logPerformance', {
                type: 'app',
                name: 'initial-load',
                duration: appLoadTime,
                timestamp: Date.now()
            });
            cy.log(`⚡ Chargement initial: ${appLoadTime}ms`);
        });

        // Tester la réactivité de la page de login
        cy.visit('/login', { failOnStatusCode: false, timeout: 30000 });

        // Mesurer le temps de réponse des champs de formulaire
        const startTimeInput = Date.now();
        cy.get('input', { timeout: 10000 }).first().type('test@example.com');

        cy.window().then(() => {
            const inputResponseTime = Date.now() - startTimeInput;
            cy.task('logPerformance', {
                type: 'interaction',
                name: 'input-response',
                duration: inputResponseTime,
                timestamp: Date.now()
            });
            cy.log(`⌨️ Réponse input: ${inputResponseTime}ms`);
        });
    });
}); 