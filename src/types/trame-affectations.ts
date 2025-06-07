import { z } from 'zod';
import type { TrameAffectation, TramePeriod, TrameAssignment, User } from '@prisma/client';

// Base types from Prisma
export type TrameAffectationType = TrameAffectation & {
  periods?: TramePeriodType[];
  user?: User | null;
};

export type TramePeriodType = TramePeriod & {
  assignments?: TrameAssignmentType[];
};

export type TrameAssignmentType = TrameAssignment & {
  period?: TramePeriod;
  trame?: TrameAffectation;
};

// API Request/Response types
export interface CreateTrameAffectationRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  startDate: string;
  endDate?: string;
  periods?: CreateTramePeriodRequest[];
}

export interface CreateTramePeriodRequest {
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface UpdateTrameAffectationRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TrameAffectationResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  periods: TramePeriodResponse[];
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export interface TramePeriodResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  assignmentsCount?: number;
}

// Validation schemas
export const CreateTrameAffectationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  periods: z.array(z.object({
    name: z.string().min(1).max(100),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    isActive: z.boolean().optional().default(true),
    isLocked: z.boolean().optional().default(false),
  })).optional(),
});

export const UpdateTrameAffectationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const QueryTrameAffectationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  isActive: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'startDate', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Service response types
export interface TrameAffectationListResponse {
  data: TrameAffectationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Business logic types
export interface TrameAffectationFilters {
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  createdBy?: number;
}

export interface TrameAffectationSortOptions {
  sortBy: 'name' | 'startDate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}