import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { trameAffectationService } from '@/services/trameAffectationService';
import { 
  CreateTrameAffectationSchema, 
  UpdateTrameAffectationSchema,
  QueryTrameAffectationsSchema
} from '@/types/trame-affectations';
import { handleError } from '@/lib/errorHandling';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/trame-modeles/[trameId]/affectations
 * Récupère toutes les affectations d'une trame modèle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trameId: string } }
) {
  try {
    // Authentification
    const payload = await verifyAuthToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validation des paramètres de requête
    const validatedQuery = QueryTrameAffectationsSchema.parse(queryParams);

    // Vérification des permissions
    const canAccess = await trameAffectationService.checkPermission(
      payload.userId,
      params.trameId
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Filtres spécifiques à cette trame
    const filters = {
      isActive: validatedQuery.isActive === 'true' ? true : 
                validatedQuery.isActive === 'false' ? false : undefined,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      search: validatedQuery.search
    };

    // Options de tri
    const sortOptions = {
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder
    };

    // Récupération des affectations
    const result = await trameAffectationService.getTrameAffectations(
      validatedQuery.page,
      validatedQuery.limit,
      filters,
      sortOptions
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in GET /api/trame-modeles/[trameId]/affectations', { error });
    return handleError(error);
  }
}

/**
 * POST /api/trame-modeles/[trameId]/affectations
 * Crée une nouvelle affectation pour une trame modèle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { trameId: string } }
) {
  try {
    // Authentification
    const payload = await verifyAuthToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Vérification des permissions (admin uniquement)
    if (!hasPermission(payload.role, 'trames.create')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Validation du body
    const body = await request.json();
    const validatedData = CreateTrameAffectationSchema.parse(body);

    // Création de l'affectation
    const newAffectation = await trameAffectationService.createTrameAffectation(
      validatedData,
      payload.userId
    );

    logger.info('Trame affectation created', {
      userId: payload.userId,
      trameId: params.trameId,
      affectationId: newAffectation.id
    });

    return NextResponse.json(newAffectation, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/trame-modeles/[trameId]/affectations', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return handleError(error);
  }
}

/**
 * PUT /api/trame-modeles/[trameId]/affectations/[affectationId]
 * Met à jour une affectation existante
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { trameId: string } }
) {
  try {
    // Authentification
    const payload = await verifyAuthToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extraction de l'ID d'affectation depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const affectationId = pathParts[pathParts.length - 1];

    if (!affectationId || affectationId === 'affectations') {
      return NextResponse.json(
        { error: 'Affectation ID is required' },
        { status: 400 }
      );
    }

    // Vérification des permissions
    const canModify = await trameAffectationService.checkPermission(
      payload.userId,
      params.trameId
    );

    if (!canModify) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validation du body
    const body = await request.json();
    const validatedData = UpdateTrameAffectationSchema.parse(body);

    // Mise à jour de l'affectation
    const updatedAffectation = await trameAffectationService.updateTrameAffectation(
      affectationId,
      validatedData,
      payload.userId
    );

    if (!updatedAffectation) {
      return NextResponse.json(
        { error: 'Affectation not found' },
        { status: 404 }
      );
    }

    logger.info('Trame affectation updated', {
      userId: payload.userId,
      trameId: params.trameId,
      affectationId
    });

    return NextResponse.json(updatedAffectation);
  } catch (error) {
    logger.error('Error in PUT /api/trame-modeles/[trameId]/affectations', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return handleError(error);
  }
}

/**
 * DELETE /api/trame-modeles/[trameId]/affectations/[affectationId]
 * Supprime une affectation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trameId: string } }
) {
  try {
    // Authentification
    const payload = await verifyAuthToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extraction de l'ID d'affectation depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const affectationId = pathParts[pathParts.length - 1];

    if (!affectationId || affectationId === 'affectations') {
      return NextResponse.json(
        { error: 'Affectation ID is required' },
        { status: 400 }
      );
    }

    // Vérification des permissions (admin uniquement)
    if (!hasPermission(payload.role, 'trames.delete')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Suppression de l'affectation
    const deleted = await trameAffectationService.deleteTrameAffectation(
      affectationId,
      payload.userId
    );

    if (!deleted) {
      return NextResponse.json(
        { error: 'Affectation not found' },
        { status: 404 }
      );
    }

    logger.info('Trame affectation deleted', {
      userId: payload.userId,
      trameId: params.trameId,
      affectationId
    });

    return NextResponse.json(
      { message: 'Affectation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in DELETE /api/trame-modeles/[trameId]/affectations', { error });
    
    if (error instanceof Error && error.message.includes('Cannot delete trame with existing assignments')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return handleError(error);
  }
}