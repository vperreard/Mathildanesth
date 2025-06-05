import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { LeaveType } from '@/modules/leaves/types/leave';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, periodId, fromType, toType, days } = body;

        // Validation des entrées
        if (!userId || !periodId || !fromType || !toType || typeof days !== 'number' || days <= 0) {
            return NextResponse.json(
                { error: "Paramètres invalides pour la simulation de transfert" },
                { status: 400 }
            );
        }

        // Vérifier si les types de congés sont valides
        if (!Object.values(LeaveType).includes(fromType) || !Object.values(LeaveType).includes(toType)) {
            return NextResponse.json(
                { error: "Types de congés invalides" },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // Vérifier si la période est valide
        const period = await prisma.quotaPeriod.findUnique({ where: { id: periodId } });
        if (!period) {
            return NextResponse.json(
                { error: "Période non trouvée" },
                { status: 404 }
            );
        }

        // Récupérer le solde actuel pour le type source
        const sourceBalance = await prisma.userQuotaBalance.findFirst({
            where: {
                userId: String(userId),
                periodId,
                leaveType: fromType
            }
        });

        if (!sourceBalance) {
            return NextResponse.json(
                { error: "Aucun quota trouvé pour ce type de congé source" },
                { status: 404 }
            );
        }

        // Vérifier s'il y a suffisamment de jours disponibles
        if (sourceBalance.currentBalance < days) {
            return NextResponse.json({
                isValid: false,
                sourceRemaining: sourceBalance.currentBalance,
                resultingDays: 0,
                conversionRate: 0,
                requiresApproval: false,
                message: "Solde insuffisant pour effectuer ce transfert"
            });
        }

        // Trouver la règle de transfert applicable
        const transferRule = await prisma.quotaTransferRule.findFirst({
            where: {
                fromType,
                toType,
                isActive: true
            }
        });

        if (!transferRule) {
            return NextResponse.json({
                isValid: false,
                sourceRemaining: sourceBalance.currentBalance,
                resultingDays: 0,
                conversionRate: 0,
                requiresApproval: false,
                message: "Aucune règle de transfert n'est définie pour cette combinaison de types de congés"
            });
        }

        // Vérifier les limites de la règle
        const maxTransferDays = transferRule.maxTransferDays || Infinity;
        const maxTransferPercentage = transferRule.maxTransferPercentage
            ? sourceBalance.currentBalance * (transferRule.maxTransferPercentage / 100)
            : Infinity;

        const maxAllowedDays = Math.min(maxTransferDays, maxTransferPercentage, sourceBalance.currentBalance);

        if (days > maxAllowedDays) {
            return NextResponse.json({
                isValid: false,
                sourceRemaining: sourceBalance.currentBalance,
                resultingDays: 0,
                conversionRate: transferRule.conversionRate,
                requiresApproval: transferRule.requiresApproval,
                message: `Le transfert est limité à ${maxAllowedDays} jours pour ce type de congé`
            });
        }

        // Vérifier le minimum de jours restants requis
        if (transferRule.minimumRemainingDays &&
            (sourceBalance.currentBalance - days) < transferRule.minimumRemainingDays) {
            return NextResponse.json({
                isValid: false,
                sourceRemaining: sourceBalance.currentBalance,
                resultingDays: 0,
                conversionRate: transferRule.conversionRate,
                requiresApproval: transferRule.requiresApproval,
                message: `Vous devez conserver au moins ${transferRule.minimumRemainingDays} jours de ce type de congé`
            });
        }

        // Calculer le résultat
        const resultingDays = days * transferRule.conversionRate;
        const sourceRemaining = sourceBalance.currentBalance - days;

        return NextResponse.json({
            isValid: true,
            sourceRemaining,
            resultingDays,
            conversionRate: transferRule.conversionRate,
            requiresApproval: transferRule.requiresApproval,
            message: `Le transfert générera ${resultingDays} jours de ${toType}`
        });
    } catch (error: unknown) {
        logger.error("Erreur lors de la simulation du transfert de quota:", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: "Erreur serveur lors de la simulation du transfert" },
            { status: 500 }
        );
    }
}; 