import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

jest.mock('@/lib/prisma');


export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const categoryFilter = searchParams.get('category');
        const publicOnly = searchParams.get('publicOnly') === 'true';

        // Construire les filtres
        const filters: any = {};

        if (categoryFilter) {
            filters.category = categoryFilter;
        }

        // Si publicOnly est vrai, on ne récupère que les modèles publics
        // Sinon, on récupère les modèles publics et ceux créés par l'utilisateur
        if (publicOnly) {
            filters.isPublic = true;
        } else {
            filters.OR = [
                { isPublic: true },
                { createdById: Number(session.user.id) }
            ];
        }

        const modèles = await prisma.simulationTemplate.findMany({
            where: filters,
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return NextResponse.json(modèles);
    } catch (error) {
        console.error('Erreur lors de la récupération des modèles de simulation:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const data = await req.json();
        const { name, description, isPublic, parametersJson, category } = data;

        if (!name || !parametersJson) {
            return NextResponse.json(
                { error: 'Nom et paramètres requis' },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur est admin pour créer un modèle public
        if (isPublic && session.user.role !== Role.ADMIN_TOTAL && session.user.role !== Role.ADMIN_PARTIEL) {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent créer des modèles publics' },
                { status: 403 }
            );
        }

        const modèle = await prisma.simulationTemplate.create({
            data: {
                name,
                description,
                isPublic: isPublic || false,
                parametersJson,
                category,
                createdById: Number(session.user.id)
            }
        });

        return NextResponse.json(modèle, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du modèle de simulation:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 