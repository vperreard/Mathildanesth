import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

jest.mock('@/lib/prisma');


const prisma = prisma;

/**
 * GET /api/conges/quotas/transfers
 * Récupère tous les transferts de quotas (admin uniquement)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
        const status = searchParams.get('status');

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const transfers = await prisma.quotaTransfer.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                },
                approvedBy: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                }
            },
            orderBy: {
                transferDate: 'desc'
            },
            take: limit,
            skip: offset
        });

        return NextResponse.json(transfers);
    } catch (error) {
        console.error('Erreur lors de la récupération des transferts :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des transferts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conges/quotas/transfers
 * Crée un nouveau transfert de quota
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await req.json();

        // Vérification des données obligatoires
        if (!data.userId || !data.fromType || !data.toType || !data.amount || data.amount <= 0) {
            return NextResponse.json(
                { error: 'Données incomplètes ou invalides' },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur a le droit de transférer pour cet utilisateur
        const userId = parseInt(data.userId);
        const currentUserId = parseInt(session.user.id);

        if (userId !== currentUserId && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Vous n\'êtes pas autorisé à effectuer un transfert pour cet utilisateur' },
                { status: 403 }
            );
        }

        // Récupérer la règle de transfert applicable
        const transferRule = await prisma.quotaTransferRule.findUnique({
            where: {
                fromType_toType: {
                    fromType: data.fromType,
                    toType: data.toType
                }
            }
        });

        if (!transferRule || !transferRule.isActive) {
            return NextResponse.json(
                { error: 'Aucune règle de transfert active n\'existe pour ces types de congés' },
                { status: 400 }
            );
        }

        // Vérifier le solde de congés disponible
        const sourceBalance = await prisma.leaveBalance.findUnique({
            where: {
                userId_leaveType_year: {
                    userId,
                    leaveType: data.fromType,
                    year: new Date().getFullYear()
                }
            }
        });

        if (!sourceBalance || sourceBalance.remaining < data.amount) {
            return NextResponse.json(
                { error: 'Solde insuffisant pour effectuer ce transfert' },
                { status: 400 }
            );
        }

        // Vérifier les limites de transfert
        if (transferRule.maxTransferDays && data.amount > transferRule.maxTransferDays) {
            return NextResponse.json(
                { error: `Le transfert ne peut pas dépasser ${transferRule.maxTransferDays} jours` },
                { status: 400 }
            );
        }

        if (transferRule.maxTransferPercentage) {
            const maxAmount = (sourceBalance.initial * transferRule.maxTransferPercentage) / 100;
            if (data.amount > maxAmount) {
                return NextResponse.json(
                    { error: `Le transfert ne peut pas dépasser ${transferRule.maxTransferPercentage}% du quota initial (${maxAmount.toFixed(1)} jours)` },
                    { status: 400 }
                );
            }
        }

        // Calculer le montant converti
        const convertedAmount = data.amount * transferRule.conversionRate;

        // Déterminer si une approbation est nécessaire
        const requiresApproval = transferRule.requiresApproval;
        const initialStatus = requiresApproval ? 'PENDING' : 'APPROVED';

        // Créer le transfert
        const transfer = await prisma.quotaTransfer.create({
            data: {
                userId,
                fromType: data.fromType,
                toType: data.toType,
                amount: data.amount,
                convertedAmount,
                reason: data.reason || 'Transfert de quota',
                status: initialStatus,
                requiresApproval,
                approvedById: !requiresApproval ? currentUserId : null,
                approvalDate: !requiresApproval ? new Date() : null,
                comments: data.comments
            }
        });

        // Si le transfert est approuvé automatiquement, mettre à jour les soldes
        if (initialStatus === 'APPROVED') {
            // Mettre à jour le solde source
            await prisma.leaveBalance.update({
                where: {
                    userId_leaveType_year: {
                        userId,
                        leaveType: data.fromType,
                        year: new Date().getFullYear()
                    }
                },
                data: {
                    remaining: {
                        decrement: data.amount
                    },
                    lastUpdated: new Date()
                }
            });

            // Vérifier si un solde cible existe déjà
            const targetBalance = await prisma.leaveBalance.findUnique({
                where: {
                    userId_leaveType_year: {
                        userId,
                        leaveType: data.toType,
                        year: new Date().getFullYear()
                    }
                }
            });

            if (targetBalance) {
                // Mettre à jour le solde cible
                await prisma.leaveBalance.update({
                    where: {
                        userId_leaveType_year: {
                            userId,
                            leaveType: data.toType,
                            year: new Date().getFullYear()
                        }
                    },
                    data: {
                        remaining: {
                            increment: convertedAmount
                        },
                        lastUpdated: new Date()
                    }
                });
            } else {
                // Créer un nouveau solde cible
                await prisma.leaveBalance.create({
                    data: {
                        userId,
                        leaveType: data.toType,
                        year: new Date().getFullYear(),
                        initial: convertedAmount,
                        remaining: convertedAmount,
                        used: 0,
                        pending: 0
                    }
                });
            }
        }

        // Journaliser l'action
        await prisma.auditLog.create({
            data: {
                action: initialStatus === 'APPROVED' ? 'EXECUTE_TRANSFER' : 'REQUEST_TRANSFER',
                entityId: transfer.id,
                entityType: 'QUOTA_TRANSFER',
                userId: currentUserId,
                details: JSON.stringify({
                    fromType: data.fromType,
                    toType: data.toType,
                    amount: data.amount,
                    convertedAmount,
                    status: initialStatus
                })
            }
        });

        return NextResponse.json({
            id: transfer.id,
            status: transfer.status,
            requiresApproval: transfer.requiresApproval,
            sourceAmount: data.amount,
            targetAmount: convertedAmount,
            message: requiresApproval
                ? 'Demande de transfert créée, en attente d\'approbation'
                : 'Transfert effectué avec succès'
        }, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du transfert :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création du transfert' },
            { status: 500 }
        );
    }
} 