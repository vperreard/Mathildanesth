import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Récupérer tous les utilisateurs
        const users = await prisma.user.findMany({
            select: {
                id: true,
                login: true,
                nom: true,
                prenom: true,
                email: true,
                role: true,
                professionalRole: true
            }
        });

        console.log('Utilisateurs trouvés:', JSON.stringify(users, null, 2));

        // Vérifier spécifiquement l'utilisateur admin
        const adminUser = await prisma.user.findUnique({
            where: { login: 'admin' }
        });

        if (adminUser) {
            console.log('Utilisateur admin trouvé:', {
                id: adminUser.id,
                login: adminUser.login,
                nom: adminUser.nom,
                prenom: adminUser.prenom,
                hasPassword: !!adminUser.password,
                passwordLength: adminUser.password ? adminUser.password.length : 0
            });
        } else {
            console.log('Utilisateur admin non trouvé!');
        }
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 