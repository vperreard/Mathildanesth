import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '@/lib/monitoring/healthCheck';

export async function GET(request: NextRequest) {
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

    } catch (error) {
        console.error('Health check failed:', error);
        
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
export async function HEAD(request: NextRequest) {
    try {
        const healthCheck = await healthCheckService.performHealthCheck();
        
        if (healthCheck.status === 'unhealthy') {
            return new NextResponse(null, { status: 503 });
        }
        
        return new NextResponse(null, { status: 200 });
    } catch (error) {
        return new NextResponse(null, { status: 503 });
    }
}