import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole as AuthUserRole } from '@/lib/auth-client-utils';

interface SectorOrder {
  id: number;
  displayOrder: number;
}

// Définir les rôles autorisés
const ALLOWED_ROLES: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCheck = await checkUserRole(ALLOWED_ROLES);

    if (!authCheck.hasRequiredRole) {
      logger.info("Vérification d'autorisation échouée:", authCheck.error);
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupérer les données
    const body = await request.json();
    const { sectorOrders } = body;

    if (!sectorOrders || !Array.isArray(sectorOrders)) {
      return NextResponse.json(
        { error: 'Les données sectorOrders sont invalides' },
        { status: 400 }
      );
    }

    logger.info("Mise à jour de l'ordre des secteurs opératoires:", sectorOrders);

    // Traiter chaque secteur
    const updatePromises = sectorOrders.map((sector: SectorOrder) => {
      return prisma.operatingSector.update({
        where: { id: sector.id },
        data: { displayOrder: sector.displayOrder },
      });
    });

    const results = await Promise.all(updatePromises);
    logger.info(`${results.length} secteurs opératoires mis à jour`);

    return NextResponse.json({
      success: true,
      message: `${results.length} secteurs mis à jour`,
    });
  } catch (error: unknown) {
    logger.error("Erreur lors de la mise à jour de l'ordre des secteurs opératoires:", {
      error: error,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'ordre des secteurs" },
      { status: 500 }
    );
  }
}
