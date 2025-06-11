import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ActivityCategory } from '@prisma/client'; // Rétablir l'import direct, Prisma generate a été lancé

// Schéma de validation pour la création d'un ActivityType
const activityTypeCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  description: z.string().optional(),
  category: z.nativeEnum(ActivityCategory).default(ActivityCategory.AUTRE),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  siteIds: z
    .array(z.string().uuid("L'ID du site doit être un UUID valide."))
    .optional()
    .default([]),
});

// GET /api/admin/activity-types - Lister tous les types d'activités
export async function GET() {
  try {
    const activityTypes = await prisma.activityType.findMany({
      include: {
        site: {
          select: { id: true, name: true }, // Inclure seulement l'ID et le nom du site lié
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(activityTypes);
  } catch (error: unknown) {
    logger.error('[API GET /admin/activity-types]', { error: error });
    return NextResponse.json(
      { message: "Erreur lors de la récupération des types d'activités." },
      { status: 500 }
    );
  }
}

// POST /api/admin/activity-types - Créer un nouveau type d'activité
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = activityTypeCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Données invalides.', errors: validation.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, category, color, icon, isActive, siteIds } = validation.data;

    // Vérifier si un type d'activité avec le même nom existe déjà
    const existingActivityType = await prisma.activityType.findUnique({
      where: { name },
    });

    if (existingActivityType) {
      return NextResponse.json(
        { message: `Un type d'activité avec le nom "${name}" existe déjà.` },
        { status: 409 }
      ); // 409 Conflict
    }

    const newActivityType = await prisma.activityType.create({
      data: {
        name,
        description,
        category,
        color,
        icon,
        isActive,
        site: siteIds.length > 0 ? { connect: { id: siteIds[0] } } : undefined,
      },
      include: {
        site: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newActivityType, { status: 201 });
  } catch (error: unknown) {
    logger.error('[API POST /admin/activity-types]', { error: error });
    // Gestion spécifique des erreurs Prisma (ex: contrainte unique violée non interceptée plus haut)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { message: `Un type d'activité avec ce nom existe déjà.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Erreur lors de la création du type d'activité." },
      { status: 500 }
    );
  }
}
