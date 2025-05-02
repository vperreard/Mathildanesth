import { NextApiRequest, NextApiResponse } from 'next';
import { leavePerformanceTestService } from '@/modules/leaves/services/LeavePerformanceTestService';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';

const cacheService = LeaveQueryCacheService.getInstance();

/**
 * API pour exécuter des tests de performance du cache
 * GET: Exécute les tests de performance standard
 * POST: Exécute un test de stress personnalisé
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Restreindre l'accès à cette API aux environnements non-production
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Cette API n\'est pas disponible en production' });
    }

    try {
        if (req.method === 'GET') {
            // Exécuter les tests de performance standard
            const results = await leavePerformanceTestService.runTests();
            return res.status(200).json({
                message: 'Tests de performance exécutés avec succès',
                results
            });
        } else if (req.method === 'POST') {
            // Récupérer les paramètres pour le test de stress
            const { iterations, concurrency, invalidateEvery, clearCache } = req.body;

            // Nettoyer complètement le cache si demandé
            if (clearCache) {
                const deletedKeys = await cacheService.invalidateAll();
                logger.info(`Cache vidé avant le test: ${deletedKeys} clés supprimées`);
            }

            // Exécuter le test de stress avec les paramètres fournis
            await leavePerformanceTestService.runStressTest(
                iterations || 100,
                concurrency || 10,
                invalidateEvery || 20
            );

            return res.status(200).json({
                message: 'Test de stress exécuté avec succès',
                config: {
                    iterations: iterations || 100,
                    concurrency: concurrency || 10,
                    invalidateEvery: invalidateEvery || 20
                }
            });
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        logger.error('Erreur lors de l\'exécution des tests de performance', { error });
        return res.status(500).json({
            error: 'Erreur lors de l\'exécution des tests de performance',
            details: error instanceof Error ? error.message : String(error)
        });
    }
} 