import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Récupérer toutes les règles de planning
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification
        if (!session) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Récupérer les paramètres de requête
        const searchParams = req.nextUrl.searchParams;
        const active = searchParams.get('active');
        const type = searchParams.get('type');

        // Construire les filtres
        const where: any = {};

        if (active === 'true') {
            where.isActive = true;
        } else if (active === 'false') {
            where.isActive = false;
        }

        if (type) {
            where.type = type;
        }

        // Récupérer les règles de planning
        const planningRules = await prisma.planningRule.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { name: 'asc' }
            ],
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        return NextResponse.json(planningRules);
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des règles de planning' },
            { status: 500 }
        );
    }
}

// Créer une nouvelle règle de planning
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Validation des données
        if (!data.name || !data.type) {
            return NextResponse.json(
                { error: 'Le nom et le type sont requis' },
                { status: 400 }
            );
        }

        // Valider le type
        const validTypes = ['bloc', 'garde', 'astreinte', 'consultation', 'autre'];
        if (!validTypes.includes(data.type)) {
            return NextResponse.json(
                { error: 'Type invalide. Valeurs valides: ' + validTypes.join(', ') },
                { status: 400 }
            );
        }

        // Créer la règle de planning
        const planningRule = await prisma.planningRule.create({
            data: {
                name: data.name,
                description: data.description || '',
                type: data.type,
                isActive: data.isActive !== undefined ? data.isActive : true,
                priority: data.priority || 1,
                configuration: data.configuration || {},
                createdBy: session.user.id || null
            },
        });

        return NextResponse.json(planningRule, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la règle de planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de la règle de planning' },
            { status: 500 }
        );
    }
} 