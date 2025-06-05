import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  requireSimulationPermission,
  AuthorizationError,
  AuthenticationError,
} from '@/lib/auth/authorization';
import { AuditService } from '@/services/AuditService';

// Schéma de validation pour la mise à jour d'un scénario
const updateScenarioSchema = z.object({
  name: z.string().min(1, { message: 'Le nom ne peut pas être vide.' }).optional(),
  description: z.string().optional().nullable(), // Permet de vider la description
  parametersJson: z.record(z.unknown()).optional(),
});

// GET /api/simulations/{scenarioId} - Récupérer un scénario spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await Promise.resolve(params);
    if (!scenarioId) {
      return NextResponse.json({ error: 'ID du scénario manquant.' }, { status: 400 });
    }

    // 🔐 Vérification des permissions de lecture de simulation
    const session = await requireSimulationPermission('read');

    // Logger l'action
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'READ_SIMULATION' as any,
      userId: session.user.id.toString(),
      entityId: scenarioId,
      entityType: 'simulation_scenario',
    });

    const scenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
      include: {
        createdBy: { select: { id: true, nom: true, prenom: true } },
        results: {
          orderBy: { createdAt: 'desc' }, // Lister les résultats du plus récent au plus ancien
          select: { id: true, createdAt: true, status: true, errorMessage: true }, // Ne pas charger toutes les données JSON ici
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scénario non trouvé.' }, { status: 404 });
    }

    // Vérifier si l'utilisateur peut accéder à ce scénario spécifique
    if (
      !scenario.createdBy ||
      (scenario.createdBy.id !== session.user.id &&
        !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role))
    ) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à accéder à ce scénario." },
        { status: 403 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    logger.error(`Erreur lors de la récupération du scénario ${params.scenarioId}:`, error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json(
      { error: 'Impossible de récupérer le scénario.', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/simulations/{scenarioId} - Mettre à jour un scénario spécifique
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params;
    if (!scenarioId) {
      return NextResponse.json({ error: 'ID du scénario manquant.' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateScenarioSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Vérifier si le scénario existe avant de tenter la mise à jour
    const existingScenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true, createdBy: { select: { id: true } } },
    });
    if (!existingScenario) {
      return NextResponse.json(
        { error: 'Scénario non trouvé pour la mise à jour.' },
        { status: 404 }
      );
    }

    // 🔐 Vérification des permissions de l'utilisateur
    if (!existingScenario.createdBy) {
      return NextResponse.json({ error: 'Scénario invalide.' }, { status: 400 });
    }
    const session = await requireSimulationPermission('update', existingScenario.createdBy.id);

    // Logger l'action
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'UPDATE_SIMULATION' as any,
      userId: session.user.id.toString(),
      entityId: scenarioId,
      entityType: 'simulation_scenario',
      details: { ownerId: existingScenario.createdBy.id },
    });

    const updatedScenario = await prisma.simulationScenario.update({
      where: { id: scenarioId },
      data: validationResult.data,
    });

    return NextResponse.json(updatedScenario);
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    logger.error(`Erreur lors de la mise à jour du scénario ${params.scenarioId}:`, error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json(
      { error: 'Impossible de mettre à jour le scénario.', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/simulations/{scenarioId} - Supprimer un scénario spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params;
    if (!scenarioId) {
      return NextResponse.json({ error: 'ID du scénario manquant.' }, { status: 400 });
    }

    // Vérifier si le scénario existe avant de tenter la suppression
    const existingScenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true, createdBy: { select: { id: true } } },
    });
    if (!existingScenario) {
      return NextResponse.json(
        { error: 'Scénario non trouvé pour la suppression.' },
        { status: 404 }
      );
    }

    // 🔐 Vérification des permissions de l'utilisateur
    if (!existingScenario.createdBy) {
      return NextResponse.json({ error: 'Scénario invalide.' }, { status: 400 });
    }
    const session = await requireSimulationPermission('delete', existingScenario.createdBy.id);

    // Logger l'action
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'DELETE_SIMULATION' as any,
      userId: session.user.id.toString(),
      entityId: scenarioId,
      entityType: 'simulation_scenario',
      details: { ownerId: existingScenario.createdBy.id },
    });

    // La suppression en cascade des SimulationResult est gérée par Prisma grâce à onDelete: Cascade
    await prisma.simulationScenario.delete({
      where: { id: scenarioId },
    });

    return NextResponse.json({ message: 'Scénario supprimé avec succès.' }, { status: 200 }); // ou 204 No Content
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer le scénario car il est référencé par des résultats de simulation. Supprimez d'abord les résultats associés.",
          details: error.message,
        },
        { status: 409 }
      );
    }
    logger.error(`Erreur lors de la suppression du scénario ${params.scenarioId}:`, error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json(
      { error: 'Impossible de supprimer le scénario.', details: errorMessage },
      { status: 500 }
    );
  }
}
