import { prisma } from '@/lib/prisma';
import { 
  UnifiedRequest, 
  UnifiedRequestType, 
  UnifiedRequestStatus,
  RequestPriority,
  RequestFilter,
  RequestTypeConfig,
  RequestWorkflowStep
} from '@/types/unified-request';
import { notificationService } from '@/services/notificationService';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

export class UnifiedRequestService {
  private static instance: UnifiedRequestService;
  
  private constructor() {}
  
  static getInstance(): UnifiedRequestService {
    if (!UnifiedRequestService.instance) {
      UnifiedRequestService.instance = new UnifiedRequestService();
    }
    return UnifiedRequestService.instance;
  }

  // Configuration des types de demandes
  private requestTypeConfigs: Map<UnifiedRequestType, RequestTypeConfig> = new Map([
    [UnifiedRequestType.ASSIGNMENT_SWAP, {
      type: UnifiedRequestType.ASSIGNMENT_SWAP,
      category: 'planning',
      label: 'Échange de garde',
      description: 'Demander un échange de garde avec un collègue',
      icon: 'swap',
      color: 'blue',
      requiresApproval: false,
      workflow: [
        {
          stepName: 'Proposition',
          stepOrder: 1,
          assignTo: 'TARGET',
          requiredAction: 'Accepter ou refuser l\'échange'
        },
        {
          stepName: 'Validation automatique',
          stepOrder: 2,
          assignTo: 'ADMIN',
          requiredAction: 'Validation des règles métier',
          autoCompleteConditions: [{
            field: 'metadata.rulesValid',
            operator: 'equals',
            value: true
          }]
        }
      ],
      formFields: [
        {
          name: 'proposedAssignmentId',
          label: 'Ma garde à échanger',
          type: 'assignment-select',
          required: true
        },
        {
          name: 'targetUserId',
          label: 'Collègue pour l\'échange',
          type: 'user-select',
          required: true
        },
        {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          required: false,
          placeholder: 'Message optionnel pour votre collègue'
        }
      ],
      notificationTemplates: [
        {
          event: 'CREATED',
          recipients: 'TARGET',
          title: 'Nouvelle demande d\'échange de garde',
          message: '{{initiatorName}} vous propose un échange de garde pour le {{swapDate}}',
          channels: ['PUSH', 'IN_APP']
        }
      ],
      slaHours: 48
    }],
    
    [UnifiedRequestType.LEAVE, {
      type: UnifiedRequestType.LEAVE,
      category: 'congés',
      label: 'Demande de congé',
      description: 'Faire une demande de congé ou d\'absence',
      icon: 'calendar-off',
      color: 'green',
      requiresApproval: true,
      approvers: ['ADMIN', 'MANAGER'],
      workflow: [
        {
          stepName: 'Validation manager',
          stepOrder: 1,
          assignTo: 'ROLE',
          assignToValue: 'MANAGER',
          requiredAction: 'Valider la demande de congé'
        },
        {
          stepName: 'Validation RH',
          stepOrder: 2,
          assignTo: 'ROLE',
          assignToValue: 'HR',
          requiredAction: 'Validation finale et mise à jour des soldes'
        }
      ],
      formFields: [
        {
          name: 'leaveTypeId',
          label: 'Type de congé',
          type: 'select',
          required: true,
          options: [] // Chargé dynamiquement
        },
        {
          name: 'startDate',
          label: 'Date de début',
          type: 'date',
          required: true
        },
        {
          name: 'endDate',
          label: 'Date de fin',
          type: 'date',
          required: true
        },
        {
          name: 'reason',
          label: 'Motif',
          type: 'textarea',
          required: false
        }
      ],
      notificationTemplates: [
        {
          event: 'CREATED',
          recipients: 'ADMINS',
          title: 'Nouvelle demande de congé',
          message: '{{initiatorName}} a demandé un congé du {{startDate}} au {{endDate}}',
          channels: ['EMAIL', 'IN_APP']
        },
        {
          event: 'STATUS_CHANGED',
          recipients: 'INITIATOR',
          title: 'Mise à jour de votre demande',
          message: 'Votre demande de congé a été {{status}}',
          channels: ['PUSH', 'IN_APP']
        }
      ],
      slaHours: 72
    }],
    
    [UnifiedRequestType.EMERGENCY_REPLACEMENT, {
      type: UnifiedRequestType.EMERGENCY_REPLACEMENT,
      category: 'urgence',
      label: 'Remplacement urgent',
      description: 'Demander un remplacement en urgence',
      icon: 'alert-circle',
      color: 'red',
      requiresApproval: false,
      workflow: [
        {
          stepName: 'Recherche automatique',
          stepOrder: 1,
          assignTo: 'ADMIN',
          requiredAction: 'Trouver un remplaçant disponible'
        }
      ],
      formFields: [
        {
          name: 'shiftDate',
          label: 'Date de la garde',
          type: 'date',
          required: true
        },
        {
          name: 'shiftTime',
          label: 'Horaire',
          type: 'text',
          required: true
        },
        {
          name: 'room',
          label: 'Salle/Service',
          type: 'text',
          required: true
        },
        {
          name: 'reason',
          label: 'Raison de l\'absence',
          type: 'textarea',
          required: true
        }
      ],
      notificationTemplates: [
        {
          event: 'CREATED',
          recipients: 'ADMINS',
          title: '🚨 Remplacement urgent nécessaire',
          message: 'Remplacement urgent pour {{room}} le {{shiftDate}}',
          channels: ['PUSH', 'EMAIL', 'IN_APP']
        }
      ],
      slaHours: 2
    }]
  ]);

  // Créer une nouvelle demande
  async createRequest(data: {
    type: UnifiedRequestType;
    title: string;
    description: string;
    priority?: RequestPriority;
    initiatorId: number;
    targetUserId?: number;
    metadata?: any;
    expiresAt?: Date;
  }): Promise<UnifiedRequest> {
    const config = this.requestTypeConfigs.get(data.type);
    if (!config) {
      throw new Error(`Type de demande non configuré: ${data.type}`);
    }

    // Créer la demande
    const request = await prisma.unifiedRequest.create({
      data: {
        type: data.type,
        category: config.category,
        title: data.title,
        description: data.description,
        status: UnifiedRequestStatus.SUBMITTED,
        priority: data.priority || RequestPriority.MEDIUM,
        initiatorId: data.initiatorId,
        targetUserId: data.targetUserId,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt || this.calculateExpiration(config.slaHours),
        workflow: {
          create: config.workflow.map((step, index) => ({
            stepName: step.stepName,
            stepOrder: step.stepOrder,
            status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
            requiredAction: step.requiredAction
          }))
        }
      },
      include: {
        workflow: true,
        initiator: true,
        targetUser: true
      }
    });

    // Envoyer les notifications
    await this.sendNotifications(request, 'CREATED', config);

    // Log d'audit
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'UnifiedRequest',
      entityId: request.id,
      userId: data.initiatorId,
      metadata: {
        requestType: data.type,
        title: data.title
      }
    });

    return request;
  }

  // Mettre à jour le statut d'une demande
  async updateRequestStatus(
    requestId: string, 
    newStatus: UnifiedRequestStatus,
    userId: number,
    notes?: string
  ): Promise<UnifiedRequest> {
    const request = await prisma.unifiedRequest.findUnique({
      where: { id: requestId },
      include: { workflow: true }
    });

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    // Mettre à jour le statut
    const updatedRequest = await prisma.unifiedRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        adminNotes: notes,
        resolvedAt: [UnifiedRequestStatus.COMPLETED, UnifiedRequestStatus.REJECTED].includes(newStatus) 
          ? new Date() 
          : undefined
      },
      include: {
        workflow: true,
        initiator: true,
        targetUser: true
      }
    });

    // Mettre à jour le workflow si nécessaire
    if (newStatus === UnifiedRequestStatus.APPROVED) {
      await this.advanceWorkflow(requestId);
    }

    // Notifications
    const config = this.requestTypeConfigs.get(request.type as UnifiedRequestType);
    if (config) {
      await this.sendNotifications(updatedRequest, 'STATUS_CHANGED', config);
    }

    // Audit
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'UnifiedRequest',
      entityId: requestId,
      userId,
      metadata: {
        previousStatus: request.status,
        newStatus,
        notes
      }
    });

    return updatedRequest;
  }

  // Récupérer les demandes avec filtres
  async getRequests(filter: RequestFilter): Promise<{
    requests: UnifiedRequest[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: any = {};

    if (filter.type?.length) {
      where.type = { in: filter.type };
    }
    if (filter.status?.length) {
      where.status = { in: filter.status };
    }
    if (filter.priority?.length) {
      where.priority = { in: filter.priority };
    }
    if (filter.category?.length) {
      where.category = { in: filter.category };
    }
    if (filter.initiatorId) {
      where.initiatorId = filter.initiatorId;
    }
    if (filter.targetUserId) {
      where.targetUserId = filter.targetUserId;
    }
    if (filter.assignedToId) {
      where.workflow = {
        some: {
          assignedToId: filter.assignedToId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      };
    }
    if (filter.searchTerm) {
      where.OR = [
        { title: { contains: filter.searchTerm, mode: 'insensitive' } },
        { description: { contains: filter.searchTerm, mode: 'insensitive' } }
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.unifiedRequest.findMany({
        where,
        include: {
          workflow: true,
          initiator: true,
          targetUser: true,
          assignedTo: true
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 20,
        skip: 0
      }),
      prisma.unifiedRequest.count({ where })
    ]);

    return {
      requests,
      total,
      page: 1,
      pageSize: 20
    };
  }

  // Assigner une demande
  async assignRequest(requestId: string, assignToId: number, assignedBy: number): Promise<void> {
    const request = await prisma.unifiedRequest.findUnique({
      where: { id: requestId },
      include: { workflow: { where: { status: 'IN_PROGRESS' } } }
    });

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    // Mettre à jour l'assignation
    await prisma.unifiedRequest.update({
      where: { id: requestId },
      data: { assignedToId: assignToId }
    });

    // Mettre à jour le workflow actuel
    if (request.workflow[0]) {
      await prisma.requestWorkflowStep.update({
        where: { id: request.workflow[0].id },
        data: { assignedToId: assignToId }
      });
    }

    // Audit
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'UnifiedRequest',
      entityId: requestId,
      userId: assignedBy,
      metadata: {
        action: 'assign',
        assignedTo: assignToId
      }
    });
  }

  // Ajouter un commentaire
  async addComment(
    requestId: string,
    userId: number,
    comment: string,
    isInternal: boolean = false
  ): Promise<void> {
    await prisma.requestComment.create({
      data: {
        requestId,
        userId,
        comment,
        isInternal
      }
    });

    // Notification si commentaire public
    if (!isInternal) {
      const request = await prisma.unifiedRequest.findUnique({
        where: { id: requestId },
        include: { initiator: true }
      });

      if (request && request.initiatorId !== userId) {
        await notificationService.createNotification({
          userId: request.initiatorId,
          type: 'COMMENT',
          title: 'Nouveau commentaire',
          content: `Un commentaire a été ajouté à votre demande "${request.title}"`,
          contextId: requestId
        });
      }
    }
  }

  // Méthodes privées
  private calculateExpiration(slaHours?: number): Date {
    const hours = slaHours || 72;
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
  }

  private async advanceWorkflow(requestId: string): Promise<void> {
    const workflow = await prisma.requestWorkflowStep.findMany({
      where: { requestId },
      orderBy: { stepOrder: 'asc' }
    });

    const currentStep = workflow.find(w => w.status === 'IN_PROGRESS');
    if (currentStep) {
      // Marquer l'étape actuelle comme complétée
      await prisma.requestWorkflowStep.update({
        where: { id: currentStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Activer l'étape suivante
      const nextStep = workflow.find(w => w.stepOrder === currentStep.stepOrder + 1);
      if (nextStep) {
        await prisma.requestWorkflowStep.update({
          where: { id: nextStep.id },
          data: { status: 'IN_PROGRESS' }
        });
      } else {
        // Toutes les étapes sont complétées
        await prisma.unifiedRequest.update({
          where: { id: requestId },
          data: {
            status: UnifiedRequestStatus.COMPLETED,
            resolvedAt: new Date()
          }
        });
      }
    }
  }

  private async sendNotifications(
    request: any,
    event: string,
    config: RequestTypeConfig
  ): Promise<void> {
    const templates = config.notificationTemplates.filter(t => t.event === event);
    
    for (const template of templates) {
      let recipientIds: number[] = [];
      
      switch (template.recipients) {
        case 'INITIATOR':
          recipientIds = [request.initiatorId];
          break;
        case 'TARGET':
          if (request.targetUserId) recipientIds = [request.targetUserId];
          break;
        case 'ADMINS':
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
          });
          recipientIds = admins.map(a => a.id);
          break;
        case 'CUSTOM':
          recipientIds = template.customRecipients || [];
          break;
      }

      // Remplacer les variables dans le message
      let message = template.message;
      message = message.replace('{{initiatorName}}', request.initiator?.prenom || 'Utilisateur');
      message = message.replace('{{requestTitle}}', request.title);
      message = message.replace('{{status}}', request.status);
      // Ajouter d'autres remplacements selon les besoins

      // Envoyer les notifications
      for (const userId of recipientIds) {
        if (template.channels.includes('IN_APP')) {
          await notificationService.createNotification({
            userId,
            type: 'REQUEST',
            title: template.title,
            content: message,
            contextId: request.id
          });
        }
        // Ajouter l'envoi par email/push si nécessaire
      }
    }
  }

  // Méthodes pour la migration des anciens systèmes
  async migrateFromOldSystems(): Promise<void> {
    // Migration des UserRequest vers UnifiedRequest
    const oldRequests = await prisma.userRequest.findMany({
      include: { user: true, requestType: true }
    });

    for (const oldRequest of oldRequests) {
      await this.createRequest({
        type: UnifiedRequestType.GENERIC,
        title: oldRequest.title,
        description: oldRequest.description,
        initiatorId: oldRequest.userId,
        metadata: {
          oldRequestId: oldRequest.id,
          requestTypeName: oldRequest.requestType.name
        }
      });
    }

    // Migration des AssignmentSwapRequest
    const swapRequests = await prisma.assignmentSwapRequest.findMany({
      include: { initiatorUser: true, targetUser: true }
    });

    for (const swap of swapRequests) {
      await this.createRequest({
        type: UnifiedRequestType.ASSIGNMENT_SWAP,
        title: `Échange de garde - ${swap.initiatorUser.prenom}`,
        description: swap.message || 'Demande d\'échange de garde',
        initiatorId: swap.initiatorUserId,
        targetUserId: swap.targetUserId || undefined,
        metadata: {
          proposedAssignmentId: swap.proposedAssignmentId,
          requestedAssignmentId: swap.requestedAssignmentId
        }
      });
    }
  }
}

export const unifiedRequestService = UnifiedRequestService.getInstance();