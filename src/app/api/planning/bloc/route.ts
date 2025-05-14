import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import {
    getBlocPlanningByDate,
    createBlocPlanning,
    updateBlocPlanning,
    validateBlocPlanning
} from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { ZodError } from 'zod';
import { BlocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

const prisma = new PrismaClient();
const planningService = new BlocPlanningService();

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const siteId = searchParams.get('siteId');

        if (!dateStr) {
            return NextResponse.json({ error: 'Date requise dans les paramètres de recherche' }, { status: 400 });
        }

        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 });
        }

        // Si un siteId est fourni, rechercher les plannings pour ce site et cette date
        if (siteId) {
            const plannings = await prisma.blocDayPlanning.findMany({
                where: {
                    siteId: siteId,
                    date: {
                        equals: date
                    }
                },
                include: {
                    site: true,
                    assignments: {
                        include: {
                            operatingRoom: { include: { operatingSector: true } },
                            surgeon: true,
                            staffAssignments: { include: { user: true } }
                        }
                    }
                }
            });
            return NextResponse.json(plannings);
        } else {
            // Sinon, rechercher tous les plannings pour cette date
            const plannings = await prisma.blocDayPlanning.findMany({
                where: {
                    date: {
                        equals: date
                    }
                },
                include: {
                    site: true,
                    assignments: {
                        include: {
                            operatingRoom: { include: { operatingSector: true } },
                            surgeon: true,
                            staffAssignments: { include: { user: true } }
                        }
                    }
                }
            });
            return NextResponse.json(plannings);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du planning du bloc:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération du planning du bloc' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const { siteId, startDate, endDate, trameIds, initiatorUserId } = data;

        if (!siteId || !startDate || !endDate) {
            return NextResponse.json({ error: 'siteId, startDate et endDate sont requis' }, { status: 400 });
        }

        // Valider les dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 });
        }

        // Utiliser le service pour créer les plannings à partir des trames
        const generatedPlannings = await planningService.createOrUpdateBlocDayPlanningsFromTrames({
            siteId,
            startDate: start,
            endDate: end,
            trameIds: trameIds || [],
            initiatorUserId: initiatorUserId || 1, // Utiliser un ID par défaut si non fourni
        });

        return NextResponse.json({
            success: true,
            message: `${generatedPlannings.length} planning(s) généré(s) avec succès`,
            plannings: generatedPlannings
        });
    } catch (error) {
        console.error('Erreur lors de la création des plannings:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création des plannings',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Pour l'instant, cette route n'est pas implémentée
        return NextResponse.json({ error: 'Route non implémentée' }, { status: 501 });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du planning du bloc:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du planning du bloc' }, { status: 500 });
    }
} 