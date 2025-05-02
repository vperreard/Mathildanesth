import { performanceConfig } from '../tests/performance/performanceConfig';
import { LoggerService } from '../services/loggerService';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { SignJWT } from 'jose';

// Créer une instance du logger
const logger = new LoggerService();

// Générer un token JWT pour les tests
const generateTestToken = async () => {
    const payload = {
        userId: 1,
        login: 'admin',
        role: 'ADMIN_TOTAL',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // Expire dans 1 heure
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('mathildanesth')
        .setAudience('mathildanesth-client')
        .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'votre_secret_jwt_super_securise'));

    return token;
};

// Vérifier si le serveur est accessible
const checkServerAvailability = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
};

async function runPerformanceTest() {
    logger.info('Démarrage des tests de performance');

    // Vérifier si le serveur est accessible
    const serverUrl = 'http://localhost:3000';
    const isServerAvailable = await checkServerAvailability(serverUrl);

    if (!isServerAvailable) {
        logger.error('Le serveur n\'est pas accessible', {
            url: serverUrl,
            message: 'Assurez-vous que le serveur est en cours d\'exécution avec "npm run dev"'
        });
        process.exit(1);
    }

    const testToken = await generateTestToken();

    for (const scenario of performanceConfig.scenarios) {
        logger.info(`Exécution du scénario: ${scenario.name}`);

        const startTime = performance.now();
        try {
            const response = await fetch(`${serverUrl}${scenario.url}`, {
                method: scenario.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testToken}`,
                    'Authorization': `Bearer ${testToken}`
                }
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Vérification du statut
            if (response.status !== scenario.expectedStatus) {
                logger.error(`Échec du scénario ${scenario.name}`, {
                    expectedStatus: scenario.expectedStatus,
                    actualStatus: response.status,
                    duration,
                    headers: Object.fromEntries(response.headers)
                });
                continue;
            }

            // Vérification du temps de réponse
            if (duration > performanceConfig.thresholds.apiResponseTime) {
                logger.warn(`Temps de réponse élevé pour ${scenario.name}`, {
                    duration,
                    threshold: performanceConfig.thresholds.apiResponseTime
                });
            }

            // Vérification de la taille de la réponse
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > performanceConfig.thresholds.apiResponseSize) {
                logger.warn(`Taille de réponse élevée pour ${scenario.name}`, {
                    size: contentLength,
                    threshold: performanceConfig.thresholds.apiResponseSize
                });
            }

            logger.info(`Scénario ${scenario.name} réussi`, {
                duration,
                status: response.status
            });

        } catch (error) {
            logger.error(`Erreur lors de l'exécution du scénario ${scenario.name}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                url: `${serverUrl}${scenario.url}`
            });
        }
    }

    logger.info('Tests de performance terminés');
}

// Exécution des tests
runPerformanceTest().catch(error => {
    logger.error('Erreur lors de l\'exécution des tests de performance', {
        error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
}); 