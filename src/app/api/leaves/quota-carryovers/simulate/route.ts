import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveType } from '@/modules/leaves/types/leave';

jest.mock('@/lib/prisma');


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, fromPeriodId, toPeriodId, leaveType, days } = body;

        // Validation des entrées
        if (!userId || !fromPeriodId || !toPeriodId || !leaveType || typeof days !== 'number' || days <= 0) {
            return NextResponse.json(
                { error: "Paramètres invalides pour la simulation de report" },
                { status: 400 }
            );
        }

        // Vérifier si le type de congé est valide
        if (!Object.values(LeaveType).includes(leaveType)) {
            return NextResponse.json(
                { error: "Type de congé invalide" },
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

        // Vérifier si les périodes sont valides
        const fromPeriod = await prisma.quotaPeriod.findUnique({ where: { id: fromPeriodId } });
        const toPeriod = await prisma.quotaPeriod.findUnique({ where: { id: toPeriodId } });
        if (!fromPeriod || !toPeriod) {
            return NextResponse.json(
                { error: "Période source ou destination non trouvée" },
                { status: 404 }
            );
        }

        // Vérifier la chronologie des périodes
        const fromEndDate = new Date(fromPeriod.endDate);
        const toStartDate = new Date(toPeriod.startDate);
        if (fromEndDate > toStartDate) {
            return NextResponse.json({
                isValid: false,
                eligibleDays: 0,
                message: "La période source doit se terminer avant le début de la période destination"
            });
        }

        // Récupérer le solde pour la période source
        const sourceBalance = await prisma.userQuotaBalance.findFirst({
            where: {
                userId: String(userId),
                periodId: fromPeriodId,
                leaveType
            }
        });

        if (!sourceBalance) {
            return NextResponse.json(
                { error: "Aucun quota trouvé pour ce type de congé dans la période source" },
                { status: 404 }
            );
        }

        // Vérifier s'il y a suffisamment de jours disponibles
        if (sourceBalance.currentBalance < days) {
            return NextResponse.json({
                isValid: false,
                eligibleDays: sourceBalance.currentBalance,
                message: "Solde insuffisant pour effectuer ce report"
            });
        }

        // Récupérer les règles de report applicables
        const carryOverRules = await prisma.quotaCarryOverRule.findMany({
            where: {
                leaveType,
                isActive: true
            }
        });

        if (!carryOverRules.length) {
            return NextResponse.json({
                isValid: false,
                eligibleDays: 0,
                message: "Aucune règle de report n'est définie pour ce type de congé"
            });
        }

        // Appliquer les règles (utiliser la plus restrictive)
        let maxCarryOverDays = sourceBalance.currentBalance;
        let requiresApproval = false;
        let expirationDate = null;
        let usedRule = null;

        for (const rule of carryOverRules) {
            let ruleEligibleDays = 0;

            switch (rule.ruleType) {
                case 'PERCENTAGE':
                    // Report d'un pourcentage du solde restant
                    ruleEligibleDays = Math.floor(sourceBalance.currentBalance * (rule.value / 100));
                    break;
                case 'FIXED':
                    // Report d'un montant fixe
                    ruleEligibleDays = Math.min(rule.value, sourceBalance.currentBalance);
                    break;
                case 'UNLIMITED':
                    // Report illimité (tout le solde restant)
                    ruleEligibleDays = sourceBalance.currentBalance;
                    break;
                case 'EXPIRABLE':
                    // Report avec date d'expiration
                    ruleEligibleDays = Math.min(rule.value, sourceBalance.currentBalance);
                    break;
            }

            // Appliquer la limite maximale si définie
            if (rule.maxCarryOverDays !== undefined && rule.maxCarryOverDays !== null) {
                ruleEligibleDays = Math.min(ruleEligibleDays, rule.maxCarryOverDays);
            }

            // Si cette règle est plus restrictive, on l'applique
            if (ruleEligibleDays < maxCarryOverDays) {
                maxCarryOverDays = ruleEligibleDays;
                requiresApproval = rule.requiresApproval;
                usedRule = rule;

                // Calculer la date d'expiration si définie
                if (rule.expirationDays) {
                    const startOfNextPeriod = new Date(toPeriod.startDate);
                    expirationDate = new Date(startOfNextPeriod);
                    expirationDate.setDate(startOfNextPeriod.getDate() + rule.expirationDays);
                }
            }
        }

        // Vérifier si le nombre de jours demandés est dans la limite permise
        if (days > maxCarryOverDays) {
            return NextResponse.json({
                isValid: false,
                eligibleDays: maxCarryOverDays,
                expirationDate: expirationDate ? expirationDate.toISOString() : undefined,
                requiresApproval,
                message: `Le report est limité à ${maxCarryOverDays} jours pour ce type de congé`
            });
        }

        return NextResponse.json({
            isValid: true,
            eligibleDays: days,
            expirationDate: expirationDate ? expirationDate.toISOString() : undefined,
            requiresApproval,
            message: expirationDate
                ? `Le report de ${days} jours est possible, ils expireront le ${new Date(expirationDate).toLocaleDateString()}`
                : `Le report de ${days} jours est possible`
        });
    } catch (error) {
        console.error("Erreur lors de la simulation du report de quota:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la simulation du report" },
            { status: 500 }
        );
    }
}; 