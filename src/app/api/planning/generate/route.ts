import { NextResponse } from 'next/server';
import { PlanningGenerator } from '@/services/planningGenerator';
import { ApiService } from '@/services/api'; // Supposons que l'ApiService peut aussi être utilisé côté serveur si nécessaire
import { GenerationParameters } from '@/types/attribution';
import { defaultRulesConfiguration, defaultFatigueConfig } from '@/types/rules';
import { BusinessRulesValidator } from '@/services/businessRulesValidator';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withSensitiveRateLimit } from '@/lib/rateLimit';

jest.mock('@/lib/prisma');


async function postHandler(request: Request) {
    try {
        // 🔐 Vérifier l'authentification
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            logger.warn('Tentative de génération de planning sans token', { path: '/api/planning/generate' });
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            logger.warn('Token invalide pour génération de planning', { path: '/api/planning/generate' });
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Récupérer l'utilisateur authentifié
        const authenticatedUser = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: { id: true, role: true, siteId: true }
        });

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 403 });
        }

        // 🔐 Vérifier les permissions (admin ou responsable planning)
        if (authenticatedUser.role !== 'ADMIN_TOTAL' && 
            authenticatedUser.role !== 'ADMIN_PARTIEL' &&
            authenticatedUser.role !== 'MANAGER') {
            logger.warn('Tentative non autorisée de génération de planning', { 
                authenticatedUserId: authenticatedUser.id,
                role: authenticatedUser.role 
            });
            return NextResponse.json({ error: 'Forbidden - Seuls les administrateurs peuvent générer des plannings' }, { status: 403 });
        }

        const params: GenerationParameters = await request.json();

        // 🔐 VALIDATION DES RÈGLES MÉTIER POUR LA GÉNÉRATION
        const validationResult = await BusinessRulesValidator.validatePlanningGeneration({
            startDate: new Date(params.dateDebut),
            endDate: new Date(params.dateFin),
            siteId: params.siteId || authenticatedUser.siteId || '',
            includeWeekends: params.includeWeekends !== false,
            respectQuotas: params.respectLeaveQuotas !== false
        });

        if (!validationResult.valid) {
            logger.warn('Validation des règles métier échouée pour génération de planning', {
                errors: validationResult.errors,
                params: { 
                    dateDebut: params.dateDebut, 
                    dateFin: params.dateFin,
                    siteId: params.siteId 
                }
            });
            return NextResponse.json({ 
                error: 'La génération du planning ne respecte pas les règles métier',
                details: validationResult.errors
            }, { status: 400 });
        }

        // Logger l'action
        logger.info('Génération de planning', {
            action: 'GENERATE_PLANNING',
            authenticatedUserId: authenticatedUser.id,
            role: authenticatedUser.role,
            details: { 
                dateDebut: params.dateDebut, 
                dateFin: params.dateFin,
                siteId: params.siteId || authenticatedUser.siteId
            }
        });

        // Ici, idéalement, on récupère les données réelles (users, attributions) via un accès direct DB ou un service interne
        // Pour l'exemple, utilisons une méthode fictive ou supposons un accès DB via Prisma/autre ORM
        // const users = await db.user.findMany({ where: { actif: true } });
        // const existingAssignments = await db.attribution.findMany({ where: { date: { gte: params.dateDebut, lte: params.dateFin } } });
        // Remplacer par la vraie logique de récupération de données
        const api = ApiService.getInstance(); // Attention: l'ApiService fetch peut ne pas être idéal ici.
        const users = await api.getActiveUsers(); // Préférer un accès direct à la base de données
        const existingAssignments = await api.getExistingAssignments(params.dateDebut, params.dateFin);

        // Utiliser les configurations par défaut ou celles passées en paramètre si nécessaire
        const rulesConfig = defaultRulesConfiguration;
        const fatigueConfig = defaultFatigueConfig;

        // Initialiser et exécuter le générateur
        const organisateur = new PlanningGenerator(params, rulesConfig, fatigueConfig);
        await organisateur.initialize(users, existingAssignments);
        const generationResult = await organisateur.generateFullPlanning();

        const results = organisateur.getResults();
        const allAssignments = [
            ...results.gardes,
            ...results.astreintes,
            ...results.consultations,
            ...results.blocs
        ];

        // Retourner le résultat complet
        return NextResponse.json({
            attributions: allAssignments,
            validationResult: generationResult
        });

    } catch (error) {
        console.error('[API /planning/generate] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur lors de la génération du planning' },
            { status: 500 }
        );
    }
}

// Export avec rate limiting
export const POST = withSensitiveRateLimit(postHandler); 