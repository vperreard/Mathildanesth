import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth-utils';
import { OperatingRoomSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { BlocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

jest.mock('@/lib/prisma');


// Contexte pour les paramètres d'URL
interface Context {
    params: {
        id: string;
    };
}

const prisma = prisma;
const planningService = new BlocPlanningService();

// Fonction utilitaire pour normaliser les noms de secteurs (identique à route.ts)
const normalizeSectorName = (name: string): string => {
    // Enlever les espaces invisibles et normaliser les espaces multiples
    const normalized = name.trim().replace(/\s+/g, ' ');

    // Traitement spécial pour Endoscopie
    if (normalized.toLowerCase().includes("endoscopie")) {
        return "Endoscopie";
    }

    return normalized;
};

// Fonction utilitaire pour trouver un secteur (identique à route.ts)
const findSector = async (sectorId?: number, sectorName?: string) => {
    if (sectorId) {
        // Recherche directe par ID
        return prisma.operatingSector.findUnique({ where: { id: sectorId } });
    } else if (sectorName) {
        // Normaliser le nom pour la recherche
        const normalizedName = normalizeSectorName(sectorName);

        // D'abord, essayer une recherche exacte
        let sector = await prisma.operatingSector.findFirst({
            where: { name: normalizedName }
        });

        // Si pas de résultat, essayer une recherche insensible à la casse
        if (!sector) {
            sector = await prisma.operatingSector.findFirst({
                where: {
                    name: {
                        contains: normalizedName,
                        mode: 'insensitive'
                    }
                }
            });
        }

        // Cas spécial pour Endoscopie
        if (!sector && normalizedName.toLowerCase().includes('endo')) {
            sector = await prisma.operatingSector.findFirst({
                where: {
                    name: {
                        contains: 'Endoscopie',
                        mode: 'insensitive'
                    }
                }
            });

            if (sector) {
                console.log(`Secteur Endoscopie trouvé par recherche partielle: ${sector.name}`);
            }
        }

        return sector;
    }

    return null;
};

// GET : Récupérer une salle spécifique
export async function GET(request: Request, context: Context) {
    const { id } = await context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Utiliser Prisma directement pour récupérer la salle
        const room = await prisma.operatingRoom.findUnique({
            where: { id: roomId },
            include: {
                operatingSector: true,
                site: true
            }
        });

        if (!room) {
            return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
        }
        return NextResponse.json(room);
    } catch (error) {
        console.error(`Erreur GET /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// PUT : Mettre à jour une salle
export async function PUT(request: Request, context: Context) {
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour PUT /api/operating-rooms');
        }

        // Récupérer l'ID
        const { id } = await context.params;
        const roomId = parseInt(id);

        if (isNaN(roomId)) {
            return NextResponse.json({ error: 'ID de salle invalide' }, { status: 400 });
        }

        // Vérifier si la salle existe
        const existingRoom = await prisma.operatingRoom.findUnique({
            where: { id: roomId },
            include: { operatingSector: true }
        });

        if (!existingRoom) {
            return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
        }

        // Récupérer le corps de la requête
        const body = await request.json();
        console.log(`PUT /api/operating-rooms/${id} - Body reçu:`, body);

        try {
            // Valider avec le schéma Zod
            OperatingRoomSchema.parse(body);
        } catch (validationError) {
            console.error("Erreur de validation Zod:", validationError);
            return NextResponse.json({ error: 'Les données sont invalides', details: validationError }, { status: 400 });
        }

        // Validation spécifique du champ type
        const validTypes = ['STANDARD', 'FIV', 'CONSULTATION'];
        if (body.type && !validTypes.includes(body.type)) {
            return NextResponse.json({
                error: 'Type de salle invalide',
                details: `Le type doit être l'un des suivants: ${validTypes.join(', ')}`
            }, { status: 400 });
        }

        // Extraire les données validées
        const { name, number, sector, sectorId, colorCode, isActive, supervisionRules, type } = body;

        // Vérifier si le numéro est déjà utilisé par une autre salle
        if (number !== existingRoom.number) {
            const roomWithSameNumber = await prisma.operatingRoom.findFirst({
                where: {
                    number: number.trim(),
                    NOT: {
                        id: roomId
                    }
                }
            });

            if (roomWithSameNumber) {
                return NextResponse.json({ error: 'Une autre salle avec ce numéro existe déjà.' }, { status: 409 });
            }
        }

        // Trouver le secteur soit par ID soit par nom
        const sectorEntity = await findSector(sectorId, sector);

        if (!sectorEntity) {
            console.error(`Secteur non trouvé: ID=${sectorId || 'non fourni'}, nom=${sector || 'non fourni'}`);
            return NextResponse.json({ error: 'Secteur introuvable. Veuillez sélectionner un secteur valide.' }, { status: 400 });
        }

        // Mettre à jour la salle
        const updatedRoom = await prisma.operatingRoom.update({
            where: { id: roomId },
            data: {
                name: name.trim(),
                number: number.trim(),
                operatingSectorId: sectorEntity.id,
                colorCode: colorCode || null,
                isActive: isActive === undefined ? true : isActive,
                supervisionRules: supervisionRules || existingRoom.supervisionRules,
                roomType: type || 'STANDARD', // Utilisation du bon nom de champ
            },
            include: { operatingSector: true }
        });

        console.log(`Salle ${roomId} mise à jour avec succès:`, updatedRoom);
        return NextResponse.json(updatedRoom);

    } catch (error) {
        const { id } = await context.params;
        console.error(`Erreur PUT /api/operating-rooms/${id}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// DELETE : Supprimer une salle
export async function DELETE(request: Request, context: Context) {
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour DELETE /api/operating-rooms');
        }

        const { id } = await context.params;
        const roomId = parseInt(id);

        if (isNaN(roomId)) {
            return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
        }

        try {
            const room = await prisma.operatingRoom.findUnique({
                where: { id: roomId }
            });

            if (!room) {
                return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
            }

            // 🔐 CORRECTION TODO CRITIQUE : Vérifier si la salle est utilisée dans des plannings existants
            const connectedPlannings = await prisma.blocRoomAssignment.findMany({
                where: { operatingRoomId: roomId },
                include: { blocDayPlanning: { select: { date: true, siteId: true } } },
                take: 5
            });

            if (connectedPlannings.length > 0) {
                const planningDates = connectedPlannings.map(p =>
                    p.blocDayPlanning.date.toISOString().split('T')[0]
                ).join(', ');
                return new NextResponse(JSON.stringify({
                    message: 'Impossible de supprimer cette salle car elle est utilisée dans des plannings existants.',
                    details: `Plannings concernés: ${planningDates}${connectedPlannings.length === 5 ? ' (et d\'autres...)' : ''}`,
                    connectedPlanningsCount: connectedPlannings.length
                }), { status: 409 });
            }

            // Supprimer la salle
            await prisma.operatingRoom.delete({
                where: { id: roomId }
            });

            return new NextResponse(null, { status: 204 });
        } catch (error) {
            console.error(`Erreur DELETE /api/operating-rooms/${id}:`, error);
            return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
        }
    } catch (error) {
        const { id } = await context.params;
        console.error(`Erreur DELETE /api/operating-rooms/${id}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 