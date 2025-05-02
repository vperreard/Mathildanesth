import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function restoreUsers() {
    const prisma = new PrismaClient();

    try {
        const backupPath = path.join(process.cwd(), 'backup', 'users.json');
        const users = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        // Restaurer les utilisateurs
        for (const user of users) {
            const { lastLogin, ...userData } = user;
            await prisma.user.upsert({
                where: { id: user.id },
                update: userData,
                create: userData
            });
        }

        console.log(`${users.length} utilisateurs restaurés avec succès`);
    } catch (error) {
        console.error('Erreur lors de la restauration des utilisateurs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreUsers(); 