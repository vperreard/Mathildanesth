const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('test123', 10);

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: 'test@mathildanesth.fr' }
        });

        if (existingUser) {
            console.log('L\'utilisateur de test existe déjà, mise à jour du mot de passe...');
            await prisma.user.update({
                where: { email: 'test@mathildanesth.fr' },
                data: { password: hashedPassword }
            });
            console.log('Mot de passe mis à jour avec succès');
        } else {
            // Créer un nouvel utilisateur test
            const user = await prisma.user.create({
                data: {
                    nom: 'Test',
                    prenom: 'User',
                    login: 'testuser',
                    email: 'test@mathildanesth.fr',
                    password: hashedPassword,
                    role: 'ADMIN_TOTAL',
                    professionalRole: 'MAR',
                    actif: true,
                }
            });
            console.log('Utilisateur de test créé avec succès:', user);
        }
    } catch (error) {
        console.error('Erreur lors de la création/mise à jour de l\'utilisateur:', error);

        // Message d'aide pour les énumérations
        if (error.message && error.message.includes('professionalRole')) {
            console.log('\nValeurs possibles pour ProfessionalRole:');
            console.log('MAR, IADE, SECRETAIRE');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main(); 