// Mock du client Prisma pour les tests
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Types pour les modèles Prisma
type ModelOperations = {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
};

// Mock type du client Prisma
interface PrismaClientMock {
  // Modèles de base
  leave: ModelOperations;
  leaveBalance: ModelOperations;
  leaveTypeSetting: ModelOperations;
  user: ModelOperations;
  quotaCarryOver: ModelOperations;
  quotaTransfer: ModelOperations;
  notification: ModelOperations;
  notificationSetting: ModelOperations;
  planningRule: ModelOperations;
  planningRuleV2: ModelOperations;
  auditLog: ModelOperations;
  assignment: ModelOperations;
  blocPlanning: ModelOperations;
  operatingRoom: ModelOperations;
  operatingSector: ModelOperations;
  surgeon: ModelOperations;
  site: ModelOperations;
  // Méthodes utilitaires
  $disconnect: jest.Mock<Promise<void>>;
  $queryRawUnsafe: jest.Mock<Promise<unknown>>;
  $use: jest.Mock<void>;
  $extends: jest.Mock<DeepMockProxy<PrismaClientMock>>;
  $transaction: jest.Mock<Promise<unknown>>;
}

// Créer un mock deep du client Prisma
export const prisma = mockDeep<PrismaClientMock>();

// Configuration des méthodes spéciales qui nécessitent une implémentation
(prisma.$transaction as jest.Mock).mockImplementation(async (fn: unknown) => {
  if (typeof fn === 'function') {
    return await fn(prisma);
  }
  return Promise.resolve(fn);
});

// Mock pour PrismaClient spécifique pour les tests
export const PrismaClient = jest.fn().mockImplementation(() => {
  return prisma;
});

// Export des enums Prisma
export enum Role {
  ADMIN_TOTAL = 'ADMIN_TOTAL',
  ADMIN_PARTIEL = 'ADMIN_PARTIEL',
  USER = 'USER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum UserStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
}

export enum ProfessionalRole {
  MAR = 'MAR',
  IADE = 'IADE',
  SECRETAIRE = 'SECRETAIRE',
}

export enum NotificationType {
  NEW_CONTEXTUAL_MESSAGE = 'NEW_CONTEXTUAL_MESSAGE',
  MENTION_IN_MESSAGE = 'MENTION_IN_MESSAGE',
  NEW_PLANNING_COMMENT = 'NEW_PLANNING_COMMENT',
  ASSIGNMENT_SWAP_REQUEST_RECEIVED = 'ASSIGNMENT_SWAP_REQUEST_RECEIVED',
  ASSIGNMENT_SWAP_REQUEST_ACCEPTED = 'ASSIGNMENT_SWAP_REQUEST_ACCEPTED',
  ASSIGNMENT_SWAP_REQUEST_REJECTED = 'ASSIGNMENT_SWAP_REQUEST_REJECTED',
  ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN = 'ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN',
  ASSIGNMENT_SWAP_REQUEST_CANCELLED = 'ASSIGNMENT_SWAP_REQUEST_CANCELLED',
  ASSIGNMENT_REMINDER = 'ASSIGNMENT_REMINDER',
  PLANNING_UPDATED_IMPACTING_YOU = 'PLANNING_UPDATED_IMPACTING_YOU',
  LEAVE_REQUEST_STATUS_CHANGED = 'LEAVE_REQUEST_STATUS_CHANGED',
  NEW_OPEN_SHIFT_AVAILABLE = 'NEW_OPEN_SHIFT_AVAILABLE',
  TEAM_PLANNING_PUBLISHED = 'TEAM_PLANNING_PUBLISHED',
  RULE_CONFLICT_DETECTED_ADMIN = 'RULE_CONFLICT_DETECTED_ADMIN',
  GENERAL_INFO = 'GENERAL_INFO',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum Period {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  ALL_DAY = 'ALL_DAY',
  NIGHT = 'NIGHT',
}

export enum WeekType {
  REGULAR = 'REGULAR',
  SPECIAL = 'SPECIAL',
  HOLIDAY = 'HOLIDAY',
}

export enum BlocPlanningStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BlocStaffRole {
  SUPERVISION = 'SUPERVISION',
  ANESTHESIA = 'ANESTHESIA',
  AIDE = 'AIDE',
}

export enum ConflictSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

// Types de base pour les modèles
export interface User {
  id: number;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: Role;
  status: UserStatus;
  professionalRole: ProfessionalRole;
  sites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Leave {
  id: number;
  userId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: number;
  userId: number;
  type: string;
  year: number;
  initialBalance: number;
  usedDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveTypeSetting {
  id: number;
  type: string;
  displayName: string;
  defaultDays: number;
  carryOverEnabled: boolean;
  maxCarryOverDays?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note: The beforeEach is removed to avoid conflicts with test setup
