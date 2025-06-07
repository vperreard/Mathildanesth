import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getAuthTokenServer, checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole as AuthUserRole } from '@/lib/auth-client-utils';

// Définir les rôles autorisés pour cette route
const ALLOWED_ROLES_GET: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER']; // Large pour l'instant
const ALLOWED_ROLES_POST: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL']; // Plus restrictif pour la création

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification comme dans l'API utilisateurs
    const authCheck = await checkUserRole(ALLOWED_ROLES_GET);

    if (!authCheck.hasRequiredRole) {
      logger.info("Vérification d'autorisation échouée:", authCheck.error);
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const sectors = await prisma.operatingSector.findMany({
      where: siteId ? { siteId } : undefined,
      include: {
        site: true,
        rooms: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Log détaillé pour le débogage
    logger.info(`GET /api/operating-sectors: Récupération de ${sectors.length} secteurs`);
    if (sectors.length > 0) {
      logger.info('Premier secteur récupéré:', {
        id: sectors[0].id,
        name: sectors[0].name,
        displayOrder: sectors[0].displayOrder,
        siteId: sectors[0].siteId,
      });
    }

    return NextResponse.json(sectors);
  } catch (error: unknown) {
    logger.error('Erreur lors de la récupération des secteurs opératoires:', { error: error });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des secteurs opératoires' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification comme dans l'API utilisateurs
    const authCheck = await checkUserRole(ALLOWED_ROLES_POST);

    if (!authCheck.hasRequiredRole) {
      logger.info("Vérification d'autorisation échouée:", authCheck.error);
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { name, siteId, description, colorCode, isActive, displayOrder, category, rules } = data;

    if (!name || !siteId) {
      return NextResponse.json({ error: 'Nom et site requis' }, { status: 400 });
    }

    const newSector = await prisma.operatingSector.create({
      data: {
        name,
        siteId,
        description,
        colorCode,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder,
        category,
        rules: rules || {},
        // createdBy: authCheck.user?.id, // Si vous souhaitez tracer qui a créé le secteur
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(newSector, { status: 201 });
  } catch (error: unknown) {
    logger.error('Erreur lors de la création du secteur:', { error: error });
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du secteur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
