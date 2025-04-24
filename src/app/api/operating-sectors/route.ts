import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET tous les secteurs
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const sectors = await prisma.operatingSector.findMany({
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(sectors);
    } catch (error) {
        console.error('Erreur lors de la récupération des secteurs:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des secteurs' }, { status: 500 });
    }
}

// POST pour créer un nouveau secteur
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();

        // Validation des données
        if (!data.name) {
            return NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 });
        }

        // Création du secteur
        const newSector = await prisma.operatingSector.create({
            data: {
                name: data.name,
                colorCode: data.colorCode || '#000000',
                isActive: data.isActive !== undefined ? data.isActive : true,
                description: data.description || '',
                maxRoomsPerSupervisor: data.maxRoomsPerSupervisor || 1,
            },
        });

        return NextResponse.json(newSector, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du secteur:', error);
        return NextResponse.json({ error: 'Erreur lors de la création du secteur' }, { status: 500 });
    }
}

// PUT pour mettre à jour un secteur existant
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 });
        }

        const updatedSector = await prisma.operatingSector.update({
            where: { id: data.id },
            data: {
                name: data.name,
                colorCode: data.colorCode,
                isActive: data.isActive,
                description: data.description,
                maxRoomsPerSupervisor: data.maxRoomsPerSupervisor,
            },
        });

        return NextResponse.json(updatedSector);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du secteur:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du secteur' }, { status: 500 });
    }
}

// DELETE pour supprimer un secteur
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 });
        }

        await prisma.operatingSector.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Secteur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du secteur:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression du secteur' }, { status: 500 });
    }
} 