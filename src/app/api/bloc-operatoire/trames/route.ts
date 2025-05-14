import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/bloc-operatoire/trames
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');
        const id = searchParams.get('id');

        // Si un ID spécifique est demandé, récupérer une trame unique
        if (id) {
            const trameId = parseInt(id);

            if (isNaN(trameId)) {
                return NextResponse.json({ error: 'ID de trame invalide' }, { status: 400 });
            }

            const trame = await prisma.blocTramePlanning.findUnique({
                where: { id: trameId },
                include: {
                    site: true,
                    affectations: {
                        include: {
                            user: true,
                            surgeon: true
                        }
                    }
                }
            });

            if (!trame) {
                return NextResponse.json({ error: 'Trame non trouvée' }, { status: 404 });
            }

            return NextResponse.json(trame);
        }

        // Sinon, filtrer par site si un ID de site est fourni
        const trames = await prisma.blocTramePlanning.findMany({
            where: siteId ? { siteId } : undefined,
            include: {
                site: true,
                affectations: {
                    include: {
                        user: true,
                        surgeon: true
                    }
                }
            },
            orderBy: { dateDebut: 'desc' }
        });

        return NextResponse.json(trames);
    } catch (error) {
        console.error('Erreur lors de la récupération des trames:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des trames' }, { status: 500 });
    }
}

// POST /api/bloc-operatoire/trames
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const { name, siteId, description, dateDebut, isActive } = data;

        if (!name || !siteId) {
            return NextResponse.json({ error: 'Nom et site requis' }, { status: 400 });
        }

        // Créer une nouvelle trame
        const newTrame = await prisma.blocTramePlanning.create({
            data: {
                name,
                siteId,
                description,
                dateDebut: new Date(dateDebut),
                isActive: isActive !== undefined ? isActive : true
            },
            include: {
                site: true
            }
        });

        return NextResponse.json(newTrame, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la trame:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création de la trame',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 