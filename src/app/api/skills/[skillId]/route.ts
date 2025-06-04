import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { skillIdSchema, updateSkillSchema } from '@/lib/schemas/skillSchemas';
import { getCurrentUser, isAdmin, handleApiError } from '@/lib/apiUtils';

// GET /api/skills/[skillId] - Récupère une compétence spécifique par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { skillId } = skillIdSchema.parse(resolvedParams);

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return NextResponse.json({ message: 'Compétence non trouvée.' }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération de la compétence.');
  }
}

// PUT /api/skills/[skillId] - Met à jour une compétence existante (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ message: 'Accès non autorisé.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { skillId } = skillIdSchema.parse(resolvedParams);
    const body = await request.json();
    const validation = updateSkillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Données invalides.',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Vérifier que la compétence existe
    const existingSkill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!existingSkill) {
      return NextResponse.json({ message: 'Compétence non trouvée.' }, { status: 404 });
    }

    // Si le nom est fourni, vérifier qu'il n'existe pas déjà sur une autre compétence
    if (validation.data.name && validation.data.name !== existingSkill.name) {
      const duplicateName = await prisma.skill.findFirst({
        where: {
          name: { equals: validation.data.name, mode: 'insensitive' },
          id: { not: skillId },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          {
            message: 'Une autre compétence avec ce nom existe déjà.',
          },
          { status: 409 }
        );
      }
    }

    const updatedSkill = await prisma.skill.update({
      where: { id: skillId },
      data: validation.data,
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la mise à jour de la compétence.');
  }
}

// DELETE /api/skills/[skillId] - Supprime une compétence (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ message: 'Accès non autorisé.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { skillId } = skillIdSchema.parse(resolvedParams);

    // Vérifier que la compétence existe
    const existingSkill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!existingSkill) {
      return NextResponse.json({ message: 'Compétence non trouvée.' }, { status: 404 });
    }

    // Avant de supprimer la compétence, supprimer toutes les associations UserSkill
    await prisma.userSkill.deleteMany({
      where: { skillId },
    });

    // Supprimer la compétence
    await prisma.skill.delete({
      where: { id: skillId },
    });

    return NextResponse.json({ message: 'Compétence supprimée avec succès.' });
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la suppression de la compétence.');
  }
}
