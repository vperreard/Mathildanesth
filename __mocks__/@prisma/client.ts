// Mock du client Prisma pour les tests
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock type du client Prisma
type PrismaClientMock = {
  // Ajouter ici les méthodes et propriétés nécessaires aux tests
  leave: any;
  leaveBalance: any;
  leaveTypeSetting: any;
  user: any;
  quotaCarryOver: any;
  quotaTransfer: any;
  notification: any;
  notificationSetting: any;
  planningRule: any;
  planningRuleV2: any;
  auditLog: any;
  assignment: any;
  blocPlanning: any;
  operatingRoom: any;
  operatingSector: any;
  surgeon: any;
  site: any;
  $disconnect: () => Promise<void>;
  $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>;
  $use: (middleware: any) => void;
  $extends: (extension: any) => any;
  $transaction: (fn: any) => Promise<any>;
};

// Créer un mock deep du client Prisma
export const prisma = mockDeep<PrismaClientMock>();

// Add mock for $use method
prisma.$use = jest.fn();
prisma.$transaction = jest.fn().mockImplementation(async fn => {
  if (typeof fn === 'function') {
    return await fn(prisma);
  }
  return Promise.resolve(fn);
});

// Note: Les méthodes de modèle sont automatiquement mockées par mockDeep

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

// Export des types
export type User = any;
export type Leave = any;
export type LeaveBalance = any;
export type LeaveTypeSetting = any;

// Note: The beforeEach is removed to avoid conflicts with test setup
