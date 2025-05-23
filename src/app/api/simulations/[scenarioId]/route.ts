import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PrismaClientKnownRequestError } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schéma de validation pour la mise à jour d'un scénario
const updateScenarioSchema = z.object({
    name: z.string().min(1, { message: "Le nom ne peut pas être vide." }).optional(),
    description: z.string().optional().nullable(), // Permet de vider la description
    parametersJson: z.record(z.unknown()).optional(),
});

// GET /api/simulations/{scenarioId} - Récupérer un scénario spécifique
export async function GET(request: NextRequest, { params }: { params: { scenarioId: string } }) {
    const { scenarioId } = await Promise.resolve(params);
    if (!scenarioId) {
        return NextResponse.json({ error: "ID du scénario manquant." }, { status: 400 });
    }

    try {
        const scenario = await prisma.simulationScenario.findUnique({
            where: { id: scenarioId },
            include: {
                createdBy: { select: { id: true, nom: true, prenom: true } },
                results: {
                    orderBy: { createdAt: 'desc' }, // Lister les résultats du plus récent au plus ancien
                    select: { id: true, createdAt: true, status: true, errorMessage: true } // Ne pas charger toutes les données JSON ici
                },
            },
        });

        if (!scenario) {
            return NextResponse.json({ error: "Scénario non trouvé." }, { status: 404 });
        }
        return NextResponse.json(scenario);
    } catch (error) {
        console.error(`Erreur lors de la récupération du scénario ${scenarioId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de récupérer le scénario.", details: errorMessage }, { status: 500 });
    }
}

// PUT /api/simulations/{scenarioId} - Mettre à jour un scénario spécifique
export async function PUT(request: NextRequest, { params }: { params: { scenarioId: string } }) {
    const { scenarioId } = params;
    if (!scenarioId) {
        return NextResponse.json({ error: "ID du scénario manquant." }, { status: 400 });
    }

    try {
        const body = await request.json();
        const validationResult = updateScenarioSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({ errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
        }

        // Vérifier si le scénario existe avant de tenter la mise à jour
        const existingScenario = await prisma.simulationScenario.findUnique({ where: { id: scenarioId } });
        if (!existingScenario) {
            return NextResponse.json({ error: "Scénario non trouvé pour la mise à jour." }, { status: 404 });
        }

        // TODO: Vérifier les permissions de l'utilisateur (peut-il modifier ce scénario ?)

        const updatedScenario = await prisma.simulationScenario.update({
            where: { id: scenarioId },
            data: validationResult.data,
        });

        return NextResponse.json(updatedScenario);
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du scénario ${scenarioId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de mettre à jour le scénario.", details: errorMessage }, { status: 500 });
    }
}

// DELETE /api/simulations/{scenarioId} - Supprimer un scénario spécifique
export async function DELETE(request: NextRequest, { params }: { params: { scenarioId: string } }) {
    const { scenarioId } = params;
    if (!scenarioId) {
        return NextResponse.json({ error: "ID du scénario manquant." }, { status: 400 });
    }

    try {
        // Vérifier si le scénario existe avant de tenter la suppression
        const existingScenario = await prisma.simulationScenario.findUnique({ where: { id: scenarioId } });
        if (!existingScenario) {
            return NextResponse.json({ error: "Scénario non trouvé pour la suppression." }, { status: 404 });
        }

        // TODO: Vérifier les permissions de l'utilisateur

        // La suppression en cascade des SimulationResult est gérée par Prisma grâce à onDelete: Cascade
        await prisma.simulationScenario.delete({
            where: { id: scenarioId },
        });

        return NextResponse.json({ message: "Scénario supprimé avec succès." }, { status: 200 }); // ou 204 No Content
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ error: "Impossible de supprimer le scénario car il est référencé par des résultats de simulation. Supprimez d'abord les résultats associés.", details: error.message }, { status: 409 });
        }
        console.error(`Erreur lors de la suppression du scénario ${scenarioId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de supprimer le scénario.", details: errorMessage }, { status: 500 });
    }
} 