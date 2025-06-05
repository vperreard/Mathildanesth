import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getUserFromCookie } from '@/lib/auth';
import { alertingService } from '@/lib/monitoring/alerting';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromCookie(request);
        if (!user || (user.role !== Role.ADMIN_TOTAL && user.role !== Role.ADMIN_PARTIEL)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const url = new URL(request.url);
        const type = url.searchParams.get('type'); // 'active' | 'history' | 'stats'
        const limit = parseInt(url.searchParams.get('limit') || '100');

        switch (type) {
            case 'active':
                const activeAlerts = alertingService.getActiveAlerts();
                return NextResponse.json({ alerts: activeAlerts });

            case 'history':
                const alertHistory = alertingService.getAlertHistory(limit);
                return NextResponse.json({ alerts: alertHistory });

            case 'stats':
                const hours = parseInt(url.searchParams.get('hours') || '24');
                const statistics = alertingService.getAlertStatistics(hours);
                return NextResponse.json({ statistics });

            default:
                // Par défaut, retourner les alertes actives
                const defaultAlerts = alertingService.getActiveAlerts();
                return NextResponse.json({ alerts: defaultAlerts });
        }

    } catch (error: unknown) {
        logger.error('Error fetching alerts:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des alertes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromCookie(request);
        if (!user || user.role !== Role.ADMIN_TOTAL) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const body = await request.json();
        const { action, alertId, resolution } = body;

        switch (action) {
            case 'acknowledge':
                const acknowledged = alertingService.acknowledgeAlert(alertId, user.id.toString());
                if (!acknowledged) {
                    return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });
                }
                return NextResponse.json({ success: true, message: 'Alerte acquittée' });

            case 'resolve':
                const resolved = alertingService.resolveAlert(alertId, user.id.toString(), resolution);
                if (!resolved) {
                    return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });
                }
                return NextResponse.json({ success: true, message: 'Alerte résolue' });

            default:
                return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
        }

    } catch (error: unknown) {
        logger.error('Error processing alert action:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors du traitement de l\'action' },
            { status: 500 }
        );
    }
}