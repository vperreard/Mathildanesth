import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { LeaveType } from '@/modules/leaves/types/leave';
import { hasRequiredRole } from '@/lib/auth';
import { z } from 'zod';
import { AuditAction } from '@/services/AuditService';
import { auditService } from '@/lib/auditService';

// Validation du corps de la requête
const transferRequestSchema = z.object({
    userId: z.string(),
    sourceType: z.nativeEnum(LeaveType),
    destinationType: z.nativeEnum(LeaveType),
    days: z.number().positive(),
    reason: z.string().min(3),
    year: z.number().optional()
});

export async function POST(req: NextRequest) {
    try {
        // Vérification de l'authentification
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérification des permissions
        const isAdmin = hasRequiredRole(session, ['ADMIN', 'HR_MANAGER']);
        const isRequestingForSelf = session.user.id === req.body.userId;

        if (!isAdmin && !isRequestingForSelf) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }

        // Récupération et validation des données
        const requestData = await req.json();
        const validationResult = transferRequestSchema.safeParse(requestData);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const data = validationResult.data;
        const { userId, sourceType, destinationType, days, reason, year = new Date().getFullYear() } = data;

        // Récupération des règles de transfert applicables
        const transferRule = await prisma.quotaTransferRule.findFirst({
            where: {
                sourceType,
                destinationType,
                isEnabled: true
            }
        });

        if (!transferRule) {
            return NextResponse.json(
                { error: 'Aucune règle de transfert disponible pour ces types de congés' },
                { status: 400 }
            );
        }

        // Récupération des soldes de congés actuels
        const sourceBalance = await prisma.leaveBalance.findFirst({
            where: {
                userId,
                leaveType: sourceType,
                year
            }
        });

        if (!sourceBalance || sourceBalance.available < days) {
            return NextResponse.json(
                { error: `Solde insuffisant. Vous disposez de ${sourceBalance?.available || 0} jours.` },
                { status: 400 }
            );
        }

        // Récupération ou création du solde de destination
        let targetBalance = await prisma.leaveBalance.findFirst({
            where: {
                userId,
                leaveType: destinationType,
                year
            }
        });

        // Calcul des jours convertis selon le taux de conversion
        const convertedDays = days * transferRule.conversionRate;

        // Transaction pour garantir l'atomicité des opérations
        const result = await prisma.$transaction(async (tx) => {
            // Mise à jour du solde source
            const updatedSourceBalance = await tx.leaveBalance.update({
                where: { id: sourceBalance.id },
                data: {
                    available: { decrement: days },
                    used: { increment: days }
                }
            });

            // Mise à jour ou création du solde de destination
            if (targetBalance) {
                targetBalance = await tx.leaveBalance.update({
                    where: { id: targetBalance.id },
                    data: {
                        available: { increment: convertedDays },
                        accrued: { increment: convertedDays }
                    }
                });
            } else {
                targetBalance = await tx.leaveBalance.create({
                    data: {
                        userId,
                        leaveType: destinationType,
                        year,
                        available: convertedDays,
                        accrued: convertedDays,
                        used: 0,
                        pending: 0,
                        scheduled: 0
                    }
                });
            }

            // Enregistrement du transfert dans l'historique
            const transferRecord = await tx.quotaTransfer.create({
                data: {
                    userId,
                    sourceType,
                    destinationType,
                    daysDebited: days,
                    daysCredit: convertedDays,
                    conversionRate: transferRule.conversionRate,
                    reason,
                    status: transferRule.requiresApproval ? 'PENDING' : 'APPROVED',
                    approvedById: transferRule.requiresApproval ? null : session.user.id,
                    approvedAt: transferRule.requiresApproval ? null : new Date()
                }
            });

            return {
                transferId: transferRecord.id,
                sourceBalance: updatedSourceBalance,
                targetBalance
            };
        });

        // Enregistrer l'action dans l'audit
        await auditService.logAction({
            action: AuditAction.QUOTA_TRANSFER,
            entityId: userId,
            entityType: 'user',
            userId: parseInt(userId, 10), // L'utilisateur qui effectue l'action
            details: {
                transferId: result.transferId,
                fromType: sourceType,
                toType: destinationType,
                days: days,
                convertedAmount: convertedDays,
                reason,
                requiresApproval: transferRule.requiresApproval
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Transfert effectué avec succès',
            sourceRemaining: result.sourceBalance.available,
            targetTotal: result.targetBalance.available,
            transferId: result.transferId
        });
    } catch (error) {
        console.error('Erreur lors de l\'exécution du transfert:', error);
        return NextResponse.json(
            { error: 'Erreur lors du traitement de la demande' },
            { status: 500 }
        );
    }
} 