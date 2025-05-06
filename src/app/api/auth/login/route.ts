import { NextRequest, NextResponse } from 'next/server';
import { generateAuthToken, setAuthToken } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    let prisma: PrismaClient | null = null; // Déclarer prisma ici pour le bloc finally
    try {
        const { login, password } = await req.json();

        // Log initial plus détaillé
        console.log(`API LOGIN START: Tentative avec login/email=${login}, password=${password ? '[ fourni ]' : '[ manquant ]'}`);

        if (!login || !password) {
            console.error('API LOGIN ERROR: Login ou mot de passe manquant dans la requête.');
            return NextResponse.json(
                { error: 'Login et mot de passe requis' },
                { status: 400 }
            );
        }

        // Déterminer l'environnement et la bonne URL de base de données
        const isCypressTest = req.headers.get('user-agent')?.includes('Cypress');
        const dbUrl = isCypressTest
            ? process.env.TEST_DATABASE_URL || 'postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test'
            : process.env.DATABASE_URL;

        console.log(`API LOGIN INFO: Mode ${isCypressTest ? 'TEST Cypress' : 'Normal/Production'}`);
        if (!dbUrl) {
            console.error('API LOGIN FATAL: Variable d\'environnement DATABASE_URL (ou TEST_DATABASE_URL pour Cypress) est manquante !');
            return NextResponse.json({ message: 'Erreur de configuration serveur.' }, { status: 500 });
        }
        console.log(`API LOGIN INFO: Utilisation DB URL: ${dbUrl.substring(0, 30)}...`);

        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: dbUrl,
                }
            }
        });

        // Essayez d'abord avec login
        console.log(`API LOGIN DB: Recherche utilisateur avec login=${login}`);
        let user = await prisma.user.findUnique({
            where: { login }
        });

        // Si non trouvé, essayez avec email
        if (!user) {
            console.log(`API LOGIN DB: Utilisateur non trouvé avec login, tentative avec email=${login}`);
            user = await prisma.user.findUnique({
                where: { email: login }
            });
        }

        if (!user) {
            console.warn(`API LOGIN WARN: Utilisateur non trouvé pour login/email=${login}`);
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 } // Erreur 401 standard
            );
        }

        console.log(`API LOGIN DB: Utilisateur trouvé id=${user.id}, login=${user.login}. Vérification mot de passe...`);

        // Vérification explicite que le hash existe
        if (!user.password) {
            console.error(`API LOGIN ERROR: L'utilisateur id=${user.id} n'a pas de hash de mot de passe en base !`);
            return NextResponse.json({ message: 'Erreur interne du compte utilisateur.' }, { status: 500 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`API LOGIN AUTH: Résultat bcrypt.compare: ${isValidPassword}`);

        if (!isValidPassword) {
            console.warn(`API LOGIN WARN: Mot de passe incorrect pour ${user.login} (id=${user.id})`);
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 } // Erreur 401 standard
            );
        }

        console.log(`API LOGIN SUCCESS: Authentification réussie pour ${user.login} (id=${user.id}), génération token...`);

        const token = await generateAuthToken({
            userId: user.id,
            login: user.login, // Utiliser le vrai login pour le token
            role: user.role
        });

        console.log(`API LOGIN SUCCESS: Token généré, définition du cookie httpOnly...`);
        await setAuthToken(token); // Définit le cookie httpOnly

        // Ne PAS renvoyer le token dans la réponse, le cookie suffit
        console.log(`API LOGIN SUCCESS: Connexion terminée pour ${user.login}.`);

        // Exclure le mot de passe de la réponse
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('API LOGIN FATAL ERROR:', error);
        return NextResponse.json(
            { message: 'Erreur serveur lors de la connexion' },
            { status: 500 }
        );
    } finally {
        // S'assurer que la connexion Prisma est fermée
        if (prisma) {
            await prisma.$disconnect();
            console.log("API LOGIN DB: Connexion Prisma fermée.");
        }
    }
} 