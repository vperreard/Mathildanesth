import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * POST /api/rules/conflicts/[id]/resolve
 * Résout un conflit entre règles
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const conflictId = params.id;
        const data = await request.json();

        // Vérifier si le type d'action est fourni
        if (!data.actionType) {
            return NextResponse.json(
                { error: 'Le type d\'action est requis' },
                { status: 400 }
            );
        }

        // Vérifier si le conflit existe et n'est pas déjà résolu
        const existingConflict = await prisma.ruleConflict.findUnique({
            where: {
                id: conflictId,
                resolvedAt: null
            },
            include: {
                rules: true
            }
        });

        if (!existingConflict) {
            return NextResponse.json(
                { error: 'Conflit non trouvé ou déjà résolu' },
                { status: 404 }
            );
        }

        // Selon le type d'action, procéder à la résolution
        switch (data.actionType) {
            case 'MODIFY_RULES':
                // Vérifier si des règles modifiées sont fournies
                if (!data.modifiedRules || !Array.isArray(data.modifiedRules) || data.modifiedRules.length === 0) {
                    return NextResponse.json(
                        { error: 'Des règles modifiées doivent être fournies pour ce type d\'action' },
                        { status: 400 }
                    );
                }

                // Mettre à jour les règles modifiées
                await Promise.all(
                    data.modifiedRules.map(async (rule: any) => {
                        if (!rule.id) return;

                        await prisma.rule.update({
                            where: { id: rule.id },
                            data: {
                                name: rule.name,
                                description: rule.description,
                                priority: rule.priority,
                                isActive: rule.isActive,
                                validFrom: rule.validFrom ? new Date(rule.validFrom) : undefined,
                                validTo: rule.validTo ? new Date(rule.validTo) : undefined,
                                updatedBy: rule.updatedBy || undefined,
                                configuration: rule.configuration || undefined
                            }
                        });
                    })
                );
                break;

            case 'DELETE_RULES':
                // Vérifier si des règles à supprimer sont fournies
                if (!data.rulesToDelete || !Array.isArray(data.rulesToDelete) || data.rulesToDelete.length === 0) {
                    return NextResponse.json(
                        { error: 'Des règles à supprimer doivent être fournies pour ce type d\'action' },
                        { status: 400 }
                    );
                }

                // Supprimer les règles spécifiées
                await Promise.all(
                    data.rulesToDelete.map(async (ruleId: string) => {
                        await prisma.rule.delete({
                            where: { id: ruleId }
                        });
                    })
                );
                break;

            case 'IGNORE_CONFLICT':
                // Optionnellement enregistrer la raison d'ignorer le conflit
                if (!data.ignoreReason) {
                    return NextResponse.json(
                        { error: 'Une raison est requise pour ignorer un conflit' },
                        { status: 400 }
                    );
                }
                break;

            default:
                return NextResponse.json(
                    { error: 'Type d\'action non valide' },
                    { status: 400 }
                );
        }

        // Marquer le conflit comme résolu
        const resolvedConflict = await prisma.ruleConflict.update({
            where: {
                id: conflictId
            },
            data: {
                resolvedAt: new Date(),
                resolution: data.actionType,
                resolutionDetails: data.ignoreReason || `Résolu par ${data.actionType}`,
            },
            include: {
                rules: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        // Sérialisation des dates pour la réponse JSON
        const serializedConflict = {
            ...resolvedConflict,
            detectedAt: resolvedConflict.detectedAt.toISOString(),
            resolvedAt: resolvedConflict.resolvedAt ? resolvedConflict.resolvedAt.toISOString() : null
        };

        return NextResponse.json(serializedConflict);
    } catch (error) {
        console.error(`Erreur lors de la résolution du conflit ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la résolution du conflit' },
            { status: 500 }
        );
    }
} 