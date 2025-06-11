import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';
import { AuditService } from '@/services/AuditService';

const ALLOWED_ROLES_CREATE: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
const ALLOWED_ROLES_READ: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trameModeleId: string }> }
) {
  try {
    // Vérifier l'authentification et les rôles
    const authCheck = await checkUserRole(ALLOWED_ROLES_CREATE);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const userId = authCheck.user?.id || 0;
    const userRole = authCheck.user?.role || '';

    const { trameModeleId } = await params;
    logger.info(
      `[API POST /trameModele-modeles/${trameModeleId}/affectations] Début du traitement.`
    );
    logger.info('\n--- POST /api/trameModele-modeles/[trameModeleId]/affectations START ---');
    logger.info(`[API POST] Auth check passed, userId: ${userId}, role: ${userRole}`);
    logger.info(`[API POST] trameModeleId: ${trameModeleId}`);

    // 🔐 Vérification de rôle admin pour modifications de trameModeles (fait via withAuth)
    // TODO: Logger l'action de création - TEMPORAIREMENT COMMENTÉ POUR DEBUG
    // const auditService = new AuditService();
    // await auditService.logAction({
    //   action: 'CREATE_TRAME_AFFECTATION' as any,
    //   userId: userId.toString(),
    //   entityId: trameModeleId,
    //   entityType: 'trame_affectation',
    //   details: {
    //     userRole,
    //     method: 'POST',
    //   },
    // });
    logger.info(`[API POST] Audit service skipped for debugging`);

    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
      logger.warn(
        'POST /api/trameModele-modeles/[trameModeleId]/affectations: Invalid trameModeleId'
      );
      return NextResponse.json(
        { error: 'ID du template de trameModele invalide' },
        { status: 400 }
      );
    }
    const trameId = parseInt(trameModeleId);

    const body = await request.json();
    logger.info(
      'POST /api/trameModele-modeles/[trameModeleId]/affectations - Received data:',
      body
    );

    const {
      activityTypeId,
      jourSemaine: jourSemaineRaw,
      periode,
      typeSemaine,
      operatingRoomId,
      locationId, // Non utilisé dans le template AffectationModele actuel, mais gardé si évolution
      priorite,
      isActive,
      detailsJson,
      personnelRequis, // Tableau de PersonnelRequisModele
    } = body;

    // Convert integer jourSemaine to DayOfWeek enum
    const dayOfWeekMap = {
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
      7: 'SUNDAY',
    } as const;

    const jourSemaine = dayOfWeekMap[jourSemaineRaw as keyof typeof dayOfWeekMap];
    if (!jourSemaine) {
      logger.warn(`POST .../affectations: Invalid jourSemaine value: ${jourSemaineRaw}`);
      return NextResponse.json(
        { error: `Jour de semaine invalide: ${jourSemaineRaw}. Valeurs acceptées: 1-7` },
        { status: 400 }
      );
    }

    logger.info(`POST .../affectations: Converted jourSemaine ${jourSemaineRaw} to ${jourSemaine}`);

    // Log for debugging personnelRequis structure
    logger.info(
      'POST /api/trameModele-modeles/[trameModeleId]/affectations - personnelRequis structure:',
      JSON.stringify(personnelRequis, null, 2)
    );

    // Validations de base
    if (!activityTypeId || !jourSemaineRaw || !periode || !typeSemaine) {
      logger.warn('POST .../affectations: Validation failed - Champs requis manquants');
      return NextResponse.json(
        {
          error:
            "Champs requis manquants pour l'affectation (activityTypeId, jourSemaine, periode, typeSemaine)",
        },
        { status: 400 }
      );
    }

    // Vérifier l'existence du TrameModele parent
    const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
    if (!parentTrame) {
      logger.warn(`POST .../affectations: TrameModele with id ${trameId} not found.`);
      return NextResponse.json(
        { error: 'Modèle de trameModele parent non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'existence de l'ActivityType
    const activityType = await prisma.activityType.findUnique({ where: { id: activityTypeId } });
    if (!activityType) {
      logger.warn(`POST .../affectations: ActivityType with id ${activityTypeId} not found.`);
      return NextResponse.json({ error: "Type d'activité non trouvé" }, { status: 404 });
    }
    logger.info(`POST .../affectations: ActivityType found: ${activityType.name}`);

    try {
      // Préparer les données pour Prisma, y compris les nested writes pour personnelRequis
      const createData: Prisma.AffectationModeleCreateInput = {
        trameModele: { connect: { id: trameId } },
        activityType: { connect: { id: activityTypeId } },
        jourSemaine,
        periode,
        typeSemaine,
        priorite: priorite !== undefined ? parseInt(priorite.toString()) : 5,
        isActive: isActive !== undefined ? isActive : true,
        detailsJson: detailsJson ? detailsJson : undefined,
        ...(operatingRoomId && {
          operatingRoom: { connect: { id: parseInt(operatingRoomId.toString()) } },
        }),
        // locationId n'est pas dans le template AffectationModele, donc pas de connexion pour l'instant
        ...(personnelRequis &&
          Array.isArray(personnelRequis) &&
          personnelRequis.length > 0 && {
            personnelRequis: {
              create: personnelRequis.map((pr: any) => {
                // Déterminer le rôle correct en fonction du type d'utilisateur
                let roleGenerique = pr.roleGenerique;

                // Si c'est un chirurgien (préfixé avec "surgeon-"), forcer le rôle à CHIRURGIEN
                if (pr.userId && pr.userId !== 'none' && pr.userId.startsWith('surgeon-')) {
                  roleGenerique = 'CHIRURGIEN';
                  logger.info(`POST: Forcing role to CHIRURGIEN for surgeon assignment`);
                }

                const personnel: any = {
                  roleGenerique: roleGenerique,
                  nombreRequis: pr.nombreRequis || 1,
                  notes: pr.notes || '',
                };

                // Priorité 1: userId directement dans l'objet personnel requis
                if (pr.userId && pr.userId !== 'none') {
                  // Vérifier si c'est un chirurgien (préfixé avec "surgeon-")
                  if (pr.userId.startsWith('surgeon-')) {
                    const surgeonId = parseInt(pr.userId.replace('surgeon-', ''));
                    personnel.personnelHabituelSurgeonId = surgeonId;
                    logger.info(
                      `POST: Direct surgeon assignment: ${surgeonId} with role ${roleGenerique}`
                    );
                  } else {
                    personnel.personnelHabituelUserId = parseInt(pr.userId);
                    logger.info(
                      `POST: Direct user assignment: ${pr.userId} with role ${roleGenerique}`
                    );
                  }
                }
                // Priorité 2: Si on a un userId dans les notes (compatibilité arrière)
                else if (pr.notes && pr.notes.includes('Utilisateur assigné:')) {
                  const userIdMatch = pr.notes.match(/Utilisateur assigné: (\w+)/);
                  if (userIdMatch && userIdMatch[1]) {
                    const userId = userIdMatch[1];
                    if (!isNaN(parseInt(userId))) {
                      personnel.personnelHabituelUserId = parseInt(userId);
                      logger.info(`POST: Legacy user assignment from notes: ${userId}`);
                      // Nettoyer les notes en supprimant la référence utilisateur
                      personnel.notes = pr.notes.replace(/Utilisateur assigné: \w+/, '').trim();
                    }
                  }
                }

                return personnel;
              }),
            },
          }),
      };

      logger.info(
        'POST .../affectations: Structure finale de createData:',
        JSON.stringify(createData, null, 2)
      );

      logger.info('POST .../affectations: Avant création Prisma...');
      const newAffectationModele = await prisma.affectationModele.create({
        data: createData,
        include: {
          personnelRequis: true, // Inclure le personnel requis dans la réponse
          activityType: true,
          operatingRoom: true,
        },
      });
      logger.info('POST .../affectations: Après création Prisma - Succès!');

      logger.info(
        'POST .../affectations: AffectationModele created successfully:',
        newAffectationModele
      );
      logger.info('--- POST /api/trameModele-modeles/[trameModeleId]/affectations END ---\n');
      return NextResponse.json(newAffectationModele, { status: 201 });
    } catch (prismaError: unknown) {
      logger.error('Erreur Prisma détaillée:', prismaError);
      throw prismaError; // Relancer pour la gestion globale des erreurs
    }
  } catch (error: unknown) {
    logger.error('Error during POST /api/trameModele-modeles/[trameModeleId]/affectations:', {
      error: error,
    });

    // Afficher plus d'informations sur l'erreur
    if (error instanceof Error) {
      logger.error("Message d'erreur:", error.message);
      logger.error('Stack trace:', error.stack);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Gérer les erreurs Prisma spécifiques (ex: contrainte unique, clé étrangère non trouvée)
      if (error.code === 'P2025') {
        // Foreign key constraint failed
        logger.error(
          'Prisma Error P2025: An operation failed because it depends on one or more records that were required but not found.',
          error.meta
        );
        return NextResponse.json(
          {
            error: `Erreur de référence: ${error.meta?.cause || 'une entité liée est introuvable'}`,
          },
          { status: 400 }
        );
      }

      // Ajouter d'autres codes d'erreur Prisma courants
      if (error.code === 'P2002') {
        // Unique constraint failed
        logger.error('Prisma Error P2002: Unique constraint failed', error.meta);
        return NextResponse.json(
          { error: `Contrainte d'unicité non respectée: ${error.meta?.target}` },
          { status: 400 }
        );
      }

      // Retourner le code Prisma pour le débogage
      return NextResponse.json(
        { error: `Erreur Prisma (${error.code}): ${error.message}`, meta: error.meta },
        { status: 500 }
      );
    }

    logger.info(
      '--- POST /api/trameModele-modeles/[trameModeleId]/affectations END (with error) ---\n'
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'affectation template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trameModeleId: string }> }
) {
  try {
    // Vérifier l'authentification et les rôles
    const authCheck = await checkUserRole(ALLOWED_ROLES_READ);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const userId = authCheck.user?.id || 0;
    const { trameModeleId } = await params;
    logger.info(
      `[API GET /trameModele-modeles/${trameModeleId}/affectations] Début du traitement.`
    );

    logger.info('\n--- GET /api/trameModele-modeles/[trameModeleId]/affectations START ---');

    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
      logger.warn(
        'GET /api/trameModele-modeles/[trameModeleId]/affectations: Invalid trameModeleId'
      );
      return NextResponse.json(
        { error: 'ID du template de trameModele invalide' },
        { status: 400 }
      );
    }
    const trameId = parseInt(trameModeleId);

    logger.info(`GET .../affectations: Retrieving affectations for trameModeleId ${trameId}...`);

    // Vérifier l'existence du TrameModele parent
    const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
    if (!parentTrame) {
      logger.warn(`GET .../affectations: TrameModele with id ${trameId} not found.`);
      return NextResponse.json(
        { error: 'Modèle de trameModele parent non trouvé' },
        { status: 404 }
      );
    }

    const affectations = await prisma.affectationModele.findMany({
      where: { trameModeleId: trameId },
      include: {
        activityType: true,
        operatingRoom: true,
        personnelRequis: {
          include: {
            professionalRoleConfig: true,
            specialty: true,
            userHabituel: true,
            surgeonHabituel: true,
          },
        },
      },
      orderBy: [
        // Optionnel: ajouter un tri par défaut
        { jourSemaine: 'asc' },
        { periode: 'asc' },
        { priorite: 'asc' },
      ],
    });

    logger.info(
      `GET .../affectations: ${affectations.length} affectations retrieved successfully.`
    );
    logger.info('--- GET /api/trameModele-modeles/[trameModeleId]/affectations END ---\n');
    return NextResponse.json(affectations);
  } catch (error: unknown) {
    logger.error(
      `Erreur lors de la récupération des affectations pour la trameModele ${trameModeleId}:`,
      error
    );
    return NextResponse.json(
      { error: 'Erreur interne du serveur.', details: error.message },
      { status: 500 }
    );
  }
}
