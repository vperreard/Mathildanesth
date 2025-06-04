import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/authorization';
import { logger } from '@/lib/logger';
import { AuditService } from '@/services/AuditService';

export const POST = withAuth({
  requireAuth: true,
  allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
  resourceType: 'trame_affectation',
  action: 'create',
})(async (request: NextRequest, { params }: { params: Promise<{ trameModeleId: string }> }) => {
  try {
    const userId = parseInt(request.headers.get('x-user-id') || '0');
    const userRole = request.headers.get('x-user-role') || '';

    const { trameModeleId } = await params;
    console.log(
      `[API POST /trameModele-modeles/${trameModeleId}/affectations] Début du traitement.`
    );
    console.log('\n--- POST /api/trameModele-modeles/[trameModeleId]/affectations START ---');

    // 🔐 CORRECTION DU TODO CRITIQUE : Vérification de rôle admin pour modifications de trameModeles (déjà fait via withAuth)
    // Logger l'action de création
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'CREATE_TRAME_AFFECTATION' as any,
      userId: userId.toString(),
      entityId: trameModeleId,
      entityType: 'trame_affectation',
      details: {
        userRole,
        method: 'POST',
      },
    });

    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
      console.warn(
        'POST /api/trameModele-modeles/[trameModeleId]/affectations: Invalid trameModeleId'
      );
      return NextResponse.json(
        { error: 'ID du template de trameModele invalide' },
        { status: 400 }
      );
    }
    const trameId = parseInt(trameModeleId);

    const body = await request.json();
    console.log(
      'POST /api/trameModele-modeles/[trameModeleId]/affectations - Received data:',
      body
    );

    const {
      activityTypeId,
      jourSemaine,
      periode,
      typeSemaine,
      operatingRoomId,
      locationId, // Non utilisé dans le template AffectationModele actuel, mais gardé si évolution
      priorite,
      isActive,
      detailsJson,
      personnelRequis, // Tableau de PersonnelRequisModele
    } = body;

    // Log for debugging personnelRequis structure
    console.log(
      'POST /api/trameModele-modeles/[trameModeleId]/affectations - personnelRequis structure:',
      JSON.stringify(personnelRequis, null, 2)
    );

    // Validations de base
    if (!activityTypeId || !jourSemaine || !periode || !typeSemaine) {
      console.warn('POST .../affectations: Validation failed - Champs requis manquants');
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
      console.warn(`POST .../affectations: TrameModele with id ${trameId} not found.`);
      return NextResponse.json(
        { error: 'Modèle de trameModele parent non trouvé' },
        { status: 404 }
      );
    }

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
              create: personnelRequis.map((pr: any) => ({
                roleGenerique: pr.roleGenerique,
                nombreRequis: pr.nombreRequis || 1,
                notes: pr.notes,
                // Le champ affectationModele est automatiquement géré par Prisma
                // dans un create imbriqué (nested create)
              })),
            },
          }),
      };

      console.log(
        'POST .../affectations: Structure finale de createData:',
        JSON.stringify(createData, null, 2)
      );

      const newAffectationModele = await prisma.affectationModele.create({
        data: createData,
        include: {
          personnelRequis: true, // Inclure le personnel requis dans la réponse
          activityType: true,
          operatingRoom: true,
        },
      });

      console.log(
        'POST .../affectations: AffectationModele created successfully:',
        newAffectationModele
      );
      console.log('--- POST /api/trameModele-modeles/[trameModeleId]/affectations END ---\n');
      return NextResponse.json(newAffectationModele, { status: 201 });
    } catch (prismaError) {
      console.error('Erreur Prisma détaillée:', prismaError);
      throw prismaError; // Relancer pour la gestion globale des erreurs
    }
  } catch (error) {
    console.error(
      'Error during POST /api/trameModele-modeles/[trameModeleId]/affectations:',
      error
    );

    // Afficher plus d'informations sur l'erreur
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error('Stack trace:', error.stack);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Gérer les erreurs Prisma spécifiques (ex: contrainte unique, clé étrangère non trouvée)
      if (error.code === 'P2025') {
        // Foreign key constraint failed
        console.error(
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
        console.error('Prisma Error P2002: Unique constraint failed', error.meta);
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

    console.log(
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
});

export const GET = withAuth({
  requireAuth: true,
  resourceType: 'trame_affectation',
  action: 'read',
})(async (request: NextRequest, { params }: { params: Promise<{ trameModeleId: string }> }) => {
  const userId = parseInt(request.headers.get('x-user-id') || '0');
  const { trameModeleId } = await params;
  console.log(`[API GET /trameModele-modeles/${trameModeleId}/affectations] Début du traitement.`);

  console.log('\n--- GET /api/trameModele-modeles/[trameModeleId]/affectations START ---');

  if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
    console.warn(
      'GET /api/trameModele-modeles/[trameModeleId]/affectations: Invalid trameModeleId'
    );
    return NextResponse.json({ error: 'ID du template de trameModele invalide' }, { status: 400 });
  }
  const trameId = parseInt(trameModeleId);

  try {
    console.log(`GET .../affectations: Retrieving affectations for trameModeleId ${trameId}...`);

    // Vérifier l'existence du TrameModele parent
    const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
    if (!parentTrame) {
      console.warn(`GET .../affectations: TrameModele with id ${trameId} not found.`);
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

    console.log(
      `GET .../affectations: ${affectations.length} affectations retrieved successfully.`
    );
    console.log('--- GET /api/trameModele-modeles/[trameModeleId]/affectations END ---\n');
    return NextResponse.json(affectations);
  } catch (error: any) {
    console.error(
      `Erreur lors de la récupération des affectations pour la trameModele ${trameModeleId}:`,
      error
    );
    return NextResponse.json(
      { error: 'Erreur interne du serveur.', details: error.message },
      { status: 500 }
    );
  }
});
