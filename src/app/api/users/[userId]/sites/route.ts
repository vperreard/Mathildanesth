import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';

// GET /api/utilisateurs/[userId]/sites - Récupérer les sites d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const userWithSites = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          select: {
            id: true,
            name: true,
            description: true,
            colorCode: true,
            isActive: true,
          },
        },
      },
    });

    if (!userWithSites) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      userId: userWithSites.id,
      userInfo: {
        nom: userWithSites.nom,
        prenom: userWithSites.prenom,
        email: userWithSites.email,
      },
      sites: userWithSites.sites,
      meta: {
        totalSites: userWithSites.sites.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('[USER_SITES_GET_ERROR]:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des sites' },
      { status: 500 }
    );
  }
}

// PUT /api/utilisateurs/[userId]/sites - Mettre à jour les sites d'un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { siteIds } = body;

    if (!Array.isArray(siteIds)) {
      return NextResponse.json({ error: 'siteIds doit être un tableau' }, { status: 400 });
    }

    // Vérifier que tous les sites existent
    const existingSites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
        isActive: true,
      },
    });

    if (existingSites.length !== siteIds.length) {
      return NextResponse.json(
        {
          error: "Un ou plusieurs sites spécifiés n'existent pas ou sont inactifs",
        },
        { status: 400 }
      );
    }

    // Mettre à jour les associations
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        sites: {
          set: siteIds.map((siteId: string) => ({ id: siteId })),
        },
      },
      include: {
        sites: {
          select: {
            id: true,
            name: true,
            description: true,
            colorCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Sites mis à jour avec succès',
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        sites: updatedUser.sites,
      },
      meta: {
        totalSites: updatedUser.sites.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('[USER_SITES_PUT_ERROR]:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour des sites' },
      { status: 500 }
    );
  }
}

// POST /api/utilisateurs/[userId]/sites - Ajouter des sites à un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { siteIds } = body;

    if (!Array.isArray(siteIds)) {
      return NextResponse.json({ error: 'siteIds doit être un tableau' }, { status: 400 });
    }

    // Ajouter les sites (sans supprimer les existants)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        sites: {
          connect: siteIds.map((siteId: string) => ({ id: siteId })),
        },
      },
      include: {
        sites: true,
      },
    });

    return NextResponse.json({
      message: 'Sites ajoutés avec succès',
      user: {
        id: updatedUser.id,
        sites: updatedUser.sites,
      },
    });
  } catch (error: unknown) {
    logger.error('[USER_SITES_POST_ERROR]:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Erreur serveur lors de l'ajout des sites" },
      { status: 500 }
    );
  }
}
