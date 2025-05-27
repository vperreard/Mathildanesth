import { PrismaClient, SimulationScenario, User, SimulationStatus, Role as PrismaRole, ProfessionalRole } from '@prisma/client';
import { POST as runSimulationHandler } from '@/app/api/simulations/[scenarioId]/run/route';
import { NextRequest } from 'next/server';
import { Rule, RuleType, ConditionOperator, ActionType } from '@/modules/dynamicRules/types/rule';
import { OptimizationResult } from '@/modules/rules/services/RuleBasedPlanningGeneratorService';
import { RuleEngineService } from '@/modules/dynamicRules/services/ruleEngineService';
import { RuleBasedPlanningGeneratorService } from '@/modules/rules/services/RuleBasedPlanningGeneratorService';
import { ShiftType } from '@/types/common';
import { AssignmentStatus } from '@/types/assignment';

// Mock des services
jest.mock('@/modules/dynamicRules/services/ruleEngineService');
jest.mock('@/modules/rules/services/RuleBasedPlanningGeneratorService');

const prisma = prisma;

const mockUserEmail = 'simrun.user@example.com';

async function cleanDatabase() {
    await prisma.simulationResult.deleteMany({});
    await prisma.simulationScenario.deleteMany({});
    await prisma.user.deleteMany({ where: { email: mockUserEmail } });
}

async function createUserForTest(): Promise<User> {
    return prisma.user.create({
        data: {
            email: mockUserEmail,
            nom: 'SimRunUser',
            prenom: 'Test',
            login: 'testsimrun',
            password: 'hashedpassword',
            role: PrismaRole.USER,
            professionalRole: ProfessionalRole.MAR,
            actif: true,
        },
    });
}

const mockRules: Rule[] = [
    {
        id: 'rule-sim-1',
        name: 'Mock Rule 1',
        description: 'A mock rule for simulation tests',
        type: RuleType.PLANNING,
        priority: 10,
        enabled: true,
        conditionGroups: [],
        conditions: [{
            id: 'cond-1',
            field: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: 'MAR',
        }],
        actions: [{
            id: 'act-1',
            type: ActionType.LOG,
            parameters: { message: 'MAR rule applied' }
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

const mockOptimizationResult: OptimizationResult = {
    score: 95.5,
    validAssignments: [{
        id: 'assign-sim-1',
        userId: '1',
        shiftType: ShiftType.JOUR,
        startDate: new Date(),
        endDate: new Date(),
        status: AssignmentStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date()
    }],
    violatedRules: [],
    metrics: { equityScore: 90, satisfactionScore: 98, ruleComplianceScore: 99 },
};


jest.mock('@/lib/prisma');

describe('POST /api/simulations/{scenarioId}/run', () => {
    let testUser: User;
    let testScenario: SimulationScenario;

    let mockInitializeRuleEngine: jest.Mock;
    let mockGeneratePlanningWithDetails: jest.Mock;

    beforeAll(async () => {
        await cleanDatabase();
    });

    beforeEach(async () => {
    jest.clearAllMocks();
    
        await cleanDatabase();
        testUser = await createUserForTest();

        const scenarioParamsObject = {
            period: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            rules: mockRules,
            userIds: [testUser.id.toString()]
        };

        testScenario = await prisma.simulationScenario.create({
            data: {
                name: 'Test Scenario For Run API',
                parametersJson: JSON.parse(JSON.stringify(scenarioParamsObject)),
                createdById: testUser.id,
            }
        });

        mockInitializeRuleEngine = jest.fn();
        (RuleEngineService.getInstance as jest.Mock).mockReturnValue({
            initialize: mockInitializeRuleEngine,
        });

        mockGeneratePlanningWithDetails = jest.fn().mockResolvedValue(mockOptimizationResult);
        (RuleBasedPlanningGeneratorService as jest.Mock).mockImplementation(() => {
            return {
                generatePlanningWithDetails: mockGeneratePlanningWithDetails,
            };
        });
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    it('should run a simulation, update result to COMPLETED and return 202', async () => {
        const clonedMockOptimizationResult = JSON.parse(JSON.stringify(mockOptimizationResult));
        if (clonedMockOptimizationResult.validAssignments[0]) {
            clonedMockOptimizationResult.validAssignments[0].userId = testUser.id.toString();
        }
        mockGeneratePlanningWithDetails.mockResolvedValue(clonedMockOptimizationResult);

        const requestUrl = `http://localhost/api/simulations/${testScenario.id}/run`;
        const req = new NextRequest(requestUrl, { method: 'POST' });

        const response = await runSimulationHandler(req, { params: { scenarioId: testScenario.id.toString() } });
        expect(response.status).toBe(202);

        const initialResponseData = await response.json();
        expect(initialResponseData.status).toBe(SimulationStatus.PENDING);
        expect(initialResponseData.scenarioId).toBe(testScenario.id);

        await new Promise(resolve => setTimeout(resolve, 200));

        const finalResultInDb = await prisma.simulationResult.findUnique({ where: { id: initialResponseData.id } });

        expect(finalResultInDb).not.toBeNull();
        expect(finalResultInDb?.status).toBe(SimulationStatus.COMPLETED);
        expect(finalResultInDb?.errorMessage).toBeNull();

        expect(finalResultInDb?.generatedPlanningData).toEqual(JSON.parse(JSON.stringify(clonedMockOptimizationResult.validAssignments)));
        expect(finalResultInDb?.statisticsJson).toEqual(JSON.parse(JSON.stringify({
            score: clonedMockOptimizationResult.score,
            metrics: clonedMockOptimizationResult.metrics,
        })));
        expect(finalResultInDb?.conflictAlertsJson).toEqual(JSON.parse(JSON.stringify(clonedMockOptimizationResult.violatedRules)));

        expect(RuleEngineService.getInstance().initialize).toHaveBeenCalledWith(mockRules, expect.objectContaining({ enableCaching: false }));
        expect(mockGeneratePlanningWithDetails).toHaveBeenCalled();
    });

    it('should fail if scenarioId does not exist and return 404', async () => {
        const nonExistentScenarioId = 'scenario-does-not-exist';
        const requestUrl = `http://localhost/api/simulations/${nonExistentScenarioId}/run`;
        const req = new NextRequest(requestUrl, { method: 'POST' });

        const response = await runSimulationHandler(req, { params: { scenarioId: nonExistentScenarioId } });
        expect(response.status).toBe(404);
        const responseBody = await response.json();
        expect(responseBody.error).toContain("Scénario de simulation non trouvé");
    });

    it('should update result to FAILED if parametersJson is invalid (e.g. rules missing)', async () => {
        const invalidScenarioParamsObject = { period: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } };
        const scenarioWithInvalidParams = await prisma.simulationScenario.create({
            data: {
                name: 'Invalid Params Scenario',
                parametersJson: JSON.parse(JSON.stringify(invalidScenarioParamsObject)),
                createdById: testUser.id,
            }
        });

        const requestUrl = `http://localhost/api/simulations/${scenarioWithInvalidParams.id}/run`;
        const req = new NextRequest(requestUrl, { method: 'POST' });

        const response = await runSimulationHandler(req, { params: { scenarioId: scenarioWithInvalidParams.id.toString() } });
        expect(response.status).toBe(202);

        const initialResponseData = await response.json();

        await new Promise(resolve => setTimeout(resolve, 100));

        const resultInDb = await prisma.simulationResult.findUnique({ where: { id: initialResponseData.id } });
        expect(resultInDb?.status).toBe(SimulationStatus.FAILED);
        expect(resultInDb?.errorMessage).toContain("Paramètres de simulation invalides");
        expect(resultInDb?.errorMessage).toMatch(/rules.*Simulation rules must be provided/i);
    });

    it('should update result to FAILED if planning generation throws an error', async () => {
        const errorMessage = "Internal Planning Error";
        mockGeneratePlanningWithDetails.mockRejectedValueOnce(new Error(errorMessage));

        const requestUrl = `http://localhost/api/simulations/${testScenario.id}/run`;
        const req = new NextRequest(requestUrl, { method: 'POST' });

        const response = await runSimulationHandler(req, { params: { scenarioId: testScenario.id.toString() } });
        expect(response.status).toBe(202);

        const initialResponseData = await response.json();
        await new Promise(resolve => setTimeout(resolve, 100));

        const resultInDb = await prisma.simulationResult.findUnique({ where: { id: initialResponseData.id } });
        expect(resultInDb?.status).toBe(SimulationStatus.FAILED);
        expect(resultInDb?.errorMessage).toBe(errorMessage);
    });
}); 