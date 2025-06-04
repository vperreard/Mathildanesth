import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserRequests() {
  console.log('🔄 Début de la migration des UserRequest vers UnifiedRequest...');
  
  const userRequests = await prisma.userRequest.findMany({
    include: {
      user: true,
      site: true,
    },
  });

  console.log(`📊 ${userRequests.length} UserRequest trouvées`);

  for (const request of userRequests) {
    try {
      await prisma.unifiedRequest.create({
        data: {
          type: request.type || 'GENERAL',
          status: request.status || 'pending',
          priority: request.priority || 'normal',
          requesterId: request.userId,
          title: request.title || 'Demande générale',
          description: request.content,
          data: {
            originalType: request.type,
            metadata: request.metadata || {},
          },
          currentStep: request.status || 'pending',
          workflowHistory: [{
            step: 'created',
            timestamp: request.createdAt,
            userId: request.userId,
            action: 'created',
          }],
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          submittedAt: request.status !== 'draft' ? request.createdAt : null,
          resolvedAt: request.status === 'resolved' ? request.updatedAt : null,
          siteId: request.siteId,
          legacyType: 'UserRequest',
          legacyId: request.id,
        },
      });
      
      console.log(`✅ UserRequest ${request.id} migrée`);
    } catch (error) {
      console.error(`❌ Erreur lors de la migration de UserRequest ${request.id}:`, error);
    }
  }
}

async function migrateAssignmentSwapRequests() {
  console.log('🔄 Début de la migration des AssignmentSwapRequest vers UnifiedRequest...');
  
  const swapRequests = await prisma.assignmentSwapRequest.findMany({
    include: {
      initiator: true,
      targetUser: true,
      proposedAssignment: true,
      requestedAssignment: true,
    },
  });

  console.log(`📊 ${swapRequests.length} AssignmentSwapRequest trouvées`);

  for (const request of swapRequests) {
    try {
      const statusMap: Record<string, string> = {
        'PENDING': 'pending',
        'ACCEPTED': 'approved',
        'REJECTED': 'rejected',
        'CANCELLED': 'cancelled',
        'EXPIRED': 'expired',
      };

      await prisma.unifiedRequest.create({
        data: {
          type: 'ASSIGNMENT_SWAP',
          status: statusMap[request.status] || 'pending',
          priority: 'normal',
          requesterId: request.initiatorUserId,
          assignedToId: request.targetUserId,
          title: `Échange d'affectation - ${new Date(request.proposedAssignment?.date || request.createdAt).toLocaleDateString('fr-FR')}`,
          description: request.message || 'Demande d\'échange d\'affectation',
          data: {
            proposedAssignmentId: request.proposedAssignmentId,
            requestedAssignmentId: request.requestedAssignmentId,
            message: request.message,
            responseMessage: request.responseMessage,
            expiresAt: request.expiresAt,
          },
          currentStep: statusMap[request.status] || 'pending',
          workflowHistory: [
            {
              step: 'created',
              timestamp: request.createdAt,
              userId: request.initiatorUserId,
              action: 'created',
            },
            ...(request.status !== 'PENDING' ? [{
              step: statusMap[request.status],
              timestamp: request.updatedAt,
              userId: request.targetUserId || request.initiatorUserId,
              action: request.status.toLowerCase(),
              comment: request.responseMessage,
            }] : []),
          ],
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          submittedAt: request.createdAt,
          resolvedAt: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(request.status) ? request.updatedAt : null,
          legacyType: 'AssignmentSwapRequest',
          legacyId: request.id,
        },
      });
      
      console.log(`✅ AssignmentSwapRequest ${request.id} migrée`);
    } catch (error) {
      console.error(`❌ Erreur lors de la migration de AssignmentSwapRequest ${request.id}:`, error);
    }
  }
}

async function migrateLeaveRequests() {
  console.log('🔄 Migration des demandes de congés vers UnifiedRequest...');
  
  const leaves = await prisma.leave.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'REJECTED'],
      },
    },
    include: {
      user: true,
      leaveType: true,
    },
  });

  console.log(`📊 ${leaves.length} demandes de congés trouvées`);

  for (const leave of leaves) {
    try {
      const statusMap: Record<string, string> = {
        'PENDING': 'pending',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'CANCELLED': 'cancelled',
      };

      await prisma.unifiedRequest.create({
        data: {
          type: 'LEAVE',
          status: statusMap[leave.status] || 'pending',
          priority: 'normal',
          requesterId: leave.userId,
          title: `Demande de congé - ${leave.leaveType?.name || leave.leaveTypeCode}`,
          description: `Du ${new Date(leave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.endDate).toLocaleDateString('fr-FR')}`,
          data: {
            leaveId: leave.id,
            leaveTypeCode: leave.leaveTypeCode,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            isRecurring: leave.isRecurring,
            isPeriodic: leave.isPeriodic,
            daysTaken: leave.daysTaken,
          },
          currentStep: statusMap[leave.status] || 'pending',
          workflowHistory: [
            {
              step: 'created',
              timestamp: leave.createdAt,
              userId: leave.userId,
              action: 'created',
            },
            ...(leave.status !== 'PENDING' ? [{
              step: statusMap[leave.status],
              timestamp: leave.updatedAt,
              userId: leave.approvedBy || leave.userId,
              action: leave.status.toLowerCase(),
            }] : []),
          ],
          createdAt: leave.createdAt,
          updatedAt: leave.updatedAt,
          submittedAt: leave.createdAt,
          resolvedAt: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(leave.status) ? leave.updatedAt : null,
          legacyType: 'Leave',
          legacyId: leave.id,
        },
      });
      
      console.log(`✅ Leave ${leave.id} migrée`);
    } catch (error) {
      console.error(`❌ Erreur lors de la migration de Leave ${leave.id}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Début de la migration vers le système de demandes unifiées');
  
  try {
    // Migrer les différents types de demandes
    await migrateUserRequests();
    await migrateAssignmentSwapRequests();
    await migrateLeaveRequests();
    
    // Compter les résultats
    const totalUnifiedRequests = await prisma.unifiedRequest.count();
    console.log(`\n✅ Migration terminée! ${totalUnifiedRequests} demandes unifiées créées.`);
    
    // Afficher les statistiques par type
    const stats = await prisma.unifiedRequest.groupBy({
      by: ['type'],
      _count: true,
    });
    
    console.log('\n📊 Statistiques par type:');
    stats.forEach(stat => {
      console.log(`   - ${stat.type}: ${stat._count} demandes`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });