import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// Récupérer un template spécifique
export async function GET(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { templateId: templateId } = await params;
    if (!templateId) {
      return NextResponse.json({ error: 'ID de template requis' }, { status: 400 });
    }

    const template = await prisma.simulationTemplate.findUnique({
      where: { id: templateId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a le droit d'accéder au template (admin ou créateur)
    if (
      !template.isPublic &&
      template.createdById !== Number(session.user.id) &&
      session.user.role !== Role.ADMIN_TOTAL &&
      session.user.role !== Role.ADMIN_PARTIEL
    ) {
      return NextResponse.json({ error: "Vous n'avez pas accès à ce template" }, { status: 403 });
    }

    return NextResponse.json(template);
  } catch (error: unknown) {
    logger.error('Erreur lors de la récupération du template:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Mettre à jour un template
export async function PUT(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { templateId: templateId } = await params;
    if (!templateId) {
      return NextResponse.json({ error: 'ID de template requis' }, { status: 400 });
    }

    // Vérifier si le template existe
    const existingTemplate = await prisma.simulationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a le droit de modifier ce template
    if (
      existingTemplate.createdById !== Number(session.user.id) &&
      session.user.role !== Role.ADMIN_TOTAL &&
      session.user.role !== Role.ADMIN_PARTIEL
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas le droit de modifier ce template" },
        { status: 403 }
      );
    }

    // Récupérer les données de mise à jour
    const data = await req.json();
    const { name, description, isPublic, parametersJson, category } = data;

    // Vérification supplémentaire pour rendre un template public
    if (
      isPublic &&
      !existingTemplate.isPublic &&
      session.user.role !== Role.ADMIN_TOTAL &&
      session.user.role !== Role.ADMIN_PARTIEL
    ) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent rendre un template public' },
        { status: 403 }
      );
    }

    // Mettre à jour le template
    const updatedTemplate = await prisma.simulationTemplate.update({
      where: { id: templateId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        parametersJson: parametersJson !== undefined ? parametersJson : undefined,
        category: category !== undefined ? category : undefined,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error: unknown) {
    logger.error('Erreur lors de la mise à jour du template:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer un template
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { templateId: templateId } = await params;
    if (!templateId) {
      return NextResponse.json({ error: 'ID de template requis' }, { status: 400 });
    }

    // Vérifier si le template existe
    const existingTemplate = await prisma.simulationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a le droit de supprimer ce template
    if (
      existingTemplate.createdById !== Number(session.user.id) &&
      session.user.role !== Role.ADMIN_TOTAL &&
      session.user.role !== Role.ADMIN_PARTIEL
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas le droit de supprimer ce template" },
        { status: 403 }
      );
    }

    // Supprimer le template
    await prisma.simulationTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Erreur lors de la suppression du template:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
