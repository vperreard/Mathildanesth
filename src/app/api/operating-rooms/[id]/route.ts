import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth-utils';
import { OperatingRoomSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { BlocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

// Contexte pour les paramètres d'URL
interface Context {
    params: {
        id: string;
    };
}

const prisma = new PrismaClient();
const planningService = new BlocPlanningService();

// Fonction utilitaire pour normaliser les noms de secteurs (identique à route.ts)
const normalizeSectorName = (name: string): string => {
    // Enlever les espaces invisibles et normaliser les espaces multiples
    let normalized = name.trim().replace(/\s+/g, ' ');

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
    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Utiliser le service BlocPlanningService qui trie correctement par displayOrder
        const room = await planningService.getOperatingRoomById(roomId, true);

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
        const { id } = context.params;
        const roomId = parseInt(id);

        if (isNaN(roomId)) {
            return NextResponse.json({ error: 'ID de salle invalide' }, { status: 400 });
        }

        // Vérifier si la salle existe
        const existingRoom = await prisma.operatingRoom.findUnique({
            where: { id: roomId },
            include: { sector: true }
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
                sectorId: sectorEntity.id,
                colorCode: colorCode || null,
                isActive: isActive === undefined ? true : isActive,
                supervisionRules: supervisionRules || existingRoom.supervisionRules,
                type: type || 'STANDARD', // Ajout du champ type avec valeur par défaut ou valeur existante
            },
            include: { sector: true }
        });

        console.log(`Salle ${roomId} mise à jour avec succès:`, updatedRoom);
        return NextResponse.json(updatedRoom);

    } catch (error) {
        console.error(`Erreur PUT /api/operating-rooms/${context.params.id}:`, error);
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

        const { id } = context.params;
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

            // TODO: Vérifier si la salle est utilisée dans des plannings existants
            // Si c'est le cas, on pourrait renvoyer une erreur ou proposer une solution alternative

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
        console.error(`Erreur DELETE /api/operating-rooms/${context.params.id}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 