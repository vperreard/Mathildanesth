import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';

import { prisma } from "@/lib/prisma";

// Fonction utilitaire pour parser les règles JSON en toute sécurité
function parseRules(rulesJson: Prisma.JsonValue): { maxRoomsPerSupervisor: number } {
    const defaultRules = { maxRoomsPerSupervisor: 2 };
    if (typeof rulesJson === 'object' && rulesJson !== null && 'maxRoomsPerSupervisor' in rulesJson && typeof rulesJson.maxRoomsPerSupervisor === 'number') {
        return { maxRoomsPerSupervisor: rulesJson.maxRoomsPerSupervisor };
    }
    // Essayer de parser si c'est une chaîne JSON
    if (typeof rulesJson === 'string') {
        try {
            const parsed = JSON.parse(rulesJson);
            if (typeof parsed === 'object' && parsed !== null && 'maxRoomsPerSupervisor' in parsed && typeof parsed.maxRoomsPerSupervisor === 'number') {
                return { maxRoomsPerSupervisor: parsed.maxRoomsPerSupervisor };
            }
        } catch (e: unknown) {
            logger.warn("Failed to parse rules JSON string:", rulesJson, e);
        }
    }
    logger.warn("Invalid or missing rules JSON, returning default:", rulesJson);
    return defaultRules;
}

export async function GET(request: NextRequest) {
    logger.info("\n--- GET /api/sectors START (Prisma - operatingSector - JSON Rules) ---");
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            logger.error('GET /api/sectors: Unauthorized');
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        const userId = session.user.id.toString();
        const userRole = session.user.role;

        logger.info(`GET /api/sectors: Auth check passed (Middleware)! User ID: ${userId}, Role: ${userRole}`);
        logger.info('GET /api/sectors: Retrieving sectors from DB using operatingSector model...');

        const sectorsFromDb = await prisma.operatingSector.findMany({
            orderBy: [
                { siteId: 'asc' },
                { displayOrder: 'asc' },
                { name: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                colorCode: true,
                isActive: true,
                description: true,
                rules: true,
                siteId: true,
                displayOrder: true
            }
        });

        const formattedSectors = sectorsFromDb.map(sector => {
            const parsedRules = parseRules(sector.rules);
            return {
                id: sector.id,
                name: sector.name,
                colorCode: sector.colorCode,
                color: sector.colorCode,
                isActive: sector.isActive,
                description: sector.description,
                rules: parsedRules,
                siteId: sector.siteId,
                displayOrder: sector.displayOrder
            };
        });

        logger.info(`GET /api/sectors: ${formattedSectors.length} sectors retrieved from DB.`);
        logger.info("--- GET /api/sectors END (Prisma - operatingSector - JSON Rules) ---\n");
        return NextResponse.json(formattedSectors);

    } catch (error: unknown) {
        logger.error('Error during GET /api/sectors (Prisma - operatingSector): ', error instanceof Error ? error : new Error(String(error)));
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
            logger.error("Prisma Error P2021: Table or Model 'OperatingSector' not found.");
            return NextResponse.json({ error: 'Erreur de base de données: La table des secteurs est introuvable.' }, { status: 500 });
        }
        logger.info("--- GET /api/sectors END (Prisma - operatingSector - with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la récupération des secteurs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    logger.info("\n--- POST /api/sectors START (Prisma - operatingSector - JSON Rules) ---");
    try {
        const requestHeaders = await headers();
        const userId = requestHeaders.get('x-user-id');
        const userRole = requestHeaders.get('x-user-role');
        logger.info("POST /api/sectors - Reading Middleware Headers:", { userId, userRole });

        if (!userId || !userRole) {
            logger.error('POST /api/sectors: Unauthorized (Middleware headers missing)');
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (userRole !== 'ADMIN_TOTAL' && userRole !== 'ADMIN_PARTIEL') {
            logger.error(`POST /api/sectors: Forbidden (Role '${userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour créer' }, { status: 403 });
        }

        logger.info(`POST /api/sectors: Auth check passed (Middleware)! User ID: ${userId}, Role: ${userRole}`);
        const data = await request.json();
        logger.info("POST /api/sectors - Received data:", data);

        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
            logger.warn("POST /api/sectors: Validation failed - Name is required");
            return NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 });
        }

        let maxRooms = 2; // Default value
        if (data.rules?.maxRoomsPerSupervisor !== undefined) {
            const parsedMax = parseInt(data.rules.maxRoomsPerSupervisor, 10);
            if (!isNaN(parsedMax)) {
                maxRooms = parsedMax;
            }
        }
        const rulesData: Prisma.InputJsonObject = {
            maxRoomsPerSupervisor: maxRooms
        };

        logger.info("POST /api/sectors - Creating sector with rules:", rulesData);

        const newSector = await prisma.operatingSector.create({
            data: {
                name: data.name.trim(),
                colorCode: data.colorCode || '#000000',
                isActive: data.isActive !== undefined ? data.isActive : true,
                description: data.description || '',
                rules: rulesData,
            },
        });

        const parsedRules = parseRules(newSector.rules);
        const responseData = {
            id: newSector.id,
            name: newSector.name,
            colorCode: newSector.colorCode,
            color: newSector.colorCode,
            isActive: newSector.isActive,
            description: newSector.description,
            rules: parsedRules
        };

        logger.info("POST /api/sectors: Sector created in DB:", responseData);
        logger.info("--- POST /api/sectors END (Prisma - operatingSector - JSON Rules) ---\n");
        return NextResponse.json(responseData, { status: 201 });

    } catch (error: unknown) {
        logger.error('Error during POST /api/sectors (Prisma - operatingSector): ', error instanceof Error ? error : new Error(String(error)));
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target && target.includes('name')) {
                    return NextResponse.json({ error: 'Un secteur avec ce nom existe déjà.' }, { status: 409 });
                }
                logger.error("Prisma Error P2002: Unique constraint violation on fields:", target);
                return NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 });
            }
            if (error.code === 'P2021') {
                logger.error("Prisma Error P2021: Table or Model 'OperatingSector' not found.");
                return NextResponse.json({ error: 'Erreur de base de données: La table des secteurs est introuvable.' }, { status: 500 });
            }
        }
        logger.info("--- POST /api/sectors END (Prisma - operatingSector - with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la création du secteur' }, { status: 500 });
    }
} 