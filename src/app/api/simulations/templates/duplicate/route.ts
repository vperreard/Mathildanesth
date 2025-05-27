import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

jest.mock('@/lib/prisma');


// Schéma de validation pour la duplication d'un modèle
const duplicateTemplateSchema = z.object({
    sourceTemplateId: z.string().min(1, { message: "ID du modèle source requis" }),
    name: z.string().min(1, { message: "Nom du nouveau modèle requis" }),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const data = await req.json();
        const validationResult = duplicateTemplateSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { sourceTemplateId, name } = validationResult.data;

        // Vérifier si le modèle source existe
        const sourceTemplate = await prisma.simulationTemplate.findUnique({
            where: { id: sourceTemplateId }
        });

        if (!sourceTemplate) {
            return NextResponse.json(
                { error: 'Modèle source non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier si l'utilisateur a le droit d'accéder au modèle source
        // (soit il est public, soit l'utilisateur en est le créateur)
        if (!sourceTemplate.isPublic && sourceTemplate.createdById !== Number(session.user.id)) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas accès à ce modèle source' },
                { status: 403 }
            );
        }

        // Créer un nouveau modèle basé sur le modèle source
        const newTemplate = await prisma.simulationTemplate.create({
            data: {
                name,
                description: sourceTemplate.description,
                category: sourceTemplate.category,
                isPublic: false, // Par défaut, le nouveau modèle est privé
                parametersJson: sourceTemplate.parametersJson,
                createdById: Number(session.user.id)
            }
        });

        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la duplication du modèle de simulation:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 