import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
            return NextResponse.json(
                { error: 'Les paramètres start et end sont requis' },
                { status: 400 }
            );
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const affectations = await prisma.assignment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        role: true
                    }
                },
                location: true
            },
            orderBy: {
                date: 'asc'
            }
        });

        return NextResponse.json(affectations);
    } catch (error: unknown) {
        logger.error('Error fetching affectations:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des affectations' },
            { status: 500 }
        );
    }
}