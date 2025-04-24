import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Récupérer un type d'affectation par ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification
        if (!session) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
            );
        }

        const assignmentType = await prisma.assignmentType.findUnique({
            where: { id },
        });

        if (!assignmentType) {
            return NextResponse.json(
                { error: 'Type d\'affectation non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json(assignmentType);
    } catch (error) {
        console.error('Erreur lors de la récupération du type d\'affectation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du type d\'affectation' },
            { status: 500 }
        );
    }
}

// Mettre à jour un type d'affectation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
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

        // Vérifier si le type existe
        const existingType = await prisma.assignmentType.findUnique({
            where: { id },
        });

        if (!existingType) {
            return NextResponse.json(
                { error: 'Type d\'affectation non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier si le code est déjà utilisé par un autre type
        if (data.code !== existingType.code) {
            const typeWithSameCode = await prisma.assignmentType.findUnique({
                where: { code: data.code },
            });

            if (typeWithSameCode && typeWithSameCode.id !== id) {
                return NextResponse.json(
                    { error: 'Un type d\'affectation avec ce code existe déjà' },
                    { status: 400 }
                );
            }
        }

        // Mettre à jour le type d'affectation
        const updatedType = await prisma.assignmentType.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                icon: data.icon,
                color: data.color,
                isActive: data.isActive,
                allowsMultiple: data.allowsMultiple,
                requiresLocation: data.requiresLocation,
                properties: data.properties,
            },
        });

        return NextResponse.json(updatedType);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du type d\'affectation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du type d\'affectation' },
            { status: 500 }
        );
    }
}

// Supprimer un type d'affectation
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
            );
        }

        // Vérifier si le type existe
        const existingType = await prisma.assignmentType.findUnique({
            where: { id },
        });

        if (!existingType) {
            return NextResponse.json(
                { error: 'Type d\'affectation non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier si des affectations utilisent ce type
        const assignmentsCount = await prisma.assignment.count({
            where: { typeId: id },
        });

        if (assignmentsCount > 0) {
            // Au lieu de supprimer, on désactive le type
            const deactivatedType = await prisma.assignmentType.update({
                where: { id },
                data: { isActive: false },
            });

            return NextResponse.json({
                ...deactivatedType,
                message: 'Le type d\'affectation a été désactivé car il est utilisé par des affectations existantes'
            });
        }

        // Supprimer le type d'affectation
        await prisma.assignmentType.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression du type d\'affectation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression du type d\'affectation' },
            { status: 500 }
        );
    }
} 