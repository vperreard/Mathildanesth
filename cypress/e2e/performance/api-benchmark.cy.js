/**
 * Test simplifié pour mesurer les performances des API
 */
describe('Benchmark des API', () => {
    it('Mesure les temps de réponse des principales API', () => {
        // Définir les API à tester
        const apiEndpoints = [
            '/api/users',
            '/api/leaves/types',
            '/api/planning',
            '/api/skills',
            '/api/notifications/preferences',
            '/api/me',
            '/api/sectors',
            '/api/sites',
            '/api/activity-types',
            '/api/assignment-types'
        ];

        // Tester séquentiellement chaque API
        apiEndpoints.forEach(endpoint => {
            cy.request({
                url: endpoint,
                failOnStatusCode: false,
                timeout: 30000
            }).then(response => {
                // Enregistrer les métriques de performance
                cy.task('logPerformance', {
                    type: 'api',
                    name: endpoint,
                    duration: response.duration,
                    status: response.status,
                    timestamp: Date.now()
                });

                // Afficher les résultats dans les logs
                cy.log(`🔌 API ${endpoint}: ${response.duration}ms (${response.status})`);
            });
        });
    });
}); 