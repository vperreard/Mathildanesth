import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

jest.mock('@/lib/prisma');


// Récupérer un modèle spécifique
export async function GET(
    req: Request,
    { params }: { params: { templateId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const templateId = params.templateId;
        if (!templateId) {
            return NextResponse.json({ error: 'ID de modèle requis' }, { status: 400 });
        }

        const modèle = await prisma.simulationTemplate.findUnique({
            where: { id: templateId },
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

        if (!modèle) {
            return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur a le droit d'accéder au modèle (admin ou créateur)
        if (
            !modèle.isPublic &&
            modèle.createdById !== Number(session.user.id) &&
            session.user.role !== Role.ADMIN_TOTAL &&
            session.user.role !== Role.ADMIN_PARTIEL
        ) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas accès à ce modèle' },
                { status: 403 }
            );
        }

        return NextResponse.json(modèle);
    } catch (error) {
        console.error('Erreur lors de la récupération du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// Mettre à jour un modèle
export async function PUT(
    req: Request,
    { params }: { params: { templateId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const templateId = params.templateId;
        if (!templateId) {
            return NextResponse.json({ error: 'ID de modèle requis' }, { status: 400 });
        }

        // Vérifier si le modèle existe
        const existingTemplate = await prisma.simulationTemplate.findUnique({
            where: { id: templateId }
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur a le droit de modifier ce modèle
        if (
            existingTemplate.createdById !== Number(session.user.id) &&
            session.user.role !== Role.ADMIN_TOTAL &&
            session.user.role !== Role.ADMIN_PARTIEL
        ) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas le droit de modifier ce modèle' },
                { status: 403 }
            );
        }

        // Récupérer les données de mise à jour
        const data = await req.json();
        const { name, description, isPublic, parametersJson, category } = data;

        // Vérification supplémentaire pour rendre un modèle public
        if (
            isPublic &&
            !existingTemplate.isPublic &&
            session.user.role !== Role.ADMIN_TOTAL &&
            session.user.role !== Role.ADMIN_PARTIEL
        ) {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent rendre un modèle public' },
                { status: 403 }
            );
        }

        // Mettre à jour le modèle
        const updatedTemplate = await prisma.simulationTemplate.update({
            where: { id: templateId },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined,
                isPublic: isPublic !== undefined ? isPublic : undefined,
                parametersJson: parametersJson !== undefined ? parametersJson : undefined,
                category: category !== undefined ? category : undefined
            }
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// Supprimer un modèle
export async function DELETE(
    req: Request,
    { params }: { params: { templateId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const templateId = params.templateId;
        if (!templateId) {
            return NextResponse.json({ error: 'ID de modèle requis' }, { status: 400 });
        }

        // Vérifier si le modèle existe
        const existingTemplate = await prisma.simulationTemplate.findUnique({
            where: { id: templateId }
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur a le droit de supprimer ce modèle
        if (
            existingTemplate.createdById !== Number(session.user.id) &&
            session.user.role !== Role.ADMIN_TOTAL &&
            session.user.role !== Role.ADMIN_PARTIEL
        ) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas le droit de supprimer ce modèle' },
                { status: 403 }
            );
        }

        // Supprimer le modèle
        await prisma.simulationTemplate.delete({
            where: { id: templateId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 