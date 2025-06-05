import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, User } from '@prisma/client';
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";

// Règles par défaut
const DEFAULT_CONFLICT_RULES = {
    // Règles liées à l'équipe
    maxTeamAbsencePercentage: 30,
    teamMinCapacity: {
        "default": 50,
        "development": 60,
        "customer_service": 70
    },
    specialtyMinCapacity: {
        "backend": 50,
        "frontend": 50,
        "design": 40
    },
    criticalRolesRequireBackup: true,

    // Règles liées au planning
    minDaysBeforeDeadline: 5,
    blockHolidayBridging: false,
    minDaysBetweenLeaves: 2,

    // Règles liées aux responsabilités
    allowLeavesDuringDuty: false,
    allowLeavesDuringOnCall: false,

    // Périodes spéciales
    blockHighWorkloadPeriods: true,
    highWorkloadPeriods: [
        {
            startDate: "2023-11-15T00:00:00.000Z",
            endDate: "2023-12-15T00:00:00.000Z",
            description: "Préparation clôture annuelle"
        }
    ],
    specialPeriods: [
        {
            id: "sp-1",
            name: "Vacances d'été",
            startDate: "2023-07-01T00:00:00.000Z",
            endDate: "2023-08-31T00:00:00.000Z",
            restrictionLevel: "MEDIUM"
        }
    ]
};

// Fonction pour vérifier si l'utilisateur est admin
const isAdmin = (user: User | null): boolean => {
    return !!user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
};

/**
 * GET /api/admin/conflict-rules
 * Récupère les règles de conflit configurées
 */
export async function GET(request: Request) {
    try {
        // Note: Dans un contexte réel, vérifier les permissions de l'utilisateur
        /*
        const session = await getServerSession();
        const user = session?.user?.email 
          ? await prisma.user.findUnique({ where: { email: session.user.email } })
          : null;
    
        if (!isAdmin(user)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */

        // Récupérer la configuration actuelle depuis la base de données
        const configRecord = await prisma.systemConfiguration.findUnique({
            where: { key: 'conflictRules' }
        });

        // Si aucune configuration n'existe, renvoyer les valeurs par défaut
        if (!configRecord) {
            // En production, il serait préférable de créer l'enregistrement ici
            return NextResponse.json(DEFAULT_CONFLICT_RULES);
        }

        // Parser les règles stockées en JSON
        return NextResponse.json(JSON.parse(configRecord.value as string));
    } catch (error: unknown) {
        logger.error('Erreur GET /api/admin/conflict-rules:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des règles de conflit' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/conflict-rules
 * Met à jour les règles de conflit
 */
export async function PUT(request: Request) {
    try {
        // Note: Dans un contexte réel, vérifier les permissions de l'utilisateur
        /*
        const session = await getServerSession();
        const user = session?.user?.email 
          ? await prisma.user.findUnique({ where: { email: session.user.email } })
          : null;
    
        if (!isAdmin(user)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */

        // Obtenir le corps de la requête
        const rules = await request.json();

        // Valider le contenu des règles
        // Note: Dans un environnement de production, il faudrait implémenter une validation plus robuste
        if (!rules || typeof rules !== 'object') {
            return NextResponse.json(
                { error: 'Format de règles invalide' },
                { status: 400 }
            );
        }

        // Convertir les règles en JSON
        const rulesJson = JSON.stringify(rules);

        // Sauvegarder dans la base de données
        const updatedConfig = await prisma.systemConfiguration.upsert({
            where: { key: 'conflictRules' },
            update: { value: rulesJson },
            create: {
                key: 'conflictRules',
                value: rulesJson,
                description: 'Règles de détection des conflits de congés'
            }
        });

        return NextResponse.json(rules);
    } catch (error: unknown) {
        logger.error('Erreur PUT /api/admin/conflict-rules:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour des règles de conflit' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/conflict-rules/reset
 * Réinitialise les règles de conflit à leurs valeurs par défaut
 */
export async function POST(request: Request) {
    // Vérifier le chemin de la requête pour savoir si c'est une réinitialisation
    const url = new URL(request.url);
    const isReset = url.pathname.endsWith('/reset');

    if (!isReset) {
        return NextResponse.json(
            { error: 'Méthode non prise en charge' },
            { status: 405 }
        );
    }

    try {
        // Note: Dans un contexte réel, vérifier les permissions de l'utilisateur
        /*
        const session = await getServerSession();
        const user = session?.user?.email 
          ? await prisma.user.findUnique({ where: { email: session.user.email } })
          : null;
    
        if (!isAdmin(user)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */

        // Convertir les règles par défaut en JSON
        const defaultRulesJson = JSON.stringify(DEFAULT_CONFLICT_RULES);

        // Sauvegarder dans la base de données
        await prisma.systemConfiguration.upsert({
            where: { key: 'conflictRules' },
            update: { value: defaultRulesJson },
            create: {
                key: 'conflictRules',
                value: defaultRulesJson,
                description: 'Règles de détection des conflits de congés'
            }
        });

        return NextResponse.json(DEFAULT_CONFLICT_RULES);
    } catch (error: unknown) {
        logger.error('Erreur POST /api/admin/conflict-rules/reset:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la réinitialisation des règles de conflit' },
            { status: 500 }
        );
    }
} 