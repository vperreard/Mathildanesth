import { NextResponse, NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');
        const sectorId = searchParams.get('sectorId');

        const whereClause: Prisma.OperatingRoomWhereInput = {};

        if (sectorId) {
            const sectorIdNum = parseInt(sectorId);
            if (!isNaN(sectorIdNum)) {
                whereClause.operatingSectorId = sectorIdNum;
            }
        } else if (siteId) {
            whereClause.siteId = siteId;
        }

        const rooms = await prisma.operatingRoom.findMany({
            where: whereClause,
            include: {
                operatingSector: {
                    include: {
                        site: true
                    }
                },
                site: true
            },
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        console.log(`GET /api/operating-rooms: Récupération de ${rooms.length} salles`);
        if (rooms.length > 0) {
            console.log("Première salle récupérée:", {
                id: rooms[0].id,
                name: rooms[0].name,
                displayOrder: rooms[0].displayOrder,
                operatingSectorId: rooms[0].operatingSectorId,
                sectorDisplayOrder: rooms[0].operatingSector?.displayOrder
            });
        }

        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Erreur lors de la récupération des salles d\'opération:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des salles d\'opération' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Récupérer et vérifier le token JWT
        const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé - Token invalide' }, { status: 401 });
        }
        // L'utilisateur est authentifié, on peut continuer
        // authResult.userId et authResult.role sont disponibles si nécessaire

        const data = await request.json();
        const { name, number, operatingSectorId, siteId } = data;

        if (!name || !siteId) {
            return NextResponse.json({ error: 'Nom et ID de site requis' }, { status: 400 });
        }

        // Récupérer le secteur pour vérifier qu'il existe
        // Si operatingSectorId est fourni
        if (operatingSectorId) {
            const sector = await prisma.operatingSector.findUnique({
                where: { id: operatingSectorId },
            });

            if (!sector) {
                return NextResponse.json({ error: 'Secteur opératoire non trouvé' }, { status: 404 });
            }
        }

        // Vérifier que le site existe
        const site = await prisma.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
        }

        // Préparer les données pour la création
        const createData: any = {
            name,
            number: number || name, // Utiliser le nom comme numéro si non fourni
            siteId,
            operatingSectorId: operatingSectorId || undefined,
            displayOrder: data.displayOrder || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
            colorCode: data.colorCode || undefined
        };

        // Ajouter supervisionRules seulement si fourni
        if (data.supervisionRules) {
            createData.supervisionRules = data.supervisionRules as Prisma.InputJsonValue;
        }

        // Créer la salle
        const newRoom = await prisma.operatingRoom.create({
            data: createData,
            include: {
                site: true,
                operatingSector: true
            }
        });

        return NextResponse.json(newRoom, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la salle d\'opération:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création de la salle d\'opération',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}
