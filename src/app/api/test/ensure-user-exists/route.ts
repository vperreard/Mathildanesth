import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Vérifier si nous sommes en environnement de test
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

/**
 * POST /api/test/ensure-user-exists
 * S'assure qu'un utilisateur de test existe pour les tests E2E
 * Cet endpoint est uniquement disponible en environnement de test
 */
export async function POST(request: NextRequest) {
    // Vérifier l'environnement
    if (!isTestEnv) {
        console.error("Tentative d'accès à un endpoint de test en environnement de production");
        return NextResponse.json({ error: 'Endpoint disponible uniquement en environnement de test' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, email, firstName, lastName, password, role } = body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            // L'utilisateur existe déjà, renvoyer ses informations
            return NextResponse.json({
                message: 'L\'utilisateur existe déjà',
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    firstName: existingUser.prenom,
                    lastName: existingUser.nom
                }
            });
        }

        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                id: id,
                email: email,
                login: email,
                prenom: firstName,
                nom: lastName,
                password: hashedPassword,
                role: role,
                professionalRole: 'MAR' // Valeur par défaut pour les tests
            }
        });

        return NextResponse.json({
            message: 'Utilisateur créé avec succès',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.prenom,
                lastName: newUser.nom
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur lors de la création de l'utilisateur de test:", error);
        return NextResponse.json({
            error: 'Erreur lors de la création de l\'utilisateur de test',
            details: error.message
        }, { status: 500 });
    }
} 