import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma');


const prisma = prisma;

export async function ensureTestData() {
    try {
        // Vérifier si l'admin existe
        const adminExists = await prisma.user.findUnique({
            where: { email: 'admin@mathildanesth.fr' }
        });

        if (!adminExists) {
            console.log('Creating test admin user...');
            
            // Créer l'utilisateur admin
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            
            await prisma.user.create({
                data: {
                    email: 'admin@mathildanesth.fr',
                    login: 'admin',
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'Test',
                    role: 'ADMIN',
                    isActive: true,
                    emailVerified: new Date()
                }
            });
            
            console.log('Test admin user created successfully');
        } else {
            console.log('Test admin user already exists');
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

        // Vérifier qu'il y a au moins un secteur
        const sectorCount = await prisma.operatingSector.count();
        if (sectorCount === 0) {
            console.log('Creating default sector...');
            
            const defaultSite = await prisma.site.findFirst();
            if (defaultSite) {
                await prisma.operatingSector.create({
                    data: {
                        name: 'Secteur Principal',
                        description: 'Secteur opératoire principal',
                        siteId: defaultSite.id,
                        displayOrder: 1
                    }
                });
                
                console.log('Default sector created');
            }
        }

    } catch (error) {
        console.error('Error ensuring test data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    ensureTestData()
        .then(() => {
            console.log('Test data setup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Test data setup failed:', error);
            process.exit(1);
        });
}