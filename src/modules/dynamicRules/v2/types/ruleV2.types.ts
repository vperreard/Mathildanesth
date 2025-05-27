import { Rule, RuleCondition, RuleAction, RuleMetadata } from '../../types/rule';

export type RuleStatus = 'draft' | 'active' | 'archived' | 'pending_approval';
export type ConflictStrategy = 'priority' | 'merge' | 'override' | 'manual';
export type ParameterType = 'string' | 'number' | 'boolean' | 'select' | 'date' | 'user' | 'role';

export interface RuleV2 extends Rule {
  version: number;
  parentId?: string;
  createdBy: string;
  updatedBy: string;
  approvedBy?: string;
  status: RuleStatus;
  effectiveDate: Date;
  expirationDate?: Date;
  conflictsWith?: string[];
  dependencies?: string[];
  metrics?: RuleMetrics;
  tags?: string[];
  comments?: RuleComment[];
}

export interface RuleMetrics {
  evaluationCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastEvaluatedAt?: Date;
  impactedUsersCount?: number;
  violationCount?: number;
}

export interface RuleComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RuleTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  baseRule: Partial<RuleV2>;
  parameters: TemplateParameter[];
  examples: RuleExample[];
  previewConfig?: PreviewConfiguration;
}

export interface TemplateParameter {
  name: string;
  type: ParameterType;
  label: string;
  description?: string;
  required: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

export interface RuleExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
  expectedBehavior: string;
}

export interface PreviewConfiguration {
  sampleDataSize: number;
  timeRange: 'day' | 'week' | 'month';
  includeMetrics: boolean;
}

export interface RuleConflict {
  id: string;
  ruleIds: string[];
  type: 'condition_overlap' | 'action_contradiction' | 'resource_conflict' | 'timing_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  id: string;
  conflictId: string;
  strategy: ConflictStrategy;
  resolvedRules?: RuleV2[];
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: number;
  changes: RuleChange[];
  createdBy: string;
  createdAt: Date;
  message?: string;
  snapshot: RuleV2;
}

export interface RuleChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'add' | 'modify' | 'delete';
}

export interface RuleSimulation {
  id: string;
  ruleId: string;
  startDate: Date;
  endDate: Date;
  affectedUsers: SimulationUser[];
  violations: SimulationViolation[];
  metrics: SimulationMetrics;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface SimulationUser {
  userId: string;
  userName: string;
  impactLevel: 'low' | 'medium' | 'high';
  affectedDates: Date[];
}

export interface SimulationViolation {
  date: Date;
  userId: string;
  ruleId: string;
  description: string;
  severity: string;
}

export interface SimulationMetrics {
  totalViolations: number;
  affectedUsersCount: number;
  complianceRate: number;
  estimatedWorkloadChange: number;
}

export interface RuleBuilderState {
  rule: Partial<RuleV2>;
  isValid: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  preview?: RuleSimulation;
  conflicts?: RuleConflict[];
}

export interface RuleEvaluationContext {
  userId: string;
  date: Date;
  planning?: any;
  leaves?: any;
  assignments?: any;
  metadata?: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  passed: boolean;
  actions?: RuleAction[];
  violations?: string[];
  executionTime: number;
  context: RuleEvaluationContext;
}