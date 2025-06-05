import { logger } from "../lib/logger";

/**
 * Utilitaire pour importer les résultats des tests de performance
 * depuis les fichiers générés par Cypress vers le tableau de bord
 */

export interface TestResult {
    type: 'page' | 'api' | 'form' | 'interaction' | 'app';
    name: string;
    duration: number;
    timestamp: number;
    status?: number | string;
    run: string;
}

/**
 * Importe les résultats des tests de performance depuis un fichier JSON
 * Peut être utilisé côté serveur (Node.js) ou client (browser)
 */
export async function importTestResults(
    source: 'file' | 'api' = 'api',
    path = '/api/performance/results'
): Promise<TestResult[]> {
    let results: TestResult[] = [];

    try {
        if (source === 'file' && typeof window === 'undefined') {
            // Côté serveur: lire le fichier directement avec imports dynamiques
            const { promises: fs } = await import('fs');
            const pathModule = await import('path');
            const filePath = pathModule.resolve(process.cwd(), 'cypress/results/performance.json');

            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                results = JSON.parse(fileContent);
            } catch (fileError) {
                // Fichier n'existe pas ou erreur de lecture, on continue avec un tableau vide
                logger.debug('Fichier de résultats de performance non trouvé:', filePath);
            }
        } else {
            // Côté client: récupérer via API
            const response = await fetch(path);
            if (response.ok) {
                results = await response.json();
            }
        }

        // Si nous sommes dans le navigateur, enregistrer dans les métriques de performance
        if (typeof window !== 'undefined') {
            storeTestResultsInMetrics(results);
        }

        return results;
    } catch (error) {
        logger.error('Erreur lors de l\'importation des résultats de test:', error);
        return [];
    }
}

/**
 * Stocke les résultats des tests dans le localStorage pour le tableau de bord
 */
function storeTestResultsInMetrics(results: TestResult[]): void {
    try {
        // Récupérer les métriques existantes
        const existingMetricsStr = localStorage.getItem('performanceMetrics');
        const metrics = existingMetricsStr ? JSON.parse(existingMetricsStr) : {};

        // Ajouter les résultats des tests
        metrics.testResults = results;

        // Préparer aussi quelques métriques dérivées
        if (results.length > 0) {
            // Temps de chargement de pages de test
            const pageResults = results.filter(r => r.type === 'page');
            if (pageResults.length > 0) {
                metrics.testPageLoadTimes = pageResults.map(r => ({
                    page: r.name,
                    loadTime: r.duration,
                    timestamp: r.timestamp,
                    isTestResult: true
                }));
            }

            // Temps de réponse API de test
            const apiResults = results.filter(r => r.type === 'api');
            if (apiResults.length > 0) {
                metrics.testApiResponses = apiResults.map(r => ({
                    name: r.name,
                    duration: r.duration,
                    timestamp: r.timestamp,
                    isTestResult: true
                }));
            }

            // Interactions et mesures diverses
            const interactionResults = results.filter(r => r.type === 'interaction' || r.type === 'app');
            if (interactionResults.length > 0) {
                metrics.testInteractions = interactionResults.map(r => ({
                    name: r.name,
                    duration: r.duration,
                    timestamp: r.timestamp,
                    isTestResult: true
                }));
            }
        }

        // Sauvegarder les métriques mises à jour
        localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
    } catch (error) {
        logger.error('Erreur lors du stockage des résultats de test dans les métriques:', error);
    }
}

/**
 * Convertit les résultats de test en format compatible avec le tableau de bord
 */
export function convertTestResultsForDashboard(results: TestResult[]) {
    const pageLoadTimes = results
        .filter(r => r.type === 'page')
        .map(r => ({
            page: r.name,
            loadTime: r.duration,
            timestamp: r.timestamp,
            isTestResult: true
        }));

    const apiResponses = results
        .filter(r => r.type === 'api')
        .map(r => ({
            name: r.name,
            duration: r.duration,
            timestamp: r.timestamp,
            status: r.status,
            isTestResult: true
        }));

    const formLoadTimes = results
        .filter(r => r.type === 'form')
        .map(r => ({
            name: r.name,
            duration: r.duration,
            timestamp: r.timestamp,
            isTestResult: true
        }));

    const interactions = results
        .filter(r => r.type === 'interaction' || r.type === 'app')
        .map(r => ({
            name: r.name,
            duration: r.duration,
            timestamp: r.timestamp,
            isTestResult: true
        }));

    return {
        pageLoadTimes,
        apiResponses,
        formLoadTimes,
        interactions
    };
} 