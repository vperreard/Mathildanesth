import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/rules/[id]/toggle-status
 * Active ou désactive une règle
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ruleId } = await params;
    const data = await request.json();

    // Vérifier si le statut est fourni
    if (data.isActive === undefined) {
      return NextResponse.json({ error: 'Le statut (isActive) doit être fourni' }, { status: 400 });
    }

    // Vérifier si la règle existe
    const existingRule = await prisma.rule.findUnique({
      where: {
        id: ruleId,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
    }

    // Mise à jour du statut
    const updatedRule = await prisma.rule.update({
      where: {
        id: ruleId,
      },
      data: {
        isActive: data.isActive,
        updatedBy: data.updatedBy || existingRule.updatedBy,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Sérialisation des dates pour la réponse JSON
    const serializedRule = {
      ...updatedRule,
      validFrom: updatedRule.validFrom.toISOString(),
      validTo: updatedRule.validTo ? updatedRule.validTo.toISOString() : null,
      createdAt: updatedRule.createdAt.toISOString(),
      updatedAt: updatedRule.updatedAt.toISOString(),
    };

    return NextResponse.json(serializedRule);
  } catch (error) {
    console.error(`Erreur lors du changement de statut de la règle ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du changement de statut de la règle' },
      { status: 500 }
    );
  }
}
