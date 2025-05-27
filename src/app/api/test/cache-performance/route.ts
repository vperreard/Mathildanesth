import { NextRequest, NextResponse } from 'next/server';
import { leavePerformanceTestService } from '@/modules/conges/services/LeavePerformanceTestService';
import { LeaveQueryCacheService } from '@/modules/conges/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';

const cacheService = LeaveQueryCacheService.getInstance();

/**
 * API pour exécuter des tests de performance du cache
 * GET: Exécute les tests de performance standard
 * POST: Exécute un test de stress personnalisé
 */
export async function GET(request: NextRequest) {
    // Restreindre l'accès à cette API aux environnements non-production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Cette API n\'est pas disponible en production' },
            { status: 403 }
        );
    }

    try {
        // Exécuter les tests de performance standard
        const results = await leavePerformanceTestService.runTests();
        return NextResponse.json({
            message: 'Tests de performance exécutés avec succès',
            results
        });
    } catch (error) {
        logger.error('Erreur lors de l\'exécution des tests de performance', { error });
        return NextResponse.json({
            error: 'Erreur lors de l\'exécution des tests de performance',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Restreindre l'accès à cette API aux environnements non-production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Cette API n\'est pas disponible en production' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { iterations, concurrency, invalidateEvery, clearCache } = body;

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

        return NextResponse.json({
            message: 'Test de stress exécuté avec succès',
            config: {
                iterations: iterations || 100,
                concurrency: concurrency || 10,
                invalidateEvery: invalidateEvery || 20
            }
        });
    } catch (error) {
        logger.error('Erreur lors de l\'exécution des tests de performance', { error });
        return NextResponse.json({
            error: 'Erreur lors de l\'exécution des tests de performance',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 