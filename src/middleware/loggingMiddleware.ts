import { NextRequest, NextResponse } from 'next/server';
import { LoggerService } from '../services/loggerService';

export async function loggingMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
) {
    const logger = LoggerService.getInstance();
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    try {
        // Log de la requête entrante
        logger.info('Requête entrante', {
            requestId,
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers),
            timestamp: new Date().toISOString()
        });

        // Exécution de la requête
        const response = await next();

        // Log de la réponse
        const duration = Date.now() - startTime;
        logger.info('Réponse sortante', {
            requestId,
            status: response.status,
            duration: `${duration}ms`,
            headers: Object.fromEntries(response.headers),
            timestamp: new Date().toISOString()
        });

        return response;
    } catch (error) {
        // Log des erreurs
        logger.error('Erreur lors du traitement de la requête', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
} 