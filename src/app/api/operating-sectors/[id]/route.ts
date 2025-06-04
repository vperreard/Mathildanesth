import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';

// Rôles autorisés
const ALLOWED_ROLES_GET: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER'];
const ALLOWED_ROLES_WRITE: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

// GET : Récupérer un secteur spécifique
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkUserRole(ALLOWED_ROLES_GET);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    const sector = await prisma.operatingSector.findUnique({
      where: { id: sectorId },
      include: {
        site: true,
        rooms: true,
      },
    });

    if (!sector) {
      return NextResponse.json({ message: 'Secteur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(sector);
  } catch (error) {
    console.error('Erreur GET /api/operating-sectors/[id]:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PUT : Mettre à jour un secteur spécifique
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkUserRole(ALLOWED_ROLES_WRITE);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Droits insuffisants' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { name, colorCode, isActive, description, rules, siteId, displayOrder } = body;

    // Le nom n'est requis que si on n'est pas en train de juste déplacer le secteur
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { message: 'Le nom du secteur ne peut pas être vide' },
        { status: 400 }
      );
    }

    // Vérifier si le secteur existe
    const existingSector = await prisma.operatingSector.findUnique({
      where: { id: sectorId },
    });

    if (!existingSector) {
      return NextResponse.json({ message: 'Secteur non trouvé' }, { status: 404 });
    }

    // Vérifier l'unicité du nom seulement si le nom est fourni et différent
    if (name !== undefined && name.trim() !== existingSector.name) {
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

    // Préparer les données de mise à jour (seulement les champs fournis)
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (colorCode !== undefined) updateData.colorCode = colorCode;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description;
    if (rules !== undefined) updateData.rules = rules;
    if (siteId !== undefined) updateData.siteId = siteId;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Mettre à jour le secteur
    const updatedSector = await prisma.operatingSector.update({
      where: { id: sectorId },
      data: updateData,
      include: {
        site: true,
        rooms: true,
      },
    });

    return NextResponse.json(updatedSector);
  } catch (error) {
    console.error('Erreur PUT /api/operating-sectors/[id]:', error);
    return NextResponse.json(
      {
        message: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE : Supprimer un secteur spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkUserRole(['ADMIN_TOTAL']);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Seul un administrateur total peut supprimer un secteur' },
        { status: 401 }
      );
    }

    const { id } = await params;
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
    console.error('Erreur DELETE /api/operating-sectors/[id]:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
