// Types pour le système unifié de demandes

export enum UnifiedRequestType {
  GENERIC = 'GENERIC',
  ASSIGNMENT_SWAP = 'ASSIGNMENT_SWAP', 
  LEAVE = 'LEAVE',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  EMERGENCY_REPLACEMENT = 'EMERGENCY_REPLACEMENT',
  TRAINING = 'TRAINING',
  EQUIPMENT = 'EQUIPMENT'
}

export enum UnifiedRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface UnifiedRequest {
  id: string;
  type: UnifiedRequestType;
  category: string; // Ex: "congés", "formation", "matériel"
  title: string;
  description: string;
  status: UnifiedRequestStatus;
  priority: RequestPriority;
  
  // Utilisateurs impliqués
  initiatorId: number;
  initiatorName?: string;
  targetUserId?: number;
  targetUserName?: string;
  assignedToId?: number;
  assignedToName?: string;
  
  // Données spécifiques au type de demande
  metadata: {
    // Pour ASSIGNMENT_SWAP
    proposedAssignmentId?: string;
    requestedAssignmentId?: string;
    swapDate?: Date;
    
    // Pour LEAVE
    leaveTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    halfDay?: boolean;
    
    // Pour SCHEDULE_CHANGE
    currentSchedule?: unknown;
    requestedSchedule?: unknown;
    reason?: string;
    
    // Pour EMERGENCY_REPLACEMENT
    absenceId?: string;
    shiftDate?: Date;
    shiftTime?: string;
    room?: string;
    
    // Données additionnelles flexibles
    [key: string]: unknown;
  };
  
  // Workflow et traçabilité
  workflow: RequestWorkflowStep[];
  currentStep?: string;
  
  // Notifications
  notifications: RequestNotification[];
  
  // Documents attachés
  attachments?: RequestAttachment[];
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  expiresAt?: Date;
  
  // Notes et commentaires
  adminNotes?: string;
  userNotes?: string;
  comments?: RequestComment[];
}

export interface RequestWorkflowStep {
  id: string;
  requestId: string;
  stepName: string;
  stepOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  assignedToId?: number;
  assignedToName?: string;
  requiredAction?: string;
  completedAt?: Date;
  completedBy?: number;
  notes?: string;
  autoComplete?: boolean;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface RequestNotification {
  id: string;
  requestId: string;
  userId: number;
  type: 'EMAIL' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  sentAt?: Date;
  readAt?: Date;
  actionUrl?: string;
}

export interface RequestAttachment {
  id: string;
  requestId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: number;
  uploadedAt: Date;
}

export interface RequestComment {
  id: string;
  requestId: string;
  userId: number;
  userName: string;
  comment: string;
  isInternal: boolean; // Visible uniquement par les admins
  createdAt: Date;
}

// Configuration des types de demandes
export interface RequestTypeConfig {
  type: UnifiedRequestType;
  category: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresApproval: boolean;
  approvers?: string[]; // Rôles ou IDs des approbateurs
  workflow: WorkflowTemplate[];
  formFields: FormFieldConfig[];
  notificationTemplates: NotificationTemplate[];
  slaHours?: number; // Service Level Agreement
  allowedRoles?: string[];
  maxActiveRequests?: number;
}

export interface WorkflowTemplate {
  stepName: string;
  stepOrder: number;
  assignTo: 'INITIATOR' | 'TARGET' | 'ADMIN' | 'ROLE' | 'SPECIFIC_USER';
  assignToValue?: string; // Rôle ou userId si nécessaire
  requiredAction: string;
  autoCompleteConditions?: WorkflowCondition[];
  skipConditions?: WorkflowCondition[];
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'user-select' | 'assignment-select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: FieldValidation;
  visibleIf?: WorkflowCondition;
}

export interface FieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  customValidator?: string; // Nom de la fonction de validation
}

export interface NotificationTemplate {
  event: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'COMMENTED' | 'EXPIRED' | 'REMINDER';
  recipients: 'INITIATOR' | 'TARGET' | 'ASSIGNED' | 'ADMINS' | 'CUSTOM';
  customRecipients?: number[];
  title: string;
  message: string; // Peut contenir des variables {{requestTitle}}, {{userName}}, etc.
  channels: ('EMAIL' | 'PUSH' | 'IN_APP')[];
}

// Helpers et utilitaires
export interface RequestFilter {
  type?: UnifiedRequestType[];
  status?: UnifiedRequestStatus[];
  priority?: RequestPriority[];
  category?: string[];
  initiatorId?: number;
  targetUserId?: number;
  assignedToId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface RequestStats {
  total: number;
  byStatus: Record<UnifiedRequestStatus, number>;
  byType: Record<UnifiedRequestType, number>;
  byPriority: Record<RequestPriority, number>;
  averageResolutionTime: number;
  overdueCount: number;
}