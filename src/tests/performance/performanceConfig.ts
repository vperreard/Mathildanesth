export const performanceConfig = {
    // Seuils de performance
    thresholds: {
        // Temps de réponse maximum pour les requêtes API
        apiResponseTime: 1000, // ms
        // Taille maximale des réponses API
        apiResponseSize: 1024 * 1024, // 1MB
        // Utilisation maximale de la mémoire
        memoryUsage: 1024 * 1024 * 512, // 512MB
        // Temps de chargement maximum pour les pages
        pageLoadTime: 3000, // ms
        // Score minimum pour Lighthouse
        lighthouseScore: 90, // %
    },

    // Endpoints à tester
    endpoints: [
        '/api/auth/me',
        '/api/admin/leaves/pending',
        '/api/admin/leave-types',
        '/parametres/configuration'
    ],

    // Scénarios de test
    scenarios: [
        {
            name: 'Chargement de la page de configuration',
            url: '/parametres/configuration',
            method: 'GET',
            expectedStatus: 200
        },
        {
            name: 'Récupération des congés en attente',
            url: '/api/admin/leaves/pending',
            method: 'GET',
            expectedStatus: 200
        },
        {
            name: 'Récupération des types de congés',
            url: '/api/admin/leave-types',
            method: 'GET',
            expectedStatus: 200
        }
    ],

    // Configuration des tests de charge
    loadTest: {
        duration: 300, // secondes
        users: 50,
        rampUp: 30, // secondes
        thinkTime: 1000 // ms
    }
}; 