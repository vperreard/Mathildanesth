import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
    params: {
        scenarioId: string;
        resultId: string;
    };
}

export async function GET(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { scenarioId, resultId } = await Promise.resolve(params);

    if (!scenarioId || !resultId) {
        return NextResponse.json({ message: "Les IDs de scénario et de résultat sont requis" }, { status: 400 });
    }

    try {
        // D'abord, récupérer le scénario pour vérifier les permissions
        const scenario = await prisma.simulationScenario.findUnique({
            where: { id: scenarioId },
        });

        if (!scenario) {
            return NextResponse.json({ message: "Scénario non trouvé" }, { status: 404 });
        }

        // Vérifier que l'utilisateur est le créateur du scénario ou a des droits administratifs
        // @ts-ignore - Ignorer l'incompatibilité de type entre number et string
        const isCreator = scenario.createdById == session.user.id;
        // Vérifier si l'utilisateur a un rôle d'administrateur
        const userRole = session.user.role as string;
        const isAdmin = userRole === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return NextResponse.json({
                message: "Accès refusé. Vous n'êtes pas autorisé à consulter ce résultat."
            }, { status: 403 });
        }

        // Récupération du résultat avec son scénario parent
        const simulationResult = await prisma.simulationResult.findUnique({
            where: {
                id: resultId,
                scenarioId: scenarioId,
            },
            include: {
                scenario: true
            }
        });

        if (!simulationResult) {
            return NextResponse.json({ message: "Résultat de simulation non trouvé ou non associé à ce scénario" }, { status: 404 });
        }

        // Construction de la réponse avec les données du résultat
        const responseData = {
            id: simulationResult.id,
            status: simulationResult.status,
            createdAt: simulationResult.createdAt.toISOString(),
            // completedAt n'est pas dans le modèle, on l'omet
            updatedAt: new Date().toISOString(), // simulation de updatedAt qui n'est pas dans le modèle
            errorMessage: simulationResult.errorMessage,
            parametersJson: simulationResult.scenario.parametersJson,
            generatedPlanningData: simulationResult.generatedPlanningData,
            statisticsJson: simulationResult.statisticsJson,
            conflictAlertsJson: simulationResult.conflictAlertsJson,
            comparisonDataJson: simulationResult.comparisonDataJson,
            scenarioName: simulationResult.scenario.name,
            scenarioDescription: simulationResult.scenario.description,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Erreur lors de la récupération du résultat de simulation:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: "Ressource non trouvée." }, { status: 404 });
        }
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    }
} 