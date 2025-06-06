import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { authOptions } from '@/lib/auth/migration-shim';
import { getServerSession } from '@/lib/auth/migration-shim';
import { prisma } from '@/lib/prisma';
import { LeaveType } from '@/modules/leaves/types/leave';
import { z } from 'zod';
import { AuditAction } from '@/services/AuditService';
import { AuditService } from '@/services/AuditService';
import { LeaveType as PrismaLeaveType } from '@prisma/client';

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
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupération et validation des données AVANT la vérification des permissions
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
        const userIdInt = parseInt(userId, 10);

        // Vérification des permissions
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'HR_MANAGER';
        const isRequestingForSelf = String(session.user.id) === userId;

        if (!isAdmin && !isRequestingForSelf) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }

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
        const sourceBalance = await prisma.leaveBalance.findUnique({
            where: {
                userId_year_leaveType: {
                    userId: userIdInt,
                    year: year,
                    leaveType: sourceType as PrismaLeaveType
                }
            }
        });

        if (!sourceBalance || sourceBalance.remaining < days) {
            return NextResponse.json(
                { error: `Solde insuffisant (${sourceType}). Vous disposez de ${sourceBalance?.remaining || 0} jours.` },
                { status: 400 }
            );
        }

        // Récupération ou création du solde de destination
        let targetBalance = await prisma.leaveBalance.findUnique({
            where: {
                userId_year_leaveType: {
                    userId: userIdInt,
                    year: year,
                    leaveType: destinationType as PrismaLeaveType
                }
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
                    remaining: { decrement: days },
                    used: { increment: days }
                }
            });

            // Mise à jour ou création du solde de destination
            if (!targetBalance) {
                targetBalance = await tx.leaveBalance.create({
                    data: {
                        userId: userIdInt,
                        leaveType: destinationType as PrismaLeaveType,
                        year,
                        initial: convertedDays,
                        used: 0,
                        pending: 0,
                        remaining: convertedDays
                    }
                });
            } else {
                targetBalance = await tx.leaveBalance.update({
                    where: { id: targetBalance.id },
                    data: {
                        remaining: { increment: convertedDays },
                        initial: { increment: convertedDays }
                    }
                });
            }

            // Enregistrement du transfert dans l'historique
            const transferRecord = await tx.quotaTransfer.create({
                data: {
                    userId: userIdInt,
                    sourceType: sourceType as PrismaLeaveType,
                    destinationType: destinationType as PrismaLeaveType,
                    daysDebited: days,
                    daysCredit: convertedDays,
                    conversionRate: transferRule.conversionRate,
                    reason,
                    status: transferRule.requiresApproval ? 'PENDING' : 'APPROVED',
                    approvedById: transferRule.requiresApproval ? null : (session?.user?.id ? parseInt(String(session.user.id), 10) : null),
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
        const auditService = new AuditService();
        await auditService.logAction({
            action: AuditAction.QUOTA_TRANSFER,
            entityId: userId,
            entityType: 'user',
            userId: userIdInt,
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
            sourceRemaining: result.sourceBalance.remaining,
            targetTotal: result.targetBalance.remaining,
            transferId: result.transferId
        });
    } catch (error: unknown) {
        logger.error('Erreur lors de l\'exécution du transfert:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors du traitement de la demande' },
            { status: 500 }
        );
    }
} 