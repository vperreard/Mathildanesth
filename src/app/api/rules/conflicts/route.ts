import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RuleConflict, RuleSeverity } from '../../../../modules/rules/types/rule';


/**
 * GET /api/rules/conflicts
 * Récupère tous les conflits entre règles
 */
export async function GET(request: NextRequest) {
    try {
        // Récupère les conflits non résolus (resolvedAt est null)
        const conflicts = await prisma.ruleConflict.findMany({
            where: {
                resolvedAt: null
            },
            orderBy: {
                detectedAt: 'desc'
            },
            include: {
                rules: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        isActive: true
                    }
                }
            }
        });

        // Sérialisation des dates pour la réponse JSON
        const serializedConflicts = conflicts.map(conflict => ({
            ...conflict,
            detectedAt: conflict.detectedAt.toISOString(),
            resolvedAt: conflict.resolvedAt ? conflict.resolvedAt.toISOString() : null
        }));

        return NextResponse.json(serializedConflicts);
    } catch (error) {
        console.error('Erreur lors de la récupération des conflits:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des conflits' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rules/conflicts
 * Crée un nouveau conflit entre règles
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validation de base des données reçues
        if (!data.ruleIds || !Array.isArray(data.ruleIds) || data.ruleIds.length < 2) {
            return NextResponse.json(
                { error: 'Au moins deux règles en conflit doivent être spécifiées' },
                { status: 400 }
            );
        }

        // Création du conflit
        const conflictData = {
            description: data.description || 'Conflit entre règles',
            severity: data.severity || RuleSeverity.MEDIUM,
            rules: {
                connect: data.ruleIds.map((id: string) => ({ id }))
            }
        };

        const createdConflict = await prisma.ruleConflict.create({
            data: conflictData,
            include: {
                rules: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        isActive: true
                    }
                }
            }
        });

        // Sérialisation des dates pour la réponse JSON
        const serializedConflict = {
            ...createdConflict,
            detectedAt: createdConflict.detectedAt.toISOString(),
            resolvedAt: createdConflict.resolvedAt ? createdConflict.resolvedAt.toISOString() : null
        };

        return NextResponse.json(serializedConflict, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du conflit:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la création du conflit' },
            { status: 500 }
        );
    }
} 