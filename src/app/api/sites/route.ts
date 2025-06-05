import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, Prisma } from '@prisma/client';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';

import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER'];

// GET /api/sites - Lister tous les sites
export async function GET(request: NextRequest) {
  logger.info('\\n--- GET /api/sites START ---');
  try {
    // Vérifier l'authentification comme dans l'API utilisateurs
    const authCheck = await checkUserRole(ALLOWED_ROLES);

    if (!authCheck.hasRequiredRole) {
      logger.info("Vérification d'autorisation échouée:", authCheck.error);
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }
    // Pour l'instant, on autorise tous les utilisateurs connectés à voir les sites
    logger.info(
      `GET /api/sites: Auth check passed! User ID: ${authCheck.user?.id}, Role: ${authCheck.user?.role}`
    );
    logger.info('GET /api/sites: Retrieving all sites from DB...');
    const sites = await prisma.site.findMany({
      orderBy: [
        { displayOrder: { sort: 'asc', nulls: 'last' } }, // Gérer les nulls explicitement
        { name: 'asc' }, // Tri secondaire par nom pour la cohérence
      ],
      // Ajouter la sélection de champs si nécessaire, sinon tous les champs sont renvoyés
      // select: { id: true, name: true, description: true, isActive: true, displayOrder: true }
    });

    logger.info(`GET /api/sites: ${sites.length} sites retrieved successfully.`);
    logger.info('--- GET /api/sites END ---\\n');
    return NextResponse.json(sites);
  } catch (error: unknown) {
    logger.error('Error during GET /api/sites:', error instanceof Error ? error : new Error(String(error)));
    logger.info('--- GET /api/sites END (with error) ---\\n');
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sites' },
      { status: 500 }
    );
  }
}

// POST /api/sites - Créer un nouveau site
export async function POST(request: NextRequest) {
  logger.info('\\n--- POST /api/sites START ---');
  try {
    const requestHeaders = await headers();
    const auth = checkAuth(requestHeaders);

    if (!auth) {
      logger.error('POST /api/sites: Unauthorized (Middleware headers missing)');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
      logger.error(`POST /api/sites: Forbidden (Role '${auth.userRole}' not allowed)`);
      return NextResponse.json({ error: 'Accès interdit pour créer un site' }, { status: 403 });
    }
    logger.info(
      `POST /api/sites: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`
    );

    const data = await request.json();
    logger.info('POST /api/sites - Received data:', data);

    if (!data || typeof data.name !== 'string' || !data.name.trim()) {
      logger.warn('POST /api/sites: Validation failed - Name is required.');
      return NextResponse.json({ error: 'Le nom du site est requis' }, { status: 400 });
    }

    // Calculer le prochain displayOrder
    const lastSite = await prisma.site.findFirst({
      orderBy: { displayOrder: 'desc' },
    });
    const nextDisplayOrder = (lastSite?.displayOrder ?? -1) + 1;
    logger.info(`POST /api/sites - Calculated next displayOrder: ${nextDisplayOrder}`);

    logger.info('POST /api/sites: Creating new site in DB...');

    const createData: Prisma.SiteCreateInput = {
      name: data.name.trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      displayOrder: nextDisplayOrder,
    };

    if (data.description !== undefined) {
      // Utiliser 'as any' pour contourner le linter si le type Prisma est trop strict
      (createData as any).description = data.description;
    }

    if (data.colorCode !== undefined) {
      // Ajouter la couleur si elle est fournie
      (createData as any).colorCode = data.colorCode;
    }

    const newSite = await prisma.site.create({
      data: createData,
    });

    logger.info('POST /api/sites: Site created successfully:', newSite);
    logger.info('--- POST /api/sites END ---\\n');
    return NextResponse.json(newSite, { status: 201 }); // 201 Created status
  } catch (error: unknown) {
    logger.error('Error during POST /api/sites:', error instanceof Error ? error : new Error(String(error)));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target && target.includes('name')) {
        logger.error("Prisma Error P2002: Unique constraint violation on field 'name'.");
        return NextResponse.json({ error: 'Un site avec ce nom existe déjà.' }, { status: 409 }); // 409 Conflict
      }
      logger.error('Prisma Error P2002: Unique constraint violation on fields:', target);
      return NextResponse.json(
        { error: 'Erreur de base de données: Contrainte unique violée.' },
        { status: 409 }
      );
    }
    logger.info('--- POST /api/sites END (with error) ---\\n');
    return NextResponse.json({ error: 'Erreur lors de la création du site' }, { status: 500 });
  }
}
