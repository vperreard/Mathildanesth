const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureTestAdmin() {
    try {
        // Vérifier si l'admin existe
        const adminExists = await prisma.user.findUnique({
            where: { email: 'admin@mathildanesth.fr' }
        });

        if (!adminExists) {
            console.log('Creating test admin user...');
            
            // Créer l'utilisateur admin
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            
            const admin = await prisma.user.create({
                data: {
                    email: 'admin@mathildanesth.fr',
                    login: 'admin@mathildanesth.fr',
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'Test',
                    role: 'ADMIN',
                    isActive: true,
                    emailVerified: new Date()
                }
            });
            
            console.log('Test admin user created successfully:', admin.email);
        } else {
            console.log('Test admin user already exists');
            
            // Vérifier que le mot de passe est correct
            const passwordValid = await bcrypt.compare('Admin123!', adminExists.password);
            if (!passwordValid) {
                console.log('Updating admin password...');
                const hashedPassword = await bcrypt.hash('Admin123!', 10);
                await prisma.user.update({
                    where: { id: adminExists.id },
                    data: { password: hashedPassword }
                });
                console.log('Admin password updated');
            }
        }

        // Vérifier qu'il y a au moins un site
        const siteCount = await prisma.site.count();
        if (siteCount === 0) {
            console.log('Creating default site...');
            
            await prisma.site.create({
                data: {
                    name: 'Site Principal',
                    description: 'Site principal de l\'hôpital'
                }
            });
            
            console.log('Default site created');
        }

    } catch (error) {
        console.error('Error ensuring test admin:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter
ensureTestAdmin()
    .then(() => {
        console.log('Test data setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test data setup failed:', error);
        process.exit(1);
    });