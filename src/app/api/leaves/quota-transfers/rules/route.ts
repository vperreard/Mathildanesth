import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';

/**
 * Gestion des règles de transfert de quotas de congés
 */
export async function GET(request: NextRequest) {
    try {
        // Récupérer toutes les règles de transfert actives
        const rules = await prisma.quotaTransferRule.findMany({
            where: {
                isActive: true
            }
        });

        // Formater les règles pour le frontend
        const formattedRules = rules.map(rule => ({
            fromType: rule.fromType,
            toType: rule.toType,
            conversionRate: rule.conversionRate,
            maxTransferDays: rule.maxTransferDays,
            maxTransferPercentage: rule.maxTransferPercentage,
            requiresApproval: rule.requiresApproval,
            authorizedRoles: rule.authorizedRoles,
            isEnabled: rule.isActive
        }));

        return NextResponse.json(formattedRules);
    } catch (error: unknown) {
        logger.error("Erreur lors de la récupération des règles de transfert:", { error: error });
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des règles de transfert" },
            { status: 500 }
        );
    }
}

/**
 * Gestion des règles pour un type de congé source spécifique
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation des données reçues
        if (!body.fromType || !body.toType || !body.conversionRate) {
            return NextResponse.json(
                { error: "Données incomplètes pour la création d'une règle de transfert" },
                { status: 400 }
            );
        }

        // Vérifier si la règle existe déjà
        const existingRule = await prisma.quotaTransferRule.findFirst({
            where: {
                fromType: body.fromType,
                toType: body.toType
            }
        });

        let rule;

        if (existingRule) {
            // Mettre à jour la règle existante
            rule = await prisma.quotaTransferRule.update({
                where: {
                    id: existingRule.id
                },
                data: {
                    conversionRate: body.conversionRate,
                    maxTransferDays: body.maxTransferDays || null,
                    maxTransferPercentage: body.maxTransferPercentage || null,
                    requiresApproval: body.requiresApproval || false,
                    authorizedRoles: body.authorizedRoles || [],
                    isActive: body.isEnabled !== undefined ? body.isEnabled : true,
                    updatedAt: new Date()
                }
            });
        } else {
            // Créer une nouvelle règle
            rule = await prisma.quotaTransferRule.create({
                data: {
                    fromType: body.fromType,
                    toType: body.toType,
                    conversionRate: body.conversionRate,
                    maxTransferDays: body.maxTransferDays || null,
                    maxTransferPercentage: body.maxTransferPercentage || null,
                    requiresApproval: body.requiresApproval || false,
                    authorizedRoles: body.authorizedRoles || [],
                    isActive: body.isEnabled !== undefined ? body.isEnabled : true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }

        return NextResponse.json(rule);
    } catch (error: unknown) {
        logger.error("Erreur lors de la création/modification d'une règle de transfert:", { error: error });
        return NextResponse.json(
            { error: "Erreur serveur lors de la création/modification d'une règle de transfert" },
            { status: 500 }
        );
    }
} 