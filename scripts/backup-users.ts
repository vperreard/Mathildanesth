import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function backupUsers() {
    const prisma = new PrismaClient();

    try {
        const users = await prisma.user.findMany();
        const backupPath = path.join(process.cwd(), 'backup', 'users.json');

        // Créer le dossier backup s'il n'existe pas
        if (!fs.existsSync(path.join(process.cwd(), 'backup'))) {
            fs.mkdirSync(path.join(process.cwd(), 'backup'));
        }

        // Sauvegarder les utilisateurs
        fs.writeFileSync(backupPath, JSON.stringify(users, null, 2));
        console.log(`Sauvegarde des utilisateurs effectuée dans ${backupPath}`);

        // Afficher le nombre d'utilisateurs sauvegardés
        console.log(`${users.length} utilisateurs sauvegardés`);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backupUsers(); 