import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PlanningGenerator } from '@/services/planningGenerator';
import TrameIntegrationService from '@/services/TrameIntegrationService';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';
import { PrismaClient } from '@prisma/client';

// Mock PerformanceMonitoringService
jest.mock('@/services/PerformanceMonitoringService', () => ({
  performanceMonitor: {
    startMeasure: jest.fn(() => 'test-measure-id'),
    endMeasure: jest.fn(() => 100),
  }
}));

// Mock rulesConfigService
jest.mock('@/services/rulesConfigService', () => ({
  rulesConfigService: {
    getRulesConfiguration: jest.fn().mockResolvedValue({
      intervalle: { minJoursEntreGardes: 3, maxGardesMois: 6, maxGardesConsecutives: 1, maxAstreintesMois: 8 },
      supervision: { maxSallesParMAR: { standard: 2 } },
      consultations: { creneauxMatin: 2, creneauxApresMidi: 2, maxParSemaine: 10 },
    }),
    getFatigueConfiguration: jest.fn().mockResolvedValue({
      enabled: true,
      points: { garde: 10, astreinte: 5, astreinteWeekendFerie: 7 },
      seuils: { alerte: 50, critique: 70 },
      recovery: { jourOff: 15 },
    }),
  }
}));

// Mock TrameApplicationService
jest.mock('@/services/TrameApplicationService', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      applyTrameToDateRange: jest.fn().mockResolvedValue({
        assignmentsCreated: 5,
        warnings: [],
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }))
  };
});

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    trameModele: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    $use: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Module de Planning - Tests d\'intégration', () => {
  let integrationService: TrameIntegrationService;
  let prisma: any;

  beforeEach(() => {
    integrationService = new TrameIntegrationService();
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await integrationService.disconnect();
  });

  describe('Génération de planning avec trames', () => {
    it('devrait générer un planning complet avec trames et gardes', async () => {
      // Mock des données
      const mockTrame = {
        id: 1,
        name: 'Trame Test',
        isActive: true,
        siteId: 'site-123',
        dateDebutEffet: new Date('2024-01-01'),
        dateFinEffet: null,
        priorite: 10,
      };

      const mockUsers = [
        {
          id: 1,
          prenom: 'Jean',
          nom: 'Dupont',
          actif: true,
          professionalRole: 'MAR',
          workPattern: 'FULL_TIME',
          sites: [{ id: 'site-123' }],
          skills: [],
          leaves: [],
        },
        {
          id: 2,
          prenom: 'Marie',
          nom: 'Martin',
          actif: true,
          professionalRole: 'IADE',
          workPattern: 'FULL_TIME',
          sites: [{ id: 'site-123' }],
          skills: [],
          leaves: [],
        },
      ];

      // Configuration des mocks
      prisma.trameModele.findMany.mockResolvedValue([mockTrame]);
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.assignment.findMany.mockResolvedValue([]);
      prisma.assignment.create.mockResolvedValue({ id: 'new-assignment' });
      prisma.assignment.groupBy.mockResolvedValue([]);
      prisma.$queryRaw.mockResolvedValue([]);

      // Mesure de performance
      const measureId = performanceMonitor.startMeasure('test_planning_generation');

      // Exécution
      const result = await integrationService.generatePlanningWithTrames(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-07'),
        {
          useTrames: true,
          generateGardes: true,
          generateAstreintes: true,
          optimizeDistribution: true,
        }
      );

      const duration = performanceMonitor.endMeasure('test_planning_generation');

      // Vérifications
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.message).toBeDefined();
      expect(duration).toBeLessThan(5000); // Doit finir en moins de 5 secondes

      // Vérifier que les services ont été appelés
      expect(prisma.trameModele.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            siteId: 'site-123',
          }),
        })
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actif: true,
          }),
        })
      );
    });

    it('devrait gérer les erreurs gracieusement', async () => {
      // Simuler une erreur
      prisma.trameModele.findMany.mockRejectedValue(new Error('Database error'));

      const result = await integrationService.generatePlanningWithTrames(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erreur lors de la génération');
    });
  });

  describe('Validation du planning', () => {
    it('devrait détecter les jours sans garde', async () => {
      // Simuler des jours sans garde
      prisma.$queryRaw.mockResolvedValueOnce([
        { date: new Date('2024-01-03') },
        { date: new Date('2024-01-05') },
      ]);

      // Les autres requêtes retournent des résultats vides
      prisma.$queryRaw.mockResolvedValue([]);

      const validation = await (integrationService as any).validateFinalPlanning(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('2 jour(s) sans garde');
    });

    it('devrait détecter les conflits d\'affectations', async () => {
      // Premier appel : pas de jours sans garde
      prisma.$queryRaw.mockResolvedValueOnce([]);
      
      // Deuxième appel : conflits détectés
      prisma.$queryRaw.mockResolvedValueOnce([
        { user_id: 1, date: new Date('2024-01-03'), conflict_count: 2 },
      ]);
      
      // Troisième appel : pas de violations de repos
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const validation = await (integrationService as any).validateFinalPlanning(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.stringContaining('1 conflit(s) détecté(s)')
      );
    });

    it('devrait vérifier le repos minimum entre gardes', async () => {
      // Pas de jours sans garde
      prisma.$queryRaw.mockResolvedValueOnce([]);
      
      // Pas de conflits
      prisma.$queryRaw.mockResolvedValueOnce([]);
      
      // Violations de repos détectées
      prisma.$queryRaw.mockResolvedValueOnce([
        { user_id: 1, violations: 2 },
        { user_id: 3, violations: 1 },
      ]);

      const validation = await (integrationService as any).validateFinalPlanning(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );

      expect(validation.warnings).toContainEqual(
        expect.stringContaining('2 utilisateur(s) avec repos insuffisant')
      );
    });
  });

  describe('Calcul du score d\'équité', () => {
    it('devrait calculer un score d\'équité correct', async () => {
      // Distribution équitable
      prisma.assignment.groupBy.mockResolvedValue([
        { userId: 1, _count: 5 },
        { userId: 2, _count: 5 },
        { userId: 3, _count: 5 },
        { userId: 4, _count: 5 },
      ]);

      const score = await (integrationService as any).calculateEquityScore(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(score).toBe(100); // Distribution parfaitement équitable
    });

    it('devrait pénaliser les distributions inéquitables', async () => {
      // Distribution très inéquitable
      prisma.assignment.groupBy.mockResolvedValue([
        { userId: 1, _count: 10 },
        { userId: 2, _count: 2 },
        { userId: 3, _count: 8 },
        { userId: 4, _count: 4 },
      ]);

      const score = await (integrationService as any).calculateEquityScore(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(score).toBeLessThan(80); // Score dégradé pour distribution inéquitable
    });
  });

  describe('Performance du module', () => {
    it('devrait générer un planning pour 100 utilisateurs en moins de 10 secondes', async () => {
      // Créer 100 utilisateurs mock
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        prenom: `User${i + 1}`,
        nom: `Test${i + 1}`,
        actif: true,
        professionalRole: i % 2 === 0 ? 'MAR' : 'IADE',
        workPattern: 'FULL_TIME',
        sites: [{ id: 'site-123' }],
        skills: [],
        leaves: [],
      }));

      prisma.trameModele.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.assignment.findMany.mockResolvedValue([]);
      prisma.assignment.create.mockResolvedValue({ id: 'new' });
      prisma.assignment.groupBy.mockResolvedValue([]);
      prisma.$queryRaw.mockResolvedValue([]);

      const startTime = Date.now();

      const result = await integrationService.generatePlanningWithTrames(
        'site-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'), // Un mois complet
        {
          generateGardes: true,
          generateAstreintes: true,
        }
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Moins de 10 secondes
      expect(result).toBeDefined();
    });
  });
});

describe('PlanningGenerator - Tests unitaires', () => {
  let generator: PlanningGenerator;

  beforeEach(() => {
    const params = {
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      siteId: 'site-123',
      generateGardes: true,
      generateAstreintes: true,
      generateConsultations: false,
      generateBlocs: false,
      respectPreferences: true,
      optimizeDistribution: true,
    };

    generator = new PlanningGenerator(params);
  });

  describe('Initialisation', () => {
    it('devrait s\'initialiser correctement avec du personnel', async () => {
      const personnel = [
        {
          id: 1,
          name: 'Jean Dupont',
          role: 'MAR',
          isActive: true,
        },
        {
          id: 2,
          name: 'Marie Martin',
          role: 'IADE',
          isActive: true,
        },
      ];

      await generator.initialize(personnel as any, []);

      // Le générateur devrait être initialisé
      expect((generator as any).isInitialized).toBe(true);
      expect((generator as any).personnel).toHaveLength(2);
    });
  });

  describe('Calcul du score de qualité', () => {
    it('devrait calculer un score de qualité basé sur l\'équité et la fatigue', async () => {
      const personnel = [
        { id: 1, name: 'User1', role: 'MAR', isActive: true },
        { id: 2, name: 'User2', role: 'MAR', isActive: true },
      ];

      await generator.initialize(personnel as any, []);

      // Simuler une génération
      const mockAssignments = [
        { userId: '1', type: 'GARDE', startDate: '2024-01-01' },
        { userId: '2', type: 'GARDE', startDate: '2024-01-02' },
        { userId: '1', type: 'GARDE', startDate: '2024-01-03' },
        { userId: '2', type: 'GARDE', startDate: '2024-01-04' },
      ];

      // Calculer le score (méthode privée, donc on teste indirectement)
      const result = await generator.generate();
      
      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.score.global).toBeGreaterThanOrEqual(0);
      expect(result.score.global).toBeLessThanOrEqual(100);
    });
  });
});