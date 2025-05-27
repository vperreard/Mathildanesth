import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { optimizedSimulationService } from '@/services/simulations/optimizedSimulationService';

jest.mock('@/lib/prisma');


const prisma = prisma;

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Récupérer le corps de la requête
        const body = await request.json();
        const { scenarioId, strategy = 'DEFAULT' } = body;

        if (!scenarioId) {
            return NextResponse.json(
                { error: 'L\'ID du scénario est requis' },
                { status: 400 }
            );
        }

        // Récupérer l'ID de l'utilisateur connecté
        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier que le scénario existe
        const scenario = await prisma.simulationScenario.findUnique({
            where: { id: scenarioId },
            include: {
                results: true,
                template: true
            }
        });

        if (!scenario) {
            return NextResponse.json(
                { error: 'Scénario non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier s'il y a déjà une simulation en cours pour ce scénario
        const pendingSimulation = await prisma.simulationResult.findFirst({
            where: {
                scenarioId,
                status: { in: ['PENDING', 'RUNNING'] }
            }
        });

        if (pendingSimulation) {
            return NextResponse.json(
                { error: 'Une simulation est déjà en cours pour ce scénario', simulationId: pendingSimulation.id },
                { status: 409 }
            );
        }

        // Extraire les paramètres de simulation du scénario
        const params = scenario.parametersJson;

        // Vérifier si les dates de début et de fin sont définies
        if (!params.startDate || !params.endDate) {
            return NextResponse.json(
                { error: 'Les dates de début et de fin sont requises dans les paramètres du scénario' },
                { status: 400 }
            );
        }

        // Créer un nouvel enregistrement de résultat de simulation
        const simulationResult = await prisma.simulationResult.create({
            data: {
                scenarioId,
                status: 'PENDING',
                resultData: null,
                statisticsJson: null
            }
        });

        // Lancer la simulation de manière asynchrone
        // en utilisant le service optimisé
        void optimizedSimulationService.runSimulation(
            simulationResult.id,
            {
                scenarioId,
                startDate: params.startDate,
                endDate: params.endDate,
                userId: user.id.toString(),
                ...params
            },
            strategy
        );

        return NextResponse.json({
            success: true,
            message: 'Simulation démarrée avec succès',
            simulationId: simulationResult.id
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de la simulation:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur lors du démarrage de la simulation'
            },
            { status: 500 }
        );
    }
}

// Fonction pour exécuter la simulation en arrière-plan
async function startSimulation(resultId: string, scenario: any) {
    try {
        // Marquer la simulation comme en cours d'exécution
        await prisma.simulationResult.update({
            where: { id: resultId },
            data: { status: 'RUNNING' }
        });

        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Logique de simulation ici
        // Dans une implémentation réelle, on utiliserait le moteur de règles
        // et les services de planification pour générer un planning simulé

        // Pour cette démonstration, générons des résultats fictifs
        const startDate = new Date(scenario.startDate);
        const endDate = new Date(scenario.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const resultData = {
            simulatedPeriod: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
                totalDays: days
            },
            staffingCoverage: {
                overall: 92.5,
                byDay: generateDailyStaffingCoverage(startDate, days)
            },
            leaveRequests: {
                totalRequested: 24,
                approved: 18,
                rejected: 6,
                approvalRate: 75
            },
            shiftDistribution: generateShiftDistribution(),
            conflicts: {
                total: 8,
                byPriority: {
                    high: 2,
                    medium: 3,
                    low: 3
                },
                resolved: 5,
                unresolved: 3
            }
        };

        const metricsData = {
            staffUtilization: 88.3,
            ruleComplianceRate: 94.7,
            overcoverageWaste: 5.8,
            undercoverageMissing: 7.5,
            fairnessScore: 92.1,
            overallScore: 90.2
        };

        // Mettre à jour l'enregistrement de résultat de simulation
        await prisma.simulationResult.update({
            where: { id: resultId },
            data: {
                status: 'COMPLETED',
                resultData,
                metricsData,
                executionTime: 3000 // 3 secondes
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la simulation:', error);

        // Marquer la simulation comme échouée
        await prisma.simulationResult.update({
            where: { id: resultId },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
            }
        });
    }
}

// Fonctions utilitaires pour générer des données de simulation fictives
function generateDailyStaffingCoverage(startDate: Date, days: number) {
    const coverage = [];
    const date = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        coverage.push({
            date: new Date(date).toISOString().split('T')[0],
            coverage: isWeekend ?
                Math.floor(Math.random() * 15) + 75 : // 75-90% pour les weekends
                Math.floor(Math.random() * 15) + 85, // 85-100% pour les jours de semaine
            required: isWeekend ? 5 : 10,
            actual: isWeekend ? 4 : 9
        });

        date.setDate(date.getDate() + 1);
    }

    return coverage;
}

function generateShiftDistribution() {
    const users = [
        'Sophie Martin',
        'Thomas Bernard',
        'Marie Dupont',
        'François Leroy',
        'Camille Dubois',
        'Julie Petit',
        'Lucas Moreau'
    ];

    return users.map(user => ({
        userName: user,
        morningShifts: Math.floor(Math.random() * 10) + 5,
        afternoonShifts: Math.floor(Math.random() * 10) + 5,
        nightShifts: Math.floor(Math.random() * 5),
        weekendShifts: Math.floor(Math.random() * 4),
        totalHours: Math.floor(Math.random() * 50) + 120
    }));
} 