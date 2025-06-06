import { jest } from '@jest/globals';

/**
 * Factories pour générer des données de test complexes pour le module planning
 * Couvre tous les scénarios médicaux : MAR, IADE, blocs opératoires, gardes, astreintes
 */

// Types pour les données de test de planning
export interface TestUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'MAR' | 'IADE' | 'CHIRURGIEN' | 'ADMIN';
  specialite?: string;
  active: boolean;
  sites: number[];
  competences: string[];
  preferences?: {
    maxGardesMois?: number;
    maxAstreintesMois?: number;
    prefereNuit?: boolean;
  };
  contraintes?: string[];
  weeklyHours: number;
  isChefEquipe: boolean;
  niveauExperience?: 'JUNIOR' | 'SENIOR' | 'EXPERT';
}

export interface TestOperatingRoom {
  id: string;
  name: string;
  type: 'BLOC_CARDIO' | 'BLOC_ORTHO' | 'BLOC_DIGESTIF' | 'BLOC_GYNECO' | 'URGENCES' | 'PEDIATRIE';
  capacity: number;
  active: boolean;
  departmentId: string;
  specialRequirements?: string[];
  equipment?: string[];
  location?: string;
}

export interface TestAssignment {
  id: string;
  userId: number;
  operatingRoomId?: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  type: 'GARDE' | 'ASTREINTE' | 'VACATION' | 'FORMATION';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'VALIDATED';
  specialite?: string;
  site?: string;
  notes?: string;
  validatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
  recurringPattern?: string;
  shiftType?: 'JOUR' | 'NUIT' | 'MATIN' | 'APRES_MIDI';
}

export interface TestPlanningConfiguration {
  id: string;
  name: string;
  dateDebut: Date;
  dateFin: Date;
  rules: {
    maxGardesMois: number;
    maxGardesConsecutives: number;
    minReposEntreGardes: number;
    maxAstreintesMois: number;
    minPersonnelParBloc: number;
    ratioMARIADE: number;
  };
  active: boolean;
  createdBy: number;
  constraints?: unknown[];
}

export interface TestShiftTemplate {
  id: string;
  name: string;
  type: 'GARDE' | 'ASTREINTE' | 'VACATION';
  startTime: string;
  endTime: string;
  requiredStaff: {
    MAR: number;
    IADE: number;
    CHIRURGIEN?: number;
  };
  specialtyRequired?: string;
  isNightShift: boolean;
  weekendOnly: boolean;
  recurring: boolean;
}

/**
 * Factory pour créer des utilisateurs médicaux réalistes
 */
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: Math.floor(Math.random() * 1000) + 1,
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie.dupont@hospital.fr',
  role: 'MAR',
  specialite: 'Anesthésie',
  active: true,
  sites: [1],
  competences: ['BLOC_CARDIO', 'URGENCES'],
  preferences: {
    maxGardesMois: 8,
    maxAstreintesMois: 4,
    prefereNuit: false,
  },
  contraintes: [],
  weeklyHours: 35,
  isChefEquipe: false,
  niveauExperience: 'SENIOR',
  ...overrides,
});

/**
 * Factory pour créer une équipe médicale complète
 */
export const createMedicalTeam = (size = 10) => {
  const team: TestUser[] = [];
  
  // Chef d'équipe MAR
  team.push(createTestUser({
    id: 1,
    nom: 'Martin',
    prenom: 'Jean',
    role: 'MAR',
    isChefEquipe: true,
    niveauExperience: 'EXPERT',
    competences: ['BLOC_CARDIO', 'BLOC_ORTHO', 'URGENCES', 'PEDIATRIE'],
    preferences: { maxGardesMois: 6, maxAstreintesMois: 2 },
  }));

  // Chef d'équipe IADE
  team.push(createTestUser({
    id: 2,
    nom: 'Durand',
    prenom: 'Sophie',
    role: 'IADE',
    isChefEquipe: true,
    niveauExperience: 'EXPERT',
    competences: ['BLOC_DIGESTIF', 'BLOC_GYNECO', 'URGENCES'],
    preferences: { maxGardesMois: 6, maxAstreintesMois: 3 },
  }));

  // MAR seniors
  for (let i = 3; i <= Math.floor(size * 0.4); i++) {
    team.push(createTestUser({
      id: i,
      nom: `Mar${i}`,
      prenom: `Prenom${i}`,
      role: 'MAR',
      niveauExperience: 'SENIOR',
      competences: ['BLOC_CARDIO', 'BLOC_ORTHO'],
      preferences: { maxGardesMois: 8, maxAstreintesMois: 4 },
    }));
  }

  // IADE seniors
  for (let i = Math.floor(size * 0.4) + 1; i <= Math.floor(size * 0.7); i++) {
    team.push(createTestUser({
      id: i,
      nom: `Iade${i}`,
      prenom: `Prenom${i}`,
      role: 'IADE',
      niveauExperience: 'SENIOR',
      competences: ['BLOC_DIGESTIF', 'URGENCES'],
      preferences: { maxGardesMois: 8, maxAstreintesMois: 5 },
    }));
  }

  // Juniors (MAR et IADE)
  for (let i = Math.floor(size * 0.7) + 1; i <= size; i++) {
    const isMAR = i % 2 === 0;
    team.push(createTestUser({
      id: i,
      nom: `Junior${i}`,
      prenom: `Prenom${i}`,
      role: isMAR ? 'MAR' : 'IADE',
      niveauExperience: 'JUNIOR',
      competences: isMAR ? ['BLOC_CARDIO'] : ['URGENCES'],
      preferences: { maxGardesMois: 10, maxAstreintesMois: 6 },
    }));
  }

  return team;
};

/**
 * Factory pour créer des salles d'opération réalistes
 */
export const createTestOperatingRoom = (overrides: Partial<TestOperatingRoom> = {}): TestOperatingRoom => ({
  id: `room-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Bloc 1',
  type: 'BLOC_CARDIO',
  capacity: 10,
  active: true,
  departmentId: 'dept-cardio',
  specialRequirements: ['CARDIO_MONITORING', 'CEC'],
  equipment: ['SCOPE', 'RESPIRATEUR', 'DEFIBRILLATEUR'],
  location: 'Étage 2, Aile Nord',
  ...overrides,
});

/**
 * Factory pour créer un bloc opératoire complet
 */
export const createOperatingBlock = () => {
  return [
    createTestOperatingRoom({
      id: 'bloc-cardio-1',
      name: 'Bloc Cardio 1',
      type: 'BLOC_CARDIO',
      specialRequirements: ['CARDIO_MONITORING', 'CEC', 'PACE_MAKER'],
      equipment: ['SCOPE_CARDIO', 'CEC_MACHINE', 'DEFIBRILLATEUR'],
    }),
    createTestOperatingRoom({
      id: 'bloc-cardio-2',
      name: 'Bloc Cardio 2',
      type: 'BLOC_CARDIO',
      specialRequirements: ['CARDIO_MONITORING', 'PACE_MAKER'],
      equipment: ['SCOPE_CARDIO', 'DEFIBRILLATEUR'],
    }),
    createTestOperatingRoom({
      id: 'bloc-ortho-1',
      name: 'Bloc Orthopédie 1',
      type: 'BLOC_ORTHO',
      specialRequirements: ['RX_PORTABLE', 'TABLE_ORTHO'],
      equipment: ['SCOPE', 'RX_MACHINE', 'ASPIRATEUR'],
    }),
    createTestOperatingRoom({
      id: 'bloc-digestif-1',
      name: 'Bloc Digestif 1',
      type: 'BLOC_DIGESTIF',
      specialRequirements: ['COELIOSCOPIE', 'RX_DIGESTIF'],
      equipment: ['SCOPE', 'COELIOSCOPIE_TOWER', 'RX_MACHINE'],
    }),
    createTestOperatingRoom({
      id: 'urgences-1',
      name: 'Bloc Urgences 1',
      type: 'URGENCES',
      capacity: 15,
      specialRequirements: ['ACCES_RAPIDE', 'MULTI_SPECIALITE'],
      equipment: ['SCOPE', 'RESPIRATEUR', 'DEFIBRILLATEUR', 'CHARIOT_URGENCE'],
    }),
  ];
};

/**
 * Factory pour créer des affectations de planning
 */
export const createTestAssignment = (overrides: Partial<TestAssignment> = {}): TestAssignment => ({
  id: `assignment-${Math.random().toString(36).substr(2, 9)}`,
  userId: 1,
  operatingRoomId: 'bloc-cardio-1',
  date: new Date('2025-01-15'),
  startTime: '08:00',
  endTime: '17:00',
  type: 'GARDE',
  status: 'CONFIRMED',
  specialite: 'Anesthésie',
  site: 'Site Principal',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  isRecurring: false,
  shiftType: 'JOUR',
  ...overrides,
});

/**
 * Factory pour créer un planning complet sur une période
 */
export const createPlanningPeriod = (startDate: Date, endDate: Date, team: TestUser[], rooms: TestOperatingRoom[]) => {
  const assignments: TestAssignment[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Gardes de jour (8h-17h)
    const dayShifts = rooms.slice(0, 3).map((room, index) => {
      const assignedUser = team[index % team.length];
      return createTestAssignment({
        userId: assignedUser.id,
        operatingRoomId: room.id,
        date: new Date(currentDate),
        startTime: '08:00',
        endTime: '17:00',
        type: 'GARDE',
        shiftType: 'JOUR',
        specialite: assignedUser.specialite,
      });
    });

    // Gardes de nuit (17h-08h+1)
    const nightShifts = rooms.slice(0, 2).map((room, index) => {
      const assignedUser = team[(index + 3) % team.length];
      return createTestAssignment({
        userId: assignedUser.id,
        operatingRoomId: room.id,
        date: new Date(currentDate),
        startTime: '17:00',
        endTime: '08:00',
        type: 'GARDE',
        shiftType: 'NUIT',
        specialite: assignedUser.specialite,
      });
    });

    // Astreintes
    const onCallShifts = [
      createTestAssignment({
        userId: team[team.length - 1].id,
        date: new Date(currentDate),
        startTime: '17:00',
        endTime: '08:00',
        type: 'ASTREINTE',
        shiftType: 'NUIT',
        specialite: 'Anesthésie',
        status: 'CONFIRMED',
      }),
    ];

    assignments.push(...dayShifts, ...nightShifts, ...onCallShifts);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return assignments;
};

/**
 * Factory pour créer des configurations de planning
 */
export const createTestPlanningConfiguration = (overrides: Partial<TestPlanningConfiguration> = {}): TestPlanningConfiguration => ({
  id: `config-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Configuration Standard',
  dateDebut: new Date('2025-01-01'),
  dateFin: new Date('2025-01-31'),
  rules: {
    maxGardesMois: 8,
    maxGardesConsecutives: 2,
    minReposEntreGardes: 1,
    maxAstreintesMois: 4,
    minPersonnelParBloc: 2,
    ratioMARIADE: 1.5,
  },
  active: true,
  createdBy: 1,
  constraints: [],
  ...overrides,
});

/**
 * Factory pour créer des modèles de créneaux
 */
export const createTestShiftTemplate = (overrides: Partial<TestShiftTemplate> = {}): TestShiftTemplate => ({
  id: `template-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Garde Jour Standard',
  type: 'GARDE',
  startTime: '08:00',
  endTime: '17:00',
  requiredStaff: {
    MAR: 1,
    IADE: 1,
  },
  specialtyRequired: 'Anesthésie',
  isNightShift: false,
  weekendOnly: false,
  recurring: true,
  ...overrides,
});

/**
 * Factory pour créer des scénarios de conflit de planning
 */
export const createConflictScenario = () => {
  const user = createTestUser({ id: 1 });
  const room1 = createTestOperatingRoom({ id: 'room-1' });
  const room2 = createTestOperatingRoom({ id: 'room-2' });

  const conflictingAssignments = [
    createTestAssignment({
      id: 'conflict-1',
      userId: user.id,
      operatingRoomId: room1.id,
      date: new Date('2025-01-15'),
      startTime: '08:00',
      endTime: '17:00',
      type: 'GARDE',
    }),
    createTestAssignment({
      id: 'conflict-2',
      userId: user.id,
      operatingRoomId: room2.id,
      date: new Date('2025-01-15'),
      startTime: '14:00',
      endTime: '22:00',
      type: 'GARDE',
    }),
  ];

  return { user, rooms: [room1, room2], conflictingAssignments };
};

/**
 * Factory pour créer des règles métier spécifiques
 */
export const createBusinessRules = () => ({
  gardeRules: {
    maxGardesParMois: 8,
    maxGardesConsecutives: 2,
    minReposEntreGardes: 11, // heures
    interdictionGardeApresAstreinte: true,
    maxHeuresConsecutives: 24,
  },
  astreinteRules: {
    maxAstreintesParMois: 4,
    minReposApresAstreinte: 24, // heures
    maxAstreintesConsecutives: 1,
    interdictionAstreinteWeekend: false,
  },
  specialityRules: {
    ratioMARIADE: 1.5,
    superviseurObligatoire: true,
    minExperienceBlocComplexe: 'SENIOR',
    rotationObligatoire: true,
  },
  workTimeRules: {
    maxHebdomadaire: 48,
    maxQuotidien: 12,
    reposMinimumJournalier: 11,
    reposMinimumHebdomadaire: 35,
  },
});

/**
 * Factory pour créer des données de performance
 */
export const createPerformanceTestData = (scale: 'small' | 'medium' | 'large' = 'medium') => {
  const scales = {
    small: { users: 10, rooms: 5, days: 7 },
    medium: { users: 50, rooms: 15, days: 30 },
    large: { users: 200, rooms: 50, days: 90 },
  };

  const config = scales[scale];
  const team = createMedicalTeam(config.users);
  const rooms = Array.from({ length: config.rooms }, (_, i) => 
    createTestOperatingRoom({ id: `room-${i + 1}`, name: `Bloc ${i + 1}` })
  );

  const startDate = new Date('2025-01-01');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + config.days);

  const assignments = createPlanningPeriod(startDate, endDate, team, rooms);

  return {
    team,
    rooms,
    assignments,
    startDate,
    endDate,
    metadata: {
      scale,
      totalUsers: config.users,
      totalRooms: config.rooms,
      totalDays: config.days,
      totalAssignments: assignments.length,
    },
  };
};

/**
 * Factory pour créer des scénarios de drag & drop
 */
export const createDragDropScenario = () => {
  const sourceAssignment = createTestAssignment({
    id: 'drag-source',
    userId: 1,
    operatingRoomId: 'room-1',
    date: new Date('2025-01-15'),
    startTime: '08:00',
    endTime: '17:00',
  });

  const targetSlot = {
    operatingRoomId: 'room-2',
    date: new Date('2025-01-16'),
    startTime: '08:00',
    endTime: '17:00',
  };

  const validationResult = {
    isValid: true,
    conflicts: [],
    warnings: [],
  };

  return {
    sourceAssignment,
    targetSlot,
    validationResult,
    expectedResult: {
      ...sourceAssignment,
      operatingRoomId: targetSlot.operatingRoomId,
      date: targetSlot.date,
    },
  };
};

/**
 * Mock des services de planning pour les tests
 */
export const createPlanningServiceMocks = () => ({
  planningService: {
    generatePlanning: jest.fn(),
    validatePlanning: jest.fn(),
    savePlanning: jest.fn(),
    getPlanningByDate: jest.fn(),
    optimizePlanning: jest.fn(),
  },
  blocPlanningService: {
    getBlocPlanning: jest.fn(),
    updateBlocAssignment: jest.fn(),
    validateBlocAssignment: jest.fn(),
    getBlocCapacity: jest.fn(),
    getBlocAvailability: jest.fn(),
  },
  planningGenerator: {
    generate: jest.fn(),
    initialize: jest.fn(),
    setConfiguration: jest.fn(),
    getMetrics: jest.fn(),
  },
  planningSimulator: {
    simulate: jest.fn(),
    compareScenarios: jest.fn(),
    analyzePerformance: jest.fn(),
    generateReport: jest.fn(),
  },
});

/**
 * Utilitaire pour créer des mocks React pour les tests de composants
 */
export const createReactTestMocks = () => ({
  useState: jest.fn((initial) => [initial, jest.fn()]),
  useEffect: jest.fn((fn) => fn()),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  useRef: jest.fn(() => ({ current: null })),
  useContext: jest.fn(() => ({})),
});

export default {
  createTestUser,
  createMedicalTeam,
  createTestOperatingRoom,
  createOperatingBlock,
  createTestAssignment,
  createPlanningPeriod,
  createTestPlanningConfiguration,
  createTestShiftTemplate,
  createConflictScenario,
  createBusinessRules,
  createPerformanceTestData,
  createDragDropScenario,
  createPlanningServiceMocks,
  createReactTestMocks,
};