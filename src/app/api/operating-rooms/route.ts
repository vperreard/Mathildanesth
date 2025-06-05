import { NextResponse, NextRequest } from 'next/server';
import { logger } from "@/lib/logger";
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';

import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER'];

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const sectorId = searchParams.get('sectorId');

    const whereClause: Prisma.OperatingRoomWhereInput = {};

    if (sectorId) {
      const sectorIdNum = parseInt(sectorId);
      if (!isNaN(sectorIdNum)) {
        whereClause.operatingSectorId = sectorIdNum;
      }
    } else if (siteId) {
      whereClause.siteId = siteId;
    }

    const rooms = await prisma.operatingRoom.findMany({
      where: whereClause,
      include: {
        operatingSector: {
          include: {
            site: true,
          },
        },
        site: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    logger.info(`GET /api/operating-rooms: Récupération de ${rooms.length} salles`);
    if (rooms.length > 0) {
      logger.info('Première salle récupérée:', {
        id: rooms[0].id,
        name: rooms[0].name,
        displayOrder: rooms[0].displayOrder,
        operatingSectorId: rooms[0].operatingSectorId,
        sectorDisplayOrder: rooms[0].operatingSector?.displayOrder,
      });
    }

    return NextResponse.json(rooms);
  } catch (error: unknown) {
    logger.error("Erreur lors de la récupération des salles d'opération:", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Erreur lors de la récupération des salles d'opération" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();
    const { name, number, operatingSectorId } = data;

    if (!name || !operatingSectorId) {
      return NextResponse.json({ error: 'Nom et secteur requis' }, { status: 400 });
    }

    // Récupérer le secteur pour vérifier qu'il existe et obtenir le siteId
    const sector = await prisma.operatingSector.findUnique({
      where: { id: operatingSectorId },
    });

    if (!sector) {
      return NextResponse.json({ error: 'Secteur opératoire non trouvé' }, { status: 404 });
    }

    if (!sector.siteId) {
      return NextResponse.json({ error: 'Le secteur doit être associé à un site' }, { status: 400 });
    }

    // Utiliser le siteId du secteur
    const siteId = sector.siteId;

    // Préparer les données pour la création
    const createData: any = {
      name,
      number: number || name, // Utiliser le nom comme numéro si non fourni
      siteId,
      operatingSectorId: operatingSectorId || undefined,
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      colorCode: data.colorCode || undefined,
    };

    // Ajouter supervisionRules seulement si fourni
    if (data.supervisionRules) {
      createData.supervisionRules = data.supervisionRules as Prisma.InputJsonValue;
    }

    // Créer la salle
    const newRoom = await prisma.operatingRoom.create({
      data: createData,
      include: {
        site: true,
        operatingSector: true,
      },
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error: unknown) {
    logger.error("Erreur lors de la création de la salle d'opération:", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: "Erreur lors de la création de la salle d'opération",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
