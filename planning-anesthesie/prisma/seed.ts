import { PrismaClient } from '../src/generated/prisma';
import { UserType, AccessLevel } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    // Suppression des données existantes (pour éviter les doublons)
    await prisma.notification.deleteMany();
    await prisma.affectation.deleteMany();
    await prisma.leave.deleteMany();
    await prisma.counter.deleteMany();
    await prisma.frame.deleteMany();
    await prisma.room.deleteMany();
    await prisma.surgeon.deleteMany();
    await prisma.user.deleteMany();

    console.log('Données supprimées...');

    // Création des utilisateurs
    const users = [
        {
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@hopital.fr',
            motDePasse: 'password123', // À hasher dans un environnement de production
            type: 'MAR' as UserType,
            niveauAcces: 'Utilisateur' as AccessLevel,
            configurationTravail: { tempsPlein: true, joursAlternance: 'aucun' },
            droitsConges: 50,
            specialites: ['Cardiaque', 'Vasculaire', 'Orthopédique']
        },
        {
            nom: 'Martin',
            prenom: 'Sophie',
            email: 'sophie.martin@hopital.fr',
            motDePasse: 'password123',
            type: 'MAR' as UserType,
            niveauAcces: 'AdminPartiel' as AccessLevel,
            configurationTravail: { tempsPlein: true, joursAlternance: 'aucun' },
            droitsConges: 50,
            specialites: ['Pédiatrique', 'Neurologique', 'ORL']
        },
        {
            nom: 'Leroy',
            prenom: 'Michel',
            email: 'michel.leroy@hopital.fr',
            motDePasse: 'password123',
            type: 'IADE' as UserType,
            niveauAcces: 'Utilisateur' as AccessLevel,
            configurationTravail: { tempsPlein: true, heuresTravail: 39 },
            droitsConges: 30,
            specialites: ['Général', 'Urgences']
        },
        {
            nom: 'Moreau',
            prenom: 'Émilie',
            email: 'emilie.moreau@hopital.fr',
            motDePasse: 'password123',
            type: 'Admin' as UserType,
            niveauAcces: 'AdminComplet' as AccessLevel,
            configurationTravail: { tempsPlein: true },
            droitsConges: 25,
            specialites: []
        }
    ];

    for (const user of users) {
        await prisma.user.create({
            data: {
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                motDePasse: user.motDePasse,
                type: user.type,
                niveauAcces: user.niveauAcces,
                configurationTravail: user.configurationTravail,
                droitsConges: user.droitsConges,
                specialites: user.specialites
            }
        });
    }

    console.log('Utilisateurs créés...');

    // Création des chirurgiens
    const surgeons = [
        {
            nom: 'Bernard',
            prenom: 'Philippe',
            specialites: ['Cardiaque', 'Thoracique'],
            actif: true,
            reglesSpecifiques: { equipeFixe: true, materiels: ['Valve spéciale'] }
        },
        {
            nom: 'Petit',
            prenom: 'Anne',
            specialites: ['Orthopédique', 'Traumatologique'],
            actif: true,
            reglesSpecifiques: {}
        },
        {
            nom: 'Durand',
            prenom: 'Patrick',
            specialites: ['Neurochirurgie'],
            actif: true,
            reglesSpecifiques: { equipementSpecifique: true }
        }
    ];

    for (const surgeon of surgeons) {
        await prisma.surgeon.create({
            data: {
                nom: surgeon.nom,
                prenom: surgeon.prenom,
                specialites: surgeon.specialites,
                actif: surgeon.actif,
                reglesSpecifiques: surgeon.reglesSpecifiques
            }
        });
    }

    console.log('Chirurgiens créés...');

    // Création des salles
    const rooms = [
        {
            nom: 'Salle 1',
            numero: 1,
            type: 'Chirurgie',
            secteur: 'Hyperaseptique',
            codeCouleur: '#3498db',
            reglesSupervision: { maxSalles: 2, secteurSupervision: ['1', '2', '3', '4'] }
        },
        {
            nom: 'Salle 5',
            numero: 5,
            type: 'Chirurgie',
            secteur: '5-8',
            codeCouleur: '#2ecc71',
            reglesSupervision: { maxSalles: 2, secteurSupervision: ['5', '6', '7', '8'] }
        },
        {
            nom: 'Salle 9',
            numero: 9,
            type: 'Chirurgie',
            secteur: '9-12B',
            codeCouleur: '#e67e22',
            reglesSupervision: { maxSalles: 2, secteurSupervision: ['9', '10', '11', '12', '12bis'] }
        },
        {
            nom: 'Ophtalmo 1',
            numero: 1,
            type: 'Ophtalmo',
            secteur: 'Ophtalmo',
            codeCouleur: '#9b59b6',
            reglesSupervision: { maxSalles: 3, secteurSupervision: ['Ophtalmo'] }
        }
    ];

    for (const room of rooms) {
        await prisma.room.create({
            data: {
                nom: room.nom,
                numero: room.numero,
                type: room.type,
                secteur: room.secteur,
                codeCouleur: room.codeCouleur,
                reglesSupervision: room.reglesSupervision
            }
        });
    }

    console.log('Salles créées...');

    console.log('Seeding terminé !');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 