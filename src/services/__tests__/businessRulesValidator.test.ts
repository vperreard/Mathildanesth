import { BusinessRulesValidator } from '../businessRulesValidator';
import { prisma } from '@/lib/prisma';
import { addDays, subDays } from 'date-fns';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    leave: {
      findMany: jest.fn(),
    },
    leaveQuota: {
      findUnique: jest.fn(),
    },
    attribution: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    operatingRoom: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    site: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma');

describe('BusinessRulesValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.clearAllMocks();
  });

  describe('validateLeaveRequest', () => {
    const mockUserId = 'user123';
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    it('devrait valider une demande de congé valide', async () => {
      // Mock des données Prisma
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.leaveQuota.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await BusinessRulesValidator.validateLeaveRequest({
        userId: mockUserId,
        startDate: tomorrow,
        endDate: nextWeek,
        type: 'ANNUAL',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un congé trop long (> 30 jours)', async () => {
      const longLeaveEnd = addDays(today, 35);

      const result = await BusinessRulesValidator.validateLeaveRequest({
        userId: mockUserId,
        startDate: today,
        endDate: longLeaveEnd,
        type: 'ANNUAL',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La durée du congé ne peut pas dépasser 30 jours consécutifs');
    });

    it('devrait détecter les chevauchements avec d\'autres congés', async () => {
      // Mock un congé existant
      (prisma.leave.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          userId: mockUserId,
          startDate: tomorrow,
          endDate: nextWeek,
          status: 'APPROVED',
        },
      ]);

      const result = await BusinessRulesValidator.validateLeaveRequest({
        userId: mockUserId,
        startDate: addDays(tomorrow, 2),
        endDate: addDays(nextWeek, 2),
        type: 'ANNUAL',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Ce congé chevauche avec une autre demande existante');
    });

    it('devrait vérifier les quotas disponibles', async () => {
      const quotaId = 'quota123';
      
      // Mock pas de chevauchements
      (prisma.leave.findMany as jest.Mock).mockResolvedValueOnce([]);
      
      // Mock quota avec congés existants
      (prisma.leaveQuota.findUnique as jest.Mock).mockResolvedValue({
        id: quotaId,
        totalDays: 25,
        leaves: [
          {
            id: 1,
            userId: mockUserId,
            startDate: subDays(today, 30),
            endDate: subDays(today, 20),
            status: 'APPROVED',
          },
        ],
      });

      // Mock pour le total annuel
      (prisma.leave.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await BusinessRulesValidator.validateLeaveRequest({
        userId: mockUserId,
        startDate: today,
        endDate: addDays(today, 20), // 21 jours
        type: 'ANNUAL',
        quotaId,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quota insuffisant. Disponible: 14 jours');
    });

    it('devrait vérifier l\'espacement entre congés longs', async () => {
      // Mock un congé long récent
      (prisma.leave.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // Pas de chevauchements
        .mockResolvedValueOnce([]) // Total annuel
        .mockResolvedValueOnce([
          {
            id: 1,
            userId: mockUserId,
            startDate: subDays(today, 50),
            endDate: subDays(today, 30), // 21 jours
            status: 'APPROVED',
          },
        ]);

      const result = await BusinessRulesValidator.validateLeaveRequest({
        userId: mockUserId,
        startDate: today,
        endDate: addDays(today, 15), // 16 jours (congé long)
        type: 'ANNUAL',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Un délai de 90 jours est requis entre les congés longs');
    });
  });

  describe('validateAssignment', () => {
    const mockUserId = 'user123';
    const mockRoomId = 'room123';
    const today = new Date();
    const tomorrow = addDays(today, 1);

    beforeEach(() => {
    jest.clearAllMocks();
      // Reset all mocks
      (prisma.attribution.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.attribution.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.operatingRoom.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoomId,
        name: 'Salle 1',
        roomType: 'STANDARD',
        sector: { category: 'STANDARD' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        professionalRole: 'IADE',
        skills: [],
        qualifications: [],
      });
    });

    it('devrait valider une garde/vacation valide', async () => {
      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: tomorrow,
        shiftType: 'JOUR',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter les conflits horaires', async () => {
      // Mock une garde/vacation existante le même jour
      (prisma.attribution.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          userId: mockUserId,
          date: today,
          shiftType: 'JOUR',
        },
      ]);

      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: today,
        shiftType: 'GARDE',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Une garde/vacation existe déjà pour cette date');
    });

    it('devrait vérifier les compétences pour les salles spécialisées', async () => {
      // Mock une salle d'endoscopie
      (prisma.operatingRoom.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoomId,
        name: 'Salle Endoscopie',
        roomType: 'ENDOSCOPIE',
        sector: { category: 'SPECIALIZED' },
      });

      // Mock un utilisateur sans compétences spécialisées
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        professionalRole: 'IADE',
        skills: [{ name: 'STANDARD' }],
        qualifications: [],
      });

      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: tomorrow,
        shiftType: 'JOUR',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Compétences requises pour la salle Salle Endoscopie (ENDOSCOPIE)');
    });

    it('devrait vérifier l\'intervalle minimum entre gardes', async () => {
      // Mock des gardes récentes
      (prisma.attribution.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // Pas de conflit le jour même
        .mockResolvedValueOnce([
          {
            id: 1,
            userId: mockUserId,
            date: subDays(today, 5), // Garde il y a 5 jours
            shiftType: 'GARDE',
          },
        ]);

      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: today,
        shiftType: 'GARDE',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Un délai minimum de 7 jours est requis entre les gardes');
    });

    it('devrait limiter le nombre de gardes par mois', async () => {
      // Mock 4 gardes ce mois-ci
      const gardesThisMonth = Array(4).fill(null).map((_, i) => ({
        id: i + 1,
        userId: mockUserId,
        date: subDays(today, (i + 1) * 7),
        shiftType: 'GARDE',
      }));

      (prisma.attribution.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // Pas de conflit le jour même
        .mockResolvedValueOnce([]) // Pas de garde récente
        .mockResolvedValueOnce(gardesThisMonth); // 4 gardes ce mois

      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: today,
        shiftType: 'GARDE',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le nombre maximum de gardes par mois (4) est atteint');
    });

    it('devrait vérifier le temps de travail hebdomadaire', async () => {
      // Mock 5 jours de travail cette semaine (40h)
      const weekAssignments = Array(5).fill(null).map((_, i) => ({
        id: i + 1,
        userId: mockUserId,
        date: subDays(today, i),
        duration: 8,
        shiftType: 'JOUR',
      }));

      (prisma.attribution.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // Pas de conflit le jour même
        .mockResolvedValueOnce(weekAssignments); // 40h cette semaine

      const result = await BusinessRulesValidator.validateAssignment({
        userId: mockUserId,
        operatingRoomId: mockRoomId,
        date: today,
        shiftType: 'JOUR',
        duration: 12, // Ajout de 12h supplémentaires
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le temps de travail hebdomadaire ne peut pas dépasser 48 heures');
    });
  });

  describe('validatePlanningGeneration', () => {
    const mockSiteId = 'site123';
    const today = new Date();
    const nextWeek = addDays(today, 7);

    beforeEach(() => {
    jest.clearAllMocks();
      // Mock site par défaut
      (prisma.site.findUnique as jest.Mock).mockResolvedValue({
        id: mockSiteId,
        operatingRooms: [
          { id: 1, name: 'Salle 1' },
          { id: 2, name: 'Salle 2' },
        ],
        users: [
          { id: 1, professionalRole: 'MAR', isActive: true },
          { id: 2, professionalRole: 'MAR', isActive: true },
          { id: 3, professionalRole: 'IADE', isActive: true },
          { id: 4, professionalRole: 'IADE', isActive: true },
          { id: 5, professionalRole: 'IADE', isActive: true },
        ],
      });
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('devrait valider une génération de planning valide', async () => {
      const result = await BusinessRulesValidator.validatePlanningGeneration({
        startDate: today,
        endDate: nextWeek,
        siteId: mockSiteId,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une période trop longue', async () => {
      const longPeriodEnd = addDays(today, 35);

      const result = await BusinessRulesValidator.validatePlanningGeneration({
        startDate: today,
        endDate: longPeriodEnd,
        siteId: mockSiteId,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La génération de planning est limitée à 31 jours maximum');
    });

    it('devrait vérifier le ratio MARs/salles', async () => {
      // Mock site avec peu de MARs
      (prisma.site.findUnique as jest.Mock).mockResolvedValue({
        id: mockSiteId,
        operatingRooms: [
          { id: 1, name: 'Salle 1' },
          { id: 2, name: 'Salle 2' },
          { id: 3, name: 'Salle 3' },
          { id: 4, name: 'Salle 4' },
        ],
        users: [
          { id: 1, professionalRole: 'MAR', isActive: true }, // Seulement 1 MAR pour 4 salles
          { id: 2, professionalRole: 'IADE', isActive: true },
          { id: 3, professionalRole: 'IADE', isActive: true },
          { id: 4, professionalRole: 'IADE', isActive: true },
        ],
      });

      const result = await BusinessRulesValidator.validatePlanningGeneration({
        startDate: today,
        endDate: nextWeek,
        siteId: mockSiteId,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre insuffisant de MARs. Minimum requis: 2');
    });

    it('devrait vérifier la disponibilité avec les congés', async () => {
      // Mock site avec seulement 1 MAR et 2 IADEs (insuffisant pour 2 salles)
      (prisma.site.findUnique as jest.Mock).mockResolvedValue({
        id: mockSiteId,
        operatingRooms: [
          { id: 1, name: 'Salle 1' },
          { id: 2, name: 'Salle 2' },
        ],
        users: [
          { id: 1, professionalRole: 'MAR', isActive: true },
          { id: 3, professionalRole: 'IADE', isActive: true },
          { id: 4, professionalRole: 'IADE', isActive: true },
        ],
      });
      
      // Mock des congés pour le MAR et un IADE
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          userId: 1,
          user: { id: 1, professionalRole: 'MAR' },
          startDate: today,
          endDate: nextWeek,
          status: 'APPROVED',
        },
        {
          id: 2,
          userId: 3,
          user: { id: 3, professionalRole: 'IADE' },
          startDate: today,
          endDate: nextWeek,
          status: 'APPROVED',
        },
      ]);

      const result = await BusinessRulesValidator.validatePlanningGeneration({
        startDate: today,
        endDate: nextWeek,
        siteId: mockSiteId,
      });

      expect(result.valid).toBe(false);
      // Avec 0 MARs disponibles sur 1 nécessaire minimum
      expect(result.errors.some(e => e.includes('Nombre insuffisant de MARs disponibles'))).toBe(true);
    });

    it('devrait gérer les erreurs de site invalide', async () => {
      (prisma.site.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await BusinessRulesValidator.validatePlanningGeneration({
        startDate: today,
        endDate: nextWeek,
        siteId: 'invalid-site',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Site invalide');
    });
  });
});