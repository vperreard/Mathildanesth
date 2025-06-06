import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, SimulationScenario, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from "@/lib/prisma";

// Schéma de validation pour la création d'un scénario
const createScenarioSchema = z.object({
    name: z.string().min(1, { message: "Le nom du scénario est requis." }),
    description: z.string().optional(),
    parametersJson: z.record(z.unknown()), // Pour l'instant, on accepte n'importe quel objet JSON
    // createdById sera ajouté côté serveur à partir de l'utilisateur authentifié
});

// POST /api/simulations - Créer un nouveau scénario
export async function POST(request: NextRequest) {
    try {
        // Récupérer la session utilisateur
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Utilisateur non authentifié." }, { status: 401 });
        }

        // Récupérer l'ID utilisateur
        const userId = session.user.id;

        const body = await request.json();
        const validationResult = createScenarioSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({ errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
        }

        const { name, description, parametersJson } = validationResult.data;

        const newScenario = await prisma.simulationScenario.create({
            data: {
                name,
                description,
                parameters: parametersJson as Prisma.InputJsonValue,
                createdById: userId,
            },
        });

        return NextResponse.json(newScenario, { status: 201 });
    } catch (error: unknown) {
        logger.error("Erreur lors de la création du scénario de simulation:", error instanceof Error ? error : new Error(String(error)));
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de créer le scénario.", details: errorMessage }, { status: 500 });
    }
}

// GET /api/simulations - Lister tous les scénarios
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification pour la consultation
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Utilisateur non authentifié." }, { status: 401 });
        }

        // TODO: Ajouter pagination, filtres, tri si nécessaire
        const scenarios = await prisma.simulationScenario.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                createdBy: { // Inclure des informations de base sur le créateur
                    select: { id: true, nom: true, prenom: true }
                },
                _count: { // Compter le nombre de résultats de simulation associés
                    select: { results: true }
                }
            }
        });
        return NextResponse.json(scenarios);
    } catch (error: unknown) {
        logger.error("Erreur lors de la récupération des scénarios de simulation:", error instanceof Error ? error : new Error(String(error)));
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de récupérer les scénarios.", details: errorMessage }, { status: 500 });
    }
} 