import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';

const ALLOWED_ROLES: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER'];

// GET : Récupérer une salle spécifique
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = parseInt(id);

  if (isNaN(roomId)) {
    return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
  }

  try {
    // Utiliser Prisma directement pour récupérer la salle
    const room = await prisma.operatingRoom.findUnique({
      where: { id: roomId },
      include: {
        operatingSector: true,
        site: true,
      },
    });

    if (!room) {
      return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error: unknown) {
    logger.error(`Erreur GET /api/operating-rooms/${id}:`, error instanceof Error ? error : new Error(String(error)));
    return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), {
      status: 500,
    });
  }
}

// PUT : Mettre à jour une salle
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Récupérer l'ID
    const { id } = await params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'ID de salle invalide' }, { status: 400 });
    }

    // Vérifier si la salle existe
    const existingRoom = await prisma.operatingRoom.findUnique({
      where: { id: roomId },
      include: { operatingSector: true },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
    }

    // Récupérer le corps de la requête
    const body = await request.json();
    logger.info(`PUT /api/operating-rooms/${id} - Body reçu:`, body);

    // Extraire les données validées (compatible avec SallesAdmin)
    const { name, number, operatingSectorId, isActive } = body;

    if (!name || !operatingSectorId) {
      return NextResponse.json({ error: 'Nom et secteur requis' }, { status: 400 });
    }

    // Vérifier si le numéro est déjà utilisé par une autre salle
    if (number !== existingRoom.number) {
      const roomWithSameNumber = await prisma.operatingRoom.findFirst({
        where: {
          number: number.trim(),
          NOT: {
            id: roomId,
          },
        },
      });

      if (roomWithSameNumber) {
        return NextResponse.json(
          { error: 'Une autre salle avec ce numéro existe déjà.' },
          { status: 409 }
        );
      }
    }

    // Vérifier que le secteur existe
    const sectorEntity = await prisma.operatingSector.findUnique({
      where: { id: operatingSectorId },
    });

    if (!sectorEntity) {
      logger.error(`Secteur non trouvé: ID=${operatingSectorId}`);
      return NextResponse.json(
        { error: 'Secteur introuvable. Veuillez sélectionner un secteur valide.' },
        { status: 400 }
      );
    }

    // Mettre à jour la salle
    const updatedRoom = await prisma.operatingRoom.update({
      where: { id: roomId },
      data: {
        name: name.trim(),
        number: number.trim(),
        operatingSectorId: sectorEntity.id,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { operatingSector: true },
    });

    logger.info(`Salle ${roomId} mise à jour avec succès:`, updatedRoom);
    return NextResponse.json(updatedRoom);
  } catch (error: unknown) {
    const { id } = await params;
    logger.error(`Erreur PUT /api/operating-rooms/${id}:`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// DELETE : Supprimer une salle
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
      const room = await prisma.operatingRoom.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
      }

      // 🔐 CORRECTION TODO CRITIQUE : Vérifier si la salle est utilisée dans des plannings existants
      const connectedPlannings = await prisma.blocRoomAssignment.findMany({
        where: { operatingRoomId: roomId },
        include: { blocDayPlanning: { select: { date: true, siteId: true } } },
        take: 5,
      });

      if (connectedPlannings.length > 0) {
        const planningDates = connectedPlannings
          .map(p => p.blocDayPlanning.date.toISOString().split('T')[0])
          .join(', ');
        return new NextResponse(
          JSON.stringify({
            message:
              'Impossible de supprimer cette salle car elle est utilisée dans des plannings existants.',
            details: `Plannings concernés: ${planningDates}${connectedPlannings.length === 5 ? " (et d'autres...)" : ''}`,
            connectedPlanningsCount: connectedPlannings.length,
          }),
          { status: 409 }
        );
      }

      // Supprimer la salle
      await prisma.operatingRoom.delete({
        where: { id: roomId },
      });

      return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
      logger.error(`Erreur DELETE /api/operating-rooms/${id}:`, error instanceof Error ? error : new Error(String(error)));
      return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), {
        status: 500,
      });
    }
  } catch (error: unknown) {
    const { id } = await params;
    logger.error(`Erreur DELETE /api/operating-rooms/${id}:`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
