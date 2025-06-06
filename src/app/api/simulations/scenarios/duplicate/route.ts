import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour la duplication d'un scénario
const duplicateScenarioSchema = z.object({
  sourceScenarioId: z.string().min(1, { message: 'ID du scénario source requis' }),
  name: z.string().min(1, { message: 'Nom du nouveau scénario requis' }),
  description: z.string().optional(),
  modifyDates: z.boolean().optional().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await req.json();
    const validationResult = duplicateScenarioSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { sourceScenarioId, name, description, modifyDates, startDate, endDate } =
      validationResult.data;

    // Vérifier si le scénario source existe
    const sourceScenario = await prisma.simulationScenario.findUnique({
      where: { id: sourceScenarioId },
    });

    if (!sourceScenario) {
      return NextResponse.json({ error: 'Scénario source non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur est le créateur du scénario source
    if (sourceScenario.createdById !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce scénario source" },
        { status: 403 }
      );
    }

    // Préparer les données pour le nouveau scénario
    // Convertir parametersJson si c'est une chaîne
    let parametersJson: Record<string, unknown>;

    if (typeof sourceScenario.parametersJson === 'string') {
      try {
        parametersJson = JSON.parse(sourceScenario.parametersJson);
      } catch (e: unknown) {
        parametersJson = {}; // Fallback si la conversion échoue
      }
    } else {
      // Si parametersJson est déjà un objet
      parametersJson = sourceScenario.parametersJson as Record<string, unknown>;
    }

    // Si l'utilisateur veut modifier les dates et a fourni de nouvelles dates
    if (modifyDates && startDate && endDate) {
      // Mettre à jour les dates dans parametersJson
      parametersJson.startDate = startDate;
      parametersJson.endDate = endDate;
    }

    // Créer un nouveau scénario basé sur le scénario source
    const newScenario = await prisma.simulationScenario.create({
      data: {
        name,
        description: description || sourceScenario.description,
        templateId: sourceScenario.templateId,
        parametersJson,
        createdById: Number(session.user.id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newScenario,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('Erreur lors de la duplication du scénario de simulation:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la duplication du scénario',
      },
      { status: 500 }
    );
  }
}
