import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';
import { logger } from '@/lib/logger';

const ALLOWED_ROLES: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

// Schema de validation pour les affectations
const affectationSchema = z.object({
  userId: z.string(),
  operatingRoomId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  shiftType: z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY', 'GUARD', 'ON_CALL']),
  weekType: z.enum(['ALL', 'EVEN', 'ODD']).optional(),
});

// Schema pour les opérations batch
const batchOperationSchema = z.object({
  create: z.array(affectationSchema).optional(),
  update: z.array(z.object({
    id: z.string(),
    data: affectationSchema.partial()
  })).optional(),
  delete: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trameModeleId: string }> }
) {
  try {
    // Vérifier l'authentification et les rôles
    const authCheck = await checkUserRole(ALLOWED_ROLES);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { trameModeleId } = await params;
    const body = await request.json();

    // Valider le body de la requête
    const validationResult = batchOperationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { create = [], update = [], delete: deleteIds = [] } = validationResult.data;

    logger.info(`Batch operations for trame ${trameModeleId}:`, {
      create: create.length,
      update: update.length,
      delete: deleteIds.length,
    });

    // Vérifier que le modèle de trame existe
    const trameModele = await prisma.trameModele.findUnique({
      where: { id: parseInt(trameModeleId) },
    });

    if (!trameModele) {
      return NextResponse.json(
        { error: 'Modèle de trame non trouvé' },
        { status: 404 }
      );
    }

    // Exécuter toutes les opérations dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const results = {
        created: [],
        updated: [],
        deleted: [],
      };

      // Suppression des affectations
      if (deleteIds.length > 0) {
        await tx.affectationModele.deleteMany({
          where: {
            id: { in: deleteIds.map(id => parseInt(id)) },
            trameModeleId: parseInt(trameModeleId),
          },
        });
        results.deleted = deleteIds;
      }

      // Mise à jour des affectations existantes
      for (const { id, data } of update) {
        const updated = await tx.affectationModele.update({
          where: {
            id: parseInt(id),
            trameModeleId: parseInt(trameModeleId),
          },
          data: {
            ...(data.userId && { userId: parseInt(data.userId) }),
            ...(data.operatingRoomId && { operatingRoomId: parseInt(data.operatingRoomId) }),
            ...(data.dayOfWeek !== undefined && { jourSemaine: getDayOfWeekEnum(data.dayOfWeek) }),
            ...(data.shiftType && { periode: data.shiftType }),
            ...(data.weekType && { typeSemaine: data.weekType }),
          },
          include: {
            personnelRequis: true,
            activityType: true,
            operatingRoom: true,
          },
        });
        results.updated.push(updated);
      }

      // Création de nouvelles affectations
      for (const affectation of create) {
        // Trouver ou créer un type d'activité par défaut
        const defaultActivityType = await tx.activityType.findFirst({
          where: { name: 'Anesthésie' },
        }) || await tx.activityType.create({
          data: {
            name: 'Anesthésie',
            description: 'Activité d\'anesthésie',
            color: '#3B82F6',
          },
        });

        const created = await tx.affectationModele.create({
          data: {
            trameModeleId: parseInt(trameModeleId),
            activityTypeId: defaultActivityType.id,
            jourSemaine: getDayOfWeekEnum(affectation.dayOfWeek),
            periode: affectation.shiftType,
            typeSemaine: affectation.weekType || 'ALL',
            priorite: 5,
            isActive: true,
            operatingRoomId: affectation.operatingRoomId ? parseInt(affectation.operatingRoomId) : undefined,
            personnelRequis: {
              create: {
                roleGenerique: 'IADE',
                nombreRequis: 1,
                personnelHabituelUserId: parseInt(affectation.userId),
              },
            },
          },
          include: {
            personnelRequis: true,
            activityType: true,
            operatingRoom: true,
          },
        });
        results.created.push(created);
      }

      return results;
    });

    logger.info('Batch operations completed successfully');

    // Retourner toutes les affectations mises à jour
    const allAffectations = await prisma.affectationModele.findMany({
      where: { trameModeleId: parseInt(trameModeleId) },
      include: {
        activityType: true,
        operatingRoom: true,
        personnelRequis: {
          include: {
            userHabituel: true,
            surgeonHabituel: true,
          },
        },
      },
      orderBy: [
        { jourSemaine: 'asc' },
        { periode: 'asc' },
      ],
    });

    return NextResponse.json(allAffectations);
  } catch (error) {
    logger.error('Error in batch operations:', error);
    return NextResponse.json(
      { error: 'Erreur lors des opérations batch', details: error.message },
      { status: 500 }
    );
  }
}

// Helper pour convertir le numéro du jour en enum Prisma
function getDayOfWeekEnum(dayNumber: number): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[dayNumber] || 'MONDAY';
}