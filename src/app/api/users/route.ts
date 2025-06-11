import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createPaginator, createPaginationResponse } from '@/lib/pagination';
import { User } from '@prisma/client';
import { withUserRateLimit, withSensitiveRateLimit } from '@/lib/rateLimit';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import bcrypt from 'bcryptjs';

// Créer un paginateur optimisé pour les utilisateurs avec cache de 10 minutes
const userPaginator = createPaginator<User>(prisma, 'user', 10 * 60 * 1000);

// Champs à inclure dans les requêtes utilisateurs
const userInclude = {
  // Ajoutez ici les relations nécessaires selon vos besoins
  // attributions: {
  //   select: { id: true, startDate: true, endDate: true }
  // }
};

async function getHandler(request: NextRequest) {
  const startTime = performance.now();

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extraire les paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'nom';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const search = searchParams.get('search') || undefined;

    // Extraire les filtres spécifiques
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const siteId = searchParams.get('siteId');

    // Construire les filtres
    const filters: Record<string, unknown> = {};

    if (role) {
      filters.role = role;
    }

    if (isActive !== null) {
      filters.actif = isActive === 'true';
    }

    if (siteId) {
      filters.siteId = parseInt(siteId);
    }

    // Champs de recherche pour les utilisateurs
    const searchFields = ['nom', 'prenom', 'email', 'login'];

    // Options de pagination
    const paginationOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      search,
      searchFields,
    };

    // Exécuter la pagination optimisée
    const result = await userPaginator.paginate(paginationOptions, userInclude);

    // Log des requêtes lentes
    const executionTime = performance.now() - startTime;
    if (executionTime > 1000) {
      logger.warn(`⚠️ Requête utilisateurs lente: ${executionTime.toFixed(2)}ms`, {
        params: paginationOptions,
        cacheHit: result.performance.cacheHit,
      });
    }

    // Créer la réponse avec liens de pagination
    const response = createPaginationResponse(
      result,
      '/api/users',
      Object.fromEntries(searchParams.entries())
    );

    return NextResponse.json({
      success: true,
      ...response,
      meta: {
        executionTime: executionTime.toFixed(2),
        cacheHit: result.performance.cacheHit,
        totalQueries: result.performance.totalQueries,
      },
    });
  } catch (error: unknown) {
    logger.error('[API Users] Erreur lors de la récupération des utilisateurs:', { error: error });

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

// Endpoint HEAD pour comptage rapide avec cache
async function headHandler(request: NextRequest) {
  const startTime = performance.now();

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extraire les filtres
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const siteId = searchParams.get('siteId');

    // Construire les filtres
    const filters: Record<string, unknown> = {};

    if (role) {
      filters.role = role;
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    if (siteId) {
      filters.siteId = parseInt(siteId);
    }

    // Compter avec cache
    const countResult = await userPaginator.count(filters);
    const executionTime = performance.now() - startTime;

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': countResult.count.toString(),
        'X-Execution-Time': executionTime.toFixed(2),
        'X-Cache-Hit': countResult.performance.cacheHit.toString(),
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error: unknown) {
    logger.error('[API Users HEAD] Erreur:', { error: error });
    return new NextResponse(null, { status: 500 });
  }
}

// Endpoint OPTIONS pour suggestions de recherche ultra-rapides
async function optionsHandler(request: NextRequest) {
  const startTime = performance.now();

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const field = url.searchParams.get('field') || 'nom';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        executionTime: (performance.now() - startTime).toFixed(2),
      });
    }

    // Obtenir les suggestions avec cache court
    const suggestions = await userPaginator.searchSuggestions(query, field, limit);
    const executionTime = performance.now() - startTime;

    return NextResponse.json(
      {
        suggestions,
        executionTime: executionTime.toFixed(2),
        query,
        field,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30', // 30 secondes pour les suggestions
        },
      }
    );
  } catch (error: unknown) {
    logger.error('[API Users OPTIONS] Erreur:', { error: error });
    return NextResponse.json(
      {
        suggestions: [],
        error: 'Erreur lors de la récupération des suggestions',
      },
      { status: 500 }
    );
  }
}

// Endpoint POST pour créer un utilisateur
async function postHandler(request: NextRequest) {
  try {
    // Vérifier l'authentification et récupérer l'utilisateur actuel
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let currentUserId: number | undefined;

    if (token) {
      const authResult = await verifyAuthToken(token);
      if (authResult.authenticated) {
        currentUserId = authResult.userId;
      }
    }
    const body = await request.json();

    // Validation basique
    if (!body.nom || !body.prenom || !body.email || !body.login) {
      return NextResponse.json(
        {
          success: false,
          error: 'Champs obligatoires manquants',
        },
        { status: 400 }
      );
    }

    // Vérifier l'unicité de l'email et du login
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { login: body.login }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou login déjà utilisé',
        },
        { status: 409 }
      );
    }

    // Hash du mot de passe si fourni
    let hashedPassword;
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        login: body.login,
        role: body.role || 'USER',
        password: hashedPassword,
        actif: body.actif !== false,
        // Ajoutez d'autres champs selon votre template
      },
      include: userInclude,
    });

    // Log d'audit pour la création
    await auditService.logDataModification(
      AuditAction.USER_CREATED,
      'User',
      newUser.id,
      currentUserId || 0,
      null,
      { ...newUser, password: undefined }, // Exclure le mot de passe
      {
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          role: newUser.role,
          email: newUser.email,
          login: newUser.login,
        },
      }
    );

    // Invalider le cache des utilisateurs
    userPaginator.invalidateCache();

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[API Users POST] Erreur:', { error: error });
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de l'utilisateur",
      },
      { status: 500 }
    );
  }
}

// Endpoint PUT pour mise à jour en lot
async function putHandler(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let currentUserId: number | undefined;

    if (token) {
      const authResult = await verifyAuthToken(token);
      if (authResult.authenticated) {
        currentUserId = authResult.userId;
      }
    }
    const body = await request.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format de données invalide',
        },
        { status: 400 }
      );
    }

    // Récupérer les utilisateurs avant modification pour l'audit
    const usersBeforeUpdate = await prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });

    // Hash du mot de passe si fourni
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Mise à jour en lot
    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: updates,
    });

    // Log d'audit pour chaque utilisateur modifié
    for (const userBefore of usersBeforeUpdate) {
      await auditService.logDataModification(
        AuditAction.USER_UPDATED,
        'User',
        userBefore.id,
        currentUserId || 0,
        { ...userBefore, password: undefined },
        { ...userBefore, ...updates, password: undefined },
        {
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            batchUpdate: true,
            totalUpdated: result.count,
          },
        }
      );
    }

    // Invalider le cache
    userPaginator.invalidateCache();

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error: unknown) {
    logger.error('[API Users PUT] Erreur:', { error: error });
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour',
      },
      { status: 500 }
    );
  }
}

// Endpoint DELETE pour suppression en lot
async function deleteHandler(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let currentUserId: number | undefined;

    if (token) {
      const authResult = await verifyAuthToken(token);
      if (authResult.authenticated) {
        currentUserId = authResult.userId;
      }
    }
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'IDs manquants',
        },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim()));

    // Récupérer les utilisateurs avant suppression pour l'audit
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });

    // Suppression en lot
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Log d'audit pour chaque utilisateur supprimé
    for (const user of usersToDelete) {
      await auditService.logDataModification(
        AuditAction.USER_DELETED,
        'User',
        user.id,
        currentUserId || 0,
        { ...user, password: undefined },
        null,
        {
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            email: user.email,
            login: user.login,
            role: user.role,
            batchDelete: true,
            totalDeleted: result.count,
          },
        }
      );
    }

    // Invalider le cache
    userPaginator.invalidateCache();

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error: unknown) {
    logger.error('[API Users DELETE] Erreur:', { error: error });
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression',
      },
      { status: 500 }
    );
  }
}

// Export des handlers avec rate limiting approprié
export const GET = withUserRateLimit(getHandler);
export const HEAD = withUserRateLimit(headHandler);
export const OPTIONS = withUserRateLimit(optionsHandler);
export const POST = withSensitiveRateLimit(postHandler);
export const PUT = withSensitiveRateLimit(putHandler);
export const DELETE = withSensitiveRateLimit(deleteHandler);
