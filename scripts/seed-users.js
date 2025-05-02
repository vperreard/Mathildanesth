import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcrypt';
import path from 'path';

const prisma = new PrismaClient();
const saltRounds = 10;

// Fonction pour lire et parser un fichier CSV
const parseCsv = (filePath) => {
    try {
        const content = readFileSync(filePath, { encoding: 'utf-8' });
        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
        return [];
    }
};

async function seedUsers() {
    console.log('Importation des utilisateurs...');
    const usersData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/users.csv'));

    console.log(`Nombre d'utilisateurs trouvés dans le CSV: ${usersData.length}`);

    for (const userData of usersData) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { login: userData.login }
            });

            // Conversion des données
            const workPattern = userData.tempsPartiel === 'true' ? 'SPECIFIC_DAYS' : 'FULL_TIME';
            const workOnMonthType = userData.joursTravailles && userData.joursTravailles.toLowerCase().includes('impair') ? 'ODD' :
                userData.joursTravailles && userData.joursTravailles.toLowerCase().includes('pair') ? 'EVEN' : null;

            // Jours travaillés en format JSON
            let joursTravaillesSemainePaire = [];
            let joursTravaillesSemaineImpaire = [];

            if (userData.joursTravailles) {
                // Conversion des jours en format attendu (MONDAY, TUESDAY, etc.)
                const jourMapping = {
                    'lundi': 'MONDAY',
                    'mardi': 'TUESDAY',
                    'mercredi': 'WEDNESDAY',
                    'jeudi': 'THURSDAY',
                    'vendredi': 'FRIDAY',
                    'samedi': 'SATURDAY',
                    'dimanche': 'SUNDAY'
                };

                const jours = userData.joursTravailles.toLowerCase();

                // Si l'utilisateur travaille des jours spécifiques
                if (jours.includes('lundi')) joursTravaillesSemainePaire.push('MONDAY');
                if (jours.includes('mardi')) joursTravaillesSemainePaire.push('TUESDAY');
                if (jours.includes('mercredi')) joursTravaillesSemainePaire.push('WEDNESDAY');
                if (jours.includes('jeudi')) joursTravaillesSemainePaire.push('THURSDAY');
                if (jours.includes('vendredi')) joursTravaillesSemainePaire.push('FRIDAY');

                // Par défaut, les mêmes jours pour semaines paires et impaires
                joursTravaillesSemaineImpaire = [...joursTravaillesSemainePaire];
            }

            const userToCreate = {
                nom: userData.nom,
                prenom: userData.prenom,
                login: userData.login,
                email: userData.email || `${userData.login}@mathildanesth.fr`,
                password: await bcrypt.hash(userData.password || userData.login, saltRounds),
                role: userData.role || 'USER',
                professionalRole: userData.professionalRole || 'MAR',
                actif: userData.actif === 'true',
                mustChangePassword: userData.mustChangePassword === 'true',
                phoneNumber: userData.phoneNumber || null,
                alias: userData.alias || null,
                tempsPartiel: userData.tempsPartiel === 'true',
                pourcentageTempsPartiel: userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null,
                workPattern: workPattern,
                workOnMonthType: workOnMonthType,
                joursTravaillesSemainePaire: joursTravaillesSemainePaire,
                joursTravaillesSemaineImpaire: joursTravaillesSemaineImpaire,
                dateEntree: userData.dateEntree ? new Date(userData.dateEntree) : null,
                dateSortie: userData.dateSortie ? new Date(userData.dateSortie) : null
            };

            if (existingUser) {
                await prisma.user.update({
                    where: { login: userData.login },
                    data: userToCreate
                });
                console.log(`Utilisateur mis à jour: ${userData.prenom} ${userData.nom}`);
            } else {
                await prisma.user.create({
                    data: userToCreate
                });
                console.log(`Utilisateur créé: ${userData.prenom} ${userData.nom}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour de l'utilisateur ${userData.login}:`, error);
            console.error('Détails:', error.message);
        }
    }
}

async function main() {
    try {
        await seedUsers();
        console.log("Importation des utilisateurs terminée");
    } catch (error) {
        console.error("Erreur lors de l'importation des utilisateurs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 