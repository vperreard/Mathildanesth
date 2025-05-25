const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureTestUsers() {
    try {
        // Utilisateur test-admin pour les tests e2e
        const testAdminExists = await prisma.user.findUnique({
            where: { email: 'test-admin@mathildanesth.fr' }
        });

        if (!testAdminExists) {
            console.log('Creating test-admin user...');
            const hashedPassword = await bcrypt.hash('Test123!', 10);
            
            await prisma.user.create({
                data: {
                    email: 'test-admin@mathildanesth.fr',
                    login: 'test-admin@mathildanesth.fr',
                    password: hashedPassword,
                    nom: 'Admin',
                    prenom: 'Test',
                    role: 'ADMIN_TOTAL',
                    professionalRole: 'ADMINISTRATOR',
                    actif: true
                }
            });
            
            console.log('Test admin user created successfully');
        }

        // Utilisateur test standard
        const testUserExists = await prisma.user.findUnique({
            where: { email: 'test-user@mathildanesth.fr' }
        });

        if (!testUserExists) {
            console.log('Creating test-user...');
            const hashedPassword = await bcrypt.hash('Test123!', 10);
            
            await prisma.user.create({
                data: {
                    email: 'test-user@mathildanesth.fr',
                    login: 'test-user@mathildanesth.fr',
                    password: hashedPassword,
                    nom: 'User',
                    prenom: 'Test',
                    role: 'USER',
                    professionalRole: 'MAR',
                    actif: true
                }
            });
            
            console.log('Test user created successfully');
        }

        // Vérifier l'admin principal
        const adminExists = await prisma.user.findUnique({
            where: { login: 'admin' }
        });

        if (!adminExists) {
            console.log('Admin user not found, creating...');
            const hashedPassword = await bcrypt.hash('admin', 10);
            
            await prisma.user.create({
                data: {
                    email: 'admin@mathildanesth.fr',
                    login: 'admin',
                    password: hashedPassword,
                    nom: 'Principal',
                    prenom: 'Admin',
                    role: 'ADMIN_TOTAL',
                    professionalRole: 'ADMINISTRATOR',
                    actif: true
                }
            });
            
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists with login: admin');
        }

    } catch (error) {
        console.error('Error ensuring test users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter
ensureTestUsers()
    .then(() => {
        console.log('Test users setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test users setup failed:', error);
        process.exit(1);
    });