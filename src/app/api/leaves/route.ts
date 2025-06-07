import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType as PrismaLeaveType } from '@prisma/client';
import { withAuth, SecurityChecks } from '@/middleware/authorization';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { BusinessRulesValidator } from '@/services/businessRulesValidator';
import { withSensitiveRateLimit } from '@/lib/rateLimit';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

// Interface attendue par le frontend (similaire à celle dans page.tsx)
interface UserFrontend {
  id: number;
  firstName: string;
  lastName: string;
  prenom: string;
  nom: string;
}

interface LeaveWithUserFrontend {
  id: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  type: PrismaLeaveType;
  typeCode?: string | null;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: UserFrontend;
}

// Mapping du code (string) vers l'enum Prisma LeaveType pour la compatibilité
const mapCodeToLeaveType = (code: string): PrismaLeaveType => {
  const mappings: Record<string, PrismaLeaveType> = {
    ANNUAL: PrismaLeaveType.ANNUAL,
    RECOVERY: PrismaLeaveType.RECOVERY,
    TRAINING: PrismaLeaveType.TRAINING,
    SICK: PrismaLeaveType.SICK,
    MATERNITY: PrismaLeaveType.MATERNITY,
    SPECIAL: PrismaLeaveType.SPECIAL,
    UNPAID: PrismaLeaveType.UNPAID,
    OTHER: PrismaLeaveType.OTHER,
  };

  return mappings[code] || PrismaLeaveType.OTHER;
};

/**
 * GET /api/conges
 * Récupère les congés avec filtrage et pagination
 */
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Vérifier l'authentification avec le shim
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Tentative d'accès sans authentification", { path: '/api/conges' });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authenticatedUser = {
      id: session.user.id,
      role: session.user.role,
    };

    // Extraction des paramètres de filtrage
    const userId = searchParams.get('userId');
    const departmentId = searchParams.get('departmentId');
    const statuses = searchParams.getAll('statuses');
    const types = searchParams.getAll('types');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('searchTerm');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    logger.info(`[API /api/conges] Requête GET reçue`, { 
      userId, departmentId, statuses, types, startDate, endDate, page, limit 
    });

    // Construction des conditions de filtrage
    const where: any = {};

    // Si un userId est spécifié, vérifier les permissions
    if (userId) {
      const targetUserId = parseInt(userId, 10);
      if (
        authenticatedUser.id !== targetUserId &&
        authenticatedUser.role !== 'ADMIN_TOTAL' &&
        authenticatedUser.role !== 'ADMIN_PARTIEL'
      ) {
        logger.warn('Accès non autorisé aux congés', {
          authenticatedUserId: authenticatedUser.id,
          targetUserId,
          role: authenticatedUser.role,
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      where.userId = targetUserId;
    } else if (authenticatedUser.role !== 'ADMIN_TOTAL' && authenticatedUser.role !== 'ADMIN_PARTIEL') {
      // Si pas d'userId et pas admin, retourner seulement ses propres congés
      where.userId = authenticatedUser.id;
    }

    if (departmentId) {
      where.user = { departmentId };
    }

    if (statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (types.length > 0) {
      where.type = { in: types };
    }

    if (startDate && endDate) {
      where.AND = [
        { startDate: { gte: new Date(startDate) } },
        { endDate: { lte: new Date(endDate) } },
      ];
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (searchTerm) {
      where.OR = [
        { user: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { reason: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Construction de l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'userName') {
      orderBy.user = { prenom: sortOrder };
    } else if (sortBy === 'userEmail') {
      orderBy.user = { email: sortOrder };
    } else if (sortBy === 'departmentName') {
      orderBy.user = { department: { name: sortOrder } };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Compter le total pour la pagination
    const total = await prisma.leave.count({ where });

    // --- Logique Prisma activée ---
    const leaves = await prisma.leave.findMany({
      where,
      include: {
        // Inclure les données utilisateur
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });

    // Fonction adaptateur pour uniformiser les champs nom/prenom
    const adaptUserFields = (user: unknown) => {
      if (!user) return null;

      return {
        ...user,
        firstName: user.firstName || user.prenom,
        lastName: user.lastName || user.nom,
        prenom: user.prenom || user.firstName,
        nom: user.nom || user.lastName,
      };
    };

    // Mapper les résultats directement vers le type final
    const formattedLeaves: LeaveWithUserFrontend[] = leaves
      .map(leave => {
        if (!leave.user) {
          logger.error(`Utilisateur non trouvé pour le congé ID: ${leave.id}`);
          return null; // Marquer pour filtrage
        }

        // Adapter les données utilisateur
        const adaptedUser = adaptUserFields(leave.user);

        // S'assurer que les valeurs de nom et prénom ne sont jamais undefined
        const firstName = adaptedUser.firstName || adaptedUser.prenom || '(Prénom non défini)';
        const lastName = adaptedUser.lastName || adaptedUser.nom || '(Nom non défini)';

        // Créer l'objet formaté
        const formattedLeave: LeaveWithUserFrontend = {
          id: String(leave.id), // Convertir l'ID en string
          startDate: leave.startDate.toISOString(),
          endDate: leave.endDate.toISOString(),
          // Assurer la conversion explicite vers les types enum attendus
          status: leave.status as LeaveStatus,
          type: leave.type as PrismaLeaveType,
          typeCode: leave.typeCode,
          reason: leave.reason,
          createdAt: leave.createdAt.toISOString(),
          updatedAt: leave.updatedAt.toISOString(),
          userId: leave.userId,
          user: {
            id: adaptedUser.id,
            firstName: firstName,
            lastName: lastName,
            // Ajouter également les noms originaux pour compatibilité
            prenom: firstName,
            nom: lastName,
          },
        };
        return formattedLeave;
      })
      .filter((leave): leave is LeaveWithUserFrontend => leave !== null); // Filtrer les nulls

    // Retourner le résultat paginé
    return NextResponse.json({
      items: formattedLeaves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    logger.error(`[API /api/conges] Erreur lors de la récupération des congés:`, { error: error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des congés.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conges
 * Crée une nouvelle demande de congé.
 */
async function postHandler(request: NextRequest) {
  try {
    // 🔐 Vérifier les permissions de création de congé
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      logger.warn('Tentative de création de congé sans token', { path: '/api/conges' });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
      logger.warn('Token invalide pour création de congé', { path: '/api/conges' });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    logger.info('[API /conges POST] Corps de la requête reçu:', JSON.stringify(body, null, 2));

    const { userId, startDate, endDate, typeCode, reason } = body;

    // Récupérer l'utilisateur authentifié
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, role: true },
    });

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }

    // 🔐 Vérifier que l'utilisateur peut créer ce congé (pour lui-même ou admin)
    const targetUserId = parseInt(String(userId), 10);
    if (
      authenticatedUser.id !== targetUserId &&
      authenticatedUser.role !== 'ADMIN_TOTAL' &&
      authenticatedUser.role !== 'ADMIN_PARTIEL'
    ) {
      logger.warn('Tentative non autorisée de création de congé', {
        authenticatedUserId: authenticatedUser.id,
        targetUserId,
        role: authenticatedUser.role,
      });
      return NextResponse.json(
        { error: 'Forbidden - Vous ne pouvez créer des congés que pour vous-même' },
        { status: 403 }
      );
    }

    // Logger l'action
    logger.info('Création de congé', {
      action: 'CREATE_LEAVE',
      authenticatedUserId: authenticatedUser.id,
      targetUserId,
      role: authenticatedUser.role,
      details: { typeCode, startDate, endDate },
    });

    logger.info('[API /conges POST] Valeurs extraites:', {
      userId,
      startDate,
      endDate,
      typeCode,
      reason,
      userIdType: typeof userId,
      startDateType: typeof startDate,
      endDateType: typeof endDate,
      typeCodeType: typeof typeCode,
    });

    // --- Validation des données ---
    if (!userId || !startDate || !endDate || !typeCode) {
      logger.info('[API /conges POST] Validation échouée:', {
        hasUserId: !!userId,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate,
        hasTypeCode: !!typeCode,
      });
      return NextResponse.json(
        { error: 'Données manquantes (userId, startDate, endDate, typeCode sont requis)' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Format de date invalide.' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'La date de fin ne peut être antérieure à la date de début.' },
        { status: 400 }
      );
    }

    // Convertir le typeCode en type Prisma
    const leaveType = mapCodeToLeaveType(typeCode);

    const userIdInt = parseInt(String(userId), 10); // Assurer que userId est un Int
    if (isNaN(userIdInt)) {
      return NextResponse.json({ error: 'Format userId invalide.' }, { status: 400 });
    }

    // Valeur par défaut pour les jours comptés, à remplacer par le vrai calcul
    const countedDays = 1;

    // 🔐 VALIDATION DES RÈGLES MÉTIER AVANT CRÉATION
    const validationResult = await BusinessRulesValidator.validateLeaveRequest({
      userId: String(userIdInt),
      startDate: start,
      endDate: end,
      type: typeCode,
      quotaId: body.quotaId, // Si applicable
    });

    if (!validationResult.valid) {
      logger.warn('Validation des règles métier échouée', {
        userId: userIdInt,
        errors: validationResult.errors,
        leaveDetails: { typeCode, startDate, endDate },
      });
      return NextResponse.json(
        {
          error: 'La demande de congé ne respecte pas les règles métier',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // --- Création en base de données ---
    try {
      const newLeave = await prisma.leave.create({
        data: {
          userId: userIdInt,
          startDate: start,
          endDate: end,
          // Utiliser le type convertit depuis mapCodeToLeaveType
          type: leaveType,
          typeCode: typeCode,
          status: LeaveStatus.PENDING,
          reason: reason ?? null,
          countedDays: countedDays,
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      logger.info(
        '[API /conges POST] Données utilisateur récupérées:',
        JSON.stringify(
          {
            userId: userIdInt,
            userIncluded: !!newLeave.user,
            userData: newLeave.user,
          },
          null,
          2
        )
      );

      // Adapter les données utilisateur pour s'assurer de la cohérence firstName/lastName
      const adaptUserFields = (user: unknown) => {
        if (!user) return null;

        return {
          ...user,
          firstName: user.firstName || user.prenom,
          lastName: user.lastName || user.nom,
          prenom: user.prenom || user.firstName,
          nom: user.nom || user.lastName,
        };
      };

      // S'assurer que les valeurs de nom et prénom ne sont jamais undefined
      const adaptedUser = adaptUserFields(newLeave.user);
      logger.info('[API /conges POST] Utilisateur adapté:', JSON.stringify(adaptedUser, null, 2));

      const firstName = adaptedUser?.prenom || adaptedUser?.firstName || '(Prénom non défini)';
      const lastName = adaptedUser?.nom || adaptedUser?.lastName || '(Nom non défini)';

      // Retourner une réponse formatée
      const formattedLeave = {
        id: String(newLeave.id),
        startDate: newLeave.startDate.toISOString(),
        endDate: newLeave.endDate.toISOString(),
        status: newLeave.status,
        type: newLeave.type,
        typeCode: newLeave.typeCode,
        reason: newLeave.reason,
        createdAt: newLeave.createdAt.toISOString(),
        updatedAt: newLeave.updatedAt.toISOString(),
        userId: newLeave.userId,
        user: {
          id: adaptedUser?.id || userIdInt,
          firstName,
          lastName,
          // Ajouter également les noms originaux pour compatibilité complète
          prenom: firstName,
          nom: lastName,
        },
      };

      // Log d'audit pour la création du congé
      await auditService.logDataModification(
        AuditAction.LEAVE_REQUESTED,
        'Leave',
        newLeave.id,
        authenticatedUser.id,
        null, // Pas de valeur précédente pour une création
        formattedLeave,
        {
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          targetUserId: targetUserId !== authenticatedUser.id ? targetUserId : undefined,
          metadata: {
            typeCode,
            duration: `${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))} jours`,
            createdBy:
              authenticatedUser.role === 'ADMIN_TOTAL' || authenticatedUser.role === 'ADMIN_PARTIEL'
                ? 'admin'
                : 'user',
          },
        }
      );

      logger.info(
        '[API /conges POST] Congé créé avec succès:',
        JSON.stringify(formattedLeave, null, 2)
      );
      return NextResponse.json(formattedLeave, { status: 201 }); // 201 Created
    } catch (error: unknown) {
      logger.error('[API /conges POST] Erreur lors de la création du congé:', { error: error });

      // Log d'audit pour l'échec
      await auditService.logAction({
        action: AuditAction.ERROR_OCCURRED,
        entityId: 'leave_creation',
        entityType: 'Leave',
        userId: authenticatedUser.id,
        severity: 'ERROR',
        success: false,
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: { typeCode, startDate, endDate, targetUserId },
        },
      });

      return NextResponse.json(
        { error: 'Erreur lors de la création du congé dans la base de données.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logger.error('[API /conges POST] Erreur générale:', { error: error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la demande de congé.' },
      { status: 500 }
    );
  }
}

// Export des handlers avec rate limiting
export const GET = withSensitiveRateLimit(getHandler);
export const POST = withSensitiveRateLimit(postHandler);

// Ajouter d'autres méthodes (PUT, DELETE) si nécessaire pour modifier/annuler
// export async function PUT(request: NextRequest) { ... } // ou /api/conges/[id]
// export async function DELETE(request: NextRequest) { ... } // ou /api/conges/[id]
