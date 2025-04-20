import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('Vérification des données dans la base de données...');

        // Compter les utilisateurs
        const userCount = await prisma.user.count();
        console.log(`Nombre d'utilisateurs dans la base de données: ${userCount}`);

        // Afficher quelques utilisateurs (max 5)
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Exemple d\'utilisateurs:');
        users.forEach(user => {
            console.log(`- ${user.prenom} ${user.nom} (${user.login}, ${user.email})`);
        });

        // Compter les chirurgiens
        const surgeonCount = await prisma.surgeon.count();
        console.log(`Nombre de chirurgiens dans la base de données: ${surgeonCount}`);

        // Afficher quelques chirurgiens (max 5)
        const surgeons = await prisma.surgeon.findMany({ take: 5 });
        console.log('Exemple de chirurgiens:');
        surgeons.forEach(surgeon => {
            console.log(`- ${surgeon.prenom} ${surgeon.nom} (${surgeon.email || 'Pas d\'email'})`);
        });

        // Vérifier les spécialités
        const specialtyCount = await prisma.specialty.count();
        console.log(`Nombre de spécialités dans la base de données: ${specialtyCount}`);

    } catch (error) {
        console.error('Erreur lors de la vérification des données:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Prisma Client déconnecté.');
    }
}

checkData(); 