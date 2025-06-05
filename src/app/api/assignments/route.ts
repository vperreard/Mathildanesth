import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BusinessRulesValidator } from '@/services/businessRulesValidator';
import { verifyAuthToken } from '@/lib/auth-server-utils';

// Schéma de validation pour les paramètres de requête
const querySchema = z.object({
  start: z.string().datetime({ message: 'La date de début doit être une date ISO valide' }),
  end: z.string().datetime({ message: 'La date de fin doit être une date ISO valide' }),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  // Validation des paramètres
  const validationResult = querySchema.safeParse({ start: startParam, end: endParam });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Paramètres de requête invalides', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { start, end } = validationResult.data;

  try {
    // Convertir les chaînes en objets Date
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Récupérer les affectations depuis la base de données
    const attributions = await prisma.attribution.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Ajouter d'autres filtres si nécessaire (par exemple, par utilisateur, type...)
      },
      // Inclure les données utilisateur associées si nécessaire
      // include: {
      //     user: true,
      // }
    });

    return NextResponse.json({ attributions });
  } catch (error: any) {
    logger.error('Erreur API [GET /api/affectations]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des affectations.', details: error.message },
      { status: 500 }
    );
  }
}

// Schéma de validation pour créer une affectation
const createAssignmentSchema = z.object({
  userId: z.string(),
  operatingRoomId: z.string(),
  date: z.string().datetime(),
  shiftType: z.enum(['JOUR', 'GARDE']),
  duration: z.number().optional().default(8),
});

/**
 * POST /api/affectations
 * Crée une nouvelle affectation avec validation des règles métier
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      logger.warn("Tentative de création d'affectation sans token", { path: '/api/affectations' });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
      logger.warn("Token invalide pour création d'affectation", { path: '/api/affectations' });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Récupérer l'utilisateur authentifié
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, role: true },
    });

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }

    // Valider le corps de la requête
    const body = await request.json();
    const validationResult = createAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { userId, operatingRoomId, date, shiftType, duration } = validationResult.data;

    // 🔐 Vérifier les permissions (admin ou responsable planning)
    if (
      authenticatedUser.role !== 'ADMIN_TOTAL' &&
      authenticatedUser.role !== 'ADMIN_PARTIEL' &&
      authenticatedUser.role !== 'MANAGER'
    ) {
      logger.warn("Tentative non autorisée de création d'affectation", {
        authenticatedUserId: authenticatedUser.id,
        role: authenticatedUser.role,
      });
      return NextResponse.json(
        { error: 'Forbidden - Seuls les administrateurs peuvent créer des affectations' },
        { status: 403 }
      );
    }

    // 🔐 VALIDATION DES RÈGLES MÉTIER
    const businessValidation = await BusinessRulesValidator.validateAssignment({
      userId,
      operatingRoomId,
      date: new Date(date),
      shiftType,
      duration,
    });

    if (!businessValidation.valid) {
      logger.warn('Validation des règles métier échouée pour affectation', {
        userId,
        errors: businessValidation.errors,
        assignmentDetails: { operatingRoomId, date, shiftType },
      });
      return NextResponse.json(
        {
          error: "L'affectation ne respecte pas les règles métier",
          details: businessValidation.errors,
        },
        { status: 400 }
      );
    }

    // Logger l'action
    logger.info("Création d'affectation", {
      action: 'CREATE_ASSIGNMENT',
      authenticatedUserId: authenticatedUser.id,
      targetUserId: userId,
      role: authenticatedUser.role,
      details: { operatingRoomId, date, shiftType },
    });

    // Créer l'affectation en base de données
    const newAssignment = await prisma.attribution.create({
      data: {
        userId: parseInt(userId, 10),
        operatingRoomId: parseInt(operatingRoomId, 10),
        date: new Date(date),
        shiftType,
        duration,
        status: 'CONFIRMED',
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            professionalRole: true,
          },
        },
        operatingRoom: {
          select: {
            id: true,
            name: true,
            roomType: true,
            sector: true,
          },
        },
      },
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error: any) {
    logger.error('Erreur API [POST /api/affectations]:', error);
    logger.error("Erreur lors de la création de l'affectation", { error: error.message });
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de l'affectation.", details: error.message },
      { status: 500 }
    );
  }
}
