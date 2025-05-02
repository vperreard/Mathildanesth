import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        console.log('Nombre d\'utilisateurs:', users);

        const specialties = await prisma.specialty.count();
        console.log('Nombre de spécialités:', specialties);

        const surgeons = await prisma.surgeon.count();
        console.log('Nombre de chirurgiens:', surgeons);

        const rooms = await prisma.operatingRoom.count();
        console.log('Nombre de salles d\'opération:', rooms);

        const sectors = await prisma.operatingSector.count();
        console.log('Nombre de secteurs:', sectors);

        const leaveTypes = await prisma.leaveTypeSetting.count();
        console.log('Nombre de types de congés:', leaveTypes);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 