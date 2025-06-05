import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SecurityChecks } from '@/middleware/authorization';
import { logger } from '@/lib/logger';

/**
 * Wrapper sécurisé pour les routes de simulation
 * Seuls les admins peuvent créer et exécuter des simulations
 */
export const secureSimulationRoute = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
    resourceType: 'simulation',
    customCheck: async (context, req) => {
        // Vérifications supplémentaires spécifiques aux simulations
        const path = req.nextUrl.pathname;
        
        // Pour les simulations de site spécifique, vérifier l'accès au site
        if (path.includes('/site/')) {
            const siteId = path.split('/site/')[1].split('/')[0];
            return await SecurityChecks.hasAccessToSite(context, siteId);
        }
        
        return true;
    }
});

/**
 * Valider les paramètres de simulation pour éviter les injections
 */
export function validateSimulationParams(params: unknown): {
    valid: boolean;
    error?: string;
} {
    // Vérifier les types de données
    if (params.startDate && !isValidDate(params.startDate)) {
        return { valid: false, error: 'Invalid start date' };
    }
    
    if (params.endDate && !isValidDate(params.endDate)) {
        return { valid: false, error: 'Invalid end date' };
    }
    
    // Vérifier les limites pour éviter les simulations trop lourdes
    if (params.iterations && (params.iterations < 1 || params.iterations > 1000)) {
        return { valid: false, error: 'Iterations must be between 1 and 1000' };
    }
    
    // Vérifier les IDs pour éviter les injections
    if (params.siteId && !isValidUUID(params.siteId)) {
        return { valid: false, error: 'Invalid site ID format' };
    }
    
    return { valid: true };
}

function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}