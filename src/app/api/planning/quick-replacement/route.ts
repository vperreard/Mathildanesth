import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { ShiftType } from '@/types/common';
import { differenceInDays, isWithinInterval, parseISO } from 'date-fns';

interface ReplacementCandidate {
    id: string;
    name: string;
    avatar?: string;
    score: number;
    availability: 'available' | 'partial' | 'busy';
    workload: {
        current: number;
        average: number;
    };
    competencies: string[];
    lastReplacement?: Date;
    fatigueScore: number;
    metrics: {
        replacementsThisMonth: number;
        averageResponseTime: number;
        reliability: number;
    };
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { assignmentId, shiftType, startDate, endDate, currentUserId } = await request.json();

        // Récupérer tous les utilisateurs actifs sauf celui à remplacer
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                isActive: true,
                role: { in: ['MAR', 'IADE'] }
            },
            include: {
                attributions: {
                    where: {
                        startDate: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 30))
                        }
                    }
                },
                leaves: {
                    where: {
                        status: 'APPROVED',
                        OR: [
                            {
                                startDate: { lte: new Date(endDate) },
                                endDate: { gte: new Date(startDate) }
                            }
                        ]
                    }
                },
                competencies: true
            }
        });

        // Calculer les scores pour chaque candidat
        const candidates: ReplacementCandidate[] = await Promise.all(
            users.map(async (user) => {
                const score = await calculateReplacementScore(
                    user,
                    shiftType,
                    new Date(startDate),
                    new Date(endDate)
                );

                // Déterminer la disponibilité
                const availability = determineAvailability(
                    user,
                    new Date(startDate),
                    new Date(endDate)
                );

                // Calculer les métriques
                const currentMonthAssignments = user.attributions.filter(a => {
                    const assignmentDate = new Date(a.startDate);
                    return assignmentDate.getMonth() === new Date().getMonth();
                });

                const workloadCurrent = currentMonthAssignments.length;
                const workloadAverage = 15; // TODO: Calculer la vraie moyenne

                // Calculer le score de fatigue
                const fatigueScore = calculateFatigueScore(user.attributions);

                return {
                    id: user.id,
                    name: `${user.firstName || user.prenom} ${user.lastName || user.nom}`,
                    avatar: user.image || undefined,
                    score,
                    availability,
                    workload: {
                        current: workloadCurrent,
                        average: workloadAverage
                    },
                    competencies: user.competencies?.map(c => c.name) || [],
                    lastReplacement: getLastReplacementDate(user.attributions),
                    fatigueScore,
                    metrics: {
                        replacementsThisMonth: countReplacementsThisMonth(user.attributions),
                        averageResponseTime: 2, // TODO: Calculer depuis l'historique
                        reliability: 95 // TODO: Calculer depuis l'historique
                    }
                };
            })
        );

        // Trier par score décroissant
        candidates.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            candidates: candidates.slice(0, 10) // Top 10 candidats
        });

    } catch (error: unknown) {
        logger.error('Erreur dans quick-replacement:', { error: error });
        return NextResponse.json(
            { error: 'Erreur lors de la recherche de remplaçants' },
            { status: 500 }
        );
    }
}

async function calculateReplacementScore(
    user: unknown,
    shiftType: string,
    startDate: Date,
    endDate: Date
): Promise<number> {
    let score = 100;

    // 1. Disponibilité (40 points)
    const hasConflict = user.attributions.some((a: unknown) => {
        return isWithinInterval(new Date(a.startDate), { start: startDate, end: endDate });
    });
    
    const onLeave = user.leaves.some((l: unknown) => {
        return isWithinInterval(startDate, { 
            start: new Date(l.startDate), 
            end: new Date(l.endDate) 
        });
    });

    if (hasConflict || onLeave) {
        score -= 40;
    }

    // 2. Charge de travail (30 points)
    const workloadRatio = user.attributions.length / 15; // Supposons 15 comme moyenne
    score -= Math.min(30, workloadRatio * 30);

    // 3. Compétences (20 points)
    const hasRequiredSkills = checkRequiredSkills(user.competencies, shiftType);
    if (!hasRequiredSkills) {
        score -= 20;
    }

    // 4. Historique de remplacement (10 points)
    const recentReplacements = countRecentReplacements(user.attributions);
    score -= Math.min(10, recentReplacements * 2);

    return Math.max(0, Math.round(score));
}

function determineAvailability(
    user: unknown,
    startDate: Date,
    endDate: Date
): 'available' | 'partial' | 'busy' {
    const hasDirectConflict = user.attributions.some((a: unknown) => {
        return isWithinInterval(new Date(a.startDate), { start: startDate, end: endDate });
    });

    if (hasDirectConflict) return 'busy';

    const hasNearbyAssignment = user.attributions.some((a: unknown) => {
        const daysDiff = Math.abs(differenceInDays(new Date(a.startDate), startDate));
        return daysDiff <= 1;
    });

    if (hasNearbyAssignment) return 'partial';

    return 'available';
}

function calculateFatigueScore(attributions: unknown[]): number {
    // Calculer un score de fatigue basé sur les affectations récentes
    const recentAssignments = attributions.filter(a => {
        const daysSince = differenceInDays(new Date(), new Date(a.startDate));
        return daysSince >= 0 && daysSince <= 7;
    });

    const baseScore = recentAssignments.length * 15;
    return Math.min(100, baseScore);
}

function checkRequiredSkills(competencies: unknown[], shiftType: string): boolean {
    // TODO: Implémenter la vérification des compétences selon le type de shift
    return true;
}

function countRecentReplacements(attributions: unknown[]): number {
    return attributions.filter(a => {
        const daysSince = differenceInDays(new Date(), new Date(a.startDate));
        return daysSince >= 0 && daysSince <= 30 && a.isReplacement;
    }).length;
}

function getLastReplacementDate(attributions: unknown[]): Date | undefined {
    const replacements = attributions
        .filter(a => a.isReplacement)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return replacements[0] ? new Date(replacements[0].startDate) : undefined;
}

function countReplacementsThisMonth(attributions: unknown[]): number {
    const currentMonth = new Date().getMonth();
    return attributions.filter(a => 
        new Date(a.startDate).getMonth() === currentMonth && a.isReplacement
    ).length;
}