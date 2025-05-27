/**
 * Tests de performance automatisés pour mesurer les temps de chargement
 * des principales pages et API de l'application
 */
describe('Benchmark de performances', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        // Désactiver les animations pour des mesures plus précises
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('testMode', 'performance');
            },
            // Ajouter cette option pour éviter les échecs sur les codes d'état HTTP
            failOnStatusCode: false,
            // Augmenter le timeout pour s'assurer que l'application a le temps de démarrer
            timeout: 60000
        });

        // Vérifier que la page de connexion est bien chargée
        cy.get('[data-testid=login-email-input]', { timeout: 10000 }).should('be.visible');

        // Se connecter avec les identifiants corrects des fixtures users.json
        cy.get('[data-testid=login-email-input]').type('admin');
        cy.get('[data-testid=login-password-input]').type('Test123!');
        cy.get('[data-testid=login-submit-button]').click();

        // Attendre que l'authentification soit complète
        cy.url().should('not.include', '/login', { timeout: 30000 });
    });

    it('Mesure les temps de chargement des pages principales', () => {
        const pages = [
            '/',
            '/utilisateurs',
            '/calendrier',
            '/planning/hebdomadaire',
            '/conges',
            '/parametres'
        ];

        // Tester chaque page
        pages.forEach(page => {
            // Mesurer le temps de navigation complet
            const startTime = Date.now();
            cy.visit(page, { failOnStatusCode: false, timeout: 30000 });
            cy.get('main', { timeout: 30000 }).should('be.visible');

            // Vérifier que la page est entièrement chargée (pas de spinners/loaders)
            cy.get('[data-loading="true"]').should('not.exist', { timeout: 15000 });

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
                cy.log(`📊 ${page}: ${loadTime}ms`);
            });
        });
    });

    it('Mesure les temps de chargement des formulaires', () => {
        // Test du formulaire utilisateur
        cy.visit('/utilisateurs', { failOnStatusCode: false, timeout: 30000 });
        cy.contains('button', 'Nouvel Utilisateur', { timeout: 10000 }).click();

        const startTimeForm = Date.now();
        cy.get('form', { timeout: 10000 }).should('be.visible');
        cy.window().then(() => {
            const formLoadTime = Date.now() - startTimeForm;
            cy.task('logPerformance', {
                type: 'form',
                name: 'user-create-form',
                duration: formLoadTime,
                timestamp: Date.now()
            });
            cy.log(`📝 Formulaire Utilisateur: ${formLoadTime}ms`);
        });

        // Ajouter d'autres formulaires selon vos besoins...
    });

    it('Mesure les temps de réponse des API principales', () => {
        // Test des principales API
        const apiEndpoints = [
            '/api/utilisateurs',
            '/api/conges/types',
            '/api/planning',
            '/api/skills',
            '/api/notifications/preferences'
        ];

        apiEndpoints.forEach(endpoint => {
            cy.request({
                url: endpoint,
                failOnStatusCode: false
            }).then(response => {
                cy.task('logPerformance', {
                    type: 'api',
                    name: endpoint,
                    duration: response.duration,
                    status: response.status,
                    timestamp: Date.now()
                });
                cy.log(`🔌 API ${endpoint}: ${response.duration}ms (${response.status})`);
            });
        });
    });
}); 