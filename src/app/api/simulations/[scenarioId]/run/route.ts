import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SimulationStatus, Prisma, UserStatus, Specialty, UserSkill, Skill, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Importer les types et services nécessaires
import { Rule } from '@/modules/dynamicRules/types/rule';
import { User } from '@/types/user';
import { RuleEngineService } from '@/modules/dynamicRules/services/ruleEngineService';
import { RuleBasedPlanningGeneratorService, OptimizationResult } from '@/modules/rules/services/RuleBasedPlanningGeneratorService';

const prisma = new PrismaClient();

interface SimulationParameters {
    period: {
        startDate: string;
        endDate: string;
    };
    siteId?: string;
    rules: Rule[];
    userIds?: string[];
}

const simulationParametersSchema = z.object({
    period: z.object({
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date" }),
    }),
    siteId: z.string().optional(),
    rules: z.array(z.any()).min(1, "Simulation rules must be provided and not empty."),
    userIds: z.array(z.string()).optional(),
}).refine(data => new Date(data.period.endDate) > new Date(data.period.startDate), {
    message: "End date must be after start date",
    path: ["period", "endDate"],
});


export async function POST(request: NextRequest, { params }: { params: { scenarioId: string } }) {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé. Vous devez être connecté pour lancer une simulation." }, { status: 401 });
    }

    const { scenarioId } = params;
    if (!scenarioId) {
        return NextResponse.json({ error: "ID du scénario manquant." }, { status: 400 });
    }

    try {
        const scenario = await prisma.simulationScenario.findUnique({
            where: { id: scenarioId },
        });

        if (!scenario) {
            return NextResponse.json({ error: "Scénario de simulation non trouvé." }, { status: 404 });
        }

        // Vérifier que l'utilisateur est le créateur du scénario ou a des droits administratifs
        // @ts-ignore - Ignorer l'incompatibilité de type entre number et string
        const isCreator = scenario.createdById == session.user.id;
        // Vérifier si l'utilisateur a un rôle d'administrateur
        const userRole = session.user.role as string;
        const isAdmin = userRole === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return NextResponse.json({
                error: "Accès refusé. Vous n'êtes pas autorisé à exécuter ce scénario."
            }, { status: 403 });
        }

        const simulationResult = await prisma.simulationResult.create({
            data: {
                scenarioId: scenario.id,
                status: SimulationStatus.PENDING,
                generatedPlanningData: Prisma.JsonNull,
                statisticsJson: Prisma.JsonNull,
                conflictAlertsJson: Prisma.JsonNull,
            },
        });

        (async () => {
            try {
                const paramsParseResult = simulationParametersSchema.safeParse(scenario.parametersJson);
                if (!paramsParseResult.success) {
                    const errorMessage = `Paramètres de simulation invalides: ${paramsParseResult.error.format()}`;
                    console.error(`Validation error for scenario ${scenarioId}:`, paramsParseResult.error.format());
                    throw new Error(errorMessage);
                }
                const simParams: SimulationParameters = paramsParseResult.data as SimulationParameters;
                const startDate = new Date(simParams.period.startDate);
                const endDate = new Date(simParams.period.endDate);

                const userQueryWhere: Prisma.UserWhereInput = { actif: true };
                if (simParams.siteId) {
                    // TODO: Logique de filtrage par siteId à implémenter si nécessaire
                    // userQueryWhere.sites = { some: { siteId: simParams.siteId } };
                }
                if (simParams.userIds && simParams.userIds.length > 0) {
                    const userIdsAsNumbers = simParams.userIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                    if (userIdsAsNumbers.length !== simParams.userIds.length) {
                        console.warn("Certains userIds fournis n'étaient pas des nombres valides et ont été ignorés.");
                    }
                    if (userIdsAsNumbers.length > 0) {
                        userQueryWhere.id = { in: userIdsAsNumbers };
                    }
                }

                const dbUsers = await prisma.user.findMany({
                    where: userQueryWhere,
                    include: { userSkills: { include: { skill: true } } }
                });

                // Définir le type pour `us` dans le map
                type UserSkillWithSkill = Prisma.UserSkillGetPayload<{ include: { skill: true } }>;

                const simulatedUsers: User[] = dbUsers.map(dbUser => ({
                    id: dbUser.id.toString(),
                    prenom: dbUser.prenom || '',
                    nom: dbUser.nom || '',
                    email: dbUser.email,
                    role: dbUser.role as string,
                    specialties: dbUser.userSkills.map((us: UserSkillWithSkill) => us.skill.name),
                    isActive: dbUser.actif,
                }));

                if (simulatedUsers.length === 0) {
                    throw new Error("Aucun utilisateur valide trouvé pour la simulation avec les paramètres donnés.");
                }

                const simulatedRules: Rule[] = simParams.rules;

                const ruleEngine = RuleEngineService.getInstance();
                ruleEngine.initialize(simulatedRules, { enableCaching: false, strictMode: false });

                const planningGenerator = new RuleBasedPlanningGeneratorService(
                    simulatedUsers,
                    startDate,
                    endDate,
                    simulatedRules
                );

                console.log(`Lancement de la simulation pour scénario ${scenario.id} avec ${simulatedUsers.length} utilisateurs et ${simulatedRules.length} règles.`);
                const optimizationResult: OptimizationResult = await planningGenerator.generatePlanningWithDetails();
                console.log(`Simulation terminée pour ${scenario.id}. Score: ${optimizationResult.score}`);

                await prisma.simulationResult.update({
                    where: { id: simulationResult.id },
                    data: {
                        status: SimulationStatus.COMPLETED,
                        generatedPlanningData: optimizationResult.validAssignments as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
                        statisticsJson: optimizationResult.score !== undefined && optimizationResult.metrics !== undefined
                            ? { score: optimizationResult.score, metrics: optimizationResult.metrics } as unknown as Prisma.InputJsonValue
                            : Prisma.JsonNull,
                        conflictAlertsJson: optimizationResult.violatedRules as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
                        errorMessage: null,
                    },
                });

            } catch (simError: any) {
                console.error(`Erreur pendant l'exécution de la simulation ${simulationResult.id} pour le scénario ${scenarioId}:`, simError);
                const simErrorMessage = simError instanceof Error ? simError.message : String(simError);
                await prisma.simulationResult.update({
                    where: { id: simulationResult.id },
                    data: {
                        status: SimulationStatus.FAILED,
                        errorMessage: simErrorMessage,
                        generatedPlanningData: Prisma.JsonNull,
                        statisticsJson: Prisma.JsonNull,
                        conflictAlertsJson: Prisma.JsonNull,
                    },
                });
            }
        })();

        return NextResponse.json(simulationResult, { status: 202 });

    } catch (error: any) {
        console.error(`Erreur lors du lancement de la simulation pour le scénario ${scenarioId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
        return NextResponse.json({ error: "Impossible de lancer la simulation.", details: errorMessage }, { status: 500 });
    }
} 