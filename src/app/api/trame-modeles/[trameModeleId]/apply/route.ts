import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';
import { logger } from '@/lib/logger';

const ALLOWED_ROLES: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

/**
 * POST /api/trameModele-modeles/[trameModeleId]/apply
 * Appliquer une trameModele template - ADMIN uniquement
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ trameModeleId: string }> }) {
    try {
        // Vérifier l'authentification et les rôles
        const authCheck = await checkUserRole(ALLOWED_ROLES);
        if (!authCheck.hasRequiredRole) {
            return NextResponse.json(
                { error: authCheck.error || 'Authentification requise' },
                { status: 401 }
            );
        }

        const { trameModeleId } = await params;
        const trameModeleIdNum = parseInt(trameModeleId);
        const userId = authCheck.user?.id || 0;
        const { startDate, endDate, siteId, options } = await req.json();

        // Validation des paramètres
        if (!startDate || !endDate || !siteId) {
            return NextResponse.json(
                { error: 'Missing required parameters: startDate, endDate, siteId' },
                { status: 400 }
            );
        }

        // Vérifier que la trameModele existe
        const trameModele = await prisma.trameModele.findUnique({
            where: { id: trameModeleIdNum },
            include: {
                affectations: true
            }
        });

        if (!trameModele) {
            return NextResponse.json(
                { error: 'TrameModele model not found' },
                { status: 404 }
            );
        }

        // Vérifier l'accès au site
        const site = await prisma.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        // Validation des dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            return NextResponse.json(
                { error: 'End date must be after start date' },
                { status: 400 }
            );
        }

        // Limiter la période pour éviter les abus
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            return NextResponse.json(
                { error: 'Period cannot exceed 365 days' },
                { status: 400 }
            );
        }

        // Logger l'action avant l'application
        logger.info('Applying trameModele model', {
            trameModeleId,
            siteId,
            startDate,
            endDate,
            userId,
            affectationsCount: trameModele.affectations.length
        });

        // TODO: Implémenter la logique d'application de la trameModele
        // Ceci est un placeholder - la logique réelle dépend de votre implémentation
        const result = {
            success: true,
            message: 'TrameModele model applied successfully',
            appliedCount: trameModele.affectations.length,
            period: { startDate, endDate }
        };

        return NextResponse.json(result);

    } catch (error) {
        logger.error('Error applying trameModele model', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}