import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';


/**
 * GET /api/conges/quotas/carry-overs
 * Récupère tous les reports de quotas (admin uniquement)
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
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (year) {
            where.fromYear = year;
        }

        const carryOvers = await prisma.quotaCarryOver.findMany({
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
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        return NextResponse.json(carryOvers);
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des reports :', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des reports' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conges/quotas/carry-overs
 * Crée un nouveau report de quota
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await req.json();

        // Vérification des données obligatoires
        if (!data.userId || !data.leaveType || !data.fromYear || !data.toYear || data.fromYear >= data.toYear) {
            return NextResponse.json(
                { error: 'Données incomplètes ou invalides' },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur a le droit de faire un report pour cet utilisateur
        const userId = parseInt(data.userId);
        const currentUserId = parseInt(session.user.id);

        if (userId !== currentUserId && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Vous n\'êtes pas autorisé à effectuer un report pour cet utilisateur' },
                { status: 403 }
            );
        }

        // Récupérer la règle de report applicable
        const carryOverRule = await prisma.quotaCarryOverRule.findUnique({
            where: {
                leaveType: data.leaveType
            }
        });

        if (!carryOverRule || !carryOverRule.isActive) {
            return NextResponse.json(
                { error: 'Aucune règle de report active n\'existe pour ce type de congé' },
                { status: 400 }
            );
        }

        // Vérifier le solde de congés disponible pour l'année source
        const sourceBalance = await prisma.leaveBalance.findUnique({
            where: {
                userId_leaveType_year: {
                    userId,
                    leaveType: data.leaveType,
                    year: data.fromYear
                }
            }
        });

        if (!sourceBalance || sourceBalance.remaining <= 0) {
            return NextResponse.json(
                { error: 'Aucun solde disponible à reporter pour ce type de congé et cette année' },
                { status: 400 }
            );
        }

        // Calculer le montant à reporter
        let amountToCarryOver = data.amount;

        if (!amountToCarryOver) {
            // Calculer en fonction de la règle
            if (carryOverRule.ruleType === 'PERCENTAGE') {
                amountToCarryOver = (sourceBalance.remaining * carryOverRule.value) / 100;
            } else if (carryOverRule.ruleType === 'FIXED') {
                amountToCarryOver = Math.min(sourceBalance.remaining, carryOverRule.value);
            } else if (carryOverRule.ruleType === 'UNLIMITED') {
                amountToCarryOver = sourceBalance.remaining;
            } else {
                // EXPIRABLE, traité comme PERCENTAGE par défaut
                amountToCarryOver = (sourceBalance.remaining * carryOverRule.value) / 100;
            }
        }

        // Appliquer la limite de jours maximale si applicable
        if (carryOverRule.maxCarryOverDays && amountToCarryOver > carryOverRule.maxCarryOverDays) {
            amountToCarryOver = carryOverRule.maxCarryOverDays;
        }

        // Arrondir au dixième près
        amountToCarryOver = Math.round(amountToCarryOver * 10) / 10;

        // Vérifier si le montant est valide
        if (amountToCarryOver <= 0 || amountToCarryOver > sourceBalance.remaining) {
            return NextResponse.json(
                { error: 'Montant de report invalide' },
                { status: 400 }
            );
        }

        // Calculer la date d'expiration si applicable
        let expiryDate = null;
        if (carryOverRule.ruleType === 'EXPIRABLE' && carryOverRule.expirationDays) {
            const startOfNextYear = new Date(data.toYear, 0, 1);
            expiryDate = new Date(startOfNextYear);
            expiryDate.setDate(startOfNextYear.getDate() + carryOverRule.expirationDays);
        }

        // Déterminer si une approbation est nécessaire
        const requiresApproval = carryOverRule.requiresApproval;
        const initialStatus = requiresApproval ? 'PENDING' : 'APPROVED';

        // Créer le report
        const carryOver = await prisma.quotaCarryOver.create({
            data: {
                userId,
                leaveType: data.leaveType,
                fromYear: data.fromYear,
                toYear: data.toYear,
                amount: amountToCarryOver,
                expiryDate,
                status: initialStatus,
                requiresApproval,
                approvedById: !requiresApproval ? currentUserId : null,
                approvalDate: !requiresApproval ? new Date() : null,
                reason: data.reason || 'Report de quota annuel',
                comments: data.comments
            }
        });

        // Si le report est approuvé automatiquement, mettre à jour les soldes
        if (initialStatus === 'APPROVED') {
            // Mettre à jour le solde source
            await prisma.leaveBalance.update({
                where: {
                    userId_leaveType_year: {
                        userId,
                        leaveType: data.leaveType,
                        year: data.fromYear
                    }
                },
                data: {
                    remaining: {
                        decrement: amountToCarryOver
                    },
                    lastUpdated: new Date()
                }
            });

            // Vérifier si un solde cible existe déjà
            const targetBalance = await prisma.leaveBalance.findUnique({
                where: {
                    userId_leaveType_year: {
                        userId,
                        leaveType: data.leaveType,
                        year: data.toYear
                    }
                }
            });

            if (targetBalance) {
                // Mettre à jour le solde cible
                await prisma.leaveBalance.update({
                    where: {
                        userId_leaveType_year: {
                            userId,
                            leaveType: data.leaveType,
                            year: data.toYear
                        }
                    },
                    data: {
                        remaining: {
                            increment: amountToCarryOver
                        },
                        lastUpdated: new Date()
                    }
                });
            } else {
                // Créer un nouveau solde cible
                await prisma.leaveBalance.create({
                    data: {
                        userId,
                        leaveType: data.leaveType,
                        year: data.toYear,
                        initial: amountToCarryOver,
                        remaining: amountToCarryOver,
                        used: 0,
                        pending: 0
                    }
                });
            }
        }

        // Journaliser l'action
        await prisma.auditLog.create({
            data: {
                action: initialStatus === 'APPROVED' ? 'EXECUTE_CARRY_OVER' : 'REQUEST_CARRY_OVER',
                entityId: carryOver.id,
                entityType: 'QUOTA_CARRY_OVER',
                userId: currentUserId,
                details: JSON.stringify({
                    leaveType: data.leaveType,
                    fromYear: data.fromYear,
                    toYear: data.toYear,
                    amount: amountToCarryOver,
                    expiryDate,
                    status: initialStatus
                })
            }
        });

        return NextResponse.json({
            id: carryOver.id,
            status: carryOver.status,
            requiresApproval: carryOver.requiresApproval,
            originalRemaining: sourceBalance.remaining,
            carryOverAmount: amountToCarryOver,
            expiryDate,
            message: requiresApproval
                ? 'Demande de report créée, en attente d\'approbation'
                : 'Report effectué avec succès'
        }, { status: 201 });
    } catch (error: unknown) {
        logger.error('Erreur lors de la création du report :', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la création du report' },
            { status: 500 }
        );
    }
} 