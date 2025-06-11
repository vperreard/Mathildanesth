import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { LeaveStatus, LeaveType as PrismaLeaveType } from '@prisma/client';
import { formatDate, parseDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';

interface BatchLeaveRequest {
  userId: number;
  startDate: string;
  endDate: string;
  typeCode: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayPeriod?: 'AM' | 'PM';
  countedDays?: number;
}

interface BatchResult {
  success: boolean;
  message: string;
  createdLeave?: any;
  error?: string;
}

/**
 * POST /api/leaves/batch
 * Crée plusieurs demandes de congés en batch
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (try both methods for compatibility)
    let authenticatedUser = null;

    // Try session first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      authenticatedUser = {
        id: session.user.id,
        role: session.user.role,
      };
    } else {
      // Fallback to JWT token in headers
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (token) {
        const { verifyAuthToken } = await import('@/lib/auth-server-utils');
        const authResult = await verifyAuthToken(token);
        if (authResult.authenticated && authResult.userId) {
          const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: { id: true, role: true },
          });
          if (user) {
            authenticatedUser = user;
          }
        }
      }
    }

    if (!authenticatedUser) {
      logger.warn("Tentative d'accès sans authentification", { path: '/api/leaves/batch' });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    logger.info(
      '[API /leaves/batch POST] Corps de la requête reçu:',
      JSON.stringify(body, null, 2)
    );

    // Validation du payload
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Le payload doit être un tableau non vide' },
        { status: 400 }
      );
    }

    const results: BatchResult[] = [];

    // Traiter chaque demande de congé
    for (const leaveRequest of body) {
      try {
        const {
          userId,
          startDate,
          endDate,
          typeCode,
          reason,
          isHalfDay,
          halfDayPeriod,
          countedDays,
        } = leaveRequest as BatchLeaveRequest;

        // Vérifier que l'utilisateur peut créer un congé pour cet userId
        if (
          authenticatedUser.id !== userId &&
          authenticatedUser.role !== 'ADMIN_TOTAL' &&
          authenticatedUser.role !== 'ADMIN_PARTIEL'
        ) {
          results.push({
            success: false,
            message: `Non autorisé à créer un congé pour l'utilisateur ${userId}`,
            error: 'FORBIDDEN',
          });
          continue;
        }

        // Validation des champs requis
        if (!startDate || !endDate || !typeCode) {
          results.push({
            success: false,
            message: 'Les champs startDate, endDate et typeCode sont requis',
            error: 'VALIDATION_ERROR',
          });
          continue;
        }

        // Parser les dates
        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);

        if (!parsedStartDate || !parsedEndDate) {
          results.push({
            success: false,
            message: 'Dates invalides',
            error: 'INVALID_DATES',
          });
          continue;
        }

        // Vérifier que la date de fin est après ou égale à la date de début
        if (parsedEndDate < parsedStartDate) {
          results.push({
            success: false,
            message: 'La date de fin doit être postérieure ou égale à la date de début',
            error: 'INVALID_DATE_RANGE',
          });
          continue;
        }

        // Pour une demi-journée, vérifier que les dates sont identiques (ignorer l'heure)
        if (isHalfDay) {
          const startDateOnly = new Date(
            parsedStartDate.getFullYear(),
            parsedStartDate.getMonth(),
            parsedStartDate.getDate()
          );
          const endDateOnly = new Date(
            parsedEndDate.getFullYear(),
            parsedEndDate.getMonth(),
            parsedEndDate.getDate()
          );

          if (startDateOnly.getTime() !== endDateOnly.getTime()) {
            results.push({
              success: false,
              message: 'Pour une demi-journée, la date de début et de fin doivent être identiques',
              error: 'HALF_DAY_DATE_MISMATCH',
            });
            continue;
          }
        }

        // Mapper le typeCode vers l'enum Prisma
        const mappedType = mapCodeToLeaveType(typeCode);

        // Créer la demande de congé
        const createdLeave = await prisma.leave.create({
          data: {
            userId,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            type: mappedType,
            typeCode,
            reason,
            status: LeaveStatus.PENDING,
            requestDate: new Date(),
            countedDays:
              countedDays || calculateWorkingDays(parsedStartDate, parsedEndDate, isHalfDay),
            isRecurring: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        });

        // Formater la réponse
        const formattedLeave = {
          id: String(createdLeave.id),
          userId: createdLeave.userId,
          userName: `${createdLeave.user.prenom} ${createdLeave.user.nom}`,
          userEmail: createdLeave.user.email,
          startDate: formatDate(createdLeave.startDate, ISO_DATE_FORMAT),
          endDate: formatDate(createdLeave.endDate, ISO_DATE_FORMAT),
          type: createdLeave.type,
          typeCode: createdLeave.typeCode,
          reason: createdLeave.reason,
          status: createdLeave.status,
          requestDate: formatDate(createdLeave.requestDate, ISO_DATE_FORMAT),
          countedDays: createdLeave.countedDays,
          isHalfDay,
          halfDayPeriod,
          createdAt: formatDate(createdLeave.createdAt, ISO_DATE_FORMAT),
          updatedAt: formatDate(createdLeave.updatedAt, ISO_DATE_FORMAT),
        };

        results.push({
          success: true,
          message: 'Demande de congé créée avec succès',
          createdLeave: formattedLeave,
        });

        logger.info('Congé créé avec succès', {
          leaveId: createdLeave.id,
          userId: createdLeave.userId,
          type: createdLeave.type,
          startDate: createdLeave.startDate,
          endDate: createdLeave.endDate,
        });
      } catch (error: unknown) {
        logger.error('Erreur lors de la création du congé:', { error, leaveRequest });
        results.push({
          success: false,
          message: error instanceof Error ? error.message : 'Erreur lors de la création du congé',
          error: 'INTERNAL_ERROR',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    logger.error('[API /leaves/batch] Erreur lors du traitement batch:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors du traitement des demandes de congés.' },
      { status: 500 }
    );
  }
}

// Fonction pour mapper le code vers l'enum Prisma
function mapCodeToLeaveType(code: string): PrismaLeaveType {
  const mappings: Record<string, PrismaLeaveType> = {
    // Codes français
    CP: PrismaLeaveType.ANNUAL, // Congés Payés
    RECUP: PrismaLeaveType.RECOVERY, // Récupération
    FORM: PrismaLeaveType.TRAINING, // Formation
    MAL: PrismaLeaveType.SICK, // Maladie
    MAT: PrismaLeaveType.MATERNITY, // Maternité
    EXCEP: PrismaLeaveType.SPECIAL, // Exceptionnel
    SANS_SOLDE: PrismaLeaveType.UNPAID, // Sans solde
    AUTRE: PrismaLeaveType.OTHER, // Autre
    // Codes anglais (compatibilité)
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
}

// Fonction simple pour calculer les jours ouvrés (à améliorer avec le calendrier de travail)
function calculateWorkingDays(startDate: Date, endDate: Date, isHalfDay?: boolean): number {
  if (isHalfDay) {
    return 0.5;
  }

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Exclure les weekends (0 = dimanche, 6 = samedi)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
