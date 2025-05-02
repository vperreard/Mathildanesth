import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

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

async function seedSurgeons() {
    console.log('Importation des chirurgiens...');
    const surgeonsData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/surgeons.csv'));

    for (const surgeonData of surgeonsData) {
        try {
            const existingSurgeon = await prisma.surgeon.findFirst({
                where: {
                    nom: surgeonData.nom,
                    prenom: surgeonData.prenom
                }
            });

            const specialtyNames = surgeonData.specialtyNames?.split(';').filter(Boolean) || [];

            // Récupérer les IDs des spécialités
            const specialties = [];
            for (const name of specialtyNames) {
                const specialty = await prisma.specialty.findFirst({
                    where: { name: { contains: name, mode: 'insensitive' } }
                });

                if (specialty) {
                    specialties.push({ id: specialty.id });
                } else {
                    // Créer la spécialité si elle n'existe pas
                    const newSpecialty = await prisma.specialty.create({
                        data: {
                            name: name,
                            isPediatric: name.toLowerCase().includes('pédiatrique') || name.toLowerCase().includes('pediatrique')
                        }
                    });
                    specialties.push({ id: newSpecialty.id });
                }
            }

            const surgeonToUpsert = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                email: surgeonData.email || null,
                phoneNumber: surgeonData.phoneNumber || null,
                googleSheetName: surgeonData.googleSheetName || surgeonData.nom,
                status: 'ACTIF', // Défaut à ACTIF selon l'enum UserStatus
                specialties: {
                    connect: specialties
                }
            };

            if (existingSurgeon) {
                // Mise à jour du chirurgien existant
                await prisma.surgeon.update({
                    where: { id: existingSurgeon.id },
                    data: {
                        ...surgeonToUpsert,
                        specialties: {
                            set: [], // Déconnecter toutes les spécialités existantes
                            connect: specialties // Connecter les nouvelles spécialités
                        }
                    }
                });
                console.log(`Chirurgien mis à jour: ${surgeonData.prenom} ${surgeonData.nom}`);
            } else {
                // Création d'un nouveau chirurgien
                await prisma.surgeon.create({
                    data: surgeonToUpsert
                });
                console.log(`Chirurgien créé: ${surgeonData.prenom} ${surgeonData.nom}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour du chirurgien ${surgeonData.prenom} ${surgeonData.nom}:`, error);
        }
    }
}

async function main() {
    try {
        await seedSurgeons();
        console.log("Importation des chirurgiens terminée");
    } catch (error) {
        console.error("Erreur lors de l'importation des chirurgiens:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 