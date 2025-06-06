import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Début de la création de l'utilisateur admin...");

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash('admin', 10);

        // Création de l'utilisateur admin
        const admin = await prisma.user.create({
            data: {
                nom: 'Admin',
                prenom: 'System',
                login: 'admin',
                email: 'admin@mathildanesth.fr',
                password: hashedPassword,
                role: 'ADMIN_TOTAL',
                professionalRole: 'MAR',
            },
        });

        console.log(`Utilisateur admin créé avec succès: ${admin.id}`);
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur admin:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 