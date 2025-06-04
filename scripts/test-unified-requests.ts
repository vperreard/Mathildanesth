import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUnifiedRequests() {
  console.log('🧪 Test du système de demandes unifiées\n');

  try {
    // 1. Utiliser un utilisateur existant
    console.log('1️⃣ Récupération d\'un utilisateur existant...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'admin@mathildanesth.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.findFirst();
    }
    
    if (!testUser) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }
    
    console.log('✅ Utilisateur trouvé:', testUser.email);

    // 2. Créer différents types de demandes
    console.log('\n2️⃣ Création de demandes de différents types...');
    
    // Demande de congé
    const leaveRequest = await prisma.unifiedRequest.create({
      data: {
        type: 'LEAVE',
        status: 'pending',
        priority: 'normal',
        requesterId: testUser.id,
        title: 'Demande de congé annuel',
        description: 'Congé du 15 au 20 juillet 2025',
        data: {
          leaveTypeCode: 'ANNUAL',
          startDate: new Date('2025-07-15'),
          endDate: new Date('2025-07-20'),
          daysTaken: 5,
        },
        currentStep: 'pending',
        workflowHistory: [{
          step: 'created',
          timestamp: new Date(),
          userId: testUser.id,
          action: 'created',
        }],
        submittedAt: new Date(),
      },
    });
    console.log('✅ Demande de congé créée:', leaveRequest.id);

    // Demande d'échange
    const swapRequest = await prisma.unifiedRequest.create({
      data: {
        type: 'ASSIGNMENT_SWAP',
        status: 'pending',
        priority: 'high',
        requesterId: testUser.id,
        title: 'Échange de garde - 25 juillet',
        description: 'Besoin d\'échanger ma garde du 25 juillet',
        data: {
          assignmentDate: new Date('2025-07-25'),
          assignmentType: 'GARDE',
          reason: 'Obligation familiale',
        },
        currentStep: 'pending',
        workflowHistory: [{
          step: 'created',
          timestamp: new Date(),
          userId: testUser.id,
          action: 'created',
        }],
        submittedAt: new Date(),
      },
    });
    console.log('✅ Demande d\'échange créée:', swapRequest.id);

    // Demande générale
    const generalRequest = await prisma.unifiedRequest.create({
      data: {
        type: 'GENERAL',
        status: 'draft',
        priority: 'low',
        requesterId: testUser.id,
        title: 'Demande de formation',
        description: 'Je souhaite participer à la formation sur les nouvelles techniques d\'anesthésie',
        data: {
          category: 'FORMATION',
        },
        currentStep: 'draft',
        workflowHistory: [{
          step: 'created',
          timestamp: new Date(),
          userId: testUser.id,
          action: 'created',
        }],
      },
    });
    console.log('✅ Demande générale créée:', generalRequest.id);

    // 3. Tester les requêtes
    console.log('\n3️⃣ Test des requêtes...');
    
    // Récupérer toutes les demandes de l'utilisateur
    const userRequests = await prisma.unifiedRequest.findMany({
      where: { requesterId: testUser.id },
      include: {
        requester: true,
        notifications: true,
      },
    });
    console.log(`✅ ${userRequests.length} demandes trouvées pour l'utilisateur`);

    // Récupérer par type
    const leaveRequests = await prisma.unifiedRequest.findMany({
      where: { type: 'LEAVE' },
    });
    console.log(`✅ ${leaveRequests.length} demandes de congé trouvées`);

    // Récupérer par statut
    const pendingRequests = await prisma.unifiedRequest.findMany({
      where: { status: 'pending' },
    });
    console.log(`✅ ${pendingRequests.length} demandes en attente trouvées`);

    // 4. Tester la mise à jour du workflow
    console.log('\n4️⃣ Test de mise à jour du workflow...');
    
    const updatedRequest = await prisma.unifiedRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: 'approved',
        currentStep: 'approved',
        workflowHistory: {
          push: {
            step: 'approved',
            timestamp: new Date(),
            userId: testUser.id,
            action: 'approved',
            comment: 'Approuvé par le responsable',
          },
        },
        resolvedAt: new Date(),
      },
    });
    console.log('✅ Demande mise à jour:', updatedRequest.status);

    // 5. Créer une notification
    console.log('\n5️⃣ Test de création de notification...');
    
    const notification = await prisma.unifiedRequestNotification.create({
      data: {
        requestId: leaveRequest.id,
        type: 'EMAIL',
        recipientId: testUser.id,
        subject: 'Votre demande de congé a été approuvée',
        content: 'Votre demande de congé du 15 au 20 juillet a été approuvée.',
        status: 'sent',
        sentAt: new Date(),
      },
    });
    console.log('✅ Notification créée:', notification.id);

    // 6. Afficher les statistiques
    console.log('\n6️⃣ Statistiques finales...');
    
    const stats = await prisma.unifiedRequest.groupBy({
      by: ['type', 'status'],
      _count: true,
    });
    
    console.log('\n📊 Répartition des demandes:');
    stats.forEach(stat => {
      console.log(`   ${stat.type} - ${stat.status}: ${stat._count}`);
    });

    console.log('\n✅ Tous les tests ont réussi!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testUnifiedRequests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });