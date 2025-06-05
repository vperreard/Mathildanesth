import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { LeaveType } from '@prisma/client';

/**
 * Récupération des règles de transfert pour un type de congé source spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceType: string }> }
) {
  try {
    const { sourceType } = await params;

    if (!sourceType || !Object.values(LeaveType).includes(sourceType as LeaveType)) {
      return NextResponse.json({ error: 'Type de congé source invalide' }, { status: 400 });
    }

    // Récupérer les règles pour le type source spécifié
    const rules = await prisma.quotaTransferRule.findMany({
      where: {
        fromType: sourceType as LeaveType,
        isActive: true,
      },
    });

    // Formater les règles pour le frontend
    const formattedRules = rules.map(rule => ({
      fromType: rule.fromType,
      toType: rule.toType,
      conversionRate: rule.conversionRate,
      maxTransferDays: rule.maxTransferDays,
      maxTransferPercentage: rule.maxTransferPercentage,
      requiresApproval: rule.requiresApproval,
      authorizedRoles: rule.authorizedRoles,
      isEnabled: rule.isActive,
    }));

    return NextResponse.json(formattedRules);
  } catch (error: unknown) {
    logger.error(
      'Erreur lors de la récupération des règles de transfert pour le type source:',
      error
    );
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des règles de transfert' },
      { status: 500 }
    );
  }
}
