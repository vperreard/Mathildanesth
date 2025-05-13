import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { OperatingRoomSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { BlocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Créer une instance du service
const planningService = new BlocPlanningService();

// Fonction utilitaire pour normaliser les noms de secteurs
const normalizeSectorName = (name: string): string => {
    if (!name) return 'Non défini';

    // Enlever les espaces invisibles et normaliser les espaces multiples
    let normalized = name.trim().replace(/\s+/g, ' ');

    // Mappings spécifiques pour standardiser certains noms (insensible à la casse)
    const sectorMappings: { [key: string]: string } = {
        'europe endoscopies': 'Secteur endoscopie',
        'europe endoscopie': 'Secteur endoscopie',
        'secteur endoscopie': 'Secteur endoscopie',
        'endoscopie': 'Secteur endoscopie',
        'endo': 'Secteur endoscopie',
        'europe ambulatoire': 'Europe ambulatoire',
        'ambulatoire': 'Europe ambulatoire',
        'europe bloc': 'Europe bloc',
        'secteur septique': 'Secteur septique',
        'septique': 'Secteur septique',
        'secteur intermédiaire': 'Secteur intermédiaire',
        'intermédiaire': 'Secteur intermédiaire',
        'secteur ophtalmo': 'Secteur ophtalmo',
        'ophtalmo': 'Secteur ophtalmo',
        'ophtalmologie': 'Secteur ophtalmo',
        'secteur hyperaseptique': 'Secteur hyperaseptique',
        'hyperaseptique': 'Secteur hyperaseptique'
    };

    // Recherche insensible à la casse dans la table de correspondance
    const lowercaseNormalized = normalized.toLowerCase();
    for (const [key, value] of Object.entries(sectorMappings)) {
        if (lowercaseNormalized === key.toLowerCase()) {
            return value;
        }
    }

    return normalized;
};

// Fonction utilitaire pour trouver un secteur (soit par ID, soit par nom)
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

export async function GET() {
    try {
        // Utiliser le système JWT personnalisé au lieu de next-auth
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');

            // Si nous sommes en développement et que le rôle admin est fourni dans l'en-tête
            if (process.env.NODE_ENV === 'development' && userRole === 'ADMIN_TOTAL') {
                console.log('[DEV MODE] Authentification par en-tête uniquement pour GET /api/operating-rooms');
            } else {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
        }

        // Utiliser le service qui trie correctement les salles par displayOrder
        const rooms = await planningService.getAllOperatingRooms(true);

        // Journalisation pour le débogage avancé
        console.log(`GET /api/operating-rooms: ${rooms.length} salles récupérées et triées par displayOrder et sector`);

        // Ajouter un échantillon des salles pour debug (limité aux 3 premières)
        if (rooms.length > 0) {
            const sampleRooms = rooms.slice(0, Math.min(3, rooms.length));
            console.log(`GET /api/operating-rooms - Échantillon de salles:`,
                sampleRooms.map(r => ({ id: r.id, name: r.name, sector: r.sector, exactSector: `"${r.sector}"` }))
            );
        }

        // Analyse pour s'assurer que toutes les salles ont un secteur défini
        const roomsWithoutSector = rooms.filter(room => !room.sector);
        if (roomsWithoutSector.length > 0) {
            console.warn(`ATTENTION: ${roomsWithoutSector.length} salles n'ont pas de secteur défini:`, roomsWithoutSector.map(r => ({ id: r.id, name: r.name })));
        }

        // Analyser les secteurs présents
        const sectors = [...new Set(rooms.map(r => r.sector))].sort();
        console.log(`Secteurs présents dans les salles: ${sectors.join(', ')}`);

        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Erreur lors de la récupération des salles d\'opération:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des salles d\'opération' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // Vérifier l'authentification et les permissions
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour POST /api/operating-rooms');
        }

        // Récupérer les données de la requête
        const body = await request.json();
        console.log("POST /api/operating-rooms - Body reçu:", body);

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

        // Vérifier qu'une salle avec ce numéro n'existe pas déjà
        const existingRoom = await prisma.operatingRoom.findFirst({
            where: { number: number.trim() }
        });

        if (existingRoom) {
            return NextResponse.json({ error: 'Une salle avec ce numéro existe déjà.' }, { status: 409 });
        }

        // Trouver le secteur soit par ID soit par nom
        const sectorEntity = await findSector(sectorId, sector);

        if (!sectorEntity) {
            console.error(`Secteur non trouvé: ID=${sectorId || 'non fourni'}, nom=${sector || 'non fourni'}`);
            return NextResponse.json({ error: 'Secteur introuvable. Veuillez sélectionner un secteur valide.' }, { status: 400 });
        }

        // Créer la salle d'opération
        const newRoom = await prisma.operatingRoom.create({
            data: {
                name: name.trim(),
                number: number.trim(),
                sectorId: sectorEntity.id,
                colorCode: colorCode || null,
                isActive: isActive === undefined ? true : isActive,
                supervisionRules: supervisionRules || {},
                type: type || 'STANDARD', // Ajout du champ type avec valeur par défaut
            },
        });

        // Renvoyer la salle créée avec le nom du secteur
        const result = {
            ...newRoom,
            sector: sectorEntity.name,  // Inclure le nom du secteur dans la réponse
            type: newRoom.type || 'STANDARD' // Inclure le type dans la réponse
        };

        console.log("Salle créée avec succès:", result);
        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Erreur POST /api/operating-rooms:", error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 