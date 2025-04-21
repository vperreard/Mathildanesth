import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/rules/[id]
 * Récupère une règle spécifique
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const ruleId = params.id;

        const rule = await prisma.rule.findUnique({
            where: {
                id: ruleId
            },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        if (!rule) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        // Sérialisation des dates pour la réponse JSON
        const serializedRule = {
            ...rule,
            validFrom: rule.validFrom.toISOString(),
            validTo: rule.validTo ? rule.validTo.toISOString() : null,
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString()
        };

        return NextResponse.json(serializedRule);
    } catch (error) {
        console.error(`Erreur lors de la récupération de la règle ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération de la règle' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/rules/[id]
 * Met à jour une règle existante
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const ruleId = params.id;
        const data = await request.json();

        // Vérifier si la règle existe
        const existingRule = await prisma.rule.findUnique({
            where: {
                id: ruleId
            }
        });

        if (!existingRule) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        // Mise à jour de la règle
        const updatedRule = await prisma.rule.update({
            where: {
                id: ruleId
            },
            data: {
                name: data.name || existingRule.name,
                description: data.description || existingRule.description,
                type: data.type || existingRule.type,
                priority: data.priority || existingRule.priority,
                isActive: data.isActive !== undefined ? data.isActive : existingRule.isActive,
                validFrom: data.validFrom ? new Date(data.validFrom) : existingRule.validFrom,
                validTo: data.validTo ? new Date(data.validTo) : existingRule.validTo,
                updatedBy: data.updatedBy || existingRule.updatedBy,
                configuration: data.configuration || existingRule.configuration
            },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        // Sérialisation des dates pour la réponse JSON
        const serializedRule = {
            ...updatedRule,
            validFrom: updatedRule.validFrom.toISOString(),
            validTo: updatedRule.validTo ? updatedRule.validTo.toISOString() : null,
            createdAt: updatedRule.createdAt.toISOString(),
            updatedAt: updatedRule.updatedAt.toISOString()
        };

        return NextResponse.json(serializedRule);
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de la règle ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la mise à jour de la règle' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rules/[id]
 * Supprime une règle existante
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const ruleId = params.id;

        // Vérifier si la règle existe
        const existingRule = await prisma.rule.findUnique({
            where: {
                id: ruleId
            }
        });

        if (!existingRule) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        // Supprimer la règle
        await prisma.rule.delete({
            where: {
                id: ruleId
            }
        });

        return NextResponse.json({
            message: 'Règle supprimée avec succès'
        });
    } catch (error) {
        console.error(`Erreur lors de la suppression de la règle ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la suppression de la règle' },
            { status: 500 }
        );
    }
} 