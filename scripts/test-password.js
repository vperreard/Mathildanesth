import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        const login = 'admin';
        const password = 'admin';

        console.log(`Tentative de vérification pour utilisateur: ${login}, mot de passe: ${password}`);

        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { login }
        });

        if (!user) {
            console.log(`Utilisateur avec login=${login} non trouvé.`);
            return;
        }

        console.log('Utilisateur trouvé:', {
            id: user.id,
            login: user.login,
            passwordHash: user.password.substring(0, 10) + '...' // Afficher seulement le début du hash pour la sécurité
        });

        // Vérifier le mot de passe avec bcrypt
        console.log('Vérification avec bcrypt...');
        const match = await bcrypt.compare(password, user.password);
        console.log(`Vérification bcrypt: ${match ? 'SUCCÈS' : 'ÉCHEC'}`);

        // Tester également avec bcryptjs pour voir si c'est compatible
        console.log('Essayons également avec bcryptjs pour voir si c\'est différent...');
        import('bcryptjs').then(async (bcryptjs) => {
            const matchJs = await bcryptjs.compare(password, user.password);
            console.log(`Vérification bcryptjs: ${matchJs ? 'SUCCÈS' : 'ÉCHEC'}`);
        }).catch(err => {
            console.log('bcryptjs n\'est pas installé ou erreur:', err);
        });

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 