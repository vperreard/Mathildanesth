import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    // Vérifier si l'utilisateur test existe déjà
    const existingUser = await prisma.user.findFirst({
      where: { login: 'test.user' }
    });

    if (existingUser) {
      console.log('✅ Utilisateur test existe déjà:', {
        id: existingUser.id,
        login: existingUser.login,
        email: existingUser.email,
        role: existingUser.role
      });
      return;
    }

    // Créer un hash du mot de passe
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Créer l'utilisateur test
    const testUser = await prisma.user.create({
      data: {
        login: 'test.user',
        email: 'test@mathildanesth.fr',
        password: hashedPassword,
        nom: 'User',
        prenom: 'Test',
        role: 'USER',
        professionalRole: 'IADE',
        actif: true
      }
    });

    console.log('✅ Utilisateur test créé avec succès:', {
      id: testUser.id,
      login: testUser.login,
      email: testUser.email,
      role: testUser.role
    });

    // Créer aussi un utilisateur admin pour les tests
    const adminUser = await prisma.user.create({
      data: {
        login: 'admin.test',
        email: 'admin@mathildanesth.fr',
        password: hashedPassword,
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN_TOTAL',
        professionalRole: 'MAR',
        actif: true
      }
    });

    console.log('✅ Utilisateur admin créé avec succès:', {
      id: adminUser.id,
      login: adminUser.login,
      email: adminUser.email,
      role: adminUser.role
    });

    console.log('\n📝 Informations de connexion:');
    console.log('Utilisateur standard:');
    console.log('  Login: test.user');
    console.log('  Mot de passe: Test123!');
    console.log('\nUtilisateur admin:');
    console.log('  Login: admin.test');
    console.log('  Mot de passe: Test123!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();