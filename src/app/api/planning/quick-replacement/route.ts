import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
                assignments: {
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
                const currentMonthAssignments = user.assignments.filter(a => {
                    const assignmentDate = new Date(a.startDate);
                    return assignmentDate.getMonth() === new Date().getMonth();
                });

                const workloadCurrent = currentMonthAssignments.length;
                const workloadAverage = 15; // TODO: Calculer la vraie moyenne

                // Calculer le score de fatigue
                const fatigueScore = calculateFatigueScore(user.assignments);

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
                    lastReplacement: getLastReplacementDate(user.assignments),
                    fatigueScore,
                    metrics: {
                        replacementsThisMonth: countReplacementsThisMonth(user.assignments),
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

    } catch (error) {
        console.error('Erreur dans quick-replacement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la recherche de remplaçants' },
            { status: 500 }
        );
    }
}

async function calculateReplacementScore(
    user: any,
    shiftType: string,
    startDate: Date,
    endDate: Date
): Promise<number> {
    let score = 100;

    // 1. Disponibilité (40 points)
    const hasConflict = user.assignments.some((a: any) => {
        return isWithinInterval(new Date(a.startDate), { start: startDate, end: endDate });
    });
    
    const onLeave = user.leaves.some((l: any) => {
        return isWithinInterval(startDate, { 
            start: new Date(l.startDate), 
            end: new Date(l.endDate) 
        });
    });

    if (hasConflict || onLeave) {
        score -= 40;
    }

    // 2. Charge de travail (30 points)
    const workloadRatio = user.assignments.length / 15; // Supposons 15 comme moyenne
    score -= Math.min(30, workloadRatio * 30);

    // 3. Compétences (20 points)
    const hasRequiredSkills = checkRequiredSkills(user.competencies, shiftType);
    if (!hasRequiredSkills) {
        score -= 20;
    }

    // 4. Historique de remplacement (10 points)
    const recentReplacements = countRecentReplacements(user.assignments);
    score -= Math.min(10, recentReplacements * 2);

    return Math.max(0, Math.round(score));
}

function determineAvailability(
    user: any,
    startDate: Date,
    endDate: Date
): 'available' | 'partial' | 'busy' {
    const hasDirectConflict = user.assignments.some((a: any) => {
        return isWithinInterval(new Date(a.startDate), { start: startDate, end: endDate });
    });

    if (hasDirectConflict) return 'busy';

    const hasNearbyAssignment = user.assignments.some((a: any) => {
        const daysDiff = Math.abs(differenceInDays(new Date(a.startDate), startDate));
        return daysDiff <= 1;
    });

    if (hasNearbyAssignment) return 'partial';

    return 'available';
}

function calculateFatigueScore(assignments: any[]): number {
    // Calculer un score de fatigue basé sur les affectations récentes
    const recentAssignments = assignments.filter(a => {
        const daysSince = differenceInDays(new Date(), new Date(a.startDate));
        return daysSince >= 0 && daysSince <= 7;
    });

    const baseScore = recentAssignments.length * 15;
    return Math.min(100, baseScore);
}

function checkRequiredSkills(competencies: any[], shiftType: string): boolean {
    // TODO: Implémenter la vérification des compétences selon le type de shift
    return true;
}

function countRecentReplacements(assignments: any[]): number {
    return assignments.filter(a => {
        const daysSince = differenceInDays(new Date(), new Date(a.startDate));
        return daysSince >= 0 && daysSince <= 30 && a.isReplacement;
    }).length;
}

function getLastReplacementDate(assignments: any[]): Date | undefined {
    const replacements = assignments
        .filter(a => a.isReplacement)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return replacements[0] ? new Date(replacements[0].startDate) : undefined;
}

function countReplacementsThisMonth(assignments: any[]): number {
    const currentMonth = new Date().getMonth();
    return assignments.filter(a => 
        new Date(a.startDate).getMonth() === currentMonth && a.isReplacement
    ).length;
}