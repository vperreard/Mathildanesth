import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { prisma } from '@/lib/prisma';


// GET /api/bloc-operatoire/trameModeles
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');
        const id = searchParams.get('id');

        // Si un ID spécifique est demandé, récupérer une trameModele unique
        if (id) {
            const trameId = parseInt(id);

            if (isNaN(trameId)) {
                return NextResponse.json({ error: 'ID de trameModele invalide' }, { status: 400 });
            }

            const trameModele = await prisma.blocTramePlanning.findUnique({
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

            if (!trameModele) {
                return NextResponse.json({ error: 'TrameModele non trouvée' }, { status: 404 });
            }

            return NextResponse.json(trameModele);
        }

        // Sinon, filtrer par site si un ID de site est fourni
        const trameModeles = await prisma.blocTramePlanning.findMany({
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

        return NextResponse.json(trameModeles);
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des trames:', { error: error });
        return NextResponse.json({ error: 'Erreur lors de la récupération des trameModeles' }, { status: 500 });
    }
}

// POST /api/bloc-operatoire/trameModeles
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

        // Créer une nouvelle trameModele
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
    } catch (error: unknown) {
        logger.error('Erreur lors de la création de la trameModele:', { error: error });
        return NextResponse.json({
            error: 'Erreur lors de la création de la trameModele',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 