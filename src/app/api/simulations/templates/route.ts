import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

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

        // Si publicOnly est vrai, on ne récupère que les templates publics
        // Sinon, on récupère les templates publics et ceux créés par l'utilisateur
        if (publicOnly) {
            filters.isPublic = true;
        } else {
            filters.OR = [
                { isPublic: true },
                { createdById: Number(session.user.id) }
            ];
        }

        const templates = await prisma.simulationTemplate.findMany({
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

        return NextResponse.json(templates);
    } catch (error) {
        logger.error('Erreur lors de la récupération des templates de simulation:', error);
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

        // Vérifier si l'utilisateur est admin pour créer un template public
        if (isPublic && session.user.role !== Role.ADMIN_TOTAL && session.user.role !== Role.ADMIN_PARTIEL) {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent créer des templates publics' },
                { status: 403 }
            );
        }

        const template = await prisma.simulationTemplate.create({
            data: {
                name,
                description,
                isPublic: isPublic || false,
                parametersJson,
                category,
                createdById: Number(session.user.id)
            }
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        logger.error('Erreur lors de la création du template de simulation:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 