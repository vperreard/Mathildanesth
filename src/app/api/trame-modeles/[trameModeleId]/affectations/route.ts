import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils'; // Assurez-vous que le chemin est correct

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { trameModeleId: string } }
) {
    console.log("\n--- POST /api/trame-modeles/[trameModeleId]/affectations START ---");

    let token = request.cookies.get('token')?.value;
    if (!token) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        console.error("POST /api/trame-modeles/[trameModeleId]/affectations: Unauthorized (token missing from cookie and Authorization header)");
        return NextResponse.json({ error: 'Non autorisé, token manquant' }, { status: 401 });
    }
    const authResult = await verifyAuthToken(token);

    if (!authResult.authenticated) {
        console.error("POST /api/trame-modeles/[trameModeleId]/affectations: Unauthorized (token invalid)");
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }
    // TODO: Ajouter une vérification de rôle si nécessaire (ex: seul un admin peut modifier les trames)
    // if (authResult.role !== 'ADMIN_TOTAL' && authResult.role !== 'ADMIN_PARTIEL') {
    //     console.error(`POST /api/trame-modeles/[trameModeleId]/affectations: Forbidden (Role '${authResult.role}' not allowed)`);
    //     return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    // }

    const { trameModeleId } = params;
    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
        console.warn("POST /api/trame-modeles/[trameModeleId]/affectations: Invalid trameModeleId");
        return NextResponse.json({ error: 'ID du modèle de trame invalide' }, { status: 400 });
    }
    const trameId = parseInt(trameModeleId);

    try {
        const body = await request.json();
        console.log("POST /api/trame-modeles/[trameModeleId]/affectations - Received data:", body);

        const {
            activityTypeId,
            jourSemaine,
            periode,
            typeSemaine,
            operatingRoomId,
            locationId, // Non utilisé dans le modèle AffectationModele actuel, mais gardé si évolution
            priorite,
            isActive,
            detailsJson,
            personnelRequis, // Tableau de PersonnelRequisModele
        } = body;

        // Validations de base
        if (!activityTypeId || !jourSemaine || !periode || !typeSemaine) {
            console.warn("POST .../affectations: Validation failed - Champs requis manquants");
            return NextResponse.json({ error: 'Champs requis manquants pour l\'affectation (activityTypeId, jourSemaine, periode, typeSemaine)' }, { status: 400 });
        }

        // Vérifier l'existence du TrameModele parent
        const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
        if (!parentTrame) {
            console.warn(`POST .../affectations: TrameModele with id ${trameId} not found.`);
            return NextResponse.json({ error: 'Modèle de trame parent non trouvé' }, { status: 404 });
        }

        // Préparer les données pour Prisma, y compris les nested writes pour personnelRequis
        const createData: Prisma.AffectationModeleCreateInput = {
            trameModele: { connect: { id: trameId } },
            activityType: { connect: { id: activityTypeId } },
            jourSemaine,
            periode,
            typeSemaine,
            priorite: priorite !== undefined ? parseInt(priorite) : 5,
            isActive: isActive !== undefined ? isActive : true,
            detailsJson: detailsJson || undefined,
            ...(operatingRoomId && { operatingRoom: { connect: { id: parseInt(operatingRoomId) } } }),
            // locationId n'est pas dans le modèle AffectationModele, donc pas de connexion pour l'instant
            ...(personnelRequis && personnelRequis.length > 0 && {
                personnelRequis: {
                    create: personnelRequis.map((pr: any) => ({
                        roleGenerique: pr.roleGenerique,
                        nombreRequis: pr.nombreRequis !== undefined ? parseInt(pr.nombreRequis) : 1,
                        notes: pr.notes || undefined,
                        ...(pr.professionalRoleId && { professionalRoleConfig: { connect: { code: pr.professionalRoleId } } }),
                        ...(pr.specialtyId && { specialty: { connect: { id: parseInt(pr.specialtyId) } } }),
                        ...(pr.personnelHabituelUserId && { userHabituel: { connect: { id: parseInt(pr.personnelHabituelUserId) } } }),
                        ...(pr.personnelHabituelSurgeonId && { surgeonHabituel: { connect: { id: parseInt(pr.personnelHabituelSurgeonId) } } }),
                        personnelHabituelNomExterne: pr.personnelHabituelNomExterne || undefined,
                    })),
                },
            }),
        };

        console.log("POST .../affectations: Creating new AffectationModele in DB with data:", JSON.stringify(createData, null, 2));
        const newAffectationModele = await prisma.affectationModele.create({
            data: createData,
            include: {
                personnelRequis: true, // Inclure le personnel requis dans la réponse
                activityType: true,
                operatingRoom: true,
            },
        });

        console.log("POST .../affectations: AffectationModele created successfully:", newAffectationModele);
        console.log("--- POST /api/trame-modeles/[trameModeleId]/affectations END ---\n");
        return NextResponse.json(newAffectationModele, { status: 201 });

    } catch (error) {
        console.error("Error during POST /api/trame-modeles/[trameModeleId]/affectations:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Gérer les erreurs Prisma spécifiques (ex: contrainte unique, clé étrangère non trouvée)
            if (error.code === 'P2025') { // Foreign key constraint failed
                console.error("Prisma Error P2025: An operation failed because it depends on one or more records that were required but not found.", error.meta);
                return NextResponse.json({ error: `Erreur de référence: ${error.meta?.cause || 'une entité liée est introuvable'}` }, { status: 400 });
            }
        }
        console.log("--- POST /api/trame-modeles/[trameModeleId]/affectations END (with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la création de l\'affectation modèle' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { trameModeleId: string } }
) {
    console.log("\n--- GET /api/trame-modeles/[trameModeleId]/affectations START ---");

    let token = request.cookies.get('token')?.value;
    if (!token) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        console.error("GET /api/trame-modeles/[trameModeleId]/affectations: Unauthorized (token missing from cookie and Authorization header)");
        return NextResponse.json({ error: 'Non autorisé, token manquant' }, { status: 401 });
    }
    const authResult = await verifyAuthToken(token);

    if (!authResult.authenticated) {
        console.error("GET /api/trame-modeles/[trameModeleId]/affectations: Unauthorized (token invalid)");
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const { trameModeleId } = params;
    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
        console.warn("GET /api/trame-modeles/[trameModeleId]/affectations: Invalid trameModeleId");
        return NextResponse.json({ error: 'ID du modèle de trame invalide' }, { status: 400 });
    }
    const trameId = parseInt(trameModeleId);

    try {
        console.log(`GET .../affectations: Retrieving affectations for trameModeleId ${trameId}...`);

        // Vérifier l'existence du TrameModele parent
        const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
        if (!parentTrame) {
            console.warn(`GET .../affectations: TrameModele with id ${trameId} not found.`);
            return NextResponse.json({ error: 'Modèle de trame parent non trouvé' }, { status: 404 });
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
            orderBy: [ // Optionnel: ajouter un tri par défaut
                { jourSemaine: 'asc' },
                { periode: 'asc' },
                { priorite: 'asc' },
            ]
        });

        console.log(`GET .../affectations: ${affectations.length} affectations retrieved successfully.`);
        console.log("--- GET /api/trame-modeles/[trameModeleId]/affectations END ---\n");
        return NextResponse.json(affectations);

    } catch (error) {
        console.error("Error during GET /api/trame-modeles/[trameModeleId]/affectations:", error);
        console.log("--- GET /api/trame-modeles/[trameModeleId]/affectations END (with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la récupération des affectations modèle' }, { status: 500 });
    }
} 