import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth/authorization';

// Rôles autorisés
const ALLOWED_ROLES_GET = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'MAR', 'IADE'];
const ALLOWED_ROLES_WRITE = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

interface Context {
  params: {
    id: string;
  };
}

// GET : Récupérer un secteur spécifique
export async function GET(request: NextRequest, context: Context) {
  try {
    const authCheck = await checkUserRole(ALLOWED_ROLES_GET);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    const sector = await prisma.operatingSector.findUnique({
      where: { id: sectorId },
      include: {
        site: true,
        operatingRooms: true,
      },
    });

    if (!sector) {
      return NextResponse.json({ message: 'Secteur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(sector);
  } catch (error) {
    console.error(`Erreur GET /api/operating-sectors/${context.params.id}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PUT : Mettre à jour un secteur spécifique
export async function PUT(request: NextRequest, context: Context) {
  try {
    const authCheck = await checkUserRole(ALLOWED_ROLES_WRITE);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Droits insuffisants' },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { name, colorCode, isActive, description, rules, siteId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Le nom du secteur est requis' }, { status: 400 });
    }

    // Vérifier si le secteur existe
    const existingSector = await prisma.operatingSector.findUnique({
      where: { id: sectorId },
    });

    if (!existingSector) {
      return NextResponse.json({ message: 'Secteur non trouvé' }, { status: 404 });
    }

    // Vérifier l'unicité du nom
    if (name.trim() !== existingSector.name) {
      const duplicateSector = await prisma.operatingSector.findFirst({
        where: {
          name: name.trim(),
          id: { not: sectorId },
        },
      });

      if (duplicateSector) {
        return NextResponse.json(
          { message: 'Un autre secteur avec ce nom existe déjà.' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le secteur
    const updatedSector = await prisma.operatingSector.update({
      where: { id: sectorId },
      data: {
        name: name.trim(),
        colorCode: colorCode || '#000000',
        isActive: isActive === undefined ? true : isActive,
        description: description || '',
        rules: rules || {},
        siteId: siteId || existingSector.siteId,
      },
      include: {
        site: true,
        operatingRooms: true,
      },
    });

    return NextResponse.json(updatedSector);
  } catch (error) {
    console.error(`Erreur PUT /api/operating-sectors/${context.params.id}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// DELETE : Supprimer un secteur spécifique
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const authCheck = await checkUserRole(['ADMIN_TOTAL']);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Seul un administrateur total peut supprimer un secteur' },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    // Vérifier si le secteur existe
    const existingSector = await prisma.operatingSector.findUnique({
      where: { id: sectorId },
    });

    if (!existingSector) {
      return NextResponse.json({ message: 'Secteur non trouvé' }, { status: 404 });
    }

    // Vérifier s'il y a des salles connectées
    const connectedRooms = await prisma.operatingRoom.findMany({
      where: { sectorId: sectorId },
      select: { id: true, name: true },
    });

    if (connectedRooms.length > 0) {
      const roomNames = connectedRooms
        .slice(0, 10)
        .map(room => room.name)
        .join(', ');

      return NextResponse.json(
        {
          message:
            'Impossible de supprimer ce secteur car il est utilisé par des salles existantes.',
          details: `Salles connectées: ${roomNames}${connectedRooms.length > 10 ? " (et d'autres...)" : ''}`,
          connectedRoomsCount: connectedRooms.length,
        },
        { status: 409 }
      );
    }

    // Supprimer le secteur
    await prisma.operatingSector.delete({
      where: { id: sectorId },
    });

    return NextResponse.json({ message: 'Secteur supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/operating-sectors/${context.params.id}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
