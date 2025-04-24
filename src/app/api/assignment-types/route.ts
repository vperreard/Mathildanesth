import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Récupérer tous les types d'affectations
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
        const code = searchParams.get('code');

        // Construire les filtres
        let where: any = {};

        if (active === 'true') {
            where.isActive = true;
        } else if (active === 'false') {
            where.isActive = false;
        }

        if (code) {
            where.code = code;
        }

        // Récupérer les types d'affectations
        const assignmentTypes = await prisma.assignmentType.findMany({
            where,
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(assignmentTypes);
    } catch (error) {
        console.error('Erreur lors de la récupération des types d\'affectations:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des types d\'affectations' },
            { status: 500 }
        );
    }
}

// Créer un nouveau type d'affectation
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Validation des données
        if (!data.name || !data.code) {
            return NextResponse.json(
                { error: 'Le nom et le code sont requis' },
                { status: 400 }
            );
        }

        // Vérifier si le code existe déjà
        const existingType = await prisma.assignmentType.findUnique({
            where: {
                code: data.code,
            },
        });

        if (existingType) {
            return NextResponse.json(
                { error: 'Un type d\'affectation avec ce code existe déjà' },
                { status: 400 }
            );
        }

        // Créer le type d'affectation
        const assignmentType = await prisma.assignmentType.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description || '',
                icon: data.icon || 'Calendar',
                color: data.color || '#3B82F6',
                isActive: data.isActive !== undefined ? data.isActive : true,
                allowsMultiple: data.allowsMultiple || false,
                requiresLocation: data.requiresLocation !== undefined ? data.requiresLocation : true,
                properties: data.properties || [],
            },
        });

        return NextResponse.json(assignmentType, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du type d\'affectation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création du type d\'affectation' },
            { status: 500 }
        );
    }
} 