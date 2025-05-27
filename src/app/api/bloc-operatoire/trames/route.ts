import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');


const prisma = prisma;

// GET /api/bloc-operatoire/tableaux de service
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');
        const id = searchParams.get('id');

        // Si un ID spécifique est demandé, récupérer une tableau de service unique
        if (id) {
            const trameId = parseInt(id);

            if (isNaN(trameId)) {
                return NextResponse.json({ error: 'ID de tableau de service invalide' }, { status: 400 });
            }

            const tableau de service = await prisma.blocTramePlanning.findUnique({
                where: { id: trameId },
                include: {
                    site: true,
                    gardes/vacations: {
                        include: {
                            user: true,
                            surgeon: true
                        }
                    }
                }
            });

            if (!tableau de service) {
                return NextResponse.json({ error: 'Tableau de service non trouvée' }, { status: 404 });
            }

            return NextResponse.json(tableau de service);
        }

        // Sinon, filtrer par site si un ID de site est fourni
        const tableaux de service = await prisma.blocTramePlanning.findMany({
            where: siteId ? { siteId } : undefined,
            include: {
                site: true,
                gardes/vacations: {
                    include: {
                        user: true,
                        surgeon: true
                    }
                }
            },
            orderBy: { dateDebut: 'desc' }
        });

        return NextResponse.json(tableaux de service);
    } catch (error) {
        console.error('Erreur lors de la récupération des tableaux de service:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des tableaux de service' }, { status: 500 });
    }
}

// POST /api/bloc-operatoire/tableaux de service
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

        // Créer une nouvelle tableau de service
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
        console.error('Erreur lors de la création de la tableau de service:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création de la tableau de service',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 