import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { healthCheckService } from '@/lib/monitoring/healthCheck';
import { withPublicRateLimit } from '@/lib/rateLimit';

async function getHandler(request: NextRequest) {
    try {
        const metrics = await healthCheckService.getMetrics();
        
        // Déterminer le code de statut HTTP basé sur la santé
        let statusCode = 200;
        if (metrics.status === 'degraded') statusCode = 207; // Multi-Status
        if (metrics.status === 'unhealthy') statusCode = 503; // Service Unavailable

        return NextResponse.json(metrics, { 
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error: unknown) {
        logger.error('Health check failed:', error instanceof Error ? error : new Error(String(error)));
        
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: Date.now(),
            error: 'Health check service failed',
            checks: {}
        }, { 
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
}

// Endpoint simple pour les load balancers
async function headHandler(request: NextRequest) {
    try {
        const healthCheck = await healthCheckService.performHealthCheck();
        
        if (healthCheck.status === 'unhealthy') {
            return new NextResponse(null, { status: 503 });
        }
        
        return new NextResponse(null, { status: 200 });
    } catch (error: unknown) {
        return new NextResponse(null, { status: 503 });
    }
}

// Export avec rate limiting
export const GET = withPublicRateLimit(getHandler);
export const HEAD = withPublicRateLimit(headHandler);